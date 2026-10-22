// src/lib/market.js – estimates what a car should cost.
//
// Three sources are blended, each comparable adjusted to this car's year and mileage:
//  1. EU listings from AutoScout24 (same model, fuel, gearbox, similar year/km/power);
//  2. avto.net listings the extension has seen on results pages ("learned comps");
//  3. the bundled reference table – a rough price per model, used only as a weak fallback.
CDS.market = (() => {
  const { CURRENT_YEAR, clamp, median } = CDS.util;

  const EXPECTED_KM_PER_YEAR = 15000;

  // marketPrices.json holds roughly one new-ish price per model, so it is treated as the value at
  // age 0 and depreciated along the curve below. It is noisy, so it always counts as low confidence.
  const REFERENCE_CALIBRATION = 1.0;

  // Typical share of the new price a used car keeps, by age in years (EU used-car market averages).
  const RETAINED = [[0, 1], [1, 0.82], [2, 0.74], [3, 0.66], [5, 0.55], [7, 0.47], [9, 0.4], [12, 0.29], [15, 0.2], [20, 0.12], [30, 0.08]];
  function retained(age) { return CDS.util.interp(Math.max(age, 0), RETAINED); }

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
    const age = CURRENT_YEAR - car.year + (car.month ? (6 - car.month) / 12 : 0);
    const est = hit.value[refYear] * REFERENCE_CALIBRATION * retained(age) * mileageFactor(car.mileage, car.year);
    return { estimate: Math.max(est, 500), key: hit.key, exact: hit.exact };
  }

  // Comparable listings [{ id, year, mileage, price }] adjusted to this car, then the median.
  function adjustedMedian(car, list, maxYearGap = 2) {
    if (!car.year || !list?.length) return null;
    const near = list.filter(c => c.price > 300 && c.year && Math.abs(c.year - car.year) <= maxYearGap && c.id !== car.id);
    if (!near.length) return null;
    const adjusted = near.map(c => projectYear(c.price, c.year, car.year) * mileageFactor(car.mileage, car.year) / mileageFactor(c.mileage, c.year));
    return { estimate: median(adjusted), rawMedian: median(near.map(c => c.price)), count: near.length };
  }

  // eu: { listings: [...], total, url, countries } from the background AutoScout24 lookup.
  function estimate(car, comps = [], eu = null) {
    const ref = fromReference(car);
    const local = adjustedMedian(car, comps);
    const euM = eu?.listings?.length ? adjustedMedian(car, eu.listings, 1) : null;

    // A reference far from the asking price usually means the variant was mis-matched.
    const plausible = !!ref && (!car.price || (car.price / ref.estimate > 0.5 && car.price / ref.estimate < 2));
    const parts = [];
    if (local) parts.push({ v: local.estimate, w: Math.min(local.count, 20) });
    if (euM) parts.push({ v: euM.estimate, w: Math.min(euM.count, 30) * 0.6 });
    if (ref && plausible) parts.push({ v: ref.estimate, w: parts.length ? 1 : 2 });
    if (!parts.length && ref) parts.push({ v: ref.estimate, w: 1 });

    const euInfo = euM ? { estimate: Math.round(euM.estimate), rawMedian: Math.round(euM.rawMedian), count: euM.count, total: eu.total, url: eu.url, countries: eu.countries } : (eu ? { count: 0, total: eu.total || 0, url: eu.url } : null);
    if (!parts.length) return { estimate: null, confidence: 'none', source: 'none', comps: local?.count || 0, eu: euInfo };

    const wSum = parts.reduce((a, p) => a + p.w, 0);
    const value = parts.reduce((a, p) => a + p.v * p.w, 0) / wSum;
    const evidence = (local?.count || 0) + (euM?.count || 0) * 0.6;
    const confidence = evidence >= 10 ? 'high' : evidence >= 4 ? 'medium' : 'low';
    const source = [local && 'comps', euM && 'eu', ref && plausible && 'reference'].filter(Boolean).join('+') || 'reference';

    const spread = { high: 0.08, medium: 0.12, low: 0.18 }[confidence];
    return {
      estimate: Math.round(value),
      low: Math.round(value * (1 - spread)),
      high: Math.round(value * (1 + spread)),
      delta: car.price ? (car.price - value) / value : null,
      confidence,
      source,
      plausible,
      comps: local?.count || 0,
      eu: euInfo,
      referenceKey: ref?.key || null,
      nextYearValue: car.year ? Math.round(value * retained(CURRENT_YEAR - car.year + 1) / retained(CURRENT_YEAR - car.year)) : null
    };
  }

  return { estimate, retained, projectYear, mileageFactor, EXPECTED_KM_PER_YEAR };
})();
