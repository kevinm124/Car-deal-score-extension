// src/popup/popup.js – watchlist, side-by-side compare, recently viewed and settings.
// Also used as the options page and the welcome page (opened in a full tab).
(() => {
  const { esc, eur, km, timeAgo } = CDS.util;
  const S = CDS.store;
  const params = new URLSearchParams(location.search);
  const inTab = !chrome.extension?.getViews?.({ type: 'popup' })?.includes(window);
  const main = document.getElementById('main');
  let page = params.get('page') || (inTab ? 'settings' : 'saved');
  let settings;
  let picked = new Set();
  let sortBy = 'savedAt';
  let filter = '';

  const PROFILES = {
    balanced: 'Balanced', bargain: 'Bargain hunter', reliable: 'Reliability first', resale: 'Resale value'
  };

  async function init() {
    if (inTab) document.body.classList.add('page');
    settings = await S.settings();
    applyTheme();
    document.getElementById('enabled').checked = settings.enabled;
    document.getElementById('enabled').addEventListener('change', async e => {
      settings = await S.saveSettings({ enabled: e.target.checked });
    });
    document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
    const stats = await S.compsStats();
    document.getElementById('stats').textContent = stats.listings
      ? `Learned ${CDS.util.num(stats.listings)} price${stats.listings === 1 ? '' : 's'} · ${stats.models} models`
      : 'avto.net deal analyzer';
    go(page);
  }

  function applyTheme() {
    if (settings.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', settings.theme);
  }

  async function go(p) {
    page = p;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.page === p));
    const list = Object.values(await S.watchlist());
    document.getElementById('saved-count').textContent = list.length || '';
    if (p === 'saved') return renderSaved(list);
    if (p === 'compare') return renderCompare(list);
    if (p === 'recent') return renderRecent();
    if (p === 'welcome') return renderWelcome();
    return renderSettings();
  }

  const thumb = src => (src ? `<img src="${esc(src)}" alt="" loading="lazy">` : '<div class="noimg">🚗</div>');

  // ---------- saved ----------
  function spark(history) {
    if (!history || history.length < 2) return '';
    const prices = history.map(h => h.price);
    const min = Math.min(...prices), max = Math.max(...prices);
    const w = 60, h = 16;
    const pts = prices.map((p, i) => `${(i / (prices.length - 1)) * w},${max === min ? h / 2 : h - ((p - min) / (max - min)) * h}`).join(' ');
    const color = prices[prices.length - 1] < prices[0] ? 'var(--great)' : 'var(--risky)';
    return `<svg class="spark" width="${w}" height="${h}" viewBox="-1 -1 ${w + 2} ${h + 2}"><polyline fill="none" stroke="${color}" stroke-width="1.6" points="${pts}"/></svg>`;
  }

  function renderSaved(list) {
    if (!list.length) {
      main.innerHTML = `<div class="empty"><div class="big">☆</div>
        <b>No saved cars yet</b><p>Open a listing on <a href="https://www.avto.net/" target="_blank">avto.net</a> and press ☆ in the DealScore panel.
        Saved cars get price-drop tracking and can be compared side by side.</p></div>`;
      return;
    }
    const sorters = {
      savedAt: (a, b) => b.savedAt - a.savedAt,
      score: (a, b) => b.score - a.score,
      price: (a, b) => a.price - b.price,
      drop: (a, b) => (a.price - a.priceHistory[0].price) - (b.price - b.priceHistory[0].price)
    };
    const shown = list
      .filter(c => !filter || `${c.title} ${c.note}`.toLowerCase().includes(filter.toLowerCase()))
      .sort(sorters[sortBy]);
    main.innerHTML = `
      <div class="toolbar">
        <input id="filter" placeholder="Filter saved cars…" value="${esc(filter)}">
        <select id="sort">
          <option value="savedAt">Newest</option><option value="score">Best score</option>
          <option value="price">Cheapest</option><option value="drop">Biggest drop</option>
        </select>
      </div>
      ${picked.size ? `<div class="toolbar"><span class="sub">${picked.size} selected</span><div class="spacer"></div><button class="btn primary" id="go-compare">Compare ${picked.size}</button></div>` : ''}
      ${shown.map(card).join('')}
      <p class="sub">Tick up to 3 cars to compare them. Prices update whenever you revisit a listing or its search results.</p>`;
    main.querySelector('#sort').value = sortBy;
    main.querySelector('#sort').addEventListener('change', e => { sortBy = e.target.value; renderSaved(list); });
    main.querySelector('#filter').addEventListener('input', e => {
      filter = e.target.value;
      const pos = e.target.selectionStart;
      renderSaved(list);
      const f = main.querySelector('#filter'); f.focus(); f.setSelectionRange(pos, pos);
    });
    main.querySelector('#go-compare')?.addEventListener('click', () => go('compare'));
    main.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', async () => {
      await S.removeListing(b.dataset.remove);
      picked.delete(b.dataset.remove);
      go('saved');
    }));
    main.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('change', () => {
      if (b.checked && picked.size >= 3) { b.checked = false; return; }
      b.checked ? picked.add(b.dataset.pick) : picked.delete(b.dataset.pick);
      renderSaved(list);
    }));
    main.querySelectorAll('[data-note]').forEach(i => i.addEventListener('change', () => S.updateListing(i.dataset.note, { note: i.value })));
  }

  function card(c) {
    const first = c.priceHistory?.[0]?.price;
    const diff = first && c.price !== first ? c.price - first : 0;
    return `<div class="card">
      ${thumb(c.image)}
      <div style="min-width:0">
        <div class="t"><a href="${esc(c.url)}" target="_blank" title="${esc(c.title)}">${esc(c.title)}</a></div>
        <div class="m">${c.year || '?'} · ${km(c.mileage)} · ${esc(c.fuel || '')}${c.location ? ` · ${esc(c.location.split(',').pop().trim())}` : ''}</div>
        <div><span class="p">${eur(c.price)}</span>${diff ? `<span class="chg ${diff < 0 ? 'down' : 'up'}">${diff < 0 ? '↓' : '↑'} ${eur(Math.abs(diff))}</span>` : ''} ${spark(c.priceHistory)}</div>
        <div class="m">Saved ${timeAgo(c.savedAt)}${c.estimate ? ` · est. ${eur(c.estimate)}` : ''}</div>
      </div>
      <div class="side">
        <div class="score tone-${c.verdict?.tone || 'fair'}" title="${esc(c.verdict?.label || '')}">${c.score}</div>
        <div><input type="checkbox" class="pick" data-pick="${c.id}" ${picked.has(c.id) ? 'checked' : ''} title="Select to compare"><button class="mini" data-remove="${c.id}" title="Remove">✕</button></div>
      </div>
      <input class="note-input" data-note="${c.id}" placeholder="Add a note (seller said…, viewing on…)" value="${esc(c.note || '')}">
    </div>`;
  }

  // ---------- compare ----------
  function renderCompare(list) {
    let cars = list.filter(c => picked.has(c.id));
    if (cars.length < 2) cars = [...list].sort((a, b) => b.score - a.score).slice(0, 3);
    if (cars.length < 2) {
      main.innerHTML = `<div class="empty"><div class="big">⇄</div><b>Save at least two cars</b><p>Then pick them in the Saved tab to compare side by side.</p></div>`;
      return;
    }
    const best = (vals, dir) => {
      const nums = vals.map(v => (typeof v === 'number' ? v : null));
      const valid = nums.filter(v => v !== null);
      if (valid.length < 2) return [];
      const target = dir === 'max' ? Math.max(...valid) : Math.min(...valid);
      // Highlight only when the cars actually differ; ties all share the highlight.
      return valid.every(v => v === target) ? [] : nums.map((v, i) => (v === target ? i : -1)).filter(i => i >= 0);
    };
    const row = (label, values, fmt = v => v ?? '–', dir) => {
      const b = dir ? best(values, dir) : [];
      return `<tr><th>${label}</th>${values.map((v, i) => `<td class="${b.includes(i) ? 'best' : ''}">${fmt(v)}</td>`).join('')}</tr>`;
    };
    const catIds = cars[0].categories?.map(c => c.id) || [];
    main.innerHTML = `
      <p class="sub">${picked.size >= 2 ? 'Your selection' : 'Your top-scoring saved cars'} · best value per row in green</p>
      <table class="cmp">
        <thead><tr><th></th>${cars.map(c => `<td>${c.image ? `<img src="${esc(c.image)}" alt="">` : ''}<a href="${esc(c.url)}" target="_blank" style="color:inherit">${esc(c.title)}</a></td>`).join('')}</tr></thead>
        <tbody>
          ${row('DealScore', cars.map(c => c.score), v => `<b>${v}</b>`, 'max')}
          ${row('Price', cars.map(c => c.price), eur, 'min')}
          ${row('vs market', cars.map(c => (c.estimate ? (c.price - c.estimate) / c.estimate : null)), v => (v === null ? '–' : CDS.util.pct(v)), 'min')}
          ${row('Year', cars.map(c => c.year), v => v ?? '–', 'max')}
          ${row('Mileage', cars.map(c => c.mileage), km, 'min')}
          ${row('Owners', cars.map(c => c.owners), v => v ?? '?', 'min')}
          ${row('Power', cars.map(c => c.powerKw), v => (v ? `${v} kW` : '–'), 'max')}
          ${row('Fuel', cars.map(c => c.fuel))}
          ${row('Gearbox', cars.map(c => c.gearbox))}
          ${catIds.map(id => row(cars[0].categories.find(c => c.id === id).label, cars.map(c => c.categories?.find(x => x.id === id)?.score), v => v ?? '–', 'max')).join('')}
          ${row('Known issues', cars.map(c => c.issues), v => (v?.length ? v.map(esc).join('<br>') : '<span class="down">None matched</span>'))}
        </tbody>
      </table>`;
  }

  // ---------- recent ----------
  async function renderRecent() {
    const hist = await S.history();
    if (!hist.length) {
      main.innerHTML = `<div class="empty"><div class="big">◷</div><b>Nothing viewed yet</b><p>Listings you open on avto.net appear here with their score.</p></div>`;
      return;
    }
    main.innerHTML = `${hist.map(h => `<div class="card">
        ${thumb(h.image)}
        <div style="min-width:0"><div class="t"><a href="${esc(h.url)}" target="_blank" title="${esc(h.title)}">${esc(h.title)}</a></div>
          <div class="m">${h.year || '?'} · ${km(h.mileage)}</div><div class="p">${eur(h.price)}</div><div class="m">${timeAgo(h.t)}</div></div>
        <div class="side"><div class="score tone-${h.verdict?.tone || 'fair'}">${h.score}</div></div>
      </div>`).join('')}
      <button class="btn danger" id="clear-hist">Clear history</button>`;
    main.querySelector('#clear-hist').addEventListener('click', async () => { await S.clearHistory(); renderRecent(); });
  }

  // ---------- settings ----------
  async function renderSettings() {
    const stats = await S.compsStats();
    const seg = (key, opts) => `<div class="seg" data-seg="${key}">${opts.map(([v, l]) => `<button data-v="${v}" class="${settings[key] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const toggle = key => `<label class="switch"><input type="checkbox" data-bool="${key}" ${settings[key] ? 'checked' : ''}><span></span></label>`;
    const num = (key, step) => `<input type="number" step="${step}" data-num="${key}" value="${settings[key]}">`;
    main.innerHTML = `
      <div class="group"><h3>Appearance</h3>
        <div class="set"><div>Theme</div>${seg('theme', [['auto', 'Auto'], ['dark', 'Dark'], ['light', 'Light']])}</div>
        <div class="set"><div>Panel position</div>${seg('position', [['left', 'Left'], ['right', 'Right']])}</div>
        <div class="set"><div>Open panel automatically<small>Otherwise it starts minimised (Alt+Shift+D toggles)</small></div>${toggle('autoOpen')}</div>
      </div>
      <div class="group"><h3>Scoring</h3>
        <div class="set"><div>Profile<small>Changes how much each category counts</small></div>
          <select data-select="profile">${Object.entries(PROFILES).map(([v, l]) => `<option value="${v}" ${settings.profile === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="set"><div>Badges on search results</div>${toggle('resultsBadges')}</div>
        <div class="set"><div>Compare with EU market<small>Looks up similar cars on AutoScout24 (DE, AT, IT, FR, NL, BE, ES, LU). Only make, model, year, km, fuel, gearbox and power are sent.</small></div>${toggle('euCompare')}</div>
        <div class="set"><div>Learn prices while browsing<small>${CDS.util.num(stats.listings)} listings across ${stats.models} models remembered (only on this computer)</small></div>${toggle('learnPrices')}</div>
      </div>
      <div class="group"><h3>Running-cost assumptions</h3>
        <div class="set"><div>Kilometres per year</div>${num('kmPerYear', 1000)}</div>
        <div class="set"><div>Petrol €/l</div>${num('petrolPrice', 0.01)}</div>
        <div class="set"><div>Diesel €/l</div>${num('dieselPrice', 0.01)}</div>
        <div class="set"><div>LPG €/l</div>${num('lpgPrice', 0.01)}</div>
        <div class="set"><div>Electricity €/kWh</div>${num('kwhPrice', 0.01)}</div>
      </div>
      <div class="group"><h3>Data</h3>
        <div class="set"><div>Backup<small>Settings and watchlist as JSON</small></div>
          <div><button class="btn" id="export">Export</button> <button class="btn" id="import">Import</button><input type="file" id="import-file" accept="application/json" hidden></div></div>
        <div class="set"><div>Learned prices</div><button class="btn danger" id="clear-comps">Clear</button></div>
      </div>
      <p class="sub">DealScore runs entirely in your browser. Nothing is sent anywhere. Scores are estimates – always get a pre-purchase inspection.</p>`;

    main.querySelectorAll('[data-seg]').forEach(s => s.addEventListener('click', async e => {
      const v = e.target.closest('button')?.dataset.v;
      if (!v) return;
      settings = await S.saveSettings({ [s.dataset.seg]: v });
      applyTheme();
      renderSettings();
    }));
    main.querySelectorAll('[data-bool]').forEach(i => i.addEventListener('change', async () => { settings = await S.saveSettings({ [i.dataset.bool]: i.checked }); }));
    main.querySelectorAll('[data-num]').forEach(i => i.addEventListener('change', async () => {
      const v = parseFloat(i.value);
      if (!isNaN(v) && v > 0) settings = await S.saveSettings({ [i.dataset.num]: v });
    }));
    main.querySelectorAll('[data-select]').forEach(i => i.addEventListener('change', async () => { settings = await S.saveSettings({ [i.dataset.select]: i.value }); }));
    main.querySelector('#clear-comps').addEventListener('click', async () => {
      if (confirm('Forget all learned prices?')) { await S.clearComps(); renderSettings(); }
    });
    main.querySelector('#export').addEventListener('click', async () => {
      const blob = new Blob([JSON.stringify(await S.exportAll(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `dealscore-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    });
    main.querySelector('#import').addEventListener('click', () => main.querySelector('#import-file').click());
    main.querySelector('#import-file').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await S.importAll(JSON.parse(await file.text()));
        settings = await S.settings();
        applyTheme();
        go('saved');
      } catch (err) { alert(`Could not import: ${err.message}`); }
    });
  }

  function renderWelcome() {
    main.innerHTML = `<div class="welcome">
      <h1>Welcome to DealScore</h1>
      <p>Open any car on <a href="https://www.avto.net/" target="_blank" style="color:var(--accent)">avto.net</a> and DealScore shows you whether it’s a good deal – and what to check before you buy.</p>
      <div class="features">
        <div class="feature"><div class="ic">◎</div><b>0–100 deal score</b><span>Price, mileage, history, reliability, age and resale – weighted by the profile you choose.</span></div>
        <div class="feature"><div class="ic">€</div><b>Market price estimate</b><span>Gets sharper the more search results you browse – DealScore learns real asking prices.</span></div>
        <div class="feature"><div class="ic">⚙</div><b>Real known problems</b><span>Engine- and year-specific issues (PureTech belt, N47 chain, DSG…) with repair costs and what to check.</span></div>
        <div class="feature"><div class="ic">✓</div><b>Inspection checklist</b><span>Tailored to fuel, gearbox and mileage, plus a ready-to-send message for the seller in Slovene.</span></div>
        <div class="feature"><div class="ic">⇣</div><b>Negotiation plan</b><span>Opening offer, target and walk-away price with the arguments to back them up.</span></div>
        <div class="feature"><div class="ic">★</div><b>Watchlist & compare</b><span>Save cars, track price drops and compare up to three side by side.</span></div>
      </div>
      <a class="btn primary" href="https://www.avto.net/" target="_blank" style="text-decoration:none;display:inline-block">Start browsing avto.net →</a>
    </div>`;
  }

  init();
})();
