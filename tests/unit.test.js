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

test('learned comparables take over the estimate when there are enough', () => {
  const comps = Array.from({ length: 10 }, (_, i) => ({ id: `c${i}`, year: 2017, mileage: 100000, price: 9000 + i * 100 }));
  const reference = CDS.market.estimate(car({ year: 2017, mileage: 100000 }));
  const m = CDS.market.estimate(car({ year: 2017, mileage: 100000 }), comps);
  assert.equal(m.confidence, 'high');
  assert.equal(m.source, 'blend');
  // 10 comps -> ~71% weight on the comps' median (9,450 €)
  const expected = 0.714 * 9450 + 0.286 * reference.estimate;
  assert.ok(Math.abs(m.estimate - expected) < 50, `estimate ${m.estimate} vs ${expected}`);
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
