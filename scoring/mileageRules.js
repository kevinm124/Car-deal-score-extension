const MileageRules = {
  evaluate(mileage, year, fuel, scoreState) {
    if (!year) return;

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    if (age <= 0) return;

    if (!mileage) {
      scoreState.warnings.push("Mileage not detected – cannot evaluate usage.");
      return;
    }

    const kmPerYear = Math.round(mileage / age);
    scoreState.details.kmPerYear = kmPerYear;

    if (kmPerYear > 30000) {
      scoreState.score -= 15;
      scoreState.warnings.push(`High usage (${kmPerYear.toLocaleString()} km/year).`);
    } else if (kmPerYear < 7000 && age >= 5) {
      scoreState.score -= 10;
      scoreState.warnings.push("Very low mileage for age – check odometer.");
    } else if (fuel && fuel.toLowerCase().includes("diesel") && kmPerYear < 10000) {
      scoreState.score -= 5;
      scoreState.warnings.push("Diesel with low annual km – DPF/EGR risk.");
    } else {
      scoreState.positives.push("Reasonable annual mileage.");
    }
  }
};