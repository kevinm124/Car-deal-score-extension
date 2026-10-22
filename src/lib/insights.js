// src/lib/insights.js – practical advice built on top of a score result:
// a tailored inspection checklist, a negotiation plan, yearly running costs and
// ready-to-send questions for the seller.
CDS.insights = (() => {
  const { CURRENT_YEAR, roundTo, eur, clamp } = CDS.util;

  function checklist(car, result) {
    const items = [];
    const add = (id, group, text, why = '') => items.push({ id, group, text, why });

    add('vin', 'Papers', 'Check the VIN matches the registration (prometno dovoljenje) and the car body', 'Rules out cloned or stolen cars');
    add('history', 'Papers', 'Run a history report (carVertical, Autodna) for mileage and accidents', 'Catches odometer fraud and hidden damage');
    add('service', 'Papers', 'See the service book and invoices – look for gaps in the mileage', '');
    add('lien', 'Papers', 'Confirm there is no lien or leasing on the car (ask for the bank release letter)', 'You inherit unpaid leasing otherwise');

    add('cold', 'Engine', 'Start the engine cold – listen for rattles, look for smoke', 'Many faults hide once warm');
    add('leaks', 'Engine', 'Look under the car and engine bay for oil/coolant leaks', '');
    add('obd', 'Engine', 'Read fault codes with an OBD scanner (or ask a mechanic)', 'Cleared codes show as "not ready" monitors');

    add('panels', 'Body', 'Check panel gaps and paint thickness – uneven = repaired', '');
    add('rust', 'Body', 'Inspect wheel arches, sills and under the boot carpet for rust', '');
    add('tyres', 'Body', 'Tyre tread ≥ 3 mm and even wear (uneven = alignment/suspension)', '');

    add('drive', 'Test drive', 'Test drive 20+ min incl. motorway – brakes, steering pull, noises over bumps', '');
    add('electrics', 'Test drive', 'Try every button: windows, A/C (cold?), lights, infotainment', '');

    if (car.fuel === 'diesel') {
      add('dpf', 'Fuel-specific', 'Ask when the DPF was last regenerated/cleaned; check for limp mode', 'Short-trip diesels clog DPF/EGR');
      add('injectors', 'Fuel-specific', 'Listen for injector knock and check for black smoke under load', '');
    }
    if (car.fuel === 'electric' || car.fuel === 'plugin') {
      add('soh', 'Fuel-specific', 'Request a battery State-of-Health (SoH) certificate', 'Battery is most of the car’s value');
      add('charge', 'Fuel-specific', 'Test both AC and DC fast charging', '');
    }
    if (car.fuel === 'hybrid') add('hybrid', 'Fuel-specific', 'Check hybrid battery health and that EV mode engages', '');
    if (car.fuel === 'lpg') add('lpg', 'Fuel-specific', 'Ask for the LPG installation certificate and tank expiry date', '');

    if (/dsg|automatic|cvt/.test(car.gearbox || '')) {
      add('gearbox', 'Gearbox', 'Automatic: check for jerky shifts from standstill and when cold; ask when the gearbox oil was changed', 'DSG mechatronics repairs cost €1,500+');
    } else {
      add('clutch', 'Gearbox', 'Manual: clutch should bite mid-pedal; listen for dual-mass flywheel rattle at idle', '');
    }

    if ((car.mileage || 0) > 110000) add('belt', 'Maintenance', 'Ask for proof of timing belt/chain replacement', 'Snapped belt = destroyed engine');
    if ((car.mileage || 0) > 150000) add('susp', 'Maintenance', 'Check suspension bushes, shocks and brake discs – high-mileage wear items', '');
    if (car.year && CURRENT_YEAR - car.year >= 8) add('rubber', 'Maintenance', 'Look for cracked hoses, perished rubber and old battery', '');

    (result.issues || []).forEach(issue => add(`issue-${issue.id}`, 'Known model issues',
      issue.check ? `${issue.title}: ${issue.check}` : `Check for: ${issue.title}`,
      issue.cost ? `Repair ${issue.cost}` : 'Reported on this model'));

    if (result.textHits.some(h => h.id === 'import')) add('import', 'Papers', 'Imported: get foreign service records and check foreign history databases', '');
    if (car.sellerType === 'private') add('owner', 'Papers', 'Make sure the seller is the registered owner (name on the papers)', '');
    return items;
  }

  // How much to offer. Each weakness is a reason the seller should move on price.
  function negotiation(car, result) {
    if (!car.price) return null;
    const m = result.market;
    const leverage = [];
    let cut = 0;
    const lev = (text, amount) => { leverage.push({ text, amount: Math.round(amount) }); cut += amount; };

    if (m.estimate && m.delta > 0.02) lev(`Priced ${eur(car.price - m.estimate)} above estimated market value`, car.price - m.estimate);
    const eu = m.eu;
    if (eu?.count >= 5 && car.price > eu.estimate + 1000) {
      lev(`${eu.count} similar cars in the EU go for about ${eur(eu.estimate)} – even with ~€1,000 import costs this is ${eur(car.price - eu.estimate - 1000)} more`, (car.price - eu.estimate - 1000) * 0.5);
    }
    if ((car.mileage || 0) > 150000) lev('High mileage – wear items (suspension, clutch, brakes) due soon', car.price * 0.03);
    if ((result.details.kmPerYear || 0) > 25000) lev('Heavy yearly usage', car.price * 0.02);
    if ((car.owners || 0) >= 3) lev(`${car.owners} previous owners`, car.price * 0.025);
    if (!car.owners) lev('Owner count not disclosed', car.price * 0.01);
    const serious = result.issues.filter(i => i.sev >= 2 && i.status === 'likely');
    serious.forEach(i => lev(`Known ${i.sev === 3 ? 'expensive ' : ''}issue: ${i.title}${i.cost ? ` (${i.cost})` : ''} – ask for proof it was fixed`,
      Math.min(car.price * (i.sev === 3 ? 0.04 : 0.015), i.sev === 3 ? 1500 : 500)));
    if (car.inspection && (car.inspection.year < CURRENT_YEAR || (car.inspection.year === CURRENT_YEAR && (car.inspection.month || 12) <= new Date().getMonth() + 3))) lev('Technical inspection expired or due', 150);
    if (!result.textHits.some(h => h.id === 'service' && !h.negated)) lev('No documented service history mentioned', car.price * 0.02);
    if (car.sellerType === 'dealer') leverage.push({ text: 'Dealer – ask for a warranty or free service instead of (or as well as) a discount', amount: 0 });

    const step = car.price > 20000 ? 250 : car.price > 5000 ? 100 : 50;
    const floor = car.price * 0.8;
    const target = roundTo(clamp(car.price - cut * 0.6, floor, car.price), step);
    const opening = roundTo(clamp(target - car.price * 0.04, floor * 0.95, target), step);
    const walkAway = Math.min(car.price, roundTo(m.estimate ? Math.max(m.high, target) : car.price * 0.98, step));
    return { opening, target, walkAway, leverage, saving: car.price - target };
  }

  const FUEL_DEFAULT_L100 = { petrol: 7, diesel: 5.8, hybrid: 4.8, lpg: 9.5, plugin: 3, electric: 17, null: 7 };

  function costs(car, result, settings) {
    const kmYear = settings.kmPerYear || 15000;
    const fuel = car.fuel || 'petrol';
    const consumption = car.consumption || FUEL_DEFAULT_L100[fuel] || 7;
    const unitPrice = {
      petrol: settings.petrolPrice, diesel: settings.dieselPrice, hybrid: settings.petrolPrice,
      plugin: settings.petrolPrice * 0.6 + settings.kwhPrice * 0.4 * 5, lpg: settings.lpgPrice, electric: settings.kwhPrice
    }[fuel] ?? settings.petrolPrice;
    const energy = kmYear / 100 * consumption * unitPrice;

    const kw = car.powerKw || 85;
    const premium = /BMW|AUDI|MERCEDES|PORSCHE|LAND ROVER|JAGUAR|VOLVO|LEXUS|TESLA/i.test(car.make || '');
    const age = car.year ? CURRENT_YEAR - car.year : 8;
    const insurance = 230 + kw * 1.9 + (car.price || 0) * (age < 5 ? 0.028 : 0.006);   // AO + partial kasko for newer cars
    const registration = 60 + kw * 0.6 + 117.5;   // reg. fees + road-use tax approximation + vignette
    const maintenance = (premium ? 1.45 : 1) * (250 + age * 30 + Math.min((car.mileage || 0) / 1000, 300) * 1.6) + result.issues.reduce((a, i) => a + (i.status === 'likely' ? i.sev * 40 : i.sev * 15), 0);
    const depreciation = result.market.estimate && result.market.nextYearValue ? Math.max(result.market.estimate - result.market.nextYearValue, 0) : (car.price || 0) * 0.1;

    const rows = [
      { id: 'energy', label: fuel === 'electric' ? 'Charging' : 'Fuel', value: energy, hint: `${consumption} ${fuel === 'electric' ? 'kWh' : 'l'}/100 km × ${CDS.util.num(kmYear)} km` },
      { id: 'insurance', label: 'Insurance (est.)', value: insurance, hint: age < 5 ? 'Liability + partial casco' : 'Liability' },
      { id: 'registration', label: 'Registration + vignette', value: registration, hint: 'Yearly registration, road tax, vignette' },
      { id: 'maintenance', label: 'Maintenance & repairs', value: maintenance, hint: premium ? 'Premium brand parts pricing' : 'Average for age/mileage' },
      { id: 'depreciation', label: 'Value loss', value: depreciation, hint: 'Estimated drop in value over the next year' }
    ];
    const total = rows.reduce((a, r) => a + r.value, 0);
    return { rows, total, perMonth: total / 12, perKm: total / kmYear };
  }

  function sellerMessage(car, result) {
    const qs = [
      ['Koliko lastnikov je imelo vozilo in ali je slovenskega porekla?', 'How many owners has it had, and was it first sold in Slovenia?'],
      ['Ali imate servisno knjigo oz. račune za servise?', 'Do you have the service book or service invoices?'],
      ['Ali je bilo vozilo kdaj poškodovano ali karambolirano?', 'Has the car ever been damaged or in an accident?']
    ];
    if ((car.mileage || 0) > 100000) qs.push(['Kdaj je bil nazadnje zamenjan zobati jermen / veriga?', 'When was the timing belt/chain last replaced?']);
    if (/dsg|automatic|cvt/.test(car.gearbox || '')) qs.push(['Kdaj je bilo zamenjano olje v menjalniku?', 'When was the gearbox oil last changed?']);
    if (car.fuel === 'diesel') qs.push(['Ali so bile kdaj težave z DPF filtrom ali EGR ventilom?', 'Any problems with the DPF or EGR valve?']);
    if (car.fuel === 'electric' || car.fuel === 'plugin') qs.push(['Ali lahko posredujete certifikat o stanju baterije (SoH)?', 'Can you share a battery SoH certificate?']);
    qs.push(['Ali je možen pregled pri mojem mehaniku?', 'Can I have it inspected by my mechanic?']);

    const sl = `Pozdravljeni,\n\nzanima me vaš oglas za ${car.title || [car.make, car.model].join(' ')}${car.price ? ` (${eur(car.price)})` : ''}. Imam nekaj vprašanj:\n\n${qs.map((q, i) => `${i + 1}. ${q[0]}`).join('\n')}\n\nHvala in lep pozdrav`;
    return { questions: qs, text: sl };
  }

  function report(car, result, nego) {
    const lines = [
      `${car.title || `${car.make} ${car.model}`}`,
      `${car.url || ''}`,
      ``,
      `DealScore: ${result.score}/100 – ${result.verdict.label}`,
      `Price: ${eur(car.price)}${result.market.estimate ? ` | est. market ${eur(result.market.estimate)} (${eur(result.market.low)}–${eur(result.market.high)})` : ''}`,
      `Year ${car.year || '?'} | ${car.mileage ? CDS.util.num(car.mileage) + ' km' : 'km ?'} | owners ${car.owners || '?'} | ${car.fuel || ''} ${car.gearbox || ''}`,
      ``,
      ...result.categories.map(c => `${c.label.padEnd(20)} ${String(c.score).padStart(3)}`),
      ``
    ];
    if (result.flags.length) lines.push('Flags:', ...result.flags.map(f => ` ! ${f.text}`), '');
    if (result.issues.length) lines.push('Known issues:', ...result.issues.map(i => ` - ${i.title}${i.status === 'possible' ? ' (if this engine/gearbox)' : ''}${i.cost ? ` – ${i.cost}` : ''}`), '');
    if (nego) lines.push(`Offer: open ${eur(nego.opening)}, target ${eur(nego.target)}, walk away above ${eur(nego.walkAway)}`);
    lines.push('', 'Generated by DealScore for avto.net – informational only.');
    return lines.join('\n');
  }

  // Condition boxes sellers tick in the "Stanje" section, with an English meaning.
  const CONDITION_MEANING = [
    [/ni bil[oa]? karambol|nepoškodovan|brez poškodb/i, 'good', 'Never in an accident'],
    [/karambol|poškodovan/i, 'warn', 'Accident damage'],
    [/servisn[ae] knjig.*potrjen/i, 'good', 'Service book, stamped'],
    [/servisn[ae] knjig/i, 'good', 'Service book'],
    [/slovensko poreklo/i, 'good', 'First sold in Slovenia'],
    [/tuje poreklo|uvoz/i, 'info', 'Imported'],
    [/navodila za uporabo/i, 'info', 'Owner’s manual in Slovene'],
    [/1\. lastnik|prvi lastnik/i, 'good', 'First owner'],
    [/garažiran/i, 'good', 'Garage-kept'],
    [/nekadilsk/i, 'good', 'Non-smoker car'],
    [/rezervni ključ|2 ključa|dva ključa/i, 'good', 'Spare key'],
    [/garancij|jamstv/i, 'good', 'Warranty'],
    [/v okvari|nevozn/i, 'warn', 'Faulty / not drivable'],
    [/ohranjen/i, 'good', 'Well kept'],
    [/kupljen.*pri nas|kupljen.*v sloveniji/i, 'good', 'Bought new from this dealer / in Slovenia']
  ];

  const NOTABLE_EQUIPMENT = [
    [/navigacij/i, 'Navigation'],
    [/panoram/i, 'Panoramic roof'],
    [/usnje|usnjen/i, 'Leather'],
    [/gretje sede|ogrevan\w* sede|gretje prednjih sede/i, 'Heated seats'],
    [/aktivni tempomat|adaptiv\w* tempomat|\bacc\b/i, 'Adaptive cruise'],
    [/vzvratna kamera|parkirna kamera|kamera 360|360.? kamer/i, 'Parking camera'],
    [/keyless/i, 'Keyless'],
    [/matrix|led žaromet/i, 'LED headlights'],
    [/xenon/i, 'Xenon lights'],
    [/head.?up/i, 'Head-up display'],
    [/vlečn\w* kljuk/i, 'Tow bar'],
    [/carplay|android auto/i, 'CarPlay / Android Auto'],
    [/4x4|štirikolesn|quattro|4motion|xdrive|4matic|awd/i, 'All-wheel drive'],
    [/mrtv\w* kot|blind.?spot/i, 'Blind-spot assist'],
    [/ohranjanj\w* vozn\w* pasu|spremembe voznega pasu|lane/i, 'Lane assist'],
    [/el\. (odpiranje|zapiranje)? ?prtljažn|električn\w* prtljažn/i, 'Electric tailgate'],
    [/hi-?fi|harman|bose|bang|burmester|meridian/i, 'Premium audio'],
    [/zimske gume|letne gume|komplet gum/i, 'Extra set of tyres']
  ];

  // What the listing itself says – quotes from the seller's ticked boxes and comment,
  // plus facts and equipment, each with an English meaning.
  function listingHighlights(car, result) {
    const items = [];
    const seen = new Set();
    const add = (kind, text, quote) => {
      if (seen.has(text)) return;
      seen.add(text);
      items.push({ kind, text, quote });
    };

    (car.conditionNotes || []).forEach(note => {
      const hit = CONDITION_MEANING.find(([re]) => re.test(note));
      add(hit ? hit[1] : 'info', hit ? hit[2] : note, note);
    });
    // Phrases found in the seller's comment (not already covered by ticked boxes).
    result.textHits.filter(h => h.quote && h.id !== 'disclaimer').forEach(h => {
      const kind = h.kind === 'red' ? 'warn' : h.kind;
      const covered = (car.conditionNotes || []).some(n => n.replace(/\s+/g, ' ').trim() === h.quote);
      if (!covered) add(kind, h.label, h.quote);
    });
    if (car.starostRaw && /garancij|jamstv/i.test(car.starostRaw)) add('good', 'Warranty', car.starostRaw);
    if (car.inspection) add('info', `Technical inspection valid until ${car.inspection.month ? car.inspection.month + '/' : ''}${car.inspection.year}`, null);
    if (car.euroClass) add('info', `Euro ${car.euroClass}${car.consumption ? ` · ${String(car.consumption).replace('.', ',')} l/100 km (combined)` : ''}`, null);
    if (car.sellerType === 'dealer') {
      const since = car.dealerSince?.year;
      add(since && CURRENT_YEAR - since < 2 ? 'info' : 'good', `Dealer${since ? ` on avto.net since ${since}` : ''}`, null);
    } else {
      add('info', 'Private seller – no legal warranty, check ownership papers', null);
    }
    const equipment = [];
    const eqText = (car.equipment || []).join('\n');
    NOTABLE_EQUIPMENT.forEach(([re, label]) => { if (re.test(eqText) && !equipment.includes(label)) equipment.push(label); });
    const disclaimer = result.textHits.find(h => h.id === 'disclaimer');
    if (disclaimer) add('info', 'Seller disclaims errors in the listing – verify every figure', disclaimer.quote);
    return { items, equipment, equipmentCount: (car.equipment || []).length };
  }

  return { checklist, negotiation, costs, sellerMessage, report, listingHighlights };
})();
