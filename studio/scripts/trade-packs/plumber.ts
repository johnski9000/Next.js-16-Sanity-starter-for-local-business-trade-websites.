/**
 * PLUMBER trade pack — the fictional "Vanguard Plumbing & Heating" demo.
 *
 * All values here were moved VERBATIM out of seed-dev.ts + seed-site.ts. This
 * is the first trade pack; the seed scripts build their documents from this
 * data via getPack(). Editing copy here changes the seeded plumber demo.
 *
 * Every contact detail is deliberately reserved/fake (.example domain, 555
 * phone range, Ofcom-reserved 07700 900xxx WhatsApp) so no real data ships.
 * The testimonials are the pre-approved fictional reviews from the content
 * brief.
 */
import type {TradePack, StepTuple, IconLabel} from './types'

// ---------------------------------------------------------------------------
// Shared (reused across multiple service docs)
// ---------------------------------------------------------------------------

const SHARED_TRUST_SIGNALS: IconLabel[] = [
  ['ShieldCheck', 'Gas Safe Registered'],
  ['Clock', 'Rapid Response'],
  ['Star', '5-Star Rated'],
  ['Tag', 'Free Fixed Quotes'],
]

const SHARED_STEPS: StepTuple[] = [
  [
    'Phone',
    'Enquiry & consultation',
    'Get in touch by phone, email or the quote form. We talk through your existing setup, identify the likely issues and book a free survey.',
  ],
  [
    'ClipboardList',
    'On-site survey',
    'A senior engineer visits to inspect mains pressure, gas supply, flue routing and radiator output, taking the measurements the job actually needs.',
  ],
  [
    'Ruler',
    'Fixed-price proposal',
    'You receive an itemised, transparent fixed-price quote within 24 hours. The price quoted is exactly what you pay — no hidden extras, no surprises.',
  ],
  [
    'BadgeCheck',
    'Installation & handover',
    'Gas Safe engineers arrive punctually, protect your floors, carry out the work tidily, then commission, test and walk you through everything before sign-off.',
  ],
]

// Areas each service links out to. Narrowed to the four substantive area pages
// (the rest are thinner placeholder pages) so service → area links stay strong.
const SERVICE_AREAS = ['altrincham', 'sale', 'didsbury', 'knutsford']

const SITE = 'Vanguard Plumbing & Heating'
// Production canonical host is the www subdomain. Reserved .example domain.
const URL = 'https://www.vanguardplumbing.example'
const PHONE_DISPLAY = '0161 555 0192'
const PHONE_TEL = '+441615550192'
const EMAIL = 'enquiries@vanguardplumbing.example'

const QUOTE = {text: 'Get a Free Quote', href: '/quote'}
const CALL = {text: `Call ${PHONE_DISPLAY}`, href: `tel:${PHONE_TEL}`}

// Trust badges shown beneath each hero.
const TRUST_BADGES = [
  {icon: 'ShieldCheck', label: 'Gas Safe Registered'},
  {icon: 'Clock', label: '24/7 Emergency Response'},
  {icon: 'Star', label: '5-Star Rated'},
  {icon: 'Tag', label: 'Free Quotes'},
]

const AREAS_12 = [
  'Altrincham',
  'Sale',
  'Stretford',
  'Urmston',
  'Chorlton',
  'Didsbury',
  'Stockport',
  'Wilmslow',
  'Cheadle',
  'Bramhall',
  'Timperley',
  'Knutsford',
]

export const plumber: TradePack = {
  trade: 'plumber',

  // -------------------------------------------------------------------------
  // Business identity + structured data
  // -------------------------------------------------------------------------
  business: {
    siteTitle: SITE,
    legalName: 'Vanguard Plumbing & Heating Contractors Ltd',
    url: URL,
    phoneDisplay: PHONE_DISPLAY,
    phoneTel: PHONE_TEL,
    email: EMAIL,
    whatsappNumber: '447700900076',
    address: {
      street: '24 Grosvenor Road',
      locality: 'Altrincham',
      region: 'Greater Manchester',
      postcode: 'WA14 1LD',
      country: 'GB',
    },
    geo: {latitude: 53.3831, longitude: -2.3534},
    foundingDate: '2011-03-01',
    founder: {name: 'Thomas Vance', jobTitle: 'Founder & Lead Heating Engineer'},
    sameAs: [
      'http://maps.google.com/?cid=vanguardplumbingmcr1298',
      'https://www.facebook.com/vanguardplumbingandheating',
    ],
    priceRange: '£££',
    currency: 'GBP',
    areaServed: 'Greater Manchester & North Cheshire',
    description:
      'Vanguard Plumbing & Heating is a Gas Safe registered plumbing, heating and bathroom specialist covering Altrincham, Sale, Stockport, Wilmslow, Didsbury and the wider Greater Manchester and North Cheshire area.',
    openingHours: [
      {
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      {
        dayOfWeek: ['Saturday'],
        opens: '08:00',
        closes: '13:00',
      },
    ],
  },

  seo: {
    title: `${SITE} | Gas Safe Plumber & Heating Engineer, Altrincham`,
    description:
      'Gas Safe registered plumbing and heating across Greater Manchester and North Cheshire — boiler installation, emergency repairs, luxury bathrooms, servicing, power flushing and underfloor heating. Free quotes, fully insured.',
  },

  structuredData: {
    services: [
      'Boiler Installation & Heating Upgrades',
      'Emergency Plumbing Repairs',
      'Luxury Bathroom Design & Renovation',
      'Gas Safety Certificates & Boiler Servicing',
      'Power Flushing & System Deep Clean',
      'Underfloor Heating Design & Installation',
    ],
    areaServedCities: AREAS_12,
    reviews: {
      enabled: true,
      ratingValue: 5,
      reviewCount: 27,
      bestRating: 5,
      worstRating: 1,
    },
    searchUrlTemplate: `${URL}/search?q={search_term_string}`,
    localBusinessServiceAreaOnly: true,
  },

  // -------------------------------------------------------------------------
  // Shared service content
  // -------------------------------------------------------------------------
  shared: {
    trustSignals: SHARED_TRUST_SIGNALS,
    steps: SHARED_STEPS,
    serviceAreaSlugs: SERVICE_AREAS,
  },

  // -------------------------------------------------------------------------
  // Services
  // -------------------------------------------------------------------------
  services: [
    {
      slug: 'boiler-installation-heating-upgrades',
      name: 'Boiler Installation & Heating Upgrades',
      h1: 'Boiler Installation in Greater Manchester',
      icon: 'Flame',
      order: 10,
      summary:
        'Premium ErP A-rated condensing boiler installations and full central heating upgrades across Greater Manchester. Worcester Bosch Diamond and Vaillant Advance accredited, with 12-year warranties.',
      overview: [
        'Premium boiler installation and central heating upgrades across Greater Manchester and North Cheshire for homeowners and landlords in [Altrincham](/areas/altrincham), Sale, Didsbury, Wilmslow and the wider service area. Whether you’re replacing a tired combi like-for-like, decommissioning an old gravity-fed system with loft tanks, or upgrading to a high-pressure unvented setup, every installation is sized to your property — incoming mains pressure, gas supply capacity, flue routing and radiator output are all measured before a single appliance is specified.',
        'We install high-efficiency ErP A-rated condensing boilers as standard, and as officially vetted Worcester Bosch Diamond Accredited and Vaillant Advance Master installers we can register exclusive manufacturer-backed 12-year parts-and-labour warranties at no extra cost — where general installers typically offer five to seven years. Every job includes a full system power flush to strip out historical magnetite sludge, clean high-grade copper pipework around the appliance, and an Adey MagnaClean magnetic filter to protect the new heat exchanger for the life of the system.',
        'Smart thermostat control (Nest, Hive or tado° multi-zone) is configured to your phone, every radiator is balanced for even heat, gas tightness is verified, and your warranty is activated live before we leave. All building control notification and Gas Safe paperwork is handled for you, and your old boiler, redundant tanks and scrap copper are removed and recycled. Need the system cleaned out first? See [power flushing](/services/power-flushing-system-clean). Fully Gas Safe registered, free fixed-price quotes, and 0% finance available over 12 or 24 months.',
      ],
      pricingIndication:
        'Straight combi-to-combi swaps from £1,950; full system conversions to unvented from £3,200. 0% finance over 12 or 24 months. Free fixed-price quote.',
      whatsIncluded: [
        [
          'Full system power flush before install',
          'A complete power flush using industrial-grade Kamco equipment strips out historical magnetite sludge and debris before the new appliance goes on, so it runs on a clean system from day one rather than inheriting years of build-up.',
        ],
        [
          'Premium A-rated condensing boiler',
          'Precision installation of high-efficiency ErP A-rated condensing boilers — Worcester Bosch (Diamond Accredited) or Vaillant (Advance Master) — sized to your hot water demand, water hardness and available footprint rather than a generic off-the-shelf pick.',
        ],
        [
          'High-grade copper pipework',
          'Clean, high-grade copper pipework replacement across the visible footprint surrounding the boiler — no cheap plastic push-fit connectors hidden behind the casing, just neat, durable, serviceable joints you’d be happy to look at.',
        ],
        [
          'Smart thermostat integration',
          'Advanced smart thermostat architecture — Nest Learning Thermostat, Hive Active Heating or tado° multi-zone — configured directly to your smartphone, with a sit-down walkthrough until you’re fully confident controlling your heating and hot water.',
        ],
        [
          'MagnaClean magnetic filter',
          'An Adey MagnaClean Professional magnetic system filter fitted as standard to capture ferrous debris before it reaches the heat exchanger, providing ongoing lifecycle protection for your newly installed boiler and helping it run efficiently for years.',
        ],
        [
          'Full compliance documentation',
          'All legal building control compliance documentation, Gas Safe Register notification and immediate direct manufacturer warranty activation handled on your behalf — no chasing certificates after the engineers have packed up and gone.',
        ],
        [
          'Old system removal and recycling',
          'Safe structural disposal and certified eco-friendly recycling of your old decommissioned boiler, redundant cold-water loft tanks and all redundant copper and lead lines — nothing left in the garden or on the drive for you to deal with.',
        ],
        [
          'Commissioning and radiator balancing',
          'Every radiator balanced to optimise thermal distribution, chemical inhibitor dosed through the system, gas tightness verified and the whole installation commissioned to manufacturer spec before a snag-free handover.',
        ],
      ],
      steps: SHARED_STEPS,
      faqs: [
        [
          'How long will my home be without heating and hot water during a boiler installation?',
          'For a standard boiler replacement, your system is only isolated for roughly four to six hours. We plan the day so your domestic hot water is re-established before the engineers pack up, and for like-for-like swaps most homes are back to full heating and hot water the same evening. Larger system conversions can run one to two working days, but we always confirm the realistic downtime at survey so you can plan around it.',
        ],
        [
          'Which boiler brand is best for my property?',
          'It depends on your hot water flow rate, the number of bathrooms, your local water hardness and the physical space available. We give an unbiased, engineering-backed comparison of Worcester Bosch and Vaillant against your exact requirements rather than pushing whichever brand carries the best margin that month. As Diamond and Advance accredited installers for both, we can register the longest manufacturer warranties on either — so the recommendation is driven purely by what suits your home.',
        ],
        [
          'Do I need to replace my radiators when I get a new boiler?',
          'In around 90% of cases, no. Existing radiators undergo a deep power flush as part of the installation, which clears blockages and sludge and restores their thermal efficiency close to original manufacturing standards. We only recommend replacing radiators where they’re physically corroded, leaking or genuinely undersized for the room — and if so, we’ll show you the evidence at survey rather than adding them to the quote by default.',
        ],
        [
          'What’s the difference between a combi and a system boiler?',
          'A combi boiler heats water instantly on demand straight from the mains, with no storage tanks needed — ideal for smaller homes and flats where space is tight. A system boiler works alongside a dedicated unvented hot water cylinder to supply strong, simultaneous hot water across multiple bathrooms. The right choice comes down to how many bathrooms you run at once and your incoming mains pressure, both of which we measure during the survey.',
        ],
        [
          'Will a new boiler actually lower my bills?',
          'Yes — meaningfully. Switching from an older non-condensing G-rated boiler to a new ErP A-rated condensing model can cut gas consumption by up to 30%, which on a typical domestic bill can mean savings of up to around £540 a year. Add smart thermostat control and properly balanced radiators and the efficiency gain is greater still. We’ll give you a realistic projection based on your current boiler and usage rather than a headline figure.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'Boiler Installation in Greater Manchester',
      metaDescription:
        'Premium boiler installation across Greater Manchester — Worcester Bosch Diamond & Vaillant accredited, 12-year warranties, 0% finance. Free fixed-price quote.',
    },
    {
      slug: 'emergency-plumbing-repairs',
      name: 'Emergency Plumbing Repairs',
      h1: 'Emergency Plumbing Repairs in Greater Manchester',
      icon: 'Siren',
      order: 20,
      summary:
        '24/7 rapid-response emergency plumbing and leak detection across Greater Manchester. Thermal imaging trace-and-access, under-60-minute average arrival, and a first-time fix rate over 95%.',
      overview: [
        'Emergency plumbing repairs across Greater Manchester and North Cheshire for burst pipes, sudden leaks and total breakdowns in [Sale](/areas/sale), Altrincham, Didsbury, Stockport and the wider service area. A burst pipe or a ceiling dripping at 9pm on a Sunday is exactly the kind of call we keep dedicated rapid-response slots open for — we maintain an under-one-hour emergency arrival average across our core postcodes thanks to strategic local vehicle placement, not a national call-centre handing your job to whoever happens to be nearest.',
        'Every emergency engineer who arrives is our own full-time, NVQ Level 3 trace-and-access technician — never an un-vetted subcontracted handyman. They use high-end acoustic listening sticks and Flir thermal imaging to pinpoint hidden burst lines behind plasterwork or under floorboards precisely, so we can cut a small access hatch rather than blindly tearing down drywall or ruining expensive flooring. The aim is always to minimise the structural water damage to ceilings and timber while getting the leak stopped fast.',
        'Our live-tracked workshop vans carry an extensive inventory of premium commercial-grade brassware, copper, MDPE, compression seals and replacement valves, which is how we achieve a first-time fix rate exceeding 95% — failed zone valves, burst pipes, seized stopcocks and ruptured appliance hoses are usually permanently repaired on the spot. After the repair we sanitise, moisture-check and dry down the affected area. If the underlying cause points to an ageing system, we can advise on a [boiler or heating upgrade](/services/boiler-installation-heating-upgrades). Gas Safe registered, transparent flat-rate pricing, no hidden call-out travel fees.',
      ],
      whatsIncluded: [
        [
          'Priority dispatch, live-tracked vans',
          'Immediate priority dispatch of a fully qualified NVQ Level 3 technician in a modern, live-tracked mobile workshop van — you get an SMS with a GPS tracking link showing the engineer’s location and real-time ETA, typically under 60 minutes.',
        ],
        [
          'Non-invasive leak detection',
          'Hidden burst lines behind plaster or under floorboards traced with high-end acoustic listening sticks and Flir thermal imaging diagnostics, so we find the breach precisely instead of guessing and opening up half the room.',
        ],
        [
          'Trace, access and minimal damage',
          'Trace-and-access protocols designed to minimise structural water damage to ceilings and timber frameworks — a small targeted access hatch wherever possible rather than ripping out drywall or flooring to reach the fault.',
        ],
        [
          'Rapid component replacement',
          'On-the-spot replacement of failed internal zone valves, burst copper and MDPE pipelines, seized main stopcocks and ruptured appliance flexible hoses, using premium commercial-grade stock carried on every van.',
        ],
        [
          'Post-repair sanitisation and dry-down',
          'After the leak is stopped, the affected area is sanitised, moisture-checked and locally dried down — whether it was a clean mains leak or grey wastewater — so you’re not left with a damp, contaminated space once we leave.',
        ],
        [
          'Transparent flat-rate pricing',
          'A clear flat diagnostic rate that includes the first hour of on-site labour, explained before any work starts and any floorboards come up — no hidden call-out travel fees and no surprise bills tacked on at the end.',
        ],
      ],
      pricingIndication:
        'Daytime call-outs (Mon–Fri 8am–5pm) £85 flat including the first hour; out-of-hours and weekend £140. No hidden call-out travel fees.',
      steps: [
        [
          'Phone',
          'Emergency intake call',
          'Call our 24/7 priority line. The team assesses the severity over the phone and talks you calmly through finding and shutting off your main stopcock to limit further damage while help is on the way.',
        ],
        [
          'Truck',
          'Rapid dispatch',
          'An emergency engineer is instantly assigned, and you get an automated SMS with a live GPS tracking link showing the technician’s exact location and real-time ETA — typically under 60 minutes across our core postcodes.',
        ],
        [
          'Search',
          'Diagnostics & containment',
          'On arrival the engineer uses thermal imaging and acoustic tooling to locate the breach, then explains the failure and gives you a transparent flat-rate repair cost before turning a single wrench or lifting any floorboards.',
        ],
        [
          'BadgeCheck',
          'Instant resolution',
          'The leak is permanently repaired on the spot from the premium stock carried on the van, giving a first-time fix rate over 95%, and the affected area is sanitised and dried down before we go.',
        ],
      ],
      faqs: [
        [
          'How quickly can you arrive if a pipe has burst?',
          'We consistently maintain an under-one-hour emergency arrival average across our core Greater Manchester and Cheshire postcodes, thanks to keeping engineers strategically placed locally rather than dispatching from a single depot. The moment your call comes in, an engineer is assigned and you receive an SMS with a live GPS tracking link showing exactly where they are and their real-time ETA, so you’re never left wondering when help will turn up.',
        ],
        [
          'What should I do while waiting for the plumber?',
          'Locate your main incoming stopcock — usually under the kitchen sink, in a hallway cupboard or under the stairs — and turn it firmly clockwise to isolate the mains. Then turn the kitchen cold tap on fully to drain the remaining pressure out of the pipework, and place towels or buckets under any visible ceiling leak to catch the drips. Our office team will talk you through all of this calmly on the phone while the engineer is on the way.',
        ],
        [
          'Will you charge a huge fee if the leak turns out to be minor?',
          'No. We charge our transparent, standard flat diagnostic fee — and if the issue is fixed within the first hour using standard parts carried on the van, you pay nothing more than that baseline fee. There are no hidden call-out travel charges and no inflated emergency mark-ups bolted on at the end. You’ll always know the flat rate before the engineer starts work, so there are no surprises on the invoice.',
        ],
        [
          'Do you use your own engineers or subcontractors?',
          'Always our own. Unlike national emergency networks that deploy un-vetted, subcontracted handyman labour, every emergency engineer we send is a full-time, directly employed trace-and-access specialist. They carry state-of-the-art thermal imaging gear to pinpoint structural pipe breaches precisely, which means we can avoid blindly tearing down your drywall or ruining expensive flooring just to reach the fault. You get a properly trained heating engineer, not whoever was cheapest to subcontract.',
        ],
        [
          'Do you cover evenings, weekends and bank holidays?',
          'Yes — our emergency line runs 24/7, 365 days a year, including evenings, weekends and bank holidays. Out-of-hours and weekend call-outs are charged at a clear flat rate of £140 (versus £85 in standard daytime hours), with the first hour of labour included and no hidden travel fees. We keep dedicated rapid-response slots open every day specifically so genuine emergencies aren’t left waiting behind planned work.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'Emergency Plumber in Greater Manchester',
      metaDescription:
        '24/7 emergency plumbing across Greater Manchester — thermal imaging leak detection, under-60-minute arrival, 95%+ first-time fix. Flat-rate pricing.',
    },
    {
      slug: 'bathroom-design-renovation',
      name: 'Luxury Bathroom Design & Renovation',
      h1: 'Luxury Bathroom Renovation in Greater Manchester',
      icon: 'Bath',
      order: 30,
      summary:
        'Complete turn-key luxury bathroom design and renovation across Greater Manchester — 3D CAD planning, structural work, tanking and tiling. One in-house team, single point of accountability.',
      overview: [
        'Luxury bathroom design and complete renovation across Greater Manchester and North Cheshire for homeowners in [Knutsford](/areas/knutsford), Altrincham, Wilmslow, Bramhall and the wider service area. From bespoke walk-in wet rooms to full family bathroom transformations, we handle the entire project lifecycle in-house — plumbers, master tilers and certified electricians on one accountable team — so you never have to coordinate independent contractors or chase missing tradespeople.',
        'Every project starts with bespoke 3D CAD layout planning and an ergonomic space survey to optimise product placement, lighting angles and traffic flow before anything is ordered. The build itself is done properly: careful strip-out and licensed disposal of old sanitaryware and tiling, first-fix plumbing reconstruction (upgrading ancient lead waste traps, re-running soil pipes, chasing in concealed copper supplies), and structural subfloor reinforcement where a freestanding stone bath or large walk-in shower tray needs it.',
        'We use premium multi-stage Schlüter-Systems waterproof tanking membranes, expert plastering, high-end tile setting and digital electric underfloor heating before the second-fix luxury sanitaryware goes in — concealed wall-hung cisterns, floating vanity furniture and digital rainfall shower arrays. Once our team starts inside your home they stay every consecutive working day until the job is finished; we don’t jump between sites. Handover is a clinical-grade deep clean, a millimetre-by-millimetre grout inspection and a pressure test of every concealed seal alongside you. Pair it with [underfloor heating](/services/underfloor-heating-installation) for a warm floor underfoot. Gas Safe registered, free design consultations, 24-month workmanship guarantee.',
      ],
      whatsIncluded: [
        [
          'Bespoke 3D CAD design',
          'Bespoke 3D CAD digital layout planning and an ergonomic space optimisation survey to maximise product placement, lighting angles and traffic flow — so you see exactly how the finished bathroom works before a single tile is ordered.',
        ],
        [
          'Full strip-out and ethical disposal',
          'Comprehensive strip-out, careful structural extraction and fully licensed, ethical environmental disposal of all old sanitaryware, tiling matrices and subfloor materials — nothing left in your garden or driveway for you to clear.',
        ],
        [
          'First-fix plumbing reconstruction',
          'First-fix mechanical plumbing rebuilt properly — upgrading ancient lead waste traps, re-running soil pipes and chasing clean concealed hot and cold copper supply lines — rather than patching new fittings onto tired, failing pipework.',
        ],
        [
          'Structural subfloor reinforcement',
          'Subfloor reinforcement framing to safely carry heavy high-end freestanding natural stone baths or large slate walk-in shower trays, so the finished floor is dead-level, solid underfoot and built to take the load for years.',
        ],
        [
          'Premium tanking and tiling',
          'Multi-stage Schlüter-Systems waterproof tanking membranes, expert plastering, high-end tile setting and digital electric underfloor heating grids — a fully waterproofed, warm, precisely aligned finish rather than a tile-and-hope job.',
        ],
        [
          'Luxury second-fix sanitaryware',
          'Second-fix installation of concealed geometric wall-hung cistern frameworks, floating vanity furniture and premium digital rainfall shower matrix arrays — the visible luxury finish, installed and sealed to last.',
        ],
        [
          'One in-house team, one point of contact',
          'Plumbers, master tilers and certified electricians all on our own in-house team, so you get a single point of absolute accountability and never have to coordinate or chase separate trades through the project.',
        ],
        [
          'Clinical handover and pressure testing',
          'A clinical-grade final deep clean, a millimetre-by-millimetre inspection of every grout line and a rigorous pressure test of every concealed plumbing seal, walked through alongside you to guarantee everything is right before sign-off.',
        ],
      ],
      pricingIndication:
        'Complete turn-key bathroom and wet-room renovations typically £6,500 to £14,000+, depending on finish, stone and structural work. Free design consultation.',
      steps: [
        [
          'Phone',
          'Design consultation',
          'We meet at your home to review the space, document your visual requirements, evaluate current water pressure and browse premium brassware and stone catalogues together to shape the design around how you actually live.',
        ],
        [
          'Ruler',
          '3D visuals & granular costing',
          'You receive scale-accurate 3D layouts alongside a detailed, line-by-line schedule of works covering masonry, plumbing, tiling, electrical and finish materials — so every pound is accounted for before work begins.',
        ],
        [
          'ClipboardList',
          'Dedicated execution phase',
          'Our multi-trade team works to a strict project schedule and stays on your bathroom every consecutive working day until it’s complete. We don’t split the crew across multiple active jobsites.',
        ],
        [
          'BadgeCheck',
          'Handover & quality sign-off',
          'A clinical-grade deep clean, a millimetre-by-millimetre grout inspection and a pressure test of every concealed seal, all walked through alongside you to guarantee the finished bathroom is exactly right.',
        ],
      ],
      faqs: [
        [
          'Will my family be without a toilet during a bathroom renovation?',
          'No. We prioritise your day-to-day comfort throughout the project. Where it’s the only bathroom in the home, our engineers make sure a functioning toilet is safely and securely hooked up temporarily at the close of every single working day before we leave site. We plan the sequence of works specifically so you’re never left without basic facilities overnight, and we talk through exactly what’s usable at each stage at the design consultation.',
        ],
        [
          'Do you supply the suites and tiles, or can I source my own?',
          'Either works — we offer complete flexibility. We can pass our long-standing trade discounts at premium regional merchants directly to you, which often saves more than enough to offset our involvement, or we’re perfectly happy to install high-end suites and tiles you’ve sourced independently. Many clients do a mix: trade-sourced sanitaryware and brassware with a statement tile they found themselves. We’ll advise on quantities and suitability either way.',
        ],
        [
          'How long does a full bathroom renovation take?',
          'A standard high-finish domestic bathroom takes 10 to 14 consecutive working days, from the initial structural rip-out through to the final application of antifungal silicone sealant. Larger wet rooms, projects needing structural subfloor reinforcement, or jobs with bespoke stone and complex tiling can run a little longer. Because our team stays on your project every working day rather than disappearing to other sites, the timeline is continuous and predictable rather than dragging out over weeks.',
        ],
        [
          'Do you handle the electrics, tiling and plumbing yourselves?',
          'Yes — that’s the core of what makes us different. We control the entire project with our own in-house team of plumbers, master tilers and certified electricians. You never experience the stress of coordinating separate contractors, waiting on a tiler who’s overrunning on another job, or chasing an electrician to come and finish off. One team, one schedule, one point of absolute accountability from design through to the final pressure test.',
        ],
        [
          'Is your bathroom work guaranteed?',
          'Yes. All our internal plumbing alterations, structural joints, tiling alignment and sanitary sealing are covered by a rock-solid 24-month craftsmanship guarantee. If anything related to our workmanship fails or leaks within that period, we return and put it right at no cost — no quibbling and no call-out fees. We also pressure-test every concealed seal alongside you at handover, so issues are caught before we leave rather than discovered months later.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'Luxury Bathroom Renovation, Greater Manchester',
      metaDescription:
        'Complete luxury bathroom design and renovation across Greater Manchester — 3D CAD, in-house tilers, plumbers and electricians. 24-month guarantee.',
    },
    {
      slug: 'gas-safety-certificates-boiler-servicing',
      name: 'Gas Safety Certificates & Boiler Servicing',
      h1: 'Gas Safety Certificates & Boiler Servicing',
      icon: 'ShieldCheck',
      order: 40,
      summary:
        'Landlord CP12 gas safety certificates and deep 15-point annual boiler servicing across Greater Manchester. Instant digital certification, lifetime reminders, and a genuine component-level service.',
      overview: [
        'Gas safety certificates and annual boiler servicing across Greater Manchester and North Cheshire for homeowners and landlords in [Didsbury](/areas/didsbury), Altrincham, Stockport, Cheadle and the wider service area. Around a third of this work comes from the rental sector — letting agents and landlords who need a compliant CP12 certificate every 12 months — alongside homeowners keeping their manufacturer warranty valid and their heating running safely and efficiently.',
        'A Vanguard service is a genuine, detailed, component-level deep service — not the "quick ten-minute wipe down and go" many low-cost competitors offer. Our Gas Safe engineer strips down the boiler’s combustion chamber, burner assembly and primary heat exchanger, runs an electronic flue gas analysis to measure carbon monoxide emissions and burn ratios, carries out a certified gas tightness test across the property pipework, and checks every integrated safety device — expansion vessels, pressure relief valves, automatic air vents and thermocouple cut-outs.',
        'For landlords, a comprehensive digital CP12 certificate is generated on site and emailed instantly to both you and your managing agent, and every client is enrolled in our lifetime email and SMS reminder calendar so a warranty condition or legal compliance deadline never quietly lapses. Engineers arrive in clean uniform and boot covers, and the whole visit takes 45 to 60 minutes against a manufacturer-specified checklist. If a fault is found, it’s explained with the live diagnostic reading and quoted upfront. Considering a [new boiler](/services/boiler-installation-heating-upgrades) instead? We’ll tell you honestly when a service is enough. Gas Safe registered, fixed-rate pricing.',
      ],
      whatsIncluded: [
        [
          'Component-level combustion inspection',
          'A complete physical strip-down inspection of the boiler’s internal combustion chamber, burner assembly matrix and primary heat exchanger surfaces — the real deep-service work, not a quick external wipe-down and a sticker.',
        ],
        [
          'Electronic flue gas analysis',
          'Advanced electronic flue gas analyser testing to measure carbon monoxide emissions in parts per million, gas-to-air burn ratios and overall operational efficiency, so the boiler is verified safe and running as the manufacturer intended.',
        ],
        [
          'Certified gas tightness test',
          'A certified gas tightness test across the property’s entire pipework infrastructure to confirm zero micro-leaks exist — a core safety check that protects your household from the slow, odourless build-up of escaping gas.',
        ],
        [
          'Full safety-device testing',
          'Comprehensive evaluation of every integrated safety mechanism — expansion vessels, pressure relief valves, automatic air vents and thermocouple cut-outs — so the systems designed to shut the boiler down in a fault are all proven to work.',
        ],
        [
          'Instant digital CP12 for landlords',
          'For landlords, a comprehensive digital CP12 Gas Safety Certificate generated on site and emailed instantly to both you and your managing letting agent — compliance evidence in your inbox before the engineer has left the driveway.',
        ],
        [
          'Lifetime reminder scheduling',
          'Automatic enrolment in our lifetime annual email and SMS reminder calendar, so your manufacturer warranty conditions and legal landlord compliance deadlines never quietly lapse and you never get caught out by a missed renewal.',
        ],
      ],
      pricingIndication:
        'Domestic boiler service £85 fixed; Landlord CP12 (up to two appliances) £95; combined service + certificate package £135. Fixed-rate, no hidden fees.',
      steps: [
        [
          'Phone',
          'Seamless scheduling',
          'Choose a precise morning or afternoon appointment window to suit your schedule via our online booking portal or a quick call to the office — no all-day waiting around for the engineer to turn up.',
        ],
        [
          'ClipboardList',
          '15-point inspection visit',
          'Our engineer arrives in clean uniform and protective boot covers and spends 45 to 60 minutes running a rigorous, manufacturer-specified diagnostic checklist across your appliance, stripping and cleaning internal components.',
        ],
        [
          'FileText',
          'Instant compliance certification',
          'All pressure ratings, gas combustion analysis and safety notes are compiled into a validated digital PDF generated on site and synced straight to your email inbox — and your managing agent’s too, for landlord jobs.',
        ],
        [
          'BadgeCheck',
          'Lifetime reminder enrolment',
          'You’re enrolled in our lifetime email and SMS reminder calendar so next year’s service or certificate renewal is booked in good time, keeping your warranty valid and your compliance deadlines safely met.',
        ],
      ],
      faqs: [
        [
          'Why service my boiler every year if it seems to be working fine?',
          'An annual service is usually a strict condition of your 10-to-12-year manufacturer warranty — miss one and the warranty can be invalidated, leaving you exposed to the full cost of any future failure. More importantly, a service catches hidden faults like a cracked heat exchanger that can slowly leak deadly, completely odourless carbon monoxide into your home. A boiler that "seems fine" can still be developing a serious safety or efficiency problem you simply can’t see from the outside.',
        ],
        [
          'What happens if my boiler fails a safety test during the service?',
          'If we identify a critical defect, we explain the hazard clearly, show you the live diagnostic reading on our electronic instrumentation so you can see exactly what we’ve found, and present an upfront, fixed-rate quote to resolve it safely — often the same day. We never use a failed test as a scare tactic to push an unnecessary new boiler. If the fault is genuinely repairable and the boiler is otherwise sound, we’ll tell you, and we’ll only recommend replacement when it’s the honest call.',
        ],
        [
          'As a landlord, what are my legal gas safety obligations?',
          'Under the Gas Safety (Installation and Use) Regulations 1998, UK landlords must have a CP12 gas safety check carried out by a Gas Safe registered engineer every 12 months on any gas appliance in a residential rental property, and must provide a copy of the certificate to tenants. We make this straightforward: a digital CP12 emailed to you and your managing agent the moment the check passes, plus automatic annual reminders so the renewal never slips and you stay compliant year after year.',
        ],
        [
          'What does your service actually include?',
          'A genuine component-level deep service. We strip down and inspect the combustion chamber, burner and heat exchanger, run an electronic flue gas analysis, carry out a certified gas tightness test across the pipework, and test every safety device. We clean internal components to restore efficiency rather than just checking the boiler fires up. The whole visit takes 45 to 60 minutes against a manufacturer-specified checklist — a world away from the ten-minute wipe-down some lower-cost outfits pass off as a service.',
        ],
        [
          'Can I combine a service and a landlord certificate?',
          'Yes — and it works out better value. Our combined annual service and landlord CP12 certificate package is £135, against £85 for a standalone service and £95 for a standalone CP12. Doing both in one visit means a single appointment, a single trip and a single piece of disruption for your tenant, with both the service record and the compliance certificate emailed to you and your agent on the day. Most of our landlord clients take the combined package for exactly that reason.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'Gas Safety Certificates & Boiler Servicing',
      metaDescription:
        'Landlord CP12 certificates and deep annual boiler servicing across Greater Manchester. Instant digital certs, lifetime reminders, fixed-rate pricing.',
    },
    {
      slug: 'power-flushing-system-clean',
      name: 'Power Flushing & System Deep Clean',
      h1: 'Power Flushing in Greater Manchester',
      icon: 'Droplet',
      order: 50,
      summary:
        'Industrial-grade power flushing and central heating deep cleans across Greater Manchester. Magnetic filtration, manual radiator agitation, and a thermal before-and-after report — without replacing your boiler.',
      overview: [
        'Power flushing and central heating system deep cleans across Greater Manchester and North Cheshire for homeowners and landlords in [Sale](/areas/sale), Altrincham, Chorlton, Cheadle and the wider service area. Cold patches at the bottom of radiators, frequent bleeding, a kettling boiler and lukewarm output are all classic symptoms of magnetite sludge and limescale clogging the system — and a proper power flush often restores full performance without the cost of a new boiler.',
        'Unlike companies that treat a flush as a quick "plug-and-play" upsell, we run a genuine all-day deep clean. Every job starts with a thermal-imaging diagnostic to map cold spots and confirm a flush is actually the right fix rather than radiator or pipe replacement. We then connect an industrial-grade Kamco CF90 (or equivalent) high-velocity pump and drive pulsed water and chemical cleaning agents through every radiator and pipe circuit, reversing direction every few minutes to break up compacted debris.',
        'Crucially, every radiator is manually agitated and reverse-flushed to dislodge stubborn magnetite and iron oxide, with in-line magnetic filtration capturing ferrous debris throughout the process before it can re-enter the system. Once the water runs clear we dose with premium Fernox or Sentinel inhibitor to protect against corrosion for at least five years, then rebalance every radiator for even heat and hand you a thermal before-and-after report showing the improvement. A power flush is included free with every [boiler installation](/services/boiler-installation-heating-upgrades). And if a flush won’t fix your cold spots, we’ll tell you honestly rather than hide behind the process. Gas Safe registered, flat-rate pricing.',
      ],
      whatsIncluded: [
        [
          'Thermal-imaging pre-flush diagnostic',
          'A pre-flush assessment using thermal imaging to identify cold spots, radiator sludge build-up and circulation bottlenecks before a single pipe is disconnected — so we confirm a flush is genuinely the right fix, not a guess.',
        ],
        [
          'Industrial-grade high-velocity flush',
          'Industrial Kamco CF90 (or equivalent) pump flushing that delivers pulsed water and chemical cleaning agents through every radiator and pipe circuit, reversing direction regularly to agitate and lift even stubborn, compacted deposits.',
        ],
        [
          'Manual radiator agitation',
          'Every single radiator in the property is manually vibrated and reverse-flushed to dislodge compacted magnetite, iron oxide and limescale — the labour-intensive step that separates a genuine deep clean from a quick plug-and-play flush.',
        ],
        [
          'In-line magnetic filtration',
          'Magnetic filtration runs throughout the flush to capture and remove ferrous debris as it’s dislodged, before it can simply recirculate and re-settle elsewhere in the system once the pump is disconnected.',
        ],
        [
          'Long-life inhibitor dosing',
          'Post-flush chemical inhibition with premium Fernox or Sentinel inhibitor to protect the whole system against future corrosion for a minimum of five years, plus biocide to prevent bacterial growth in the cleaned circuit.',
        ],
        [
          'Full system rebalancing',
          'Every radiator lockshield valve is adjusted and each radiator temperature-checked with a digital thermometer to ensure even heat distribution across all rooms once the flush is complete, so warmth is balanced not concentrated.',
        ],
        [
          'Thermal before-and-after report',
          'A thermal-imaging before-and-after comparison handed to you at the end, showing previously blocked, cold radiators now flowing and heating evenly — clear visual proof of the difference the flush has made.',
        ],
      ],
      pricingIndication:
        'Up to 10 radiators £495 flat; 11–15 radiators £595; 16+ on survey. Includes chemicals, magnetic filtration and inhibitor. Free with every boiler installation.',
      steps: [
        [
          'Search',
          'Pre-inspection',
          'Our engineer surveys the heating system, measures the extent of the cold spots with thermal imaging and confirms whether a power flush is the right fix — versus replacing radiators or sections of pipework.',
        ],
        [
          'Ruler',
          'System connection',
          'We connect the power flushing rig to your central heating circuit, typically via the pump connections or a radiator valve, isolating the rest of the system so the cleaning agents are driven exactly where they’re needed.',
        ],
        [
          'Sparkles',
          'Deep clean cycle',
          'Heated water mixed with specialist chemical cleaners is pumped through every radiator and pipe run at high velocity, reversing direction every few minutes, while each radiator is manually agitated to break up stubborn debris.',
        ],
        [
          'BadgeCheck',
          'Final flush, dose & rebalance',
          'The system is flushed until it runs clear, dosed with long-life inhibitor, then every radiator is temperature-checked and balanced for even output, with a thermal before-and-after report provided at handover.',
        ],
      ],
      faqs: [
        [
          'How do I know if my system needs a power flush?',
          'The telltale signs are cold patches at the bottom of radiators, radiators that need bleeding constantly, a noisy "kettling" boiler, lukewarm water from the hot taps, and dark, dirty water when you bleed a radiator. Any of these point to magnetite sludge and limescale restricting flow through the system. Rather than guessing, we offer a free thermal-imaging diagnostic survey to map your cold spots and confirm whether a flush is genuinely the right fix before we quote a penny.',
        ],
        [
          'Is a power flush safe for older pipework?',
          'Yes. We use a controlled-pressure flushing process with a pressure relief valve set well below the safe operating limits of domestic copper and plastic plumbing, so your pipework is never over-stressed. The chemical cleaning agents are specifically formulated to dissolve magnetite sludge and limescale, not to attack pipe materials. We assess the condition of your system at the pre-flush inspection, and if anything is too fragile to flush safely we’ll tell you honestly and recommend the right alternative.',
        ],
        [
          'How long does it take, and will I be without heating?',
          'A thorough domestic power flush takes between four and six hours for a typical property. Your heating is off during the flush itself, but the system is re-commissioned, hot and fully balanced again by the time we leave the same day — you won’t be left without heating overnight. Larger properties with 16-plus radiators can run a little longer, which we confirm at the pre-inspection so you know exactly what to plan around on the day.',
        ],
        [
          'Can a power flush fix my noisy boiler?',
          'Often, yes. That "kettling" or banging noise is frequently caused by limescale and sludge building up on the heat exchanger, restricting water flow and causing localised boiling. A power flush clears that restriction and very often resolves the noise without needing a new boiler at all. We’ve rescued plenty of systems where other engineers had declared the boiler beyond saving. If the noise persists after a flush, we diagnose the real cause rather than simply selling you a replacement.',
        ],
        [
          'How is your flush different from a cheap one?',
          'We perform a genuine, all-day deep clean rather than a quick plug-and-play upsell. We manually agitate every radiator, run magnetic filtration throughout the entire process, and provide a thermal-imaging before-and-after comparison so you can see blocked radiators now flowing perfectly. And critically, if the flush doesn’t resolve your cold spots, we tell you honestly and recommend the right fix instead of hiding behind the process. You’re paying for a result, not just for the pump to be plugged in.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'Power Flushing in Greater Manchester',
      metaDescription:
        'Industrial power flushing and central heating deep cleans across Greater Manchester — magnetic filtration, manual agitation, thermal before-and-after report.',
    },
    {
      slug: 'underfloor-heating-installation',
      name: 'Underfloor Heating Design & Installation',
      h1: 'Underfloor Heating in Greater Manchester',
      icon: 'Thermometer',
      order: 60,
      summary:
        'Bespoke underfloor heating design and installation across Greater Manchester — overlay retrofit and in-screed new-build systems. Room-by-room heat loss design by in-house engineers, not the manufacturer.',
      overview: [
        'Underfloor heating design and installation across Greater Manchester and North Cheshire for homeowners in [Knutsford](/areas/knutsford), Wilmslow, Bramhall, Altrincham and the wider service area. Whether you’re fitting a wet in-screed system across a new kitchen extension or retrofitting a low-profile overlay into an existing room, every Vanguard installation is designed by our own in-house heating engineers — never by the product manufacturer’s generic, one-size-fits-all design service.',
        'It starts with a genuine room-by-room heat loss calculation following BS EN 12831 methodology, accounting for your specific window sizes, floor construction, insulation values and floor coverings to determine exact pipe spacing, flow temperature and manifold configuration. That detail is the difference between a floor that heats evenly at the lowest possible flow temperature — maximising boiler or heat pump efficiency — and a poorly specified system that runs hot and costs more to heat than it should.',
        'We install premium components from market leaders such as Uponor, Wunda and Polypipe, with thermal insulation and perimeter expansion foam, zoned manifolds with individual room actuators, and smart control (Nest, Hive or tado° multi-zone). Every circuit is pressure-tested at 6 bar for at least 24 hours before screed, with a signed certificate for building control, and we coordinate directly with your screed contractor so the pipes are protected during the pour. Second-fix commissioning tunes every flow meter to its calculated output. Pairs perfectly with a new [boiler or heating upgrade](/services/boiler-installation-heating-upgrades) or a [luxury bathroom](/services/bathroom-design-renovation). Gas Safe registered, fixed-price quotes.',
      ],
      whatsIncluded: [
        [
          'BS EN 12831 heat loss design',
          'A detailed room-by-room heat loss calculation following BS EN 12831 methodology to determine exact pipe spacing, flow temperature and manifold configuration for optimum comfort and efficiency — the engineering that makes the floor heat evenly.',
        ],
        [
          'Premium overlay or in-screed system',
          'Supply and installation of premium underfloor heating — low-profile overlay systems for retrofit or in-screed wet systems for new builds and extensions — from market-leading brands including Uponor, Wunda and Polypipe.',
        ],
        [
          'Insulation and expansion detailing',
          'Thermal insulation layers and edge-perimeter expansion foam installed to prevent downward heat loss and accommodate natural screed thermal expansion, so the heat goes up into the room and the screed can move without cracking.',
        ],
        [
          'Zoned manifold with smart control',
          'A manifold with individual zone actuators allowing independent temperature control for each room, via wall-mounted thermostats or integrated smart-home controls — Nest, Hive or tado° multi-zone — configured to your home.',
        ],
        [
          'Pressure testing and certification',
          'Every pipe circuit pressure-tested at 6 bar for a minimum of 24 hours before any screed is poured, with a signed test certificate provided for building control sign-off — proof the system is sound before it disappears under the floor.',
        ],
        [
          'Commissioning and balancing',
          'At second fix, the flow meters on the manifold are individually tuned to each circuit length to deliver precisely the calculated heat output to each zone, so every room reaches the right temperature at the most efficient flow.',
        ],
      ],
      pricingIndication:
        'New-build / extension in-screed systems (40–50 sqm) from £3,200; low-profile retrofit overlay from £1,800 per room. Includes heat loss design and certification.',
      steps: [
        [
          'ClipboardList',
          'Design survey',
          'We visit to measure room dimensions, floor construction, window sizes, insulation values and heat-source compatibility, then produce a full room-by-room heat loss report — the foundation the whole system is sized from.',
        ],
        [
          'Ruler',
          'System specification & quote',
          'You receive a detailed proposal: recommended system type (overlay vs in-screed), pipe layout diagrams, manifold location, thermostat positions and an all-inclusive fixed price with nothing left to estimate later.',
        ],
        [
          'Home',
          'First-fix installation',
          'Our team lays insulation boards, edge strips and pipe circuits at the calculated spacing, connects everything back to the manifold, then pressure-tests every circuit and leaves it under pressure through the screed work.',
        ],
        [
          'Sparkles',
          'Screed coordination',
          'We coordinate directly with your screed contractor or builder so the laid pipes are protected during the pour and the screed is the correct specification — typically a liquid flowing screed for maximum thermal conductivity.',
        ],
        [
          'BadgeCheck',
          'Second fix & commissioning',
          'Once the screed has cured we connect the manifold to your boiler or heat pump, install the thermostats and commission the whole system — adjusting flow rates, blending temperatures and programming your heating schedules.',
        ],
      ],
      faqs: [
        [
          'Can underfloor heating be retrofitted, or is it only for new builds?',
          'It can absolutely be retrofitted. We offer low-profile overlay systems that add as little as 15mm to your existing floor height, which makes retrofit viable in most renovation scenarios without major changes to door heights or floor levels. In-screed wet systems suit new builds and extensions where the floor is being laid from scratch. We assess your specific floor construction — suspended timber or solid concrete — during the design survey and recommend the right system for your situation.',
        ],
        [
          'Is underfloor heating compatible with my boiler or heat pump?',
          'Yes — modern condensing boilers and heat pumps are both excellent heat sources for underfloor heating. The key difference from radiators is flow temperature: underfloor systems run cooler, at around 35–45°C, which actually improves a condensing boiler’s efficiency and reduces gas consumption, and is ideally matched to how a heat pump likes to run. We confirm your heat-source compatibility at the design survey and size the system to get the best efficiency from whatever you already have or are planning to fit.',
        ],
        [
          'Does it work with wooden or carpeted floors?',
          'Yes, but the floor covering’s thermal resistance matters. Engineered wood, tile, stone and low-tog carpets all work well over underfloor heating. Thick shag-pile carpets with heavy underlay can insulate the floor and reduce the heat output reaching the room, so we factor your chosen floor covering into the heat loss calculations at the design stage. That way the system is sized correctly for the actual finish going down, rather than under-performing once the floor is laid.',
        ],
        [
          'How quickly does it heat up compared to radiators?',
          'Underfloor heating has higher thermal mass than radiators, so it heats up more gradually — typically 30 to 60 minutes to feel warmth at the floor surface. The trade-off is that it retains heat far longer and distributes it much more evenly across the whole room. That makes it ideally suited to well-insulated homes running on a steady, scheduled heating profile rather than rapid on-off cycling. We program the schedules at commissioning so the system warms the home ahead of when you actually need it.',
        ],
        [
          'Why design it in-house rather than using the manufacturer’s service?',
          'Because a generic, one-size-fits-all design can’t account for your specific home. Every Vanguard underfloor heating system is designed by our own in-house heating engineers with genuine room-by-room BS EN 12831 heat loss calculations that factor in your real window sizes, insulation and floor coverings. The result is a system that heats your rooms evenly at the lowest possible flow temperature — maximising boiler or heat pump efficiency and minimising your running costs for the entire life of the system, rather than just hitting a generic spec.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'Underfloor Heating in Greater Manchester',
      metaDescription:
        'Bespoke underfloor heating design and installation across Greater Manchester — overlay retrofit and in-screed systems, in-house BS EN 12831 heat loss design.',
    },
  ],

  // -------------------------------------------------------------------------
  // Areas
  // -------------------------------------------------------------------------
  areas: [
    {
      slug: 'altrincham',
      name: 'Altrincham',
      order: 10,
      geo: {latitude: 53.3831, longitude: -2.3534},
      intro: [
        'Plumbing and heating engineers covering Altrincham — home turf, and where Vanguard was founded from Thomas Vance’s kitchen table back in 2011. Altrincham is an affluent, historically rich suburb of large Victorian villas, sprawling Edwardian conversions and high-end modern developments, taking in the elite neighbourhoods of Bowdon, Hale and Hale Barns. We do frequent work down the private, un-adopted residential roads near Hale Downs, Stamford Park and the Dunham Massey estates.',
        'Across Altrincham, [luxury bathroom design and renovation](/services/bathroom-design-renovation) is one of our most popular services, alongside premium [boiler installations](/services/boiler-installation-heating-upgrades) with 12-year Worcester Bosch warranties, smart zoned heating upgrades, and high-pressure unvented hot water cylinders for the larger period and detached homes. The mix of grand period property and high-specification modern build means every job is sized and specified to the individual property rather than a one-size figure.',
        'Coverage spans the full WA14 and WA15 area with no travel charge, and as our base postcode, turnaround on surveys, planned installations and emergency call-outs is fastest here — we keep a tight 15-mile radius for under-60-minute emergency arrivals, with Altrincham right at the centre of it. Gas Safe registered, free fixed-price quotes, and 24/7 emergency cover for burst pipes and breakdowns.',
      ],
      coverageNote:
        'Covering Altrincham, Bowdon, Hale, Hale Barns, Broadheath and the surrounding WA14 and WA15 postcodes — including the Hale Downs, Stamford Park and Dunham Massey areas.',
      faqs: [
        [
          'Do you cover Hale and Bowdon?',
          'Yes — Hale, Hale Barns and Bowdon are part of standard coverage along with Altrincham town centre, Broadheath and the surrounding villages, with no travel charge across WA14 and WA15. We do a great deal of work down the private, un-adopted roads in the area, including high-specification bathroom renovations and unvented hot water systems for the larger period and detached homes around Hale Downs and the Dunham Massey estates.',
        ],
        [
          'How quickly can you reach me in an emergency in Altrincham?',
          'Altrincham is our base, so it sits right at the centre of our tight 15-mile rapid-response radius. We consistently maintain an under-60-minute average arrival for burst pipes, leaks and total breakdowns across the WA14 and WA15 postcodes. When you call our 24/7 line you’ll get an SMS with a live GPS tracking link showing the engineer’s location and real-time ETA, so you’re never left guessing.',
        ],
        [
          'Do you install high-pressure unvented systems in larger homes?',
          'Yes — the larger Bowdon, Hale and Hale Barns properties often need a high-pressure unvented hot water cylinder to supply strong, simultaneous hot water across multiple bathrooms. We design and install these as standard, sizing the system to your mains pressure, bathroom count and hot water demand, and handling all the G3 certification and building control notification that unvented systems require.',
        ],
        [
          'How quickly can you visit for a quote in Altrincham?',
          'Survey visits across Altrincham are usually possible within a few days of your enquiry, and as our home patch turnaround is fastest here. For installations and bathrooms you receive an itemised fixed-price quote within 24 hours of the survey. For planned work like boiler installs and bathroom renovations we’re typically booking two to three weeks ahead depending on scope.',
        ],
        [
          'Do you handle bathroom renovations and smart heating upgrades?',
          'Yes — Altrincham is one of our busiest areas for both. We deliver complete turn-key luxury bathroom renovations entirely in-house (plumbers, tilers and electricians on one team) and install smart zoned heating with Nest, Hive or tado° multi-zone control. Both are designed around the individual property at survey rather than offered as off-the-shelf packages.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and holds £5 million public liability and £10 million employers’ liability insurance. We are also Worcester Bosch Diamond Accredited and Vaillant Advance Master installers, which lets us register the longest manufacturer warranties available on new boiler installations across Altrincham and the wider area.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Altrincham',
      metaDescription:
        'Gas Safe plumber and heating engineer in Altrincham, Hale and Bowdon (WA14/WA15). Boilers, bathrooms, 24/7 emergencies. Free fixed-price quotes.',
    },
    {
      slug: 'sale',
      name: 'Sale',
      order: 20,
      geo: {latitude: 53.424, longitude: -2.322},
      intro: [
        'Plumbing and heating engineers covering Sale, Sale Moor, Brooklands and Ashton-on-Mersey — the full M33 area. Sale is a dense, vibrant residential hub mixing traditional 1930s semi-detached family homes with modern apartment developments near the town centre and Sale Water Park. There’s a strong demand here for combi boiler changeovers, radiator network modernisation and rapid emergency leak containment across the properties clustered along the Bridgewater Canal corridors and Brooklands Road.',
        'Across Sale, [boiler installation and heating upgrades](/services/boiler-installation-heating-upgrades) for the area’s 1930s semis is one of the most common jobs, often involving freeing up an airing cupboard by moving an old back boiler into a loft-mounted combi. [Emergency plumbing repairs](/services/emergency-plumbing-repairs) are frequent too, given the older pipework in many of the period properties, and we handle plenty of radiator modernisation and [power flushing](/services/power-flushing-system-clean) on tired central heating systems that have stopped heating evenly.',
        'Coverage spans the full M33 postcodes with no travel charge, and Sale sits well within our tight 15-mile rapid-response radius — so under-60-minute emergency arrival is the norm for burst pipes and breakdowns. Gas Safe registered, free fixed-price quotes, 0% finance on boiler installations, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Sale, Sale Moor, Brooklands and Ashton-on-Mersey and the wider M33 postcodes — including the Bridgewater Canal corridor, Brooklands Road and the Sale Water Park area.',
      faqs: [
        [
          'Do you cover Sale Moor and Brooklands?',
          'Yes — Sale Moor (M33 5) and Brooklands (M33 3) are both part of standard coverage along with Sale town centre and Ashton-on-Mersey, with no travel charge across the M33 postcodes. We do a lot of combi boiler changeovers and radiator modernisation across the 1930s semis here, plus emergency leak work along the older properties near the Bridgewater Canal corridors and Brooklands Road.',
        ],
        [
          'How quickly can you reach me in a plumbing emergency in Sale?',
          'Sale sits comfortably inside our tight 15-mile rapid-response radius, so we consistently maintain an under-60-minute average arrival for burst pipes, leaks and total breakdowns across the M33 postcodes. Our 24/7 line is answered by people who’ll talk you through shutting off your stopcock, and you’ll get an SMS with a live GPS tracking link showing your engineer’s real-time location and ETA.',
        ],
        [
          'Can you move my old back boiler and free up the airing cupboard?',
          'Yes — this is one of our most popular Sale jobs. We regularly remove old gravity-fed or back-boiler systems from the 1930s semis and install a modern, high-efficiency combi (often loft-mounted), which frees up the airing cupboard and removes redundant tanks. Every conversion includes a full power flush, MagnaClean filter and smart thermostat, with all building control and Gas Safe notification handled for you.',
        ],
        [
          'How quickly can you visit for a quote in Sale?',
          'Survey visits across Sale are usually possible within a few days of your enquiry, with an itemised fixed-price quote following within 24 hours for installation work. For planned jobs like boiler swaps and radiator modernisation we’re typically booking two to three weeks ahead, while we keep dedicated daily slots open for genuine emergencies.',
        ],
        [
          'Do you work with Sale landlords and letting agents?',
          'Yes — around a third of our work comes from the rental sector, and Sale’s mix of apartments and family homes generates steady demand for landlord CP12 gas safety certificates, annual servicing and reactive repairs. We email the digital CP12 to you and your managing agent on the day, and enrol you in lifetime reminders so the annual renewal never lapses.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and carries £5 million public liability and £10 million employers’ liability insurance. As Worcester Bosch Diamond Accredited and Vaillant Advance Master installers we can register 12-year manufacturer warranties on new boilers fitted across Sale and the surrounding M33 area.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Sale',
      metaDescription:
        'Gas Safe plumber and heating engineer in Sale, Sale Moor and Brooklands (M33). Boiler swaps, emergency repairs, power flushing. Free fixed-price quotes.',
    },
    {
      slug: 'stretford',
      name: 'Stretford',
      order: 30,
      geo: {latitude: 53.448, longitude: -2.308},
      intro: [
        'Plumbing and heating engineers covering Stretford and the surrounding M32 postcodes. Stretford is a large, historic urban borough with a high volume of traditional Edwardian and mid-century brick terraced housing near Longford Park, Victoria Park and the Old Trafford stadium zones. The age of the housing stock means our most frequent projects here include historical lead supply pipe extractions, full central heating system conversions, and rapid landlord Gas Safety certificates (CP12) for the area’s expansive rental property portfolios.',
        'Across Stretford, [boiler installation and heating upgrades](/services/boiler-installation-heating-upgrades) — particularly full system conversions away from ageing open-vented setups — are a regular type of work, alongside steady [gas safety certificate and servicing](/services/gas-safety-certificates-boiler-servicing) demand from the local landlord and letting-agent market. Older properties also generate frequent [emergency plumbing](/services/emergency-plumbing-repairs) calls, where outdated lead and steel pipework has started to fail.',
        'Coverage spans the M32 postcodes with no travel charge, and Stretford sits within our tight 15-mile rapid-response radius for under-60-minute emergency arrivals. Gas Safe registered, free fixed-price quotes, instant digital CP12 certificates for landlords, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Stretford, Old Trafford, Firswood and the surrounding M32 postcodes — including the Longford Park, Victoria Park and Old Trafford stadium areas.',
      faqs: [
        [
          'Do you cover all of Stretford?',
          'Yes — central Stretford, Old Trafford, Firswood and the surrounding streets are all part of standard coverage across the M32 postcodes, with no travel charge. We do a great deal of work on the area’s Edwardian and mid-century terraces near Longford Park, Victoria Park and the Old Trafford stadium zones, including heating conversions, lead pipe replacement and landlord gas safety certificates.',
        ],
        [
          'Can you replace old lead supply pipes?',
          'Yes — lead supply pipe extraction is one of our most frequent Stretford jobs given the age of the housing stock. We replace old lead and failing steel mains and internal pipework with modern copper or MDPE, improving water quality, pressure and reliability. We can usually carry out the swap with minimal disruption, and we explain the work and the fixed price clearly before any floorboards come up.',
        ],
        [
          'Do you provide landlord CP12 gas safety certificates?',
          'Yes — Stretford has a large rental market and around a third of our work comes from landlords and letting agents. We provide CP12 gas safety certificates every 12 months as the law requires, emailing the digital certificate to you and your managing agent the moment the check passes. Every landlord client is enrolled in our lifetime reminder calendar so the annual renewal never slips.',
        ],
        [
          'How quickly can you reach me in an emergency in Stretford?',
          'Stretford is within our tight 15-mile rapid-response radius, so we consistently maintain an under-60-minute average arrival for burst pipes, leaks and breakdowns across the M32 area. Call our 24/7 line and you’ll get calm step-by-step guidance on shutting off your stopcock, plus an SMS with a live GPS tracking link showing the engineer’s real-time location and ETA.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and holds £5 million public liability and £10 million employers’ liability insurance. We never subcontract: every engineer who attends a Stretford property is a directly employed, fully qualified member of our own team, background-checked and Gas Safe registered.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Stretford',
      metaDescription:
        'Gas Safe plumber and heating engineer in Stretford and Old Trafford (M32). Heating conversions, lead pipe replacement, landlord CP12 certificates.',
    },
    {
      slug: 'urmston',
      name: 'Urmston',
      order: 40,
      geo: {latitude: 53.4477, longitude: -2.3527},
      intro: [
        'Plumbing and heating engineers covering Urmston, Flixton and Davyhulme — the M41 area. This is a family-centric residential market dominated by post-war semi-detached houses and large modern kitchen-diner extensions. It’s an incredibly active sector for complete multi-generation family [bathroom installations](/services/bathroom-design-renovation), kitchen first-fix structural plumbing for extensions, and annual [boiler servicing](/services/gas-safety-certificates-boiler-servicing) to protect complex multi-zone heating setups.',
        'Across Urmston, [emergency plumbing repairs](/services/emergency-plumbing-repairs) are a regular call — like the Sunday-evening burst pipe in a family kitchen our engineer Sam reached within 42 minutes — alongside combi boiler swaps and the kitchen and bathroom plumbing that comes with the area’s many extension projects. The mix of established family homes and modern extensions means we see the full cross-section of our services here.',
        'Coverage spans the M41 postcodes with no travel charge, and Urmston sits within our tight 15-mile rapid-response radius for under-60-minute emergency arrivals. Gas Safe registered, free fixed-price quotes, and 24/7 emergency cover for bursts, leaks and breakdowns every day of the year.',
      ],
      coverageNote:
        'Covering Urmston, Flixton and Davyhulme and the surrounding M41 postcodes — family homes, post-war semis and modern kitchen-diner extensions.',
      faqs: [
        [
          'Do you cover Flixton and Davyhulme?',
          'Yes — Flixton and Davyhulme are part of standard coverage along with Urmston town centre, with no travel charge across the M41 postcodes. The area’s post-war semis and modern extensions keep us busy with family bathroom installations, kitchen first-fix plumbing and annual boiler servicing, and we attend plenty of emergency call-outs across the area too.',
        ],
        [
          'Can you do the plumbing for my kitchen extension?',
          'Yes — kitchen first-fix structural plumbing for extensions is one of our most active Urmston jobs. We run new hot and cold supplies, waste and drainage for sinks, dishwashers and utility appliances, and integrate the extension into your existing heating — whether that means adding radiators or designing in [underfloor heating](/services/underfloor-heating-installation) for an open-plan kitchen-diner. Everything is coordinated around your builder’s programme.',
        ],
        [
          'How quickly can you reach me in an emergency in Urmston?',
          'Urmston is firmly within our tight 15-mile rapid-response radius. We had an engineer on a burst-pipe call in the M41 area within 42 minutes recently, and we consistently maintain an under-60-minute average arrival for bursts, leaks and breakdowns. Call our 24/7 line for calm guidance on shutting off your stopcock, and you’ll get an SMS with a live tracking link and real-time ETA.',
        ],
        [
          'Do you service multi-zone heating systems?',
          'Yes — many of the larger Urmston extensions run multi-zone heating, which needs proper annual servicing to keep the zone valves, controls and boiler working together correctly. Our deep, component-level service covers all of it, and we enrol you in lifetime reminders so the service is booked in good time each year to keep your manufacturer warranty valid.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and carries £5 million public liability and £10 million employers’ liability insurance. We use our own directly employed, background-checked engineers on every Urmston job, never subcontractors, so quality control is consistent from first fix to final sign-off.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Urmston',
      metaDescription:
        'Gas Safe plumber and heating engineer in Urmston, Flixton and Davyhulme (M41). Bathrooms, extension plumbing, boiler servicing, 24/7 emergencies.',
    },
    {
      slug: 'chorlton',
      name: 'Chorlton',
      order: 50,
      geo: {latitude: 53.4426, longitude: -2.2799},
      intro: [
        'Plumbing and heating engineers covering Chorlton and the M21 area. Chorlton is a progressive urban neighbourhood with a dense layout of large Victorian terraces, period multi-flat conversions and eco-conscious households near Beech Road and Chorlton Ees. There’s exceptionally high demand here for premium energy-saving heating controls, hydronic [underfloor heating](/services/underfloor-heating-installation) loops, and period-accurate, high-end architectural [bathroom restorations](/services/bathroom-design-renovation).',
        'Across Chorlton, the eco-minded local market means [power flushing](/services/power-flushing-system-clean) and efficiency-focused [boiler upgrades](/services/boiler-installation-heating-upgrades) come up constantly — including rescues of older Victorian systems where other engineers had wrongly declared the boiler beyond saving. We restored a 15-radiator Victorian system in Chorlton to full output with a full-day deep power flush, saving the owner over £2,500 on an unnecessary boiler replacement.',
        'Coverage spans the M21 postcodes with no travel charge, and Chorlton sits within our tight 15-mile rapid-response radius for under-60-minute emergency arrivals. Gas Safe registered, free fixed-price quotes, honest advice over upselling, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Chorlton, Chorlton-cum-Hardy and the surrounding M21 postcodes — including the Beech Road, Chorlton Ees and Chorlton Green areas.',
      faqs: [
        [
          'Do you cover all of Chorlton?',
          'Yes — Chorlton, Chorlton-cum-Hardy and the surrounding M21 streets are all part of standard coverage with no travel charge. The area’s large Victorian terraces and period conversions keep us busy with efficiency-focused heating upgrades, hydronic underfloor heating, power flushing and period-sensitive bathroom restorations near Beech Road, Chorlton Green and Chorlton Ees.',
        ],
        [
          'Can you fix cold radiators without replacing my boiler?',
          'Very often, yes — and this is exactly the kind of honest advice Chorlton clients come to us for. Cold radiators are usually caused by magnetite sludge restricting flow, not a failed boiler. A genuine full-day power flush with manual radiator agitation and magnetic filtration regularly restores full output. We rescued a 15-radiator Victorian system here that two other firms said needed a new boiler, saving the owner over £2,500.',
        ],
        [
          'Do you install energy-saving and smart heating controls?',
          'Yes — there’s strong demand for this in Chorlton’s eco-conscious households. We install smart, energy-saving heating controls (Nest, Hive and tado° multi-zone) and design hydronic underfloor heating loops that run at low flow temperatures for maximum efficiency. Every system is designed around your property to heat evenly at the lowest possible flow temperature, keeping running costs down.',
        ],
        [
          'How quickly can you reach me in an emergency in Chorlton?',
          'Chorlton is within our tight 15-mile rapid-response radius, so we consistently maintain an under-60-minute average arrival for burst pipes, leaks and breakdowns across the M21 area. Call our 24/7 line for calm guidance on isolating your mains, and you’ll get an SMS with a live GPS tracking link showing the engineer’s real-time location and ETA.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and holds £5 million public liability and £10 million employers’ liability insurance. We use only our own directly employed engineers across Chorlton, never subcontractors, and we give honest recommendations — telling you when a repair or flush will do rather than defaulting to the most expensive option.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Chorlton',
      metaDescription:
        'Gas Safe plumber and heating engineer in Chorlton (M21). Power flushing, efficient boiler upgrades, underfloor heating, period bathroom restorations.',
    },
    {
      slug: 'didsbury',
      name: 'Didsbury',
      order: 60,
      geo: {latitude: 53.413, longitude: -2.2314},
      intro: [
        'Plumbing and heating engineers covering Didsbury — an elite property market mixing premium conservation-area period homes in East Didsbury with busy urban professional apartment schemes in West Didsbury, around Burton Road and Marie Louise Gardens. We frequently carry out premium Worcester Bosch [boiler installations](/services/boiler-installation-heating-upgrades) with long-term 12-year warranties, custom designer vertical radiator fittings, and complex multi-bathroom pressure balancing across the M20 area.',
        'Across Didsbury, the high-value period and apartment stock generates steady demand for [emergency plumbing and leak detection](/services/emergency-plumbing-repairs) — we resolved a hallway-ceiling leak here that two other firms couldn’t trace without smashing through a bathroom floor, using thermal imaging to pinpoint a pinhole leak inside a stud wall and cutting a tiny 10cm access hatch. Designer radiators, smart heating and high-end [bathroom renovations](/services/bathroom-design-renovation) round out the typical Didsbury workload.',
        'Coverage spans the full M20 postcodes with no travel charge, and Didsbury sits within our tight 15-mile rapid-response radius for under-60-minute emergency arrivals. Gas Safe registered, Worcester Bosch Diamond Accredited, free fixed-price quotes, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Didsbury Village, West Didsbury, East Didsbury and the wider M20 postcodes — including Burton Road, Wilmslow Road, Barlow Moor Road and Marie Louise Gardens.',
      faqs: [
        [
          'Do you cover all of Didsbury?',
          'Yes — West Didsbury, East Didsbury, the Village and the surrounding M20 streets are all part of standard coverage with no travel charge. We do a great deal of premium work here, from Worcester Bosch boiler installations with 12-year warranties and designer vertical radiators in the apartment schemes around Burton Road, to multi-bathroom pressure balancing in the larger East Didsbury conservation-area homes.',
        ],
        [
          'Can you find a hidden leak without ripping out my bathroom?',
          'Yes — this is exactly what our trace-and-access service is built for. We use Flir thermal imaging and acoustic detection to pinpoint hidden leaks precisely. We resolved a Didsbury hallway-ceiling leak that two other companies couldn’t find without wanting to smash through the master bathroom floor — we located a pinhole leak inside a stud partition and cut a tiny 10cm access hatch to repair it without ruining the room.',
        ],
        [
          'Do you install designer radiators and smart heating?',
          'Yes — custom designer vertical radiators and smart heating controls are popular in Didsbury’s period homes and professional apartments. We size and install statement radiators to deliver the right heat output for the room, and configure Nest, Hive or tado° multi-zone control to your phone. For larger homes we also handle the multi-bathroom pressure balancing that simultaneous hot water demand requires.',
        ],
        [
          'How quickly can you reach me in an emergency in Didsbury?',
          'Didsbury is within our tight 15-mile rapid-response radius, so we consistently maintain an under-60-minute average arrival for burst pipes, leaks and breakdowns across the M20 area. Call our 24/7 line for calm step-by-step guidance on shutting off your stopcock, and you’ll get an SMS with a live GPS tracking link showing the engineer’s real-time location and ETA.',
        ],
        [
          'Do you work with Didsbury landlords and apartment managers?',
          'Yes — Didsbury’s many professional and student apartments generate steady landlord work, and around a third of our jobs come from the rental sector. We provide annual CP12 gas safety certificates emailed instantly to you and your managing agent, plus reactive repairs and servicing, with lifetime reminders so the legal renewal never lapses.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and carries £5 million public liability and £10 million employers’ liability insurance. As Worcester Bosch Diamond Accredited installers we can register the exclusive 12-year manufacturer warranties that make us a popular choice for premium boiler installations across Didsbury.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Didsbury',
      metaDescription:
        'Gas Safe plumber and heating engineer in Didsbury (M20). Worcester Bosch boilers, thermal-imaging leak detection, designer radiators. Free quotes.',
    },
    {
      slug: 'stockport',
      name: 'Stockport',
      order: 70,
      geo: {latitude: 53.4106, longitude: -2.1575},
      intro: [
        'Plumbing and heating engineers covering Stockport and the surrounding postcodes. Stockport is a massive, geographically diverse borough encompassing traditional red-brick terraced developments, steep valley properties and historic mill conversions near the iconic railway viaduct and Edgeley Park. That variety drives a high frequency of [emergency call-outs](/services/emergency-plumbing-repairs), commercial-scale domestic boiler diagnostic repairs, and structural drainage line interventions.',
        'Across Stockport, the older terraced and valley housing keeps us busy with [boiler installations and heating upgrades](/services/boiler-installation-heating-upgrades) and [power flushing](/services/power-flushing-system-clean) of tired systems, while the density of rental property generates steady [gas safety certificate](/services/gas-safety-certificates-boiler-servicing) work for local landlords. The mix of property ages and layouts means every job is properly surveyed and sized rather than quoted from a generic figure.',
        'Coverage spans the Stockport SK postcodes, and the town sits within our 15-mile rapid-response radius for fast emergency arrivals. Gas Safe registered, free fixed-price quotes, instant digital landlord certificates, and 24/7 emergency cover for burst pipes, leaks and breakdowns every day of the year.',
      ],
      coverageNote:
        'Covering Stockport town centre, Edgeley, Heaton Moor, Davenport and the surrounding SK postcodes — including the railway viaduct and Edgeley Park areas.',
      faqs: [
        [
          'Do you cover all of Stockport?',
          'Yes — Stockport town centre, Edgeley, Heaton Moor, Davenport and the surrounding SK postcodes are all part of our coverage. The borough’s mix of red-brick terraces, steep valley properties and mill conversions near the viaduct and Edgeley Park generates a lot of emergency call-outs, boiler diagnostics and drainage work, all of which are part of our regular Stockport workload.',
        ],
        [
          'Can you diagnose a boiler fault rather than just replace it?',
          'Yes — proper diagnosis is central to how we work. Many Stockport boiler problems are repairable faults or sludge-related performance issues rather than a boiler at end of life. We run a full electronic diagnostic, show you the live readings, and give you an honest, fixed-price recommendation — repair, power flush or replacement — rather than defaulting to the most expensive option.',
        ],
        [
          'How quickly can you reach me in an emergency in Stockport?',
          'Stockport falls within our 15-mile rapid-response radius, so we aim for fast arrival on burst pipes, leaks and breakdowns across the SK postcodes. Call our 24/7 line and the team will talk you calmly through isolating your mains supply, while an engineer is dispatched and you receive an SMS with a live GPS tracking link and real-time ETA.',
        ],
        [
          'Do you provide landlord gas safety certificates in Stockport?',
          'Yes — Stockport’s large rental market means landlord CP12 work is a steady part of what we do, and around a third of our jobs come from the rental sector overall. We carry out the annual gas safety check, email the digital certificate to you and your managing agent on the day, and enrol you in lifetime reminders so the legally required renewal never slips.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and holds £5 million public liability and £10 million employers’ liability insurance. Every engineer who attends a Stockport property is a directly employed, background-checked member of our own team, never a subcontractor.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Stockport',
      metaDescription:
        'Gas Safe plumber and heating engineer in Stockport (SK). Emergency call-outs, boiler diagnostics, power flushing, landlord CP12 certificates.',
    },
    {
      slug: 'wilmslow',
      name: 'Wilmslow',
      order: 80,
      geo: {latitude: 53.3275, longitude: -2.2312},
      intro: [
        'Plumbing and heating engineers covering Wilmslow — an exclusive Cheshire enclave of expansive detached estates, private gated properties and high-spec luxury new-build developments around the Golden Triangle and the River Bollin. This is where we excel at the most premium end of our work: bespoke unvented hot water plant rooms, large multi-zone smart heating control networks, and ultra-luxury custom walk-in wet rooms.',
        'Across Wilmslow, [underfloor heating design and installation](/services/underfloor-heating-installation) for large open-plan extensions is a frequent project — we designed and installed a multi-zone hydronic system across a 60-sqm Wilmslow extension that supplies three luxury bathrooms simultaneously without any drop in pressure. Premium [boiler and heating upgrades](/services/boiler-installation-heating-upgrades) with high-pressure unvented cylinders and complete [luxury bathroom renovations](/services/bathroom-design-renovation) round out the typical workload here.',
        'Coverage extends to Wilmslow for major planned installations within our 25-mile radius, and the SK9 postcodes for emergency and servicing work. Gas Safe registered, Worcester Bosch Diamond Accredited, free fixed-price quotes, and a 24-month workmanship guarantee on every installation.',
      ],
      coverageNote:
        'Covering Wilmslow, the Golden Triangle and the surrounding SK9 postcodes — including the gated estates and new-build developments around the River Bollin.',
      faqs: [
        [
          'Do you cover all of Wilmslow?',
          'Yes — Wilmslow, the Golden Triangle and the surrounding SK9 area are part of our coverage, including the detached estates, gated properties and luxury new builds around the River Bollin. Wilmslow is one of our most premium areas, where we specialise in bespoke unvented plant rooms, multi-zone smart heating and ultra-luxury walk-in wet rooms.',
        ],
        [
          'Can you supply strong hot water to multiple bathrooms at once?',
          'Yes — this is a Wilmslow speciality. We design and install bespoke high-pressure unvented hot water systems and plant rooms sized to supply several bathrooms simultaneously without any drop in pressure. We installed a system across a 60-sqm Wilmslow extension that runs three luxury bathrooms at once, paired with multi-zone underfloor heating designed to our own room-by-room heat loss calculations.',
        ],
        [
          'Do you install underfloor heating in large extensions?',
          'Yes — multi-zone hydronic underfloor heating for large open-plan extensions is one of our most popular Wilmslow projects. Every system is designed in-house with genuine BS EN 12831 heat loss calculations, pressure-tested at 6 bar before screed with a signed certificate for building control, and commissioned so each zone delivers exactly its calculated output at the most efficient flow temperature.',
        ],
        [
          'Do you install smart multi-zone heating controls?',
          'Yes — large Wilmslow properties benefit hugely from multi-zone smart control. We install and configure Nest, Hive and tado° multi-zone systems so each part of the home can be heated independently and scheduled to your routine, all controllable from your phone. This is configured around the property at survey rather than offered as an off-the-shelf package.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and carries £5 million public liability and £10 million employers’ liability insurance, fully tailored to include major structural pipework and hot-works. As Worcester Bosch Diamond Accredited installers we register 12-year manufacturer warranties, and all our installation work is covered by a 24-month workmanship guarantee.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Wilmslow',
      metaDescription:
        'Gas Safe plumber and heating engineer in Wilmslow (SK9). Unvented plant rooms, multi-zone underfloor heating, luxury wet rooms. Free fixed-price quotes.',
    },
    {
      slug: 'cheadle',
      name: 'Cheadle',
      order: 90,
      geo: {latitude: 53.3917, longitude: -2.2104},
      intro: [
        'Plumbing and heating engineers covering Cheadle, Cheadle Hulme and Gatley — a leafy suburban market straddling the Stockport and Manchester border, defined by large 1930s detached family homes with substantial gardens, modern executive estates and the Alexandra Hospital catchment. There’s steady demand here for full central heating system upgrades in larger properties, [power flushing](/services/power-flushing-system-clean) of under-performing older radiator networks, and landlord [gas safety certificates](/services/gas-safety-certificates-boiler-servicing) across the extensive private rental sector along Cheadle Road and Gatley Road.',
        'Across Cheadle, the larger 1930s and executive homes mean [boiler installation and heating upgrades](/services/boiler-installation-heating-upgrades) — often high-output system boilers with unvented cylinders for multiple bathrooms — are a regular project, alongside the power flushing that restores even heat to bigger radiator networks. The rental density along the main roads keeps our landlord certificate and servicing work busy too.',
        'Coverage spans the SK8 postcodes, and Cheadle sits within our tight 15-mile rapid-response radius for under-60-minute emergency arrivals. Gas Safe registered, free fixed-price quotes, instant digital landlord certificates, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Cheadle, Cheadle Hulme and Gatley and the surrounding SK8 postcodes — including the Cheadle Road, Gatley Road and Alexandra Hospital areas.',
      faqs: [
        [
          'Do you cover Cheadle Hulme and Gatley?',
          'Yes — Cheadle Hulme and Gatley are part of standard coverage along with Cheadle itself, across the SK8 postcodes. The area’s large 1930s detached homes and executive estates keep us busy with full central heating upgrades, power flushing of older radiator networks, and landlord gas safety certificates along the rental-heavy Cheadle Road and Gatley Road corridors.',
        ],
        [
          'Can you upgrade the heating in a large 1930s detached house?',
          'Yes — Cheadle’s larger 1930s and detached homes are exactly the kind of properties we upgrade regularly. We often fit a high-output system boiler with a high-pressure unvented cylinder to serve multiple bathrooms, balance the radiator network for even heat, and add smart zoned controls. Every upgrade is sized from the property’s actual demand rather than a generic figure, and includes a full power flush.',
        ],
        [
          'My radiators heat unevenly — can a power flush help?',
          'Often, yes — and it’s a common Cheadle request given the larger radiator networks in the area. Uneven heat is usually magnetite sludge restricting flow. Our genuine full-day power flush, with manual radiator agitation and magnetic filtration, restores even output, and we provide a thermal before-and-after report showing the difference. If a flush won’t fully resolve it, we tell you honestly and recommend the right fix.',
        ],
        [
          'How quickly can you reach me in an emergency in Cheadle?',
          'Cheadle is within our tight 15-mile rapid-response radius, so we consistently maintain an under-60-minute average arrival for burst pipes, leaks and breakdowns across the SK8 area. Call our 24/7 line for calm guidance on shutting off your stopcock, and you’ll get an SMS with a live GPS tracking link showing your engineer’s real-time location and ETA.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and holds £5 million public liability and £10 million employers’ liability insurance. We use only our own directly employed, background-checked engineers across Cheadle, never subcontractors, so quality and accountability stay consistent on every job.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Cheadle',
      metaDescription:
        'Gas Safe plumber and heating engineer in Cheadle, Cheadle Hulme and Gatley (SK8). Heating upgrades, power flushing, landlord CP12 certificates.',
    },
    {
      slug: 'bramhall',
      name: 'Bramhall',
      order: 100,
      geo: {latitude: 53.3589, longitude: -2.1645},
      intro: [
        'Plumbing and heating engineers covering Bramhall — a premium Stockport suburb of large detached and semi-detached properties on tree-lined avenues, with a strong concentration of families in the Bramhall High School and Hazel Grove catchments. The area is extremely active for luxury [bathroom renovations](/services/bathroom-design-renovation), [underfloor heating installations](/services/underfloor-heating-installation) in large kitchen-diner extensions, and replacing ageing open-vented heating systems with modern high-pressure unvented cylinders.',
        'Across Bramhall, the larger family homes and extension projects make [boiler installation and heating upgrades](/services/boiler-installation-heating-upgrades) — particularly open-vented to unvented conversions — a frequent type of work, alongside complete in-house bathroom renovations and the underfloor heating that suits open-plan kitchen-diners. Every system is designed around the individual property rather than a one-size figure.',
        'Coverage spans the SK7 postcodes, and Bramhall sits within our tight 15-mile rapid-response radius for under-60-minute emergency arrivals. Gas Safe registered, free fixed-price quotes, a 24-month workmanship guarantee, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Bramhall and the surrounding SK7 postcodes — including the tree-lined avenues within the Bramhall High School and Hazel Grove catchments.',
      faqs: [
        [
          'Do you cover all of Bramhall?',
          'Yes — Bramhall and the surrounding SK7 streets are part of standard coverage, including the tree-lined family avenues in the Bramhall High School and Hazel Grove catchments. The area’s large detached and semi-detached homes keep us busy with luxury bathroom renovations, underfloor heating in kitchen-diner extensions, and upgrades from ageing open-vented systems to modern unvented cylinders.',
        ],
        [
          'Can you convert my old open-vented system to unvented?',
          'Yes — this is one of our most popular Bramhall jobs. We decommission ageing open-vented systems with their loft tanks and install a modern high-pressure unvented hot water cylinder, which delivers stronger, more consistent hot water across multiple bathrooms and frees up loft space. We handle all the G3 certification and building control notification that unvented installations legally require.',
        ],
        [
          'Do you install underfloor heating in kitchen extensions?',
          'Yes — underfloor heating for large kitchen-diner extensions is a frequent Bramhall project. We design every system in-house with genuine room-by-room heat loss calculations that account for your window sizes, insulation and floor finish, then pressure-test before screed and commission each zone to its calculated output — giving even, efficient warmth across an open-plan space without radiators taking up wall room.',
        ],
        [
          'How quickly can you reach me in an emergency in Bramhall?',
          'Bramhall is within our tight 15-mile rapid-response radius, so we consistently maintain an under-60-minute average arrival for burst pipes, leaks and breakdowns across the SK7 area. Call our 24/7 line for calm guidance on isolating your mains, and you’ll get an SMS with a live GPS tracking link showing the engineer’s real-time location and ETA.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and carries £5 million public liability and £10 million employers’ liability insurance. Our bathroom and installation work is also covered by a 24-month workmanship guarantee, and we use only our own directly employed in-house team across Bramhall, never subcontractors.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Bramhall',
      metaDescription:
        'Gas Safe plumber and heating engineer in Bramhall (SK7). Luxury bathrooms, underfloor heating, unvented system conversions. Free fixed-price quotes.',
    },
    {
      slug: 'timperley',
      name: 'Timperley',
      order: 110,
      geo: {latitude: 53.3897, longitude: -2.3294},
      intro: [
        'Plumbing and heating engineers covering Timperley — a predominantly residential area bridging [Altrincham](/areas/altrincham) and [Sale](/areas/sale), with a blend of 1930s bay-fronted semis, 1960s detached houses and modern infill developments. Timperley sees consistent demand across the full cross-section of our services — [emergency plumbing call-outs](/services/emergency-plumbing-repairs), combi boiler swaps, annual [boiler servicing](/services/gas-safety-certificates-boiler-servicing) and [bathroom installations](/services/bathroom-design-renovation) — for a broad demographic from first-time buyers to long-term retirees.',
        'Across Timperley, the mix of established semis and detached homes means [boiler installation and heating upgrades](/services/boiler-installation-heating-upgrades) and bathroom renovations are steady work, while the age of much of the housing keeps emergency repairs and servicing busy too. Sitting between our base in Altrincham and the M33 Sale area, Timperley is one of the most central parts of our patch.',
        'Coverage spans the WA15 postcodes with no travel charge, and Timperley sits right inside our tight 15-mile rapid-response radius for under-60-minute emergency arrivals. Gas Safe registered, free fixed-price quotes, 0% finance on boiler installations, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering all of Timperley and the surrounding WA15 postcodes — 1930s bay-fronted semis, 1960s detached houses and modern infill developments between Altrincham and Sale.',
      faqs: [
        [
          'Do you cover all of Timperley?',
          'Yes — the whole WA15 Timperley area is part of standard coverage with no travel charge, and as it bridges our Altrincham base and the M33 Sale area, it’s one of the most central parts of our patch. We see the full range of work here — emergency call-outs, combi boiler swaps, annual servicing and bathroom installations — across everything from 1930s bay-fronted semis to modern infill homes.',
        ],
        [
          'How quickly can you reach me in an emergency in Timperley?',
          'Timperley sits right inside our tight 15-mile rapid-response radius, so we consistently maintain an under-60-minute average arrival for burst pipes, leaks and breakdowns across WA15. Call our 24/7 line and the team will talk you calmly through shutting off your stopcock, while you receive an SMS with a live GPS tracking link showing the engineer’s real-time location and ETA.',
        ],
        [
          'Can you swap my old combi boiler?',
          'Yes — combi boiler swaps are one of our most common Timperley jobs, given the area’s 1930s and 1960s housing stock. A straightforward combi-to-combi swap is typically completed in a day, with a full power flush, MagnaClean filter and smart thermostat included, and all the building control and Gas Safe notification handled for you. As accredited installers we register 12-year manufacturer warranties on new boilers.',
        ],
        [
          'Do you offer annual boiler servicing in Timperley?',
          'Yes — we provide genuine, component-level annual servicing rather than a quick wipe-down, which keeps your manufacturer warranty valid and catches hidden faults early. You can book a precise morning or afternoon slot online or by phone, and we enrol you in lifetime email and SMS reminders so next year’s service is booked in good time.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210) and holds £5 million public liability and £10 million employers’ liability insurance. Every engineer who attends a Timperley property is a directly employed, background-checked member of our own team, never a subcontractor.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Timperley',
      metaDescription:
        'Gas Safe plumber and heating engineer in Timperley (WA15). Combi boiler swaps, annual servicing, bathrooms, 24/7 emergencies. Free fixed-price quotes.',
    },
    {
      slug: 'knutsford',
      name: 'Knutsford',
      order: 120,
      geo: {latitude: 53.303, longitude: -2.374},
      intro: [
        'Plumbing and heating engineers covering Knutsford — a historic, affluent Cheshire market town with a tightly protected conservation-area core of Georgian and Victorian townhouses, surrounded by prestigious modern executive developments and large country properties in the Tatton Park hinterland. This is the most premium end of our market: high-value bespoke [underfloor heating designs](/services/underfloor-heating-installation) for period property renovations, unvented system installations for large multi-bathroom houses, and intricate heritage-sensitive [bathroom designs](/services/bathroom-design-renovation) requiring Listed Building Consent awareness.',
        'Across Knutsford, the conservation-area townhouses and large country homes mean careful, heritage-aware work is the norm — premium [boiler and heating upgrades](/services/boiler-installation-heating-upgrades) with high-pressure unvented cylinders, bespoke underfloor heating designed around period floors and constraints, and luxury bathroom renovations that respect the character of older properties. Listed building considerations are factored in from the survey onward.',
        'Coverage extends to Knutsford and the WA16 area for major planned installations within our 25-mile radius. Gas Safe registered, CIPHE registered, Worcester Bosch Diamond Accredited, free fixed-price quotes, and a 24-month workmanship guarantee on every installation.',
      ],
      coverageNote:
        'Covering Knutsford town centre and the surrounding WA16 area — the Georgian and Victorian conservation-area core, executive developments and country properties in the Tatton Park hinterland.',
      faqs: [
        [
          'Are you used to heritage and listed properties in Knutsford?',
          'Yes — Knutsford’s conservation-area core of Georgian and Victorian townhouses, plus the listed country properties around Tatton Park, are exactly the kind of premium, heritage-sensitive work we specialise in. We factor Listed Building Consent considerations into the design from the survey onward, and take care to work sympathetically with period floors, fabric and constraints on every installation.',
        ],
        [
          'Can you design underfloor heating for a period property?',
          'Yes — bespoke underfloor heating for period renovations is one of our highest-value Knutsford services. We use low-profile overlay systems where floor build-up is constrained, design every system in-house with genuine room-by-room heat loss calculations, and work carefully around the constraints of older floors and heritage fabric — giving even, efficient warmth without compromising the character of the property.',
        ],
        [
          'Do you install unvented systems for large multi-bathroom houses?',
          'Yes — the large country and executive properties around Knutsford often need high-pressure unvented hot water systems to serve several bathrooms simultaneously. We design and install bespoke unvented systems and plant rooms sized to your property’s demand, handling all the G3 certification and building control notification that unvented installations require.',
        ],
        [
          'Is there a travel charge to Knutsford?',
          'Knutsford falls within our 25-mile radius for major planned installations such as boilers, bathrooms and underfloor heating, and there’s no travel charge for these. For the WA16 area we’ll always confirm coverage and timing clearly at enquiry, and you receive an itemised fixed-price quote within 24 hours of the survey.',
        ],
        [
          'Are you Gas Safe registered and insured?',
          'Yes — Vanguard is Gas Safe registered (registration number 5543210), CIPHE registered, and carries £5 million public liability and £10 million employers’ liability insurance tailored to include major structural pipework and hot works. As Worcester Bosch Diamond Accredited installers we register 12-year manufacturer warranties, with a 24-month workmanship guarantee on every installation.',
        ],
      ],
      metaTitle: 'Plumber & Heating Engineer in Knutsford',
      metaDescription:
        'Gas Safe plumber and heating engineer in Knutsford (WA16). Heritage-sensitive bathrooms, bespoke underfloor heating, unvented systems. Free quotes.',
    },
  ],

  // -------------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------------
  projects: [
    {
      slug: 'combi-conversion-heating-overhaul-sale',
      title: 'Combi Conversion & Heating Overhaul, Sale',
      services: ['boiler-installation-heating-upgrades'],
      area: 'sale',
      summary:
        'Removed a 30-year-old gas back boiler from behind a living-room fireplace and installed a modern Vaillant ecoTEC combi in the loft — freeing up the airing cupboard and lifting the property’s efficiency rating by 35%.',
      body:
        'A 1930s semi in Sale, WA15, running on a 30-year-old gas back boiler hidden behind the living-room fireplace, with a gravity-fed system, loft tanks and an airing cupboard given over entirely to a hot water cylinder. The owners wanted to free up the space, lose the ageing back boiler and bring the heating into the modern era. We designed a full combi conversion: decommissioning the old back boiler and gravity system, removing the redundant cold-water loft tanks and cylinder, and installing a modern high-efficiency Vaillant ecoTEC combi relocated into the loft. The most technically demanding part of the job was the copper pipework routing through the loft space — every run planned and dressed cleanly to feed the relocated boiler, isolate the old system and tie into the existing radiator circuit without compromising flow. Before the new appliance went on, the whole system was power-flushed to strip out three decades of magnetite sludge, and an Adey MagnaClean filter was fitted to protect the new heat exchanger. Every radiator was balanced, the system dosed with inhibitor, a smart thermostat configured to the owners’ phones, and the gas tightness verified before handover. The result freed up a full airing cupboard, removed the redundant tanks from the loft, and lifted the property’s overall energy efficiency rating by 35% — and the loft pipework layout is neat enough that we’re happy to show it off as a demonstration of our installation standards.',
      completedAt: '2026-04-18',
      metaTitle: 'Combi Conversion & Heating Overhaul, Sale',
      metaDescription:
        'A 30-year-old back boiler replaced with a loft-mounted Vaillant ecoTEC combi in Sale — airing cupboard freed up and efficiency lifted 35%.',
    },
    {
      slug: 'walk-in-wet-room-transformation-altrincham',
      title: 'Walk-In Wet-Room Transformation, Altrincham',
      services: ['bathroom-design-renovation'],
      area: 'altrincham',
      summary:
        'A complete strip-out of a cramped 1980s bathroom and full structural rebuild into a luxury walk-in wet room — floor reinforcement, tanking, Italian porcelain and a digital dual rainfall shower.',
      body:
        'A cramped, dated 1980s bathroom in Altrincham, WA14, completely stripped out and rebuilt as a luxury walk-in wet room — one of our most technically demanding bathroom projects to date. The brief was a fully open, level-access wet floor with a large-format stone-effect tile bed and a digital dual rainfall shower, which meant the structure had to come first. The existing floor joists weren’t rated to carry the weight of a large-format tile bed laid to falls, so the subfloor was reinforced with additional framing to take the load without any deflection. With the structure sound, the entire wet area was tanked using a multi-stage Schlüter-Systems waterproof membrane, and a hidden linear drainage channel was set in with precision falls across the whole floor so water runs cleanly to the drain from every direction — the part of a wet room that has to be millimetre-accurate or it simply doesn’t work. Italian porcelain tiles were set across the walls and floor, electric underfloor heating laid beneath, and a digital dual rainfall shower matrix installed and commissioned. First-fix plumbing was rebuilt from scratch, with concealed copper supplies and a re-run soil pipe, and the whole project was delivered entirely in-house — our own plumbers, tiler and electrician — so there was a single point of accountability throughout. Handover was a clinical deep clean, a grout-line-by-grout-line inspection and a pressure test of every concealed seal alongside the owners. The finished room is dramatic enough that the professionally lit after photos are ideal for marketing.',
      completedAt: '2026-03-10',
      metaTitle: 'Walk-In Wet-Room Transformation, Altrincham',
      metaDescription:
        'A cramped 1980s bathroom rebuilt as a luxury walk-in wet room in Altrincham — floor reinforcement, tanking, Italian porcelain and a digital rainfall shower.',
    },
    {
      slug: 'trace-access-leak-resolution-didsbury',
      title: 'Zero-Damage Trace & Access Leak Resolution, Didsbury',
      services: ['emergency-plumbing-repairs'],
      area: 'didsbury',
      summary:
        'Traced a hidden pinhole leak inside a stud partition wall using thermal imaging — two previous firms wanted to smash through the bathroom floor; we cut a 10cm access hatch and repaired it instantly.',
      body:
        'A homeowner in Didsbury, M20, had water staining spreading across their hallway ceiling and had already been let down by two previous plumbing companies — both of whom couldn’t locate the source without wanting to smash through the master bathroom floor to chase the pipework blind. This is exactly the situation our trace-and-access service is built for. On arrival the engineer deployed Flir thermal imaging to read the heat signature of the hot pipework behind the plaster, tracking the temperature anomaly to a precise point inside a stud partition wall where a pinhole leak in a hot supply pipe was weeping into the ceiling void below. Rather than opening up the bathroom floor or tearing down the hallway ceiling, the engineer cut a single neat 10cm access hatch directly over the failure point, exposed the affected section of pipe, and repaired it on the spot from the premium stock carried on the van. The leak was permanently stopped, the affected area moisture-checked and dried down, and the homeowner left with one small, easily made-good hatch instead of a destroyed bathroom and ceiling. The infrared camera screenshots clearly show the exact heat signature of the pipe failure — and the whole job is the kind that demonstrates why expertise and the right diagnostic kit are worth paying for, rather than just a plumber with a wrench guessing where to cut.',
      completedAt: '2026-02-22',
      metaTitle: 'Trace & Access Leak Resolution, Didsbury',
      metaDescription:
        'A hidden pinhole leak traced inside a stud wall with thermal imaging in Didsbury — repaired through a 10cm hatch, no bathroom floor destroyed.',
    },
    {
      slug: 'underfloor-heating-kitchen-extension-wilmslow',
      title: 'Underfloor Heating, Kitchen Extension, Wilmslow',
      services: ['underfloor-heating-installation', 'boiler-installation-heating-upgrades'],
      area: 'wilmslow',
      summary:
        'Designed and installed a multi-zone hydronic underfloor heating system across a 60-sqm open-plan extension with a high-pressure unvented cylinder supplying three bathrooms simultaneously.',
      body:
        'A large modern kitchen extension in Wilmslow, SK9, where the owners wanted complete heating integration across a 60-sqm open-plan structural extension — and strong, simultaneous hot water across three luxury bathrooms with no drop in pressure. We designed the whole system in-house, starting with a genuine room-by-room heat loss calculation following BS EN 12831 methodology that accounted for the extension’s large glazed areas, floor construction and insulation values, so the pipe spacing, flow temperature and manifold configuration were sized precisely for the space rather than to a generic spec. The underfloor heating was laid as a wet in-screed system: insulation boards and edge expansion foam first, then the pipe circuits secured at the calculated spacing and run back to a multi-zone manifold with individual actuators, so the open-plan space and adjoining areas can each be controlled independently. Every circuit was pressure-tested at 6 bar and left under pressure through the screed pour, with a signed test certificate for building control. Alongside the underfloor heating we installed a high-pressure unvented hot water cylinder sized to supply three bathrooms running at once without any loss of pressure, and tied the whole system back to the heat source at second fix. Commissioning involved tuning each manifold flow meter to its circuit length so every zone delivers its calculated output at the lowest efficient flow temperature. The manifold installation and pipe layout before the screed went down was a genuinely satisfying piece of engineering — the overhead layout matrix showing the pipe spacing pre-pour is a thing of beauty, and the finished space now heats beautifully and evenly without a single visible radiator.',
      completedAt: '2026-01-28',
      metaTitle: 'Underfloor Heating, Kitchen Extension, Wilmslow',
      metaDescription:
        'Multi-zone hydronic underfloor heating and an unvented cylinder across a 60-sqm Wilmslow extension — three bathrooms supplied at once, no pressure drop.',
    },
    {
      slug: 'power-flush-rescue-victorian-property-chorlton',
      title: 'Power Flush Rescue, 15-Radiator Victorian Property, Chorlton',
      services: ['power-flushing-system-clean'],
      area: 'chorlton',
      summary:
        'A 15-radiator Victorian system that three engineers had written off as needing a new boiler — restored to full, even output with a full-day deep power flush, saving the owner over £2,500.',
      body:
        'A large Victorian property in Chorlton, M21, with 15 radiators that were lukewarm at best, severe cold spots throughout, and a boiler kettling loudly under load. Three separate heating engineers had already been out and all reached the same conclusion: "you need a new boiler." The owners came to us for a second opinion before committing to a replacement they couldn’t quite believe was necessary. Our pre-flush thermal-imaging survey told a different story — the boiler itself was mechanically sound, but the system was choked with decades of magnetite sludge and iron oxide restricting flow through the radiators and the heat exchanger, which was the real cause of both the cold spots and the kettling noise. Rather than sell an unnecessary boiler, we recommended a genuine full-day deep power flush. We connected an industrial Kamco rig and drove pulsed water and chemical cleaning agents through every radiator and pipe circuit, reversing direction regularly, and manually agitated each of the 15 radiators in turn to break up the compacted deposits — with magnetic filtration running throughout to capture the ferrous debris as it lifted. Once the water ran clear the system was dosed with long-life Fernox inhibitor and every radiator balanced for even output. The difference was dramatic: every radiator now blasts out heat evenly, and the boiler noise stopped entirely. The thermal before-and-after shots show cold radiators transformed into evenly glowing panels — and the owner saved over £2,500 by not replacing a boiler that was never actually the problem.',
      completedAt: '2025-12-15',
      metaTitle: 'Power Flush Rescue, Victorian Property, Chorlton',
      metaDescription:
        'A 15-radiator Victorian system in Chorlton restored with a full-day power flush — even heat, silent boiler, and over £2,500 saved on an unnecessary boiler.',
    },
    {
      slug: 'emergency-burst-pipe-urmston',
      title: 'Emergency Sunday-Evening Burst Pipe, Urmston',
      services: ['emergency-plumbing-repairs'],
      area: 'urmston',
      summary:
        'A family found water pouring through their kitchen ceiling light fitting at 9pm on a Sunday — our engineer arrived within 42 minutes, isolated the mains and had the water back on within 90 minutes.',
      body:
        'A family in Urmston, M41, discovered water pouring through their kitchen ceiling light fitting at 9pm on a Sunday evening — about as alarming as a domestic plumbing emergency gets, with live electrics in the path of the water and the prospect of thousands of pounds of ceiling and rewiring damage if it wasn’t stopped fast. They called our 24/7 emergency line, where the team immediately talked them through shutting off the electrics to the affected circuit and locating their main stopcock while an engineer was dispatched. Our engineer, Sam, arrived within 42 minutes of the call — well inside our under-60-minute target — with a live-tracked van so the family could see exactly where he was. On arrival he isolated the mains, drained the system to stop the flow, and used the access through the failed light fitting plus a minimal targeted access hole to trace the source: a failed push-fit connector on a pipe run above the kitchen ceiling that had let go under pressure. He replaced the connector with a proper compression fitting from the premium stock carried on the van, pressure-tested the repair, and had the water safely back on within 90 minutes of arriving. The affected area was moisture-checked and dried down before he left. Because the leak was contained so quickly, the family avoided the catastrophic ceiling collapse and electrical damage that a slower response would almost certainly have caused — and they’ve since saved our number as their go-to for anything plumbing-related.',
      completedAt: '2025-11-09',
      metaTitle: 'Emergency Sunday-Evening Burst Pipe, Urmston',
      metaDescription:
        'A Sunday-evening burst pipe pouring through a kitchen ceiling in Urmston — engineer on site in 42 minutes, water safely back on within 90 minutes.',
    },
  ],

  // -------------------------------------------------------------------------
  // Person (blog author)
  // -------------------------------------------------------------------------
  person: {
    id: 'person-thomas-vance',
    firstName: 'Thomas',
    lastName: 'Vance',
    slug: 'thomas-vance',
  },

  // -------------------------------------------------------------------------
  // Blog posts
  // -------------------------------------------------------------------------
  posts: [
    {
      slug: 'signs-your-boiler-needs-replacing',
      title: '7 Signs Your Boiler Needs Replacing (Not Just Repairing)',
      date: '2026-04-15',
      excerpt:
        'Not every boiler fault means a new boiler — but some do. Here are the seven signs that point to replacement over repair, from a Gas Safe registered Greater Manchester heating engineer.',
      content: [
        'A boiler that’s playing up doesn’t always need replacing — plenty of faults are a straightforward, affordable repair. But there’s a tipping point where pouring money into an ageing unit stops making sense, and knowing where that line sits can save you both an unexpected breakdown in the middle of winter and hundreds of pounds in repeated call-outs. Here are the seven signs that point toward replacement rather than another repair.',
        '## 1. Your boiler is more than 12–15 years old',
        'Age alone isn’t a death sentence, but it changes the maths. Most modern condensing boilers are designed for a service life of around 12 to 15 years. Past that point, parts get harder to source, efficiency has usually dropped well below where it started, and the likelihood of a major component failure climbs steeply. If your boiler is over a decade old and starting to misbehave, it’s worth getting an honest assessment of whether the next repair is throwing good money after bad.',
        '## 2. Rising gas bills with no change in usage',
        'If your gas bills are creeping up while your usage hasn’t changed, your boiler is very likely losing efficiency. An older non-condensing G-rated boiler can be operating at 60–70% efficiency, meaning a third of your gas is wasted. A new ErP A-rated condensing model runs at over 90%. Switching can cut gas consumption by up to 30% — savings of up to around £540 a year on a typical bill, which goes a long way toward offsetting the cost of replacement over the boiler’s lifetime.',
        '## 3. Frequent breakdowns and repeated repairs',
        'One repair is normal. Three call-outs in a couple of years is a pattern. When you’re paying out repeatedly for different faults, the boiler is telling you it’s reaching the end of its reliable life. As a rough rule, if a single repair costs more than half the price of a replacement — or you’ve had several repairs in a short window — replacement is usually the better long-term call.',
        '## 4. A persistent kettling or banging noise',
        'A boiler that bangs, gurgles or "kettles" (a noise like a boiling kettle) is often suffering from limescale and sludge build-up on the heat exchanger restricting water flow. This one comes with an important caveat: kettling is frequently fixable with a [power flush](/services/power-flushing-system-clean) rather than a new boiler. We’ve rescued plenty of noisy systems that other engineers had written off. Get the cause diagnosed properly before assuming the worst — it may be the system, not the boiler.',
        '## 5. The boiler keeps losing pressure',
        'A system that needs topping up every few weeks has a leak somewhere — in a radiator, a pipe joint, or internally within the boiler itself. External leaks are usually repairable. But a boiler losing pressure due to an internal fault, such as a failed expansion vessel or a corroding heat exchanger, can be the beginning of the end, especially on an older unit. A proper diagnostic will tell you which it is.',
        '## 6. A yellow flame instead of blue',
        'This one is a safety issue, not just an efficiency one. A healthy gas flame burns crisp and blue. A lazy yellow or orange flame can indicate incomplete combustion and the risk of carbon monoxide — a deadly, odourless gas. If you ever see this, turn the boiler off and call a Gas Safe registered engineer immediately. It’s also exactly why an annual [boiler service and gas safety check](/services/gas-safety-certificates-boiler-servicing) matters: it catches combustion problems before they become dangerous.',
        '## 7. You can’t get strong hot water to multiple taps',
        'If your hot water drops to a trickle the moment someone runs another tap, your system may simply be undersized for how you live now — common when a household has grown or added a bathroom. Rather than fighting an under-powered system, this is often the moment to upgrade to a properly sized combi or to a [system boiler with an unvented cylinder](/services/boiler-installation-heating-upgrades) that can supply strong hot water across several bathrooms at once.',
        '## How to know for sure',
        'The honest answer is that only a proper diagnostic will tell you whether your boiler genuinely needs replacing or whether a repair, service or power flush will keep it going. A good engineer will show you the live readings, explain what they’re seeing, and give you an upfront, fixed-price recommendation rather than defaulting to the most expensive option. As Worcester Bosch Diamond Accredited installers we can register 12-year manufacturer warranties on a new boiler — but we’ll always tell you honestly when a repair is the smarter call.',
        '## The bottom line',
        'If you’re seeing two or three of these signs together — particularly age plus rising bills plus repeated breakdowns — replacement is usually the sensible move. If it’s a single symptom like noise or pressure loss, get it diagnosed first, because the fix may be far cheaper than a new boiler. Either way, a free, no-obligation [quote](/quote) and survey gets you a straight answer based on your actual system rather than guesswork.',
      ],
    },
    {
      slug: 'how-much-does-a-new-boiler-cost',
      title: 'How Much Does a New Boiler Cost? A Greater Manchester Guide',
      date: '2026-04-29',
      excerpt:
        'A new boiler is one of the bigger spends on a home. Here are the real cost ranges for combi swaps, system conversions and unvented upgrades — and the variables that move every quote.',
      content: [
        'A new boiler is one of those costs people want a handle on before they pick up the phone, and the honest answer is "it depends" — on the type of boiler, the work involved in fitting it, the brand and warranty, and whether you’re doing a straight swap or a full system conversion. But that doesn’t mean you can’t get useful ranges before a survey. Below are realistic cost bands for boiler and heating work across Greater Manchester, with the variables that move the figure within each range.',
        '## What you’re really paying for',
        'A boiler quote is roughly three things: the appliance itself, the labour to install it, and the extras that protect it. The boiler is often less than half the total. Labour covers removing the old unit, running and dressing new copper pipework, fitting and commissioning the new appliance, and balancing the system. The protective extras — a full power flush, a magnetic filter, a smart thermostat — aren’t optional padding; they’re what stop a brand-new boiler inheriting an old, sludge-filled system and failing early. The biggest single variable is how much pipework and system change the job actually needs.',
        '## Straight combi swap cost range',
        'The most common job is a like-for-like combi replacement, where a new combi goes roughly where the old one was. Across Greater Manchester these typically start from around £1,950, rising with the boiler model, output and the amount of pipework that needs upgrading. A straightforward swap is usually completed in a day. As accredited installers we include a full power flush, a MagnaClean filter and a smart thermostat as standard, and register a 12-year manufacturer warranty on the new unit.',
        '## System conversion cost range',
        'Converting an older system — decommissioning a gravity-fed setup with loft tanks and a hot water cylinder and upgrading to a modern high-pressure unvented combi or system boiler — is a bigger job, typically starting from around £3,200. There’s more involved: removing redundant tanks, re-routing pipework, and often relocating the boiler. The payoff is stronger hot water, reclaimed loft and cupboard space, and a far more efficient system. See [boiler installation and heating upgrades](/services/boiler-installation-heating-upgrades) for what a conversion includes.',
        '## Unvented cylinder upgrades',
        'For larger homes running several bathrooms, a system boiler paired with a high-pressure unvented hot water cylinder is often the right answer — it delivers strong, simultaneous hot water that a combi can’t match in a busy household. These installations carry the boiler cost plus the cylinder and its G3-certified controls, and are always sized from the property’s actual hot water demand at survey rather than quoted blind. The result is no more drop in pressure when two showers run at once.',
        '## The protective extras (and why they matter)',
        'Every boiler installation should include a [full power flush](/services/power-flushing-system-clean) to strip decades of magnetite sludge out of the system before the new appliance goes on, plus a magnetic filter to protect the new heat exchanger going forward. Fitting a new boiler onto a dirty system is one of the most common reasons new installations underperform or fail prematurely. These aren’t upsells — they’re the difference between a boiler that lasts its full warranted life and one that doesn’t.',
        '## What pushes the cost up',
        'Within each range, the biggest variables are: the amount of pipework that needs replacing or re-routing, whether the boiler is being relocated (a back boiler moving to a loft, say), the boiler output and brand, whether you’re adding an unvented cylinder, and any system work like new radiators or smart zoned controls. Premium brands with the longest warranties cost more upfront but are usually the better long-term value. The condition of your existing system, not the size of your house, is what moves the figure most.',
        '## How quotes should work',
        'A useful boiler quote starts with a survey so the engineer can check your mains pressure, gas supply, flue routing and hot water demand — not a price guessed over the phone. You should receive an itemised, fixed-price quote (we turn ours around within 24 hours), where the price quoted is exactly what you pay, with no surprise contingencies once work starts. Be wary of headline "from" prices that balloon on the day; a proper survey is how you avoid that.',
        '## The bottom line',
        'For an honest figure on your specific home, the only useful step is a free, no-obligation [quote](/quote) after a survey. The ranges above are the right shape; the figure within them depends on what your system actually needs. 0% finance over 12 or 24 months is available on installations, which spreads the cost without adding to it — worth factoring in when you’re comparing a new boiler against another year of repairs on an ageing one.',
      ],
    },
    {
      slug: 'power-flush-vs-new-boiler-which-do-you-need',
      title: 'Power Flush vs New Boiler: Which Do You Actually Need?',
      date: '2026-05-06',
      excerpt:
        'Cold radiators and a noisy boiler don’t always mean a new boiler. A power flush often fixes the real problem for a fraction of the cost. Here’s how to tell which one you need.',
      content: [
        'Cold radiators, a kettling boiler and lukewarm rooms feel like a boiler on its way out — and plenty of households are told exactly that. But very often the boiler is mechanically sound and the real culprit is a system choked with sludge. A power flush can fix that for a fraction of the cost of a replacement. Knowing which problem you actually have, before you commit to either, can save you thousands.',
        '## What a power flush actually is',
        'A power flush is a deep clean of your central heating system. An industrial pump drives water and specialist chemical cleaners through every radiator and pipe at high velocity, reversing direction regularly to break up the magnetite sludge, iron oxide and limescale that builds up over years and restricts flow. A proper flush also manually agitates each radiator and runs magnetic filtration throughout to capture the debris as it lifts, before finishing with a long-life corrosion inhibitor. See [power flushing and system deep clean](/services/power-flushing-system-clean) for the full process.',
        '## The symptoms that point to sludge, not a dead boiler',
        'Several classic symptoms are caused by a dirty system rather than a failing boiler: cold patches at the bottom of radiators (sludge settles there), radiators that need bleeding constantly, a kettling or banging boiler (build-up on the heat exchanger restricting flow), dirty black water when you bleed a radiator, and some radiators staying cold while others get hot. If that’s what you’re seeing, a flush is very often the answer — and replacing the boiler would leave the underlying problem in place.',
        '## When you genuinely do need a new boiler',
        'A power flush won’t save a boiler that’s actually at end of life. Replacement is the right call when the boiler is over 12–15 years old and failing, when it’s losing pressure due to an internal fault like a corroding heat exchanger, when parts are obsolete, when it’s repeatedly breaking down with different faults, or when it’s simply too small for your household’s hot water demand. In those cases a flush is still worth doing — as part of the new installation — but it isn’t the fix on its own.',
        '## Why the right diagnosis matters so much',
        'The cost gap is enormous. A domestic power flush is typically a few hundred pounds; a new boiler runs into the thousands. We’ve been called out to systems that two or three other engineers had declared "needs a new boiler", run a thermal-imaging survey, found a mechanically sound boiler choked by a sludge-filled system, and restored full even heat with a single full-day flush — saving the owner over £2,500 on a replacement they didn’t need. The lesson: never replace a boiler purely on the strength of cold radiators or a noisy system without a proper diagnostic first.',
        '## How long each takes',
        'A thorough domestic power flush takes four to six hours — your heating is off during the flush itself but back on, hot and balanced by the time we leave the same day. A boiler replacement is a bigger job: a straight combi swap is usually a day, while a full system conversion can run one to two days. If a flush will solve your problem, it’s both far cheaper and far less disruptive than a new [boiler installation](/services/boiler-installation-heating-upgrades).',
        '## What a flush will and won’t fix',
        'A power flush will restore flow and even heat to radiators clogged with sludge, often silence a kettling boiler, and protect the system against future corrosion with inhibitor. What it won’t do is fix mechanical boiler faults, repair leaks, cure an undersized system, or revive radiators that are internally corroded beyond saving. An honest engineer will tell you upfront if a flush won’t fully resolve your cold spots and recommend the right fix instead — rather than taking your money for a flush that was never going to work.',
        '## Questions to ask before either',
        'For a flush, ask: is it a genuine power flush with manual radiator agitation and magnetic filtration, or a quick "plug-and-play" chemical clean? Do you provide a thermal before-and-after report? For a replacement, ask: why is the boiler being condemned rather than repaired or flushed, and what diagnostic evidence supports that? The quality of the answers tells you whether you’re dealing with someone diagnosing the problem or someone selling the most expensive option.',
        '## How to decide',
        'A free diagnostic survey gets you a straight answer faster than any amount of reading. We use thermal imaging to map your cold spots and confirm whether a flush will solve the problem or whether the boiler genuinely needs replacing — and we’ll tell you honestly either way. Send a few details through the [quote](/quote) form and we’ll get a survey booked. For more on the deep-clean side, [power flushing](/services/power-flushing-system-clean) has the full breakdown.',
      ],
    },
    {
      slug: 'combi-vs-system-boiler-which-is-right',
      title: 'Combi vs System Boiler: Which Is Right for Your Home?',
      date: '2026-05-13',
      excerpt:
        'Combi, system or conventional? The right boiler depends on your bathrooms, mains pressure and hot water habits — not on which is cheapest. Here’s how to choose between them.',
      content: [
        'Choosing a new boiler isn’t just about brand and budget — the type of boiler matters more, because the wrong type will leave you fighting weak hot water or paying for capacity you don’t need. The three main options are combi, system and conventional (heat-only) boilers, and the right one comes down to how many bathrooms you run, your incoming mains pressure and how your household actually uses hot water. Here’s how to choose.',
        '## How a combi boiler works',
        'A combi (combination) boiler heats water instantly, on demand, straight from the mains — no storage tanks and no hot water cylinder. Turn on a hot tap and the boiler fires up and heats the water as it flows through. Because there’s nothing stored, you never run out of hot water, and combis are compact, efficient and free up the loft and airing cupboard space that older systems take up. They’re the most popular choice for the majority of UK homes.',
        '## How a system boiler works',
        'A system boiler works alongside a dedicated hot water cylinder, usually a high-pressure unvented cylinder. The boiler heats water that’s stored in the cylinder ready for use, which means it can supply strong hot water to several outlets at once without the flow dropping. Most of the components are built into the boiler itself, so unlike older conventional systems there are no loft tanks needed. See [boiler installation and heating upgrades](/services/boiler-installation-heating-upgrades) for how we size and install these.',
        '## How a conventional (heat-only) system works',
        'A conventional or "heat-only" system is the traditional setup: a boiler, a separate hot water cylinder, and cold-water feed and expansion tanks usually in the loft. It’s what many older homes still run. These systems work, but they take up significant space, the loft tanks are a leak and freeze risk, and a gravity-fed cylinder can give weaker pressure. Most conventional systems are now upgraded to a combi or a modern unvented system boiler when the boiler is replaced.',
        '## The deciding factor: bathrooms and simultaneous demand',
        'The single biggest question is how many bathrooms you have and whether they get used at the same time. A combi is excellent for one or two bathrooms with one outlet running at a time — but its flow rate is shared, so two showers at once will drop the pressure. For homes with two or more bathrooms used simultaneously, a system boiler with a properly sized unvented cylinder is the better answer, because the stored hot water keeps the pressure strong across every outlet at once.',
        '## The other deciding factor: mains pressure and flow',
        'Combi performance lives and dies on your incoming mains pressure and flow rate. A combi in a home with poor mains pressure will give a disappointing trickle of a shower no matter how good the boiler is. This is exactly why a proper survey measures your mains pressure and flow before recommending a boiler type — it’s the difference between a system that delights you and one that frustrates you every morning. If your mains can’t support a combi for your household, a stored-water system is the right call.',
        '## Space, efficiency and running costs',
        'Combis win on space and are very efficient because they only heat what you use. System boilers need room for a cylinder but deliver better simultaneous performance. All modern ErP A-rated condensing boilers — combi or system — are far more efficient than the older units they replace, so the type matters more for hot water performance than for running cost. Pairing either with smart zoned controls and a properly balanced system squeezes out the best efficiency.',
        '## Common mistakes to avoid',
        'The two most common mistakes are fitting a combi to a multi-bathroom home that needs stored hot water (leading to weak simultaneous flow), and oversizing a boiler "to be safe" (which actually reduces efficiency and can cause short-cycling). Both come from quoting a boiler without properly assessing the property first. The right size and type are an engineering decision based on your home’s actual demand, not a guess from the number of bedrooms.',
        '## How to decide',
        'The honest answer is that only a survey measuring your mains pressure, flow rate, bathroom count and hot water habits can tell you which boiler type is genuinely right for your home. We give an unbiased recommendation based on those measurements rather than pushing whichever unit carries the best margin. Send a few details through the [quote](/quote) form and we’ll get a survey booked — and you’ll get a clear, itemised, fixed-price proposal for the right boiler for the way you actually live.',
      ],
    },
    {
      slug: 'landlord-gas-safety-certificate-cp12-guide',
      title: 'The Landlord’s Guide to Gas Safety Certificates (CP12)',
      date: '2026-05-20',
      excerpt:
        'Every UK landlord is legally required to hold a valid CP12 gas safety certificate. Here’s what it covers, how often you need one, and what happens if you don’t — a plain-English guide.',
      content: [
        'If you let a property with any gas appliance, you have a legal duty to keep it gas safe — and the certificate that proves you’ve done so is the CP12, or Landlord Gas Safety Record. It’s one of the most important pieces of compliance in the rental sector, and one of the most commonly misunderstood. This is a plain-English guide to what a CP12 is, what it covers, how often you need one and what happens if you let it lapse.',
        '## What a CP12 actually is',
        'A CP12 (Landlord Gas Safety Record) is a certificate issued by a Gas Safe registered engineer after they’ve checked the gas appliances, fittings and flues in a rental property. It confirms that each appliance has been inspected and is safe to use. The "CP12" name is a hangover from an old form number, but it’s still what most landlords and agents call it. It is not the same as a boiler service — though the two are often, and sensibly, done together.',
        '## What the law requires',
        'Under the Gas Safety (Installation and Use) Regulations 1998, landlords in England, Wales and Scotland must arrange for a Gas Safe registered engineer to carry out an annual gas safety check on every gas appliance and flue in any property they let. You must keep a record of the check, provide a copy to existing tenants within 28 days of the check, and give a copy to any new tenant before they move in. These are legal duties, not best-practice suggestions.',
        '## How often you need one',
        'A gas safety check must be carried out at least every 12 months. The check can be done up to two months before the current certificate expires without shortening the next deadline, which gives you a sensible window to get it booked. Missing the annual deadline puts you in breach of the regulations — which is exactly why every landlord we work with is enrolled in our lifetime email and SMS reminder calendar, so the renewal never quietly slips. See [gas safety certificates and boiler servicing](/services/gas-safety-certificates-boiler-servicing) for how we handle this.',
        '## What gets checked',
        'During a CP12 check the engineer inspects each gas appliance for safe operation, checks that gas is burning correctly (using an electronic flue gas analyser to confirm safe combustion), verifies that flues and chimneys are clearing combustion products safely, confirms adequate ventilation, and carries out a gas tightness test to make sure there are no leaks in the pipework. Any defects are recorded, and anything immediately dangerous is dealt with before the engineer leaves.',
        '## CP12 vs a boiler service — the difference',
        'This trips a lot of landlords up. A CP12 is a safety check — it confirms appliances are safe to use right now. A [boiler service](/services/gas-safety-certificates-boiler-servicing) is maintenance — it cleans and checks internal components to keep the boiler running efficiently and protect the manufacturer warranty. They’re different things, but doing both in one visit makes sense: one appointment, one trip, one piece of disruption for your tenant. Our combined service-and-certificate package is built for exactly this.',
        '## What happens if you don’t have a valid CP12',
        'The consequences are serious. Letting a property without a valid gas safety record is a criminal offence that can carry unlimited fines and, in the worst cases, imprisonment. Beyond the legal risk, an invalid or missing certificate can affect your landlord insurance and can make it impossible to legally evict a tenant via a Section 21 notice, since the gas safety record must have been provided. And of course, the underlying point is safety: the check exists to catch faults like a cracked heat exchanger leaking carbon monoxide before they harm your tenants.',
        '## Carbon monoxide — the real reason it matters',
        'Behind the paperwork is a genuine safety purpose. Faulty gas appliances can leak carbon monoxide, a colourless, odourless gas that kills. An annual check catches the combustion faults and flue problems that produce it, long before a tenant would notice anything wrong. Alongside the CP12, landlords are also required to have a carbon monoxide alarm in any room with a gas appliance — worth checking is in place and working at the same time as the annual gas check.',
        '## Making compliance easy',
        'For landlords with one property or a portfolio, the practical goal is never having to think about it. We issue the CP12 as a digital certificate generated on site and emailed instantly to both you and your managing agent the moment the check passes, so the compliance evidence is in your inbox before the engineer leaves the driveway. Combined with automatic annual reminders, that turns a legal obligation that’s easy to forget into something that simply takes care of itself.',
        '## The bottom line',
        'A valid CP12 isn’t optional — it’s a legal requirement, a safety safeguard for your tenants, and a protection for you as a landlord. The simplest way to stay on top of it is to book the annual check with a Gas Safe registered engineer who handles the certificate, the reminders and (ideally) the boiler service in one visit. Send your property details through the [quote](/quote) form and we’ll get your gas safety check booked and keep you compliant year after year.',
      ],
    },
    {
      slug: 'what-to-do-burst-pipe-emergency',
      title: 'What to Do in a Burst Pipe Emergency (Before the Plumber Arrives)',
      date: '2026-04-22',
      excerpt:
        'A burst pipe can cause thousands in damage in minutes. Here are the exact steps to take the moment you spot one — and how to limit the damage before an emergency plumber gets there.',
      content: [
        'A burst pipe is one of the most stressful things that can happen in a home — water pouring through a ceiling, soaking into floors and threatening electrics, often at the worst possible time. The good news is that the damage is largely determined by what you do in the first few minutes. Acting fast and calmly can be the difference between a quick repair and a flooded, ruined room. Here are the exact steps to take before the plumber arrives.',
        '## Step 1: Turn off the water at the stopcock',
        'Your first job is to stop the flow. Find your main internal stopcock — it’s usually under the kitchen sink, in a hallway or downstairs cupboard, or under the stairs — and turn it firmly clockwise to shut off the mains supply to the whole house. This is the single most important action you can take, so it’s worth knowing where your stopcock is before an emergency ever happens. If you can’t find it or it’s seized, there may also be an external stopcock near your boundary, usually under a small metal cover in the pavement or driveway.',
        '## Step 2: Drain the system',
        'Once the mains is off, turn on all your cold taps, starting with the kitchen, to drain the water still sitting in the pipework. This relieves the pressure in the system and reduces how much more water can escape from the burst. Flush the toilets too. Within a few minutes the flow from the burst should slow to a trickle and then stop as the pipes empty, which buys you time and limits further damage.',
        '## Step 3: Deal with electrics safely',
        'Water and electricity are a dangerous combination. If water is anywhere near light fittings, sockets or your consumer unit — for example pouring through a ceiling light, as happens with upstairs leaks — switch off the electricity at the consumer unit (fuse box) if it is safe and dry to reach it. Never touch electrical fittings, switches or the fuse box with wet hands or while standing in water. If you’re in any doubt about whether it’s safe, leave it and tell the engineer when they arrive.',
        '## Step 4: Contain and protect',
        'With the water stopped and electrics made safe, limit the damage to your home. Place buckets, bowls and towels under any active drips, and move furniture, rugs and valuables away from the affected area. If water is pooling in a ceiling and bulging it, a small hole pierced at the lowest point with a screwdriver — into a bucket — can release the water in a controlled way and prevent the whole ceiling collapsing. Take a few photos of the damage too; they’re useful for any insurance claim later.',
        '## Step 5: Call an emergency plumber',
        'With the immediate situation under control, call a Gas Safe registered emergency plumber. A good [emergency plumbing service](/services/emergency-plumbing-repairs) will talk you calmly through these steps over the phone if you haven’t already done them, and give you a realistic arrival time. We maintain an under-60-minute average arrival across our core Greater Manchester postcodes, and send an SMS with a live GPS tracking link so you can see exactly where the engineer is — no being left wondering when help will turn up.',
        '## What a good emergency plumber will do on arrival',
        'A proper trace-and-access engineer won’t just start tearing into walls and floors. They’ll use thermal imaging and acoustic detection to pinpoint the source of the leak precisely — even when it’s hidden inside a stud wall or under floorboards — so they can cut a small, targeted access hatch rather than ripping out a whole ceiling or bathroom floor. We once traced a hidden pinhole leak that two other firms wanted to smash a bathroom floor to reach, and repaired it through a single 10cm hatch. That precision is what limits the damage and the disruption.',
        '## How to prevent burst pipes in the first place',
        'Most bursts come down to two causes: freezing in winter and ageing or failed fittings. To reduce the risk, lag exposed pipes in lofts, garages and outbuildings before winter, keep your heating ticking over on a low setting during cold snaps even when you’re away, and have old lead, steel or failing push-fit pipework replaced before it lets go. An annual heating check is a good chance to flag pipework that’s on its way out before it becomes a 9pm emergency.',
        '## The bottom line',
        'In a burst pipe emergency, the order is simple: stop the water at the stopcock, drain the system, make the electrics safe, contain the damage, then call for help. Knowing where your stopcock is right now — before anything goes wrong — is the best preparation you can make. If you’ve got a burst or a leak, call our 24/7 line straight away, or send details through the [quote](/quote) form for non-urgent work, and we’ll get an engineer to you fast.',
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // Section copy (home + marketing pages)
  // -------------------------------------------------------------------------
  sections: {
    trustBadges: TRUST_BADGES,

    homeHero: {
      eyebrow: 'Gas Safe Plumber & Heating Engineer · Greater Manchester',
      heading: 'Premium plumbing & heating, done properly across Greater Manchester',
      subheading:
        'Boiler installation, 24/7 emergency repairs, luxury bathrooms and underfloor heating from a Gas Safe registered, fully insured team covering Altrincham, Sale, Stockport, Wilmslow, Didsbury and the wider North Cheshire area.',
    },

    homeIntro: {
      eyebrow: 'About Vanguard Plumbing & Heating',
      heading: 'Local, Gas Safe registered and fully insured',
      body: [
        'A premium, highly responsive plumbing and heating service for homeowners and landlords across Greater Manchester and North Cheshire. We combine the technical standards and safety protocols of a national firm with the care, punctuality and upfront, honest pricing of a trusted local business — arriving on time, protecting your floors and charging exactly what we quote.',
      ],
      checklist: [
        'Boiler installation & heating upgrades',
        '24/7 emergency plumbing repairs',
        'Luxury bathroom design & renovation',
        'Gas safety certificates & boiler servicing',
      ],
    },

    serviceCards: {
      eyebrow: 'What we do',
      heading: 'Our services',
      subheading:
        'From a single emergency leak to a full boiler installation or a complete bathroom renovation — the same Gas Safe standards and fixed-price transparency on every job.',
      cards: [
        {
          title: 'Boiler Installation & Heating Upgrades',
          description:
            'Worcester Bosch Diamond and Vaillant Advance accredited installs with up to a 12-year manufacturer warranty.',
          href: '/services/boiler-installation-heating-upgrades',
        },
        {
          title: 'Emergency Plumbing Repairs',
          description:
            '24/7 rapid-response leak detection and repairs, typically on site in under 60 minutes across our core postcodes.',
          href: '/services/emergency-plumbing-repairs',
        },
        {
          title: 'Luxury Bathroom Design & Renovation',
          description:
            'Bespoke 3D design through to a fully fitted bathroom or wet room — managed end to end by our in-house team.',
          href: '/services/bathroom-design-renovation',
        },
        {
          title: 'Gas Safety Certificates & Boiler Servicing',
          description:
            'Detailed annual servicing and landlord CP12 certificates from a Gas Safe registered engineer, emailed on the day.',
          href: '/services/gas-safety-certificates-boiler-servicing',
        },
        {
          title: 'Power Flushing & System Deep Clean',
          description:
            'Industrial power flushing with magnetic filtration and a before-and-after thermal report to restore even heat.',
          href: '/services/power-flushing-system-clean',
        },
        {
          title: 'Underfloor Heating Design & Installation',
          description:
            'In-house heat-loss design and installation of overlay and in-screed underfloor heating for warm, even rooms.',
          href: '/services/underfloor-heating-installation',
        },
      ],
    },

    whyChooseUs: {
      eyebrow: 'Why choose us',
      heading: 'Premium plumbing & heating, done properly',
      subheading:
        'Plumbing and heating across Greater Manchester with fixed-price quotes, Gas Safe registered engineers and a tidy, accountable approach.',
      reasons: [
        {
          title: 'Gas Safe registered',
          description:
            'Every engineer is a directly employed, Gas Safe registered professional — we never use subcontractors.',
        },
        {
          title: 'Tidy & reliable',
          description:
            'Floor protectors down, boot covers on, M-class dust extraction and the site left cleaner than we found it.',
        },
        {
          title: 'Fixed-price quotes',
          description:
            'On-site survey followed by an itemised, flat-rate quote — the price we quote is exactly what you pay.',
        },
        {
          title: 'Local to Greater Manchester',
          description:
            'Covering Altrincham, Sale, Stockport, Wilmslow, Didsbury, Chorlton, Knutsford and the surrounding areas.',
        },
      ],
    },

    process: {
      eyebrow: 'How it works',
      heading: 'Simple from quote to finish',
      subheading:
        'From first enquiry to handover, the process is straightforward — clear communication, Gas Safe workmanship and finished on the timeline we agreed.',
      steps: [
        {
          icon: 'Phone',
          title: 'Enquiry',
          description: 'Get in touch — by phone, email or the quote form on the site.',
        },
        {
          icon: 'ShieldCheck',
          title: 'Survey & quote',
          description:
            'On-site survey to assess the work and your system. A fixed-price quote follows, usually within 24 hours.',
        },
        {
          icon: 'Wrench',
          title: 'The work',
          description:
            'Carried out tidily and on schedule by Gas Safe engineers, with floors protected and daily clean-down.',
        },
        {
          icon: 'Sparkles',
          title: 'Handover',
          description:
            'We commission and test everything, register your warranty and walk you through your new system.',
        },
      ],
    },

    testimonials: {
      eyebrow: 'What our customers say',
      heading: 'Trusted across Greater Manchester',
      items: [
        {
          quote:
            'Vanguard replaced our ageing combi boiler at our home in Altrincham and the whole job was spotless from start to finish. The engineer turned up exactly when he said he would, the new pipework is beautifully neat, and they hoovered up before they left. We finally have hot water that actually keeps up with two teenagers.',
          authorName: 'Margaret Finch',
          rating: 5,
        },
        {
          quote:
            'A pipe burst under our floor in Sale on a Sunday evening and I was dreading the bill. Their engineer arrived within the hour, found the leak straight away and had it fixed before bedtime, all for a fair price he quoted upfront. Genuinely could not fault them.',
          authorName: 'James Connolly',
          rating: 5,
        },
        {
          quote:
            'We had a full bathroom refurb done at our place in Didsbury and Vanguard handled everything from the first measure-up to the final tile. They kept us updated every day, stuck to the timeline, and the finish is far better than we hoped. Would happily recommend them to anyone nearby.',
          authorName: 'Priya Sharma',
          rating: 5,
        },
      ],
      aggregateRatingValue: 4.9,
      aggregateReviewCount: 52,
      aggregateSourceName: 'Google',
      reviewsUrl: 'https://www.facebook.com/vanguardplumbingandheating/reviews',
      leaveReviewUrl: 'http://maps.google.com/?cid=vanguardplumbingmcr1298',
    },

    blogSection: {
      eyebrow: 'From the blog',
      heading: 'Tips & recent posts',
    },

    homeCta: {
      eyebrow: 'Get in touch',
      heading: 'Ready to sort your plumbing or heating?',
      subheading:
        'Send a few details about your project and you’ll get a fixed-price quote back, usually within 24 hours.',
    },

    homeContactFormTitle: 'Request a free quote',

    aboutHero: {
      eyebrow: 'About',
      heading: `About ${SITE}`,
      subheading:
        'A Gas Safe registered plumbing and heating team covering Altrincham, Sale, Stockport, Wilmslow, Didsbury and the wider Greater Manchester and North Cheshire area.',
    },

    aboutIntro: {
      eyebrow: 'Our story',
      heading: 'A national standard with local care',
      body: [
        'Vanguard Plumbing & Heating was founded by lead heating engineer Thomas Vance in 2011, after nearly a decade as a senior technical diagnostic specialist for major national energy firms. Frustrated by how those firms treated local homeowners — extortionate rates, inconsistent scheduling and zero personal accountability — he launched Vanguard from his kitchen table in Altrincham with a single van and a clear philosophy: combine the technical standards and safety protocols of a national firm with the care, punctuality and honest pricing of a trusted local business.',
        'Today Vanguard is a tightly knit team of local Gas Safe engineers, master tilers and system designers. We never employ pushy, commission-based salespeople or cut corners with cheap materials. We live and work in the communities we serve, so we approach every boiler installation, leaking pipe and bathroom project as if we were working in our own family home — on time, respectful of your floors, charging exactly what we quote and standing behind every seal we crimp.',
      ],
      checklist: [
        'Boiler installation & heating upgrades',
        '24/7 emergency plumbing repairs',
        'Luxury bathroom design & renovation',
        'Power flushing & underfloor heating',
      ],
    },

    aboutWhyChooseUs: {
      eyebrow: 'What sets us apart',
      heading: 'A premium standard, accountable from start to finish',
      subheading:
        'A Gas Safe registered plumbing and heating team covering Greater Manchester — fixed-price quotes, directly employed engineers and a tidy finish.',
      reasons: [
        {
          title: 'Experienced',
          description:
            'Over 15 years of hands-on diagnostic and installation experience across period and modern properties throughout Greater Manchester and Cheshire.',
        },
        {
          title: 'Fully insured & accredited',
          description:
            'Gas Safe registered with £5m public liability cover, Worcester Bosch Diamond and Vaillant Advance accreditation — details available on request.',
        },
        {
          title: 'Fixed-price quotes',
          description:
            'Itemised, flat-rate quotes within 24 hours of the survey — clear scope, clear figures and no surprises mid-job.',
        },
      ],
    },

    aboutFaq: {
      eyebrow: 'FAQs',
      heading: 'Frequently asked questions',
      subheading:
        'Common questions about how we work, what we cover and what to expect from first call to handover.',
      items: [
        {
          question: 'Are your engineers employed or do you use subcontractors?',
          answer:
            'Every engineer who crosses your threshold is a directly employed, full-time, uniformed member of the Vanguard team. They are background-checked, regularly assessed and hold active Gas Safe registration. We never subcontract — so quality control is consistent from the first cut to the final snag check.',
        },
        {
          question: 'Do you offer free quotes?',
          answer:
            'Yes — all surveys, system design consultations and itemised quotes for new heating systems or bathroom renovations are free, transparent and carry no obligation. On-site survey first, then a fixed-price quote, usually within 24 hours of the visit.',
        },
        {
          question: 'What areas do you cover?',
          answer:
            'Altrincham, Sale, Stretford, Urmston, Chorlton, Didsbury, Stockport, Wilmslow, Cheadle, Bramhall, Timperley, Knutsford and the surrounding Greater Manchester and North Cheshire postcodes — within roughly 25 miles of Altrincham for planned work.',
        },
        {
          question: 'Are you insured and Gas Safe registered?',
          answer:
            'Yes — we are Gas Safe registered and hold £5 million in public liability and £10 million in employers’ liability insurance. We are also Worcester Bosch Diamond accredited and Vaillant Advance Master installers, and members of CIPHE and WaterSafe.',
        },
        {
          question: 'Can you work evenings or weekends?',
          answer:
            'Routine servicing, landlord Gas Safety certificates and minor works can be scheduled on Saturdays (08:00–13:00) by arrangement to suit busy working professionals. Our 24/7 emergency line is available outside normal hours for active leaks and breakdowns.',
        },
        {
          question: 'Do you clean up and remove old equipment?',
          answer:
            'Yes — floor protectors down, boot covers on and M-class dust extraction on power tools. We remove and recycle old boilers, cylinders, bathroom suites and debris on the day via a licensed waste carrier, and leave your home cleaner than we found it.',
        },
      ],
    },

    aboutCta: {
      eyebrow: 'Get in touch',
      heading: 'Get a free quote',
      subheading: 'Send a few details and you’ll get a clear, fixed-price quote back, usually within 24 hours.',
    },

    contactHero: {
      eyebrow: 'Contact',
      heading: 'Let’s talk about your project',
      subheading:
        'Send a few details about the work and you’ll get a fixed-price quote back, usually within 24 hours. Or call direct — phone is always quickest, and our emergency line is open 24/7.',
    },

    contactFormTitle: 'Send a message',

    privacyHero: {
      eyebrow: 'Legal',
      heading: 'Privacy Policy',
      subheading:
        'Last updated: 28 May 2026 — how we handle your personal information when you contact us through this website.',
    },

    areaHeroAltPrefix: 'Plumbing & heating',

    pageSeo: {
      home: {
        title: 'Plumber & Heating Engineer in Altrincham & Greater Manchester',
        description:
          'Gas Safe registered boiler installation, emergency plumbing repairs, luxury bathrooms, servicing, power flushing and underfloor heating across Altrincham, Sale, Stockport, Wilmslow, Didsbury and the wider Greater Manchester and North Cheshire area.',
      },
      aboutDescription:
        'A Gas Safe registered plumbing and heating team covering Greater Manchester and North Cheshire — boiler installation, emergency repairs, bathrooms, servicing, power flushing and underfloor heating.',
      contactDescription:
        'Get in touch with {site}. Free fixed-price quotes for plumbing and heating across Greater Manchester and North Cheshire.',
    },
  },

  // -------------------------------------------------------------------------
  // Navigation + footer
  // -------------------------------------------------------------------------
  navigation: {
    items: [
      {label: 'About', href: '/about'},
      {label: 'Gallery', href: '/gallery'},
      {label: 'Projects', href: '/projects'},
      {label: 'Blog', href: '/blog'},
      {label: 'Contact', href: '/contact'},
    ],
    cta: {label: 'Get a Quote', href: '/quote', variant: 'primary'},
  },

  footer: {
    columns: [
      {
        title: 'Company',
        links: [
          {label: 'About', href: '/about'},
          {label: 'Projects', href: '/projects'},
          {label: 'Blog', href: '/blog'},
          {label: 'Contact', href: '/contact'},
        ],
      },
    ],
    legal: [{label: 'Privacy Policy', href: '/privacy-policy'}],
  },

  // -------------------------------------------------------------------------
  // SEO keyword seeds
  // -------------------------------------------------------------------------
  seoSeeds: {
    keywords: [
      'plumber',
      'heating engineer',
      'boiler installation',
      'boiler replacement',
      'emergency plumber',
      'gas safe engineer',
      'bathroom renovation',
      'power flush',
      'underfloor heating',
      'landlord gas safety certificate',
    ],
  },
}
