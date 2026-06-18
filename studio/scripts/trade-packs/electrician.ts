/**
 * ELECTRICIAN trade pack — the fictional "Voltvane Electrical" demo.
 *
 * Mirrors the STRUCTURE of plumber.ts exactly; only the CONTENT differs. This
 * is a LEAN but COMPLETE pack — every required TradePack field is present, but
 * lighter than the plumber reference where it's just bulk content (6 services,
 * 6 areas, 3 projects, 3 posts).
 *
 * Every contact detail is deliberately reserved/fake (.example domain, 0xx 555
 * 0xxx phone range, Ofcom-reserved 07700 900xxx WhatsApp) so no real data ships.
 * Reviews are intentionally DISABLED (DMCC — no fabricated ratings); the two
 * demo testimonials are clearly-fictional placeholders the client replaces.
 */
import type {TradePack, StepTuple, IconLabel} from './types'

// ---------------------------------------------------------------------------
// Shared (reused across multiple service docs)
// ---------------------------------------------------------------------------

const SHARED_TRUST_SIGNALS: IconLabel[] = [
  ['ShieldCheck', 'NICEIC Approved'],
  ['Clock', 'Rapid Response'],
  ['Star', '5-Star Rated'],
  ['Tag', 'Free Quotes'],
]

const SHARED_STEPS: StepTuple[] = [
  [
    'Phone',
    'Enquiry & consultation',
    'Get in touch by phone, email or the quote form. We talk through your existing installation, the issue or upgrade you want, and book a free survey.',
  ],
  [
    'ClipboardList',
    'On-site survey',
    'A qualified electrician inspects your consumer unit, earthing, circuit layout and cable runs, taking the readings the job actually needs before quoting.',
  ],
  [
    'Ruler',
    'Fixed-price proposal',
    'You receive a clear, itemised fixed-price quote within 24 hours. The figure quoted is exactly what you pay — no hidden extras, no surprises.',
  ],
  [
    'BadgeCheck',
    'Installation & certification',
    'NICEIC-registered electricians carry out the work tidily and to BS 7671, then test, certify and notify Building Control, walking you through everything before sign-off.',
  ],
]

// Areas each service links out to (a subset of the area pages).
const SERVICE_AREAS = ['altrincham', 'sale', 'didsbury', 'stockport']

const SITE = 'Voltvane Electrical'
// Production canonical host is the www subdomain. Reserved .example domain.
const URL = 'https://www.voltvane.example'
const PHONE_DISPLAY = '0161 555 0148'
const PHONE_TEL = '+441615550148'
const EMAIL = 'enquiries@voltvane.example'

// Trust badges shown beneath each hero.
const TRUST_BADGES = [
  {icon: 'ShieldCheck', label: 'NICEIC Approved'},
  {icon: 'Clock', label: '24/7 Emergency Callout'},
  {icon: 'Star', label: '5-Star Rated'},
  {icon: 'Tag', label: 'Free Quotes'},
]

const AREAS_6 = ['Altrincham', 'Sale', 'Didsbury', 'Stockport', 'Stretford', 'Urmston']

export const electrician: TradePack = {
  trade: 'electrician',

  // -------------------------------------------------------------------------
  // Business identity + structured data
  // -------------------------------------------------------------------------
  business: {
    siteTitle: SITE,
    legalName: 'Voltvane Electrical Contractors Ltd',
    url: URL,
    phoneDisplay: PHONE_DISPLAY,
    phoneTel: PHONE_TEL,
    email: EMAIL,
    whatsappNumber: '447700900148',
    address: {
      street: '12 Stamford Street',
      locality: 'Altrincham',
      region: 'Greater Manchester',
      postcode: 'WA14 1ES',
      country: 'GB',
    },
    geo: {latitude: 53.3831, longitude: -2.3534},
    foundingDate: '2014-06-01',
    founder: {name: 'Ryan Voss', jobTitle: 'Founder & Approved Electrician'},
    sameAs: [
      'http://maps.google.com/?cid=voltvaneelectricalmcr0148',
      'https://www.facebook.com/voltvaneelectrical',
    ],
    priceRange: '££',
    currency: 'GBP',
    areaServed: 'Greater Manchester & North Cheshire',
    description:
      'Voltvane Electrical is an NICEIC approved electrical contractor covering Altrincham, Sale, Didsbury, Stockport and the wider Greater Manchester and North Cheshire area — fuse board upgrades, EICR certificates, EV charger installation, rewires and emergency callouts.',
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
    title: `${SITE} | NICEIC Electrician, Altrincham & Greater Manchester`,
    description:
      'NICEIC approved electrician across Greater Manchester and North Cheshire — fuse board upgrades, EICR safety certificates, EV charger installation, full and partial rewires, lighting and 24/7 emergency callouts. Free quotes, fully insured.',
  },

  structuredData: {
    services: [
      'Fuse Board & Consumer Unit Upgrades',
      'EICR & Electrical Safety Certificates',
      'EV Charger Installation',
      'Full & Partial Rewires',
      'Lighting Design & Installation',
      'Electrical Fault Finding & Emergency Callouts',
    ],
    areaServedCities: AREAS_6,
    reviews: {
      enabled: false,
      ratingValue: 5,
      reviewCount: 0,
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
  // Services (6)
  // -------------------------------------------------------------------------
  services: [
    {
      slug: 'fuse-board-consumer-unit-upgrades',
      name: 'Fuse Board & Consumer Unit Upgrades',
      h1: 'Fuse Board Upgrades in Greater Manchester',
      icon: 'Zap',
      order: 10,
      summary:
        '18th Edition consumer unit upgrades across Greater Manchester — RCBO protection on every circuit and SPD surge protection as standard, with full testing and certification.',
      overview: [
        'Fuse board and consumer unit upgrades across Greater Manchester and North Cheshire for homeowners and landlords in [Altrincham](/areas/altrincham), Sale, Didsbury and the wider service area. If you still have an old rewireable fuse board, plastic enclosure or a board without RCD protection, an upgrade to a modern metal-clad consumer unit brings your installation up to current 18th Edition (BS 7671) standards and protects everyone in the property.',
        'We fit dual-RCD or, where appropriate, full RCBO boards so a fault on one circuit no longer trips the whole house, and we install a surge protection device (SPD) as standard to shield sensitive electronics from spikes. Every upgrade includes a full test of the existing installation, a circuit-by-circuit schedule, an Electrical Installation Certificate, and Building Control notification handled for you under Part P.',
      ],
      pricingIndication:
        'Consumer unit upgrades from £450 (dual-RCD) and from £650 for a full RCBO board with SPD, depending on circuit count and remedial work. Free fixed-price quote.',
      whatsIncluded: [
        [
          'Modern metal-clad consumer unit',
          'A new BS 7671-compliant metal (non-combustible) consumer unit replacing your old plastic or rewireable board, sized to your circuit count with room for future additions.',
        ],
        [
          'RCBO protection per circuit',
          'RCBO or dual-RCD protection so an earth fault or overload on one circuit no longer plunges the whole property into darkness — only the affected circuit trips.',
        ],
        [
          'Surge protection device (SPD)',
          'A Type 2 surge protection device fitted as standard to protect TVs, computers, EV chargers and other sensitive electronics from transient voltage spikes.',
        ],
        [
          'Full installation test & certificate',
          'A full test of the existing circuits before changeover, with any C1/C2 dangers flagged, plus an Electrical Installation Certificate issued on completion.',
        ],
        [
          'Part P Building Control notification',
          'All Part P building regulations notification handled and lodged for you through our NICEIC registration — the compliance paperwork sorted, not left to you.',
        ],
      ],
      steps: SHARED_STEPS,
      faqs: [
        [
          'How do I know if my fuse board needs upgrading?',
          'Common signs are an old rewireable fuse board with ceramic fuses or rewirable wire, a plastic enclosure, no RCD (the test button), or frequent unexplained tripping. Boards without RCD protection no longer meet 18th Edition standards. If you are unsure, we can carry out an inspection and tell you honestly whether an upgrade is genuinely needed.',
        ],
        [
          'How long does a consumer unit upgrade take?',
          'A straightforward changeover is usually completed in a single day, with the power off only for a few hours while we transfer the circuits across. If the existing installation has faults or borderline circuits that need remedial work to pass, we explain that at survey and confirm any extra time before starting.',
        ],
        [
          'Why does a new board need RCBOs and an SPD?',
          'RCBOs combine overload and earth-fault protection on each individual circuit, so a single fault no longer trips the whole house. A surge protection device (SPD) guards against voltage spikes from the grid or lightning that can damage expensive electronics. Both are recommended under the current 18th Edition and are fitted as standard on our upgrades.',
        ],
        [
          'Will the work be certified and notified?',
          'Yes. Every upgrade is tested and issued with an Electrical Installation Certificate, and as an NICEIC approved contractor we notify Building Control under Part P on your behalf — so the work is fully compliant and you have the paperwork for sale, insurance or letting.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'Fuse Board Upgrades in Greater Manchester',
      metaDescription:
        '18th Edition consumer unit and fuse board upgrades across Greater Manchester — RCBO protection, SPD surge protection, full testing and Part P certification.',
    },
    {
      slug: 'eicr-electrical-safety-certificates',
      name: 'EICR & Electrical Safety Certificates',
      h1: 'EICR Certificates for Landlords in Greater Manchester',
      icon: 'ShieldCheck',
      order: 20,
      summary:
        'EICR electrical safety inspections and certificates for landlords and homeowners across Greater Manchester — clear C1/C2/C3 coding, fast digital reports and quick remedial quotes.',
      overview: [
        'EICR (Electrical Installation Condition Report) inspections and certificates across Greater Manchester and North Cheshire for landlords and homeowners in [Didsbury](/areas/didsbury), Sale, Stockport and the wider service area. Since 2020, landlords in England must have a satisfactory EICR carried out at least every five years, and we make that obligation straightforward — a thorough inspection, plain-English coding, and a quick turnaround on the report.',
        'Our inspecting electrician tests every circuit, checks earthing and bonding, RCD operation and the condition of the consumer unit, then codes any issues clearly: C1 (danger present), C2 (potentially dangerous) and C3 (improvement recommended). A report with no C1 or C2 codes is satisfactory. Where remedial work is needed to make it pass, you receive a separate fixed-price quote up front — no pressure, no surprises.',
      ],
      pricingIndication:
        'Domestic EICR from £120 for a typical flat or small house, up to around £180 for larger properties. Remedial work quoted separately and clearly before any is carried out.',
      whatsIncluded: [
        [
          'Full circuit-by-circuit inspection',
          'A complete inspection and test of every circuit, earthing and bonding, RCD operation and the consumer unit, against the 18th Edition (BS 7671) standard.',
        ],
        [
          'Clear C1/C2/C3 coding',
          'Every observation coded in plain English — C1 (danger), C2 (potentially dangerous), C3 (improvement recommended) — so you know exactly what, if anything, needs doing.',
        ],
        [
          'Fast digital report',
          'A signed digital EICR emailed to you (and your managing agent for landlord jobs) promptly after the inspection, ready for letting, sale or insurance.',
        ],
        [
          'Up-front remedial quote',
          'If anything is coded C1 or C2, a separate fixed-price remedial quote so you can get the installation to a satisfactory pass without any surprise charges.',
        ],
      ],
      steps: [
        [
          'Phone',
          'Book the inspection',
          'Choose a morning or afternoon slot to suit you or your tenant via a quick call or the online form — no all-day waiting around.',
        ],
        [
          'ClipboardList',
          'Test & inspect',
          'Our electrician tests every circuit, earthing, bonding and RCDs and inspects the consumer unit and accessible wiring against BS 7671.',
        ],
        [
          'FileText',
          'Coded digital report',
          'You receive a signed digital EICR with any issues clearly coded C1/C2/C3, emailed to you and your managing agent for landlord jobs.',
        ],
        [
          'BadgeCheck',
          'Remedials if needed',
          'If anything fails, we quote the remedial work up front at a fixed price and reissue a satisfactory certificate once it is put right.',
        ],
      ],
      faqs: [
        [
          'How often does a landlord need an EICR?',
          'Under the Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020, landlords must have a satisfactory EICR carried out at least every five years, and provide a copy to tenants. New tenancies require a valid report before the tenant moves in. We email the digital certificate to you and your agent promptly so you stay compliant.',
        ],
        [
          'What do the C1, C2 and C3 codes mean?',
          'C1 means danger is present and immediate action is required. C2 means potentially dangerous and remedial work is needed. C3 means improvement is recommended but the installation is not unsafe. A report is only satisfactory if it has no C1 or C2 codes — C3 items do not cause a fail but are worth addressing.',
        ],
        [
          'What happens if my property fails the EICR?',
          'If the report comes back unsatisfactory due to C1 or C2 codes, we give you a clear, fixed-price quote for the remedial work needed to make it pass. Once that work is done we reissue a satisfactory certificate. We never use a fail as a scare tactic — only genuine safety issues are coded as such.',
        ],
        [
          'Do homeowners need an EICR too?',
          'It is not a legal requirement for owner-occupiers, but an EICR is strongly recommended every ten years, when buying a property, or if you have an older installation. It gives you peace of mind that your wiring is safe and flags anything that needs attention before it becomes a problem.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'EICR Certificates for Landlords, Greater Manchester',
      metaDescription:
        'EICR electrical safety inspections and certificates across Greater Manchester — clear C1/C2/C3 coding, fast digital reports, up-front remedial quotes.',
    },
    {
      slug: 'ev-charger-installation',
      name: 'EV Charger Installation',
      h1: 'EV Charger Installation in Greater Manchester',
      icon: 'Plug',
      order: 30,
      summary:
        'Home and workplace EV charge point installation across Greater Manchester — OZEV approved installers, tethered or untethered 7kW units, smart scheduling and dedicated protected circuits.',
      overview: [
        'EV charger installation across Greater Manchester and North Cheshire for homeowners and businesses in [Sale](/areas/sale), Altrincham, Stockport and the wider service area. As OZEV approved installers we fit smart 7kW home charge points — tethered (fixed cable) or untethered (socket only) — on a dedicated, properly protected circuit, sized and routed to your property after a free survey.',
        'Every installation includes its own RCD and overcurrent protection, load assessment to confirm your supply can take the charger, and smart scheduling so you can charge on cheaper off-peak tariffs. We handle Part P notification and DNO paperwork where required, and advise on any available grants you may qualify for, such as the EV chargepoint grant for flats and rental properties.',
      ],
      pricingIndication:
        'A standard 7kW home charger installation from £750 including the unit, dedicated circuit and protection. Untethered and tethered options available. Free survey and quote.',
      whatsIncluded: [
        [
          'OZEV approved smart charger',
          'A smart 7kW charge point from a leading brand — tethered (built-in cable) or untethered (socket only) — installed by an OZEV approved installer.',
        ],
        [
          'Dedicated protected circuit',
          'Its own dedicated circuit run from the consumer unit with the correct RCD and overcurrent protection, never spurred off an existing socket circuit.',
        ],
        [
          'Load assessment',
          'A maximum-demand load assessment to confirm your incoming supply can safely take the charger, with load management fitted where needed.',
        ],
        [
          'Smart scheduling setup',
          'The charger paired to its app and set up for off-peak scheduling so you can charge overnight on cheaper EV tariffs and track your usage.',
        ],
        [
          'Certification & notification',
          'Full electrical certification, Part P notification and DNO paperwork where required, all handled on your behalf.',
        ],
      ],
      steps: [
        [
          'Phone',
          'Free survey',
          'We discuss your vehicle, parking and supply, and assess the best charger location and cable route — often with photos to save a visit.',
        ],
        [
          'Ruler',
          'Fixed-price quote',
          'You receive a clear fixed-price quote covering the unit, the dedicated circuit, protection and any load management needed.',
        ],
        [
          'Plug',
          'Installation',
          'We run the dedicated circuit, mount and connect the charger, fit the correct protection and tidy the cable run neatly to your wall.',
        ],
        [
          'BadgeCheck',
          'Test, app & handover',
          'The charger is tested and certified, paired to its app for off-peak scheduling, and we walk you through charging your vehicle before sign-off.',
        ],
      ],
      faqs: [
        [
          'Should I choose a tethered or untethered charger?',
          'A tethered unit has a fixed cable always attached — convenient and quick to plug in. An untethered unit has just a socket, so you use your own cable and it keeps the wall unit tidier and futureproof if you change cars. Both charge at the same speed; it comes down to convenience versus neatness, and we will talk you through which suits you.',
        ],
        [
          'How long does an EV charger installation take?',
          'A typical home installation takes around half a day, depending on how far the charger is from your consumer unit and the cable route. We confirm the route and any complications at the survey so there are no surprises, and you can usually charge your vehicle the same day.',
        ],
        [
          'Do I need my supply or fuse board checked first?',
          'Yes — we carry out a load assessment to confirm your incoming supply can safely take a 7kW charger alongside your existing demand, and check your consumer unit has space and suitable protection. Where the supply is tight we can fit load management so the charger reduces its draw when the house demand is high.',
        ],
        [
          'Are there any grants available?',
          'The EV chargepoint grant is available for some flat owners, renters and people in certain property types, and there are workplace and landlord schemes too. Eligibility changes over time, so we advise on what currently applies to your situation and handle the OZEV-side paperwork where you qualify.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'EV Charger Installation in Greater Manchester',
      metaDescription:
        'OZEV approved EV charger installation across Greater Manchester — tethered or untethered 7kW units, dedicated protected circuits, smart scheduling. Free survey.',
    },
    {
      slug: 'full-partial-rewires',
      name: 'Full & Partial Rewires',
      h1: 'House Rewires in Greater Manchester',
      icon: 'Home',
      order: 40,
      summary:
        'Full and partial house rewires across Greater Manchester — new circuits, sockets and lighting wired to the 18th Edition, with a new consumer unit, careful making-good and full certification.',
      overview: [
        'Full and partial rewires across Greater Manchester and North Cheshire for homeowners and landlords in [Stockport](/areas/stockport), Altrincham, Stretford and the wider service area. If your property has old rubber or fabric-insulated cabling, too few sockets, or wiring that has failed an EICR, a rewire brings the whole installation up to current 18th Edition standards safely and tidily.',
        'A full rewire replaces all the cabling, sockets, switches and the consumer unit, with new circuits planned around how you actually use each room. A partial rewire targets specific circuits — a kitchen, an extension or a failed circuit — without disturbing the rest. We work room by room to minimise disruption, make good chased walls, and issue a full Electrical Installation Certificate with Part P notification on completion.',
      ],
      pricingIndication:
        'Partial rewires from around £900 per area; a full rewire of a typical three-bedroom house from £3,500 to £5,500 depending on size, access and finish. Free fixed-price quote.',
      whatsIncluded: [
        [
          'New circuits to 18th Edition',
          'All new cabling, sockets, switches and lighting points wired to the current BS 7671 standard, with circuits planned around how you use each room.',
        ],
        [
          'New consumer unit & protection',
          'A new metal-clad consumer unit with RCBO protection and an SPD included as part of a full rewire, so the whole installation is brought up to date.',
        ],
        [
          'Room-by-room working',
          'We work methodically room by room to keep your home usable where possible and minimise the disruption a rewire inevitably involves.',
        ],
        [
          'Chasing & making good',
          'Walls and ceilings chased for concealed cabling and made good ready for redecoration, with care taken to keep mess to a minimum.',
        ],
        [
          'Full certification & notification',
          'An Electrical Installation Certificate issued on completion and Part P Building Control notification handled for you through our NICEIC registration.',
        ],
      ],
      steps: SHARED_STEPS,
      faqs: [
        [
          'How do I know if my house needs rewiring?',
          'Signs include old rubber, fabric or lead-sheathed cabling, a fuse board with no RCD, frequent tripping, scorched or warm sockets, or a property that has not been rewired in 30-plus years. An EICR will confirm the condition objectively — if it comes back with widespread C1 or C2 codes, a rewire is often the most sensible long-term fix.',
        ],
        [
          'How long does a full rewire take?',
          'A typical three-bedroom house takes around five to ten working days depending on size, access and how much making-good is involved. We give you a realistic schedule at survey and work room by room to keep as much of the home usable as possible throughout.',
        ],
        [
          'Will a rewire make a lot of mess?',
          'Rewiring involves lifting floorboards and chasing walls, so some disruption is unavoidable, but we keep it controlled — dust sheets down, careful chasing and walls made good ready for decoration. We talk through exactly what to expect at survey so you can plan around it.',
        ],
        [
          'Can you do just part of the house?',
          'Yes. A partial rewire targets specific circuits — a kitchen, a new extension or a circuit that has failed an EICR — without disturbing sound existing wiring. We will advise honestly whether a partial rewire is enough or whether a full rewire is the better value over time.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'House Rewires in Greater Manchester',
      metaDescription:
        'Full and partial house rewires across Greater Manchester — new circuits, consumer unit and sockets to the 18th Edition, careful making-good and full certification.',
    },
    {
      slug: 'lighting-design-installation',
      name: 'Lighting Design & Installation',
      h1: 'Lighting Design & Installation in Greater Manchester',
      icon: 'Sparkles',
      order: 50,
      summary:
        'Interior and outdoor lighting design and installation across Greater Manchester — energy-efficient LED downlights, dimmable and smart lighting, plus garden and security lighting.',
      overview: [
        'Lighting design and installation across Greater Manchester and North Cheshire for homeowners in [Altrincham](/areas/altrincham), Didsbury, Sale and the wider service area. From a single new light fitting to a whole-home lighting scheme for a renovation or extension, we design layouts that balance bright, even task lighting with warm, layered mood lighting.',
        'We install energy-efficient LED downlights (fire-rated where needed), dimmable circuits, under-cabinet and feature lighting, and smart lighting you can control from your phone or voice assistant. Outdoors we fit garden, patio and PIR security lighting on properly protected circuits. Every installation is tested and certified, with any new circuits notified under Part P.',
      ],
      pricingIndication:
        'Replacing a light fitting from £60; a room of LED downlights from around £280; whole-home and smart lighting schemes quoted on survey. Free fixed-price quote.',
      whatsIncluded: [
        [
          'Lighting layout design',
          'A practical lighting layout balancing task, ambient and feature lighting for each room, designed around how you actually use the space.',
        ],
        [
          'Energy-efficient LED',
          'Low-energy LED downlights and fittings — fire-rated where they penetrate ceilings — for bright light at a fraction of the running cost of halogen.',
        ],
        [
          'Dimming & smart control',
          'Dimmable circuits, smart switches and app- or voice-controlled lighting set up so you can create scenes and control rooms from your phone.',
        ],
        [
          'Outdoor & security lighting',
          'Garden, patio and PIR security lighting installed on properly protected, weather-rated circuits for safety and kerb appeal.',
        ],
        [
          'Tested, certified & notified',
          'Every installation tested and certified, with any new circuits notified to Building Control under Part P on your behalf.',
        ],
      ],
      steps: [
        [
          'Phone',
          'Design consultation',
          'We discuss the look you want, room by room, and recommend a layout that balances bright task light with warmer mood lighting.',
        ],
        [
          'Ruler',
          'Fixed-price quote',
          'You receive a clear quote covering fittings, circuits, dimming or smart controls and any chasing or making-good required.',
        ],
        [
          'Sparkles',
          'Installation',
          'We install the fittings, run any new circuits, fit dimmers or smart switches and make good neatly ready for decoration.',
        ],
        [
          'BadgeCheck',
          'Test & handover',
          'Everything is tested and certified, scenes and dimming set up to your taste, and we walk you through the controls before sign-off.',
        ],
      ],
      faqs: [
        [
          'Can you replace my halogen downlights with LED?',
          'Yes — swapping old halogen downlights for modern LED is one of our most popular lighting jobs. LED fittings use a fraction of the energy, run cooler and last far longer. Where the lights penetrate a ceiling we use fire-rated fittings to maintain the ceiling’s fire integrity, as required.',
        ],
        [
          'Do you install smart lighting?',
          'Yes. We install smart switches and lighting systems you can control from an app or voice assistant, set up dimming scenes for different times of day, and integrate it with the rest of your smart home. We will recommend a system that suits how you want to use it rather than the most expensive option.',
        ],
        [
          'Can you add outdoor and security lighting?',
          'Yes — we install garden, patio and feature lighting as well as PIR sensor security lighting, all on properly protected, weather-rated circuits. Outdoor lighting improves both safety and the look of your home, and we route and protect it correctly so it lasts.',
        ],
        [
          'Will new lighting circuits be certified?',
          'Yes. Any new circuit is tested, certified with an Electrical Installation Certificate and, where it falls under Part P, notified to Building Control on your behalf through our NICEIC registration.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'Lighting Design & Installation, Greater Manchester',
      metaDescription:
        'Interior and outdoor lighting design and installation across Greater Manchester — LED downlights, dimmable and smart lighting, garden and security lighting.',
    },
    {
      slug: 'electrical-fault-finding-emergency-callouts',
      name: 'Electrical Fault Finding & Emergency Callouts',
      h1: 'Emergency Electrician in Greater Manchester',
      icon: 'Siren',
      order: 60,
      summary:
        '24/7 emergency electrician and fault finding across Greater Manchester — tripping circuits, power loss, burning smells and dead sockets diagnosed and made safe fast, with transparent pricing.',
      overview: [
        'Electrical fault finding and emergency callouts across Greater Manchester and North Cheshire for tripping circuits, total power loss, burning smells and dead sockets in [Stockport](/areas/stockport), Sale, Didsbury and the wider service area. A repeatedly tripping RCD or a burning smell from a socket is exactly the kind of call we keep rapid-response slots open for, day and night.',
        'Our electricians systematically isolate and test each circuit to pinpoint the fault — a faulty appliance, a damaged cable, water ingress or a failing accessory — rather than guessing. We make the installation safe first, explain what we have found with the test readings, and give you a clear price to put it right before any repair work begins.',
      ],
      pricingIndication:
        'Daytime callout (Mon–Fri 8am–6pm) £75 including the first hour; out-of-hours and weekend £120. The first hour of diagnosis is included — no hidden travel fees.',
      whatsIncluded: [
        [
          'Rapid emergency response',
          'A priority callout from a qualified electrician for tripping circuits, power loss, burning smells and dead sockets — day or night, every day of the year.',
        ],
        [
          'Systematic fault finding',
          'Each circuit isolated and tested in turn to pinpoint the exact fault — a faulty appliance, damaged cable, water ingress or failing accessory — rather than guesswork.',
        ],
        [
          'Made safe first',
          'The installation made safe immediately so you and your property are protected, before we move on to diagnosis and a permanent repair.',
        ],
        [
          'Transparent pricing',
          'A clear flat callout rate including the first hour of diagnosis, explained before any work starts — no hidden travel fees or surprise bills.',
        ],
        [
          'On-the-spot repair',
          'Common faults repaired there and then from the stock carried on the van, with any larger remedial work quoted clearly up front.',
        ],
      ],
      steps: [
        [
          'Phone',
          'Emergency call',
          'Call our line and describe what is happening — the team talks you through making things safe, such as turning off the affected circuit, while we head over.',
        ],
        [
          'Truck',
          'Rapid arrival',
          'An electrician is dispatched quickly across our core postcodes to get to you and make the installation safe.',
        ],
        [
          'Search',
          'Diagnose & quote',
          'We systematically test each circuit to find the fault, explain it with the readings, and give you a clear price before any repair begins.',
        ],
        [
          'BadgeCheck',
          'Repair & certify',
          'The fault is repaired, the circuit retested to confirm it is safe, and a minor works certificate issued for the repair.',
        ],
      ],
      faqs: [
        [
          'My RCD keeps tripping — what is wrong?',
          'A repeatedly tripping RCD usually means an earth fault somewhere — often a faulty appliance, moisture in an outdoor circuit, or a damaged cable. We isolate each circuit in turn to find the source rather than just resetting it. Persistent tripping should never be ignored, as the RCD is protecting you from a genuine fault.',
        ],
        [
          'I can smell burning near a socket — what should I do?',
          'Turn off the circuit at the consumer unit if you can do so safely, stop using the socket, and call us straight away. A burning smell points to overheating or arcing, which is a real fire risk. This is exactly the kind of emergency we prioritise — do not wait for it to get worse.',
        ],
        [
          'Do you charge a big fee for a minor fault?',
          'No. We charge a transparent flat callout rate that includes the first hour of diagnosis, and if the fault is fixed within that hour using stock from the van you pay nothing more than the baseline rate. You always know the rate before we start, with no hidden travel charges added at the end.',
        ],
        [
          'Do you cover evenings and weekends?',
          'Yes — our emergency line runs day and night, including evenings, weekends and bank holidays. Out-of-hours and weekend callouts are a clear flat £120 (versus £75 in standard daytime hours), with the first hour included and no hidden travel fees.',
        ],
      ],
      areasServed: SERVICE_AREAS,
      metaTitle: 'Emergency Electrician in Greater Manchester',
      metaDescription:
        '24/7 emergency electrician and fault finding across Greater Manchester — tripping circuits, power loss, burning smells and dead sockets made safe fast. Flat-rate.',
    },
  ],

  // -------------------------------------------------------------------------
  // Areas (6)
  // -------------------------------------------------------------------------
  areas: [
    {
      slug: 'altrincham',
      name: 'Altrincham',
      order: 10,
      geo: {latitude: 53.3831, longitude: -2.3534},
      intro: [
        'Electricians covering Altrincham — our home patch, taking in Bowdon, Hale and Hale Barns across the WA14 and WA15 postcodes. The area’s mix of large period villas and high-spec modern homes keeps us busy with full and partial [rewires](/services/full-partial-rewires), [fuse board upgrades](/services/fuse-board-consumer-unit-upgrades) and whole-home [lighting schemes](/services/lighting-design-installation).',
        'As our base postcode, turnaround on surveys, EICRs and emergency callouts is fastest here, with no travel charge across WA14 and WA15. NICEIC approved, free fixed-price quotes, and 24/7 emergency cover for tripping circuits and power loss.',
      ],
      coverageNote:
        'Covering Altrincham, Bowdon, Hale, Hale Barns and Broadheath across the WA14 and WA15 postcodes.',
      faqs: [
        [
          'Do you cover Hale and Bowdon?',
          'Yes — Hale, Hale Barns and Bowdon are part of standard coverage along with Altrincham town centre and Broadheath, with no travel charge across WA14 and WA15. We carry out a lot of rewires, fuse board upgrades and lighting work on the larger period and detached homes in these areas.',
        ],
        [
          'How quickly can you reach me in an electrical emergency in Altrincham?',
          'Altrincham is our base, so it sits at the centre of our rapid-response area. We aim to reach genuine emergencies — tripping circuits, power loss, burning smells — quickly across WA14 and WA15, making the installation safe before diagnosing the fault.',
        ],
      ],
      metaTitle: 'Electrician in Altrincham',
      metaDescription:
        'NICEIC approved electrician in Altrincham, Hale and Bowdon (WA14/WA15). Rewires, fuse board upgrades, EICRs, EV chargers and 24/7 emergencies. Free quotes.',
    },
    {
      slug: 'sale',
      name: 'Sale',
      order: 20,
      geo: {latitude: 53.424, longitude: -2.322},
      intro: [
        'Electricians covering Sale, Sale Moor, Brooklands and Ashton-on-Mersey across the M33 postcodes. The area’s 1930s semis and modern apartments generate steady demand for [fuse board upgrades](/services/fuse-board-consumer-unit-upgrades), [EV charger installation](/services/ev-charger-installation) on driveways, and [EICR certificates](/services/eicr-electrical-safety-certificates) for the local rental market.',
        'Coverage spans the full M33 area with no travel charge. NICEIC approved, free fixed-price quotes, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Sale, Sale Moor, Brooklands and Ashton-on-Mersey across the M33 postcodes.',
      faqs: [
        [
          'Do you install EV chargers in Sale?',
          'Yes — EV charger installation is one of our most popular Sale jobs given the number of driveways across the M33 semis. As OZEV approved installers we fit smart 7kW chargers on a dedicated protected circuit, with smart scheduling for cheaper off-peak charging.',
        ],
        [
          'Can you provide landlord EICR certificates in Sale?',
          'Yes — Sale has a busy rental market, and we provide EICR safety certificates every five years as the law requires, emailing the digital report to you and your managing agent promptly, with any remedial work quoted clearly up front.',
        ],
      ],
      metaTitle: 'Electrician in Sale',
      metaDescription:
        'NICEIC approved electrician in Sale, Sale Moor and Brooklands (M33). Fuse board upgrades, EV chargers, EICRs and 24/7 emergencies. Free fixed-price quotes.',
    },
    {
      slug: 'didsbury',
      name: 'Didsbury',
      order: 30,
      geo: {latitude: 53.413, longitude: -2.2314},
      intro: [
        'Electricians covering Didsbury — premium period homes in East Didsbury and busy professional apartments in West Didsbury, around Burton Road and the M20 area. We carry out plenty of [lighting design](/services/lighting-design-installation), [consumer unit upgrades](/services/fuse-board-consumer-unit-upgrades) and [EICRs](/services/eicr-electrical-safety-certificates) for the area’s many landlords.',
        'Coverage spans the full M20 postcodes with no travel charge. NICEIC approved, free fixed-price quotes, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Didsbury Village, West Didsbury and East Didsbury across the M20 postcodes.',
      faqs: [
        [
          'Do you work with Didsbury landlords and apartment managers?',
          'Yes — Didsbury’s many professional and student apartments generate steady EICR and remedial work. We provide five-yearly EICR certificates emailed to you and your managing agent, plus reactive repairs and fault finding.',
        ],
        [
          'Can you design lighting for a period home?',
          'Yes — lighting design is popular across Didsbury’s period properties and apartments. We design layouts that balance task and mood lighting, install energy-efficient LED and smart controls, and certify any new circuits.',
        ],
      ],
      metaTitle: 'Electrician in Didsbury',
      metaDescription:
        'NICEIC approved electrician in Didsbury (M20). Lighting design, consumer unit upgrades, landlord EICRs and 24/7 emergency callouts. Free fixed-price quotes.',
    },
    {
      slug: 'stockport',
      name: 'Stockport',
      order: 40,
      geo: {latitude: 53.4106, longitude: -2.1575},
      intro: [
        'Electricians covering Stockport and the surrounding SK postcodes — a large, varied borough of red-brick terraces, valley properties and mill conversions. The mix of older housing keeps us busy with [rewires](/services/full-partial-rewires), [emergency fault finding](/services/electrical-fault-finding-emergency-callouts) and landlord [EICRs](/services/eicr-electrical-safety-certificates).',
        'Coverage spans the Stockport SK postcodes, and the town sits within our rapid-response area. NICEIC approved, free fixed-price quotes, and 24/7 emergency cover for tripping circuits and power loss.',
      ],
      coverageNote:
        'Covering Stockport town centre, Edgeley, Heaton Moor and Davenport across the SK postcodes.',
      faqs: [
        [
          'Can you rewire an older Stockport terrace?',
          'Yes — the borough’s older terraces often have dated cabling that benefits from a full or partial rewire. We work room by room to keep disruption down, fit a new consumer unit, make good chased walls and issue full certification on completion.',
        ],
        [
          'How quickly can you reach me in an emergency in Stockport?',
          'Stockport sits within our rapid-response area, so we aim to reach genuine emergencies — tripping circuits, power loss, burning smells — quickly across the SK postcodes, making the installation safe before diagnosing the fault.',
        ],
      ],
      metaTitle: 'Electrician in Stockport',
      metaDescription:
        'NICEIC approved electrician in Stockport (SK). Rewires, emergency fault finding, landlord EICRs and consumer unit upgrades. Free fixed-price quotes.',
    },
    {
      slug: 'stretford',
      name: 'Stretford',
      order: 50,
      geo: {latitude: 53.448, longitude: -2.308},
      intro: [
        'Electricians covering Stretford, Old Trafford and Firswood across the M32 postcodes. The area’s Edwardian and mid-century terraces, with their ageing wiring and large rental sector, generate frequent [rewires](/services/full-partial-rewires), [fuse board upgrades](/services/fuse-board-consumer-unit-upgrades) and landlord [EICRs](/services/eicr-electrical-safety-certificates).',
        'Coverage spans the M32 postcodes with no travel charge. NICEIC approved, free fixed-price quotes, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Stretford, Old Trafford and Firswood across the M32 postcodes.',
      faqs: [
        [
          'Do you provide landlord EICRs in Stretford?',
          'Yes — Stretford has a large rental market, and we provide five-yearly EICR safety certificates with clear C1/C2/C3 coding, emailing the digital report to you and your managing agent and quoting any remedial work up front.',
        ],
        [
          'Can you upgrade an old fuse board in an Edwardian terrace?',
          'Yes — many of Stretford’s older terraces still have rewireable boards without RCD protection. We upgrade these to a modern metal-clad consumer unit with RCBO protection and an SPD, test the installation and handle Part P notification.',
        ],
      ],
      metaTitle: 'Electrician in Stretford',
      metaDescription:
        'NICEIC approved electrician in Stretford and Old Trafford (M32). Rewires, fuse board upgrades, landlord EICRs and 24/7 emergencies. Free fixed-price quotes.',
    },
    {
      slug: 'urmston',
      name: 'Urmston',
      order: 60,
      geo: {latitude: 53.4477, longitude: -2.3527},
      intro: [
        'Electricians covering Urmston, Flixton and Davyhulme across the M41 postcodes — a family-focused area of post-war semis and modern extensions. We carry out plenty of [lighting installations](/services/lighting-design-installation), kitchen and extension circuits, [EV chargers](/services/ev-charger-installation) and [consumer unit upgrades](/services/fuse-board-consumer-unit-upgrades) here.',
        'Coverage spans the M41 postcodes with no travel charge. NICEIC approved, free fixed-price quotes, and 24/7 emergency cover every day of the year.',
      ],
      coverageNote:
        'Covering Urmston, Flixton and Davyhulme across the M41 postcodes.',
      faqs: [
        [
          'Can you do the electrics for my kitchen extension?',
          'Yes — extension and kitchen electrical work is one of our most active Urmston jobs. We run new circuits for sockets, appliances and lighting, integrate them safely into your existing board, and certify and notify the work under Part P.',
        ],
        [
          'Do you install EV chargers in Urmston?',
          'Yes — with so many driveways across the M41 semis, EV charger installation is popular here. As OZEV approved installers we fit smart 7kW chargers on a dedicated protected circuit with smart off-peak scheduling.',
        ],
      ],
      metaTitle: 'Electrician in Urmston',
      metaDescription:
        'NICEIC approved electrician in Urmston, Flixton and Davyhulme (M41). Lighting, extension circuits, EV chargers and 24/7 emergencies. Free fixed-price quotes.',
    },
  ],

  // -------------------------------------------------------------------------
  // Projects (3)
  // -------------------------------------------------------------------------
  projects: [
    {
      slug: 'full-rewire-consumer-unit-stretford',
      title: 'Full Rewire & Consumer Unit Upgrade, Stretford',
      services: ['full-partial-rewires', 'fuse-board-consumer-unit-upgrades'],
      area: 'stretford',
      summary:
        'A 1920s Stretford terrace with ageing rubber-insulated wiring and a rewireable fuse board, fully rewired to the 18th Edition with a new RCBO consumer unit and SPD.',
      body:
        'A 1920s terraced house in Stretford, M32, came to us after an EICR returned multiple C2 codes against its original rubber-insulated cabling and an old rewireable fuse board with no RCD protection. The owners were preparing to let the property and needed a satisfactory installation. We carried out a full rewire to the current 18th Edition (BS 7671): all the cabling, sockets, switches and lighting points renewed, with circuits planned around how each room is actually used and extra sockets added where they were short. The old board was replaced with a modern metal-clad consumer unit fitted with RCBO protection on every circuit and a Type 2 surge protection device. We worked methodically room by room to keep disruption manageable, chased walls for concealed cabling and made everything good ready for redecoration. On completion the installation was fully tested, issued with an Electrical Installation Certificate, and notified to Building Control under Part P — turning a failed EICR into a safe, lettable installation.',
      completedAt: '2026-04-12',
      metaTitle: 'Full Rewire & Consumer Unit Upgrade, Stretford',
      metaDescription:
        'A 1920s Stretford terrace rewired to the 18th Edition with a new RCBO consumer unit and SPD after a failed EICR — fully tested, certified and Part P notified.',
    },
    {
      slug: 'ev-charger-installation-sale',
      title: 'Smart 7kW EV Charger Installation, Sale',
      services: ['ev-charger-installation'],
      area: 'sale',
      summary:
        'An OZEV approved 7kW untethered smart charger installed on a 1930s semi driveway in Sale, on a dedicated protected circuit with off-peak scheduling set up.',
      body:
        'A homeowner in Sale, M33, had just taken delivery of their first electric vehicle and wanted a proper home charge point rather than relying on public chargers. After a quick photo survey we confirmed the charger location, the cable route from the consumer unit and that the incoming supply could comfortably take a 7kW unit alongside the household demand. We installed an OZEV approved 7kW untethered smart charger — the owner preferred a socket-only unit to keep the wall tidy and use their own cable — on its own dedicated circuit run from the board, with the correct RCD and overcurrent protection. The cable run was clipped neatly and discreetly along the side of the house to the driveway. We paired the charger to its app and set up off-peak scheduling so the car charges overnight on a cheaper EV tariff, then tested and certified the installation and walked the owner through charging their vehicle. The whole job was completed in half a day, with Part P notification handled afterwards.',
      completedAt: '2026-03-08',
      metaTitle: 'Smart 7kW EV Charger Installation, Sale',
      metaDescription:
        'An OZEV approved 7kW untethered smart EV charger installed on a Sale driveway — dedicated protected circuit, neat cable run and off-peak scheduling set up.',
    },
    {
      slug: 'lighting-scheme-renovation-didsbury',
      title: 'Whole-Home LED Lighting Scheme, Didsbury',
      services: ['lighting-design-installation'],
      area: 'didsbury',
      summary:
        'A complete lighting redesign for a renovated Didsbury period home — fire-rated LED downlights, dimmable circuits and smart switches creating layered light throughout.',
      body:
        'A period home in Didsbury, M20, undergoing a full renovation needed a lighting scheme to match. The owners wanted bright, even task lighting in the kitchen and bathrooms but warmer, layered mood lighting in the living and bedroom spaces — all controllable and energy efficient. We designed the layout room by room, balancing task, ambient and feature lighting, then installed fire-rated LED downlights where the fittings penetrated ceilings, under-cabinet lighting in the kitchen, and feature lighting to pick out the period detail. Every relevant circuit was put on a dimmer, and smart switches were fitted so the owners can set scenes for different times of day and control rooms from their phones. New circuits were run where the layout required, chased in and made good ready for decoration. On completion the whole installation was tested and certified, with the new circuits notified under Part P. The result is a flexible, low-energy lighting scheme that suits both the everyday practicality and the character of the home.',
      completedAt: '2026-02-15',
      metaTitle: 'Whole-Home LED Lighting Scheme, Didsbury',
      metaDescription:
        'A whole-home LED lighting scheme for a renovated Didsbury period home — fire-rated downlights, dimmable circuits and smart switches, tested and certified.',
    },
  ],

  // -------------------------------------------------------------------------
  // Person (blog author)
  // -------------------------------------------------------------------------
  person: {
    id: 'person-ryan-voss',
    firstName: 'Ryan',
    lastName: 'Voss',
    slug: 'ryan-voss',
  },

  // -------------------------------------------------------------------------
  // Blog posts (3)
  // -------------------------------------------------------------------------
  posts: [
    {
      slug: 'do-i-need-a-fuse-board-upgrade',
      title: 'Do I Need a Fuse Board Upgrade?',
      date: '2026-04-18',
      excerpt:
        'An old fuse board can be a real safety risk. Here are the signs your consumer unit needs upgrading, and what a modern 18th Edition board actually gives you.',
      content: [
        'Your fuse board — properly called a consumer unit — is the heart of your home’s electrical safety. It is what cuts the power when something goes wrong. Yet many homes are still running old boards that no longer meet current standards, and the owners have no idea they are at risk. Here is how to tell whether yours needs upgrading.',
        '## The signs your board is out of date',
        'Look for these warning signs: an old board with ceramic fuses or rewirable fuse wire rather than switches; a plastic enclosure rather than metal; no RCD (the test button you should press every few months); frequent unexplained tripping; or scorch marks and a warm board. Any of these point to a consumer unit that no longer meets the 18th Edition (BS 7671) standard and should be assessed.',
        '## What a modern board gives you',
        'A modern metal-clad consumer unit brings two big safety improvements. First, RCD or RCBO protection that detects earth faults and cuts the power in a fraction of a second — protecting you from electric shock. With RCBOs on each circuit, a single fault no longer trips the whole house. Second, a surge protection device (SPD) that guards your TVs, computers and [EV charger](/services/ev-charger-installation) against damaging voltage spikes.',
        '## Will an upgrade disrupt my home?',
        'A straightforward consumer unit upgrade is usually a single-day job, with the power off only for a few hours while we transfer the circuits across. Occasionally the existing installation has faults that must be put right for the new board to pass its tests — we always check first and explain any remedial work and cost before starting, so there are no surprises.',
        '## Getting it done properly',
        'Every upgrade we carry out includes a full test of the existing installation, an Electrical Installation Certificate, and Part P Building Control notification handled for you through our NICEIC registration. If you are unsure whether your board needs replacing, the honest answer comes from an inspection — book a free [quote](/quote) and we will tell you straight whether an upgrade is genuinely needed. You can read more about what an upgrade involves on our [fuse board upgrades](/services/fuse-board-consumer-unit-upgrades) page.',
      ],
    },
    {
      slug: 'eicr-explained-for-landlords',
      title: 'EICR Explained: A Landlord’s Guide to Electrical Safety Certificates',
      date: '2026-04-25',
      excerpt:
        'Every landlord in England needs a satisfactory EICR. Here is what it is, how often you need one, what the C1/C2/C3 codes mean, and what happens if you fail.',
      content: [
        'Since 2020, landlords in England have had a legal duty to keep the electrical installation in their rental properties safe — and the certificate that proves it is the EICR. It is one of the most important pieces of compliance in the rental sector, and one of the most misunderstood. This is a plain-English guide to what an EICR is and what it means for you as a landlord.',
        '## What an EICR actually is',
        'An EICR — Electrical Installation Condition Report — is a formal inspection and test of the fixed wiring in a property, carried out by a qualified electrician. It checks the consumer unit, circuits, earthing and bonding, RCD operation and the condition of accessible wiring and accessories, against the 18th Edition (BS 7671) standard. The report tells you whether the installation is safe to continue in use.',
        '## What the law requires',
        'Under the Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020, landlords must have a satisfactory EICR carried out at least every five years, provide a copy to tenants, and supply a valid report to new tenants before they move in. A local authority can request the report and issue fines for non-compliance, so this is a legal duty, not best practice.',
        '## What the C1, C2 and C3 codes mean',
        'Any issue found is coded. C1 means danger is present — immediate action required. C2 means potentially dangerous — remedial work needed. C3 means improvement recommended, but the installation is not unsafe. A report is only satisfactory if it has no C1 or C2 codes. C3 items do not cause a fail but are worth addressing when convenient. Our [EICR service](/services/eicr-electrical-safety-certificates) explains every code in plain English.',
        '## What happens if you fail',
        'If the report is unsatisfactory because of C1 or C2 codes, you must have the remedial work carried out — generally within 28 days — and obtain written confirmation that the installation now meets the standard. We provide a clear, fixed-price remedial quote up front and reissue a satisfactory certificate once the work is done, so a fail is simply a fixable step rather than a crisis.',
        '## Making compliance simple',
        'The practical goal is never having to worry about it. We carry out the inspection at a time that suits your tenant, email the digital report to you and your managing agent promptly, and flag the renewal date so the five-yearly check never slips. Book your EICR through the [quote](/quote) form and we will keep your property compliant year after year.',
      ],
    },
    {
      slug: 'ev-charger-install-what-to-know',
      title: 'EV Charger Installation: What to Know Before You Book',
      date: '2026-05-02',
      excerpt:
        'Thinking about a home EV charger? Here is what to know about tethered vs untethered units, dedicated circuits, smart charging and grants before you book.',
      content: [
        'Charging an electric car at home is far cheaper and more convenient than relying on public chargers — but a proper installation is more than just bolting a box to the wall. Here is what to understand before you book a home charge point, so you get a safe, efficient setup that suits how you drive.',
        '## Tethered or untethered?',
        'A tethered charger has a fixed cable always attached, so you just plug straight into the car — quick and convenient. An untethered charger has only a socket, so you use your own cable, which keeps the wall unit tidier and futureproofs you if you change vehicles. Both charge at the same 7kW speed; the choice comes down to convenience versus neatness.',
        '## It needs its own circuit',
        'A safe EV charger installation is always run on its own dedicated circuit straight from the consumer unit, with the correct RCD and overcurrent protection — never spurred off an existing socket circuit. Before fitting, a good installer carries out a load assessment to confirm your incoming supply can take a 7kW charger alongside the rest of the house, and fits load management if the supply is tight. See our [EV charger installation](/services/ev-charger-installation) page for what is included.',
        '## Smart charging saves money',
        'Modern chargers are smart: paired to an app, they let you schedule charging for off-peak hours when EV electricity tariffs are far cheaper, and track your usage. Setting this up properly at installation is where a lot of the long-term savings come from, so it is worth doing from day one rather than leaving the charger on a flat-rate tariff.',
        '## Grants and approved installers',
        'There are still grants available for some flat owners, renters and certain property types, plus workplace and landlord schemes — eligibility changes over time. Use an OZEV approved installer (as we are), both so you can access any grant you qualify for and so the work is certified and notified correctly under Part P.',
        '## Getting it booked',
        'Most home installations take around half a day, and we can often quote from a few photos before visiting. If you are considering a home charger, send a few details through the [quote](/quote) form — your vehicle, where you park and where your fuse board is — and we will recommend the right unit and give you a clear fixed price.',
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // Section copy (home + marketing pages)
  // -------------------------------------------------------------------------
  sections: {
    trustBadges: TRUST_BADGES,

    homeHero: {
      eyebrow: 'NICEIC Approved Electrician · Greater Manchester',
      heading: 'Safe, certified electrical work across Greater Manchester',
      subheading:
        'Fuse board upgrades, EICR safety certificates, EV charger installation, rewires, lighting and 24/7 emergency callouts from an NICEIC approved, fully insured team covering Altrincham, Sale, Didsbury, Stockport and the wider North Cheshire area.',
    },

    homeIntro: {
      eyebrow: `About ${SITE}`,
      heading: 'Local, NICEIC approved and fully insured',
      body: [
        'A responsive, professional electrical service for homeowners and landlords across Greater Manchester and North Cheshire. Every job is carried out to the 18th Edition (BS 7671), tested, certified and notified under Part P — combining proper standards and safety with the care, punctuality and honest, upfront pricing of a trusted local business.',
      ],
      checklist: [
        'Fuse board & consumer unit upgrades',
        'EICR & electrical safety certificates',
        'EV charger installation',
        'Full & partial rewires',
      ],
    },

    serviceCards: {
      eyebrow: 'What we do',
      heading: 'Our services',
      subheading:
        'From a single fault or an EICR to a full rewire, an EV charger or a whole-home lighting scheme — the same NICEIC standards and fixed-price transparency on every job.',
      cards: [
        {
          title: 'Fuse Board & Consumer Unit Upgrades',
          description:
            '18th Edition consumer units with RCBO protection on every circuit and SPD surge protection as standard.',
          href: '/services/fuse-board-consumer-unit-upgrades',
        },
        {
          title: 'EICR & Electrical Safety Certificates',
          description:
            'Landlord and homeowner electrical safety inspections with clear C1/C2/C3 coding and fast digital reports.',
          href: '/services/eicr-electrical-safety-certificates',
        },
        {
          title: 'EV Charger Installation',
          description:
            'OZEV approved 7kW home and workplace charge points on dedicated protected circuits with smart scheduling.',
          href: '/services/ev-charger-installation',
        },
        {
          title: 'Full & Partial Rewires',
          description:
            'New circuits, sockets and lighting wired to the 18th Edition, with a new consumer unit and full certification.',
          href: '/services/full-partial-rewires',
        },
        {
          title: 'Lighting Design & Installation',
          description:
            'Energy-efficient LED, dimmable and smart lighting for interiors, plus garden and security lighting outdoors.',
          href: '/services/lighting-design-installation',
        },
        {
          title: 'Electrical Fault Finding & Emergency Callouts',
          description:
            '24/7 fault finding for tripping circuits, power loss and burning smells — made safe fast, with transparent pricing.',
          href: '/services/electrical-fault-finding-emergency-callouts',
        },
      ],
    },

    whyChooseUs: {
      eyebrow: 'Why choose us',
      heading: 'Electrical work, done safely and properly',
      subheading:
        'Electrical services across Greater Manchester with fixed-price quotes, NICEIC approved electricians and a tidy, accountable approach.',
      reasons: [
        {
          title: 'NICEIC approved',
          description:
            'Every electrician is a directly employed, qualified professional working to the 18th Edition — we never use subcontractors.',
        },
        {
          title: 'Tidy & reliable',
          description:
            'Floor protectors down, boot covers on, careful chasing and the site left cleaner than we found it.',
        },
        {
          title: 'Fixed-price quotes',
          description:
            'On-site survey followed by an itemised, flat-rate quote — the price we quote is exactly what you pay.',
        },
        {
          title: 'Local to Greater Manchester',
          description:
            'Covering Altrincham, Sale, Didsbury, Stockport, Stretford, Urmston and the surrounding areas.',
        },
      ],
    },

    process: {
      eyebrow: 'How it works',
      heading: 'Simple from quote to finish',
      subheading:
        'From first enquiry to certification, the process is straightforward — clear communication, work to BS 7671, and finished on the timeline we agreed.',
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
            'On-site survey to assess the work and your installation. A fixed-price quote follows, usually within 24 hours.',
        },
        {
          icon: 'Wrench',
          title: 'The work',
          description:
            'Carried out tidily and on schedule to the 18th Edition, with floors protected and daily clean-down.',
        },
        {
          icon: 'Sparkles',
          title: 'Test & certify',
          description:
            'We test and certify everything, notify Building Control under Part P, and walk you through the work.',
        },
      ],
    },

    testimonials: {
      eyebrow: 'What our customers say',
      heading: 'Trusted across Greater Manchester',
      items: [
        {
          quote:
            'This is a placeholder demo testimonial. Replace it with a real, attributable customer review before the site goes live — Voltvane Electrical is a fictional demo business and this quote is illustrative only.',
          authorName: 'Demo Review (placeholder)',
          rating: 5,
        },
      ],
      aggregateRatingValue: 5,
      aggregateReviewCount: 0,
      aggregateSourceName: 'Google',
      reviewsUrl: 'http://maps.google.com/?cid=voltvaneelectricalmcr0148',
      leaveReviewUrl: 'http://maps.google.com/?cid=voltvaneelectricalmcr0148',
    },

    blogSection: {
      eyebrow: 'From the blog',
      heading: 'Tips & recent posts',
    },

    homeCta: {
      eyebrow: 'Get in touch',
      heading: 'Ready to sort your electrics?',
      subheading:
        'Send a few details about your project and you’ll get a fixed-price quote back, usually within 24 hours.',
    },

    homeContactFormTitle: 'Request a free quote',

    aboutHero: {
      eyebrow: 'About',
      heading: `About ${SITE}`,
      subheading:
        'An NICEIC approved electrical team covering Altrincham, Sale, Didsbury, Stockport and the wider Greater Manchester and North Cheshire area.',
    },

    aboutIntro: {
      eyebrow: 'Our story',
      heading: 'Proper standards with local care',
      body: [
        'Voltvane Electrical was founded by approved electrician Ryan Voss in 2014, after years working on large commercial and domestic installations across the North West. Frustrated by inconsistent scheduling and patchy accountability elsewhere, he started Voltvane with a clear philosophy: combine the technical standards and safety protocols of a serious contractor with the care, punctuality and honest pricing of a trusted local business.',
        'Today Voltvane is a tightly knit team of NICEIC approved electricians serving homeowners and landlords across Greater Manchester and North Cheshire. We never employ pushy salespeople or cut corners with cheap materials. We work to the 18th Edition on every job, test and certify everything we do, and treat each property as if it were our own — on time, tidy, and charging exactly what we quote.',
      ],
      checklist: [
        'Fuse board & consumer unit upgrades',
        'EICR & electrical safety certificates',
        'EV charger installation & rewires',
        'Lighting, fault finding & emergency callouts',
      ],
    },

    aboutWhyChooseUs: {
      eyebrow: 'What sets us apart',
      heading: 'A proper standard, accountable from start to finish',
      subheading:
        'An NICEIC approved electrical team covering Greater Manchester — fixed-price quotes, directly employed electricians and a tidy, certified finish.',
      reasons: [
        {
          title: 'Experienced',
          description:
            'Over a decade of hands-on installation and fault-finding experience across period and modern properties throughout Greater Manchester and Cheshire.',
        },
        {
          title: 'Fully insured & approved',
          description:
            'NICEIC approved with public liability cover and work certified to the 18th Edition — details available on request.',
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
        'Common questions about how we work, what we cover and what to expect from first call to certification.',
      items: [
        {
          question: 'Are your electricians employed or do you use subcontractors?',
          answer:
            'Every electrician who crosses your threshold is a directly employed, full-time member of the Voltvane team. They are qualified, regularly assessed and work under our NICEIC approval. We never subcontract — so quality control is consistent from the first cable run to the final certificate.',
        },
        {
          question: 'Do you offer free quotes?',
          answer:
            'Yes — all surveys and itemised quotes for upgrades, rewires, EV chargers, lighting and other work are free and carry no obligation. On-site survey first, then a fixed-price quote, usually within 24 hours of the visit.',
        },
        {
          question: 'What areas do you cover?',
          answer:
            'Altrincham, Sale, Didsbury, Stockport, Stretford, Urmston and the surrounding Greater Manchester and North Cheshire postcodes — within roughly 25 miles of Altrincham for planned work.',
        },
        {
          question: 'Are you insured and NICEIC approved?',
          answer:
            'Yes — we are an NICEIC approved contractor and hold public liability and employers’ liability insurance. All our work is carried out to the 18th Edition (BS 7671), tested, certified and notified to Building Control under Part P where required.',
        },
        {
          question: 'Do you certify and notify your work?',
          answer:
            'Yes — every job is tested and issued with the appropriate certificate (an Electrical Installation Certificate or Minor Works Certificate), and notifiable work is registered with Building Control under Part P on your behalf through our NICEIC registration.',
        },
        {
          question: 'Do you clean up and remove old equipment?',
          answer:
            'Yes — floor protectors down, boot covers on, and careful chasing to keep mess to a minimum. We remove and recycle old boards, fittings and debris on the day via a licensed waste carrier, and leave your home cleaner than we found it.',
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

    areaHeroAltPrefix: 'Electrical work',

    pageSeo: {
      home: {
        title: 'Electrician in Altrincham & Greater Manchester',
        description:
          'NICEIC approved fuse board upgrades, EICR certificates, EV charger installation, rewires, lighting and 24/7 emergency callouts across Altrincham, Sale, Didsbury, Stockport and the wider Greater Manchester and North Cheshire area.',
      },
      aboutDescription:
        'An NICEIC approved electrical team covering Greater Manchester and North Cheshire — fuse board upgrades, EICRs, EV chargers, rewires, lighting and emergency callouts.',
      contactDescription:
        'Get in touch with {site}. Free fixed-price quotes for electrical work across Greater Manchester and North Cheshire.',
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
      'electrician near me',
      'EICR',
      'fuse board replacement',
      'consumer unit upgrade',
      'EV charger installation',
      'house rewire cost',
      'Part P electrician',
      'emergency electrician',
    ],
  },
}
