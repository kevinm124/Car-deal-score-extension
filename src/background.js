// src/background.js – toolbar badge per tab, keyboard command, settings page and the
// AutoScout24 EU-market lookup (done here so the request is not blocked by page CORS).
importScripts('lib/util.js', 'lib/data.js', 'lib/eu.js');

const TONE_COLORS = { great: '#16a34a', good: '#65a30d', fair: '#ca8a04', caution: '#ea580c', risky: '#dc2626' };
const CACHE_MS = 12 * 3600 * 1000;
const CACHE_MAX = 150;
const MIN_LISTINGS = 5;

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg?.type === 'score' && sender.tab?.id !== undefined) {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: String(msg.score) });
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: TONE_COLORS[msg.tone] || '#6c8cff' });
  }
  if (msg?.type === 'openOptions') chrome.runtime.openOptionsPage();
  if (msg?.type === 'euMarket') {
    euLookup(msg.queries).then(reply, err => reply({ error: String(err?.message || err) }));
    return true;   // async reply
  }
});

async function fetchPage(url) {
  const { euCache = {} } = await chrome.storage.local.get('euCache');
  const hit = euCache[url];
  if (hit && Date.now() - hit.t < CACHE_MS) return hit.data;
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`AutoScout24 ${res.status}`);
  const data = CDS.eu.parsePage(await res.text()) || { total: 0, listings: [] };
  euCache[url] = { t: Date.now(), data };
  const keys = Object.keys(euCache);
  if (keys.length > CACHE_MAX) keys.sort((a, b) => euCache[a].t - euCache[b].t).slice(0, keys.length - CACHE_MAX).forEach(k => delete euCache[k]);
  await chrome.storage.local.set({ euCache });
  return data;
}

// Tries each model slug from strict to relaxed filters until enough truly comparable
// listings are found. Searches where AutoScout24 didn't recognise the model are skipped
// (it would otherwise return every car of the make), and each listing is re-checked for
// engine size and gearbox because the relaxed searches drop those filters.
async function euLookup(queries) {
  let best = null;
  for (const q of queries || []) {
    for (const [level, url] of q.urls.entries()) {
      const page = await fetchPage(url);
      if (page.modelRecognised === false) break;   // wrong slug – try the next one
      let listings = page.listings.filter(l => CDS.eu.comparable(l, q.match));
      if (listings.length < MIN_LISTINGS && page.total > page.listings.length) {
        const second = await fetchPage(`${url}&page=2`).catch(() => null);
        if (second) listings = listings.concat(second.listings.filter(l => CDS.eu.comparable(l, q.match)));
      }
      const result = { total: page.total, listings, url, level, countries: [...new Set(listings.map(l => l.country).filter(Boolean))] };
      if (!best || listings.length > best.listings.length) best = result;
      if (listings.length >= MIN_LISTINGS) {
        if (page.total > page.listings.length && listings.length < 30) {
          const second = await fetchPage(`${url}&page=2`).catch(() => null);
          if (second) {
            const more = second.listings.filter(l => CDS.eu.comparable(l, q.match) && !listings.some(x => x.id === l.id));
            result.listings = listings.concat(more);
            result.countries = [...new Set(result.listings.map(l => l.country).filter(Boolean))];
          }
        }
        return result;
      }
    }
  }
  return best || { total: 0, listings: [], url: null };
}

chrome.commands.onCommand.addListener(async command => {
  if (command !== 'toggle-panel') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'togglePanel' }).catch(() => {});
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/popup.html?page=welcome') });
});
