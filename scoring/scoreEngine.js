// scoring/scoreEngine.js
const ScoreEngine = {
  evaluate(car) {
    console.log(`ScoreEngine.evaluate called with:`, car);
    
    let score = 100;
    const positives = [];
    const warnings = [];
    const details = {};

    const scoreState = { score, positives, warnings, details };

    PriceRules.evaluate(car.price, car.make, car.model, car.year, scoreState);
    MileageRules.evaluate(car.mileage, car.year, car.fuel, scoreState);
    OwnershipRules.evaluate(car.owners, scoreState);

    const modelIssues = ModelRiskDB.getIssues(car.make, car.model);
    if (modelIssues && modelIssues.length > 0) {
      modelIssues.forEach(issue => {
        scoreState.score -= 5;
        scoreState.warnings.push(`Known issue: ${issue}`);
      });
    }

    scoreState.score = Math.max(0, Math.min(100, scoreState.score));

    let verdict = 'Safe';
    if (scoreState.score < 80 && scoreState.score >= 60) verdict = 'Caution';
    else if (scoreState.score < 60) verdict = 'Risky';

    return {
      score: scoreState.score,
      verdict,
      positives: scoreState.positives,
      warnings: scoreState.warnings,
      details: scoreState.details
    };
  }
};