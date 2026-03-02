// scoring/modelRiskDB.js – Loads external JSON files at runtime

const ModelRiskDB = {
  issues: {},
  marketPrices: {},
  sloveniaPopularity: {},
  isLoaded: false,
  loadPromise: null,

  // Load all external data once (called automatically)
  async loadExternalData() {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }
    
    // Already loaded?
    if (this.isLoaded) {
      return Promise.resolve();
    }
    
    this.loadPromise = (async () => {
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
        this.isLoaded = true;
      } catch (error) {
        console.error("Failed to load one or more external JSON files:", error);
      }
    })();
    
    return this.loadPromise;
  },

  // Getters (same as before)
  getIssues(make, model) {
    if (!make || !model) return null;
    const key = `${make} ${model.split(' ')[0]}`.trim();
    return this.issues[key] || null;
  },

  getMarketPrice(make, model, year) {
    if (!make || !model || !year) {
      console.log(`getMarketPrice: Missing data - make:${make}, model:${model}, year:${year}`);
      return null;
    }
    
    // Normalize inputs to uppercase for matching
    const makeUpper = make.toUpperCase().trim();
    const modelFirstWord = model.split(' ')[0].toUpperCase().trim();
    const yearStr = String(year);
    
    console.log(`getMarketPrice: Looking for ${makeUpper} ${modelFirstWord} year ${yearStr}`);
    
    // Try exact key match first
    const exactKey = `${makeUpper} ${modelFirstWord}_${yearStr}`;
    if (this.marketPrices[exactKey] !== undefined) {
      console.log(`getMarketPrice: Found exact match ${exactKey} = ${this.marketPrices[exactKey]}`);
      return this.marketPrices[exactKey];
    }
    
    // Fallback: search through all keys for a match
    for (const key of Object.keys(this.marketPrices)) {
      // Check if key matches pattern "MAKE MODEL_YEAR" or "MAKE MODELPART_YEAR"
      const keyUpper = key.toUpperCase();
      if (keyUpper.includes(makeUpper) && keyUpper.includes(modelFirstWord) && keyUpper.endsWith(`_${yearStr}`)) {
        console.log(`getMarketPrice: Found fuzzy match ${key} = ${this.marketPrices[key]}`);
        return this.marketPrices[key];
      }
    }
    
    // Last resort: try without year (find any price for this make/model)
    for (const key of Object.keys(this.marketPrices)) {
      const keyUpper = key.toUpperCase();
      if (keyUpper.startsWith(`${makeUpper} ${modelFirstWord}`)) {
        console.log(`getMarketPrice: Found make/model match without exact year ${key} = ${this.marketPrices[key]}`);
        return this.marketPrices[key];
      }
    }
    
    console.log(`getMarketPrice: No match found for ${makeUpper} ${modelFirstWord} ${yearStr}`);
    return null;
  },

  getPopularityCount(make, model) {
    if (!make || !model) return 0;
    const key = `${make.toUpperCase()} ${model.toUpperCase().split(' ')[0]}`;
    return this.sloveniaPopularity[key] || 0;
  }
};