// src/lib/parser.js – reads car data out of avto.net pages.
// Detail pages: h3 title, summary tiles, "Osnovni podatki" spec table, equipment/comment table.
// Results pages: one .GO-Results-Row per listing.
CDS.parser = (() => {
  const { toInt, toFloat, norm, listingIdFromUrl } = CDS.util;

  const VAG = /^(VOLKSWAGEN|VW|AUDI|SKODA|SEAT|CUPRA)$/;

  function fuelOf(raw) {
    const f = (raw || '').toLowerCase();
    if (!f) return null;
    if (/plug.?in|priključn/.test(f)) return 'plugin';
    if (/hibrid|hybrid/.test(f)) return 'hybrid';
    if (/elektr|electric|\bev\b/.test(f)) return 'electric';
    if (/diesel|dizel/.test(f)) return 'diesel';
    if (/lpg|plin|cng/.test(f)) return 'lpg';
    if (/bencin|petrol|benzin/.test(f)) return 'petrol';
    return null;
  }

  function gearboxOf(raw, title, make) {
    const g = `${raw || ''} ${title || ''}`.toLowerCase();
    if (/dsg|s-?tronic/.test(g)) return 'dsg';
    if (/cvt|multitronic|xtronic/.test(g)) return 'cvt';
    if (/ročni|rocni|manual/.test(raw || '')) return 'manual';
    if (/avtomat|automat|tiptronic|steptronic|edc|dct|powershift|eat\d|7g/.test(g)) {
      // Almost every automatic VW-group car since ~2005 is a DSG unless it says otherwise.
      return VAG.test(CDS.data.normMake(make || '')) && !/tiptronic|aisin/.test(g) ? 'dsg' : 'automatic';
    }
    return raw ? 'manual' : null;
  }

  function yearMonth(str) {
    const m = String(str || '').match(/(19[5-9]\d|20\d\d)(?:\s*\/\s*(\d{1,2}))?/);
    return m ? { year: parseInt(m[1], 10), month: m[2] ? parseInt(m[2], 10) : null } : null;
  }

  // label (normalised, without colon) -> value text, from every th/td row and summary tile.
  function collectFields(doc) {
    const fields = {};
    const put = (label, value) => {
      const k = norm(label).replace(/:$/, '').trim();
      const v = (value || '').replace(/\s+/g, ' ').trim();
      if (k && v && !(k in fields)) fields[k] = v;
    };
    doc.querySelectorAll('tr').forEach(tr => {
      const cells = tr.querySelectorAll('th, td');
      if (cells.length === 2) put(cells[0].textContent, cells[1].textContent);
    });
    // Summary tiles: <span class="text-muted">Lastnikov</span><h5>1</h5>
    doc.querySelectorAll('.media-body').forEach(mb => {
      const label = mb.querySelector('span');
      const value = mb.querySelector('h5');
      if (label && value) put(label.textContent, value.textContent);
    });
    doc.querySelectorAll('dl dt').forEach(dt => put(dt.textContent, dt.nextElementSibling?.textContent));
    return fields;
  }

  const pick = (fields, ...labels) => {
    for (const l of labels) {
      const key = norm(l);
      if (fields[key]) return fields[key];
    }
    for (const l of labels) {
      const key = Object.keys(fields).find(k => k.startsWith(norm(l)));
      if (key) return fields[key];
    }
    return null;
  };

  function engineOf(str) {
    const s = str || '';
    const kw = s.match(/(\d{2,4})\s*kW/i);
    const ccm = s.match(/(\d{3,5})\s*ccm/i);
    return { powerKw: kw ? parseInt(kw[1], 10) : null, ccm: ccm ? parseInt(ccm[1], 10) : null };
  }

  function titleParts(h3) {
    if (!h3) return null;
    const small = h3.querySelector('small');
    const variant = small ? small.textContent.replace(/\s+/g, ' ').trim() : '';
    const head = h3.textContent.replace(small ? small.textContent : '', '').replace(/ /g, ' ').replace(/[:]/g, ' ').trim();
    return { head, variant, full: `${head} ${variant}`.replace(/\s+/g, ' ').trim() };
  }

  function parseDetails(doc = document, url = location.href) {
    const fields = collectFields(doc);
    const meta = doc.querySelector('meta[name="description"]')?.content || '';
    const tp = titleParts(doc.querySelector('h3'));
    const metaTitle = meta.split(',')[0].trim();

    const split = CDS.data.splitTitle(tp?.head || metaTitle);
    const make = split.make;
    const model = split.model;
    const variant = [split.variant, tp?.variant].filter(Boolean).join(' ').trim();
    const title = tp?.full || metaTitle;

    // Price: the big bold € figure in the price card; with a discount, take the lower one.
    let price = null;
    // Skip the price without VAT ("oz. 63.893 € + DDV") and struck-out old prices.
    const priceEls = [...doc.querySelectorAll('p.h1, p.h2, .h1, .h2')].filter(e => /€/.test(e.textContent) && e.textContent.length < 40 &&
      !/DDV|oz\./i.test(e.textContent) && !e.closest('del, s, strike, [style*="line-through"]'));
    const prices = priceEls.map(e => toInt(e.textContent)).filter(n => n && n >= 100);
    if (prices.length) price = Math.min(...prices);
    if (!price) { const m = meta.match(/(\d[\d.]*)\s*EUR/i); if (m) price = toInt(m[1]); }

    const reg = yearMonth(pick(fields, 'Prva registracija', 'Letnik', 'Leto proizvodnje')) ||
      yearMonth((meta.match(/letnik:\s*(\d{4})/i) || [])[1]);
    const engine = engineOf(pick(fields, 'Motor', 'Moč motorja'));
    const fuelRaw = pick(fields, 'Gorivo', 'Vrsta goriva');
    const gearRaw = pick(fields, 'Menjalnik');
    const ownersRaw = pick(fields, 'Lastnikov', 'Število lastnikov', 'Št. lastnikov');
    const inspection = yearMonth(pick(fields, 'Tehnični pregled velja do'));
    const euro = (pick(fields, 'Emisijski razred') || '').match(/euro\s*(\d)/i);
    const starost = (pick(fields, 'Starost') || '').toLowerCase();

    // Free text: the equipment / condition table, then the seller's own comment (#StareOpombe).
    const tables = [...doc.querySelectorAll('table')];
    const offerTable = tables.find(t => /oprema in ostali podatki|opis vozila|dodatni opis/i.test(t.textContent.slice(0, 200)));
    const commentEl = doc.querySelector('#StareOpombe, [id*="Opombe"]');
    const comment = (commentEl?.innerText || commentEl?.textContent || '').replace(/[ \t]+/g, ' ').trim();
    const description = [offerTable?.innerText || offerTable?.textContent || '', comment].join('\n').replace(/[ \t]+/g, ' ').trim();
    // The table lists items under headings ending in ":" ("Varnost:", "Udobje:", ..., "Stanje:").
    // "Stanje" holds the condition boxes the seller ticked; everything else is equipment.
    const conditionNotes = [];
    const equipment = [];
    if (offerTable) {
      let section = '';
      for (const raw of (offerTable.innerText || offerTable.textContent).split('\n')) {
        const line = raw.replace(/\s+/g, ' ').trim();
        if (!line || /^oprema in ostali podatki/i.test(line)) continue;
        if (/^[^:]{2,30}:$/.test(line)) { section = line.slice(0, -1).toLowerCase(); continue; }
        (section === 'stanje' ? conditionNotes : equipment).push(line);
      }
    }
    const bodyText = doc.body?.innerText || doc.body?.textContent || '';
    const dealerSince = (bodyText.match(/registriran kot trgovec na www\.avto\.net od (\d{1,2})\.(\d{1,2})\.(\d{4})/i) || []).slice(1).map(Number);

    return {
      id: listingIdFromUrl(url),
      url: url.split('#')[0],
      title,
      make,
      model,
      variant,
      price,
      year: reg?.year || null,
      month: reg?.month || null,
      mileage: toInt(pick(fields, 'Prevoženi km', 'Prevoženih', 'Kilometri')),
      owners: ownersRaw && /\d/.test(ownersRaw) ? toInt(ownersRaw) : null,
      fuelRaw,
      fuel: fuelOf(fuelRaw),
      gearboxRaw: gearRaw,
      gearbox: gearboxOf(gearRaw, title, make),
      powerKw: engine.powerKw,
      ccm: engine.ccm,
      body: pick(fields, 'Oblika'),
      color: pick(fields, 'Barva'),
      consumption: toFloat(pick(fields, 'Kombinirana vožnja')),
      euroClass: euro ? parseInt(euro[1], 10) : null,
      co2: toInt(pick(fields, 'Emisija CO2')),
      inspection,
      location: pick(fields, 'Kraj ogleda'),
      condition: /poškod|karambol/.test(starost) ? 'damaged' : /novo/.test(starost) ? 'new' : /test|demo/.test(starost) ? 'demo' : 'used',
      starostRaw: pick(fields, 'Starost'),
      sellerType: /registriran kot trgovec/i.test(bodyText) ? 'dealer' : 'private',
      dealerSince: dealerSince.length === 3 ? { day: dealerSince[0], month: dealerSince[1], year: dealerSince[2] } : null,
      description,
      comment,
      conditionNotes: conditionNotes.slice(0, 40),
      equipment: equipment.slice(0, 200),
      image: doc.querySelector('meta[property="og:image"]')?.content || null
    };
  }

  function parseResultRow(row, baseUrl = location.href) {
    const link = row.querySelector('a.stretched-link') || row.querySelector('a[href*="details.asp"]');
    if (!link) return null;
    const href = new URL(link.getAttribute('href'), baseUrl).href;
    const id = listingIdFromUrl(href);
    const title = (row.querySelector('.GO-Results-Naziv span, .GO-Results-Naziv')?.textContent || '').replace(/\s+/g, ' ').trim();
    const display = new URL(href).searchParams.get('display');
    const head = CDS.data.splitTitle(display || title);
    const full = CDS.data.splitTitle(title);

    const fields = {};
    // Promoted "TOP PONUDBA" rows use GO-Results-Top-* classes instead of GO-Results-*.
    row.querySelectorAll('.GO-Results-Data tr, .GO-Results-Top-Data tr').forEach(tr => {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 2) fields[norm(tds[0].textContent)] = tds[1].textContent.replace(/\s+/g, ' ').trim();
      else if (tds.length === 1 && /ccm|kW/.test(tds[0].textContent)) fields.MOTOR = tds[0].textContent.trim();
    });

    // Sale price ("AkcijaCena") wins over the regular one; the struck-out old price and the
    // price without VAT ("BruttoNeto") are never the asking price.
    const priceBox = row.querySelector('.GO-Results-PriceLogo .GO-Results-Price, .GO-Results-Top-PriceLogo .GO-Results-Top-Price') ||
      row.querySelector('.GO-Results-Price, .GO-Results-Top-Price');
    const priceOf = cls => toInt(priceBox?.querySelector(`[class*="Price-TXT-${cls}"]`)?.textContent);
    const prices = [priceOf('AkcijaCena'), priceOf('Regular')].filter(n => n && n >= 100);
    const sold = /prodano/i.test(priceBox?.textContent || '');
    const engine = engineOf(fields.MOTOR);
    const reg = yearMonth(fields['1.REGISTRACIJA'] || fields.LETNIK);
    const fuelRaw = fields.GORIVO || null;
    const gearRaw = fields.MENJALNIK || null;

    return {
      id,
      url: href,
      title,
      make: head.make,
      model: head.model,
      variant: full.variant || '',
      price: prices[0] || null,
      sold,
      year: reg?.year || null,
      mileage: toInt(fields['PREVOZENIH'] || fields['PREVOZENI KM']),
      owners: null,
      fuelRaw,
      fuel: fuelOf(fuelRaw),
      gearbox: gearboxOf(gearRaw, title, head.make),
      powerKw: engine.powerKw,
      ccm: engine.ccm,
      image: row.querySelector('.GO-Results-Photo img, .GO-Results-Top-Photo img')?.src || null
    };
  }

  return { parseDetails, parseResultRow, fuelOf, gearboxOf, yearMonth };
})();
