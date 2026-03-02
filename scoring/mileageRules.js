// scoring/mileageRules.js
const MileageRules = {
  evaluate(mileage, year, fuel, scoreState) {
    console.log(`MileageRules.evaluate called with: mileage=${mileage}, year=${year}, fuel=${fuel}`);
    
    if (!mileage || !year) {
      console.log(`MileageRules: Missing mileage or year - cannot calculate km/year`);
      return;
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    console.log(`MileageRules: Car age = ${age} years (current year: ${currentYear})`);
    
    if (age <= 0) {
      console.log(`MileageRules: Age is 0 or negative, using 1 for calculation`);
    }
    
    const effectiveAge = Math.max(age, 1); // Use at least 1 year to avoid division issues
    const kmPerYear = Math.round(mileage / effectiveAge);
    scoreState.details.kmPerYear = kmPerYear;
    console.log(`MileageRules: Calculated kmPerYear = ${kmPerYear}`);

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