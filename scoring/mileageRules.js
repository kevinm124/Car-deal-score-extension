// scoring/mileageRules.js
const MileageRules = {
  evaluate(mileage, year, fuel, scoreState) {
    if (!mileage || !year) return;

    const age = new Date().getFullYear() - year;
    if (age <= 0) return;

    const kmPerYear = Math.round(mileage / age);
    scoreState.details.kmPerYear = kmPerYear;

    if (kmPerYear > 30000) {
      scoreState.score -= 15;
      scoreState.warnings.push(`High mileage usage (${kmPerYear.toLocaleString()} km/year).`);
    } else if (kmPerYear < 7000 && age >= 5) {
      scoreState.score -= 10;
      scoreState.warnings.push("Unusually low mileage for age. Verify odometer.");
    } else if (fuel?.toLowerCase().includes("diesel") && kmPerYear < 10000) {
      scoreState.score -= 5;
      scoreState.warnings.push("Diesel engine with low yearly mileage.");
    } else {
      scoreState.positives.push("Normal mileage usage.");
    }
  }
};