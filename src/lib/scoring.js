// src/lib/scoring.js – turns a parsed listing into a 0–100 deal score.
//
// The score is a weighted average of six category scores (each 0–100). Serious red flags
// found in the listing text cap the final score no matter how good the rest looks.
CDS.scoring = (() => {
  const { CURRENT_YEAR, clamp, interp, eur, pct } = CDS.util;

  const CATEGORIES = [
    { id: 'price', label: 'Price vs market', icon: '€' },
    { id: 'mileage', label: 'Mileage', icon: '⟲' },
    { id: 'history', label: 'History & owners', icon: '⧗' },
    { id: 'reliability', label: 'Model reliability', icon: '⚙' },
    { id: 'age', label: 'Age & condition', icon: '◷' },
    { id: 'market', label: 'Resale & parts', icon: '⇄' }
  ];

  const PROFILES = {
    balanced: { label: 'Balanced', weights: { price: 30, mileage: 20, history: 15, reliability: 15, age: 10, market: 10 } },
    bargain: { label: 'Bargain hunter', weights: { price: 45, mileage: 15, history: 10, reliability: 10, age: 10, market: 10 } },
    reliable: { label: 'Reliability first', weights: { price: 15, mileage: 20, history: 20, reliability: 30, age: 10, market: 5 } },
    resale: { label: 'Resale value', weights: { price: 25, mileage: 15, history: 15, reliability: 10, age: 15, market: 20 } }
  };

  // Phrases sellers use in the free-text and "Stanje" sections (Slovene, with common misspellings).
  // A phrase preceded by a negation ("vozilo NI BILO karambolirano", "brez rje") means the opposite:
  // rules with `neg` then count as that positive statement instead; others are simply ignored.
  const TEXT_RULES = [
    { id: 'damage', re: /karambol\p{L}*|poškodovan\p{L}*|poskodovan\p{L}*|po nesreči|po nesreci|toč[aeio](?!\p{L})|toc[aeio](?!\p{L})|toča poškodb\p{L}*/iu, kind: 'red', cat: 'history', pts: -45, cap: 45,
      label: 'Listing mentions accident or body damage', neg: { kind: 'good', pts: 6, label: 'Seller states it was never in an accident' } },
    { id: 'scratches', re: /prask[aeio]\p{L}*|odrgnin\p{L}*|udrtin\p{L}*|udarnin\p{L}*|poškodb\p{L}*|poskodb\p{L}*/iu, kind: 'warn', cat: 'age', pts: -6,
      label: 'Minor body damage mentioned (scratches, dents)', neg: { kind: 'good', pts: 3, label: 'Seller states no damage' } },
    { id: 'faulty', re: /v okvari|ne vžge|ne vzge|nevozn\w*|ne vozi|(prodam|samo|primeren|primerno|vozilo|avto) za dele|za rezervne dele|okvara motorja|okvara menjalnika/i, kind: 'red', cat: 'history', pts: -50, cap: 35, label: 'Listing says the car is faulty or not drivable' },
    { id: 'papers', re: /brez prometnega|brez dokumentov|brez papirjev|tuje tablice/i, kind: 'red', cat: 'history', pts: -25, cap: 55, label: 'Paperwork / registration problem mentioned' },
    { id: 'deregistered', re: /odjavljen\p{L}*/iu, kind: 'warn', cat: 'history', pts: -4, label: 'Car is deregistered – budget for inspection and re-registration' },
    { id: 'service', re: /servisn[ae] knjig\w*|servisno knjigo|redno servisiran\w*|servisiran\w* v pooblašč\w*|servisiran\w* pri/i, kind: 'good', cat: 'history', pts: 12,
      label: 'Service history documented', neg: { kind: 'warn', pts: -8, label: 'No service book' } },
    { id: 'firstOwner', re: /prvi lastnik|1\. lastnik|en lastnik|1 lastnik/i, kind: 'good', cat: 'history', pts: 6, label: 'Seller says first owner' },
    { id: 'garage', re: /garažiran\w*|garaziran\w*/i, kind: 'good', cat: 'age', pts: 4, label: 'Kept in a garage', neg: { kind: 'info', pts: 0, label: 'Not kept in a garage' } },
    { id: 'warranty', re: /garancij\w*|jamstv\w*/i, kind: 'good', cat: 'history', pts: 8, label: 'Warranty offered' },
    { id: 'slovene', re: /slovensko poreklo|slovenskega porekla|kupljen\w* v sloveniji|slo poreklo/i, kind: 'good', cat: 'history', pts: 6, label: 'Originally sold in Slovenia' },
    { id: 'belt', re: /(menjan|zamenjan|nov)[a-zčšž]*\s+(zobat[a-zčšž]*\s+)?jermen|jermen (je )?(menjan|zamenjan)|(menjana|nova) veriga/i, kind: 'good', cat: 'reliability', pts: 8, label: 'Timing belt/chain recently replaced' },
    { id: 'tyres', re: /nov[ae]? (zimske |letne )?gume|nove pnevmatike/i, kind: 'good', cat: 'age', pts: 3, label: 'New tyres' },
    { id: 'import', re: /\buvoz\w*|uvožen\w*|uvozen\w*|iz nemčije|iz nemcije|iz italije|iz avstrije/i, kind: 'info', cat: 'history', pts: -4, label: 'Imported – verify history abroad (carVertical / Autodna)' },
    // Dashboard warnings only – "stropna lučka" (ceiling light) is equipment, not a fault.
    { id: 'light', re: /(gori|sveti|svetl|prižgan|prizgan|javlja)\p{L}* (kontrolna )?lu[čc]k\p{L}*|lu[čc]k\p{L}* (za |motor|abs|airbag|olj|sve[čc]|check|epc|dpf|esp|gori|sveti)\p{L}*|check engine|napaka na/iu, kind: 'warn', cat: 'reliability', pts: -12, label: 'Warning light or fault mentioned' },
    { id: 'rust', re: /\brja\b|\brje\b|rjav[ai]\b|korozij\w*/i, kind: 'warn', cat: 'age', pts: -12, label: 'Rust/corrosion mentioned', neg: { kind: 'good', pts: 3, label: 'Seller states no rust' } },
    { id: 'leak', re: /pušča|pusca|puščanje|kaplja olje/i, kind: 'warn', cat: 'reliability', pts: -10, label: 'Leak mentioned' },
    { id: 'repairs', re: /potrebn[oa] (popravil|menjav|servis)\w*|potrebuje (popravil|menjav|servis)\w*/i, kind: 'warn', cat: 'reliability', pts: -12, label: 'Seller says repairs are needed' },
    { id: 'asIs', re: /brez garancije|kupljeno videno|videno.kupljeno/i, kind: 'info', cat: 'history', pts: -3, label: 'Sold as seen, no warranty' },
    { id: 'disclaimer', re: /napake\W+ne\W+odgovarjamo|ne odgovarjamo za|pridržujemo pravico do napak/i, kind: 'info', cat: 'history', pts: 0, label: 'Seller disclaims errors in the listing – verify every figure' }
  ];

  // "ni bilo", "brez", "nikoli" ... within the two words before a phrase negate it.
  const NEGATION = /(?:^|[\s,(/])(ni|niso|ne|nikoli|brez|nobene|noben|nima|nimajo)\s+(?:\S+\s+){0,2}$/i;

  // Dealer advertising for their own services ("kleparsko ličarske storitve", "popravilo poškodb",
  // "zavarovanje vozil") says nothing about this car, so warnings are not taken from such lines.
  const BOILERPLATE = /nudimo|ponujamo|storitv|servisiranje vozil|kleparsk|ličarsk|licarsk|vulkanizer|popravil\p{L}* (vozil|poškodb|karambol)|odprav\p{L}* poškodb|zavarovanj|kasko|leasing|lizing|kredit|odkup|menjava staro|financiranj/iu;

  // Every occurrence of a rule in the text, with the line it came from (the quote) and whether it is negated.
  // Matches must start a word: "toča" (hail) must not fire inside "istočasno".
  function findPhrases(rule, text) {
    const out = [];
    const re = new RegExp(rule.re.source, 'giu');
    for (const rawLine of String(text || '').split('\n')) {
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if (!line) continue;
      if (rule.kind !== 'good' && BOILERPLATE.test(line)) continue;
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line))) {
        if (re.lastIndex === m.index) re.lastIndex++;
        const before = line.slice(Math.max(0, m.index - 30), m.index);
        // "nepoškodovan" / "nekarambolirano" written as one word: a "ne" prefix negates.
        const prefixNe = /(?:^|[^\p{L}])ne$/iu.test(before);
        if (/\p{L}$/u.test(before) && !prefixNe) continue;
        const negated = prefixNe || NEGATION.test(before);
        const quote = line.length > 110 ? `…${line.slice(Math.max(0, m.index - 40), m.index + 70).trim()}…` : line;
        out.push({ match: m[0], quote, negated });
      }
    }
    return out;
  }

  function categoryScorePrice(car, market, out) {
    if (!car.price) { out.notes.push({ kind: 'warn', text: 'Price missing.' }); return 50; }
    if (!market || market.estimate === null) {
      out.notes.push({ kind: 'info', text: 'No market reference for this model yet – browse its search results to teach DealScore.' });
      return 62;
    }
    const d = market.delta;
    let s = interp(d, [[-0.45, 52], [-0.3, 78], [-0.18, 100], [-0.08, 96], [0, 86], [0.07, 70], [0.15, 50], [0.25, 32], [0.4, 15]]);
    const diff = car.price - market.estimate;
    if (d < -0.3) out.notes.push({ kind: 'warn', text: `${pct(d)} below market – unusually cheap. Ask why; check for damage or scams.` });
    else if (d <= -0.05) out.notes.push({ kind: 'good', text: `${eur(-diff)} below the estimated market value (${pct(d)}).` });
    else if (d <= 0.05) out.notes.push({ kind: 'good', text: `Priced in line with the market (${pct(d)}).` });
    else out.notes.push({ kind: d > 0.15 ? 'warn' : 'info', text: `${eur(diff)} above the estimated market value (${pct(d)}).` });
    if (market.eu?.count) {
      const e = market.eu;
      const d2 = (car.price - e.estimate) / e.estimate;
      out.notes.push({ kind: 'info', text: `EU market: ${e.count} similar cars on AutoScout24, typically ${eur(e.estimate)} for this year/km (${pct(d2)} vs this price).` });
    }
    // Uncertain estimates should not swing the score too hard.
    const pull = { high: 0, medium: 0.15, low: 0.45 }[market.confidence] ?? 0.5;
    if (market.confidence === 'low') out.notes.push({ kind: 'info', text: 'Market estimate has low confidence (variant match is approximate).' });
    return s * (1 - pull) + 65 * pull;
  }

  function categoryScoreMileage(car, out, details) {
    if (!car.mileage && car.mileage !== 0) { out.notes.push({ kind: 'warn', text: 'Mileage not listed.' }); return 55; }
    if (!car.year) return 65;
    const age = Math.max(CURRENT_YEAR - car.year + (car.month ? (12 - car.month) / 12 : 0.5) - 0.5, 0.5);
    const kmPerYear = Math.round(car.mileage / age);
    details.kmPerYear = kmPerYear;
    let s = interp(kmPerYear, [[0, 90], [6000, 96], [12000, 100], [18000, 92], [25000, 74], [35000, 50], [50000, 28]]);
    if (car.mileage > 300000) s -= 22;
    else if (car.mileage > 220000) s -= 12;
    else if (car.mileage > 160000) s -= 5;

    if (kmPerYear < 4000 && age >= 6) {
      s -= 14;
      out.notes.push({ kind: 'warn', text: `Only ${CDS.util.num(kmPerYear)} km/year for a ${Math.round(age)}-year-old car – check the odometer history.` });
      out.flags.push({ kind: 'warn', text: 'Possible odometer rollback – request service records' });
    } else if (car.fuel === 'diesel' && kmPerYear < 9000 && age >= 3) {
      s -= 8;
      out.notes.push({ kind: 'warn', text: 'Diesel with mostly short trips – DPF/EGR clogging risk.' });
    } else if (kmPerYear > 30000) {
      out.notes.push({ kind: 'warn', text: `Heavy use: ${CDS.util.num(kmPerYear)} km/year.` });
    } else if (kmPerYear > 22000) {
      out.notes.push({ kind: 'info', text: `Above-average use: ${CDS.util.num(kmPerYear)} km/year (fine if mostly motorway).` });
    } else {
      out.notes.push({ kind: 'good', text: `Normal usage: ${CDS.util.num(kmPerYear)} km/year.` });
    }
    return clamp(s, 0, 100);
  }

  function categoryScoreHistory(car, out) {
    let s;
    if (car.owners === 1) { s = 98; out.notes.push({ kind: 'good', text: 'One owner.' }); }
    else if (car.owners === 2) { s = 84; }
    else if (car.owners === 3) { s = 68; out.notes.push({ kind: 'info', text: '3 previous owners.' }); }
    else if (car.owners >= 4) { s = 48; out.notes.push({ kind: 'warn', text: `${car.owners} previous owners.` }); }
    else { s = 70; out.notes.push({ kind: 'info', text: 'Number of owners not stated – ask the seller.' }); }
    if (car.condition === 'damaged') { s -= 40; out.flags.push({ kind: 'red', text: 'Listed as a damaged vehicle' }); }
    return s;
  }

  // Known problems: curated, engine/year-aware list first, the generic DB as a fallback.
  // Known problems come only from the curated, engine/year-aware database. The old generic
  // issues.json was mostly filler ("Mechanical wear", "Engine reliable") and is no longer shown.
  function findIssues(car) {
    const curated = CDS.knownIssues.match(car);
    if (!curated) return { source: 'none', key: null, items: [], positives: [] };
    return { source: 'curated', key: curated.key, items: curated.items, positives: curated.positives };
  }

  function categoryScoreReliability(car, issues, out) {
    if (issues.source === 'none') { out.notes.push({ kind: 'info', text: 'No documented problems on file for this model.' }); return 80; }
    // Expensive, confirmed problems weigh most; "possible" ones (engine/gearbox not confirmed) count half.
    const weight = issues.items.reduce((sum, it) => sum + it.sev * (it.status === 'likely' ? 1 : 0.5), 0);
    let s = 98 - weight * 5.5;
    if (issues.positives.length) s += 5;
    if ((car.mileage || 0) > 150000 && issues.items.some(it => it.sev === 3 && it.status === 'likely')) s -= 6;

    const severe = issues.items.filter(it => it.sev === 3 && it.status === 'likely');
    severe.forEach(it => out.notes.push({ kind: 'warn', text: `Known expensive issue: ${it.title}${it.cost ? ` (${it.cost})` : ''}` }));
    const rest = issues.items.length - severe.length;
    if (rest) out.notes.push({ kind: 'info', text: `${rest} other known issue${rest === 1 ? '' : 's'} for this model/engine.` });
    if (!issues.items.length) out.notes.push({ kind: 'good', text: 'No well-known problems for this engine/year.' });
    issues.positives.forEach(p => out.notes.push({ kind: 'good', text: p }));
    return clamp(s, 30, 100);
  }

  function categoryScoreAge(car, out) {
    if (!car.year) return 60;
    const age = CURRENT_YEAR - car.year;
    let s = interp(age, [[0, 100], [3, 96], [6, 84], [10, 66], [15, 48], [20, 35], [30, 30]]);
    if (car.inspection) {
      const monthsLeft = (car.inspection.year - CURRENT_YEAR) * 12 + ((car.inspection.month || 6) - (new Date().getMonth() + 1));
      if (monthsLeft < 0) { s -= 12; out.notes.push({ kind: 'warn', text: 'Technical inspection (tehnični pregled) has expired.' }); }
      else if (monthsLeft < 3) { s -= 5; out.notes.push({ kind: 'info', text: 'Technical inspection due within 3 months.' }); }
      else if (monthsLeft >= 12) { s += 4; out.notes.push({ kind: 'good', text: `Inspection valid until ${car.inspection.month ? car.inspection.month + '/' : ''}${car.inspection.year}.` }); }
    }
    if (car.euroClass && car.euroClass <= 4 && car.fuel === 'diesel') {
      s -= 8;
      out.notes.push({ kind: 'warn', text: `Euro ${car.euroClass} diesel – may face low-emission-zone limits and weak resale.` });
    }
    return clamp(s, 0, 100);
  }

  function categoryScoreMarket(car, popularity, out) {
    const count = popularity?.value || 0;
    if (!count) { out.notes.push({ kind: 'info', text: 'Rare in Slovenia – parts and resale may take longer.' }); return 58; }
    const s = interp(Math.log10(count), [[1, 50], [2, 62], [3, 80], [3.7, 95], [4.2, 100]]);
    out.notes.push({
      kind: count > 2000 ? 'good' : 'info',
      text: `${CDS.util.num(count)} registered in Slovenia – ${count > 2000 ? 'easy to service and resell' : count > 300 ? 'reasonably common' : 'uncommon'}.`
    });
    return s;
  }

  function verdictFor(score) {
    if (score >= 85) return { id: 'great', label: 'Great deal', tone: 'great' };
    if (score >= 72) return { id: 'good', label: 'Good deal', tone: 'good' };
    if (score >= 58) return { id: 'fair', label: 'Fair – check carefully', tone: 'fair' };
    if (score >= 42) return { id: 'caution', label: 'Caution', tone: 'caution' };
    return { id: 'risky', label: 'Risky', tone: 'risky' };
  }

  function evaluate(car, { comps = [], eu = null, profile = 'balanced', customWeights = null } = {}) {
    const weights = customWeights || PROFILES[profile]?.weights || PROFILES.balanced.weights;
    const market = CDS.market.estimate(car, comps, eu);
    const issues = findIssues(car);
    const popularity = CDS.data.getPopularity(car.make, car.model, car.variant);
    const details = {};
    const flags = [];
    const textHits = [];

    const per = {};
    const run = (id, fn) => {
      const out = { notes: [], flags };
      per[id] = { score: fn(out), notes: out.notes };
    };
    run('price', out => categoryScorePrice(car, market, out));
    run('mileage', out => categoryScoreMileage(car, out, details));
    run('history', out => categoryScoreHistory(car, out));
    run('reliability', out => categoryScoreReliability(car, issues, out));
    run('age', out => categoryScoreAge(car, out));
    run('market', out => categoryScoreMarket(car, popularity, out));

    // Listing text: adjust categories and collect flags.
    let cap = 100;
    const text = [car.description, car.starostRaw, ...(car.conditionNotes || [])].filter(Boolean).join('\n');
    for (const rule of TEXT_RULES) {
      const found = findPhrases(rule, text);
      if (!found.length) continue;
      const positive = found.filter(f => !f.negated);
      let hit;
      if (positive.length) hit = { ...rule, match: positive[0].match, quote: positive[0].quote };
      else if (rule.neg) hit = { ...rule, ...rule.neg, cap: null, negated: true, match: found[0].match, quote: found[0].quote };
      else continue;
      textHits.push(hit);
      per[rule.cat].score = clamp(per[rule.cat].score + hit.pts, 0, 100);
      per[rule.cat].notes.push({ kind: hit.kind === 'red' ? 'warn' : hit.kind, text: hit.label });
      if (hit.kind === 'red' || hit.kind === 'warn') flags.push({ kind: hit.kind, text: hit.label, quote: hit.quote });
      if (hit.cap) cap = Math.min(cap, hit.cap);
    }

    // An unresolved, engine-threatening known issue rules out "Great deal" until the fix is proven.
    const severe = issues.items.filter(i => i.status === 'likely' && i.sev === 3);
    const fixMentioned = textHits.some(h => h.cat === 'reliability' && h.kind === 'good');
    if (severe.length && !fixMentioned) {
      cap = Math.min(cap, 82);
      per.reliability.notes.push({ kind: 'info', text: 'Score limited to 82 until the seller proves the known issue was fixed.' });
    }

    const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
    let score = CATEGORIES.reduce((sum, c) => sum + per[c.id].score * (weights[c.id] || 0), 0) / totalW;
    // Far below a well-supported market price is a scam/damage warning sign.
    if ((market.confidence === 'high' || market.confidence === 'medium') && market.delta !== null && market.delta < -0.35) cap = Math.min(cap, 70);
    score = Math.round(clamp(Math.min(score, cap), 0, 100));

    const categories = CATEGORIES.map(c => ({ ...c, score: Math.round(per[c.id].score), weight: weights[c.id] || 0, notes: per[c.id].notes }));
    const positives = categories.flatMap(c => c.notes.filter(n => n.kind === 'good').map(n => n.text));
    const warnings = categories.flatMap(c => c.notes.filter(n => n.kind === 'warn').map(n => n.text));

    return {
      score,
      verdict: verdictFor(score),
      categories,
      market,
      issues: issues.items,
      issuesSource: issues.source,
      issuesKey: issues.key,
      popularity: popularity?.value || 0,
      flags,
      textHits,
      positives,
      warnings,
      details,
      capped: cap < 100 ? cap : null,
      summary: summaryLine(car, market, details)
    };
  }

  function summaryLine(car, market, details) {
    const bits = [];
    if (market.estimate && market.delta !== null) {
      const diff = car.price - market.estimate;
      bits.push(Math.abs(market.delta) < 0.03 ? 'at market price' : `${eur(Math.abs(diff))} ${diff < 0 ? 'below' : 'above'} market`);
    }
    if (details.kmPerYear) bits.push(`${Math.round(details.kmPerYear / 1000)}k km/yr`);
    if (car.owners) bits.push(`${car.owners} owner${car.owners > 1 ? 's' : ''}`);
    return bits.join(' · ');
  }

  // Lightweight version used for search-results badges (no text, fewer fields).
  function quick(car, opts) {
    return evaluate({ ...car, description: '' }, opts);
  }

  return { evaluate, quick, verdictFor, findPhrases, CATEGORIES, PROFILES, TEXT_RULES };
})();
