// src/content/details.js – the DealScore panel on avto.net listing pages.
(() => {
  const { esc, eur, km, pct, clamp, timeAgo } = CDS.util;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'issues', label: 'Issues' },
    { id: 'inspect', label: 'Checklist' },
    { id: 'negotiate', label: 'Negotiate' },
    { id: 'costs', label: 'Costs' }
  ];

  const state = {
    car: null, result: null, settings: null, saved: false, priceChange: null,
    tab: 'overview', checks: [], openCats: new Set(), overrides: {}
  };
  let root, shadow;

  async function init() {
    state.settings = await CDS.store.settings();
    if (!state.settings.enabled) return;
    await CDS.data.load();

    state.car = CDS.parser.parseDetails(document, location.href);
    if (!state.car.price && !state.car.make) return;   // not a listing we understand

    // Learn from the listing itself, then track price on saved cars.
    if (state.settings.learnPrices) await CDS.store.learn([state.car]);
    const tracked = await CDS.store.trackPrice(state.car.id, state.car.price);
    state.saved = !!tracked;
    if (tracked?.item) {
      const first = tracked.item.priceHistory[0];
      if (first && first.price !== state.car.price) state.priceChange = { diff: state.car.price - first.price, since: first.t };
    }
    state.checks = await CDS.store.checks(state.car.id);
    await score();
    await CDS.store.addHistory(state.car, state.result);
    if (state.saved) await CDS.store.saveListing(state.car, state.result);

    mount();
    render();
    if (!state.settings.autoOpen) minimize();
    chrome.runtime.sendMessage({ type: 'score', score: state.result.score, tone: state.result.verdict.tone }).catch(() => {});
  }

  async function score() {
    const car = { ...state.car, ...state.overrides };
    const key = CDS.data.modelKey(car.make, car.model);
    const comps = key ? await CDS.store.compsFor(key) : [];
    state.result = CDS.scoring.evaluate(car, { comps, profile: state.settings.profile });
    state.nego = CDS.insights.negotiation(car, state.result);
    state.costs = CDS.insights.costs(car, state.result, state.settings);
    state.checklist = CDS.insights.checklist(car, state.result);
    state.message = CDS.insights.sellerMessage(car, state.result);
  }

  // ---------- mounting ----------
  function mount() {
    root = document.createElement('div');
    root.id = 'dealscore-root';
    shadow = root.attachShadow({ mode: 'open' });
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/ui/panel.css');
    shadow.appendChild(link);
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.visibility = 'hidden';
    link.addEventListener('load', () => { panel.style.visibility = ''; });
    const pill = document.createElement('div');
    pill.className = 'pill';
    shadow.append(panel, pill);
    document.documentElement.appendChild(root);
    applyTheme();
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);

    shadow.addEventListener('click', onClick);
    shadow.addEventListener('change', onChange);
    makeDraggable(panel);
    document.addEventListener('keydown', e => {
      if (e.altKey && e.shiftKey && e.code === 'KeyD') { e.preventDefault(); toggle(); }
    });
  }

  function applyTheme() {
    const t = state.settings.theme;
    const light = t === 'light' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: light)').matches);
    root.setAttribute('data-theme', light ? 'light' : 'dark');
  }

  const $ = sel => shadow.querySelector(sel);

  // ---------- rendering ----------
  function render() {
    const { car, result } = state;
    const panel = $('.panel');
    const left = state.settings.position === 'left';
    panel.classList.toggle('left', left);
    $('.pill').classList.toggle('left', left);
    const tone = result.verdict.tone;
    const issuesHot = result.issues.filter(i => i.status === 'likely' && i.sev === 3).length;

    panel.innerHTML = `
      <div class="head">
        <div class="logo">D</div>
        <div class="brand">DealScore<small>avto.net</small></div>
        <div class="spacer"></div>
        <button class="icon-btn ${state.saved ? 'on' : ''}" data-act="save" title="${state.saved ? 'Saved – click to remove' : 'Save to watchlist'}">${state.saved ? '★' : '☆'}</button>
        <button class="icon-btn" data-act="copy" title="Copy report">⧉</button>
        <button class="icon-btn" data-act="settings" title="Settings">⚙</button>
        <button class="icon-btn" data-act="min" title="Minimize (Alt+Shift+D)">–</button>
      </div>
      <div class="hero">
        ${ring(result.score, tone)}
        <div class="hero-right">
          <div class="verdict tone-${tone}">${esc(result.verdict.label)}</div>
          <div class="title" title="${esc(car.title)}">${esc(car.title || `${car.make} ${car.model}`)}</div>
          <div class="summary">${esc(result.summary || '')}</div>
        </div>
      </div>
      ${banners()}
      ${priceBand()}
      <div class="tabs">
        ${TABS.map(t => `<button class="tab ${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}${
          t.id === 'issues' && result.issues.length ? `<span class="count ${issuesHot ? 'hot' : ''}">${result.issues.length}</span>` : ''}${
          t.id === 'inspect' ? `<span class="count">${state.checks.length}/${state.checklist.length}</span>` : ''}</button>`).join('')}
      </div>
      <div class="body">${tabBody()}</div>
      <div class="foot">
        <span>${sourceNote()}</span>
        <span>Informational only</span>
      </div>`;

    const pill = $('.pill');
    pill.innerHTML = `<div class="dot tone-${tone}">${result.score}</div><span>${esc(result.verdict.label)}</span>`;

    // Animate ring, meters and marker from zero.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      shadow.querySelectorAll('[data-w]').forEach(el => { el.style.width = el.dataset.w; });
      const arc = $('.arc');
      if (arc) arc.style.strokeDashoffset = arc.dataset.offset;
      const marker = $('.marker');
      if (marker) marker.style.left = marker.dataset.left;
    }));
  }

  function ring(score, tone) {
    const r = 46, c = 2 * Math.PI * r;
    return `<div class="ring tone-${tone}">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle class="track" cx="52" cy="52" r="${r}" fill="none" stroke-width="9"/>
        <circle class="arc" cx="52" cy="52" r="${r}" fill="none" stroke-width="9" stroke="var(--tone)"
          stroke-dasharray="${c}" stroke-dashoffset="${c}" data-offset="${c * (1 - score / 100)}"/>
      </svg>
      <div class="num"><div><b>${score}</b><span>/ 100</span></div></div>
    </div>`;
  }

  function banners() {
    const out = [];
    const reds = state.result.flags.filter(f => f.kind === 'red');
    if (reds.length) out.push(`<div class="banner red">⚠ <div>${reds.map(f => esc(f.text)).join('<br>')}${state.result.capped ? `<br><small>Score capped at ${state.result.capped}.</small>` : ''}</div></div>`);
    if (state.priceChange) {
      const d = state.priceChange.diff;
      out.push(`<div class="banner ${d < 0 ? 'green' : 'red'}">${d < 0 ? '↓' : '↑'} <div>Price ${d < 0 ? 'dropped' : 'rose'} by <b>${eur(Math.abs(d))}</b> since you saved it (${timeAgo(state.priceChange.since)}).</div></div>`);
    }
    if (state.car.condition === 'new') out.push(`<div class="banner blue">ℹ <div>New car – mileage and owner checks matter less; compare dealer offers.</div></div>`);
    return out.join('');
  }

  function priceBand() {
    const { car, result } = state;
    const m = result.market;
    if (!m.estimate || !car.price) {
      return `<div class="band"><div class="band-top"><div class="ask">${eur(car.price)}</div>
        <div class="est">No market estimate yet<br><span class="small">Browse this model's search results to teach DealScore prices.</span></div></div></div>`;
    }
    // Scale: estimate ±40%
    const lo = m.estimate * 0.6, hi = m.estimate * 1.4;
    const pos = v => `${clamp((v - lo) / (hi - lo) * 100, 2, 98)}%`;
    return `<div class="band">
      <div class="band-top">
        <div><div class="ask">${eur(car.price)}</div><div class="small muted">${m.delta !== null ? `${pct(m.delta)} vs market` : ''}</div></div>
        <div class="est">Est. market <b>${eur(m.estimate)}</b><span class="conf">${m.confidence}</span><br><span class="small">${eur(m.low)} – ${eur(m.high)}</span></div>
      </div>
      <div class="bar">
        <div class="range" style="left:${pos(m.low)};right:calc(100% - ${pos(m.high)})"></div>
        <div class="marker" style="left:50%" data-left="${pos(car.price)}" title="Asking price"></div>
      </div>
      <div class="band-labels"><span>Bargain</span><span>Fair</span><span>Overpriced</span></div>
    </div>`;
  }

  function sourceNote() {
    const m = state.result.market;
    if (m.source === 'comps' || m.source === 'blend') return `Price based on ${m.comps} similar listing${m.comps === 1 ? '' : 's'}${m.source === 'blend' ? ' + reference data' : ''}`;
    if (m.source === 'reference') return 'Price from reference data · browse results to improve';
    return 'No price reference';
  }

  function tabBody() {
    switch (state.tab) {
      case 'issues': return issuesTab();
      case 'inspect': return inspectTab();
      case 'negotiate': return negotiateTab();
      case 'costs': return costsTab();
      default: return overviewTab();
    }
  }

  function toneFor(score) { return CDS.scoring.verdictFor(score).tone; }

  function overviewTab() {
    const { car, result } = state;
    const cats = result.categories.map(c => `
      <div class="cat ${state.openCats.has(c.id) ? 'open' : ''}" data-cat="${c.id}">
        <div class="cat-row" data-act="cat" data-id="${c.id}">
          <div class="cat-icon">${c.icon}</div>
          <div class="cat-label">${esc(c.label)}<small>${c.weight}%</small></div>
          <div class="meter tone-${toneFor(c.score)}"><i data-w="${c.score}%"></i></div>
          <div class="cat-score">${c.score}</div>
        </div>
        <div class="cat-notes">${c.notes.map(n => `<div class="note ${n.kind}">${esc(n.text)}</div>`).join('') || '<div class="note">No notes.</div>'}</div>
      </div>`).join('');

    const highlights = [
      ...result.flags.filter(f => f.kind !== 'red').map(f => ({ kind: 'warn', text: f.text })),
      ...result.warnings.slice(0, 4).map(t => ({ kind: 'warn', text: t })),
      ...result.positives.slice(0, 4).map(t => ({ kind: 'good', text: t }))
    ];
    const seen = new Set();
    const uniq = highlights.filter(h => !seen.has(h.text) && seen.add(h.text));

    const ownersVal = state.overrides.owners ?? car.owners;
    return `
      <div class="section-title">Score breakdown <span class="muted small">· tap a row for details</span></div>
      ${cats}
      ${uniq.length ? `<div class="section-title">Highlights</div>${uniq.slice(0, 8).map(h => `<div class="note ${h.kind}">${esc(h.text)}</div>`).join('')}` : ''}
      <div class="section-title">Detected data</div>
      <div class="facts">
        ${fact('Year', car.year ? `${car.month ? car.month + '/' : ''}${car.year}` : '–')}
        ${fact('Mileage', km(car.mileage))}
        <div class="fact"><span>Owners${car.owners ? '' : ' (not listed – set it)'}</span>
          <b><select data-override="owners">
            <option value="">?</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${ownersVal === n ? 'selected' : ''}>${n}${n === 5 ? '+' : ''}</option>`).join('')}
          </select></b></div>
        ${fact('Fuel', car.fuelRaw || car.fuel || '–')}
        ${fact('Gearbox', car.gearboxRaw ? `${car.gearboxRaw}${car.gearbox === 'dsg' ? ' (DSG)' : ''}` : '–')}
        ${fact('Engine', [car.ccm ? `${car.ccm} ccm` : '', car.powerKw ? `${car.powerKw} kW` : ''].filter(Boolean).join(' · ') || '–')}
        ${fact('Inspection until', car.inspection ? `${car.inspection.month ? car.inspection.month + '/' : ''}${car.inspection.year}` : '–')}
        ${fact('Seller', car.sellerType === 'dealer' ? 'Dealer' : 'Private')}
      </div>
      <div class="section-title">Scoring profile</div>
      <div class="row">${Object.entries(CDS.scoring.PROFILES).map(([id, p]) =>
        `<button class="btn ${state.settings.profile === id ? 'primary' : ''}" data-act="profile" data-id="${id}">${p.label}</button>`).join('')}</div>`;
  }

  const fact = (label, value) => `<div class="fact"><span>${esc(label)}</span><b title="${esc(value)}">${esc(value)}</b></div>`;

  function issuesTab() {
    const r = state.result;
    if (r.issuesSource === 'none') return `<div class="muted">No reliability data for ${esc(state.car.make)} ${esc(state.car.model)} yet.</div>`;
    const positives = (r.categories.find(c => c.id === 'reliability').notes || []).filter(n => n.kind === 'good');
    const items = r.issues.map(i => `
      <div class="issue">
        <div class="issue-top">
          <h4>${esc(i.title)}</h4>
          <span class="chip ${i.status}" title="${i.status === 'likely' ? 'Matches this car’s year, fuel and engine' : 'Applies if this car has that engine/gearbox – not confirmed from the listing'}">${i.status}</span>
        </div>
        ${i.sev ? `<div class="sev s${i.sev}" title="Severity ${i.sev}/3"><i></i><i></i><i></i></div>` : ''}
        ${i.detail ? `<p>${esc(i.detail)}</p>` : ''}
        <div class="meta">${i.cost ? `<span>Repair: <b>${esc(i.cost)}</b></span>` : ''}${i.y ? `<span>Affects ${i.y[0]}–${i.y[1]}</span>` : ''}</div>
        ${i.check ? `<div class="check">${esc(i.check)}</div>` : ''}
      </div>`).join('');
    return `
      ${positives.map(p => `<div class="good-pill">✓ ${esc(p.text)}</div>`).join('')}
      ${items || '<div class="good-pill">✓ No well-known problems match this engine and year.</div>'}
      <p class="muted small">${r.issuesSource === 'curated'
        ? 'From DealScore’s curated database of documented problems, matched by year, fuel, engine and gearbox. Common problems – not confirmed on this car.'
        : 'From the generic model database – less specific; treat as hints.'}</p>`;
  }

  function inspectTab() {
    const groups = {};
    state.checklist.forEach(it => { (groups[it.group] = groups[it.group] || []).push(it); });
    const done = state.checks.length;
    const total = state.checklist.length;
    return `
      <div class="section-title">Viewing checklist · ${done}/${total}</div>
      <div class="progress"><i style="width:${total ? done / total * 100 : 0}%"></i></div>
      ${Object.entries(groups).map(([g, items]) => `
        <div class="section-title">${esc(g)}</div>
        ${items.map(it => `<label class="check-item ${state.checks.includes(it.id) ? 'done' : ''}">
          <input type="checkbox" data-check="${esc(it.id)}" ${state.checks.includes(it.id) ? 'checked' : ''}>
          <span class="txt">${esc(it.text)}${it.why ? `<span class="why">${esc(it.why)}</span>` : ''}</span>
        </label>`).join('')}`).join('')}
      <div class="section-title">Ask the seller</div>
      <div class="msg">${esc(state.message.text)}</div>
      <div class="row">
        <button class="btn primary" data-act="copy-msg">Copy message (Slovene)</button>
        <button class="btn" data-act="toggle-en">${state.showEn ? 'Hide' : 'Show'} English</button>
      </div>
      ${state.showEn ? `<div class="section-title">In English</div>${state.message.questions.map(q => `<div class="note">${esc(q[1])}</div>`).join('')}` : ''}`;
  }

  function negotiateTab() {
    const n = state.nego;
    if (!n) return '<div class="muted">No price to negotiate on.</div>';
    return `
      <div class="offers">
        <div class="offer"><span>Open with</span><b>${eur(n.opening)}</b></div>
        <div class="offer target"><span>Target</span><b>${eur(n.target)}</b></div>
        <div class="offer"><span>Walk away</span><b>&gt; ${eur(n.walkAway)}</b></div>
      </div>
      <p class="small muted">Potential saving: <b>${eur(Math.max(n.saving, 0))}</b> off the asking price of ${eur(state.car.price)}.</p>
      <div class="section-title">Your leverage</div>
      ${n.leverage.length ? n.leverage.map(l => `<div class="lev"><span>${esc(l.text)}</span>${l.amount ? `<b>−${eur(l.amount)}</b>` : ''}</div>`).join('')
        : '<div class="note good">Few weak points – this car is priced fairly; negotiate on extras (tyres, service, warranty).</div>'}
      <div class="section-title">Tips</div>
      <div class="note info">Mention concrete costs (e.g. timing belt, tyres) rather than "can you do better?".</div>
      <div class="note info">Cash and a quick decision are worth 2–5% to most private sellers.</div>
      <div class="note info">Dealers in Slovenia must give a 1-year warranty on used cars to consumers – ask what it covers.</div>`;
  }

  function costsTab() {
    const c = state.costs;
    const max = Math.max(...c.rows.map(r => r.value));
    return `
      <div class="cost-total"><b>${eur(c.total)}</b><span class="muted">per year</span></div>
      <div class="small muted">${eur(c.perMonth)} / month · ${(c.perKm).toFixed(2).replace('.', ',')} € / km</div>
      <div class="section-title">Breakdown</div>
      ${c.rows.map(r => `<div class="cost-row"><span>${esc(r.label)}</span><b>${eur(r.value)}</b>
        <div class="meter"><i data-w="${r.value / max * 100}%"></i></div><small>${esc(r.hint)}</small></div>`).join('')}
      <div class="section-title">Assumptions</div>
      <div class="row small" style="align-items:center">
        I drive <input class="inline-input" type="number" step="1000" min="1000" data-setting="kmPerYear" value="${state.settings.kmPerYear}"> km / year
      </div>
      <p class="small muted">Fuel prices and other assumptions can be changed in Settings. Insurance and maintenance are rough averages.</p>`;
  }

  // ---------- interaction ----------
  async function onClick(e) {
    const tab = e.target.closest('[data-tab]');
    if (tab) { state.tab = tab.dataset.tab; render(); return; }
    const el = e.target.closest('[data-act]');
    if (el) {
      const act = el.dataset.act;
      if (act === 'min') return minimize();
      if (act === 'cat') {
        const id = el.dataset.id;
        state.openCats.has(id) ? state.openCats.delete(id) : state.openCats.add(id);
        el.parentElement.classList.toggle('open');
        return;
      }
      if (act === 'save') {
        if (state.saved) { await CDS.store.removeListing(state.car.id); state.saved = false; toast('Removed from watchlist'); }
        else { await CDS.store.saveListing({ ...state.car, ...state.overrides }, state.result); state.saved = true; toast('Saved – DealScore will track its price'); }
        return render();
      }
      if (act === 'copy') {
        await copy(CDS.insights.report({ ...state.car, ...state.overrides }, state.result, state.nego));
        return toast('Report copied to clipboard');
      }
      if (act === 'copy-msg') { await copy(state.message.text); return toast('Message copied – paste it into the seller form'); }
      if (act === 'toggle-en') { state.showEn = !state.showEn; return render(); }
      if (act === 'settings') { chrome.runtime.sendMessage({ type: 'openOptions' }).catch(() => {}); return; }
      if (act === 'profile') {
        state.settings = await CDS.store.saveSettings({ profile: el.dataset.id });
        await score();
        return render();
      }
    }
    if (e.target.closest('.pill')) restore();
  }

  async function onChange(e) {
    const t = e.target;
    if (t.dataset.check) {
      const id = t.dataset.check;
      state.checks = t.checked ? [...new Set([...state.checks, id])] : state.checks.filter(x => x !== id);
      await CDS.store.setChecks(state.car.id, state.checks);
      const scrollTop = $('.body').scrollTop;
      render();
      $('.body').scrollTop = scrollTop;
    } else if (t.dataset.override) {
      state.overrides[t.dataset.override] = t.value ? parseInt(t.value, 10) : null;
      await score();
      render();
    } else if (t.dataset.setting) {
      state.settings = await CDS.store.saveSettings({ [t.dataset.setting]: Number(t.value) || CDS.store.DEFAULTS[t.dataset.setting] });
      await score();
      render();
    }
  }

  function minimize() { $('.panel').classList.add('hidden'); $('.pill').classList.add('show'); }
  function restore() { $('.panel').classList.remove('hidden'); $('.pill').classList.remove('show'); }
  function toggle() { $('.panel').classList.contains('hidden') ? restore() : minimize(); }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
  }

  function toast(text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    shadow.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  function makeDraggable(panel) {
    let start = null;
    panel.addEventListener('pointerdown', e => {
      if (!e.target.closest('.head') || e.target.closest('button')) return;
      const r = panel.getBoundingClientRect();
      start = { x: e.clientX, y: e.clientY, left: r.left, top: r.top };
      panel.setPointerCapture(e.pointerId);
    });
    panel.addEventListener('pointermove', e => {
      if (!start) return;
      const left = clamp(start.left + e.clientX - start.x, 0, window.innerWidth - panel.offsetWidth);
      const top = clamp(start.top + e.clientY - start.y, 0, window.innerHeight - 60);
      Object.assign(panel.style, { left: `${left}px`, top: `${top}px`, right: 'auto' });
    });
    panel.addEventListener('pointerup', () => { start = null; });
  }

  // Settings changed in the popup -> re-render live.
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'sync' || !changes.settings || !root) return;
    state.settings = await CDS.store.settings();
    if (!state.settings.enabled) { root.remove(); root = null; return; }
    applyTheme();
    await score();
    render();
  });

  chrome.runtime.onMessage.addListener(msg => { if (msg?.type === 'togglePanel' && root) toggle(); });

  init().catch(err => console.error('[DealScore]', err));
})();
