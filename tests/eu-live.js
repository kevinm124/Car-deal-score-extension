// tests/eu-live.js – runs the real background EU lookup against live AutoScout24 (needs internet).
// Run: node tests/eu-live.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const store = {};
const listeners = [];
const ctx = vm.createContext({
  console, URL, URLSearchParams, Date, Math, JSON,
  fetch: (u, o) => fetch(u, { ...o, headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36' } }),
  importScripts: (...files) => files.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'), ctx)),
  chrome: {
    runtime: { onMessage: { addListener: f => listeners.push(f) }, onInstalled: { addListener() {} }, openOptionsPage() {} },
    commands: { onCommand: { addListener() {} } },
    action: { setBadgeText() {}, setBadgeBackgroundColor() {} },
    storage: { local: { get: async k => ({ [k]: store[k] }), set: async o => Object.assign(store, o) } }
  }
});
ctx.globalThis = ctx;
ctx.self = ctx;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/background.js'), 'utf8'), ctx);

const ask = queries => new Promise(resolve => listeners[0]({ type: 'euMarket', queries }, {}, resolve));
const cars = [
  { title: "Land Rover Range Rover Evoque 2.0 TD4", make: "LAND ROVER", model: "RANGE", variant: "ROVER EVOQUE 2.0 TD4", year: 2017, mileage: 90000, fuel: "diesel", gearbox: "automatic", powerKw: 132, ccm: 1999 },
  { title: "Renault Grand Scenic 1.5 dCi", make: "RENAULT", model: "GRAND", variant: "SCENIC 1.5 DCI", year: 2015, mileage: 150000, fuel: "diesel", gearbox: "manual", powerKw: 81, ccm: 1461 },
  { title: "Škoda Octavia Combi 2.0 TDI Style", make: "SKODA", model: "OCTAVIA", variant: "COMBI 2.0 TDI STYLE", year: 2017, mileage: 160000, fuel: "diesel", gearbox: "dsg", powerKw: 110, ccm: 1968 },
  { title: "Opel Astra Sports Tourer 1.6 CDTI", make: "OPEL", model: "ASTRA", variant: "SPORTS TOURER 1.6 CDTI", year: 2017, mileage: 130000, fuel: "diesel", gearbox: "manual", powerKw: 81, ccm: 1598 },
  { title: "Citroën C4 Grand Picasso 1.6 BlueHDi", make: "CITROEN", model: "C4", variant: "GRAND PICASSO 1.6 BLUEHDI", year: 2016, mileage: 140000, fuel: "diesel", gearbox: "manual", powerKw: 88, ccm: 1560 },
  { title: 'Renault Captur TCe 90 Techno', make: 'RENAULT', model: 'CAPTUR', variant: 'TCE 90 TECHNO', year: 2023, mileage: 37057, fuel: 'petrol', gearbox: 'manual', powerKw: 67, ccm: 999 },
  { title: 'Citroën C3 1.2 PureTech110 SHINE Avt.', make: 'CITROEN', model: 'C3', variant: '1.2 PURETECH110 SHINE AVT.', year: 2022, mileage: 35000, fuel: 'petrol', gearbox: 'automatic', powerKw: 81, ccm: 1199 },
  { title: 'Volkswagen Golf 2.0 GTI Performance', make: 'VOLKSWAGEN', model: 'GOLF', variant: '2.0 GTI PERFORMANCE', year: 2016, mileage: 267000, fuel: 'petrol', gearbox: 'manual', powerKw: 162, ccm: 1984 },
  { title: 'Hyundai Tucson 4WD 2.0 CRDi Impression', make: 'HYUNDAI', model: 'TUCSON', variant: '4WD 2.0 CRDI IMPRESSION', year: 2016, mileage: 120000, fuel: 'diesel', gearbox: 'manual', powerKw: 100, ccm: 1995 }
];
(async () => {
  for (const car of cars) {
    const q = ctx.CDS.eu.queries(car);
    const res = await ask(q);
    const ccms = [...new Set(res.listings.map(l => l.ccm))].join('/');
    const models = [...new Set(res.listings.map(l => l.model))].join('/');
    const prices = res.listings.map(l => l.price).sort((a, b) => a - b);
    console.log(`${car.title}\n   tried: ${q.map(x => x.slug).join(', ')}\n   -> ${res.listings.length} comparable (level ${res.level}) models=${models} ccm=${ccms} median=${prices[prices.length >> 1]} url=${(res.url || '').replace(/\?.*/, '')}`);
  }
})();
