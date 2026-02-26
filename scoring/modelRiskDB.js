// scoring/modelRiskDB.js – Updated for better matching and real-ish 2026 prices
const ModelRiskDB = {
  issues: {
    "Volkswagen Golf 7": ["DSG gearbox issues (check mechatronics)", "Water pump failure risk"],
    "BMW 3 Series F30": ["N20/N47 Timing chain risk", "Steering rack clunk"],
    "Audi A4 B8": ["EA888 excessive oil consumption", "Multitronic CVT issues"],
    "BMW X5": ["Turbocharger wear on diesel", "Suspension bushings", "Cooling system potential leaks"],
    "BMW 5 Series": ["Oil leaks on some engines", "Electronic module faults"],
    "Mercedes C-Class": ["Rust on older models", "Electronic gremlins"],
    "Opel Insignia": ["Timing chain stretch on 2.0 CDTI", "Gearbox issues"]
  },

  // Mock average used prices (Slovenia/EU 2026 estimates – update periodically from avto.net)
  marketPrices: {
    "BMW X5_2024": 83000,      // Realistic avg for xDrive30d M Sport low-km
    "BMW X5_2023": 68000,
    "BMW 5 Series_2020": 38000,
    "BMW 3 Series_2022": 42000,
    "Volkswagen Golf_2021": 22000,
    "Audi A4_2022": 35000,
    "Mercedes C-Class_2023": 48000,
    "Opel Insignia_2019": 15000
    // Add more: "Make CoreModel_year": avg_price
  },

  // Improved getIssues: flexible key (ignores "serija", takes first model word)
  getIssues(make, model) {
    if (!make || !model) return null;
    const modelCore = model.split(' ')[0].replace(/[^a-zA-Z0-9]/g, ''); // e.g. "X5" from "serija X5 xDrive..."
    const keys = [
      `${make} ${modelCore}`,
      `${make} ${model.split(' ')[0]}`,
      make
    ];
    for (const key of keys) {
      if (this.issues[key]) return this.issues[key];
    }
    return null;
  },

  // Improved getMarketPrice: flexible matching
  getMarketPrice(make, model, year) {
    if (!make || !model || !year) return null;
    const modelCore = model.split(' ')[0].replace(/[^a-zA-Z0-9]/g, ''); // "X5"
    const possibleKeys = [
      `${make} ${modelCore}_${year}`,
      `${make} ${model.split(' ')[0]}_${year}`,
      `${make} ${model}_${year}`
    ];
    for (const key of possibleKeys) {
      if (this.marketPrices[key]) return this.marketPrices[key];
    }
    return null;
  }
};