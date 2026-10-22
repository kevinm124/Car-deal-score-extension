// src/data/knownIssues.js – curated, documented problems for the models most common on avto.net.
//
// Each issue can be narrowed by:
//   y     [fromYear, toYear]   first-registration years affected
//   fuel  ['petrol', ...]      fuel types affected
//   gear  'dsg' | 'auto' | 'manual'
//   eng   regex source matched against the listing title/variant ("1.2 PureTech")
//   notEng regex that rules the issue out ("TSI" for the non-turbo 1.2)
//   hint  gearbox name ("DSG", "EDC"); without it a gearbox issue is only "possible"
//   ccm   [[min, max], ...]    engine displacement ranges
// sev: 1 = annoyance / cheap, 2 = notable repair, 3 = expensive or engine-threatening.
// cost: typical Slovenian independent-garage repair cost.
// check: what to ask or inspect before buying.
//
// Engine families are shared between brands (VW/Škoda/Seat/Audi, PSA/Opel/Ford/BMW, Renault/Dacia/Nissan/Mercedes).
CDS.knownIssues = (() => {
  // ---------- Volkswagen group ----------
  const VAG = {
    ea111chain: { id: 'vag-ea111', y: [2006, 2013], fuel: ['petrol'], eng: '1[.,][24] ?T[F]?SI|TSI ?1[.,][24]', ccm: [[1195, 1199], [1388, 1392]], sev: 3, cost: '€800–1,500',
      title: '1.2/1.4 TSI (EA111) timing chain stretch', detail: 'Chain tensioner/chain stretch can let the chain jump teeth and wreck the engine. Twincharger 1.4 TSI also had piston failures.',
      check: 'Listen for a 2–3 second rattle on a cold start. Ask if chain and tensioner were replaced.' },
    ea888oil: { id: 'vag-ea888g2', y: [2008, 2013], fuel: ['petrol'], eng: '1[.,]8 ?T[F]?SI|2[.,]0 ?T[F]?SI', ccm: [[1795, 1800], [1982, 1986]], sev: 3, cost: '€1,500–4,000',
      title: '1.8/2.0 TSI (EA888 Gen 2) oil consumption', detail: 'Faulty piston rings cause heavy oil burning (1 l / 1,000 km is not unusual); the early timing-chain tensioner can also fail.',
      check: 'Ask how often oil is topped up; check for blue smoke and a clean exhaust tip. Ask if pistons/rings were updated.' },
    ea888pump: { id: 'vag-ea888g3', y: [2013, 2022], fuel: ['petrol'], ccm: [[1982, 1986], [1795, 1800]], eng: '2[.,]0 ?T[F]?SI|1[.,]8 ?T[F]?SI', sev: 2, cost: '€400–800',
      title: 'EA888 Gen 3 plastic water pump / thermostat housing leak', detail: 'The plastic pump housing cracks and leaks coolant.',
      check: 'Look for pink coolant crust around the pump (left of engine) and a dropping coolant level.' },
    ea211pump: { id: 'vag-ea211', y: [2012, 2019], fuel: ['petrol'], eng: '1[.,][045] ?TSI', ccm: [[999, 1000], [1393, 1399], [1497, 1499]], sev: 1, cost: '€300–600',
      title: '1.0/1.4/1.5 TSI (EA211) coolant pump & thermostat housing leaks', detail: 'Common coolant leak; 1.5 TSI built 2017–2019 can also hesitate ("kangaroo") when cold.',
      check: 'Check coolant level and for leaks; on 1.5 TSI test pull-away from cold.' },
    pdTdi: { id: 'vag-pd20', y: [2003, 2009], fuel: ['diesel'], eng: '2[.,]0 ?TDI', ccm: [[1966, 1970]], sev: 3, cost: '€1,500–3,000',
      title: '2.0 TDI Pumpe-Düse (16V) cracked head / oil pump drive', detail: 'Some PD engines (BKD, BMM, BKP) crack the cylinder head; the hex shaft driving the oil pump can wear and starve the engine of oil.',
      check: 'Check coolant loss, white smoke and oil pressure warning; ask for repair invoices.' },
    ea189: { id: 'vag-ea189', y: [2009, 2016], fuel: ['diesel'], eng: '1[.,][26] ?TDI|2[.,]0 ?TDI', ccm: [[1596, 1600], [1966, 1970], [1597, 1599]], sev: 2, cost: '€600–2,000',
      title: '1.6/2.0 TDI (EA189) EGR, DPF and injectors', detail: 'The Dieselgate engine: after the software fix many suffer clogged EGR/DPF; 1.6 TDI injectors and EGR cooler also fail.',
      check: 'Ask if the dieselgate update was done; scan for EGR/DPF codes; check for limp mode on a long test drive.' },
    ea288: { id: 'vag-ea288', y: [2013, 2024], fuel: ['diesel'], eng: '1[.,][6] ?TDI|2[.,]0 ?TDI', ccm: [[1596, 1600], [1966, 1970]], sev: 2, cost: '€500–1,500',
      title: '1.6/2.0 TDI (EA288) EGR cooler & AdBlue system', detail: 'EGR cooler and thermostat failures; on Euro 6 cars the AdBlue heater/pump and NOx sensors are common faults.',
      check: 'Scan for AdBlue/NOx fault codes; ask about EGR cooler or AdBlue repairs.' },
    dq200: { id: 'vag-dq200', y: [2008, 2024], gear: 'dsg', ccm: [[900, 1600]], sev: 3, cost: '€1,000–2,500',
      title: '7-speed dry DSG (DQ200) mechatronics & clutch', detail: 'The dry-clutch DSG used with small engines is known for mechatronic unit failures and clutch judder.',
      check: 'Test pull-away and slow traffic: shudder, hesitation or flashing gear indicator = trouble. Ask about mechatronic replacement.' },
    dq250: { id: 'vag-dq250', y: [2004, 2024], gear: 'dsg', ccm: [[1700, 3200]], sev: 2, cost: '€250 service / €1,500+ repair',
      title: 'Wet-clutch DSG needs oil every 60,000 km', detail: 'Wet DSG (DQ250/DQ381/DQ500) is robust if the oil and filter are changed every 60k km; skipped services lead to mechatronic faults.',
      check: 'Ask for proof of DSG oil service at 60k-km intervals.' }
  };

  // ---------- PSA (Peugeot, Citroën, DS, Opel since 2019) ----------
  const PSA = {
    puretech: { id: 'psa-puretech', y: [2014, 2023], fuel: ['petrol', 'hybrid'], eng: 'pure ?tech|1[.,]2 ?(e-?)?thp|1[.,]2 ?vti|1[.,]2 ?turbo|1[.,]2 ?t\\b|1[.,]2 ?(110|130|155)', ccm: [[1196, 1200]], sev: 3, cost: '€1,000–5,000',
      title: '1.2 PureTech wet timing belt & oil consumption', detail: 'The belt runs in oil and disintegrates; debris clogs the oil pickup and can destroy the engine. High oil consumption is common. Stellantis extended the warranty on many cars.',
      check: 'Ask when the timing belt was replaced (recommended every 60–100k km / 6 yr) and for oil consumption. Check the Stellantis warranty extension for this VIN.' },
    thp: { id: 'psa-thp', y: [2006, 2016], fuel: ['petrol'], eng: '1[.,]6 ?(thp|vti|turbo)|thp|1[.,]4 ?vti', ccm: [[1596, 1600], [1395, 1399]], sev: 3, cost: '€1,200–3,000',
      title: '1.4/1.6 VTi & THP (Prince) timing chain and carbon build-up', detail: 'Shared with MINI/BMW: timing chain stretch, oil consumption, carbon on intake valves, high-pressure fuel pump failure (THP).',
      check: 'Cold-start rattle, misfires at idle, oil consumption. Ask for chain replacement invoice.' },
    hdi16: { id: 'psa-dv6', y: [2004, 2016], fuel: ['diesel'], eng: '1[.,]6 ?(e-?)?hdi|1[.,]6 ?tdci|1[.,]6 ?d\\b', ccm: [[1556, 1562]], sev: 2, cost: '€500–1,800',
      title: '1.6 HDi/TDCi (DV6) injector seals & turbo oil feed', detail: 'Leaking injector copper washers coat the engine in carbon ("black death"); a blocked oil-feed filter kills turbos. Older cars need DPF additive (Eolys).',
      check: 'Look for black tar around injectors, ticking at idle, blue smoke. Ask if the turbo oil feed filter was removed when the turbo was changed.' },
    bluehdi: { id: 'psa-bluehdi', y: [2015, 2024], fuel: ['diesel'], eng: 'blue ?hdi|1[.,]5 ?hdi|1[.,]5 ?d\\b|1[.,]5 ?diesel', ccm: [[1497, 1500], [1556, 1562], [1995, 1999]], sev: 2, cost: '€800–1,800',
      title: 'BlueHDi AdBlue tank/pump failure', detail: 'The AdBlue tank & pump unit fails (often with an "engine start prevented in X km" warning). 1.5 BlueHDi also has timing-belt wear issues.',
      check: 'Check for AdBlue warnings on the dash; ask if the AdBlue tank was replaced under warranty.' },
    robot: { id: 'psa-etg', y: [2009, 2017], gear: 'auto', hint: 'etg|egs|bmp6|2-?tronic|cmp', sev: 2, cost: '€600–1,500',
      title: 'Robotised manual gearbox (ETG/EGS/BMP6) jerks and actuator faults', detail: 'Single-clutch robotised boxes are slow and jerky; clutch actuators and wear are common. (The later EAT6/EAT8 torque converters are much better.)',
      check: 'Drive in town traffic: long pauses between gears or a "gearbox fault" message are bad signs.' },
    rearAxle: { id: 'psa-axle', y: [1998, 2012], sev: 2, cost: '€400–1,000',
      title: 'Rear trailing-arm bearings wear (rear axle)', detail: 'Rear wheels tilt inward ("negative camber") as the needle bearings wear out.',
      check: 'Look from behind: are the rear wheels leaning in at the top? Check uneven inner tyre wear.' }
  };

  // ---------- Renault / Dacia / Nissan ----------
  const RN = {
    tce12: { id: 'rn-h5ft', y: [2012, 2019], fuel: ['petrol'], eng: '1[.,]2 ?tce|tce ?(115|118|120|125|130)|1[.,]2 ?dig-?t|dig-?t ?115', ccm: [[1196, 1199]], sev: 3, cost: '€1,500–4,000',
      title: '1.2 TCe / DIG-T (H5Ft) oil consumption & engine failure', detail: 'Heavy oil burning that can lead to timing-chain jump and engine failure. Renault updated software and pistons in many cars.',
      check: 'Ask how much oil it uses and whether the Renault repair (pistons/software) was done. Avoid if oil warning light history.' },
    dci15old: { id: 'rn-k9k-old', y: [2001, 2010], fuel: ['diesel'], eng: '1[.,]5 ?dci', ccm: [[1460, 1462]], sev: 3, cost: '€1,500–3,000',
      title: '1.5 dCi (K9K) crankshaft bearing failure', detail: 'Early K9K engines spin big-end bearings when oil changes are stretched; Delphi injectors also fail.',
      check: 'Listen for knocking when warm. Ask for oil changes every 15k km or less.' },
    dci15: { id: 'rn-k9k', y: [2010, 2024], fuel: ['diesel'], eng: '1[.,]5 ?dci|blue ?dci ?(95|115)|1[.,]5 ?blue', ccm: [[1460, 1462]], sev: 2, cost: '€600–1,800',
      title: '1.5 dCi EGR, DPF and dual-mass flywheel', detail: 'Reliable if serviced, but EGR valves, DPF and the dual-mass flywheel are common wear items.',
      check: 'Rattle at idle that stops with the clutch pressed = flywheel. Check for EGR/DPF warnings.' },
    edc: { id: 'rn-edc', y: [2012, 2024], gear: 'auto', hint: 'edc|dct|xtronic', sev: 2, cost: '€800–2,500',
      title: 'EDC dual-clutch gearbox judder/overheating', detail: 'The dry-clutch EDC can judder in traffic and overheat; clutch packs and actuators wear.',
      check: 'Test in stop-and-go traffic and on a hill start.' },
    keycard: { id: 'rn-keycard', y: [2002, 2016], sev: 1, cost: '€150–500',
      title: 'Key-card reader, UCH and electrical gremlins', detail: 'Key-card not recognised, electric windows, dashboard and sensor faults are common on Renaults of this era.',
      check: 'Test every electric function and both key cards.' },
    epb: { id: 'rn-epb', y: [2003, 2016], sev: 2, cost: '€400–900',
      title: 'Electric parking brake failure', detail: 'The electric handbrake motor/control unit fails on Scénic/Grand Scénic and Mégane.',
      check: 'Apply and release the parking brake several times; watch for warning lights.' },
    rust: { id: 'dacia-rust', sev: 1, cost: '€200–800',
      title: 'Thin underbody protection – rust', detail: 'Budget build quality: underbody, subframe and exhaust rust early, especially on winter-salted Slovenian roads.',
      check: 'Look under the car at sills, subframe and brake lines.' },
    cvt: { id: 'nissan-cvt', y: [2007, 2021], gear: 'auto', hint: 'cvt|xtronic', sev: 2, cost: '€1,500–3,500',
      title: 'Xtronic CVT judder and failure', detail: 'Nissan’s CVT can judder, whine or slip; the fluid must be changed regularly.',
      check: 'Listen for whine on acceleration; feel for juddering at low speed.' }
  };

  // ---------- Ford ----------
  const FORD = {
    ecoboost1: { id: 'ford-10eb', y: [2012, 2024], fuel: ['petrol', 'hybrid'], eng: '1[.,]0 ?eco ?boost|1[.,]0 ?ecob|ecoboost ?(100|125|140)|1[.,]0 ?t\\b', ccm: [[997, 1000]], sev: 3, cost: '€800–4,000',
      title: '1.0 EcoBoost coolant leaks / overheating, wet belt', detail: 'Early engines (2012–2017) had coolant hose failures that overheat and crack the head; later engines use an oil-bathed belt that degrades like PureTech.',
      check: 'Check coolant level and service history; ask if the coolant-hose recall and belt replacement were done.' },
    ecoboost16: { id: 'ford-16eb', y: [2010, 2016], fuel: ['petrol'], eng: '1[.,]6 ?eco ?boost|1[.,]6 ?scti', ccm: [[1595, 1597]], sev: 3, cost: '€1,500–4,000',
      title: '1.6 EcoBoost overheating (fire recall)', detail: 'Coolant loss could cause cylinder-head cracking and engine-bay fires; a recall installed a coolant sensor.',
      check: 'Verify the recall was performed; check for coolant loss.' },
    powershift: { id: 'ford-dps6', y: [2010, 2018], gear: 'auto', hint: 'powershift|pshift|dct', ccm: [[990, 1700]], sev: 3, cost: '€1,000–2,500',
      title: 'PowerShift dry dual-clutch (DPS6) shudder & TCM failure', detail: 'Notorious shudder, slipping and control-module failures on Focus/Fiesta/C-Max.',
      check: 'Feel for shudder from standstill and hesitation 1st→2nd. Ask about clutch/TCM replacement.' },
    tdci20: { id: 'ford-20tdci', y: [2010, 2020], fuel: ['diesel'], eng: '2[.,]0 ?tdci|2[.,]0 ?ecoblue', ccm: [[1995, 1999]], sev: 2, cost: '€600–1,800',
      title: '2.0 TDCi DPF, EGR and dual-mass flywheel', detail: 'Short-trip use clogs the DPF; the dual-mass flywheel and EGR valve are common replacements.',
      check: 'Check for DPF warnings and idle rattle.' }
  };

  // ---------- GM-era Opel ----------
  const OPEL = {
    twinport: { id: 'opel-twinport', y: [2004, 2012], fuel: ['petrol'], eng: 'twinport|1[.,][024] ?(16v|ecotec|xe[pr])', notEng: 'turbo|\\bt\\b|cdti', ccm: [[996, 999], [1227, 1231], [1362, 1366]], sev: 2, cost: '€500–1,200',
      title: '1.0/1.2/1.4 Twinport timing chain & intake flap', detail: 'Timing chain stretch and the Twinport intake flap breaking (rough running, engine light).',
      check: 'Cold-start rattle, rough idle, engine light.' },
    turbo14: { id: 'opel-a14net', y: [2010, 2019], fuel: ['petrol'], eng: '1[.,]4 ?(t|turbo)\\b', ccm: [[1362, 1366]], sev: 2, cost: '€300–1,200',
      title: '1.4 Turbo PCV valve & turbo coolant leaks', detail: 'The PCV membrane in the cam cover fails (whistling, rough idle, oil consumption); turbo coolant lines leak.',
      check: 'Whistling at idle, oil in the intake, coolant loss.' },
    cdti13: { id: 'fiat-13mj', y: [2004, 2018], fuel: ['diesel'], eng: '1[.,]3 ?(cdti|multijet|mjet|jtd|ddis)', ccm: [[1246, 1250]], sev: 2, cost: '€500–1,500',
      title: '1.3 CDTI/Multijet DPF, EGR and timing chain', detail: 'Fiat-built small diesel: DPF/EGR clog in town use, early engines stretch the timing chain, oil level rises from DPF regen.',
      check: 'Check oil level (rising = fuel dilution), DPF warnings, chain rattle.' },
    cdti19: { id: 'opel-19cdti', y: [2004, 2011], fuel: ['diesel'], eng: '1[.,]9 ?(cdti|jtd)', ccm: [[1909, 1911]], sev: 2, cost: '€500–1,200',
      title: '1.9 CDTI swirl flaps & EGR', detail: 'Swirl-flap actuators seize/ break and the EGR valve clogs.',
      check: 'Engine light with limp mode under acceleration.' },
    cdti20: { id: 'opel-20cdti', y: [2008, 2017], fuel: ['diesel'], eng: '2[.,]0 ?cdti', ccm: [[1955, 1958]], sev: 2, cost: '€800–2,000',
      title: '2.0 CDTI dual-mass flywheel, EGR and injectors', detail: 'Insignia/Astra J diesel: flywheel and clutch wear, EGR cooler, injector faults, timing belt/water pump interval.',
      check: 'Idle rattle, smoke, and timing-belt invoice (every 150k km / 10 yr).' },
    easytronic: { id: 'opel-easytronic', y: [2004, 2015], gear: 'auto', hint: 'easytronic', sev: 2, cost: '€500–1,500',
      title: 'Easytronic robotised gearbox failures', detail: 'Actuator, clutch and position sensor faults; jerky shifts.',
      check: 'Slow, jerky shifts or "N" flashing are warning signs.' }
  };

  // ---------- BMW / MINI ----------
  const BMW = {
    n47: { id: 'bmw-n47', y: [2007, 2014], fuel: ['diesel'], eng: '(1|2|3|5)(16|18|20|23|25)d|x[13] ?(s|x)drive ?(18|20|23)d|n47', ccm: [[1993, 1997]], sev: 3, cost: '€2,000–4,500',
      title: 'N47 2.0d timing chain failure', detail: 'The timing chain sits at the gearbox end; it stretches and can snap, destroying the engine. Repair requires removing the engine.',
      check: 'Listen for a whine/rattle at the back of the engine at idle. Ask for a chain-replacement invoice.' },
    n20: { id: 'bmw-n20', y: [2011, 2016], fuel: ['petrol'], eng: '(1|2|3|4|5)(20|25|28)i|x[1345] ?(s|x)drive ?(20|28)i|z4 ?(s|x)drive ?(20|28)i', ccm: [[1996, 1999]], sev: 3, cost: '€1,500–3,500',
      title: 'N20 2.0 petrol timing chain guide', detail: 'The plastic chain guide breaks up and the chain can fail.',
      check: 'Rattle at idle/cold start; ask for chain-guide replacement.' },
    n13: { id: 'bmw-n13', y: [2011, 2015], fuel: ['petrol'], eng: '1(14|16|18)i|3(16)i', ccm: [[1597, 1599]], sev: 3, cost: '€1,200–3,000',
      title: 'N13 1.6 petrol timing chain & carbon', detail: 'PSA-derived engine shares the THP problems: timing chain, high-pressure pump, carbon build-up.',
      check: 'Cold-start rattle, misfires.' },
    egr: { id: 'bmw-egr', y: [2008, 2020], fuel: ['diesel'], sev: 2, cost: '€600–1,500 (recall if not done)',
      title: 'Diesel EGR cooler leak (recall)', detail: 'B47/N47/N57 EGR coolers can leak and in rare cases catch fire; BMW recalled most cars.',
      check: 'Ask BMW (or check the VIN) whether the EGR recall was completed.' },
    swirl: { id: 'bmw-swirl', y: [2001, 2008], fuel: ['diesel'], sev: 3, cost: '€300 preventive / engine if it fails',
      title: 'M47/M57 swirl flaps', detail: 'Swirl flaps can break off and be sucked into the engine.',
      check: 'Ask whether swirl flaps were removed/blanked.' },
    leaks: { id: 'bmw-leaks', sev: 1, cost: '€300–900',
      title: 'Oil leaks (valve cover, oil-filter housing gasket)', detail: 'Rubber gaskets harden with age; oil on the exhaust smells and can damage belts.',
      check: 'Look for oil around the valve cover and filter housing; burning oil smell after the drive.' },
    xdrive: { id: 'bmw-xdrive', y: [2004, 2020], eng: 'xdrive|x[1-7]', sev: 2, cost: '€500–2,500',
      title: 'xDrive transfer-case actuator / transfer case', detail: 'Actuator motor gear wears out; mismatched tyres kill the transfer case.',
      check: 'Feel for binding on full-lock turns; ensure all four tyres are the same brand/size.' }
  };

  // ---------- Mercedes-Benz ----------
  const MB = {
    om651: { id: 'mb-om651', y: [2008, 2016], fuel: ['diesel'], eng: '(180|200|220|250) ?(cdi|d|bluetec)|om651', ccm: [[2141, 2145]], sev: 3, cost: '€1,000–3,500',
      title: 'OM651 2.1 CDI injectors & timing chain', detail: 'Early (2008–2011) Delphi piezo injectors failed (Bosch replacements under campaign); timing chain and tensioner wear.',
      check: 'Rough idle, misfire codes; ask whether Delphi injectors were swapped to Bosch.' },
    om646: { id: 'mb-om646', y: [2002, 2009], fuel: ['diesel'], ccm: [[2146, 2151]], sev: 2, cost: '€400–1,200',
      title: 'OM646 2.2 CDI injector seals & EGR', detail: 'Leaking injector seals (carbon build-up) and EGR clogging.',
      check: 'Black tar around injectors; diesel smell in the cabin.' },
    m271: { id: 'mb-m271', y: [2002, 2012], fuel: ['petrol'], eng: 'kompressor|(180|200) ?(cgi|k)\\b', ccm: [[1794, 1798]], sev: 3, cost: '€1,500–3,000',
      title: 'M271 1.8 Kompressor timing chain', detail: 'Timing chain stretch and camshaft adjuster failure.',
      check: 'Rattle on start-up; check-engine light for cam timing.' },
    k15dci: { id: 'mb-om607', y: [2012, 2019], fuel: ['diesel'], eng: '(160|180) ?(cdi|d)\\b', ccm: [[1460, 1462]], sev: 2, cost: '€600–1,800',
      title: 'Renault-built 1.5 dCi (A160d/A180d, B180d, CLA180d)', detail: 'Shares the Renault K9K’s EGR, DPF and flywheel issues.',
      check: 'EGR/DPF warnings, idle rattle.' },
    g7: { id: 'mb-7g', y: [2004, 2016], gear: 'auto', hint: '7g|tronic|automatik|avtomat', sev: 2, cost: '€800–1,500',
      title: '7G-Tronic conductor plate / valve body', detail: 'The conductor plate (speed sensors) fails – harsh shifts or stuck in limp gear.',
      check: 'Harsh or delayed shifts, gearbox stuck in 2nd/3rd. Ask about gearbox oil changes.' },
    rust: { id: 'mb-rust', y: [1996, 2010], sev: 2, cost: '€300–2,000',
      title: 'Corrosion (wheel arches, doors, boot lid)', detail: 'Mercedes of this era rust around arches, door bottoms and the boot lid.',
      check: 'Inspect arches, door bottoms and around the number plate lights.' }
  };

  // ---------- Toyota / Lexus ----------
  const TOY = {
    ad: { id: 'toy-2ad', y: [2005, 2010], fuel: ['diesel'], eng: '2[.,][02] ?d-?4d|2[.,]2 ?d-?cat', ccm: [[1995, 1999], [2229, 2233]], sev: 3, cost: '€2,000–4,000',
      title: '2.0/2.2 D-4D (AD) head gasket & oil consumption', detail: 'Head gasket failure and excessive oil use; Toyota extended warranty on many cars.',
      check: 'Coolant loss, white smoke, oil consumption. Ask if the engine was repaired under the Toyota campaign.' },
    d4d14: { id: 'toy-1nd', y: [2002, 2014], fuel: ['diesel'], eng: '1[.,]4 ?d-?4d', ccm: [[1362, 1366]], sev: 2, cost: '€400–1,500',
      title: '1.4 D-4D oil consumption & injectors', detail: 'Can burn oil and injector faults occur at high mileage.',
      check: 'Ask about oil top-ups; check for smoke.' },
    mmt: { id: 'toy-mmt', y: [2005, 2012], gear: 'auto', hint: 'mmt|multimode', sev: 2, cost: '€600–1,500',
      title: 'MMT robotised gearbox', detail: 'Clutch actuator faults and jerky shifts; needs clutch-position re-learning.',
      check: 'Jerky shifts, "F" on the gear display.' },
    zz: { id: 'toy-1zz', y: [2000, 2006], fuel: ['petrol'], ccm: [[1793, 1796]], sev: 2, cost: '€800–2,000',
      title: '1ZZ 1.8 VVT-i oil consumption', detail: 'Early 1.8 engines can burn significant oil due to piston-ring design.',
      check: 'Oil level and blue smoke on revving.' },
    cat: { id: 'toy-cat', y: [2004, 2024], fuel: ['hybrid'], sev: 1, cost: '€1,000+ if stolen',
      title: 'Catalytic converter theft target', detail: 'Hybrid Toyotas (Auris, Prius, C-HR, RAV4) are a favourite target for catalyst thieves.',
      check: 'Confirm the original catalyst is fitted; consider a cat-lock.' }
  };

  // ---------- Hyundai / Kia ----------
  const HK = {
    gdi16: { id: 'hk-gdi16', y: [2011, 2018], fuel: ['petrol'], eng: '1[.,]6 ?gdi', ccm: [[1590, 1592]], sev: 3, cost: '€1,500–4,000',
      title: '1.6 GDI (Gamma) oil consumption & piston knock', detail: 'Direct-injection 1.6 can burn oil, build carbon and in some cases fail bearings.',
      check: 'Knock/tick when warm, oil consumption, check-engine light.' },
    crdi: { id: 'hk-crdi', y: [2010, 2019], fuel: ['diesel'], eng: '1[.,][67] ?crdi', ccm: [[1580, 1600], [1683, 1690]], sev: 2, cost: '€600–1,800',
      title: '1.6/1.7 CRDi dual-mass flywheel & DPF', detail: 'Flywheel and clutch wear early; DPF clogs with short trips.',
      check: 'Idle rattle, clutch judder, DPF warnings.' },
    dct: { id: 'hk-dct', y: [2015, 2024], gear: 'auto', hint: 'dct|dcg', sev: 2, cost: '€800–2,000',
      title: '7-speed DCT judder', detail: 'Dry dual-clutch can judder and overheat in traffic.',
      check: 'Stop-and-go and hill-start test.' },
    spring: { id: 'kia-spring', y: [2007, 2013], sev: 1, cost: '€150–300',
      title: 'Front coil springs break', detail: 'Ceed/i30 first generation front springs snap (often on cold days).',
      check: 'Knocking from the front over bumps; look at the spring coils.' }
  };

  // ---------- Mazda ----------
  const MAZ = {
    d22: { id: 'mazda-22d', y: [2008, 2018], fuel: ['diesel'], eng: '2[.,]2 ?(d|cd|skyactiv-?d|mzr)|cd ?(150|175|185)|skyactiv-?d', ccm: [[2182, 2192]], sev: 3, cost: '€1,500–5,000',
      title: '2.2 diesel oil dilution, injector seals & timing chain', detail: 'Fuel dilutes the oil during DPF regeneration (oil level rises), injector seals leak and the chain stretches – can lead to engine failure.',
      check: 'Check if oil level is ABOVE max; ask for frequent oil changes and Mazda software update.' },
    rust: { id: 'mazda-rust', y: [2003, 2013], sev: 2, cost: '€300–1,500',
      title: 'Rear wheel-arch and sill rust', detail: 'Older Mazda 3/6 rust badly around the rear arches.',
      check: 'Inspect rear arches and sills closely.' }
  };

  const GOOD = (text) => ({ positive: true, title: text });

  // ---------- Models ----------
  // Keys are canonical "MAKE MODEL" (see CDS.data.normKey). Aliases point to another key.
  const MODELS = {
    'VOLKSWAGEN GOLF': [VAG.ea111chain, VAG.ea888oil, VAG.ea888pump, VAG.ea211pump, VAG.pdTdi, VAG.ea189, VAG.ea288, VAG.dq200, VAG.dq250,
      { id: 'golf8-sw', y: [2020, 2023], sev: 1, cost: 'software', title: 'Golf 8 infotainment/software bugs', detail: 'Early Golf 8 had freezing screens, lane-assist and key faults; most fixed by updates.', check: 'Ask if software is up to date; test the screen and climate controls.' }],
    'VOLKSWAGEN PASSAT': [VAG.ea111chain, VAG.ea888oil, VAG.ea888pump, VAG.pdTdi, VAG.ea189, VAG.ea288, VAG.dq200, VAG.dq250,
      { id: 'passat-epb', y: [2005, 2015], sev: 1, cost: '€300–600', title: 'Electric parking brake motors', detail: 'Rear calliper motors for the electronic handbrake fail.', check: 'Apply/release several times; listen to both sides.' }],
    'VOLKSWAGEN POLO': [VAG.ea111chain, VAG.ea211pump, VAG.ea189, VAG.ea288, VAG.dq200,
      { id: 'polo-12-3cyl', y: [2002, 2014], fuel: ['petrol'], eng: '1[.,]2 ?(12v|6v|htp)', notEng: 'tsi|tdi', ccm: [[1197, 1199]], sev: 2, cost: '€500–1,500', title: '1.2 3-cylinder (non-TSI) timing chain & valves', detail: 'Early 1.2 6V/12V chain stretch and burnt valves; rough idle.', check: 'Rattle on start, misfire at idle.' }],
    'VOLKSWAGEN TOURAN': [VAG.ea111chain, VAG.ea211pump, VAG.pdTdi, VAG.ea189, VAG.ea288, VAG.dq200, VAG.dq250],
    'VOLKSWAGEN TIGUAN': [VAG.ea111chain, VAG.ea888oil, VAG.ea888pump, VAG.ea189, VAG.ea288, VAG.dq250,
      { id: 'tiguan-haldex', y: [2008, 2024], eng: '4motion|4x4', sev: 1, cost: '€150 service / €800+ pump', title: 'Haldex 4MOTION pump & oil', detail: 'Haldex coupling oil/filter neglected → pump failure, front-wheel drive only.', check: 'Ask for Haldex service every 3 years/60k km.' }],
    'VOLKSWAGEN CADDY': [VAG.ea111chain, VAG.ea211pump, VAG.pdTdi, VAG.ea189, VAG.ea288, VAG.dq200, VAG.dq250],
    'VOLKSWAGEN T-ROC': [VAG.ea211pump, VAG.ea288, VAG.dq200, VAG.dq250],
    'VOLKSWAGEN SHARAN': [VAG.ea111chain, VAG.ea888oil, VAG.ea189, VAG.ea288, VAG.dq250],
    'VOLKSWAGEN UP!': [GOOD('Simple, generally reliable city car'),
      { id: 'up-asg', gear: 'auto', sev: 1, cost: '€400–900', title: 'ASG automated manual is slow and jerky', detail: 'Single-clutch automated gearbox; clutch actuator faults.', check: 'Test shifts in town.' }],
    'VOLKSWAGEN TRANSPORTER': [VAG.ea189, VAG.ea288, VAG.dq250,
      { id: 't5-25tdi', y: [2003, 2009], fuel: ['diesel'], eng: '2[.,]5 ?tdi', ccm: [[2459, 2462]], sev: 3, cost: '€2,000–4,000', title: '2.5 TDI R5 camshaft & oil-pump drive', detail: 'Camshaft lobe wear and oil-pump hex drive failure on the 5-cylinder PD engine.', check: 'Ticking, loss of power, oil pressure light.' },
      { id: 't5-rust', y: [2003, 2015], sev: 1, cost: '€300–1,500', title: 'Sliding door and sill rust', detail: 'Rust around the sliding door runner, sills and wheel arches.', check: 'Inspect sliding door track and sills.' }],
    'VOLKSWAGEN MULTIVAN': 'VOLKSWAGEN TRANSPORTER',
    'VOLKSWAGEN CARAVELLE': 'VOLKSWAGEN TRANSPORTER',
    'VOLKSWAGEN ID.3': [{ id: 'id3-sw', y: [2020, 2023], sev: 1, cost: 'software', title: 'Software glitches (early ID.3)', detail: 'Frozen screens, 12V battery drain and charging errors on early cars; fixed by over-the-air updates.', check: 'Check software version (3.x+), test DC charging.' }],

    'SKODA OCTAVIA': [VAG.ea111chain, VAG.ea888oil, VAG.ea888pump, VAG.ea211pump, VAG.pdTdi, VAG.ea189, VAG.ea288, VAG.dq200, VAG.dq250],
    'SKODA SUPERB': [VAG.ea111chain, VAG.ea888oil, VAG.ea888pump, VAG.pdTdi, VAG.ea189, VAG.ea288, VAG.dq200, VAG.dq250],
    'SKODA FABIA': [VAG.ea111chain, VAG.ea211pump, VAG.ea189, VAG.dq200,
      { id: 'fabia-12htp', y: [2002, 2014], fuel: ['petrol'], eng: '1[.,]2 ?(htp|12v|6v)', notEng: 'tsi|tdi', ccm: [[1197, 1199]], sev: 2, cost: '€500–1,500', title: '1.2 HTP timing chain & valves', detail: 'The 3-cylinder 1.2 HTP stretches its timing chain and can burn valves.', check: 'Cold-start rattle and rough idle.' }],
    'SKODA RAPID': [VAG.ea111chain, VAG.ea211pump, VAG.ea189, VAG.ea288, VAG.dq200],
    'SKODA KODIAQ': [VAG.ea211pump, VAG.ea888pump, VAG.ea288, VAG.dq200, VAG.dq250],
    'SKODA KAROQ': [VAG.ea211pump, VAG.ea288, VAG.dq200, VAG.dq250],
    'SKODA YETI': [VAG.ea111chain, VAG.ea189, VAG.dq200, VAG.dq250],
    'SKODA SCALA': [VAG.ea211pump, VAG.ea288, VAG.dq200],
    'SKODA KAMIQ': [VAG.ea211pump, VAG.ea288, VAG.dq200],
    'SEAT LEON': [VAG.ea111chain, VAG.ea888oil, VAG.ea888pump, VAG.ea211pump, VAG.pdTdi, VAG.ea189, VAG.ea288, VAG.dq200, VAG.dq250],
    'SEAT IBIZA': [VAG.ea111chain, VAG.ea211pump, VAG.ea189, VAG.ea288, VAG.dq200],
    'SEAT ATECA': [VAG.ea211pump, VAG.ea288, VAG.dq200, VAG.dq250],
    'SEAT ALHAMBRA': 'VOLKSWAGEN SHARAN',
    'CUPRA FORMENTOR': [VAG.ea211pump, VAG.ea888pump, VAG.dq200, VAG.dq250],
    'AUDI A3': [VAG.ea111chain, VAG.ea888oil, VAG.ea888pump, VAG.ea211pump, VAG.pdTdi, VAG.ea189, VAG.ea288, VAG.dq200, VAG.dq250],
    'AUDI A4': [VAG.ea888oil, VAG.ea888pump, VAG.pdTdi, VAG.ea189, VAG.ea288,
      { id: 'audi-multitronic', y: [2000, 2016], gear: 'auto', hint: 'multitronic|cvt', sev: 3, cost: '€1,500–3,500', title: 'Multitronic CVT failure', detail: 'Front-wheel-drive automatic Audis used the Multitronic CVT – control unit and clutch pack failures are common.', check: 'Judder pulling away, hesitation or flashing gear display.' },
      { id: 'audi-v6tdi', y: [2004, 2014], fuel: ['diesel'], eng: '2[.,]7 ?tdi|3[.,]0 ?tdi', ccm: [[2696, 2700], [2966, 2970]], sev: 3, cost: '€2,500–5,000', title: '2.7/3.0 V6 TDI timing chains', detail: 'Chains at the gearbox end stretch; engine has to come out for repair.', check: 'Rattle at idle/cold; ask for chain invoices.' },
      { id: 'audi-stronic', y: [2009, 2018], gear: 'dsg', hint: 's-?tronic', sev: 2, cost: '€1,000–2,500', title: 'S-tronic (DL501) mechatronics', detail: '7-speed longitudinal S-tronic mechatronic/clutch faults.', check: 'Jerky shifts, reverse engagement delay.' }],
    'AUDI A5': 'AUDI A4',
    'AUDI A6': 'AUDI A4',
    'AUDI Q5': 'AUDI A4',
    'AUDI Q3': [VAG.ea888oil, VAG.ea888pump, VAG.ea211pump, VAG.ea189, VAG.ea288, VAG.dq200, VAG.dq250],
    'AUDI A1': [VAG.ea111chain, VAG.ea211pump, VAG.ea189, VAG.dq200],

    'PEUGEOT 206': [PSA.rearAxle, PSA.hdi16, { id: 'p206-elec', sev: 1, cost: '€100–400', title: 'BSI electrical faults', detail: 'Body computer (BSI) causes random warning lights, wipers and locking faults.', check: 'Test all electrics.' }],
    'PEUGEOT 207': [PSA.thp, PSA.hdi16, PSA.robot],
    'PEUGEOT 208': [PSA.puretech, PSA.thp, PSA.hdi16, PSA.bluehdi, PSA.robot],
    'PEUGEOT 2008': [PSA.puretech, PSA.hdi16, PSA.bluehdi, PSA.robot],
    'PEUGEOT 308': [PSA.puretech, PSA.thp, PSA.hdi16, PSA.bluehdi, PSA.robot],
    'PEUGEOT 3008': [PSA.puretech, PSA.thp, PSA.hdi16, PSA.bluehdi, PSA.robot],
    'PEUGEOT 5008': 'PEUGEOT 3008',
    'PEUGEOT 508': [PSA.puretech, PSA.thp, PSA.hdi16, PSA.bluehdi],
    'PEUGEOT PARTNER': [PSA.rearAxle, PSA.hdi16, PSA.bluehdi, PSA.puretech],
    'PEUGEOT RIFTER': 'PEUGEOT PARTNER',
    'CITROEN C3': [PSA.puretech, PSA.thp, PSA.hdi16, PSA.bluehdi, PSA.robot],
    'CITROEN C4': [PSA.puretech, PSA.thp, PSA.hdi16, PSA.bluehdi, PSA.robot,
      { id: 'c4p-epb', y: [2006, 2018], eng: 'picasso|spacetourer', sev: 2, cost: '€400–900', title: 'Electric parking brake (C4 Picasso)', detail: 'Parking brake motor/control unit failure is very common on C4 Picasso.', check: 'Apply and release several times; listen for grinding.' }],
    'CITROEN C4 PICASSO': 'CITROEN C4',
    'CITROEN GRAND C4': 'CITROEN C4',
    'CITROEN C5': [PSA.thp, PSA.hdi16, PSA.bluehdi,
      { id: 'c5-hydro', y: [2001, 2017], sev: 2, cost: '€300–1,200', title: 'Hydractive suspension spheres/pump', detail: 'Hydropneumatic suspension spheres and height sensors wear; car sits low.', check: 'Car should rise evenly after start; no suspension warning.' }],
    'CITROEN BERLINGO': [PSA.rearAxle, PSA.hdi16, PSA.bluehdi, PSA.puretech],
    'CITROEN C3 AIRCROSS': [PSA.puretech, PSA.bluehdi],
    'CITROEN C5 AIRCROSS': [PSA.puretech, PSA.bluehdi],
    'DS DS3': 'CITROEN C3',

    'OPEL ASTRA': [OPEL.twinport, OPEL.turbo14, OPEL.cdti13, OPEL.cdti19, OPEL.cdti20, OPEL.easytronic,
      { ...PSA.puretech, y: [2021, 2024] }],
    'OPEL CORSA': [OPEL.twinport, OPEL.turbo14, OPEL.cdti13, OPEL.easytronic, { ...PSA.puretech, y: [2019, 2024] }, { ...PSA.bluehdi, y: [2019, 2024] }],
    'OPEL INSIGNIA': [OPEL.turbo14, OPEL.cdti20,
      { id: 'ins-epb', y: [2008, 2017], sev: 1, cost: '€300–700', title: 'Electric parking brake & infotainment faults', detail: 'Parking brake switch/module and infotainment glitches.', check: 'Test parking brake and screen.' }],
    'OPEL ZAFIRA': [OPEL.twinport, OPEL.turbo14, OPEL.cdti19, OPEL.cdti20,
      { id: 'zafira-blower', y: [2005, 2014], sev: 2, cost: '€100–300 (recall)', title: 'Blower motor resistor overheating (fire recall)', detail: 'Zafira B heater resistor could overheat and cause fires; Opel recalled the cars.', check: 'Verify the recall was done; heater fan must work on all speeds.' }],
    'OPEL MERIVA': [OPEL.twinport, OPEL.turbo14, OPEL.cdti13, OPEL.easytronic],
    'OPEL MOKKA': [OPEL.turbo14, { id: 'mokka-17', y: [2012, 2016], fuel: ['diesel'], eng: '1[.,]7 ?cdti', sev: 1, cost: '€400–1,000', title: '1.7 CDTI EGR & injector faults', detail: 'EGR valve and injector issues.', check: 'Rough running and smoke.' }, { ...PSA.puretech, y: [2020, 2024] }],
    'OPEL CROSSLAND': [PSA.puretech, PSA.bluehdi],
    'OPEL GRANDLAND': [PSA.puretech, PSA.bluehdi],

    'RENAULT CLIO': [RN.tce12, RN.dci15old, RN.dci15, RN.edc, RN.keycard],
    'RENAULT MEGANE': [RN.tce12, RN.dci15old, RN.dci15, RN.edc, RN.keycard, RN.epb,
      { id: 'meg-19dci', y: [2002, 2012], fuel: ['diesel'], eng: '1[.,]9 ?dci', ccm: [[1868, 1871]], sev: 2, cost: '€800–2,000', title: '1.9 dCi turbo and dual-mass flywheel', detail: 'Turbo failures (oil starvation) and flywheel wear.', check: 'Blue smoke, turbo whistle, idle rattle.' }],
    'RENAULT SCENIC': [RN.tce12, RN.dci15old, RN.dci15, RN.edc, RN.keycard, RN.epb],
    'RENAULT GRAND SCENIC': 'RENAULT SCENIC',
    'RENAULT GRAND': 'RENAULT SCENIC',
    'RENAULT CAPTUR': [RN.tce12, RN.dci15, RN.edc,
      { id: 'captur-09', y: [2013, 2019], fuel: ['petrol'], eng: '0[.,]9 ?tce|tce ?90', ccm: [[897, 900]], sev: 1, cost: '€300–800', title: '0.9 TCe ignition coils & turbo actuator', detail: 'Coil-pack and wastegate actuator faults; occasional oil consumption.', check: 'Misfire, low power.' }],
    'RENAULT KADJAR': [RN.tce12, RN.dci15, RN.edc],
    'RENAULT KANGOO': [RN.dci15old, RN.dci15, RN.rust],
    'RENAULT TRAFIC': [RN.dci15old,
      { id: 'trafic-dci', y: [2001, 2014], fuel: ['diesel'], eng: '2[.,][05] ?dci', sev: 2, cost: '€800–2,000', title: '2.0/2.5 dCi turbo & injectors', detail: 'Turbo failures and injector problems on the older Trafic.', check: 'Smoke, power loss, turbo whistle.' },
      { id: 'trafic-16', y: [2014, 2024], fuel: ['diesel'], eng: '1[.,]6 ?dci', ccm: [[1597, 1599]], sev: 1, cost: '€400–1,200', title: '1.6 dCi (R9M) EGR & turbo actuator', detail: 'EGR valve and turbo actuator faults.', check: 'Engine light and limp mode.' }],
    'RENAULT ZOE': [{ id: 'zoe-lease', sev: 2, cost: '€70–120/month', title: 'Battery may be leased, not owned', detail: 'Many Zoes were sold with a battery rental contract – you would have to take over the monthly rent.', check: 'Ask whether the battery is owned ("baterija v lasti") or rented, and for an SoH report.' },
      { id: 'zoe-charger', y: [2013, 2019], sev: 2, cost: '€500–2,000', title: 'On-board charger (Chameleon) faults', detail: 'Charging errors and charger failures on Q210/R240 versions.', check: 'Test AC charging on a public charger.' }],
    'RENAULT TWINGO': [RN.keycard, GOOD('Mechanically simple')],
    'DACIA SANDERO': [RN.tce12, RN.dci15old, RN.dci15, RN.rust],
    'DACIA LOGAN': 'DACIA SANDERO',
    'DACIA DUSTER': [RN.tce12, RN.dci15, RN.rust],
    'DACIA LODGY': [RN.tce12, RN.dci15, RN.rust],
    'DACIA DOKKER': [RN.dci15, RN.rust],
    'NISSAN QASHQAI': [RN.tce12, RN.dci15, RN.cvt,
      { id: 'qq-r9m', y: [2013, 2020], fuel: ['diesel'], eng: '1[.,]6 ?dci', ccm: [[1597, 1599]], sev: 1, cost: '€400–1,200', title: '1.6 dCi (R9M) EGR & stop-start battery', detail: 'EGR valve and stop-start battery issues.', check: 'Engine light; stop-start should work.' }],
    'NISSAN JUKE': [RN.tce12, RN.dci15, RN.cvt,
      { id: 'juke-16t', y: [2010, 2019], fuel: ['petrol'], eng: '1[.,]6 ?(dig-?t|turbo)|nismo', ccm: [[1617, 1620]], sev: 2, cost: '€1,000–2,500', title: '1.6 DIG-T turbo and timing chain', detail: 'Turbo oil-feed and timing chain issues on the 1.6 turbo.', check: 'Rattle on start, turbo whistle.' }],
    'NISSAN MICRA': [{ id: 'micra-cr12', y: [2003, 2010], fuel: ['petrol'], ccm: [[1238, 1242]], sev: 2, cost: '€500–1,000', title: '1.2 (CR12) timing chain & crank sensor', detail: 'Chain stretch and crank-position sensor failures (car cuts out).', check: 'Cold-start rattle; stalling when warm.' }, RN.dci15old, RN.dci15],
    'NISSAN X-TRAIL': [RN.dci15, RN.cvt],

    'FORD FOCUS': [FORD.ecoboost1, FORD.ecoboost16, FORD.powershift, PSA.hdi16, FORD.tdci20],
    'FORD FIESTA': [FORD.ecoboost1, FORD.powershift, PSA.hdi16],
    'FORD C-MAX': [FORD.ecoboost1, FORD.ecoboost16, FORD.powershift, PSA.hdi16, FORD.tdci20],
    'FORD KUGA': [FORD.ecoboost16, FORD.tdci20, { ...FORD.ecoboost16, id: 'ford-15eb', y: [2014, 2019], eng: '1[.,]5 ?eco ?boost', ccm: [[1497, 1499]], title: '1.5 EcoBoost coolant intrusion' },
      { id: 'kuga-phev', y: [2020, 2021], fuel: ['plugin'], sev: 2, cost: 'recall', title: 'Kuga PHEV battery recall', detail: 'Battery cells could overheat; Ford recalled and replaced battery modules.', check: 'Confirm the battery recall was completed.' }],
    'FORD MONDEO': [FORD.ecoboost16, FORD.powershift, FORD.tdci20],
    'FORD TRANSIT': [FORD.tdci20, { id: 'transit-rust', sev: 1, cost: '€300–1,500', title: 'Body rust and injector issues', detail: 'Rust on doors/sills; 2.2 TDCi injectors and HP pump faults.', check: 'Inspect sills, rear doors; smoke on start.' }],
    'FORD B-MAX': [FORD.ecoboost1, FORD.powershift],
    'FORD ECOSPORT': [FORD.ecoboost1, FORD.powershift],

    'FIAT PUNTO': [OPEL.cdti13, { id: 'fiat-eps', y: [2003, 2018], sev: 1, cost: '€300–700', title: 'Electric power steering failure', detail: 'EPS motor/torque sensor fails – steering becomes heavy.', check: 'Steering should be light and quiet at standstill.' },
      { id: 'fiat-dualogic', y: [2005, 2018], gear: 'auto', hint: 'dualogic|robot', sev: 2, cost: '€600–1,500', title: 'Dualogic robotised gearbox', detail: 'Hydraulic pump/actuator failures, jerky shifts.', check: 'Slow shifts, gearbox warning light.' }],
    'FIAT GRANDE': 'FIAT PUNTO',
    'FIAT PANDA': [OPEL.cdti13, { id: 'fiat-eps', y: [2003, 2018], sev: 1, cost: '€300–700', title: 'Electric power steering failure', detail: 'EPS motor/torque sensor fails – steering becomes heavy.', check: 'Steering should be light and quiet at standstill.' },
      { id: 'fiat-twinair', y: [2010, 2024], fuel: ['petrol'], eng: 'twin ?air|0[.,]9', ccm: [[874, 876]], sev: 2, cost: '€600–1,200', title: '0.9 TwinAir MultiAir actuator', detail: 'The hydraulic valve-lift module fails (misfires, engine light) and real fuel use is high.', check: 'Rough running and engine light.' }],
    'FIAT 500': [OPEL.cdti13, { id: 'fiat-twinair', y: [2010, 2024], fuel: ['petrol'], eng: 'twin ?air|0[.,]9', ccm: [[874, 876]], sev: 2, cost: '€600–1,200', title: '0.9 TwinAir MultiAir actuator', detail: 'The hydraulic valve-lift module fails (misfires, engine light).', check: 'Rough running and engine light.' },
      { id: 'fiat-dualogic', y: [2007, 2018], gear: 'auto', hint: 'dualogic|robot', sev: 2, cost: '€600–1,500', title: 'Dualogic robotised gearbox', detail: 'Hydraulic pump/actuator failures, jerky shifts.', check: 'Slow shifts, gearbox warning light.' }],
    'FIAT DOBLO': [OPEL.cdti13, { id: 'doblo-16mj', y: [2010, 2022], fuel: ['diesel'], eng: '1[.,]6 ?(multijet|mjet|jtd)', sev: 1, cost: '€400–1,200', title: '1.6 Multijet EGR/DPF', detail: 'EGR and DPF clogging on short trips.', check: 'DPF warnings.' }],
    'FIAT TIPO': [OPEL.cdti13, GOOD('Simple mechanics, cheap parts')],

    'BMW 1': [BMW.n47, BMW.n13, BMW.n20, BMW.egr, BMW.leaks],
    'BMW 2': [BMW.n47, BMW.n20, BMW.egr, BMW.leaks],
    'BMW 3': [BMW.n47, BMW.n20, BMW.n13, BMW.egr, BMW.swirl, BMW.leaks, BMW.xdrive],
    'BMW 4': [BMW.n47, BMW.n20, BMW.egr, BMW.leaks],
    'BMW 5': [BMW.n47, BMW.n20, BMW.egr, BMW.swirl, BMW.leaks, BMW.xdrive],
    'BMW X1': [BMW.n47, BMW.n20, BMW.egr, BMW.leaks, BMW.xdrive],
    'BMW X3': [BMW.n47, BMW.n20, BMW.egr, BMW.swirl, BMW.leaks, BMW.xdrive],
    'BMW X5': [BMW.egr, BMW.swirl, BMW.leaks, BMW.xdrive,
      { id: 'x5-air', y: [2007, 2018], sev: 2, cost: '€400–1,200', title: 'Rear air-suspension bags', detail: 'Rear air springs leak – car sags overnight.', check: 'Is the rear lower after standing? Compressor running often?' }],
    'BMW X6': 'BMW X5',
    'MINI COOPER': [{ ...PSA.thp, id: 'mini-prince', y: [2006, 2014] }, BMW.n47, BMW.leaks],
    'MINI ONE': 'MINI COOPER',
    'MINI MINI': 'MINI COOPER',

    'MERCEDES BENZ A': [MB.m271, MB.k15dci, MB.g7, MB.rust,
      { id: 'mb-autotronic', y: [2004, 2012], gear: 'auto', sev: 3, cost: '€1,500–3,000', title: 'Autotronic CVT (A/B-class W169/W245)', detail: 'CVT failure is common on the older A/B-class automatics.', check: 'Whine, slipping or limp mode.' },
      { id: 'mb-7gdct', y: [2012, 2024], gear: 'auto', hint: '7g-?dct|dct', sev: 2, cost: '€800–2,000', title: '7G-DCT dual-clutch judder', detail: 'Hesitation and judder, mechatronic faults on 7G-DCT.', check: 'Pull-away and parking manoeuvres.' }],
    'MERCEDES BENZ B': 'MERCEDES BENZ A',
    'MERCEDES BENZ CLA': 'MERCEDES BENZ A',
    'MERCEDES BENZ C': [MB.om651, MB.om646, MB.m271, MB.g7, MB.rust],
    'MERCEDES BENZ E': [MB.om651, MB.om646, MB.m271, MB.g7, MB.rust,
      { id: 'mb-sbc', y: [2002, 2006], sev: 3, cost: '€1,000–2,000', title: 'SBC brake system (W211)', detail: 'Sensotronic brake control pump has a limited life and fails.', check: 'SBC warning on the dash; ask whether the SBC unit was replaced.' }],
    'MERCEDES BENZ GLC': [MB.om651, MB.g7],
    'MERCEDES BENZ GLK': [MB.om651, MB.g7],
    'MERCEDES BENZ ML': [MB.g7, MB.rust, { id: 'ml-air', y: [2005, 2015], sev: 2, cost: '€500–1,500', title: 'Airmatic suspension and transfer case', detail: 'Air-suspension leaks and transfer case wear.', check: 'Car sits level after standing; no clunks on tight turns.' }],
    'MERCEDES BENZ VITO': [MB.om651, MB.om646, MB.rust],
    'MERCEDES BENZ SPRINTER': [MB.om651, MB.om646, MB.rust],

    'TOYOTA YARIS': [TOY.d4d14, TOY.mmt, TOY.cat, GOOD('Toyota petrol & hybrid powertrains are among the most reliable')],
    'TOYOTA AURIS': [TOY.ad, TOY.d4d14, TOY.mmt, TOY.cat],
    'TOYOTA COROLLA': [TOY.ad, TOY.d4d14, TOY.mmt, TOY.zz, TOY.cat],
    'TOYOTA AVENSIS': [TOY.ad, TOY.zz],
    'TOYOTA RAV4': [TOY.ad, TOY.cat, GOOD('RAV4 hybrid has an excellent reliability record')],
    'TOYOTA C-HR': [TOY.cat, GOOD('Hybrid powertrain very reliable')],
    'TOYOTA PRIUS': [TOY.cat, { id: 'prius-pump', y: [2004, 2015], sev: 1, cost: '€200–400', title: 'Inverter coolant pump', detail: 'Inverter coolant pump failure triggers hybrid system warnings.', check: 'No hybrid system warnings; pump should be audible after switch-on.' }],

    'HYUNDAI I30': [HK.gdi16, HK.crdi, HK.dct, HK.spring],
    'HYUNDAI I20': [HK.crdi, GOOD('Generally dependable')],
    'HYUNDAI IX35': [HK.gdi16, HK.crdi],
    'HYUNDAI TUCSON': [HK.gdi16, HK.crdi, HK.dct],
    'HYUNDAI KONA': [HK.dct, { id: 'kona-ev', y: [2018, 2020], fuel: ['electric'], sev: 2, cost: 'recall', title: 'Kona Electric battery recall', detail: 'Early Kona Electric batteries were recalled for fire risk (cell replacement).', check: 'Confirm battery recall/replacement.' }],
    'KIA CEED': [HK.gdi16, HK.crdi, HK.dct, HK.spring],
    'KIA SPORTAGE': [HK.gdi16, HK.crdi, HK.dct],
    'KIA RIO': [HK.crdi, GOOD('Generally dependable')],
    'KIA PICANTO': [GOOD('Simple and reliable city car')],
    'KIA NIRO': [HK.dct, GOOD('Hybrid powertrain generally reliable')],

    'MAZDA 3': [MAZ.d22, MAZ.rust, GOOD('Skyactiv-G petrol engines are very reliable')],
    'MAZDA 6': [MAZ.d22, MAZ.rust],
    'MAZDA CX-5': [MAZ.d22, GOOD('Petrol versions very reliable')],
    'MAZDA 2': [GOOD('Simple and reliable')],

    'HONDA JAZZ': [{ id: 'jazz-cvt', y: [2002, 2008], gear: 'auto', sev: 2, cost: '€1,000–2,000', title: 'Early CVT (Jazz I) judder & failure', detail: 'First-generation CVT is fragile; fluid must be changed regularly.', check: 'Judder pulling away.' }, GOOD('Excellent overall reliability')],
    'HONDA CIVIC': [{ id: 'civic-ictdi', y: [2005, 2012], fuel: ['diesel'], eng: '2[.,]2 ?i-?ctdi', sev: 2, cost: '€800–1,800', title: '2.2 i-CTDi dual-mass flywheel & clutch', detail: 'Flywheel/clutch wear on the 2.2 diesel.', check: 'Idle rattle, clutch slip.' }, GOOD('Petrol engines very reliable')],
    'HONDA CR-V': [{ id: 'crv-ictdi', y: [2005, 2012], fuel: ['diesel'], eng: '2[.,]2 ?i-?ctdi', sev: 2, cost: '€800–1,800', title: '2.2 i-CTDi dual-mass flywheel & clutch', detail: 'Flywheel/clutch wear on the 2.2 diesel.', check: 'Idle rattle, clutch slip.' }],

    'SUZUKI VITARA': [GOOD('Good reliability record'), { id: 'vitara-ddis', y: [2015, 2020], fuel: ['diesel'], eng: '1[.,]6 ?ddis', sev: 1, cost: '€400–1,200', title: '1.6 DDiS (Fiat) DPF', detail: 'DPF clogging on short trips.', check: 'DPF warning.' }],
    'SUZUKI SWIFT': [GOOD('Good reliability record')],
    'SUZUKI SX4': [OPEL.cdti13, GOOD('Petrol versions reliable')],

    'TESLA MODEL': [{ id: 'tesla-arms', y: [2018, 2024], sev: 1, cost: '€300–800', title: 'Front upper control arms creak/wear', detail: 'Front upper control arms wear early (creaking over bumps).', check: 'Listen for creaks over speed bumps.' },
      { id: 'tesla-12v', y: [2018, 2022], sev: 1, cost: '€150–300', title: '12V battery and heat-pump (Octovalve) faults', detail: 'Low-voltage battery failures; some 2021 cars had heat-pump faults.', check: 'Ask for the battery degradation (SoH) figure and service history.' }]
  };

  function resolve(key) {
    let v = MODELS[key];
    let hops = 0;
    while (typeof v === 'string' && hops++ < 4) v = MODELS[v];
    return Array.isArray(v) ? v : null;
  }

  // car: { make, model, variant, title, year, fuel, gearbox, ccm }
  function match(car) {
    const keys = CDS.data.candidateKeys(car.make, car.model, car.variant);
    let key = null, list = null;
    for (const k of keys) { list = resolve(k); if (list) { key = k; break; } }
    if (!list) return null;

    const hay = `${car.title || ''} ${car.variant || ''}`.toLowerCase();
    const items = [];
    const positives = [];
    for (const it of list) {
      if (it.positive) { positives.push(it.title); continue; }
      let unknown = 0;

      if (it.y) {
        if (!car.year) unknown++;
        else if (car.year < it.y[0] || car.year > it.y[1]) continue;
      }
      if (it.fuel) {
        if (!car.fuel) unknown++;
        else if (!it.fuel.includes(car.fuel)) continue;
      }
      if (it.gear) {
        const g = car.gearbox;
        if (!g) unknown++;
        else if (it.gear === 'dsg' && g !== 'dsg') continue;
        else if (it.gear === 'auto' && g === 'manual') continue;
        else if (it.gear === 'manual' && g !== 'manual') continue;
      }
      if (it.notEng && new RegExp(it.notEng, 'i').test(hay)) continue;
      if (it.eng || it.ccm) {
        const engHit = it.eng ? new RegExp(it.eng, 'i').test(hay) : false;
        const ccmHit = it.ccm && car.ccm ? it.ccm.some(([a, b]) => car.ccm >= a && car.ccm <= b) : false;
        if (!engHit && !ccmHit) {
          // Engine is known and doesn't match -> skip. Unknown engine -> "possible".
          if (car.ccm || /\d[.,]\d/.test(hay)) continue;
          unknown++;
        }
      }
      // Gearbox-specific issues: a name hint in the title confirms which gearbox it is.
      if (it.hint && !new RegExp(it.hint, 'i').test(hay) && !unknown) unknown++;
      items.push({ ...it, status: unknown ? 'possible' : 'likely' });
    }
    items.sort((a, b) => (a.status === b.status ? b.sev - a.sev : a.status === 'likely' ? -1 : 1));
    return { key, items, positives };
  }

  return { match, MODELS };
})();
