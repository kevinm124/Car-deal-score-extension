// scoring/modelRiskDB.js – Loads external JSON files at runtime

const ModelRiskDB = {
  issues: {},
  marketPrices: {},
  sloveniaPopularity: {},

  // Load all external data once (called automatically)
  async loadExternalData() {
    try {
      // 1. Issues
      const issuesRes = await fetch(chrome.runtime.getURL('issues.json'));
      if (!issuesRes.ok) throw new Error(`issues.json: ${issuesRes.status}`);
      this.issues = await issuesRes.json();
      console.log(`Issues loaded: ${Object.keys(this.issues).length} models`);

      // 2. Market Prices
      const pricesRes = await fetch(chrome.runtime.getURL('marketPrices.json'));
      if (!pricesRes.ok) throw new Error(`marketPrices.json: ${pricesRes.status}`);
      this.marketPrices = await pricesRes.json();
      console.log(`Market prices loaded: ${Object.keys(this.marketPrices).length} entries`);

      // 3. Slovenia Popularity
      const popRes = await fetch(chrome.runtime.getURL('sloveniaPopularity.json'));
      if (!popRes.ok) throw new Error(`sloveniaPopularity.json: ${popRes.status}`);
      const popData = await popRes.json();

      // Handle both array and object formats
      if (Array.isArray(popData)) {
        popData.forEach(item => {
          if (item.make && item.model && item.count) {
            const key = `${item.make.toUpperCase()} ${item.model.toUpperCase().split(' ')[0]}`;
            this.sloveniaPopularity[key] = item.count;
          }
        });
      } else {
        // If it's already { "VOLKSWAGEN GOLF": 45872, ... }
        this.sloveniaPopularity = popData;
      }

      console.log(`Slovenia popularity loaded: ${Object.keys(this.sloveniaPopularity).length} entries`);
    } catch (error) {
      console.error("Failed to load one or more external JSON files:", error);
    }
  },

  // Getters (same as before)
  getIssues(make, model) {
    if (!make || !model) return null;
    const key = `${make} ${model.split(' ')[0]}`.trim();
    return this.issues[key] || null;
  },

  getMarketPrice(make, model, year) {
    if (!make || !model || !year) return null;
    const key = `${make} ${model.split(' ')[0]}_${year}`;
    return this.marketPrices[key] || null;
  },

  getPopularityCount(make, model) {
    if (!make || !model) return 0;
    const key = `${make.toUpperCase()} ${model.toUpperCase().split(' ')[0]}`;
    return this.sloveniaPopularity[key] || 0;
  }
};

// Automatically load data when the content script runs
ModelRiskDB.loadExternalData();