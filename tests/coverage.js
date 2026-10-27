// tests/coverage.js – how much of avto.net's make -> model catalog the known-issues database covers.
// Run: npm run coverage            (summary)
//      npm run coverage -- --list  (every uncovered model)
const fs = require('fs');
const path = require('path');
const { load } = require('./load');

const CDS = load();
const { MODELS } = CDS.knownIssues;
const lines = fs.readFileSync(path.join(__dirname, 'fixtures/avtonet-catalog.txt'), 'utf8')
  .split('\n').filter(l => l.includes('::') && !l.startsWith('#'));

const resolve = key => CDS.knownIssues.resolve(key);

// The catalog glues some names to the make ("AudiA4", "AlfaRomeo75", "MINICabrio") and uses
// "Golf---Variant" for body styles; turn them into what a listing title looks like.
function cleanModel(make, model) {
  const glued = make.replace(/[^A-Za-z]/g, '');
  let m = model.replace(/---/g, ' ').replace(/:$/, '').trim();
  if (m.toLowerCase().startsWith(glued.toLowerCase()) && m.length > glued.length) m = m.slice(glued.length);
  return m.trim();
}

const familyMakes = new Set();
// Brands that at least get shared-engine problems when the listing shows the engine.
['ROVER', 'MG', 'LOTUS', 'SSANGYONG', 'KG MOBILITY', 'ISUZU', 'DAEWOO', 'VOLKSWAGEN', 'AUDI', 'SKODA', 'SEAT', 'CUPRA', 'PORSCHE', 'PEUGEOT', 'CITROEN', 'DS', 'DS AUTOMOBILES', 'OPEL', 'RENAULT', 'DACIA', 'NISSAN',
  'FORD', 'CHEVROLET', 'SAAB', 'BMW', 'MINI', 'MERCEDES BENZ', 'INFINITI', 'TOYOTA', 'LEXUS', 'HYUNDAI', 'KIA', 'MAZDA', 'HONDA', 'VOLVO',
  'LAND ROVER', 'JAGUAR', 'FIAT', 'ALFA ROMEO', 'JEEP', 'LANCIA', 'ABARTH', 'SUBARU', 'MITSUBISHI', 'SUZUKI'].forEach(m => familyMakes.add(m));

const stats = { pairs: 0, model: 0, family: 0, none: 0 };
const perMake = [];
for (const line of lines) {
  const [make, list] = line.split('::');
  const models = list.split(';').filter(Boolean);
  const mk = CDS.data.normMake(make);
  const row = { make, total: models.length, covered: 0, missing: [] };
  for (const raw of models) {
    stats.pairs++;
    const model = cleanModel(make, raw);
    const split = CDS.data.splitTitle(`${make} ${model}`);
    const keys = CDS.data.candidateKeys(split.make, split.model, split.variant);
    if (keys.some(resolve)) { stats.model++; row.covered++; continue; }
    if (familyMakes.has(mk)) stats.family++; else stats.none++;
    row.missing.push(model);
  }
  perMake.push(row);
}

const pct = n => `${Math.round(n / stats.pairs * 100)}%`;
console.log(`avto.net catalog: ${lines.length} makes, ${stats.pairs} models`);
console.log(`  own entry (model-specific problems): ${stats.model} (${pct(stats.model)})`);
console.log(`  engine families only (brand known):  ${stats.family} (${pct(stats.family)})`);
console.log(`  nothing on file:                     ${stats.none} (${pct(stats.none)})`);
if (process.argv.includes('--list')) {
  for (const r of perMake.filter(r => r.missing.length)) console.log(`\n${r.make} ${r.covered}/${r.total}: ${r.missing.join(', ')}`);
} else {
  const worst = perMake.filter(r => r.missing.length).sort((a, b) => b.missing.length - a.missing.length).slice(0, 25);
  console.log('\nMost uncovered models by make:', worst.map(r => `${r.make} ${r.covered}/${r.total}`).join(' · '));
}
