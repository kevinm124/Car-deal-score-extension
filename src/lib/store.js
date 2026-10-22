// src/lib/store.js – everything persisted in chrome.storage.
//   sync : settings (small, follows the user across browsers)
//   local: watchlist, learned comparables, recently viewed, checklist ticks
CDS.store = (() => {
  const DEFAULTS = {
    enabled: true,
    resultsBadges: true,
    autoOpen: true,              // open the panel automatically on detail pages
    theme: 'auto',               // auto | dark | light
    position: 'right',           // right | left
    profile: 'balanced',
    dimBelow: 0,                 // dim result rows scoring below this (0 = off)
    learnPrices: true,           // remember prices seen on results pages
    euCompare: true,             // compare with EU listings on AutoScout24
    kmPerYear: 15000,
    petrolPrice: 1.45,
    dieselPrice: 1.50,
    lpgPrice: 0.85,
    kwhPrice: 0.25
  };

  const COMPS_MAX = 6000;
  const HISTORY_MAX = 60;

  const hasChrome = typeof chrome !== 'undefined' && chrome.storage;
  const get = (area, keys) => hasChrome ? chrome.storage[area].get(keys) : Promise.resolve({});
  const set = (area, obj) => hasChrome ? chrome.storage[area].set(obj) : Promise.resolve();

  async function settings() {
    const s = await get('sync', 'settings');
    return { ...DEFAULTS, ...(s.settings || {}) };
  }
  async function saveSettings(patch) {
    const next = { ...(await settings()), ...patch };
    await set('sync', { settings: next });
    return next;
  }

  // ---- Watchlist: { [id]: { ...car snapshot, score, verdict, priceHistory: [{t, price}] } }
  async function watchlist() { return (await get('local', 'watchlist')).watchlist || {}; }
  async function isSaved(id) { return !!(await watchlist())[id]; }
  async function saveListing(car, result) {
    const list = await watchlist();
    const prev = list[car.id];
    const history = prev?.priceHistory || [];
    if (car.price && (!history.length || history[history.length - 1].price !== car.price)) history.push({ t: Date.now(), price: car.price });
    list[car.id] = {
      id: car.id, url: car.url, title: car.title, make: car.make, model: car.model, variant: car.variant,
      year: car.year, mileage: car.mileage, owners: car.owners, fuel: car.fuel, gearbox: car.gearbox,
      powerKw: car.powerKw, price: car.price, image: car.image, location: car.location, sellerType: car.sellerType,
      score: result.score, verdict: result.verdict, estimate: result.market.estimate,
      categories: result.categories.map(c => ({ id: c.id, label: c.label, score: c.score })),
      issues: result.issues.filter(i => i.status === 'likely').map(i => i.title).slice(0, 5),
      note: prev?.note || '',
      savedAt: prev?.savedAt || Date.now(),
      updatedAt: Date.now(),
      priceHistory: history
    };
    await set('local', { watchlist: list });
    return list[car.id];
  }
  async function removeListing(id) {
    const list = await watchlist();
    delete list[id];
    await set('local', { watchlist: list });
  }
  async function updateListing(id, patch) {
    const list = await watchlist();
    if (!list[id]) return;
    Object.assign(list[id], patch);
    await set('local', { watchlist: list });
  }
  // Called on every visit/results view of a saved car: records price changes.
  async function trackPrice(id, price, extra = {}) {
    if (!id || !price) return null;
    const list = await watchlist();
    const item = list[id];
    if (!item) return null;
    const last = item.priceHistory[item.priceHistory.length - 1];
    let changed = null;
    if (!last || last.price !== price) {
      item.priceHistory.push({ t: Date.now(), price });
      changed = last ? price - last.price : null;
    }
    Object.assign(item, { price, updatedAt: Date.now() }, extra);
    await set('local', { watchlist: list });
    return { item, changed };
  }

  // ---- Learned comparables: { [modelKey]: { [id]: [year, km, price, t] } }
  async function comps() { return (await get('local', 'comps')).comps || {}; }
  async function compsFor(key) {
    const all = await comps();
    return Object.entries(all[key] || {}).map(([id, [year, mileage, price, t]]) => ({ id, year, mileage, price, t }));
  }
  async function learn(cars) {
    const all = await comps();
    let added = 0;
    for (const c of cars) {
      const key = CDS.data.modelKey(c.make, c.model);
      if (!key || !c.id || !c.price || !c.year || c.sold) continue;
      all[key] = all[key] || {};
      if (!all[key][c.id]) added++;
      all[key][c.id] = [c.year, c.mileage || 0, c.price, Date.now()];
    }
    // Keep storage bounded: drop the oldest observations.
    const flat = Object.entries(all).flatMap(([k, v]) => Object.entries(v).map(([id, r]) => [k, id, r[3]]));
    if (flat.length > COMPS_MAX) {
      flat.sort((a, b) => a[2] - b[2]).slice(0, flat.length - COMPS_MAX).forEach(([k, id]) => { delete all[k][id]; });
    }
    await set('local', { comps: all });
    return added;
  }
  async function compsStats() {
    const all = await comps();
    const models = Object.keys(all).length;
    const listings = Object.values(all).reduce((a, v) => a + Object.keys(v).length, 0);
    return { models, listings };
  }
  async function clearComps() { await set('local', { comps: {} }); }

  // ---- Recently viewed
  async function history() { return (await get('local', 'history')).history || []; }
  async function addHistory(car, result) {
    const list = (await history()).filter(h => h.id !== car.id);
    list.unshift({ id: car.id, url: car.url, title: car.title, price: car.price, year: car.year, mileage: car.mileage, image: car.image, score: result.score, verdict: result.verdict, t: Date.now() });
    await set('local', { history: list.slice(0, HISTORY_MAX) });
  }
  async function clearHistory() { await set('local', { history: [] }); }

  // ---- Checklist ticks: { [listingId]: [itemId, ...] }
  async function checks(id) { return ((await get('local', 'checks')).checks || {})[id] || []; }
  async function setChecks(id, ids) {
    const all = (await get('local', 'checks')).checks || {};
    all[id] = ids;
    await set('local', { checks: all });
  }

  async function exportAll() {
    return { version: 1, exportedAt: new Date().toISOString(), settings: await settings(), watchlist: await watchlist(), history: await history() };
  }
  async function importAll(data) {
    if (data.settings) await set('sync', { settings: { ...DEFAULTS, ...data.settings } });
    if (data.watchlist) await set('local', { watchlist: { ...(await watchlist()), ...data.watchlist } });
  }

  return {
    DEFAULTS, settings, saveSettings,
    watchlist, isSaved, saveListing, removeListing, updateListing, trackPrice,
    comps, compsFor, learn, compsStats, clearComps,
    history, addHistory, clearHistory,
    checks, setChecks, exportAll, importAll
  };
})();
