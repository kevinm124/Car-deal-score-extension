// scoring/ownershipRules.js
const OwnershipRules = {
  evaluate(owners, scoreState) {
    if (!owners) {
      scoreState.score -= 5;
      scoreState.warnings.push("Ownership history missing.");
      return;
    }

    if (owners === 1) scoreState.positives.push("First owner.");
    else if (owners === 2) scoreState.score -= 5;
    else if (owners === 3) scoreState.score -= 10;
    else if (owners >= 4) {
      scoreState.score -= 20;
      scoreState.warnings.push("4+ previous owners.");
    }
  }
};