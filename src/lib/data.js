// src/lib/data.js – loads the bundled JSON databases and resolves a car to their keys.
CDS.data = (() => {
  const { norm } = CDS.util;

  // Avto.net and the databases spell some makes differently.
  const MAKE_ALIASES = {
    'MERCEDES-BENZ': 'MERCEDES BENZ',
    'MERCEDES': 'MERCEDES BENZ',
    'VW': 'VOLKSWAGEN',
    'KODA': 'SKODA',          // Š was dropped when the registry data was exported
    'CITROËN': 'CITROEN',
    'LANDROVER': 'LAND ROVER',
    'ROLLS-ROYCE': 'ROLLS ROYCE'
  };

  const MULTIWORD_MAKES = [
    'ALFA ROMEO', 'LAND ROVER', 'ASTON MARTIN', 'ROLLS ROYCE', 'MERCEDES BENZ', 'LYNK & CO', 'DS AUTOMOBILES'
  ];

  const state = {
    loaded: false,
    issues: new Map(),       // "VOLKSWAGEN GOLF" -> [..]
    prices: new Map(),       // "VOLKSWAGEN GOLF" -> { 2020: 25000 }
    popularity: new Map(),   // "VOLKSWAGEN GOLF" -> 19117
    promise: null
  };

  function normMake(make) {
    let m = norm(make).replace(/\s*-\s*/g, '-');
    if (MAKE_ALIASES[m]) return MAKE_ALIASES[m];
    m = m.replace(/-/g, ' ');
    return MAKE_ALIASES[m] || m;
  }

  // Turn a DB key ("MERCEDES-BENZ G", "KODA OCTAVIA", "Volkswagen Golf 7") into canonical form.
  function normKey(key) {
    let k = norm(key).replace(/\s*\/\s*$/, '');
    for (const [from, to] of Object.entries(MAKE_ALIASES)) {
      if (k.startsWith(from + ' ')) { k = to + k.slice(from.length); break; }
    }
    return k.replace(/\s+/g, ' ').trim();
  }

  function ingest({ issues = {}, prices = {}, popularity = {} }) {
    for (const [key, list] of Object.entries(issues)) {
      if (!Array.isArray(list) || !list.length) continue;
      const k = normKey(key);
      state.issues.set(k, [...new Set([...(state.issues.get(k) || []), ...list])]);
    }
    for (const [key, price] of Object.entries(prices)) {
      if (!price) continue;
      const m = key.match(/^(.*)_(\d{4})$/);
      if (!m) continue;
      const k = normKey(m[1]);
      const byYear = state.prices.get(k) || {};
      byYear[m[2]] = price;
      state.prices.set(k, byYear);
    }
    for (const [key, count] of Object.entries(popularity)) {
      const k = normKey(key);
      state.popularity.set(k, (state.popularity.get(k) || 0) + count);
    }
    state.loaded = true;
  }

  async function load() {
    if (state.loaded) return;
    if (state.promise) return state.promise;
    const get = async file => {
      try {
        const res = await fetch(chrome.runtime.getURL(file));
        return res.ok ? res.json() : {};
      } catch (e) {
        console.warn('[DealScore] could not load', file, e);
        return {};
      }
    };
    state.promise = Promise.all([
      get('issues.json'), get('marketPrices.json'), get('popularity.json')
    ]).then(([issues, prices, popularity]) => ingest({ issues, prices, popularity }));
    return state.promise;
  }

  // Split a heading like "Alfa Romeo Giulietta 1.6 JTDm" into make / model / variant.
  function splitTitle(title) {
    const words = norm(title).replace(/[:,]/g, ' ').split(' ').filter(Boolean);
    if (!words.length) return { make: null, model: null, variant: '' };
    // Consume as many words as a known multi-word make needs ("ALFA ROMEO", "MERCEDES-BENZ").
    let makeLen = 1;
    for (const mw of MULTIWORD_MAKES) {
      let acc = '';
      for (let i = 0; i < words.length && acc.length < mw.length; i++) {
        acc = (acc ? acc + ' ' : '') + words[i].replace(/-/g, ' ');
        if (acc === mw) { makeLen = i + 1; break; }
      }
      if (acc === mw) break;
    }
    const make = words.slice(0, makeLen).join(' ');
    let rest = words.slice(makeLen);
    // BMW "serija X5", Mercedes "C-razred", "razred C"
    if (rest[0] === 'SERIJA' || rest[0] === 'RAZRED' || rest[0] === 'CLASS') rest = rest.slice(1);
    const model = rest[0] || null;
    return { make, model, variant: rest.slice(1).join(' ') };
  }

  // Ordered list of keys to try for this car, most specific first.
  function candidateKeys(make, model, variant = '') {
    const mk = normMake(make);
    let md = norm(model).replace(/^SERIJA\s+/, '').replace(/[-\s](RAZRED|CLASS|KLASSE)$/, '');
    if (!mk || !md) return [];
    const v = norm(variant).split(' ').filter(Boolean);
    const keys = [];
    const add = k => { if (k && !keys.includes(k)) keys.push(k); };
    // Generation / body hints ("GOLF 7", "A4 B8")
    if (v[0] && /^(\d|[A-Z]\d{1,2}$|MK\d)/.test(v[0]) && v[0].length <= 3) add(`${mk} ${md} ${v[0]}`);
    // Two-word model names ("RANGE ROVER", "C4 PICASSO", "GRAND SCENIC")
    if (v[0] && /^[A-Z][A-Z-]{2,}$/.test(v[0]) && !/^(TDI|TSI|TFSI|FSI|HDI|DCI|TCE|CDI|CDTI|CRDI|GTI|GTD|VTI|THP|JTD|JTDM|MJET|SDI|TDCI|AUT|AVT|DSG)$/.test(v[0])) add(`${mk} ${md} ${v[0]}`);
    add(`${mk} ${md}`);
    // BMW "serija 3" lists engines as 320d / 330e -> DB keys are "BMW 320"
    const engine = v.find(t => /^\d{3}[A-Z]{0,2}$/.test(t));
    if (engine) add(`${mk} ${engine.replace(/[A-Z]+$/, '')}`);
    if (md.includes(' ')) add(`${mk} ${md.split(' ')[0]}`);
    if (md.includes('-')) add(`${mk} ${md.split('-')[0]}`);
    return keys;
  }

  function lookup(map, make, model, variant) {
    const keys = candidateKeys(make, model, variant);
    for (let i = 0; i < keys.length; i++) {
      if (map.has(keys[i])) return { key: keys[i], value: map.get(keys[i]), exact: i <= 1 };
    }
    return null;
  }

  return {
    load,
    ingest,
    splitTitle,
    normMake,
    normKey,
    candidateKeys,
    // Stable grouping key for learned comparables, e.g. "VOLKSWAGEN GOLF".
    modelKey(make, model) {
      const mk = normMake(make);
      const md = norm(model).replace(/^SERIJA\s+/, '').replace(/[-\s](RAZRED|CLASS|KLASSE)$/, '');
      return mk && md ? `${mk} ${md}` : null;
    },
    getIssues: (make, model, variant) => lookup(state.issues, make, model, variant),
    getPrices: (make, model, variant) => lookup(state.prices, make, model, variant),
    getPopularity: (make, model, variant) => lookup(state.popularity, make, model, variant),
    get isLoaded() { return state.loaded; },
    _state: state
  };
})();
