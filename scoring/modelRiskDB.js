const ModelRiskDB = {
  issues: {
    "Volkswagen Golf": ["DSG gearbox problems", "Water pump failures"],
    "BMW 3 Series": ["Timing chain issues (N47/N20)", "Oil leaks"],
    "BMW X5": ["Turbocharger wear on diesel", "Suspension bushings"],
    "Audi A4": ["Excessive oil consumption (EA888)", "CVT/Multitronic issues"]
    // Add more models as needed
  },
  marketPrices: {
    "BMW X5_2024": 85000,
    "Volkswagen Golf_2020": 22000,
    "Audi A4_2019": 28000
    // Expand this over time
  },
  getIssues(make, model) {
    if (!make || !model) return null;
    const key1 = `${make} ${model.split(' ')[0]}`; // e.g. "BMW X5"
    const key2 = `${make} ${model}`;               // more specific
    return this.issues[key1] || this.issues[key2] || null;
  },
  getMarketPrice(make, model, year) {
    if (!make || !model || !year) return null;
    const key = `${make} ${model.split(' ')[0]}_${year}`;
    return this.marketPrices[key] || null;
  }
};