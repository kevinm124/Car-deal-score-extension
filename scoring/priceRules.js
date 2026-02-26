const PriceRules = {
  evaluate(price, make, model, year, scoreState) {
    if (!price) {
      scoreState.warnings.push("Price not detected.");
      return;
    }

    const avgPrice = ModelRiskDB.getMarketPrice(make, model, year);
    if (!avgPrice) {
      scoreState.warnings.push("No market price data for comparison.");
      return;
    }

    const delta = price - avgPrice;
    const deltaPct = (delta / avgPrice) * 100;
    scoreState.details.priceDelta = `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}%`;

    if (deltaPct > 15) {
      scoreState.score -= 20;
      scoreState.warnings.push("Significantly overpriced (>15% above avg).");
    } else if (deltaPct > 5) {
      scoreState.score -= 10;
      scoreState.warnings.push("Slightly overpriced (5–15% above avg).");
    } else if (deltaPct < -20) {
      scoreState.score -= 10;
      scoreState.warnings.push("Suspiciously underpriced (>20% below avg).");
    } else {
      scoreState.positives.push("Reasonable price vs market.");
    }
  }
};