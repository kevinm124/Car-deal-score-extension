// scoring/priceRules.js
const PriceRules = {
  evaluate(price, make, model, year, scoreState) {
    console.log(`PriceRules.evaluate called with: price=${price}, make=${make}, model=${model}, year=${year}`);
    
    if (!price) {
      scoreState.warnings.push("Price missing.");
      return;
    }

    const avgPrice = ModelRiskDB.getMarketPrice(make, model, year);
    console.log(`PriceRules: avgPrice from DB = ${avgPrice}`);
    
    if (!avgPrice) {
      scoreState.warnings.push("Market price comparison unavailable.");
      return;
    }

    const deltaPct = ((price - avgPrice) / avgPrice) * 100;
    scoreState.details.priceDelta = `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}%`;

    if (deltaPct > 15) {
      scoreState.score -= 20;
      scoreState.warnings.push("Significantly overpriced (>15% above market).");
    } else if (deltaPct > 5) {
      scoreState.score -= 10;
      scoreState.warnings.push("Slightly overpriced (5–15% above market).");
    } else if (deltaPct < -20) {
      scoreState.score -= 10;
      scoreState.warnings.push("Suspiciously underpriced (>20% below market).");
    } else {
      scoreState.positives.push("Fair market price.");
    }
  }
};