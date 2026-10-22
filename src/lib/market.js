// src/lib/market.js – estimates what a car should cost.
//
// Two sources are blended:
//  1. the bundled reference table (one price per model, mostly for a 2020 car) projected to the
//     listing's year with a depreciation curve and adjusted for mileage;
//  2. comparable listings the extension has seen on avto.net results pages ("learned comps"),
//     which become more trusted the more of them there are.
CDS.market = (() => {
  const { CURRENT_YEAR, clamp, median } = CDS.util;

  const EXPECTED_KM_PER_YEAR = 15000;

  // marketPrices.json runs ~25–30% above real Slovenian asking prices (spot-checked Oct 2026:
  // Golf 7 2.0 TDI 2017 ≈ €14k, Clio IV 2015 ≈ €7.5k, 308 II 2018 ≈ €11.5k). Learned comparables
  // from browsing take over as they accumulate.
  const REFERENCE_CALIBRATION = 0.78;

  // Share of the value lost in each year of age: steep early, flattening out.
  function yearlyLoss(age) {
    if (age < 1) return 0.18;
    if (age < 4) return 0.13;
    if (age < 8) return 0.10;
    if (age < 14) return 0.07;
    return 0.04;
  }

  // Remaining value as a fraction of new for a car of the given age (years).
  function retained(age) {
    let v = 1;
    const whole = Math.floor(Math.max(age, 0));
    for (let a = 0; a < whole; a++) v *= 1 - yearlyLoss(a);
    v *= 1 - yearlyLoss(whole) * (Math.max(age, 0) - whole);
    return Math.max(v, 0.05);
  }

  // Projects a price observed for one model year to another.
  function projectYear(price, fromYear, toYear) {
    return price * retained(CURRENT_YEAR - toYear) / retained(CURRENT_YEAR - fromYear);
  }

  // Price multiplier for mileage above/below what is normal for the age.
  function mileageFactor(km, year) {
    if (!km || !year) return 1;
    const age = Math.max(CURRENT_YEAR - year, 0.5);
    const diff = km - age * EXPECTED_KM_PER_YEAR;
    return clamp(1 - (diff / 10000) * 0.022, 0.65, 1.12);
  }

  function fromReference(car) {
    const hit = CDS.data.getPrices(car.make, car.model, car.variant);
    if (!hit || !car.year) return null;
    const years = Object.keys(hit.value).map(Number);
    const refYear = years.reduce((best, y) => Math.abs(y - car.year) < Math.abs(best - car.year) ? y : best, years[0]);
    let est = projectYear(hit.value[refYear] * REFERENCE_CALIBRATION, refYear, car.year) * mileageFactor(car.mileage, car.year);
    est = Math.max(est, 500);
    return { estimate: est, key: hit.key, exact: hit.exact, refYear };
  }

  // comps: [{ year, mileage, price }] for the same model key.
  function fromComps(car, comps) {
    if (!car.year || !comps?.length) return null;
    const near = comps.filter(c => c.price > 300 && c.year && Math.abs(c.year - car.year) <= 2 && c.id !== car.id);
    if (!near.length) return null;
    const adjusted = near.map(c => {
      const sameYear = projectYear(c.price, c.year, car.year);
      return sameYear * mileageFactor(car.mileage, car.year) / mileageFactor(c.mileage, c.year);
    });
    return { estimate: median(adjusted), count: near.length };
  }

  function estimate(car, comps = []) {
    const ref = fromReference(car);
    const learned = fromComps(car, comps);
    let value = null, source = 'none', confidence = 'none';

    // A reference that lands far from the asking price usually means the variant was
    // mis-matched (e.g. "BMW M" vs "BMW M340i"), so its confidence drops.
    const plausible = ref && car.price ? (car.price / ref.estimate > 0.4 && car.price / ref.estimate < 2.5) : !!ref;

    if (learned && learned.count >= 3) {
      const w = learned.count / (learned.count + 4);
      value = ref && plausible ? w * learned.estimate + (1 - w) * ref.estimate : learned.estimate;
      source = ref && plausible ? 'blend' : 'comps';
      confidence = learned.count >= 8 ? 'high' : 'medium';
    } else if (ref) {
      value = ref.estimate;
      source = 'reference';
      confidence = !plausible ? 'low' : ref.exact ? 'medium' : 'low';
      if (learned) {
        value = (value * 3 + learned.estimate * learned.count) / (3 + learned.count);
        source = 'blend';
      }
    } else if (learned) {
      value = learned.estimate;
      source = 'comps';
      confidence = 'low';
    }

    if (!value) return { estimate: null, confidence: 'none', source: 'none', comps: learned?.count || 0 };

    const spread = { high: 0.08, medium: 0.12, low: 0.18 }[confidence];
    return {
      estimate: Math.round(value),
      low: Math.round(value * (1 - spread)),
      high: Math.round(value * (1 + spread)),
      delta: car.price ? (car.price - value) / value : null,
      confidence,
      source,
      plausible,
      comps: learned?.count || 0,
      referenceKey: ref?.key || null,
      nextYearValue: car.year ? Math.round(value * retained(CURRENT_YEAR - car.year + 1) / retained(CURRENT_YEAR - car.year)) : null
    };
  }

  return { estimate, retained, projectYear, mileageFactor, EXPECTED_KM_PER_YEAR };
})();
