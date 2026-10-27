// tests/data.test.js – sanity checks on the curated known-issues database.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { load } = require('./load');

const SRC = fs.readFileSync(path.join(__dirname, '../src/data/knownIssues.js'), 'utf8');
const CDS = load();

test('no control characters (a single "\\b" in a quoted regex becomes a backspace)', () => {
  const bad = [...SRC.matchAll(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g)];
  assert.equal(bad.length, 0);
});

test('every eng/notEng/hint pattern compiles and every model entry resolves', () => {
  const { MODELS } = CDS.knownIssues;
  for (const [key, value] of Object.entries(MODELS)) {
    if (typeof value === 'string') { assert.ok(MODELS[value], `${key} -> missing alias ${value}`); continue; }
    for (const it of value) {
      assert.ok(it, `${key} has an undefined entry`);
      for (const f of ['eng', 'notEng', 'hint']) if (it[f]) new RegExp(it[f], 'i');
      if (!it.positive) assert.ok(it.id && it.title && it.sev, `${key}: ${it.title} needs id, title, sev`);
    }
  }
});
