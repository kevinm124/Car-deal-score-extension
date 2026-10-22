// src/content/results.js – score badges on avto.net search results, plus a small toolbar
// to sort by score. Every visible listing is also remembered as a price comparable.
(() => {
  const { esc, eur, pct } = CDS.util;
  const ROW = '.GO-Results-Row';
  let settings, saved = {}, scored = [], bar;

  async function init() {
    settings = await CDS.store.settings();
    if (!settings.enabled || !settings.resultsBadges) return;
    await CDS.data.load();
    injectStyles();
    await processRows();
    new MutationObserver(debounce(processRows, 300)).observe(document.body, { childList: true, subtree: true });
  }

  async function processRows() {
    const rows = [...document.querySelectorAll(ROW)].filter(r => !r.dataset.cdsDone);
    if (!rows.length) return;
    rows.forEach(r => { r.dataset.cdsDone = '1'; });
    const cars = rows.map(r => ({ row: r, car: CDS.parser.parseResultRow(r) })).filter(x => x.car && x.car.id);
    if (settings.learnPrices) await CDS.store.learn(cars.map(x => x.car));
    saved = await CDS.store.watchlist();

    const compsCache = {};
    for (const { row, car } of cars) {
      if (!car.price || car.sold) continue;
      const key = CDS.data.modelKey(car.make, car.model);
      if (key && !compsCache[key]) compsCache[key] = await CDS.store.compsFor(key);
      const result = CDS.scoring.quick(car, { comps: compsCache[key] || [], profile: settings.profile });
      let change = null;
      if (saved[car.id]) change = (await CDS.store.trackPrice(car.id, car.price))?.item;
      badge(row, car, result, change);
      scored.push({ row, car, result });
    }
    toolbar();
  }

  function badge(row, car, r, savedItem) {
    const m = r.market;
    const top = r.issues.find(i => i.status === 'likely' && i.sev === 3);
    const first = savedItem?.priceHistory?.[0]?.price;
    const drop = first && first !== car.price ? car.price - first : 0;
    const el = document.createElement('div');
    el.className = `cds-badge cds-${r.verdict.tone}`;
    el.innerHTML = `
      <span class="cds-score">${r.score}</span>
      ${m.estimate && m.delta !== null ? `<span class="cds-delta ${m.delta < 0 ? 'cds-down' : 'cds-up'}">${pct(m.delta)}</span>` : ''}
      ${savedItem ? '<span class="cds-star">★</span>' : ''}
      ${drop ? `<span class="cds-drop ${drop < 0 ? 'cds-down' : 'cds-up'}">${drop < 0 ? '↓' : '↑'}${eur(Math.abs(drop))}</span>` : ''}
      <div class="cds-tip">
        <b>${esc(r.verdict.label)} · ${r.score}/100</b>
        ${m.estimate ? `<div>Est. market ${eur(m.estimate)} <i>(${m.confidence})</i></div>` : '<div>No market estimate yet</div>'}
        ${r.details.kmPerYear ? `<div>${CDS.util.num(r.details.kmPerYear)} km/year</div>` : ''}
        ${top ? `<div class="cds-warn">⚠ ${esc(top.title)}</div>` : ''}
        <div class="cds-cats">${r.categories.map(c => `<span>${esc(c.label.split(' ')[0])} <b>${c.score}</b></span>`).join('')}</div>
        <div class="cds-hint">Open the listing for the full report</div>
      </div>`;
    const host = row.querySelector('.GO-Results-Photo, .GO-Results-Top-Photo') || row;
    host.style.position = 'relative';
    host.appendChild(el);
    row.classList.toggle('cds-dim', settings.dimBelow > 0 && r.score < settings.dimBelow);
  }

  function toolbar() {
    if (!scored.length) return;
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'cds-bar';
      document.body.appendChild(bar);
      bar.addEventListener('click', onBarClick);
    }
    const scores = scored.map(s => s.result.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = scored.reduce((a, b) => (b.result.score > a.result.score ? b : a));
    bar.innerHTML = `
      <span class="cds-logo">D</span>
      <span><b>${scored.length}</b> scored · avg <b>${avg}</b></span>
      <button data-cds="best" title="${esc(best.car.title)}">Best: ${best.result.score}</button>
      <button data-cds="sort">Sort by score</button>
      <button data-cds="dim">${settings.dimBelow ? `Show all` : 'Hide < 60'}</button>
      <button data-cds="close" title="Hide toolbar">×</button>`;
  }

  async function onBarClick(e) {
    const act = e.target.closest('[data-cds]')?.dataset.cds;
    if (act === 'sort') {
      const sorted = [...scored].sort((a, b) => b.result.score - a.result.score);
      const parent = sorted[0].row.parentElement;
      // Rows can share a parent with ads/banners; only reorder rows that live together.
      sorted.filter(s => s.row.parentElement === parent).forEach(s => parent.appendChild(s.row));
      window.scrollTo({ top: parent.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' });
    } else if (act === 'best') {
      const best = scored.reduce((a, b) => (b.result.score > a.result.score ? b : a));
      best.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      best.row.classList.add('cds-flash');
      setTimeout(() => best.row.classList.remove('cds-flash'), 1600);
    } else if (act === 'dim') {
      settings = await CDS.store.saveSettings({ dimBelow: settings.dimBelow ? 0 : 60 });
      scored.forEach(s => s.row.classList.toggle('cds-dim', settings.dimBelow > 0 && s.result.score < settings.dimBelow));
      toolbar();
    } else if (act === 'close') {
      bar.remove();
      bar = null;
    }
  }

  function injectStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/ui/results.css');
    document.head.appendChild(link);
  }

  function debounce(fn, ms) {
    let t;
    return () => { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  init().catch(err => console.error('[DealScore]', err));
})();
