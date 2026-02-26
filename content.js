// =======================
// Helper functions
// =======================

function cleanNumber(str) {
  if (!str) return null;
  const cleaned = str.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : null;
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

const titleEl = document.querySelector("h1, .title-main, .ad-title, [itemprop='name']");
const title = titleEl ? titleEl.innerText.trim() : "";

let make = null;
let model = null;
if (title) {
  const parts = title.split(/\s+/);
  make = parts[0] || null;
  model = parts.slice(1).join(" ").replace(/[,].*$/, "").trim() || null;
}

const carData = {
  make,
  model,
  price: cleanNumber(
    document.querySelector('.price, strong.price, .cijena-big, [class*="cena"]')?.innerText ||
    looseSearch(["Cena", "Price", "€"]) ||
    looseSearch(["prodajna cena"])
  ),
  year: cleanNumber(
    getTableValue(["Leto proizvodnje", "Letnik", "Prva registracija", "First registration"]) ||
    looseSearch(["Letnik", "Leto", "registracija"])
  ),
  mileage: cleanNumber(
    getTableValue(["Prevoženi km", "Prevoženih km", "Prevoženi", "Kilometri"]) ||
    looseSearch(["Prevoženi", "Prevoženih", "km"])
  ),
  owners: cleanNumber(
    getTableValue(["Lastnikov", "Število lastnikov", "Lastnik", "Prejšnjih lastnikov", "Št. lastnikov"]) ||
    looseSearch(["Lastnikov", "lastnik"])
  ),
  fuel: 
    getTableValue(["Gorivo", "Vrsta goriva", "Tip motorja", "Motor", "Pogon"]) ||
    looseSearch(["Gorivo", "dizel", "bencin", "hibrid", "električni"])?.toLowerCase() || null,
  description: document.querySelector(".opis, .description, .ad-text, .body-text, [itemprop='description']")?.innerText.trim() || null
};

console.log("Car Deal Safety Score extracted carData:", carData);

// =======================
// Render UI if we have at least price
// =======================

if (carData.price !== null) {
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

  // Event listeners
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
}

function getRiskClass(score) {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'caution';
  return 'risky';
}