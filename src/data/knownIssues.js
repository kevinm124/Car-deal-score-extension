// src/data/knownIssues.js – curated, documented problems for the models most common on avto.net.
//
// Each issue can be narrowed by:
//   y     [fromYear, toYear]   first-registration years affected
//   fuel  ['petrol', ...]      fuel types affected
//   gear  'dsg' | 'auto' | 'manual'
//   eng   regex source matched against the listing title/variant ("1.2 PureTech")
//   notEng regex that rules the issue out ("TSI" for the non-turbo 1.2)
//   engRequired  the eng pattern must match even if ccm does (engines sharing a displacement)
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
    rust: { id: 'dacia-rust', y: [2004, 2016], sev: 1, cost: '€200–800',
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
    n20: { id: 'bmw-n20', y: [2011, 2016], fuel: ['petrol'], eng: '(1|2|3|4|5)(20|25|28)i|x[1345] ?(s|x)drive ?(20|28)i|z4 ?(s|x)drive ?(20|28)i', ccm: [[1997, 1997]], sev: 3, cost: '€1,500–3,500',
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
    leaks: { id: 'bmw-leaks', y: [2001, 2016], sev: 1, cost: '€300–900',
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
    k15dci: { id: 'mb-om607', same: 'rn-k9k', y: [2012, 2019], fuel: ['diesel'], eng: '(160|180) ?(cdi|d)\\b', ccm: [[1460, 1462]], sev: 2, cost: '€600–1,800',
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

  // ---------- More shared engines (added to the families above) ----------
  Object.assign(PSA, {
    dw10: { id: 'psa-dw10', y: [2004, 2017], fuel: ['diesel'], eng: '2[.,]0 ?(blue ?)?hdi|2[.,]0 ?d\\b|2[.,]0 ?tdci', ccm: [[1995, 1999]], sev: 2, cost: '€600–1,800',
      title: '2.0 HDi (DW10) dual-mass flywheel, EGR and injector seals', detail: 'Strong engine, but the dual-mass flywheel, EGR valve and injector seals are common replacements; DPF needs additive on older cars.',
      check: 'Rattle at idle that stops when the clutch is pressed; black tar around injectors; DPF warnings.' }
  });
  Object.assign(RN, {
    dci19: { id: 'rn-f9q', y: [2000, 2012], fuel: ['diesel'], eng: '1[.,]9 ?(dci|ddis)', ccm: [[1868, 1871]], sev: 2, cost: '€800–2,000',
      title: '1.9 dCi (F9Q) turbo and dual-mass flywheel', detail: 'Turbos fail from oil starvation, flywheels wear; also used by Suzuki (1.9 DDiS) and Nissan.',
      check: 'Blue smoke, turbo whistle, rattle at idle.' },
    dci20: { id: 'rn-m9r', y: [2006, 2016], fuel: ['diesel'], eng: '2[.,]0 ?(dci|cdti)', ccm: [[1994, 1996]], sev: 2, cost: '€800–2,500',
      title: '2.0 dCi (M9R) injectors, turbo and flywheel', detail: 'Injector failures and turbo/flywheel wear on Laguna, Koleos, Trafic, Qashqai/X-Trail 2.0 dCi and Opel Vivaro 2.0 CDTI.',
      check: 'Hard starting, smoke, rattle at idle.' }
  });
  Object.assign(OPEL, {
    ecotec1618: { id: 'gm-1618', y: [2008, 2016], fuel: ['petrol'], eng: '1[.,][68] ?(16v|ecotec|xer)?', notEng: 'turbo|cdti|\\bt\\b', ccm: [[1596, 1599], [1794, 1798]], sev: 1, cost: '€250–600',
      title: '1.6/1.8 Ecotec thermostat housing & valve-cover leaks', detail: 'Plastic thermostat housing and valve-cover gaskets leak coolant/oil (Astra J, Insignia, Cruze, Orlando).',
      check: 'Coolant level, oil around the valve cover.' },
    vcdi20: { id: 'gm-z20s', y: [2006, 2015], fuel: ['diesel'], eng: '2[.,]0 ?(vcdi|cdti|d)\\b', ccm: [[1990, 1992]], sev: 2, cost: '€600–1,800',
      title: '2.0 VCDi/CDTi (Captiva, Antara, Cruze) EGR, DPF and injectors', detail: 'EGR and DPF clog, injectors and timing-belt interval matter.',
      check: 'Smoke, DPF warning, timing-belt invoice.' }
  });
  Object.assign(BMW, {
    n54: { id: 'bmw-n54-n55', y: [2007, 2016], fuel: ['petrol'], notEng: '\\bm[234]\\b', eng: '(1|3|4|5)35i|x[3456] ?(x|s)drive ?35i|z4 ?(s)?drive ?35i', ccm: [[2978, 2981]], sev: 2, cost: '€600–2,000',
      title: '3.0 turbo (N54/N55) fuel pump, wastegates and water pump', detail: 'High-pressure fuel pump, wastegate rattle (N54) and the electric water pump are known failures.',
      check: 'Long cranking, limp mode, rattle on lift-off; ask for water pump replacement.' },
    n43: { id: 'bmw-n43-n53', y: [2007, 2013], fuel: ['petrol'], eng: '(1|3|5)(16|18|20|23|25|30)i', ccm: [[1995, 1997], [2996, 2997]], sev: 2, cost: '€500–1,500',
      title: 'N43/N53 direct-injection petrol: injectors, coils, NOx sensor', detail: 'Lean-burn engines suffer piezo injector, ignition coil and NOx sensor failures.',
      check: 'Misfire at idle, engine light, rough cold start.' }
  });
  Object.assign(MB, {
    m270: { id: 'mb-m270-274', y: [2012, 2019], fuel: ['petrol'], eng: '(160|180|200|250)\\b', ccm: [[1594, 1597], [1990, 1992]], sev: 2, cost: '€300–1,200',
      title: 'M270/M274 petrol: camshaft-adjuster oil leaks and rattle', detail: 'Camshaft-adjuster magnets leak oil into the wiring; adjusters rattle on cold start (A/B/CLA/GLA/C/E 1.6/2.0 petrol).',
      check: 'Oil at the cam-adjuster plugs, rattle for 1–2 s at cold start.' },
    om642: { id: 'mb-om642', y: [2005, 2018], fuel: ['diesel'], eng: '(280|300|320|350) ?(cdi|bluetec|d)\\b', ccm: [[2986, 2988]], sev: 2, cost: '€800–1,500',
      title: '3.0 V6 CDI (OM642) oil-cooler seal leak', detail: 'The oil-cooler seals in the V of the engine leak; labour-intensive repair.',
      check: 'Oil pooling on top of the gearbox / smell of burning oil.' },
    dct7: { id: 'mb-7gdct', y: [2012, 2024], gear: 'auto', hint: '7g-?dct|dct', sev: 2, cost: '€800–2,000',
      title: '7G-DCT dual-clutch judder', detail: 'Hesitation, judder and mechatronic faults on the 7G-DCT (A/B/CLA/GLA).',
      check: 'Pull-away and parking manoeuvres.' }
  });
  Object.assign(TOY, {
    bmwDiesel: { id: 'toy-n47', y: [2014, 2019], fuel: ['diesel'], eng: '1[.,]6 ?d-?4d|2[.,]0 ?d-?4d', ccm: [[1597, 1599], [1993, 1997]], sev: 3, cost: '€2,000–4,000',
      title: '1.6/2.0 D-4D (BMW N47) timing chain', detail: 'Toyota used BMW’s N47 diesel in Auris, Avensis and Verso from 2014 – it shares the rear-mounted timing-chain weakness.',
      check: 'Whine/rattle from the back of the engine; ask for chain invoices.' },
    kd30: { id: 'toy-1kd', y: [2002, 2012], fuel: ['diesel'], eng: '3[.,]0 ?d-?4d', ccm: [[2980, 2984]], sev: 3, cost: '€800–5,000',
      title: '3.0 D-4D (1KD) injector seals and piston cracking', detail: 'Leaking injector washers carbon up the engine; some 2007–2010 engines cracked pistons (Land Cruiser, Hilux).',
      check: 'Black smoke, blow-by from the oil cap, ticking at idle.' }
  });
  const HONDA = {
    ictdi: { id: 'honda-ictdi', y: [2004, 2012], fuel: ['diesel'], eng: '2[.,]2 ?i-?ctdi', ccm: [[2203, 2205]], sev: 2, cost: '€800–1,800',
      title: '2.2 i-CTDi dual-mass flywheel & clutch', detail: 'Flywheel and clutch wear on Civic, Accord, CR-V and FR-V diesels.',
      check: 'Idle rattle, clutch slip.' }
  };

  Object.assign(PSA, {
    puretechChain: { id: 'psa-puretech-chain', positive: true, y: [2024, 2030], fuel: ['petrol', 'hybrid'], eng: 'pure ?tech|1[.,]2 ?(e-?)?thp|1[.,]2 ?turbo|1[.,]2 ?t\\b|1[.,]2 ?(100|110|130|136|145|155)', ccm: [[1196, 1200]],
      title: '1.2 PureTech from 2024 uses a timing chain instead of the wet belt – the belt problem does not apply' }
  });
  Object.assign(HK, {
    crdiR: { id: 'hk-crdi-r', y: [2009, 2020], fuel: ['diesel'], eng: '2[.,][02] ?crdi', ccm: [[1994, 1999], [2198, 2200]], sev: 2, cost: '€500–2,000',
      title: '2.0/2.2 CRDi (R-engine) DPF, EGR and dual-mass flywheel', detail: 'Tucson/ix35/Sportage/Santa Fe/Sorento diesels clog the DPF and EGR on short trips; the dual-mass flywheel on manuals wears.',
      check: 'Long test drive watching for DPF/engine lights; idle rattle that stops with the clutch pressed.' },
    awd: { id: 'hk-awd', y: [2010, 2020], eng: '4wd|awd|4x4|htrac', sev: 1, cost: '€400–1,500',
      title: 'AWD coupling and rear-diff oil', detail: 'The electronic AWD coupling and rear differential need fluid changes; neglected ones whine or stop engaging.',
      check: 'Whine from the rear, AWD warning light; ask when the coupling/diff oil was changed.' }
  });
  Object.assign(MB, {
    g9: { id: 'mb-9g', y: [2014, 2024], gear: 'auto', hint: '9g', sev: 1, cost: '€300 service / €1,500+ valve body',
      title: '9G-Tronic harsh or delayed shifts', detail: 'Some 9G-Tronic gearboxes shift harshly; usually fixed by software and an oil service (often skipped).',
      check: 'Feel for clunky 1–2 and 2–3 shifts; ask for gearbox oil service and software updates.' },
    om654: { id: 'mb-om654-good', positive: true, y: [2016, 2030], fuel: ['diesel'], ccm: [[1949, 1951]],
      title: 'OM654 2.0 diesel (2016+) has a good reliability record so far' }
  });
  Object.assign(BMW, {
    s55: { id: 'bmw-s55', engRequired: true, y: [2014, 2020], fuel: ['petrol'], eng: '\\bm[234]\\b', ccm: [[2978, 2981]], sev: 3, cost: '€2,500–6,000',
      title: 'S55 (M2 Competition/M3/M4) crank-hub slip', detail: 'Under hard use the crankshaft hub can slip, shifting valve timing and potentially wrecking the engine. A pinned/upgraded hub is the usual fix.',
      check: 'Ask if the crank hub was pinned; avoid cars with timing-related fault codes.' },
    mRunning: { id: 'bmw-m-running', y: [2000, 2030], eng: '\\bm[2-8]\\b|\\bm(135|140|235|240|340|440|550)i?\\b', sev: 1, cost: '€2,000+/year',
      title: 'High running costs: brakes, tyres and oil services', detail: 'M cars wear out expensive brakes and tyres quickly; track days multiply it. Not a fault – a budget item.',
      check: 'Measure disc/pad thickness and tyre tread; ask about track use and oil-change intervals.' },
    s58: { id: 'bmw-s58-good', positive: true, engRequired: true, y: [2021, 2030], fuel: ['petrol'], eng: '\\bm[234]\\b', ccm: [[2992, 2994]],
      title: 'S58 engine (2021+ M2/M3/M4) has a good record so far' }
  });

  // ---------- Volvo ----------
  const VOLVO = {
    d5: { id: 'volvo-d5', y: [2001, 2016], fuel: ['diesel'], eng: '\\bd5\\b|d4\\b|d3\\b|2[.,]4 ?d', ccm: [[2398, 2401], [1983, 1985]], sev: 2, cost: '€400–1,500',
      title: '5-cylinder D5/D4/D3: intake swirl flaps, EGR and timing belt', detail: 'Swirl-flap actuators and the intake manifold fail; the timing belt and tensioner must be replaced on time (interference engine).',
      check: 'Ask for the timing-belt invoice (every 150k km / 10 yr); engine light for swirl/EGR.' },
    vea: { id: 'volvo-vea-oil', y: [2014, 2019], fuel: ['petrol'], eng: '\\bt[3456]\\b', ccm: [[1968, 1970]], sev: 3, cost: '€2,000–5,000',
      title: '2.0 Drive-E petrol (T4/T5/T6) oil consumption', detail: 'Piston-ring problem causes heavy oil use; Volvo extended the warranty on many 2015–2018 engines.',
      check: 'Ask how often oil is topped up and whether the piston/ring repair was done.' },
    aw: { id: 'volvo-tf80', y: [2002, 2014], gear: 'auto', sev: 2, cost: '€1,500–3,500',
      title: 'Aisin TF-80SC automatic gearbox wear', detail: 'Harsh or slipping shifts on XC90/XC60/V70/S80 automatics, especially without fluid changes.',
      check: 'Harsh 2–3 shift, flare between gears; ask about gearbox oil service.' }
  };

  // ---------- Land Rover / Jaguar ----------
  const JLR = {
    ingenium: { id: 'jlr-ingenium', y: [2015, 2020], fuel: ['diesel'], eng: 'td4|ed4|sd4|2[.,]0 ?d', ccm: [[1997, 2000]], sev: 3, cost: '€3,000–7,000',
      title: '2.0 Ingenium diesel timing chain & oil dilution', detail: 'Timing chain stretch and fuel diluting the oil (DPF regeneration) can destroy the engine (Evoque, Discovery Sport, Velar, Jaguar XE/XF/E-Pace).',
      check: 'Oil level above max = fuel dilution; ask for chain replacement and software updates.' },
    tdv6: { id: 'jlr-tdv6', y: [2009, 2016], fuel: ['diesel'], eng: 'tdv6|sdv6|3[.,]0 ?d', ccm: [[2992, 2994]], sev: 3, cost: '€5,000–10,000',
      title: '3.0 TDV6/SDV6 crankshaft failure', detail: 'Crankshaft or bearing failure, often from long oil-change intervals (Range Rover Sport, Discovery 4).',
      check: 'Knocking from the bottom end; insist on short oil-change history.' },
    air: { id: 'jlr-air', y: [2002, 2022], notEng: 'evoque|velar|discovery sport|freelander', sev: 2, cost: '€600–2,500',
      title: 'Air suspension leaks and compressor wear', detail: 'Air springs and the compressor wear out on Range Rover, Range Rover Sport and Discovery.',
      check: 'Car sits level after standing overnight; no suspension warnings.' },
    zf9: { id: 'jlr-9hp', y: [2014, 2019], gear: 'auto', sev: 1, cost: 'software / €500+',
      title: 'ZF 9-speed automatic harsh shifting', detail: 'Jerky low-speed shifts on 9-speed cars; often improved by software.',
      check: 'Test slow traffic and 2–1 downshifts.' }
  };

  // ---------- Fiat / Alfa Romeo / Jeep / Lancia ----------
  const FCA = {
    multiair: { id: 'fca-multiair', y: [2009, 2020], fuel: ['petrol'], eng: 'multi ?air|m-?air|1[.,]4 ?tb\\b', sev: 2, cost: '€600–1,500',
      title: '1.4 MultiAir hydraulic valve-lift module & oil use', detail: 'The MultiAir “UniAir” brick fails (misfire, engine light) and the engine can burn oil; needs the correct oil grade.',
      check: 'Engine light, misfire, oil level.' },
    mj2: { id: 'fca-mj2', y: [2008, 2022], fuel: ['diesel'], eng: '(1[.,]6|2[.,]0) ?(jtdm|multijet|mjet|mj|crd|ddis)', ccm: [[1597, 1599], [1955, 1957]], sev: 2, cost: '€600–1,800',
      title: '1.6/2.0 MultiJet II dual-mass flywheel, EGR and DPF', detail: 'Flywheel and EGR wear; oil level rises from DPF regeneration on short trips.',
      check: 'Oil level above max, idle rattle, DPF warnings.' },
    jtdm24: { id: 'fca-24jtdm', y: [2005, 2012], fuel: ['diesel'], eng: '2[.,]4 ?jtd', ccm: [[2386, 2388]], sev: 2, cost: '€500–1,500',
      title: '2.4 JTDm swirl flaps / intake manifold', detail: 'Swirl-flap actuator and intake manifold failures on the 5-cylinder diesel.',
      check: 'Engine light, power loss.' },
    tct: { id: 'fca-tct', y: [2010, 2020], gear: 'auto', hint: 'tct|dct|dualogic|robot', sev: 2, cost: '€600–1,800',
      title: 'Dualogic / TCT automated gearbox problems', detail: 'Single-clutch Dualogic actuators and early TCT dual-clutch units give jerky shifts and faults.',
      check: 'Slow, jerky shifts or gearbox warning.' },
    zf9: { id: 'fca-9hp', y: [2014, 2020], gear: 'auto', sev: 1, cost: 'software / €500+',
      title: 'ZF 9-speed automatic harsh shifting', detail: 'Jerky shifts and hesitation on 9-speed Jeep Renegade/Compass/Cherokee and Fiat 500X; improved by software.',
      check: 'Test slow traffic and kick-down.' }
  };

  // ---------- Subaru ----------
  const SUB = {
    ej25: { id: 'subaru-ej25', y: [1999, 2012], fuel: ['petrol', 'lpg'], ccm: [[2456, 2459]], sev: 3, cost: '€1,200–2,500',
      title: '2.5 EJ25 head-gasket leaks', detail: 'External oil/coolant leaks from the head gaskets are very common on the 2.5 boxer.',
      check: 'Oil/coolant weeping at the gasket line, sweet smell, overheating.' },
    fb: { id: 'subaru-fb', y: [2011, 2016], fuel: ['petrol', 'lpg'], ccm: [[1994, 1996], [2497, 2499]], sev: 2, cost: '€1,000–3,000',
      title: 'FB20/FB25 oil consumption', detail: 'Early FB engines used a lot of oil (piston rings).',
      check: 'Ask about oil top-ups.' },
    boxerD: { id: 'subaru-boxerd', y: [2008, 2016], fuel: ['diesel'], ccm: [[1997, 1999]], sev: 3, cost: '€1,500–6,000',
      title: '2.0D boxer diesel crankshaft, flywheel and DPF', detail: 'Crankshaft/bearing failures (early engines), dual-mass flywheel and DPF clogging.',
      check: 'Knocking, idle rattle, DPF warnings; ask about engine replacement history.' },
    cvt: { id: 'subaru-cvt', y: [2010, 2020], gear: 'auto', sev: 2, cost: '€1,500–4,000',
      title: 'Lineartronic CVT judder', detail: 'Judder and valve-body failures; fluid service is often skipped.',
      check: 'Judder pulling away, whine.' }
  };

  // ---------- Mitsubishi ----------
  const MIT = {
    phev: { id: 'mit-phev', y: [2013, 2022], fuel: ['plugin'], sev: 2, cost: 'battery capacity / €500+ charger',
      title: 'Outlander PHEV battery capacity and on-board charger', detail: 'Battery capacity drops with age and frequent fast charging; on-board charger faults occur.',
      check: 'Ask for a battery capacity test at a dealer; test AC charging.' },
    cvt: { id: 'mit-cvt', y: [2008, 2021], gear: 'auto', fuel: ['petrol'], sev: 2, cost: '€1,500–3,500',
      title: 'Jatco CVT judder', detail: 'CVT in ASX/Outlander/Lancer petrols can judder and overheat.',
      check: 'Judder pulling away, whine.' },
    did32: { id: 'mit-32did', y: [2000, 2007], fuel: ['diesel'], eng: '3[.,]2 ?di-?d', ccm: [[3198, 3201]], sev: 2, cost: '€800–2,500',
      title: '3.2 DI-D injectors and cylinder head', detail: 'Injector and injector-seal failures; some early engines cracked heads.',
      check: 'Smoke, rough idle, coolant loss.' }
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
    'FORD TRANSIT': [FORD.tdci20, { id: 'transit-rust', y: [2000, 2014], sev: 1, cost: '€300–1,500', title: 'Body rust and injector issues', detail: 'Rust on doors/sills; 2.2 TDCi injectors and HP pump faults.', check: 'Inspect sills, rear doors; smoke on start.' }],
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
    'MERCEDES BENZ C': [MB.om651, MB.om646, MB.m271, MB.m270, MB.g7, MB.g9, MB.om654, MB.rust],
    'MERCEDES BENZ E': [MB.om651, MB.om646, MB.m271, MB.g7, MB.rust,
      { id: 'mb-sbc', y: [2002, 2006], sev: 3, cost: '€1,000–2,000', title: 'SBC brake system (W211)', detail: 'Sensotronic brake control pump has a limited life and fails.', check: 'SBC warning on the dash; ask whether the SBC unit was replaced.' }],
    'MERCEDES BENZ GLC': [MB.om651, MB.g7, MB.g9, MB.om654],
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
    'HYUNDAI IX35': [HK.gdi16, HK.crdi, HK.crdiR, HK.awd],
    'HYUNDAI TUCSON': [HK.gdi16, HK.crdi, HK.crdiR, HK.awd, HK.dct],
    'HYUNDAI KONA': [HK.dct, { id: 'kona-ev', y: [2018, 2020], fuel: ['electric'], sev: 2, cost: 'recall', title: 'Kona Electric battery recall', detail: 'Early Kona Electric batteries were recalled for fire risk (cell replacement).', check: 'Confirm battery recall/replacement.' }],
    'KIA CEED': [HK.gdi16, HK.crdi, HK.dct, HK.spring],
    'KIA SPORTAGE': [HK.gdi16, HK.crdi, HK.crdiR, HK.awd, HK.dct],
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
      { id: 'tesla-12v', y: [2018, 2022], sev: 1, cost: '€150–300', title: '12V battery and heat-pump (Octovalve) faults', detail: 'Low-voltage battery failures; some 2021 cars had heat-pump faults.', check: 'Ask for the battery degradation (SoH) figure and service history.' }],

    // ---- Siblings that share platforms and engines ----
    'VOLKSWAGEN JETTA': 'VOLKSWAGEN GOLF',
    'VOLKSWAGEN ARTEON': 'VOLKSWAGEN PASSAT',
    'VOLKSWAGEN T-CROSS': 'VOLKSWAGEN POLO',
    'VOLKSWAGEN TAIGO': 'VOLKSWAGEN POLO',
    'VOLKSWAGEN BEETLE': 'VOLKSWAGEN GOLF',
    'VOLKSWAGEN SCIROCCO': 'VOLKSWAGEN GOLF',
    'VOLKSWAGEN EOS': 'VOLKSWAGEN GOLF',
    'SKODA CITIGO': 'VOLKSWAGEN UP!',
    'SEAT MII': 'VOLKSWAGEN UP!',
    'SKODA ROOMSTER': 'SKODA FABIA',
    'SEAT ARONA': 'SEAT IBIZA',
    'SEAT ALTEA': 'SEAT LEON',
    'SEAT TOLEDO': 'SEAT LEON',
    'SEAT TARRACO': 'SKODA KODIAQ',
    'AUDI Q2': 'AUDI A3',
    'AUDI TT': 'AUDI A3',
    'CITROEN C1': 'TOYOTA AYGO',
    'PEUGEOT 107': 'TOYOTA AYGO',
    'PEUGEOT 108': 'TOYOTA AYGO',
    'CITROEN C2': 'CITROEN C3',
    'CITROEN DS3': 'CITROEN C3',
    'CITROEN C-ELYSEE': 'CITROEN C3',
    'PEUGEOT 301': 'CITROEN C3',
    'PEUGEOT 307': 'PEUGEOT 308',
    'PEUGEOT 407': 'PEUGEOT 508',
    'PEUGEOT EXPERT': 'CITROEN JUMPY',
    'CITROEN SPACETOURER': 'CITROEN JUMPY',
    'TOYOTA PROACE': 'CITROEN JUMPY',
    'PEUGEOT BOXER': 'FIAT DUCATO',
    'CITROEN JUMPER': 'FIAT DUCATO',
    'FORD FUSION': 'FORD FIESTA',
    'FORD GRAND': 'FORD C-MAX',
    'FORD GALAXY': 'FORD S-MAX',
    'FORD TOURNEO': 'FORD TRANSIT',
    'RENAULT MODUS': 'RENAULT CLIO',
    'RENAULT TALISMAN': 'RENAULT LAGUNA',
    'RENAULT ARKANA': 'RENAULT CAPTUR',
    'DACIA SPRING': [{ id: 'spring-range', sev: 1, cost: '—', title: 'Small battery and slow DC charging', detail: 'Real-world range is 150–200 km and DC charging is optional/slow.', check: 'Check if DC charging (CCS) is fitted; ask for a battery health report.' }],
    'NISSAN NOTE': 'NISSAN MICRA',
    'OPEL VIVARO': 'RENAULT TRAFIC',
    'NISSAN PRIMASTAR': 'RENAULT TRAFIC',
    'MERCEDES BENZ GLA': 'MERCEDES BENZ A',
    'MERCEDES BENZ GLE': 'MERCEDES BENZ ML',
    'MERCEDES BENZ V': 'MERCEDES BENZ VITO',
    'MERCEDES BENZ CLS': 'MERCEDES BENZ E',
    'MERCEDES BENZ CLK': 'MERCEDES BENZ C',
    'MERCEDES BENZ SLK': 'MERCEDES BENZ C',
    'MERCEDES BENZ CITAN': 'RENAULT KANGOO',
    'KIA PRO_CEED': 'KIA CEED',
    'KIA PROCEED': 'KIA CEED',
    'KIA XCEED': 'KIA CEED',
    'KIA STONIC': 'KIA RIO',
    'KIA VENGA': 'HYUNDAI IX20',
    'HYUNDAI I10': 'KIA PICANTO',
    'HYUNDAI GETZ': 'HYUNDAI I20',
    'HYUNDAI IX20': [HK.crdi, GOOD('Generally dependable')],
    'HYUNDAI SANTA': 'HYUNDAI TUCSON',
    'HYUNDAI SANTA FE': 'HYUNDAI TUCSON',
    'KIA SORENTO': 'HYUNDAI TUCSON',
    'MAZDA CX-3': 'MAZDA 2',
    'MAZDA CX-30': 'MAZDA 3',
    'MAZDA MAZDA2': 'MAZDA 2',
    'MAZDA MAZDA3': 'MAZDA 3',
    'MAZDA MAZDA6': 'MAZDA 6',
    'MAZDA 5': [PSA.hdi16, MAZ.rust],
    'SUZUKI SEDICI': 'SUZUKI SX4',
    'FIAT SEDICI': 'SUZUKI SX4',
    'SUZUKI IGNIS': [GOOD('Simple, reliable small car')],
    'TOYOTA VERSO': [TOY.ad, TOY.bmwDiesel, TOY.d4d14],
    'TOYOTA AYGO': [GOOD('1.0 three-cylinder (Toyota 1KR) is very reliable'),
      { id: 'aygo-clutch', y: [2005, 2014], gear: 'manual', sev: 1, cost: '€400–700', title: 'Short clutch life and water leaks', detail: 'Clutches wear early in city use; rear-hatch seals can let water in.', check: 'Clutch bite point high? Damp carpets in the boot?' }],
    'TOYOTA LAND': [TOY.kd30, GOOD('Very durable chassis and drivetrain')],
    'TOYOTA HILUX': [TOY.kd30, { id: 'hilux-frame', y: [2005, 2015], sev: 2, cost: '€500–3,000', title: 'Chassis-frame rust', detail: 'Frames rust from inside on salted roads.', check: 'Inspect the frame rails from underneath.' }],

    // ---- Models with their own problems ----
    'VOLKSWAGEN TOUAREG': [VAG.ea189, VAG.ea288,
      { id: 'touareg-air', y: [2002, 2018], sev: 2, cost: '€600–2,000', title: 'Air suspension and transfer case', detail: 'Air springs/compressor and the transfer case wear on the heavy Touareg.', check: 'Car level after standing; no clunks on tight turns.' },
      { id: 'vag-v6tdi', y: [2004, 2016], fuel: ['diesel'], eng: '3[.,]0 ?tdi|v6 ?tdi', ccm: [[2966, 2970]], sev: 3, cost: '€2,500–5,000', title: '3.0 V6 TDI timing chains', detail: 'Chains at the gearbox end stretch; the engine has to come out to fix them.', check: 'Rattle at cold idle; chain invoices.' },
      { id: 't-25tdi', y: [2002, 2010], fuel: ['diesel'], eng: '2[.,]5 ?tdi|r5', ccm: [[2459, 2462]], sev: 3, cost: '€2,000–4,000', title: '2.5 TDI R5 camshaft wear', detail: 'Camshaft lobe and oil-pump drive wear on the 5-cylinder diesel.', check: 'Ticking, loss of power.' }],
    'AUDI Q7': [VAG.ea189, VAG.ea288,
      { id: 'q7-air', y: [2006, 2020], sev: 2, cost: '€600–2,000', title: 'Air suspension leaks', detail: 'Air springs and the compressor wear out.', check: 'Car level after standing; no suspension warning.' },
      { id: 'vag-v6tdi', y: [2004, 2016], fuel: ['diesel'], eng: '3[.,]0 ?tdi|v6 ?tdi', ccm: [[2966, 2970]], sev: 3, cost: '€2,500–5,000', title: '3.0 V6 TDI timing chains', detail: 'Chains at the gearbox end stretch; the engine has to come out to fix them.', check: 'Rattle at cold idle; chain invoices.' }],
    'FORD S-MAX': [FORD.ecoboost16, FORD.tdci20, PSA.dw10, FORD.powershift,
      { id: 'smax-tdci18', y: [2006, 2011], fuel: ['diesel'], eng: '1[.,]8 ?tdci', ccm: [[1752, 1754]], sev: 2, cost: '€600–1,500', title: '1.8 TDCi injectors and flywheel', detail: 'Injector and dual-mass flywheel failures on the 1.8 TDCi.', check: 'Rough running, idle rattle.' }],
    'RENAULT LAGUNA': [RN.keycard, RN.dci19, RN.dci20, RN.dci15, RN.edc,
      { id: 'laguna2-elec', y: [2001, 2007], sev: 2, cost: '€200–800', title: 'Laguna II electrics and tyre-pressure sensors', detail: 'Key-card reader, UCH, sensor and ABS faults are common on the Laguna II.', check: 'Test all electrics; dashboard warnings.' }],
    'RENAULT ESPACE': [RN.keycard, RN.epb, RN.dci19, RN.dci20,
      { id: 'espace4-elec', y: [2002, 2014], sev: 2, cost: '€200–1,000', title: 'Espace IV electrical faults', detail: 'Window regulators, sliding sunroof, sensors and dashboard faults.', check: 'Test every electric function.' }],
    'RENAULT KOLEOS': [RN.dci20, RN.cvt],
    'CITROEN XSARA': [PSA.rearAxle, PSA.hdi16, { ...PSA.dw10, y: [1999, 2006] }],
    'CITROEN XSARA PICASSO': 'CITROEN XSARA',
    'CITROEN JUMPY': [PSA.hdi16, PSA.dw10, PSA.bluehdi],
    'PEUGEOT 508': [PSA.puretech, PSA.thp, PSA.hdi16, PSA.dw10, PSA.bluehdi],
    'FIAT DUCATO': [{ id: 'ducato-rust', y: [2000, 2016], sev: 1, cost: '€300–1,500', title: 'Rust on sills, wheel arches and doors', detail: 'Vans/motorhomes on Ducato/Boxer/Jumper bases rust at sills, arches and sliding doors.', check: 'Inspect underneath and door bottoms.' },
      { id: 'ducato-clutch', y: [2006, 2024], gear: 'manual', sev: 1, cost: '€800–1,500', title: 'Clutch and flywheel wear (heavy use)', detail: 'Heavy loads wear out the clutch and dual-mass flywheel.', check: 'Slipping clutch, rattle at idle.' }],
    'FIAT BRAVO': [FCA.mj2, OPEL.cdti19, FCA.multiair, { id: 'bravo-tjet', y: [2007, 2014], fuel: ['petrol'], eng: 't-?jet', sev: 1, cost: '€300–900', title: '1.4 T-Jet turbo oil feed and coils', detail: 'Turbo oil lines and ignition coils fail with age.', check: 'Smoke, misfire.' }],
    'FIAT STILO': [OPEL.cdti19, { id: 'stilo-sel', y: [2001, 2008], gear: 'auto', sev: 2, cost: '€600–1,500', title: 'Dualogic/Selespeed robotised gearbox', detail: 'Pump and actuator failures.', check: 'Jerky shifts, warnings.' }],
    'FIAT 500X': [FCA.multiair, FCA.mj2, FCA.zf9],
    'ALFA ROMEO GIULIETTA': [FCA.multiair, FCA.mj2, FCA.tct, { id: 'alfa-susp', sev: 1, cost: '€200–600', title: 'Front suspension bushes', detail: 'Front wishbone bushes wear early.', check: 'Clunks over bumps, steering wander.' }],
    'ALFA ROMEO MITO': 'ALFA ROMEO GIULIETTA',
    'ALFA ROMEO 159': [OPEL.cdti19, FCA.jtdm24, FCA.mj2,
      { id: 'alfa-22jts', y: [2005, 2011], fuel: ['petrol'], eng: '2[.,]2 ?jts', ccm: [[2197, 2199]], sev: 2, cost: '€1,000–2,000', title: '2.2 JTS timing chain', detail: 'GM-derived 2.2 JTS stretches its timing chain.', check: 'Cold-start rattle, engine light.' },
      { id: 'alfa-susp', sev: 1, cost: '€200–600', title: 'Front suspension bushes', detail: 'Front wishbone bushes wear early.', check: 'Clunks over bumps, steering wander.' }],
    'ALFA ROMEO 147': [OPEL.cdti19, { id: 'alfa147-belt', y: [2000, 2010], fuel: ['petrol'], eng: 'twin ?spark|1[.,][6] ?ts', sev: 2, cost: '€500–900', title: 'Twin Spark timing belt & variator', detail: 'Timing belt must be replaced every 60–70k km; the cam variator rattles.', check: 'Belt invoice, rattle at idle.' }],
    'ALFA ROMEO 156': 'ALFA ROMEO 147',
    'ALFA ROMEO GIULIA': [FCA.mj2, GOOD('Generally better built than older Alfas')],
    'ALFA ROMEO STELVIO': 'ALFA ROMEO GIULIA',
    'JEEP RENEGADE': [FCA.multiair, FCA.mj2, FCA.zf9],
    'JEEP COMPASS': 'JEEP RENEGADE',
    'JEEP CHEROKEE': [FCA.mj2, FCA.zf9],
    'LAND ROVER RANGE': [JLR.ingenium, JLR.tdv6, JLR.air, JLR.zf9],
    'LAND ROVER DISCOVERY': [JLR.ingenium, JLR.tdv6, JLR.air, JLR.zf9],
    'LAND ROVER FREELANDER': [JLR.ingenium,
      { id: 'fl2-diff', y: [2006, 2014], sev: 2, cost: '€800–2,000', title: 'Freelander 2 rear diff / Haldex coupling', detail: 'Rear differential and Haldex coupling failures, especially with mismatched tyres.', check: 'Whine/clunk from the rear; all four tyres the same.' }],
    'LAND ROVER EVOQUE': [JLR.ingenium, JLR.zf9],
    'LAND ROVER RANGE ROVER': 'LAND ROVER RANGE',
    'JAGUAR XE': [JLR.ingenium],
    'JAGUAR XF': [JLR.ingenium, JLR.tdv6],
    'JAGUAR E-PACE': [JLR.ingenium, JLR.zf9],
    'JAGUAR F-PACE': [JLR.ingenium, JLR.tdv6],
    'VOLVO XC60': [VOLVO.d5, VOLVO.vea, VOLVO.aw, PSA.dw10],
    'VOLVO XC90': [VOLVO.d5, VOLVO.vea, VOLVO.aw, { id: 'xc90-4t65', y: [2002, 2006], gear: 'auto', fuel: ['petrol'], sev: 3, cost: '€2,000–4,000', title: 'T6 4T65 automatic failure', detail: 'The GM 4T65 gearbox in the early XC90 T6 is notoriously weak.', check: 'Slipping, flare between gears.' }],
    'VOLVO V60': [VOLVO.d5, VOLVO.vea, PSA.dw10, PSA.hdi16, FORD.ecoboost16],
    'VOLVO S60': 'VOLVO V60',
    'VOLVO V70': [VOLVO.d5, VOLVO.aw, PSA.dw10],
    'VOLVO XC70': 'VOLVO V70',
    'VOLVO S80': 'VOLVO V70',
    'VOLVO V40': [VOLVO.d5, VOLVO.vea, PSA.hdi16, FORD.ecoboost16],
    'VOLVO V50': [VOLVO.d5, PSA.hdi16, PSA.dw10, FORD.powershift],
    'VOLVO S40': 'VOLVO V50',
    'VOLVO C30': 'VOLVO V50',
    'VOLVO XC40': [VOLVO.vea, GOOD('Generally solid')],
    'SUBARU FORESTER': [SUB.ej25, SUB.fb, SUB.boxerD, SUB.cvt],
    'SUBARU OUTBACK': [SUB.ej25, SUB.fb, SUB.boxerD, SUB.cvt],
    'SUBARU LEGACY': 'SUBARU OUTBACK',
    'SUBARU IMPREZA': [SUB.ej25, SUB.fb, SUB.boxerD, SUB.cvt],
    'SUBARU XV': [SUB.fb, SUB.boxerD, SUB.cvt],
    'MITSUBISHI OUTLANDER': [MIT.phev, MIT.cvt, PSA.dw10, { id: 'outl-did22', y: [2007, 2012], fuel: ['diesel'], eng: '2[.,]2 ?di-?d', ccm: [[2178, 2180]], sev: 2, cost: '€600–1,500', title: '2.2 DI-D (PSA) DPF and EGR', detail: 'PSA-built 2.2 diesel: DPF and EGR clogging, flywheel wear.', check: 'DPF warnings, idle rattle.' }],
    'MITSUBISHI ASX': [MIT.cvt, GOOD('Petrol versions generally reliable')],
    'MITSUBISHI PAJERO': [MIT.did32, { id: 'pajero-rust', y: [2000, 2015], sev: 1, cost: '€300–1,500', title: 'Underbody rust', detail: 'Chassis and underbody rust on salted roads.', check: 'Inspect underneath.' }],
    'MITSUBISHI COLT': [GOOD('Simple and generally reliable'), { id: 'colt-rust', y: [2004, 2012], sev: 1, cost: '€200–800', title: 'Rear arch rust and clutch', detail: 'Rear arches rust; clutch wears in city use.', check: 'Inspect arches.' }],
    'CHEVROLET CRUZE': [OPEL.ecotec1618, OPEL.vcdi20, { id: 'cruze-6t', y: [2009, 2016], gear: 'auto', sev: 2, cost: '€1,000–2,500', title: '6-speed automatic (6T30/6T40) shift problems', detail: 'Harsh or delayed shifts, wave-plate failure.', check: 'Harsh 1–2/2–3 shifts.' }],
    'CHEVROLET ORLANDO': 'CHEVROLET CRUZE',
    'CHEVROLET CAPTIVA': [OPEL.vcdi20, { id: 'captiva-awd', y: [2006, 2015], sev: 1, cost: '€300–1,200', title: 'AWD coupling and electronics', detail: 'AWD coupling and various electrical faults.', check: 'AWD warning, clunks on tight turns.' }],
    'OPEL ANTARA': 'CHEVROLET CAPTIVA',
    'CHEVROLET AVEO': [{ id: 'aveo-belt', y: [2002, 2015], fuel: ['petrol', 'lpg'], sev: 2, cost: '€300–500 belt / engine if it snaps', title: 'Timing belt must be changed on time', detail: 'The 1.2/1.4 petrol engines are interference engines – a snapped belt destroys them.', check: 'Ask for the timing-belt invoice (every 60–90k km).' }],
    'CHEVROLET KALOS': 'CHEVROLET AVEO',
    'CHEVROLET SPARK': [GOOD('Simple city car, cheap parts')],
    'SMART FORTWO': [{ id: 'smart-gear', y: [2007, 2014], gear: 'auto', sev: 2, cost: '€500–1,200', title: 'Automated gearbox actuator and clutch', detail: 'Clutch actuator and clutch wear on the 451’s automated manual.', check: 'Jerky shifts, gearbox warning.' }],
    'SUZUKI JIMNY': [{ id: 'jimny-rust', y: [1998, 2018], sev: 2, cost: '€500–2,000', title: 'Chassis rust', detail: 'Ladder frame and body mounts rust, especially behind the rear wheels.', check: 'Inspect the frame closely.' }, GOOD('Mechanically very simple')],
    'SUZUKI GRAND': [RN.dci19, { id: 'gv-rust', y: [2005, 2015], sev: 1, cost: '€300–1,000', title: 'Underbody rust and transfer case', detail: 'Underbody rust and transfer-case seals.', check: 'Inspect underneath; no clunks in 4WD.' }],
    'SUZUKI GRAND VITARA': 'SUZUKI GRAND',
    'HONDA ACCORD': [HONDA.ictdi, GOOD('Petrol engines very reliable')],
    'HONDA FR-V': [HONDA.ictdi],
    'BMW 6': [BMW.n47, BMW.n54, BMW.egr, BMW.leaks],
    'BMW 7': [BMW.n54, BMW.egr, BMW.leaks, { id: 'bmw7-air', y: [2008, 2020], sev: 2, cost: '€600–2,000', title: 'Air suspension and electronics', detail: 'Rear air springs and numerous electronic modules age expensively.', check: 'Car level after standing; test all electronics.' }],
    'BMW X4': 'BMW X3',
    'BMW X2': 'BMW X1',
    'MINI COUNTRYMAN': 'MINI COOPER',
    'MINI CLUBMAN': 'MINI COOPER',
    'MINI CABRIO': 'MINI COOPER',
    'MINI PACEMAN': 'MINI COOPER',

    // ---- Models that had no data on live avto.net listings ----
    'BMW M2': [BMW.s55, BMW.mRunning, BMW.s58],
    'BMW M3': [BMW.s55, BMW.mRunning, BMW.s58],
    'BMW M4': [BMW.s55, BMW.mRunning, BMW.s58],
    'BMW M5': [BMW.mRunning, { id: 'bmw-s63', y: [2011, 2018], fuel: ['petrol'], eng: '\\bm5\\b|\\bm6\\b|x[56] ?m\\b', ccm: [[4394, 4396]], sev: 3, cost: '€2,000–8,000', title: 'S63 4.4 V8 oil consumption, rod bearings and turbo oil lines', detail: 'High oil use, rod-bearing wear and leaking turbo oil lines; very expensive to fix.', check: 'Oil consumption history, oil analysis, cold-start noises.' }],
    'BMW X7': 'BMW X5',
    'BMW IX3': [{ id: 'ix3-12v', y: [2021, 2024], sev: 1, cost: 'software', title: 'Software and 12V battery glitches', detail: 'Early cars needed software updates (charging, infotainment) and some had 12V battery drain.', check: 'Ask for the latest software update; test AC and DC charging.' }],
    'AUDI Q8': 'AUDI Q7',
    'AUDI SQ7': 'AUDI Q7',
    'AUDI A7': 'AUDI A4',
    'MERCEDES BENZ G': [MB.om642, MB.rust, { id: 'g-rust', y: [1990, 2017], sev: 2, cost: '€500–3,000', title: 'Body and frame rust (W463)', detail: 'Door bottoms, windscreen frame and chassis rust on older G-Class.', check: 'Inspect door bottoms, windscreen surround and frame.' }],
    'MERCEDES BENZ GLB': 'MERCEDES BENZ A',
    'MERCEDES BENZ EQC': [{ id: 'eqc-recall', y: [2019, 2022], fuel: ['electric'], sev: 1, cost: 'recall', title: 'Recalls: brake booster and charging software', detail: 'Several recalls (brake booster, high-voltage cable fixing); usually done under warranty.', check: 'Check open recalls with a Mercedes dealer.' }],
    'HYUNDAI IONIQ 5': [{ id: 'e-gmp-iccu', y: [2021, 2024], fuel: ['electric'], sev: 2, cost: 'recall / €1,500+', title: 'ICCU (charging control unit) failure', detail: 'The Integrated Charging Control Unit can fail, stopping 12V charging and causing loss of power; recalled with a software fix and replacements.', check: 'Confirm the ICCU recall/software update was done; test AC charging.' }],
    'HYUNDAI IONIQ 6': 'HYUNDAI IONIQ 5',
    'KIA EV6': 'HYUNDAI IONIQ 5',
    'GENESIS GV60': 'HYUNDAI IONIQ 5',
    'HYUNDAI IONIQ': [TOY.cat, GOOD('Hybrid/EV powertrain has a good reliability record'), { id: 'ioniq-12v', y: [2016, 2022], sev: 1, cost: '€100–300', title: '12V battery drain', detail: 'The small 12V battery can run flat if the car stands for long.', check: 'Ask about 12V battery replacement.' }],
    'HYUNDAI BAYON': 'HYUNDAI I20',
    'HYUNDAI ELANTRA': 'HYUNDAI I30',
    'HYUNDAI SONATA': 'HYUNDAI I30',
    'HYUNDAI MATRIX': [HK.crdi, GOOD('Simple and durable')],
    'KIA SOUL': [HK.gdi16, HK.crdi, HK.dct],
    'KIA CARENS': [HK.gdi16, HK.crdi, HK.dct],
    'KIA OPTIMA': [HK.gdi16, HK.crdi, HK.crdiR, HK.dct],
    'KIA SORENTO': [HK.crdiR, HK.awd],
    'KIA E-NIRO': 'KIA NIRO',
    'VOLVO S90': 'VOLVO V60',
    'VOLVO V90': 'VOLVO V60',
    'JEEP WRANGLER': [{ id: 'wrangler-wobble', y: [2007, 2018], sev: 2, cost: '€300–1,500', title: '“Death wobble” front-axle shimmy', detail: 'Worn track bar, ball joints or steering damper cause violent front-end shimmy over bumps at speed.', check: 'Drive over bumps at 70–90 km/h; inspect track bar and ball joints.' },
      { id: 'wrangler-28crd', y: [2007, 2018], fuel: ['diesel'], eng: '2[.,]8 ?crd', sev: 2, cost: '€600–2,000', title: '2.8 CRD (VM) EGR, DPF and oil cooler', detail: 'EGR/DPF clogging and oil-cooler leaks on the VM Motori diesel.', check: 'Smoke, DPF warnings, oil/coolant mixing.' }],
    'JEEP GRAND': [{ id: 'gc-30crd', y: [2011, 2018], fuel: ['diesel'], eng: '3[.,]0 ?(crd|v6|multijet)', ccm: [[2986, 2988]], sev: 2, cost: '€800–2,500', title: '3.0 CRD (VM) oil-cooler leak and EGR', detail: 'Oil-cooler gasket leaks (oil into coolant) and EGR failures on the WK2 diesel.', check: 'Check coolant for oil, EGR fault codes.' },
      { id: 'gc-air', y: [2011, 2021], sev: 2, cost: '€600–2,000', title: 'Quadra-Lift air suspension', detail: 'Air springs and the compressor fail with age.', check: 'Car level after standing; no suspension warnings.' }],
    'JEEP GRAND CHEROKEE': 'JEEP GRAND',
    'JEEP AVENGER': [PSA.puretech, PSA.puretechChain],
    'JEEP PATRIOT': [FCA.mj2, { id: 'patriot-cvt', y: [2007, 2016], gear: 'auto', sev: 2, cost: '€1,500–3,000', title: 'CVT judder and failure', detail: 'The Jatco CVT overheats and judders.', check: 'Judder pulling away, whine.' }],
    'MITSUBISHI SPACE': [GOOD('Simple, cheap to run')],
    'MITSUBISHI SPACE STAR': 'MITSUBISHI SPACE',
    'MITSUBISHI LANCER': [MIT.cvt, PSA.dw10, { id: 'lancer-rust', y: [2007, 2016], sev: 1, cost: '€200–800', title: 'Rear arch and sill rust', detail: 'Rust around rear arches and sills.', check: 'Inspect arches and sills.' }],
    'MITSUBISHI ECLIPSE': [MIT.cvt, MIT.phev],
    'MITSUBISHI L': [{ id: 'l200-frame', y: [2006, 2015], sev: 2, cost: '€500–3,000', title: 'L200 chassis rust and 2.5 DI-D timing belt', detail: 'The ladder frame rusts; the 2.5 DI-D needs timing-belt changes on schedule.', check: 'Inspect the frame; belt invoice.' }],
    'MITSUBISHI L200': 'MITSUBISHI L',
    'MITSUBISHI GRANDIS': [PSA.dw10, MIT.cvt],
    'NISSAN NAVARA': [{ id: 'yd25', y: [2005, 2015], fuel: ['diesel'], eng: '2[.,]5 ?dci', sev: 2, cost: '€800–2,500', title: '2.5 dCi (YD25) timing chain and injectors', detail: 'Timing chain/guide wear and injector failures on the YD25 diesel.', check: 'Rattle on start, smoke, power loss.' },
      { id: 'navara-frame', y: [2005, 2015], sev: 2, cost: 'recall / €1,000+', title: 'D40 chassis-frame corrosion', detail: 'Frames rusted badly on the D40 Navara; many were replaced under recall.', check: 'Inspect the frame; ask if it was replaced.' }],
    'NISSAN PATHFINDER': 'NISSAN NAVARA',
    'NISSAN TERRANO': [{ id: 'terrano-rust', y: [1993, 2006], sev: 2, cost: '€500–2,000', title: 'Old Terrano II rust and 2.7 TDi head', detail: 'Body/chassis rust; the 2.7 TDi can crack its cylinder head when overheated.', check: 'Rust underneath, coolant loss.' }],
    'MAZDA CX-7': [MAZ.d22, { id: 'cx7-turbo', y: [2006, 2012], fuel: ['petrol'], eng: '2[.,]3', ccm: [[2259, 2262]], sev: 3, cost: '€1,500–4,000', title: '2.3 DISI turbo failure and timing chain', detail: 'The 2.3 turbo petrol burns oil, kills turbos and stretches its timing chain.', check: 'Blue smoke, turbo whistle, cold-start rattle.' }],
    'MAZDA CX-60': [{ id: 'cx60-sw', y: [2022, 2024], sev: 1, cost: 'software', title: 'Early gearbox and software glitches', detail: 'Early cars had jerky low-speed shifting and infotainment bugs, improved by updates.', check: 'Ask for software updates; test slow-speed driving.' }],
    'PEUGEOT 408': 'PEUGEOT 308',
    'PEUGEOT TRAVELLER': 'CITROEN JUMPY',
    'OPEL COMBO': [PSA.hdi16, PSA.bluehdi, PSA.puretech, PSA.puretechChain, OPEL.cdti13, FCA.mj2],
    'OPEL FRONTERA': [PSA.puretechChain],
    'RENAULT AUSTRAL': [{ id: 'austral-sw', y: [2022, 2024], sev: 1, cost: 'software', title: 'Early software and infotainment glitches', detail: 'Early cars needed updates for infotainment and hybrid system warnings.', check: 'Ask for the latest software update.' }],
    'DACIA BIGSTER': 'DACIA DUSTER',
    'SUZUKI S-CROSS': [FCA.mj2, GOOD('1.4 Boosterjet petrol is generally reliable')],
    'SEAT CORDOBA': 'SEAT IBIZA',
    'FIAT 500C': 'FIAT 500',
    'FIAT 500L': [FCA.mj2, OPEL.cdti13, FCA.tct],
    'FIAT CROMA': [OPEL.cdti19, FCA.jtdm24],
    'FIAT ULYSSE': 'CITROEN JUMPY',
    'FIAT SCUDO': 'CITROEN JUMPY',
    'LANCIA YPSILON': 'FIAT PANDA',
    'LANCIA DELTA': 'FIAT BRAVO',
    'ALFA ROMEO BRERA': 'ALFA ROMEO 159',
    'ALFA ROMEO SPIDER': 'ALFA ROMEO 159',
    'ALFA ROMEO TONALE': [{ id: 'tonale-sw', y: [2022, 2024], sev: 1, cost: 'software', title: 'Early software glitches', detail: 'Infotainment and driver-assist software updates on early cars.', check: 'Ask for the latest updates.' }],
    'LAND ROVER DEFENDER': [JLR.ingenium, { id: 'defender-new', y: [2020, 2024], sev: 1, cost: 'software / €500+', title: 'New Defender electronics and air-suspension faults', detail: 'Early L663 cars had infotainment, sensor and air-suspension faults, many fixed by updates.', check: 'Test all electronics; car level after standing.' },
      { id: 'defender-old', y: [1990, 2016], sev: 2, cost: '€500–5,000', title: 'Classic Defender chassis and bulkhead rust', detail: 'The chassis and steel bulkhead rust; Td5 injector loom leaks oil.', check: 'Inspect chassis rear crossmember and bulkhead footwells.' }],
    'CHEVROLET TRAX': 'OPEL MOKKA',
    'CHEVROLET EPICA': [{ id: 'epica-rust', y: [2006, 2011], sev: 1, cost: '€300–800', title: '2.0 VCDi EGR/DPF and gearbox', detail: 'EGR/DPF clogging on the diesel; automatic gearbox faults.', check: 'Smoke, harsh shifts.' }],
    'FORD MUSTANG': [{ id: 'mustang-10r', y: [2018, 2024], gear: 'auto', sev: 1, cost: 'software', title: '10-speed automatic harsh shifts', detail: 'The 10R80 can shift harshly; improved by software and adaptive relearn.', check: 'Test low-speed shifts.' }],
    'FORD PUMA': [FORD.ecoboost1],
    'FORD KA': [OPEL.cdti13, GOOD('Simple and cheap to run')],
    'FORD RANGER': [FORD.tdci20, { id: 'ranger-32', y: [2011, 2022], fuel: ['diesel'], eng: '3[.,]2', ccm: [[3197, 3199]], sev: 2, cost: '€300–1,500', title: '3.2 TDCi oil-pump/injector and EGR cooler', detail: 'EGR cooler leaks and injector issues on the 3.2 five-cylinder.', check: 'Coolant loss, smoke.' }],
    'TOYOTA GR': [GOOD('Toyota GR models are generally robust – budget for performance tyres and brakes')],
    'TOYOTA YARIS CROSS': 'TOYOTA YARIS',
    'TOYOTA COROLLA CROSS': 'TOYOTA COROLLA',
    'TOYOTA BZ4X': [{ id: 'bz4x-charge', y: [2022, 2024], fuel: ['electric'], sev: 1, cost: 'software', title: 'Slow DC charging in the cold', detail: 'DC charging speed drops sharply in cold weather; early cars had a wheel-hub recall.', check: 'Confirm the hub-bolt recall was done.' }],
    'HONDA CRX': [GOOD('Simple mechanics; check for rust on old cars')],
    'HONDA HR-V': [GOOD('Generally very reliable')],
    'SUBARU JUSTY': [GOOD('Simple small car')],
    'SKODA ENYAQ': [{ id: 'enyaq-sw', y: [2020, 2023], fuel: ['electric'], sev: 1, cost: 'software', title: 'Early software and 12V battery issues', detail: 'Early MEB cars needed software updates and some had 12V battery drain.', check: 'Software version 3.x or later; test charging.' }],
    'VOLKSWAGEN ID.4': 'SKODA ENYAQ',
    'VOLKSWAGEN ID.5': 'SKODA ENYAQ',
    'AUDI Q4': 'SKODA ENYAQ',
    'CUPRA BORN': 'VOLKSWAGEN ID.3'
  };

  // ======================================================================================
  // Coverage pass over the full avto.net make -> model catalog (tests/fixtures/avtonet-catalog.txt).
  // Only problems that are widely documented are listed; classics, supercars, quadricycles and
  // brand-new models without a track record are deliberately left empty.
  // ======================================================================================
  Object.assign(RN, {
    v6dci: { id: 'rn-v6dci', y: [2002, 2016], fuel: ['diesel'], eng: '3[.,]0 ?(dci|v6|d)\\b', ccm: [[2957, 2959], [2992, 2994]], sev: 3, cost: '€3,000–7,000',
      title: '3.0 V6 dCi (P9X / V9X) crankshaft and timing-chain failures', detail: 'The Isuzu-built P9X (Vel Satis, Espace IV, Avantime) and the later V9X (Laguna III, Navara/Pathfinder, Infiniti FX/EX/M) are known for crank-bearing and timing-chain failures.',
      check: 'Knocking or rattle from the engine, oil pressure warnings; insist on short oil-change history.' }
  });
  Object.assign(MAZ, {
    rf7j: { id: 'mazda-rf7j', y: [2002, 2010], fuel: ['diesel'], eng: '2[.,]0 ?(cd|citd|ditd|mzr|d)\\b', ccm: [[1996, 1999]], sev: 2, cost: '€600–2,000',
      title: '2.0 MZR-CD diesel: injector seals, turbo oil feed and DPF', detail: 'Leaking injector seals coat the engine in carbon; a blocked oil-feed filter kills turbos; DPF-equipped cars dilute their oil.',
      check: 'Black tar around injectors, smoke, oil level above max.' },
    renesis: { id: 'mazda-renesis', y: [2003, 2012], fuel: ['petrol', 'lpg'], eng: 'rx-?8|renesis|wankel|rotary', sev: 3, cost: '€3,000–6,000 rebuild',
      title: 'RX-8 rotary engine: apex/rotor-seal wear and low compression', detail: 'The Renesis rotary wears its seals, burns oil by design and floods if shut off cold; low compression means an engine rebuild.',
      check: 'Insist on a rotary compression test; hot-start check; oil level and consumption.' }
  });
  Object.assign(TOY, {
    kd25: { id: 'toy-2kd', y: [2001, 2016], fuel: ['diesel'], eng: '2[.,]5 ?d-?4d', ccm: [[2493, 2495]], sev: 2, cost: '€800–3,000',
      title: '2.5 D-4D (2KD) injector seals and injectors', detail: 'HiAce/Hilux 2.5 diesel: injector washers leak and injectors fail.',
      check: 'Smoke, ticking at idle, carbon around injectors.' },
    mr2: { id: 'toy-mr2-precat', y: [1999, 2007], eng: 'mr-?2|mr2', sev: 3, cost: '€1,500–3,000',
      title: 'MR2 Roadster pre-catalyst breaking up into the engine', detail: 'The ceramic pre-cat disintegrates and is ingested by the 1ZZ engine, causing oil burning and failure.',
      check: 'Ask whether the pre-cat was removed/replaced; oil consumption.' }
  });
  Object.assign(SUB, {
    wrx: { id: 'subaru-wrx', y: [2001, 2021], fuel: ['petrol'], eng: 'wrx|sti', sev: 3, cost: '€3,000–7,000',
      title: 'WRX/STI turbo boxer: ring-land and rod-bearing failure', detail: 'Hard-driven or tuned EJ20/EJ25 turbo engines crack ring lands and spin bearings.',
      check: 'Compression/leak-down test, ask about tuning and oil-change history.' }
  });
  Object.assign(HONDA, {
    ima: { id: 'honda-ima', y: [2006, 2016], fuel: ['hybrid'], sev: 2, cost: '€1,500–3,000',
      title: 'IMA hybrid battery degradation', detail: 'Civic Hybrid, Insight and CR-Z hybrid batteries lose capacity with age; the IMA warning light means a costly pack.',
      check: 'No IMA warning light; ask for a battery health check.' }
  });
  Object.assign(VOLVO, {
    aw50: { id: 'volvo-aw50', y: [1997, 2007], gear: 'auto', sev: 2, cost: '€1,500–3,000',
      title: 'AW50-42 automatic gearbox (850/S70/V70/S60/S80)', detail: 'The 4-speed AW50-42 slips and shifts harshly as the valve body wears.',
      check: 'Flare or harsh shifts when warm; ask about fluid changes.' },
    pcv: { id: 'volvo-5cyl-pcv', y: [1993, 2010], fuel: ['petrol', 'lpg'], ccm: [[2318, 2522]], sev: 1, cost: '€150–400',
      title: '5-cylinder petrol PCV (flame-trap) clogging', detail: 'A clogged crankcase breather builds pressure and pushes out oil seals.',
      check: 'Oil leaks at seals, dipstick popping up.' }
  });
  const PORSCHE = {
    ims: { id: 'porsche-ims', y: [1997, 2008], fuel: ['petrol'], eng: '911|996|997|boxster|cayman|986|987', notEng: 'turbo|gt2|gt3', sev: 3, cost: '€2,000 retrofit / engine if it fails',
      title: 'IMS bearing failure (M96/M97 flat-six)', detail: 'The intermediate-shaft bearing can fail and destroy the engine; most specialists retrofit an upgraded bearing.',
      check: 'Ask for proof of an IMS retrofit; metal in the oil filter is a red flag.' },
    bore: { id: 'porsche-bore', y: [2004, 2008], fuel: ['petrol'], eng: '911|997|boxster|cayman|987|cayenne', notEng: 'turbo|gt2|gt3', sev: 3, cost: '€8,000–15,000',
      title: 'Bore scoring (M97 flat-six, early Cayenne V8)', detail: 'Cylinder walls score, causing oil consumption, smoke and a ticking cylinder bank.',
      check: 'Borescope inspection by a Porsche specialist; sooty exhaust on one side.' },
    coolant: { id: 'porsche-coolant', y: [2003, 2010], eng: 'cayenne', sev: 2, cost: '€1,000–2,500',
      title: 'Cayenne (955/957) V8 plastic coolant pipes and transfer case', detail: 'Plastic coolant pipes in the engine V crack; the transfer case also wears.',
      check: 'Coolant loss, sweet smell; clunks on tight turns.' },
    air: { id: 'porsche-air', y: [2003, 2020], eng: 'cayenne|panamera|macan', sev: 2, cost: '€800–2,500',
      title: 'Air suspension struts and compressor', detail: 'Air springs and the compressor wear on Cayenne, Panamera and Macan with air suspension.',
      check: 'Car level after standing; no suspension warnings.' },
    pdk: { id: 'porsche-pdk-service', y: [2009, 2024], gear: 'auto', hint: 'pdk', sev: 1, cost: '€500–900 service',
      title: 'PDK gearbox oil service is due every ~60k km / 6 years', detail: 'PDK is robust but expensive if the oil service is skipped.',
      check: 'Ask for proof of the PDK service.' },
    taycan: { id: 'porsche-taycan', y: [2020, 2024], fuel: ['electric'], sev: 1, cost: 'recall / software',
      title: 'Taycan 12V and high-voltage battery recalls', detail: 'Software and battery-module recalls; usually done under warranty.',
      check: 'Check open recalls with a Porsche Centre.' }
  };
  const ROVER = {
    kseries: { id: 'rover-kseries', y: [1990, 2011], fuel: ['petrol', 'lpg'], eng: '1[.,][468] ?(16v|k|i)?\\b|k-?series', ccm: [[1395, 1397], [1587, 1590], [1795, 1797]], sev: 3, cost: '€800–2,000',
      title: 'K-series head-gasket failure (Rover/MG/Freelander 1/Lotus)', detail: 'The 1.4/1.6/1.8 K-series is notorious for head-gasket failure, often after overheating.',
      check: 'Coolant loss, mayonnaise under the oil cap, overheating; ask if an upgraded (MLS) gasket was fitted.' }
  };
  const SSY = {
    xdi: { id: 'ssangyong-xdi', y: [2001, 2017], fuel: ['diesel'], eng: 'xdi|xvt|2[.,][07] ?(d|xdi)', ccm: [[1997, 1999], [2695, 2697]], sev: 2, cost: '€800–2,500',
      title: '2.0/2.7 Xdi diesel: injectors, timing chain and turbo', detail: 'Kyron, Rexton, Actyon and Rodius diesels suffer injector failures, timing-chain wear and turbo issues.',
      check: 'Smoke, rough idle, rattle on start.' },
    rust: { id: 'ssangyong-rust', y: [1995, 2014], sev: 1, cost: '€300–1,500',
      title: 'Chassis and underbody rust', detail: 'Body-on-frame SsangYongs rust underneath on salted roads.',
      check: 'Inspect the frame and floor.' }
  };
  const ISUZU = {
    trooper: { id: 'isuzu-4jx1', y: [1998, 2005], fuel: ['diesel'], eng: '3[.,]0 ?(dti|td|d)', ccm: [[2998, 3000]], sev: 3, cost: '€2,000–5,000',
      title: '3.0 DTI (4JX1) injector oil seals and engine failure', detail: 'Trooper/Monterey 3.0 diesels suffer injector oil-seal leaks and catastrophic failures.',
      check: 'Oil loss, smoke, rough running; service history is essential.' },
    dmax: { id: 'isuzu-dmax-dpf', y: [2012, 2024], fuel: ['diesel'], eng: 'd-?max', sev: 1, cost: '€400–1,500',
      title: 'D-Max DPF and EGR on short trips', detail: 'DPF/EGR clogging when used for short journeys.',
      check: 'DPF warnings on a long test drive.' }
  };
  const DAEWOO = {
    belt: { id: 'daewoo-belt', y: [1997, 2013], fuel: ['petrol', 'lpg'], sev: 2, cost: '€300–500 belt / engine if it snaps',
      title: 'Timing belt must be changed on time (interference engines)', detail: 'Daewoo/Chevrolet 1.4–2.0 petrols (Lanos, Nubira, Lacetti, Tacuma, Evanda) destroy their valves if the belt snaps.',
      check: 'Ask for the timing-belt invoice (every 60–90k km).' },
    rust: { id: 'daewoo-rust', y: [1995, 2012], sev: 1, cost: '€200–800',
      title: 'Body rust and cheap build quality', detail: 'Sills, arches and door bottoms rust; electrics and plastics age poorly.',
      check: 'Inspect sills and arches; test electrics.' }
  };

  Object.assign(MODELS, {
    // ---- Porsche ----
    'PORSCHE 911': [PORSCHE.ims, PORSCHE.bore, PORSCHE.pdk],
    'PORSCHE BOXSTER': [PORSCHE.ims, PORSCHE.bore, PORSCHE.pdk],
    'PORSCHE CAYMAN': [PORSCHE.ims, PORSCHE.bore, PORSCHE.pdk],
    'PORSCHE 718': [PORSCHE.pdk, GOOD('718 (2016+) flat-fours have a better record than the old M96/M97 engines')],
    'PORSCHE CAYENNE': [PORSCHE.coolant, PORSCHE.bore, PORSCHE.air,
      { id: 'vag-v6tdi', y: [2004, 2016], fuel: ['diesel'], eng: '3[.,]0 ?(tdi|d)|diesel', ccm: [[2966, 2970]], sev: 3, cost: '€2,500–5,000', title: '3.0 V6 TDI timing chains', detail: 'The VW-group V6 diesel stretches its rear-mounted chains.', check: 'Rattle at cold idle; chain invoices.' }],
    'PORSCHE MACAN': [VAG.ea888pump, PORSCHE.air, PORSCHE.pdk],
    'PORSCHE PANAMERA': [PORSCHE.air, PORSCHE.pdk],
    'PORSCHE TAYCAN': [PORSCHE.taycan],
    'AUDI E-TRON GT': [PORSCHE.taycan],

    // ---- Audi / VW group leftovers ----
    'AUDI A8': [VAG.ea189, VAG.ea288, { id: 'a8-air', y: [2003, 2018], sev: 2, cost: '€600–2,000', title: 'Air suspension and electronics', detail: 'Air springs, compressor and MMI electronics are expensive wear items.', check: 'Car level after standing; test MMI.' },
      { id: 'vag-v6tdi', y: [2004, 2016], fuel: ['diesel'], eng: '3[.,]0 ?tdi|4[.,]2 ?tdi', ccm: [[2966, 2970], [4132, 4135]], sev: 3, cost: '€2,500–6,000', title: '3.0/4.2 TDI timing chains', detail: 'Rear-mounted chains stretch; the engine must come out to fix them.', check: 'Rattle at cold idle; chain invoices.' }],
    'AUDI E-TRON': [{ id: 'etron-recall', y: [2019, 2022], fuel: ['electric'], sev: 1, cost: 'recall', title: 'Battery-seal and charging recalls', detail: 'Early e-tron 55 had a battery-seal recall and charging software updates.', check: 'Check open recalls with an Audi dealer.' }],
    'AUDI Q4': 'SKODA ENYAQ',
    'AUDI Q6': [{ id: 'ppe-sw', y: [2024, 2026], fuel: ['electric'], sev: 1, cost: 'software', title: 'Early software updates', detail: 'New PPE platform cars received several software updates.', check: 'Ask for the latest software.' }],
    'AUDI A2': [GOOD('Aluminium body does not rust'), { id: 'a2-14tdi', y: [2000, 2005], fuel: ['diesel'], eng: '1[.,]2 ?tdi|1[.,]4 ?tdi', sev: 2, cost: '€400–1,500', title: '1.2/1.4 TDI (3-cylinder PD) injectors and dual-mass flywheel', detail: 'Pump-injector and flywheel wear; the 1.2 TDI "3L" has a fragile automated gearbox.', check: 'Rough idle, smoke, gearbox faults (1.2 TDI).' }],
    'VOLKSWAGEN BORA': 'VOLKSWAGEN GOLF',
    'VOLKSWAGEN VENTO': 'VOLKSWAGEN GOLF',
    'VOLKSWAGEN CC': 'VOLKSWAGEN PASSAT',
    'VOLKSWAGEN PASSAT CC': 'VOLKSWAGEN PASSAT',
    'VOLKSWAGEN CARAVELLE': 'VOLKSWAGEN TRANSPORTER',
    'VOLKSWAGEN CALIFORNIA': 'VOLKSWAGEN TRANSPORTER',
    'VOLKSWAGEN TAYRON': 'VOLKSWAGEN TIGUAN',
    'VOLKSWAGEN TIGUAN ALLSPACE': 'VOLKSWAGEN TIGUAN',
    'VOLKSWAGEN ID.7': 'VOLKSWAGEN ID.3',
    'VOLKSWAGEN ID.BUZZ': 'VOLKSWAGEN ID.3',
    'VOLKSWAGEN TARO': 'TOYOTA HILUX',
    'VOLKSWAGEN AMAROK': [VAG.ea189, VAG.ea288, { id: 'vag-v6tdi', y: [2016, 2022], fuel: ['diesel'], eng: '3[.,]0 ?tdi|v6', ccm: [[2966, 2970]], sev: 2, cost: '€2,000–4,000', title: '3.0 V6 TDI timing chains', detail: 'Rear-mounted chains stretch on the V6 diesel.', check: 'Rattle at cold idle.' }],
    'VOLKSWAGEN PHAETON': [{ id: 'phaeton-air', y: [2002, 2016], sev: 2, cost: '€800–3,000', title: 'Air suspension and complex electronics', detail: 'Air suspension, many control units and the V6 TDI chains make the Phaeton expensive.', check: 'Car level after standing; test every function.' }],
    'VOLKSWAGEN LUPO': [GOOD('Simple and cheap to run'), { id: 'lupo-rust', y: [1998, 2005], sev: 1, cost: '€200–600', title: 'Rust and ageing electrics', detail: 'Old age: sills and arches rust; window regulators fail.', check: 'Inspect sills; test windows.' }],
    'VOLKSWAGEN FOX': [GOOD('Simple and cheap to run')],
    'SEAT AROSA': 'VOLKSWAGEN LUPO',
    'SEAT EXEO': 'AUDI A4',
    'SEAT INCA': 'VOLKSWAGEN CADDY',
    'CUPRA ATECA': 'SEAT ATECA',
    'CUPRA LEON': 'SEAT LEON',
    'CUPRA TERRAMAR': 'VOLKSWAGEN TIGUAN',
    'CUPRA TAVASCAN': 'SKODA ENYAQ',
    'CUPRA RAVAL': 'VOLKSWAGEN ID.3',
    'SKODA ELROQ': 'SKODA ENYAQ',
    'SKODA EPIQ': 'SKODA ENYAQ',
    'SKODA FELICIA': [{ id: 'felicia-rust', y: [1994, 2001], sev: 1, cost: '€200–800', title: 'Rust and ageing cooling system', detail: 'Rust on sills/arches; the 1.3 engine overheats if the cooling system is neglected.', check: 'Inspect sills; coolant level.' }],

    // ---- BMW / MINI ----
    'BMW I3': [{ id: 'i3-rex', y: [2013, 2022], fuel: ['electric', 'plugin'], sev: 1, cost: '€200–1,500', title: '12V battery and range-extender (REx) faults', detail: 'The 12V battery fails and the REx engine on range-extender cars throws faults.', check: 'Test the REx; ask for the battery state of health.' }],
    'BMW IX': 'BMW IX3',
    'BMW IX1': 'BMW IX3',
    'BMW IX2': 'BMW IX3',
    'BMW I4': 'BMW IX3',
    'BMW I5': 'BMW IX3',
    'BMW I7': 'BMW IX3',
    'BMW Z3': [{ id: 'z3-rust', y: [1995, 2002], sev: 2, cost: '€300–1,500', title: 'Rear subframe mounts and rust', detail: 'Rear subframe mounting points crack (like the E36/E46 3 Series); sills rust.', check: 'Inspect the rear subframe mounts and sills.' }],
    'BMW Z4': [BMW.n20, BMW.n54, BMW.leaks],
    'BMW M6': 'BMW M5',
    'BMW M8': 'BMW M5',
    'BMW 1M': [BMW.n54, BMW.mRunning],
    'BMW 8': [GOOD('G15 8 Series has a good record so far')],
    'MINI ACEMAN': [GOOD('New electric MINI – no track record yet')],

    // ---- Mercedes-Benz ----
    'MERCEDES BENZ S': [MB.om642, MB.g7, { id: 'mb-airmatic', y: [1999, 2013], sev: 2, cost: '€600–2,500', title: 'Airmatic air suspension', detail: 'Air struts and the compressor fail with age on S-Class/CL.', check: 'Car level after standing; no suspension warning.' }],
    'MERCEDES BENZ CL': 'MERCEDES BENZ S',
    'MERCEDES BENZ SL': [MB.g7, { id: 'mb-abc', y: [2001, 2012], sev: 3, cost: '€1,500–5,000', title: 'ABC hydraulic suspension and SBC brakes (R230)', detail: 'Active Body Control leaks and pumps fail; early cars also have the SBC brake unit.', check: 'ABC/SBC warnings; car sitting low.' }],
    'MERCEDES BENZ SLC': 'MERCEDES BENZ C',
    'MERCEDES BENZ CLC': 'MERCEDES BENZ C',
    'MERCEDES BENZ CLE': [MB.g9, MB.om654],
    'MERCEDES BENZ GL': 'MERCEDES BENZ ML',
    'MERCEDES BENZ GLS': 'MERCEDES BENZ ML',
    'MERCEDES BENZ R': [MB.om642, MB.g7, { id: 'mb-airmatic', y: [2006, 2013], sev: 2, cost: '€600–2,500', title: 'Airmatic rear air suspension', detail: 'Rear air springs leak.', check: 'Car level after standing.' }],
    'MERCEDES BENZ VIANO': 'MERCEDES BENZ VITO',
    'MERCEDES BENZ VANEO': [MB.rust],
    'MERCEDES BENZ X': 'NISSAN NAVARA',
    'MERCEDES BENZ T': 'MERCEDES BENZ CITAN',
    'MERCEDES BENZ EQA': 'MERCEDES BENZ EQC',
    'MERCEDES BENZ EQB': 'MERCEDES BENZ EQC',
    'MERCEDES BENZ EQE': 'MERCEDES BENZ EQC',
    'MERCEDES BENZ EQS': 'MERCEDES BENZ EQC',
    'MERCEDES BENZ 190': [MB.rust],
    'MERCEDES BENZ W123': [MB.rust],
    'INFINITI Q30': 'MERCEDES BENZ A',
    'INFINITI QX30': 'MERCEDES BENZ A',
    'INFINITI Q50': [MB.om651, MB.g7],
    'INFINITI FX': [RN.v6dci],
    'INFINITI EX': [RN.v6dci],
    'INFINITI QX70': [RN.v6dci],
    'INFINITI M': [RN.v6dci],

    // ---- PSA / DS ----
    'DS AUTOMOBILES DS 3': 'CITROEN C3',
    'DS AUTOMOBILES DS 4': 'CITROEN C4',
    'DS AUTOMOBILES DS 5': 'PEUGEOT 508',
    'DS AUTOMOBILES DS 7': 'PEUGEOT 3008',
    'DS AUTOMOBILES DS 9': 'PEUGEOT 508',
    'DS AUTOMOBILES DS': 'PEUGEOT 3008',
    'CITROEN DS4': 'CITROEN C4',
    'CITROEN DS5': 'PEUGEOT 508',
    'PEUGEOT 306': [PSA.rearAxle, PSA.hdi16, { ...PSA.dw10, y: [1999, 2002] }],
    'PEUGEOT 106': [PSA.rearAxle],
    'CITROEN SAXO': 'PEUGEOT 106',
    'CITROEN ZX': [PSA.rearAxle],
    'CITROEN XANTIA': [{ id: 'c5-hydro', y: [1993, 2003], sev: 2, cost: '€300–1,200', title: 'Hydractive suspension spheres and pump', detail: 'Hydropneumatic spheres lose pressure; the car rides hard or sits low.', check: 'Car rises evenly after start; soft ride.' }, PSA.dw10],
    'CITROEN C6': [PSA.dw10, { id: 'c5-hydro', y: [2005, 2012], sev: 2, cost: '€300–1,200', title: 'Hydractive suspension and 2.7/3.0 HDi V6 turbos', detail: 'Hydractive spheres and the twin-turbo V6 diesel are expensive.', check: 'Suspension height, smoke.' }],
    'PEUGEOT 406': [PSA.hdi16, PSA.dw10],
    'PEUGEOT 607': [PSA.dw10],
    'PEUGEOT 807': [PSA.dw10, { id: 'psa-mpv-doors', y: [2002, 2014], sev: 1, cost: '€200–600', title: 'Electric sliding-door faults', detail: 'Sliding-door motors and wiring fail on 807/C8/Phedra/Ulysse.', check: 'Operate both sliding doors several times.' }],
    'CITROEN C8': 'PEUGEOT 807',
    'LANCIA PHEDRA': 'PEUGEOT 807',
    'PEUGEOT 806': [PSA.rearAxle],
    'CITROEN EVASION': 'PEUGEOT 806',
    'PEUGEOT 4007': 'MITSUBISHI OUTLANDER',
    'CITROEN C-CROSSER': 'MITSUBISHI OUTLANDER',
    'PEUGEOT 4008': 'MITSUBISHI ASX',
    'CITROEN C4 AIRCROSS': 'MITSUBISHI ASX',
    'PEUGEOT ION': 'MITSUBISHI I-MIEV',
    'CITROEN C-ZERO': 'MITSUBISHI I-MIEV',
    'MITSUBISHI I-MIEV': [{ id: 'imiev-range', y: [2009, 2020], fuel: ['electric'], sev: 2, cost: 'battery', title: 'Small battery with noticeable degradation', detail: 'Real-world range often below 80 km on older cars.', check: 'Ask for a battery capacity reading.' }],
    'PEUGEOT RCZ': [PSA.thp, PSA.hdi16, PSA.dw10],
    'PEUGEOT BIPPER': 'FIAT QUBO',
    'CITROEN NEMO': 'FIAT QUBO',
    'FIAT QUBO': [OPEL.cdti13, PSA.hdi16, { id: 'fiorino-rust', y: [2008, 2021], sev: 1, cost: '€200–800', title: 'Rust on sliding doors and sills', detail: 'Commercial-based small vans rust on door bottoms and sills.', check: 'Inspect door bottoms.' }],
    'FIAT FIORINO': 'FIAT QUBO',
    'PEUGEOT 1007': [{ id: '1007-robot', y: [2005, 2009], gear: 'auto', sev: 2, cost: '€600–1,500', title: '2-Tronic robotised gearbox and electric doors', detail: 'Jerky robotised gearbox; the electric sliding doors fail.', check: 'Test shifts and both doors.' }],

    // ---- Renault / Nissan ----
    'RENAULT FLUENCE': [RN.dci15, RN.dci15old, RN.keycard],
    'RENAULT LATITUDE': [RN.dci20, RN.v6dci],
    'RENAULT VEL SATIS': [RN.v6dci, RN.dci19, RN.keycard],
    'RENAULT AVANTIME': [RN.v6dci, RN.keycard],
    'RENAULT THALIA': 'RENAULT CLIO',
    'RENAULT SYMBIOZ': 'RENAULT CAPTUR',
    'RENAULT RAFALE': 'RENAULT AUSTRAL',
    'RENAULT ALASKAN': 'NISSAN NAVARA',
    'RENAULT TWIZY': [{ id: 'twizy-lease', sev: 2, cost: '€50–80/month', title: 'Battery may be rented, not owned', detail: 'Many Twizys were sold with a battery rental contract.', check: 'Ask whether the battery is owned.' }],
    'NISSAN LEAF': [{ id: 'leaf-battery', y: [2011, 2022], fuel: ['electric'], sev: 2, cost: '€5,000+ battery', title: 'Battery degradation (no active cooling)', detail: 'The Leaf battery has no liquid cooling and loses capacity faster in heat and with frequent fast charging.', check: 'Check the battery-health bars (12 max) or a LeafSpy reading.' }],
    'NISSAN E-NV200': 'NISSAN LEAF',
    'NISSAN NV200': [RN.dci15, RN.dci15old],
    'NISSAN EVALIA': 'NISSAN NV200',
    'NISSAN PATROL': [{ id: 'patrol-zd30', y: [2000, 2010], fuel: ['diesel'], eng: '3[.,]0', ccm: [[2952, 2954]], sev: 3, cost: '€3,000–6,000', title: '3.0 Di (ZD30) piston failure', detail: 'The ZD30 can melt a piston, especially when towing or driven hard.', check: 'Smoke, blow-by, compression test.' }],
    'NISSAN PRIMERA': [RN.dci19, { id: 'primera-qr20', y: [2002, 2008], fuel: ['petrol'], ccm: [[1997, 1999]], sev: 3, cost: '€1,500–3,000', title: '2.0 petrol pre-cat breaking up into the engine', detail: 'Pre-catalyst debris is sucked into the 2.0 engine (also Almera/X-Trail 2.0), causing oil burning and failure.', check: 'Oil consumption; ask if the pre-cat was removed.' }],
    'NISSAN ALMERA': [RN.dci15old, { id: 'primera-qr20', y: [2000, 2006], fuel: ['petrol'], ccm: [[1997, 1999]], sev: 3, cost: '€1,500–3,000', title: '2.0 petrol pre-cat breaking up into the engine', detail: 'Pre-catalyst debris is ingested by the 2.0 engine.', check: 'Oil consumption.' }],
    'NISSAN ALMERA TINO': 'NISSAN ALMERA',
    'NISSAN MURANO': [RN.cvt, RN.v6dci],
    'NISSAN 350Z': [{ id: 'z-oil', y: [2003, 2009], fuel: ['petrol'], sev: 2, cost: '€500–3,000', title: 'VQ35 oil consumption (early 350Z)', detail: 'Early VQ35DE engines can burn oil.', check: 'Oil level and consumption.' }],
    'NISSAN 370Z': [{ id: 'z-gallery', y: [2009, 2014], fuel: ['petrol'], sev: 2, cost: '€800–1,500', title: 'VQ37 oil-gallery gasket leak (low oil pressure)', detail: 'An internal oil-gallery gasket can fail and drop oil pressure on early 370Z/G37.', check: 'Oil-pressure warning, ticking at idle.' }],
    'NISSAN PIXO': 'SUZUKI ALTO',
    'NISSAN TIIDA': [GOOD('Simple and generally reliable')],
    'NISSAN CUBE': [GOOD('Simple and generally reliable')],
    'NISSAN TOWNSTAR': [GOOD('New model – no track record yet')],

    // ---- Opel ----
    'OPEL VECTRA': [OPEL.cdti19, OPEL.ecotec1618, OPEL.twinport, { id: 'vectra-elec', y: [2002, 2008], sev: 1, cost: '€100–400', title: 'Vectra C/Signum electrics and steering column lock', detail: 'Dashboard, CIM module and electric steering lock faults.', check: 'Test electrics; steering lock warning.' }],
    'OPEL SIGNUM': 'OPEL VECTRA',
    'OPEL AGILA': [GOOD('Suzuki-built (Wagon R / Splash), reliable')],
    'OPEL ADAM': [OPEL.twinport, GOOD('Simple city car')],
    'OPEL KARL': [GOOD('Simple city car')],
    'OPEL TIGRA': [OPEL.twinport],
    'OPEL CASCADA': [OPEL.turbo14, OPEL.cdti20],
    'OPEL AMPERA': [{ id: 'ampera-e', y: [2017, 2020], fuel: ['electric'], sev: 2, cost: 'recall', title: 'Ampera-e battery recall (fire risk)', detail: 'Ampera-e/Bolt batteries were recalled and many replaced.', check: 'Confirm the battery recall/replacement.' }, GOOD('Ampera (2012–2015) plug-in hybrid is generally reliable')],
    'OPEL OMEGA': [{ id: 'omega-rust', y: [1994, 2003], sev: 2, cost: '€300–1,500', title: 'Omega B rust and 2.5 TD/DTI injection pump', detail: 'Rust on arches/sills; the BMW-sourced 2.5 diesels have injection-pump faults.', check: 'Inspect arches; hard starting.' }],
    'OPEL MONTEREY': 'ISUZU TROOPER',
    'OPEL FRONTERA': [PSA.puretechChain, { id: 'frontera-old', y: [1991, 2004], sev: 2, cost: '€300–1,500', title: 'Old Frontera chassis rust', detail: 'The original Frontera rusts underneath.', check: 'Inspect the frame.' }],

    // ---- Ford ----
    'FORD EDGE': [FORD.tdci20, FORD.powershift],
    'FORD STREETKA': 'FORD KA',
    'FORD ESCORT': [{ id: 'escort-rust', y: [1990, 2002], sev: 1, cost: '€200–800', title: 'Rust and ageing (Escort/Orion)', detail: 'Rear arches and sills rust; old-age wear.', check: 'Inspect arches and sills.' }],
    'FORD MUSTANG MACH-E': [{ id: 'mache-relay', y: [2021, 2023], fuel: ['electric'], sev: 2, cost: 'recall', title: 'High-voltage contactor (relay) recall', detail: 'HV battery contactors could overheat and cause loss of power; recalled.', check: 'Confirm the recall was done.' }],

    // ---- Fiat / Alfa / Lancia / Chrysler / Dodge / Jeep ----
    'FIAT IDEA': [OPEL.cdti13, OPEL.cdti19, FCA.tct],
    'LANCIA MUSA': 'FIAT IDEA',
    'FIAT LINEA': [OPEL.cdti13, FCA.multiair, FCA.tct],
    'FIAT MAREA': [OPEL.cdti19, { id: 'marea-rust', y: [1996, 2003], sev: 1, cost: '€200–800', title: 'Old-age rust and electrics', detail: 'Sills, arches and electrical connectors age.', check: 'Inspect sills; test electrics.' }],
    'FIAT BRAVA': 'FIAT MAREA',
    'FIAT MULTIPLA': [OPEL.cdti19, { id: 'multipla-susp', y: [1999, 2010], sev: 1, cost: '€200–600', title: 'Front suspension wear', detail: 'Front suspension bushes and joints wear.', check: 'Clunks over bumps.' }],
    'FIAT FREEMONT': [FCA.mj2, FCA.zf9],
    'FIAT FULLBACK': 'MITSUBISHI L',
    'FIAT TALENTO': 'RENAULT TRAFIC',
    'FIAT SEICENTO': [{ id: 'seicento-rust', y: [1998, 2010], sev: 1, cost: '€200–600', title: 'Rust on floor, sills and arches', detail: 'Small old Fiats rust underneath.', check: 'Inspect the floor and sills.' }],
    'FIAT CINQUECENTO': 'FIAT SEICENTO',
    'FIAT UNO': 'FIAT SEICENTO',
    'FIAT GRANDE PANDA': [PSA.puretechChain, GOOD('New model – no track record yet')],
    'ALFA ROMEO GT': 'ALFA ROMEO 147',
    'ALFA ROMEO 166': [OPEL.cdti19, FCA.jtdm24, { id: 'alfa-v6-belt', y: [1998, 2007], fuel: ['petrol'], eng: '2[.,][5]|3[.,]0|3[.,]2|v6', sev: 2, cost: '€800–1,500', title: 'V6 Busso timing belt', detail: 'The V6 timing belt and tensioners must be changed on schedule.', check: 'Belt invoice.' }],
    'ALFA ROMEO GTV': [{ id: 'alfa147-belt', y: [1995, 2005], fuel: ['petrol'], eng: 'twin ?spark|2[.,]0|v6', sev: 2, cost: '€500–1,200', title: 'Twin Spark / V6 timing belt and variator', detail: 'Timing belts must be changed every 60–70k km.', check: 'Belt invoice, rattle at idle.' }],
    'ALFA ROMEO SPIDER': 'ALFA ROMEO GTV',
    'ALFA ROMEO 145': 'ALFA ROMEO 147',
    'ALFA ROMEO 146': 'ALFA ROMEO 147',
    'ALFA ROMEO CROSSWAGON': 'ALFA ROMEO 147',
    'ALFA ROMEO JUNIOR': [PSA.puretechChain, GOOD('New model – no track record yet')],
    'LANCIA THESIS': [OPEL.cdti19, FCA.jtdm24],
    'LANCIA LYBRA': [OPEL.cdti19],
    'LANCIA THEMA': [MB.om642],
    'LANCIA VOYAGER': 'CHRYSLER VOYAGER',
    'CHRYSLER VOYAGER': [{ id: 'voyager-crd', y: [2001, 2016], fuel: ['diesel'], eng: '2[.,][58] ?crd', ccm: [[2498, 2500], [2766, 2778]], sev: 2, cost: '€800–2,500', title: '2.5/2.8 CRD (VM) head gasket and oil cooler', detail: 'VM Motori diesels suffer head-gasket/cracked-head and oil-cooler failures.', check: 'Coolant loss, oil in coolant, white smoke.' },
      { id: 'voyager-gear', y: [2001, 2016], gear: 'auto', sev: 2, cost: '€1,500–3,000', title: 'Automatic gearbox (62TE/41TE) failures', detail: 'Chrysler automatics slip and fail.', check: 'Flare between gears, limp mode.' }],
    'CHRYSLER GRAND VOYAGER': 'CHRYSLER VOYAGER',
    'CHRYSLER 300C': [MB.om642, MB.g7],
    'CHRYSLER PT CRUISER': [MB.om646, { id: 'pt-mounts', y: [2000, 2010], sev: 1, cost: '€200–600', title: 'Engine mounts and front suspension', detail: 'Engine/gearbox mounts and front suspension wear.', check: 'Vibration, clunks.' }],
    'CHRYSLER SEBRING': [{ ...VAG.pdTdi, y: [2007, 2010] }],
    'DODGE CALIBER': [{ ...VAG.pdTdi, y: [2006, 2012] }, { id: 'jatco-cvt', y: [2006, 2014], gear: 'auto', fuel: ['petrol'], sev: 2, cost: '€1,500–3,000', title: 'CVT judder and failure', detail: 'The Jatco CVT overheats and fails.', check: 'Judder, whine.' }],
    'DODGE JOURNEY': [{ ...VAG.pdTdi, y: [2008, 2011] }, FCA.mj2],
    'DODGE AVENGER': [{ ...VAG.pdTdi, y: [2007, 2010] }],
    'DODGE NITRO': [{ id: 'wrangler-28crd', y: [2007, 2011], fuel: ['diesel'], eng: '2[.,]8 ?crd', sev: 2, cost: '€600–2,000', title: '2.8 CRD (VM) EGR and oil cooler', detail: 'EGR clogging and oil-cooler leaks.', check: 'Smoke, oil/coolant mixing.' }],
    'JEEP CHEROKEE': [FCA.mj2, FCA.zf9, { id: 'wrangler-28crd', y: [2002, 2013], fuel: ['diesel'], eng: '2[.,]8 ?crd', sev: 2, cost: '€600–2,000', title: '2.8 CRD (VM) EGR and oil cooler', detail: 'EGR clogging and oil-cooler leaks on KJ/KK Cherokee.', check: 'Smoke, oil/coolant mixing.' }],
    'JEEP COMMANDER': [MB.om642, { id: 'gc-air', y: [2006, 2010], sev: 1, cost: '€300–1,000', title: 'Electrics and rear axle seals', detail: 'Various electrical faults and axle-seal leaks.', check: 'Test electrics; leaks at the rear axle.' }],

    // ---- Japanese / Korean leftovers ----
    'LEXUS IS': [TOY.ad, GOOD('Lexus petrol and hybrid models are among the most reliable cars')],
    'LEXUS RX': [TOY.cat, GOOD('Lexus hybrid models are among the most reliable cars')],
    'LEXUS NX': 'LEXUS RX',
    'LEXUS UX': 'LEXUS RX',
    'LEXUS CT': [TOY.cat, GOOD('Same reliable hybrid system as the Prius')],
    'LEXUS GS': 'LEXUS IS',
    'LEXUS ES': 'LEXUS RX',
    'LEXUS LS': 'LEXUS RX',
    'LEXUS LBX': 'LEXUS RX',
    'TOYOTA HIACE': [TOY.kd25, TOY.kd30],
    'TOYOTA HILUX': [TOY.kd30, TOY.kd25, { id: 'hilux-frame', y: [2005, 2015], sev: 2, cost: '€500–3,000', title: 'Chassis-frame rust', detail: 'Frames rust from inside on salted roads.', check: 'Inspect the frame rails from underneath.' }],
    'TOYOTA MR2': [TOY.mr2],
    'TOYOTA SUPRA': [GOOD('A90 Supra uses BMW’s B58 engine, which has a good record')],
    'TOYOTA GT86': [GOOD('FA20 boxer is generally robust; budget for clutch on hard-driven cars')],
    'TOYOTA GR86': 'TOYOTA GT86',
    'SUBARU BRZ': 'TOYOTA GT86',
    'TOYOTA CAMRY': [TOY.cat, GOOD('Toyota hybrid system – excellent reliability record')],
    'TOYOTA HIGHLANDER': 'TOYOTA CAMRY',
    'TOYOTA URBAN CRUISER': [TOY.d4d14, GOOD('Petrol versions reliable')],
    'TOYOTA IQ': [GOOD('Simple and reliable')],
    'TOYOTA PREVIA': [TOY.ad, { ...TOY.d4d14, id: 'toy-1cd', eng: '2[.,]0 ?d-?4d', ccm: [[1994, 1996]], y: [2000, 2006], title: '2.0 D-4D (1CD) injectors and EGR' }],
    'TOYOTA AVENSIS VERSO': 'TOYOTA PREVIA',
    'TOYOTA VERSO-S': [GOOD('Simple and reliable')],
    'SUBARU TREZIA': 'TOYOTA VERSO-S',
    'TOYOTA AYGO X': [GOOD('1.0 three-cylinder (Toyota 1KR) is very reliable')],
    'SUZUKI SWACE': 'TOYOTA COROLLA',
    'SUZUKI ACROSS': 'TOYOTA RAV4',
    'SUBARU WRX': [SUB.wrx, SUB.cvt],
    'SUBARU LEVORG': [SUB.cvt, SUB.fb],
    'SUBARU CROSSTREK': 'SUBARU XV',
    'SUBARU SOLTERRA': 'TOYOTA BZ4X',
    'SUBARU TRIBECA': [GOOD('Generally durable flat-six')],
    'MAZDA RX-8': [MAZ.renesis],
    'MAZDA MX-5': [{ id: 'mx5-rust', y: [1989, 2015], sev: 2, cost: '€300–2,000', title: 'Sill and rear-arch rust', detail: 'MX-5s (NA/NB/NC) rust at sills and rear arches; blocked hood drains on NC.', check: 'Inspect sills behind the front wheels and rear arches.' }, GOOD('Engines and gearboxes are very durable')],
    'MAZDA BT-50': 'FORD RANGER',
    'MAZDA MPV': [MAZ.rf7j],
    'MAZDA PREMACY': [MAZ.rf7j, MAZ.rust],
    'MAZDA 323': [MAZ.rust],
    'MAZDA 626': [MAZ.rust, MAZ.rf7j],
    'MAZDA CX-80': 'MAZDA CX-60',
    'MAZDA MX-30': [{ id: 'mx30-range', y: [2020, 2024], fuel: ['electric'], sev: 1, cost: '—', title: 'Small battery (~170–200 km real range)', detail: 'The MX-30 EV has a deliberately small battery.', check: 'Make sure the range suits you.' }],
    'HONDA INSIGHT': [HONDA.ima],
    'HONDA CR-Z': [HONDA.ima],
    'HONDA S2000': [GOOD('F20C/F22C engines are very durable; check for track abuse')],
    'HONDA ZR-V': [GOOD('New model – Honda hybrids have a good record')],
    'HONDA STREAM': [GOOD('Generally reliable')],
    'HYUNDAI I40': [HK.crdi, HK.gdi16, HK.dct],
    'HYUNDAI H-1': [{ id: 'h1-d4cb', y: [2004, 2020], fuel: ['diesel'], eng: '2[.,]5 ?crdi', ccm: [[2496, 2498]], sev: 2, cost: '€800–2,500', title: '2.5 CRDi (D4CB) injectors and timing chain', detail: 'Injector failures and timing-chain/tensioner wear on H-1/Starex and Kia Sorento I 2.5 diesels.', check: 'Smoke, hard starting, rattle on start.' }],
    'HYUNDAI GRAND SANTA FE': 'HYUNDAI TUCSON',
    'HYUNDAI TRAJET': [HK.crdi, { id: 'trajet-20', y: [2000, 2008], fuel: ['diesel'], eng: '2[.,]0 ?crdi', sev: 2, cost: '€600–1,500', title: '2.0 CRDi (D4EA) injectors and flywheel', detail: 'Injector and dual-mass flywheel failures.', check: 'Smoke, idle rattle.' }],
    'HYUNDAI TERRACAN': 'HYUNDAI H-1',
    'HYUNDAI VELOSTER': [HK.gdi16, HK.dct],
    'HYUNDAI ACCENT': [GOOD('Simple and generally reliable')],
    'HYUNDAI ATOS': [GOOD('Simple city car; check for rust')],
    'HYUNDAI INSTER': [GOOD('New model – no track record yet')],
    'KIA CARNIVAL': [HK.crdiR, HK.awd],
    'KIA CERATO': [HK.crdi, HK.gdi16],
    'KIA STINGER': [HK.crdiR, GOOD('3.3 V6 petrol generally robust')],
    'KIA MAGENTIS': 'KIA OPTIMA',

    // ---- Volvo leftovers ----
    'VOLVO 850': [VOLVO.aw50, VOLVO.pcv],
    'VOLVO S70': 'VOLVO 850',
    'VOLVO C70': [VOLVO.aw50, VOLVO.pcv, VOLVO.d5, FORD.powershift],
    'VOLVO 240': [GOOD('Famously durable; check for rust')],
    'VOLVO 740': 'VOLVO 240',
    'VOLVO 940': 'VOLVO 240',
    'VOLVO XC40': [VOLVO.vea, GOOD('Generally solid')],
    'VOLVO C40': [{ id: 'volvo-ev-sw', y: [2021, 2024], fuel: ['electric'], sev: 1, cost: 'software', title: 'Software glitches on early electric Volvos', detail: 'Infotainment and charging software updates on early C40/XC40 Recharge/EX30.', check: 'Ask for the latest software.' }],
    'VOLVO EX30': 'VOLVO C40',
    'VOLVO EX90': 'VOLVO C40',

    // ---- Other brands sold in Slovenia ----
    'SAAB 9-3': [OPEL.cdti19, { id: 'saab-b207', y: [2002, 2012], fuel: ['petrol'], eng: '1[.,]8 ?t|2[.,]0 ?t', ccm: [[1997, 1999]], sev: 2, cost: '€400–1,500', title: '2.0T (B207) PCV and oil consumption', detail: 'Clogged crankcase ventilation and oil consumption on turbo petrols.', check: 'Oil level, smoke, leaking seals.' }],
    'SAAB 9-5': [OPEL.cdti19, { id: 'saab-sludge', y: [1997, 2004], fuel: ['petrol'], sev: 3, cost: '€2,000–5,000', title: 'B235 oil sludge (2.0T/2.3T)', detail: 'Early 9-5 turbo petrols suffer oil sludge from a poor PCV design, leading to engine failure.', check: 'Ask for the upgraded PCV kit and frequent oil changes; look into the oil filler for sludge.' }],
    'SAAB 900': [GOOD('Old Saabs are durable; check for rust and turbo wear')],
    'SAAB 9000': 'SAAB 900',
    'ROVER 25': [ROVER.kseries],
    'ROVER 45': [ROVER.kseries],
    'ROVER 75': [ROVER.kseries, { id: 'rover75-cdt', y: [1999, 2005], fuel: ['diesel'], sev: 1, cost: '€300–800', title: '2.0 CDT (BMW M47) EGR and swirl', detail: 'BMW-sourced diesel: EGR and intake faults.', check: 'Smoke, engine light.' }],
    'ROVER 200': [ROVER.kseries],
    'ROVER 400': [ROVER.kseries],
    'ROVER METRO': [ROVER.kseries],
    'ROVER STREETWISE': [ROVER.kseries],
    'MG ZR': [ROVER.kseries],
    'MG ZS': [ROVER.kseries, { id: 'mg-zs-ev-12v', y: [2019, 2024], fuel: ['electric'], sev: 1, cost: '€100–300', title: 'ZS EV 12V battery drain', detail: 'The 12V battery runs flat on some ZS EVs.', check: 'Ask about 12V battery replacement.' }],
    'MG TF': [ROVER.kseries],
    'MG F': [ROVER.kseries],
    'MG MG4': [{ id: 'mg4-12v', y: [2022, 2025], fuel: ['electric'], sev: 1, cost: '€100–300 / software', title: '12V battery drain and software updates', detail: 'Early MG4s had 12V battery and infotainment issues fixed by updates.', check: 'Ask for the latest software and 12V battery history.' }],
    'MG 4': 'MG MG4',
    'MG HS': [{ id: 'mg-hs-dct', y: [2019, 2024], gear: 'auto', sev: 1, cost: 'software / €1,000+', title: 'Dual-clutch gearbox hesitation', detail: 'The 1.5T DCT can hesitate and judder at low speed.', check: 'Stop-and-go test drive.' }],
    'MG EHS': 'MG HS',
    'LAND ROVER FREELANDER': [JLR.ingenium, ROVER.kseries,
      { id: 'fl2-diff', y: [2006, 2014], sev: 2, cost: '€800–2,000', title: 'Freelander 2 rear diff / Haldex coupling', detail: 'Rear differential and Haldex coupling failures, especially with mismatched tyres.', check: 'Whine/clunk from the rear; all four tyres the same.' },
      { id: 'fl1-vcu', y: [1997, 2006], sev: 2, cost: '€600–1,500', title: 'Freelander 1 VCU and rear diff', detail: 'The viscous coupling stiffens and destroys the rear diff; the 1.8 K-series also blows head gaskets.', check: 'Tight-turn binding; jack-up wheel test for the VCU.' }],
    'SSANGYONG KYRON': [SSY.xdi, SSY.rust],
    'SSANGYONG REXTON': [SSY.xdi, SSY.rust],
    'SSANGYONG ACTYON': [SSY.xdi, SSY.rust],
    'SSANGYONG RODIUS': [SSY.xdi, SSY.rust],
    'SSANGYONG MUSSO': [SSY.rust],
    'SSANGYONG KORANDO': [{ id: 'korando-dpf', y: [2010, 2019], fuel: ['diesel'], sev: 1, cost: '€400–1,500', title: '2.0 e-XDi DPF and turbo', detail: 'DPF clogging on short trips and turbo issues.', check: 'DPF warnings, smoke.' }],
    'SSANGYONG TIVOLI': [GOOD('Generally dependable')],
    'SSANGYONG XLV': 'SSANGYONG TIVOLI',
    'KG MOBILITY KORANDO': 'SSANGYONG KORANDO',
    'KG MOBILITY REXTON': 'SSANGYONG REXTON',
    'KG MOBILITY TIVOLI': 'SSANGYONG TIVOLI',
    'KG MOBILITY MUSSO': [GOOD('New-generation Musso – no notable pattern yet')],
    'KG MOBILITY TORRES': [GOOD('New model – no track record yet')],
    'ISUZU TROOPER': [ISUZU.trooper],
    'ISUZU D-MAX': [ISUZU.dmax],
    'DAEWOO LANOS': [DAEWOO.belt, DAEWOO.rust],
    'DAEWOO NUBIRA': [DAEWOO.belt, DAEWOO.rust],
    'DAEWOO LACETTI': [DAEWOO.belt, DAEWOO.rust],
    'DAEWOO TACUMA': [DAEWOO.belt, DAEWOO.rust],
    'DAEWOO EVANDA': [DAEWOO.belt, DAEWOO.rust],
    'DAEWOO LEGANZA': [DAEWOO.belt, DAEWOO.rust],
    'DAEWOO MATIZ': [DAEWOO.rust, { id: 'matiz-clutch', y: [1998, 2011], sev: 1, cost: '€300–600', title: 'Clutch cable and timing belt', detail: 'The 0.8/1.0 engines need timing-belt changes; clutch cables snap.', check: 'Belt invoice; clutch feel.' }],
    'DAEWOO KALOS': 'CHEVROLET AVEO',
    'CHEVROLET LACETTI': 'DAEWOO LACETTI',
    'CHEVROLET NUBIRA': 'DAEWOO NUBIRA',
    'CHEVROLET TACUMA': 'DAEWOO TACUMA',
    'CHEVROLET REZZO': 'DAEWOO TACUMA',
    'CHEVROLET EVANDA': 'DAEWOO EVANDA',
    'CHEVROLET MATIZ': 'DAEWOO MATIZ',
    'CHEVROLET VOLT': [GOOD('Volt plug-in hybrid has a good reliability record')],
    'DAIHATSU TERIOS': [{ id: 'daihatsu-rust', y: [1997, 2016], sev: 1, cost: '€200–800', title: 'Underbody rust', detail: 'Older Daihatsus rust underneath; mechanically they are very simple.', check: 'Inspect the underbody and sills.' }, GOOD('Simple, durable mechanics')],
    'DAIHATSU SIRION': 'DAIHATSU TERIOS',
    'DAIHATSU CUORE': 'DAIHATSU TERIOS',
    'DAIHATSU YRV': 'DAIHATSU TERIOS',
    'DAIHATSU MATERIA': 'DAIHATSU TERIOS',
    'DAIHATSU CHARADE': 'DAIHATSU TERIOS',
    'DAIHATSU COPEN': [{ id: 'copen-roof', y: [2002, 2012], sev: 1, cost: '€300–1,000', title: 'Folding-roof hydraulics and rust', detail: 'The electric roof pump/rams leak; sills rust.', check: 'Operate the roof several times.' }],
    'SUZUKI ALTO': [GOOD('Simple and reliable')],
    'SUZUKI CELERIO': 'SUZUKI ALTO',
    'SUZUKI SPLASH': 'SUZUKI ALTO',
    'SUZUKI WAGON R': 'SUZUKI ALTO',
    'SUZUKI BALENO': 'SUZUKI ALTO',
    'SUZUKI LIANA': 'SUZUKI ALTO',
    'SUZUKI SAMURAI': 'SUZUKI JIMNY',
    'SUZUKI X-90': 'SUZUKI JIMNY',
    'LADA NIVA': [{ id: 'lada-rust', sev: 2, cost: '€300–2,000', title: 'Rust and basic build quality', detail: 'Ladas rust quickly and need frequent small repairs; the Niva transfer case and driveshafts wear.', check: 'Inspect body and underbody; listen for drivetrain noises.' }],
    'LADA SAMARA': 'LADA NIVA',
    'LADA KALINA': 'LADA NIVA',
    'LADA GRANTA': 'LADA NIVA',
    'LADA VESTA': 'LADA NIVA',
    'POLESTAR 2': [{ id: 'polestar2-sw', y: [2020, 2024], fuel: ['electric'], sev: 1, cost: 'software', title: 'Software and 12V battery issues', detail: 'Early cars needed many over-the-air updates; some 12V battery failures.', check: 'Ask for the latest software version.' }],
    'TESLA ROADSTER': [GOOD('Rare collector car – specialist inspection recommended')],

    // ---- Final pass: remaining mainstream models with documented problems ----
    'MINI COUPE': 'MINI COOPER',
    'MINI ROADSTER': 'MINI COOPER',
    'SMART FORTWO': [{ id: 'smart-gear', y: [1998, 2014], gear: 'auto', sev: 2, cost: '€500–1,200', title: 'Automated gearbox actuator and clutch', detail: 'Clutch actuator and clutch wear on the automated manual (450/451).', check: 'Jerky shifts, gearbox warning.' },
      { id: 'smart-450-engine', y: [1998, 2007], fuel: ['petrol'], sev: 2, cost: '€1,500–3,000', title: '450 (city coupe) 0.6/0.7 turbo engine wear', detail: 'The small rear turbo engine burns oil and fails at high mileage, often from overheating.', check: 'Oil consumption, smoke, coolant loss.' }],
    'SMART CITY': 'SMART FORTWO',
    'SMART FORFOUR': [{ id: 'forfour-old', y: [2004, 2006], sev: 1, cost: '€200–800', title: '2004–2006 forfour is a Mitsubishi Colt underneath', detail: 'Shares the Colt’s simple mechanics; the 1.5 CDI (OM639) diesel has injector and DPF issues.', check: 'Smoke, DPF warnings on the diesel.' }, RN.tce12, RN.edc],
    'SMART ROADSTER': [{ id: 'smart-gear', y: [2003, 2006], gear: 'auto', sev: 2, cost: '€500–1,200', title: 'Automated gearbox actuator and roof leaks', detail: 'Gearbox actuator wear; soft-top and roof drains leak.', check: 'Shift quality; damp carpets.' }],
    'JAGUAR X-TYPE': [FORD.tdci20, { id: 'xtype-awd', y: [2001, 2009], sev: 2, cost: '€800–2,000', title: 'AWD transfer box and rear diff (petrol V6)', detail: 'The AWD transfer box fails on V6 X-Types; diesels share Ford’s 2.0/2.2 TDCi problems.', check: 'Whine/clunks on the move; check for leaks at the transfer box.' }],
    'JAGUAR S-TYPE': [{ id: 'jag-27tdv6', y: [2004, 2009], fuel: ['diesel'], eng: '2[.,]7', ccm: [[2719, 2721]], sev: 3, cost: '€2,500–6,000', title: '2.7 TDV6 turbo and crankshaft failures', detail: 'The Ford/PSA 2.7 V6 diesel (also Land Rover Discovery 3/Range Rover Sport) suffers turbo and crankshaft failures.', check: 'Smoke, knocking, oil pressure warnings.' }],
    'JAGUAR XJ': [{ id: 'jag-27tdv6', y: [2004, 2010], fuel: ['diesel'], eng: '2[.,]7', ccm: [[2719, 2721]], sev: 3, cost: '€2,500–6,000', title: '2.7 TDV6 turbo and crankshaft failures', detail: 'Turbo and crankshaft failures on the 2.7 V6 diesel.', check: 'Smoke, knocking.' }, JLR.tdv6, JLR.air],
    'JAGUAR XF': [JLR.ingenium, JLR.tdv6, { id: 'jag-27tdv6', y: [2008, 2010], fuel: ['diesel'], eng: '2[.,]7', ccm: [[2719, 2721]], sev: 3, cost: '€2,500–6,000', title: '2.7 TDV6 turbo and crankshaft failures', detail: 'Turbo and crankshaft failures on the 2.7 V6 diesel.', check: 'Smoke, knocking.' }],
    'JAGUAR I-PACE': [{ id: 'ipace-battery', y: [2018, 2024], fuel: ['electric'], sev: 2, cost: 'recall', title: 'Battery recall (fire risk) and software updates', detail: 'I-Pace batteries were recalled with charge limits and some packs replaced.', check: 'Confirm all battery recalls were completed.' }],
    'JAGUAR F-TYPE': [GOOD('Supercharged V6/V8 generally robust')],
    'LAND ROVER DISCOVERY': [JLR.ingenium, JLR.tdv6, JLR.air, JLR.zf9, { id: 'jag-27tdv6', y: [2004, 2009], fuel: ['diesel'], eng: '2[.,]7', ccm: [[2719, 2721]], sev: 3, cost: '€2,500–6,000', title: '2.7 TDV6 crankshaft and turbo failures', detail: 'Discovery 3 / Range Rover Sport 2.7 diesel crank and turbo failures.', check: 'Knocking, smoke.' }],
    'CHRYSLER CROSSFIRE': 'MERCEDES BENZ C',
    'DODGE RAM': [{ id: 'hemi-lifter', y: [2009, 2024], fuel: ['petrol', 'lpg'], eng: 'hemi|5[.,]7', ccm: [[5650, 5700]], sev: 3, cost: '€2,500–5,000', title: '5.7 Hemi lifter / camshaft failure ("Hemi tick")', detail: 'Lifter rollers seize and wipe the camshaft, especially with cylinder deactivation (MDS).', check: 'Ticking at idle, misfire codes.' }],
    'DODGE CHALLENGER': 'DODGE RAM',
    'DODGE CHARGER': 'DODGE RAM',
    'DODGE DURANGO': 'DODGE RAM',
    'DODGE MAGNUM': 'DODGE RAM',
    'JEEP GRAND': [{ id: 'gc-30crd', y: [2011, 2018], fuel: ['diesel'], eng: '3[.,]0 ?(crd|v6|multijet)', ccm: [[2986, 2988]], sev: 2, cost: '€800–2,500', title: '3.0 CRD (VM) oil-cooler leak and EGR', detail: 'Oil-cooler gasket leaks (oil into coolant) and EGR failures on the WK2 diesel.', check: 'Check coolant for oil, EGR fault codes.' },
      { ...MB.om642, y: [2005, 2010] },
      { id: 'hemi-lifter', y: [2009, 2024], fuel: ['petrol', 'lpg'], eng: 'hemi|5[.,]7', ccm: [[5650, 5700]], sev: 3, cost: '€2,500–5,000', title: '5.7 Hemi lifter / camshaft failure ("Hemi tick")', detail: 'Lifter rollers seize and wipe the camshaft.', check: 'Ticking at idle, misfire codes.' },
      { id: 'gc-air', y: [2011, 2021], sev: 2, cost: '€600–2,000', title: 'Quadra-Lift air suspension', detail: 'Air springs and the compressor fail with age.', check: 'Car level after standing; no suspension warnings.' }],
    'CHEVROLET TAHOE': [{ id: 'gm-afm', y: [2007, 2021], fuel: ['petrol', 'lpg'], eng: '5[.,]3|6[.,]2|v8', sev: 3, cost: '€2,000–5,000', title: 'V8 cylinder-deactivation (AFM/DFM) lifter failure', detail: 'GM 5.3/6.2 V8 lifters collapse, causing misfires and camshaft damage; also oil consumption.', check: 'Ticking, misfire codes, oil consumption.' }],
    'CHEVROLET SUBURBAN': 'CHEVROLET TAHOE',
    'CHEVROLET AVALANCHE': 'CHEVROLET TAHOE',
    'CADILLAC ESCALADE': 'CHEVROLET TAHOE',
    'CHEVROLET CAMARO': [{ id: 'gm-36-chain', y: [2009, 2016], fuel: ['petrol'], eng: '3[.,]6|v6', ccm: [[3563, 3565]], sev: 3, cost: '€1,500–3,500', title: '3.6 V6 (LLT/LFX) timing-chain stretch', detail: 'GM’s 3.6 direct-injection V6 stretches its timing chains, often with long oil-change intervals.', check: 'Cam-correlation engine codes (P0008/P0017), rattle on start.' }],
    'CADILLAC CTS': 'CHEVROLET CAMARO',
    'CADILLAC SRX': 'CHEVROLET CAMARO',
    'CADILLAC STS': 'CHEVROLET CAMARO',
    'CADILLAC BLS': 'SAAB 9-3',
    'MITSUBISHI CARISMA': [RN.dci19, { id: 'carisma-gdi', y: [1997, 2004], fuel: ['petrol'], eng: 'gdi|1[.,]8', sev: 2, cost: '€400–1,500', title: '1.8 GDI carbon build-up and injection pump', detail: 'Early direct-injection petrol: intake carbon, injectors and the high-pressure pump.', check: 'Rough idle, hesitation, engine light.' }],
    'MITSUBISHI GALANT': [{ id: 'carisma-gdi', y: [1997, 2004], fuel: ['petrol'], eng: 'gdi', sev: 2, cost: '€400–1,500', title: 'GDI carbon build-up and injection pump', detail: 'Early direct-injection petrol: intake carbon, injectors and the high-pressure pump.', check: 'Rough idle, hesitation.' }],
    'TOYOTA MIRAI': [{ id: 'mirai-h2', sev: 3, cost: '—', title: 'No public hydrogen refuelling in Slovenia', detail: 'A hydrogen car needs H2 stations; the nearest are abroad, which makes daily use impractical.', check: 'Plan where you would refuel before buying.' }],
    'NISSAN GT-R': [{ id: 'gtr-gear', y: [2009, 2016], gear: 'auto', sev: 2, cost: '€1,000–10,000', title: 'GR6 dual-clutch gearbox: bellhousing rattle and clutch wear', detail: 'Early GT-R gearboxes rattle and wear clutches quickly under launch control.', check: 'Gearbox service history; clunks at low speed.' }],
    'NISSAN NV300': 'RENAULT TRAFIC',
    'NISSAN SERENA': [GOOD('Simple MPV; check for rust on older cars')],
    'INFINITI G': 'NISSAN 370Z',
    'INFINITI Q60': 'INFINITI Q50',
    'INFINITI Q70': 'INFINITI M',
    'INFINITI QX50': 'INFINITI EX',
    'KIA EV9': 'HYUNDAI IONIQ 5',
    'KIA EV3': [GOOD('New model – no track record yet')],
    'KIA SELTOS': [GOOD('New to Europe – no notable pattern yet')],
    'LANCIA Y': 'FIAT PANDA',
    'SUZUKI WAGON': 'SUZUKI ALTO',
    'FIAT 124': [FCA.multiair, { id: 'mx5-rust', y: [2016, 2020], sev: 1, cost: '€200–800', title: 'Shares the MX-5 (ND) body – check sills and drains', detail: 'Built on the Mazda MX-5 platform with Fiat’s 1.4 MultiAir turbo.', check: 'Inspect sills and soft-top drains.' }],
    'HYUNDAI GRAND': 'HYUNDAI TUCSON',
    'GENESIS G70': 'KIA STINGER',
    'DACIA JOGGER': [RN.tce12, GOOD('1.0 TCe/hybrid – no notable pattern yet')]
  });

  // Brands each shared engine family appears in (shared engines cross brands).
  const FAMILY_BRANDS = [
    [VAG, ['VOLKSWAGEN', 'AUDI', 'SKODA', 'SEAT', 'CUPRA', 'PORSCHE']],
    [PSA, ['PEUGEOT', 'CITROEN', 'DS', 'DS AUTOMOBILES']],
    [RN, ['RENAULT', 'DACIA', 'NISSAN']],
    [FORD, ['FORD']],
    [OPEL, ['OPEL', 'CHEVROLET', 'SAAB', 'VAUXHALL']],
    [BMW, ['BMW', 'MINI']],
    [MB, ['MERCEDES BENZ', 'INFINITI']],
    [TOY, ['TOYOTA', 'LEXUS']],
    [HK, ['HYUNDAI', 'KIA']],
    [MAZ, ['MAZDA']],
    [HONDA, ['HONDA']],
    [VOLVO, ['VOLVO']],
    [JLR, ['LAND ROVER', 'JAGUAR']],
    [FCA, ['FIAT', 'ALFA ROMEO', 'JEEP', 'LANCIA', 'ABARTH']],
    [SUB, ['SUBARU']],
    [MIT, ['MITSUBISHI']],
    [PORSCHE, ['PORSCHE']],
    [ROVER, ['ROVER', 'MG', 'LAND ROVER', 'LOTUS']],
    [SSY, ['SSANGYONG', 'KG MOBILITY']],
    [ISUZU, ['ISUZU', 'OPEL']],
    [DAEWOO, ['DAEWOO', 'CHEVROLET']]
  ];
  // Engines one brand bought from another.
  const EXTRA_BRANDS = {
    'psa-dv6': ['FORD', 'VOLVO', 'MAZDA', 'MINI', 'SUZUKI'],
    'psa-dw10': ['FORD', 'VOLVO', 'MITSUBISHI', 'FIAT', 'LANCIA'],
    'psa-bluehdi': ['OPEL'],
    'psa-puretech': ['OPEL', 'FIAT', 'JEEP'],
    'psa-puretech-chain': ['OPEL', 'FIAT', 'JEEP'],
    'psa-thp': ['MINI'],
    'rn-k9k': ['MERCEDES BENZ', 'SUZUKI', 'INFINITI'],
    'rn-v6dci': ['INFINITI'],
    'rn-f9q': ['SUZUKI', 'VOLVO'],
    'rn-m9r': ['OPEL'],
    'rn-h5ft': ['MERCEDES BENZ'],
    'fiat-13mj': ['FIAT', 'ALFA ROMEO', 'LANCIA', 'SUZUKI', 'JEEP'],
    'opel-19cdti': ['FIAT', 'ALFA ROMEO', 'LANCIA', 'SAAB', 'SUZUKI'],
    'fca-mj2': ['SUZUKI'],
    'ford-16eb': ['VOLVO'],
    'ford-dps6': ['VOLVO'],
    'bmw-n47': ['TOYOTA'],
    'mb-om651': ['INFINITI']
  };
  const FAMILY_ITEMS = [];
  for (const [group, brands] of FAMILY_BRANDS) {
    for (const item of Object.values(group)) FAMILY_ITEMS.push({ item, brands: new Set([...brands, ...(EXTRA_BRANDS[item.id] || [])]) });
  }

  // Performance and body-style variants share the base model's engines and problems.
  const PATTERN_ALIASES = [
    [/^AUDI R?S ?(\d)$/, 'AUDI A$1'],              // S3, RS4 -> A3, A4
    [/^AUDI R?S ?Q ?(\d)$/, 'AUDI Q$1'],           // SQ5, RS Q3 -> Q5, Q3
    [/^AUDI TT ?(S|RS)$/, 'AUDI TT'],
    [/^AUDI TTS$/, 'AUDI TT'],
    [/^VOLKSWAGEN CROSS ?(POLO|TOURAN|GOLF)$/, 'VOLKSWAGEN $1'],
    [/^VOLKSWAGEN CROSSGOLF$/, 'VOLKSWAGEN GOLF'],
    [/^VOLKSWAGEN CROSSPOLO$/, 'VOLKSWAGEN POLO'],
    [/^VOLKSWAGEN CROSSTOURAN$/, 'VOLKSWAGEN TOURAN'],
    [/^(MERCEDES BENZ [A-Z]+)-?RAZRED$/, '$1'],
    [/^BMW (\d) (COUPE|CABRIO|TOURING|COMPACT|GRAN|ACTIVE|GT)$/, 'BMW $1'],
    [/^E-(\d{4})$/, null]                           // Peugeot E-3008 etc: electric, no engine problems
  ];

  function resolve(key) {
    let v = MODELS[key];
    if (v === undefined) {
      for (const [re, to] of PATTERN_ALIASES) {
        if (re.test(key) && to) { v = MODELS[key.replace(re, to)]; break; }
      }
    }
    let hops = 0;
    while (typeof v === 'string' && hops++ < 4) v = MODELS[v];
    return Array.isArray(v) ? v : null;
  }

  // 'likely' when everything the issue depends on matches the car, 'possible' when some of it
  // is unknown from the listing, null when something known rules it out.
  function statusFor(it, car, hay) {
    let unknown = 0;
    if (it.y) {
      if (!car.year) unknown++;
      else if (car.year < it.y[0] || car.year > it.y[1]) return null;
    }
    if (it.fuel) {
      if (!car.fuel) unknown++;
      else if (!it.fuel.includes(car.fuel)) return null;
    }
    if (it.gear) {
      const g = car.gearbox;
      if (!g) unknown++;
      else if (it.gear === 'dsg' && g !== 'dsg') return null;
      else if (it.gear === 'auto' && g === 'manual') return null;
      else if (it.gear === 'manual' && g !== 'manual') return null;
    }
    if (it.notEng && new RegExp(it.notEng, 'i').test(hay)) return null;
    if (it.eng || it.ccm) {
      const engHit = it.eng ? new RegExp(it.eng, 'i').test(hay) : false;
      const ccmHit = it.ccm && car.ccm ? it.ccm.some(([a, b]) => car.ccm >= a && car.ccm <= b) : false;
      if (it.ccm && car.ccm && !ccmHit) return null;
      // Some engines share a displacement with others (S55 vs N55): the name must match too.
      if (it.engRequired && !engHit) return null;
      if (!engHit && !ccmHit) {
        // Engine is known and doesn't match -> skip. Unknown engine -> "possible".
        if (car.ccm || /\b\d[.,]\d\b/.test(hay)) return null;
        unknown++;
      }
    }
    // Gearbox-specific issues: a name hint in the title confirms which gearbox it is.
    if (it.hint && !new RegExp(it.hint, 'i').test(hay) && !unknown) unknown++;
    return unknown ? 'possible' : 'likely';
  }

  // car: { make, model, variant, title, year, fuel, gearbox, ccm }
  function match(car) {
    const keys = CDS.data.candidateKeys(car.make, car.model, car.variant);
    let key = null, list = null;
    for (const k of keys) { list = resolve(k); if (list) { key = k; break; } }

    const hay = `${car.title || ''} ${car.variant || ''}`.toLowerCase();
    const items = [];
    const positives = [];
    const seen = new Set();
    for (const it of list || []) {
      if (it.positive) {
        // Unconditional praise, or praise tied to a specific engine/year ("chain from 2024").
        const conditional = it.y || it.fuel || it.eng || it.ccm || it.gear;
        if (!conditional || statusFor(it, car, hay) === 'likely') positives.push(it.title);
        continue;
      }
      const status = statusFor(it, car, hay);
      if (!status) continue;
      seen.add(it.id);
      if (it.same) seen.add(it.same);   // model entry already covers this shared engine
      items.push({ ...it, status });
    }

    // Shared engine families apply to every model of the brands that use them, but only when
    // the listing positively shows that engine (size or name) – never on a guess.
    const make = CDS.data.normMake(car.make);
    for (const { item, brands } of FAMILY_ITEMS) {
      if (!brands.has(make) || seen.has(item.id)) continue;
      const hasEvidence = item.eng || item.ccm || (item.gear && item.hint && new RegExp(item.hint, 'i').test(hay));
      if (!hasEvidence) continue;
      if (statusFor(item, car, hay) !== 'likely') continue;
      seen.add(item.id);
      if (item.positive) { if (!positives.includes(item.title)) positives.push(item.title); continue; }
      items.push({ ...item, status: 'likely', fromFamily: true });
    }

    if (!list && !items.length) return null;
    items.sort((a, b) => (a.status === b.status ? b.sev - a.sev : a.status === 'likely' ? -1 : 1));
    return { key: key || `${make} (engine families)`, items, positives };
  }

  return { match, resolve, MODELS };
})();
