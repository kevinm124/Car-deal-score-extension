// tests/unit.test.js – run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const CDS = load();
// Objects built inside the VM context have foreign prototypes; compare them as plain data.
const same = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const car = over => ({
  title: '', make: 'VOLKSWAGEN', model: 'GOLF', variant: '', price: 13000, year: 2017, month: 6,
  mileage: 100000, owners: 1, fuel: 'diesel', gearbox: 'manual', ccm: 1968, powerKw: 110, description: '', ...over
});

test('splitTitle handles multi-word makes and BMW/Mercedes model naming', () => {
  same(CDS.data.splitTitle('Alfa Romeo Giulietta 1.6 JTDm'), { make: 'ALFA ROMEO', model: 'GIULIETTA', variant: '1.6 JTDM' });
  assert.equal(CDS.data.splitTitle('BMW serija 3: 320d xDrive').model, '3');
  assert.equal(CDS.data.splitTitle('Mercedes-Benz C-razred C 220 d').make, 'MERCEDES-BENZ');
  assert.equal(CDS.data.candidateKeys('Mercedes-Benz', 'C-razred', 'C 220 d')[0], 'MERCEDES BENZ C');
  assert.equal(CDS.data.normMake('Škoda'), 'SKODA');
});

test('known issues are matched by engine, year and gearbox', () => {
  const puretech = CDS.knownIssues.match(car({ make: 'PEUGEOT', model: '308', variant: '1.2 PURETECH 130', title: 'Peugeot 308 1.2 PureTech 130', year: 2018, fuel: 'petrol', ccm: 1199 }));
  assert.ok(puretech.items.some(i => i.id === 'psa-puretech' && i.status === 'likely'));
  assert.ok(!puretech.items.some(i => i.id === 'psa-dv6'), 'diesel issue must not match a petrol car');

  const n47 = CDS.knownIssues.match(car({ make: 'BMW', model: '3', variant: '320D', title: 'BMW serija 3: 320d', year: 2012, ccm: 1995 }));
  assert.ok(n47.items.some(i => i.id === 'bmw-n47' && i.status === 'likely'));

  const newBmw = CDS.knownIssues.match(car({ make: 'BMW', model: '3', variant: '320D', year: 2019, ccm: 1995 }));
  assert.ok(!newBmw.items.some(i => i.id === 'bmw-n47'), 'N47 ended in 2014');

  const golfManual = CDS.knownIssues.match(car({ gearbox: 'manual', ccm: 1598, variant: '1.6 TDI', year: 2015 }));
  assert.ok(!golfManual.items.some(i => i.id === 'vag-dq200'), 'no DSG issue on a manual');

  const golfDsg = CDS.knownIssues.match(car({ gearbox: 'dsg', ccm: 1598, variant: '1.6 TDI DSG', title: 'Golf 1.6 TDI DSG', year: 2015 }));
  assert.ok(golfDsg.items.some(i => i.id === 'vag-dq200'));
});

test('unknown engine data yields "possible" rather than "likely"', () => {
  const r = CDS.knownIssues.match({ make: 'PEUGEOT', model: '308', variant: '', title: 'Peugeot 308', year: 2018 });
  const pt = r.items.find(i => i.id === 'psa-puretech');
  assert.equal(pt.status, 'possible');
});

test('aliases resolve (Seat Alhambra -> VW Sharan, Grand Scenic -> Scenic)', () => {
  assert.ok(CDS.knownIssues.match({ make: 'SEAT', model: 'ALHAMBRA', year: 2012 }).items.length > 0);
  assert.ok(CDS.knownIssues.match({ make: 'RENAULT', model: 'GRAND', variant: 'SCENIC 1.5 DCI', year: 2012, fuel: 'diesel', ccm: 1461 }).items.length > 0);
});

test('market estimate depreciates with age and mileage', () => {
  const newer = CDS.market.estimate(car({ year: 2019, mileage: 60000 }));
  const older = CDS.market.estimate(car({ year: 2014, mileage: 60000 }));
  const highKm = CDS.market.estimate(car({ year: 2019, mileage: 220000 }));
  assert.ok(newer.estimate > older.estimate);
  assert.ok(newer.estimate > highKm.estimate);
  assert.ok(newer.low < newer.estimate && newer.estimate < newer.high);
});

test('learned comparables dominate the rough reference price', () => {
  const comps = Array.from({ length: 10 }, (_, i) => ({ id: `c${i}`, year: 2017, mileage: 100000, price: 9000 + i * 100 }));
  const m = CDS.market.estimate(car({ year: 2017, mileage: 100000, price: 9500 }), comps);
  assert.equal(m.confidence, 'high');
  assert.ok(m.source.startsWith('comps'));
  assert.ok(Math.abs(m.estimate - 9450) / 9450 < 0.08, `estimate ${m.estimate} should be near the comps median 9,450`);
});

test('EU listings feed the estimate and are reported separately', () => {
  const eu = { total: 120, url: 'https://www.autoscout24.com/lst/x', countries: ['D', 'A'],
    listings: Array.from({ length: 20 }, (_, i) => ({ id: `e${i}`, year: 2017, mileage: 100000, price: 11000 + i * 50 })) };
  const m = CDS.market.estimate(car({ year: 2017, mileage: 100000, price: 12000 }), [], eu);
  assert.equal(m.eu.count, 20);
  assert.ok(Math.abs(m.eu.estimate - 11475) < 50);
  assert.ok(m.source.includes('eu'));
  assert.equal(m.confidence, 'high');
});

test('negated damage wording counts as a positive, not a red flag', () => {
  const said = d => CDS.scoring.evaluate(car({ description: d }));
  for (const d of ['Stanje:\nvozilo ni bilo karambolirano','nepoškodovano vozilo', 'Vozilo nikoli ni bilo poškodovano']) {
    const r = said(d);
    assert.ok(!r.flags.some(f => f.kind === 'red'), d);
    assert.ok(r.textHits.some(h => h.id === 'damage' && h.negated), d);
  }
  assert.ok(said('vozilo je karambolirano').flags.some(f => f.kind === 'red'));
  assert.ok(said('brez servisne knjige').textHits.some(h => h.id === 'service' && h.negated));
});

test('AutoScout24 URLs use the right model slugs and filters', () => {
  const golf = CDS.eu.queries(car({ variant: '2.0 TDI', powerKw: 110, gearbox: 'dsg' }));
  assert.equal(golf[0].slug, 'volkswagen/golf');
  assert.match(golf[0].urls[0], /fuel=D/);
  assert.match(golf[0].urls[0], /gear=A/);
  assert.match(golf[0].urls[0], /powerfrom=93/);
  assert.equal(CDS.eu.queries(car({ make: 'BMW', model: '3', variant: '320D XDRIVE' }))[0].slug, 'bmw/320');
  assert.equal(CDS.eu.queries(car({ make: 'BMW', model: '3', variant: '' }))[0].slug, 'bmw/3-series');
  assert.equal(CDS.eu.queries(car({ make: 'Mercedes-Benz', model: 'C-RAZRED', variant: 'C 220 D' }))[0].slug, 'mercedes-benz/c-220');
  assert.equal(CDS.eu.queries(car({ make: 'CITROEN', model: 'C4', variant: 'PICASSO 1.6 HDI' }))[0].slug, 'citroen/c4-picasso');
});

test('listing highlights quote what the seller actually wrote', () => {
  const c = car({
    conditionNotes: ['servisna knjiga / potrjena', 'vozilo ni bilo karambolirano', 'slovensko poreklo', '1. lastnik'],
    equipment: ['navigacijski sistem', 'vzvratna kamera', 'Apple CarPlay', 'ABS zavorni sistem'],
    starostRaw: 'rabljeno / ima garancijo', sellerType: 'dealer', dealerSince: { year: 2002 }
  });
  const h = CDS.insights.listingHighlights(c, CDS.scoring.evaluate(c));
  const texts = h.items.map(i => i.text);
  assert.ok(texts.includes('Never in an accident'));
  assert.ok(texts.includes('Service book, stamped'));
  assert.ok(texts.includes('First sold in Slovenia'));
  assert.ok(h.items.find(i => i.text === 'Never in an accident').quote === 'vozilo ni bilo karambolirano');
  assert.ok(!h.items.some(i => i.kind === 'warn'));
  assert.deepEqual([...h.equipment], ['Navigation', 'Parking camera', 'CarPlay / Android Auto']);
});

test('accident wording caps the score', () => {
  const clean = CDS.scoring.evaluate(car());
  const crashed = CDS.scoring.evaluate(car({ description: 'Vozilo je karambolirano, prodam po delih.' }));
  assert.ok(crashed.score <= 45);
  assert.ok(crashed.score < clean.score);
  assert.ok(crashed.flags.some(f => f.kind === 'red'));
});

test('service history in the text improves history score', () => {
  const plain = CDS.scoring.evaluate(car({ owners: 2 }));
  const serviced = CDS.scoring.evaluate(car({ owners: 2, description: 'Stanje: servisna knjiga' }));
  const h = r => r.categories.find(c => c.id === 'history').score;
  assert.ok(h(serviced) > h(plain));
});

test('a likely engine-threatening issue rules out "Great deal"', () => {
  const r = CDS.scoring.evaluate(car({ make: 'RENAULT', model: 'CLIO', variant: '1.2 TCE', fuel: 'petrol', ccm: 1197, year: 2015, price: 4000 }));
  assert.ok(r.score <= 82);
  assert.notEqual(r.verdict.id, 'great');
});

test('overpriced cars score lower on price', () => {
  const fair = CDS.scoring.evaluate(car({ price: 12000 }));
  const steep = CDS.scoring.evaluate(car({ price: 30000 }));
  const p = r => r.categories.find(c => c.id === 'price').score;
  assert.ok(p(fair) > p(steep));
});

test('negotiation plan stays between 80% of asking and asking', () => {
  const c = car({ price: 15000, mileage: 210000, owners: 3 });
  const r = CDS.scoring.evaluate(c);
  const n = CDS.insights.negotiation(c, r);
  assert.ok(n.opening <= n.target && n.target <= n.walkAway && n.walkAway <= c.price);
  assert.ok(n.opening >= c.price * 0.75);
  assert.ok(n.leverage.length > 0);
});

test('running costs scale with distance driven', () => {
  const c = car();
  const r = CDS.scoring.evaluate(c);
  const base = CDS.insights.costs(c, r, { ...CDS.store.DEFAULTS, kmPerYear: 10000 });
  const more = CDS.insights.costs(c, r, { ...CDS.store.DEFAULTS, kmPerYear: 30000 });
  assert.ok(more.total > base.total);
});

test('checklist adapts to fuel and gearbox', () => {
  const diesel = CDS.insights.checklist(car({ fuel: 'diesel', gearbox: 'dsg' }), CDS.scoring.evaluate(car({ fuel: 'diesel', gearbox: 'dsg' })));
  assert.ok(diesel.some(i => i.id === 'dpf'));
  assert.ok(diesel.some(i => i.id === 'gearbox'));
  const ev = car({ make: 'RENAULT', model: 'ZOE', fuel: 'electric', ccm: null });
  const evList = CDS.insights.checklist(ev, CDS.scoring.evaluate(ev));
  assert.ok(evList.some(i => i.id === 'soh'));
  assert.ok(evList.some(i => /leased|rented/i.test(i.text)), 'Zoe battery-lease issue should be in the checklist');
});

test('parser helpers normalise avto.net values', () => {
  assert.equal(CDS.parser.fuelOf('bencinski motor'), 'petrol');
  assert.equal(CDS.parser.fuelOf('diesel motor'), 'diesel');
  assert.equal(CDS.parser.fuelOf('hibridni pogon (bencin / elektrika)'), 'hybrid');
  assert.equal(CDS.parser.fuelOf('elektro pogon'), 'electric');
  assert.equal(CDS.parser.gearboxOf('ročni menjalnik (6 pr.)', '', 'BMW'), 'manual');
  assert.equal(CDS.parser.gearboxOf('avtomatski menjalnik', 'Golf 2.0 TDI', 'Volkswagen'), 'dsg');
  assert.equal(CDS.parser.gearboxOf('avtomatski menjalnik', 'Toyota Yaris Hybrid', 'Toyota'), 'automatic');
  same(CDS.parser.yearMonth('2016  / 9'), { year: 2016, month: 9 });
});

test('number formatting uses Slovene grouping', () => {
  assert.equal(CDS.util.eur(9850), '9.850 €');
  assert.equal(CDS.util.eur(-1234567), '−1.234.567 €');
  assert.equal(CDS.util.km(267000), '267.000 km');
});

test('an engine size in the title rules out issues for other engines', () => {
  const r = CDS.knownIssues.match({ make: 'PEUGEOT', model: '308', variant: '1.6 THP', title: 'Peugeot 308 1.6 THP', year: 2015, fuel: 'petrol' });
  assert.ok(!r.items.some(i => i.id === 'psa-puretech'), 'a 1.6 THP is not a 1.2 PureTech');
  assert.ok(r.items.some(i => i.id === 'psa-thp'));
});

test('damage words only match whole words and ignore dealer boilerplate', () => {
  const flagged = d => CDS.scoring.evaluate(car({ description: d })).flags.some(f => f.kind === 'red');
  assert.ok(!flagged('istočasno opravljen servis avtomatskega menjalnika'), '"toča" inside "istočasno"');
  assert.ok(!flagged('Opravljen tehnični pregled in servis'));
  assert.ok(!flagged('Nudimo kleparsko ličarske storitve in popravilo poškodb po toči'));
  assert.ok(flagged('avto je bil poškodovan v toči'));
  const scratches = CDS.scoring.evaluate(car({ description: 'manjše praske na odbijaču' }));
  assert.ok(!scratches.flags.some(f => f.kind === 'red'));
  assert.ok(scratches.textHits.some(h => h.id === 'scratches'));
});

test('shared engine families cross brands only on matching engines', () => {
  const ids = c => (CDS.knownIssues.match(c)?.items || []).map(i => i.id);
  // Toyota used BMW's N47 diesel 2014–2018
  assert.ok(ids({ make: 'TOYOTA', model: 'AVENSIS', variant: '2.0 D-4D', title: 'Toyota Avensis 2.0 D-4D', year: 2016, fuel: 'diesel', ccm: 1995 }).includes('toy-n47'));
  // Mercedes A 180 d is the Renault 1.5 dCi, not the OM651 2.1
  const a180 = ids({ make: 'MERCEDES-BENZ', model: 'A-RAZRED', variant: 'A 180 D', year: 2014, fuel: 'diesel', gearbox: 'manual', ccm: 1461 });
  assert.ok(a180.includes('mb-om607') && !a180.includes('mb-om651') && !a180.includes('rn-k9k'));
  // Volvo D2 uses the PSA 1.6 diesel
  assert.ok(ids({ make: 'VOLVO', model: 'V40', variant: 'D2', year: 2014, fuel: 'diesel', ccm: 1560 }).includes('psa-dv6'));
  // A model not listed by name still gets its engine family
  assert.ok(ids({ make: 'KIA', model: 'CARENS', variant: '1.7 CRDI', year: 2014, fuel: 'diesel', ccm: 1685 }).includes('hk-crdi'));
  // No cross-contamination
  assert.ok(!ids({ make: 'OPEL', model: 'ASTRA', variant: '1.6 16V', year: 2012, fuel: 'petrol', ccm: 1598 }).includes('psa-thp'));
  assert.ok(!ids({ make: 'FIAT', model: 'PUNTO', variant: '1.4 16V', year: 2010, fuel: 'petrol', ccm: 1368 }).includes('fca-multiair'));
  assert.ok(!ids({ make: 'LAND ROVER', model: 'RANGE', variant: 'ROVER EVOQUE 2.0 TD4', title: 'Land Rover Range Rover Evoque 2.0 TD4', year: 2017, fuel: 'diesel', gearbox: 'automatic', ccm: 1999 }).includes('jlr-air'));
});

test('"za dele" only flags cars sold for parts, not parts invoices', () => {
  const red = d => CDS.scoring.evaluate(car({ description: d })).flags.some(f => f.kind === 'red');
  assert.ok(!red('v zadnjem mesecu zamenjano skoraj vse možno, račun za dele za 2000eur'));
  assert.ok(red('prodam za dele'));
  assert.ok(red('TURBINA V OKVARI'));
});

test('warning-light rule ignores interior lights; deregistration is only a warning', () => {
  const hit = (d, id) => CDS.scoring.evaluate(car({ description: d })).textHits.some(h => h.id === id);
  assert.ok(!hit('stropna lučka, ambientna osvetlitev', 'light'));
  assert.ok(hit('GORI LUČKA ZA MOTOR IN JAVLJA 4. GRELNO SVEČO', 'light'));
  assert.ok(hit('svetli lučka za svečke', 'light'));
  const dereg = CDS.scoring.evaluate(car({ description: 'Vozilo je odjavljeno.' }));
  assert.ok(dereg.textHits.some(h => h.id === 'deregistered'));
  assert.ok(!dereg.flags.some(f => f.kind === 'red'));
});

test('AutoScout24: unknown model slugs are detected and listings re-checked for engine/gearbox', () => {
  const page = (mmmv, listings) => `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { numberOfResults: listings.length, pageQuery: { mmmv }, listings } } })}</script>`;
  const l = (price, ccm, transmission, model) => ({ id: String(price), price: { priceRaw: price }, tracking: { price: String(price), firstRegistration: '05-2017', mileage: '100000' }, vehicle: { model, engineDisplacementInCCM: `${ccm.toLocaleString('en')} cc`, transmission }, location: { countryCode: 'DE' } });
  // "renault/captur-techno" -> AutoScout24 dropped the model and returned every Renault
  const wrong = CDS.eu.parsePage(page('60|||', [l(9000, 1461, 'Manual', 'Kadjar')]));
  assert.equal(wrong.modelRecognised, false);
  const right = CDS.eu.parsePage(page('74|2084||', [l(14000, 1968, 'Manual', 'Golf'), l(9000, 1896, 'Manual', 'Golf'), l(15000, 1968, 'Automatic', 'Golf')]));
  assert.equal(right.modelRecognised, true);
  const match = { ccm: 1968, gear: 'M' };
  const kept = right.listings.filter(x => CDS.eu.comparable(x, match)).map(x => x.price);
  same(kept, [14000]);   // 1.9 TDI and the automatic are dropped
});

test('AutoScout24 slugs try multi-word model names first', () => {
  const slugs = c => CDS.eu.queries(car(c)).map(q => q.slug);
  assert.equal(slugs({ make: 'CITROEN', model: 'C4', variant: 'GRAND PICASSO 1.6 BLUEHDI' })[0], 'citroen/grand-c4-picasso');
  assert.equal(slugs({ make: 'LAND ROVER', model: 'RANGE', variant: 'ROVER EVOQUE 2.0 TD4' })[0], 'land-rover/range-rover-evoque');
  assert.ok(!slugs({ make: 'RENAULT', model: 'CAPTUR', variant: 'TCE 90 TECHNO' }).includes('renault/captur-techno'));
});
