const OwnershipRules = {
  evaluate(owners, scoreState) {
    if (owners === null || owners === undefined) {
      scoreState.warnings.push("Ownership info missing.");
      scoreState.score -= 5;
      return;
    }

    if (owners === 1) {
      scoreState.positives.push("Single owner – usually best.");
    } else if (owners === 2) {
      scoreState.score -= 5;
      scoreState.warnings.push("2 owners.");
    } else if (owners === 3) {
      scoreState.score -= 10;
      scoreState.warnings.push("3 owners.");
    } else if (owners >= 4) {
      scoreState.score -= 20;
      scoreState.warnings.push("Multiple owners (4+).");
    }
  }
};