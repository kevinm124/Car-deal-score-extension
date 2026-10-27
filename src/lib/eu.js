// src/lib/eu.js – EU market comparison via AutoScout24 search pages.
// The content script builds the search URLs; the background worker fetches and parses them
// (AutoScout24 embeds the results as JSON in __NEXT_DATA__).
CDS.eu = (() => {
  const { norm } = CDS.util;
  const BASE = 'https://www.autoscout24.com/lst/';
  // EU countries AutoScout24 covers (Switzerland left out on purpose).
  const COUNTRIES = 'D,A,I,F,NL,B,E,L';
  const FUEL = { petrol: 'B', diesel: 'D', electric: 'E', hybrid: '2', plugin: '2', lpg: 'L' };

  const slug = s => norm(s).toLowerCase().replace(/[\s./]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');

  // Possible model slugs, most specific first.
  function modelSlugs(car) {
    const make = CDS.data.normMake(car.make);
    const model = norm(car.model);
    const v = norm(car.variant).split(' ').filter(Boolean);
    const out = [];
    if (make === 'BMW') {
      const engine = v.find(t => /^\d{3}[A-Z]{0,2}$/.test(t));
      if (engine) out.push(engine.slice(0, 3));
      out.push(/^\d$/.test(model) ? `${model}-series` : slug(model));
    } else if (make === 'MERCEDES BENZ') {
      const m = model.replace(/[-\s]?(RAZRED|CLASS|KLASSE)$/, '');
      const num = v.find(t => /^\d{3}$/.test(t));
      if (num) out.push(`${slug(m)}-${num}`);
      out.push(m.length === 1 ? `${slug(m)}-class` : slug(m));
    } else {
      // Multi-word model names: "Grand C4 Picasso", "Range Rover Evoque", "Golf Sportsvan".
      // Guesses AutoScout24 doesn't recognise are rejected by the background lookup.
      const word = t => t && /^[A-Z][A-Z-]{2,}$/.test(t) && !/^(TDI|TSI|TFSI|FSI|HDI|DCI|TCE|CDI|CDTI|CRDI|GTI|GTD|VTI|THP|JTD|JTDM|BLUE\w*|PURE\w*|ECO\w*|AUT|AVT|DSG|STYLE|SPORT|LINE|EDITION|ACTIVE|TECHNO|SHINE|FEEL|ALLURE|ZEN|INTENS|COMFORT\w*|HIGHLINE|TRENDLINE)$/.test(t);
      if (word(v[0]) && word(v[1])) {
        if (v[0] === 'GRAND') out.push(slug(`GRAND ${model} ${v[1]}`));
        out.push(slug(`${model} ${v[0]} ${v[1]}`));
      }
      if (word(v[0])) out.push(slug(`${model} ${v[0]}`));
      if (word(v[0]) && word(v[1])) out.push(slug(`${model} ${v[1]}`));
      out.push(slug(model));
    }
    return [...new Set(out)];
  }

  // Search URLs from strict to relaxed, for each slug candidate.
  function queries(car) {
    if (!car.make || !car.model || !car.year) return [];
    const make = slug(CDS.data.normMake(car.make));
    const levels = [];
    const base = { atype: 'C', ustate: 'U', cy: COUNTRIES, sort: 'standard', desc: '0', fregfrom: car.year - 1, fregto: car.year + 1 };
    const fuel = FUEL[car.fuel];
    const gear = car.gearbox ? (car.gearbox === 'manual' ? 'M' : 'A') : null;
    const km = car.mileage ? { kmfrom: Math.max(0, Math.round(car.mileage * 0.65 / 5000) * 5000), kmto: Math.round((car.mileage * 1.35 + 10000) / 5000) * 5000 } : {};
    const power = car.powerKw ? { powerfrom: Math.floor(car.powerKw * 0.85), powerto: Math.ceil(car.powerKw * 1.15), powertype: 'kw' } : {};
    const strict = { ...base, ...(fuel && { fuel }), ...(gear && { gear }), ...km, ...power };
    levels.push(strict);
    levels.push({ ...base, ...(fuel && { fuel }), ...(gear && { gear }), ...km });
    levels.push({ ...base, ...(fuel && { fuel }) });
    // Every returned listing is checked again against these, so relaxed searches never mix in
    // other engines (a GTI with 1.0 TSIs) or gearboxes.
    const match = { ccm: car.ccm || null, gear: gear || null };
    return modelSlugs(car).map(m => ({
      slug: `${make}/${m}`,
      match,
      urls: levels.map(p => `${BASE}${make}/${m}?${new URLSearchParams(p)}`)
    }));
  }

  // Keeps only listings that really are comparable: same engine size (±3%) and gearbox.
  function comparable(listing, match) {
    if (!match) return true;
    if (match.ccm && listing.ccm && Math.abs(listing.ccm - match.ccm) / match.ccm > 0.03) return false;
    if (match.gear && listing.gear && listing.gear !== match.gear) return false;
    return true;
  }

  // Runs in the background worker: HTML of a results page -> listings.
  function parsePage(html) {
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return null;
    const pp = JSON.parse(m[1])?.props?.pageProps;
    if (!pp) return null;
    // AutoScout24 silently ignores a model slug it doesn't know and returns the whole make
    // (e.g. "renault/captur-techno" -> all 6,500 Renaults). Its query then has no model id.
    const modelId = String(pp.pageQuery?.mmmv || '').split('|')[1];
    const listings = (pp.listings || []).map(l => {
      const reg = (l.tracking?.firstRegistration || '').match(/(\d{1,2})-(\d{4})/);
      const ccm = parseInt(String(l.vehicle?.engineDisplacementInCCM || '').replace(/\D/g, ''), 10);
      const tr = String(l.vehicle?.transmission || '').toLowerCase();
      return {
        id: l.id,
        price: Number(l.tracking?.price || l.price?.priceRaw) || null,
        year: reg ? Number(reg[2]) : null,
        month: reg ? Number(reg[1]) : null,
        mileage: Number(l.tracking?.mileage) || null,
        country: l.location?.countryCode || null,
        model: l.vehicle?.model || null,
        ccm: ccm || null,
        gear: /manual/.test(tr) ? 'M' : /auto|semi/.test(tr) ? 'A' : null
      };
    }).filter(l => l.price && l.year);
    return { total: pp.numberOfResults || 0, listings, modelRecognised: !!modelId };
  }

  return { queries, parsePage, comparable, modelSlugs, COUNTRIES };
})();
