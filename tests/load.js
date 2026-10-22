// tests/load.js – loads the extension's lib files into a Node VM context (no browser needed).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FILES = ['src/lib/util.js', 'src/lib/data.js', 'src/data/knownIssues.js', 'src/lib/market.js', 'src/lib/scoring.js', 'src/lib/insights.js', 'src/lib/parser.js', 'src/lib/store.js'];

function load() {
  const ctx = vm.createContext({ console, URL, Intl, Date, Math });
  ctx.globalThis = ctx;
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  const json = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  ctx.CDS.data.ingest({ issues: json('issues.json'), prices: json('marketPrices.json'), popularity: json('popularity.json') });
  return ctx.CDS;
}

module.exports = { load };
