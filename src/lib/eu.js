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
      if (v[0] && /^[A-Z]{4,}$/.test(v[0]) && !/^(TDI|TSI|TFSI|HDI|DCI|TCE|CDTI|CRDI|GTI|GTD|BLUE\w*)$/.test(v[0])) out.push(slug(`${model} ${v[0]}`));
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
    return modelSlugs(car).map(m => ({
      slug: `${make}/${m}`,
      urls: levels.map(p => `${BASE}${make}/${m}?${new URLSearchParams(p)}`)
    }));
  }

  // Runs in the background worker: HTML of a results page -> listings.
  function parsePage(html) {
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return null;
    const pp = JSON.parse(m[1])?.props?.pageProps;
    if (!pp) return null;
    const listings = (pp.listings || []).map(l => {
      const reg = (l.tracking?.firstRegistration || '').match(/(\d{1,2})-(\d{4})/);
      return {
        id: l.id,
        price: Number(l.tracking?.price || l.price?.priceRaw) || null,
        year: reg ? Number(reg[2]) : null,
        month: reg ? Number(reg[1]) : null,
        mileage: Number(l.tracking?.mileage) || null,
        country: l.location?.countryCode || null
      };
    }).filter(l => l.price && l.year);
    return { total: pp.numberOfResults || 0, listings };
  }

  return { queries, parsePage, modelSlugs, COUNTRIES };
})();
