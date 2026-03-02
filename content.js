// content.js – FULL UPDATED VERSION
// =======================
// Helper functions
// =======================

function cleanNumber(str) {
  if (!str) return null;
  const cleaned = str.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : null;
}

// Extract a valid4-digit year (1990-current year) from a string
function extractYear(str) {
  if (!str) return null;
  const currentYear = new Date().getFullYear();
  
  // First, try to find a4-digit number that looks like a year
  const yearMatch = str.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10);
    if (year >= 1990 && year <= currentYear) {
      return year;
    }
  }
  
  // Fallback: extract all digits and take first4 if valid
  const digits = str.replace(/[^\d]/g, '');
  if (digits.length >= 4) {
    const potentialYear = parseInt(digits.substring(0, 4), 10);
    if (potentialYear >= 1990 && potentialYear <= currentYear) {
      return potentialYear;
    }
  }
  
  return null;
}

function getTableValue(labelTexts) {
  const labels = Array.isArray(labelTexts) ? labelTexts : [labelTexts];
  const rows = document.querySelectorAll('table tr, .spec-row, .detail-row, .car-specs tr');
  for (const row of rows) {
    const cells = row.querySelectorAll('td, th, div.key, div.label, span.label');
    if (cells.length >= 2) {
      let labelText = (cells[0].innerText || '').trim().toLowerCase()
        .replace(/:$/, '')
        .replace(/\s+/g, ' ');
      for (const target of labels) {
        if (labelText.includes(target.toLowerCase())) {
          let value = cells[1].innerText.trim();
          if (!value && cells[1].querySelector('strong, b, span.value')) {
            value = cells[1].querySelector('strong, b, span.value').innerText.trim();
          }
          return value || null;
        }
      }
    }
  }
  return null;
}

function looseSearch(labelTexts) {
  const bodyText = document.body.innerText;
  const labels = Array.isArray(labelTexts) ? labelTexts : [labelTexts];
  for (const lbl of labels) {
    const regex = new RegExp(lbl + '\\s*[:\\-–—]?\\s*([\\d\\s.,]+\\s*(km|lastnik|lastnikov|dizel|bencin|hibrid|elektriko|€)?)', 'i');
    const match = bodyText.match(regex);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

// =======================
// Extract car data
// =======================

async function runScoring() {
  // Wait for ModelRiskDB to load external data
  if (ModelRiskDB.loadExternalData) {
    await ModelRiskDB.loadExternalData();
  }
  
  // Try multiple title selectors – avto.net sometimes uses different classes
  const titleEl = document.querySelector("h1, .title-main, .ad-title, [itemprop='name'], .oglas-naslov, h1[itemprop='name']");
  let title = titleEl ? titleEl.innerText.trim() : document.title.split(" - ")[0] || "";

  let make = null;
  let model = null;

  if (title) {
    // Clean common patterns: "BMW serija X5: xDrive30d ..." or "AUDI A4 Avant 2.0 TDI"
    title = title.replace(/\s*[-:]\s*/g, ' ').replace(/\s+/g, ' ').trim();

    const words = title.split(' ');

    // Make is almost always the first word (BMW, AUDI, VOLKSWAGEN, etc.)
    make = words[0] || null;

    // Model is everything after make, before first number or certain keywords
    let modelParts = words.slice(1);
    const stopIndex = modelParts.findIndex(w => /^\d/.test(w) || ['M', 'xDrive', 'TDI', 'd', 'TSI'].includes(w));
    if (stopIndex !== -1) modelParts = modelParts.slice(0, stopIndex);
    model = modelParts.join(' ').trim();

    // Special case for "serija X5", "serija 3", etc.
    if (title.toLowerCase().includes('serija') && !model) {
      const serijaMatch = title.match(/serija\s*([^\s:]+)/i);
      if (serijaMatch) model = serijaMatch[1];
    }

    // If model still empty, take next 2–4 words
    if (!model && words.length > 1) {
      model = words.slice(1, 5).join(' ').trim();
    }
  }

  // Fallback: look in meta or breadcrumbs if title failed
  if (!make || !model) {
    const metaTitle = document.querySelector('title')?.innerText || '';
    if (metaTitle.includes(' - ')) {
      const parts = metaTitle.split(' - ')[0].split(' ');
      make = make || parts[0];
      model = model || parts.slice(1).join(' ');
    }
  }

  // Additional extraction helpers for avto.net specific structures
  function extractFromDetailsTable() {
    const data = {};
    const currentYear = new Date().getFullYear();
    
    // Helper to validate year (must be reasonable car year: 1990-current year)
    function isValidCarYear(yearStr) {
      const year = parseInt(yearStr, 10);
      return !isNaN(year) && year >= 1990 && year <= currentYear;
    }
    
    // Try avto.net specific table structure
    const detailRows = document.querySelectorAll('.details-table tr, .specifications tr, .car-details tr, .atributi tr, table tbody tr, table tr');
    detailRows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      if (cells.length >= 2) {
        const label = (cells[0].innerText || '').trim().toLowerCase();
        const value = (cells[1].innerText || '').trim();
        
        console.log(`extractFromDetailsTable: Found label="${label}", value="${value}"`);
        
        // More specific year matching - avoid matching registration dates
        if ((label === 'letnik' || label.includes('leto proizvodnje')) && !label.includes('registr')) {
          const yearMatch = value.match(/\d{4}/);
          if (yearMatch && isValidCarYear(yearMatch[0])) {
            data.year = yearMatch[0];
            console.log(`extractFromDetailsTable: Set year = ${yearMatch[0]}`);
          }
        }
        if (label.includes('km') || label.includes('kilomet') || label.includes('prevoz')) {
          data.mileage = value;
          console.log(`extractFromDetailsTable: Set mileage = ${value}`);
        }
        if (label.includes('lastnik')) {
          data.owners = value;
        }
        if (label.includes('gorivo')) {
          data.fuel = value;
        }
      }
    });
    
    // Also try definition lists
    const dlItems = document.querySelectorAll('dl dt, dl dd');
    let lastLabel = '';
    dlItems.forEach((item, index) => {
      if (item.tagName === 'DT') {
        lastLabel = (item.innerText || '').trim().toLowerCase();
      } else if (item.tagName === 'DD' && lastLabel) {
        const value = (item.innerText || '').trim();
        if ((lastLabel === 'letnik' || lastLabel.includes('leto proizvodnje')) && !lastLabel.includes('registr')) {
          const yearMatch = value.match(/\d{4}/);
          if (yearMatch && isValidCarYear(yearMatch[0])) {
            data.year = yearMatch[0];
          }
        }
        if (lastLabel.includes('km') || lastLabel.includes('kilomet')) {
          data.mileage = value;
        }
      }
    });
    
    // Try div-based layouts (common on modern avto.net)
    const detailDivs = document.querySelectorAll('.detail-item, .spec-item, .car-info-item, [class*="detail"], [class*="spec"]');
    detailDivs.forEach(div => {
      const labelEl = div.querySelector('.label, .key, .title, dt, strong, b');
      const valueEl = div.querySelector('.value, dd, span:not(.label)');
      if (labelEl && valueEl) {
        const label = (labelEl.innerText || '').trim().toLowerCase();
        const value = (valueEl.innerText || '').trim();
        
        if ((label === 'letnik' || label.includes('leto proizvodnje')) && !label.includes('registr')) {
          const yearMatch = value.match(/\d{4}/);
          if (yearMatch && isValidCarYear(yearMatch[0])) {
            data.year = yearMatch[0];
          }
        }
        if (label.includes('km') || label.includes('kilomet') || label.includes('prevoz')) {
          data.mileage = value;
        }
      }
    });
    
    // Last resort: search entire page text for year patterns
    if (!data.year) {
      const pageText = document.body.innerText;
      // Look for "Letnik: 2008" or "Leto proizvodnje: 2008" patterns
      const yearMatch = pageText.match(/(?:letnik|leto\s*proizvodnje)[:\s]*(\d{4})/i);
      if (yearMatch && isValidCarYear(yearMatch[1])) {
        data.year = yearMatch[1];
        console.log(`extractFromDetailsTable: Found year via regex = ${yearMatch[1]}`);
      }
    }
    
    return data;
  }
  
  const detailsData = extractFromDetailsTable();
  console.log("extractFromDetailsTable result:", detailsData);
  
  // Debug: log what we found for year
  const yearFromTable = getTableValue(["Leto proizvodnje", "Letnik", "Prva registracija", "First registration", "Leto"]);
  const yearFromLoose = looseSearch(["Letnik", "Leto proizvodnje", "registracija"]);
  console.log(`Year extraction debug: table=${yearFromTable}, detailsData=${detailsData.year}, loose=${yearFromLoose}`);
  
  const carData = {
    make,
    model,
    price: cleanNumber(
      document.querySelector('.price, strong.price, .cijena-big, [class*="cena"], #cijena, .price-value, [itemprop="price"]')?.innerText ||
      looseSearch(["Cena", "€", "prodajna cena"])
    ),
    year: extractYear(
      yearFromTable ||
      detailsData.year ||
      yearFromLoose
    ),
    mileage: cleanNumber(
      getTableValue(["Prevoženi km", "Prevoženih km", "Prevoženi", "Kilometri", "Prevoženo"]) ||
      detailsData.mileage ||
      looseSearch(["Prevoženi", "Prevoženih", "km"])
    ),
    owners: cleanNumber(
      getTableValue(["Lastnikov", "Število lastnikov", "Lastnik", "Prejšnjih lastnikov", "Št. lastnikov"]) ||
      detailsData.owners ||
      looseSearch(["Lastnikov", "lastnik"])
    ),
    fuel:
      (getTableValue(["Gorivo", "Vrsta goriva", "Tip goriva", "Motor", "Pogon"]) ||
      detailsData.fuel ||
      looseSearch(["Gorivo", "dizel", "bencin", "hibrid", "električni"]))?.toLowerCase().replace(/motor|avtomatski/gi, '').trim() || null,
    description: document.querySelector(".opis, .description, .ad-text, .body-text, [itemprop='description']")?.innerText.trim() || null
  };

  console.log("Car Deal Safety Score extracted carData:", carData);

  // =======================
  // Render UI – with try/catch to prevent crash
  // =======================

  if (carData.price !== null) {
    try {
      const result = ScoreEngine.evaluate(carData);
      console.log("Attempting to render overlay with score:", result.score);

      const overlay = document.createElement('div');
      overlay.id = 'car-deal-overlay';
      overlay.className = getRiskClass(result.score);

      let notesHTML = '';
      if (result.positives.length > 0) {
        notesHTML += '<h4>Positives:</h4><ul>' + result.positives.map(n => `<li>${n}</li>`).join('') + '</ul>';
      }
      if (result.warnings.length > 0) {
        notesHTML += '<h4>Warnings:</h4><ul>' + result.warnings.map(n => `<li>${n}</li>`).join('') + '</ul>';
      }

      overlay.innerHTML = `
        <h3>Deal Quality Score</h3>
        <div class="score">${result.score}/100</div>
        <div class="verdict">${result.verdict}</div>
        <button id="expand-why">Why?</button>
        <div id="why-section" style="display: none;">
          ${notesHTML || '<p>No specific notes available.</p>'}
          <div class="details">
            <p>Price Delta: ${result.details.priceDelta || 'N/A'}</p>
            <p>Km/Year: ${result.details.kmPerYear || 'N/A'}</p>
          </div>
          <p class="disclaimer">Informational only – not a purchase guarantee.</p>
        </div>
        <button id="dismiss-overlay">Close</button>
        <button id="disable-extension">Disable Extension</button>
      `;

      document.body.appendChild(overlay);

      document.getElementById('expand-why')?.addEventListener('click', () => {
        const why = document.getElementById('why-section');
        why.style.display = why.style.display === 'none' ? 'block' : 'none';
      });

      document.getElementById('dismiss-overlay')?.addEventListener('click', () => overlay.remove());

      document.getElementById('disable-extension')?.addEventListener('click', () => {
        localStorage.setItem('carDealScoreDisabled', 'true');
        overlay.remove();
        alert('Extension disabled. Re-enable by reinstalling or clearing localStorage.');
      });
    } catch (error) {
      console.error("Error during scoring or rendering:", error);
      // Optional: show minimal overlay on error
      const errorOverlay = document.createElement('div');
      errorOverlay.id = 'car-deal-overlay';
      errorOverlay.style.background = '#333';
      errorOverlay.innerHTML = `
        <h3>Deal Score Error</h3>
        <p>Could not calculate score (likely missing make/model data).</p>
        <p>Price detected: ${carData.price} €</p>
        <button onclick="this.parentElement.remove()">Close</button>
      `;
      document.body.appendChild(errorOverlay);
    }
  }
}

// Run scoring after page loads with a delay to ensure DOM is ready
setTimeout(() => {
  runScoring();
}, 1500);

function getRiskClass(score) {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'caution';
  return 'risky';
}