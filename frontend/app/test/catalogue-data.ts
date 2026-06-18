/**
 * Dummy data for the /test component catalogue.
 *
 * Conventions / decisions (see report):
 *  - ALL Sanity images are omitted (set to `null`/`undefined`) so every component
 *    shows its graceful empty-image placeholder. We never use fake asset _refs
 *    because SanityImage would render a broken <img> (404). No component checked
 *    crashes on a missing image — they all gate on `asset?._ref`.
 *  - Header logo is omitted on purpose so the header shows its `siteTitle` text
 *    fallback (the logo path expects a real CDN URL via next/image, not a Sanity ref).
 *  - Blocks are typed `any` to avoid fighting the generated Sanity types; the build
 *    will tighten/surface any real shape errors.
 *  - Buttons/links use the resolver-friendly shape:
 *      { buttonText, link: { _type:'link', linkType:'href', href, openInNewTab:false, page:null, post:null } }
 *  - Portable Text uses fully-formed blocks with _key/markDefs/marks.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type Sample = {label: string; block: any}

// --- helpers ---------------------------------------------------------------

const href = (text: string, url: string) => ({
  buttonText: text,
  _type: 'button',
  link: {_type: 'link', linkType: 'href', href: url, openInNewTab: false, page: null, post: null},
})

const pt = (text: string, key = 'pt') => [
  {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-s`, text, marks: []}],
  },
]

// =====================================================================
// A — hero / trust / problem / solution
// =====================================================================

export const heroBannerSamples: Sample[] = [
  {
    label: 'banner',
    block: {
      _type: 'heroBanner',
      _key: 'hero-banner',
      variant: 'banner',
      eyebrow: 'Trusted local experts',
      heading: 'Premium service, done right the first time',
      subheading: 'Friendly, reliable professionals serving your area for over a decade.',
      theme: 'dark',
      textAlignment: 'center',
      backgroundImage: null,
      primaryButton: href('Call now', 'tel:+441234567890'),
      secondaryButton: href('Message us', 'https://wa.me/441234567890'),
      trustBadges: [
        {_key: 'tb1', icon: 'ShieldCheck', label: 'Fully insured'},
        {_key: 'tb2', icon: 'Clock', label: '24/7 availability'},
        {_key: 'tb3', icon: 'Star', label: '5-star rated'},
        {_key: 'tb4', icon: 'Tag', label: 'Free quotes'},
      ],
      slides: [],
      autoPlay: false,
      interval: 5,
      availableServices: [{name: 'Installation'}, {name: 'Repairs'}, {name: 'Maintenance'}],
    },
  },
  {
    label: 'splitImage',
    block: {
      _type: 'heroBanner',
      _key: 'hero-split-image',
      variant: 'splitImage',
      eyebrow: 'Welcome',
      heading: 'Work you can rely on',
      subheading: 'Clear pricing, tidy work, and a guarantee on everything we do.',
      theme: 'light',
      mediaSide: 'right',
      backgroundImage: null,
      primaryButton: href('Get a quote', '/contact'),
      secondaryButton: href('Our services', '/services'),
      trustBadges: [
        {_key: 'tb1', icon: 'ShieldCheck', label: 'Fully insured'},
        {_key: 'tb2', icon: 'Star', label: '5-star rated'},
      ],
      availableServices: [{name: 'Installation'}, {name: 'Repairs'}],
    },
  },
  {
    label: 'splitForm (embeds real QuoteForm — async)',
    block: {
      _type: 'heroBanner',
      _key: 'hero-split-form',
      variant: 'splitForm',
      eyebrow: 'Fast response',
      heading: 'Tell us what you need',
      subheading: 'Send a few details and we will get back to you the same day.',
      theme: 'dark',
      mediaSide: 'left',
      backgroundImage: null,
      primaryButton: href('Call now', 'tel:+441234567890'),
      trustBadges: [{_key: 'tb1', icon: 'Clock', label: 'Same-day reply'}],
      availableServices: [{name: 'Installation'}, {name: 'Repairs'}, {name: 'Maintenance'}],
    },
  },
  {
    label: 'carousel',
    block: {
      _type: 'heroBanner',
      _key: 'hero-carousel-variant',
      variant: 'carousel',
      autoPlay: true,
      interval: 5,
      textAlignment: 'left',
      slides: [
        {
          _key: 's1',
          _type: 'heroSlide',
          eyebrow: 'Quality first',
          heading: 'Craftsmanship that lasts',
          subheading: 'We take pride in every detail.',
          backgroundImage: null,
          primaryButton: href('Explore services', '/services'),
          secondaryButton: null,
          theme: 'dark',
        },
        {
          _key: 's2',
          _type: 'heroSlide',
          eyebrow: 'Local & trusted',
          heading: 'A team you can count on',
          subheading: 'Hundreds of happy customers nearby.',
          backgroundImage: null,
          primaryButton: href('Get a quote', '/contact'),
          secondaryButton: null,
          theme: 'dark',
        },
      ],
    },
  },
]

export const heroCarouselSamples: Sample[] = [
  {
    label: 'standalone heroCarousel',
    block: {
      _type: 'heroCarousel',
      _key: 'hero-carousel-standalone',
      autoPlay: true,
      interval: 5,
      textAlignment: 'center',
      slides: [
        {
          _key: 's1',
          _type: 'heroSlide',
          eyebrow: 'Slide one',
          heading: 'Built for the long run',
          subheading: 'Durable solutions, fair prices.',
          backgroundImage: null,
          primaryButton: href('Learn more', '/about'),
          secondaryButton: null,
          theme: 'dark',
        },
        {
          _key: 's2',
          _type: 'heroSlide',
          eyebrow: 'Slide two',
          heading: 'Here when you need us',
          subheading: 'Rapid, dependable support.',
          backgroundImage: null,
          primaryButton: href('Contact us', '/contact'),
          secondaryButton: null,
          theme: 'dark',
        },
      ],
    },
  },
]

// trustBar — variants render ONLY when the relevant `trust` data exists.
const trustFull = {
  reviewsEnabled: true,
  rating: {ratingValue: 4.9, reviewCount: 240, bestRating: 5},
  platforms: [
    {platform: 'Google', score: '4.9', subLabel: '240 reviews', showStars: true},
    {platform: 'Trustpilot', score: '4.8', subLabel: '180 reviews', showStars: true},
    {platform: 'Facebook', score: '4.9', subLabel: '95 reviews', showStars: true},
  ],
  accreditations: [
    {icon: 'BadgeCheck', title: 'Accredited installer', sub: 'Industry approved'},
    {icon: 'Award', title: 'Award winning', sub: '3 years running'},
    {icon: 'ShieldCheck', title: 'Fully insured', sub: 'Up to £5m cover'},
  ],
  stat: {headline: '500+', sub: 'Jobs completed'},
  // press logos omitted (no image) → FeaturedIn falls back to the name text.
  press: [
    {name: 'Local Herald', logo: null},
    {name: 'City Times', logo: null},
    {name: 'Trade Weekly', logo: null},
  ],
}

export const trustBarSamples: Sample[] = [
  {
    label: 'compactLine',
    block: {_type: 'trustBar', _key: 'trust-compact', variant: 'compactLine', theme: 'light', trust: trustFull},
  },
  {
    label: 'aggregateScore',
    block: {_type: 'trustBar', _key: 'trust-agg', variant: 'aggregateScore', theme: 'dark', trust: trustFull},
  },
  {
    label: 'reviewCells',
    block: {_type: 'trustBar', _key: 'trust-cells', variant: 'reviewCells', theme: 'light', trust: trustFull},
  },
  {
    label: 'certifications',
    block: {
      _type: 'trustBar',
      _key: 'trust-certs',
      variant: 'certifications',
      heading: 'Licensed, certified & accredited',
      theme: 'light',
      trust: trustFull,
    },
  },
  {
    label: 'combinedBar',
    block: {_type: 'trustBar', _key: 'trust-combined', variant: 'combinedBar', theme: 'light', trust: trustFull},
  },
  {
    label: 'featuredIn (logos omitted → text fallback)',
    block: {
      _type: 'trustBar',
      _key: 'trust-featured',
      variant: 'featuredIn',
      heading: 'As featured in',
      theme: 'light',
      trust: trustFull,
    },
  },
]

export const problemSectionSamples: Sample[] = [
  {
    label: 'painCards',
    block: {
      _type: 'problemSection',
      _key: 'prob-pain',
      variant: 'painCards',
      eyebrow: 'The problem',
      title: 'Sound familiar?',
      lead: 'These are the headaches we hear about most often.',
      theme: 'light',
      pains: [
        {_key: 'p1', icon: 'Clock', title: 'Endless waiting', desc: 'Nobody turns up when they say they will.'},
        {_key: 'p2', icon: 'Dollar', title: 'Surprise costs', desc: 'The final bill never matches the quote.'},
        {_key: 'p3', icon: 'Alert', title: 'Patchy work', desc: 'Corners cut, problems left behind.'},
      ],
      reassurance: 'There is a better way — and we can show you.',
    },
  },
  {
    label: 'soundFamiliar',
    block: {
      _type: 'problemSection',
      _key: 'prob-sf',
      variant: 'soundFamiliar',
      eyebrow: 'Sound familiar?',
      title: 'Do any of these sound like you?',
      theme: 'light',
      painList: ['No-shows and missed appointments', 'Confusing, hidden pricing', 'Mess left behind'],
      reliefKicker: 'The good news',
      reliefLead: 'We do things differently.',
      fixes: ['On time, every time', 'Clear quotes up front', 'We leave it spotless'],
    },
  },
  {
    label: 'pullQuote',
    block: {
      _type: 'problemSection',
      _key: 'prob-pq',
      variant: 'pullQuote',
      theme: 'dark',
      quote: 'We had given up finding someone reliable — until now.',
      caption: '— A relieved customer',
      reliefTitle: 'You deserve better',
      reliefBody: 'With the right team, the whole experience changes.',
    },
  },
]

export const solutionSectionSamples: Sample[] = [
  {
    label: 'outcomeCards',
    block: {
      _type: 'solutionSection',
      _key: 'sol-oc',
      variant: 'outcomeCards',
      eyebrow: 'The solution',
      title: 'What you can expect from us',
      theme: 'white',
      outcomes: [
        {_key: 'o1', icon: 'Smile', title: 'Stress-free', desc: 'We handle everything, start to finish.'},
        {_key: 'o2', icon: 'Gauge', title: 'Fast turnaround', desc: 'Most jobs done in a single visit.'},
        {_key: 'o3', icon: 'ShieldCheck', title: 'Guaranteed', desc: 'Every job backed by our promise.'},
      ],
    },
  },
  {
    label: 'transformation',
    block: {
      _type: 'solutionSection',
      _key: 'sol-tr',
      variant: 'transformation',
      title: 'From frustration to done',
      theme: 'dark',
      beforeLabel: 'Before',
      afterLabel: 'After',
      rows: [
        {_key: 'r1', before: 'Chasing for a callback', after: 'Same-day response'},
        {_key: 'r2', before: 'Vague estimates', after: 'A clear written quote'},
        {_key: 'r3', before: 'Unfinished jobs', after: 'Finished and guaranteed'},
      ],
    },
  },
  {
    label: 'valuePromise (image omitted)',
    block: {
      _type: 'solutionSection',
      _key: 'sol-vp',
      variant: 'valuePromise',
      eyebrow: 'Why choose us',
      title: 'Our promise to you',
      lead: 'Measurable results and a service you will recommend.',
      theme: 'light',
      bullets: [
        {_key: 'b1', title: 'Experienced team', desc: 'Years of hands-on expertise.'},
        {_key: 'b2', title: 'On schedule', desc: 'We respect your time.'},
        {_key: 'b3', title: 'Fair pricing', desc: 'No surprises, ever.'},
      ],
      chip: '100% satisfaction',
      image: null,
    },
  },
]

// =====================================================================
// B — services / pricing / why-choose / process
// =====================================================================

export const servicesOverviewSamples: Sample[] = [
  {
    label: 'directory',
    block: {
      _type: 'servicesOverview',
      _key: 'svc-dir',
      variant: 'directory',
      eyebrow: 'Services',
      title: 'What we do',
      sub: 'Browse our full range of services.',
      theme: 'light',
      columns: 3,
      services: [
        {_key: 's1', title: 'Installation', sub: 'Professional fitting and setup', slug: 'installation', icon: 'Wrench', heroImage: null},
        {_key: 's2', title: 'Repairs', sub: 'Fast, lasting fixes', slug: 'repairs', icon: 'Hammer', heroImage: null},
        {_key: 's3', title: 'Maintenance', sub: 'Keep things running smoothly', slug: 'maintenance', icon: 'ShieldCheck', heroImage: null},
        {_key: 's4', title: 'Emergency call-out', sub: '24/7 rapid response', slug: 'emergency', icon: 'Siren', heroImage: null},
      ],
    },
  },
  {
    label: 'tiles (images omitted → solid bg)',
    block: {
      _type: 'servicesOverview',
      _key: 'svc-tiles',
      variant: 'tiles',
      eyebrow: 'Services',
      title: 'Explore our services',
      sub: 'Tap a tile to learn more.',
      theme: 'dark',
      columns: 3,
      services: [
        {_key: 's1', title: 'Installation', sub: 'Professional fitting and setup', slug: 'installation', icon: 'Wrench', heroImage: null},
        {_key: 's2', title: 'Repairs', sub: 'Fast, lasting fixes', slug: 'repairs', icon: 'Hammer', heroImage: null},
        {_key: 's3', title: 'Maintenance', sub: 'Keep things running smoothly', slug: 'maintenance', icon: 'ShieldCheck', heroImage: null},
      ],
    },
  },
]

export const pricingSectionSamples: Sample[] = [
  {
    label: 'promise',
    block: {
      _type: 'pricingSection',
      _key: 'price-promise',
      variant: 'promise',
      eyebrow: 'Pricing',
      title: 'Honest, transparent pricing',
      body: 'We believe in fair, upfront pricing with no hidden extras.',
      theme: 'light',
      ctaButton: href('Get a free quote', '/contact'),
      principles: [
        {_key: 'p1', title: 'No hidden fees', desc: 'The price we quote is the price you pay.'},
        {_key: 'p2', title: 'Free quotes', desc: 'Always free, with no obligation.'},
        {_key: 'p3', title: 'Fixed pricing', desc: 'Agreed before any work starts.'},
      ],
    },
  },
  {
    label: 'factors',
    block: {
      _type: 'pricingSection',
      _key: 'price-factors',
      variant: 'factors',
      eyebrow: 'How it works',
      title: 'What affects your quote',
      theme: 'light',
      factors: [
        {_key: 'f1', icon: 'FileText', title: 'Scope of work', desc: 'The size and complexity of the job.'},
        {_key: 'f2', icon: 'Package', title: 'Materials', desc: 'The products and parts required.'},
        {_key: 'f3', icon: 'Clock', title: 'Time on site', desc: 'How long the work takes to complete.'},
        {_key: 'f4', icon: 'MapPin', title: 'Location', desc: 'Travel and access considerations.'},
      ],
      reassurance: 'Every quote includes our 100% satisfaction guarantee.',
      ctaButton: href('Request a quote', '/contact'),
    },
  },
  {
    label: 'options',
    block: {
      _type: 'pricingSection',
      _key: 'price-options',
      variant: 'options',
      eyebrow: 'Pricing',
      title: 'Choose what suits you',
      theme: 'light',
      badgeText: 'Most popular',
      options: [
        {
          _key: 'opt1',
          icon: 'Package',
          name: 'Standard',
          price: 'From £X',
          note: 'per visit',
          who: 'For everyday jobs',
          includes: ['Free assessment', 'Written quote', '12-month guarantee'],
          featured: false,
          cta: href('Choose standard', '/contact'),
        },
        {
          _key: 'opt2',
          icon: 'ShieldCheck',
          name: 'Premium',
          price: 'From £Y',
          note: 'per visit',
          who: 'For complete peace of mind',
          includes: ['Everything in Standard', 'Priority booking', '24-month guarantee', 'Annual check-up'],
          featured: true,
          cta: href('Choose premium', '/contact'),
        },
      ],
    },
  },
]

export const whyChooseUsSamples: Sample[] = [
  {
    label: 'split (image omitted)',
    block: {
      _type: 'whyChooseUs',
      _key: 'why-split',
      variant: 'split',
      eyebrow: 'Why us',
      heading: 'Why customers choose us',
      subheading: 'A few of the reasons people keep coming back.',
      theme: 'light',
      imageAlignment: 'right',
      image: null,
      reasons: [
        {_key: 'r1', title: 'Experienced team', description: 'Over a decade in the trade.', icon: null},
        {_key: 'r2', title: 'Upfront pricing', description: 'Clear quotes, no surprises.', icon: null},
        {_key: 'r3', title: 'Guaranteed work', description: 'Backed by our promise.', icon: null},
      ],
      button: href('Get started', '/contact'),
    },
  },
  {
    label: 'editorial',
    block: {
      _type: 'whyChooseUs',
      _key: 'why-editorial',
      variant: 'editorial',
      eyebrow: 'What sets us apart',
      heading: 'The difference is in the details',
      theme: 'light',
      columns: 3,
      differentiators: [
        {_key: 'd1', icon: 'Clock', title: 'Always on time', desc: 'We value your schedule.'},
        {_key: 'd2', icon: 'ShieldCheck', title: 'Fully insured', desc: 'Complete peace of mind.'},
        {_key: 'd3', icon: 'Heart', title: 'Customer first', desc: 'You come first, always.'},
        {_key: 'd4', icon: 'Award', title: 'Award winning', desc: 'Recognised for quality.'},
        {_key: 'd5', icon: 'MapPin', title: 'Local team', desc: 'Right here in your area.'},
        {_key: 'd6', icon: 'Dollar', title: 'Great value', desc: 'Fair prices, top results.'},
      ],
    },
  },
  {
    label: 'guarantee',
    block: {
      _type: 'whyChooseUs',
      _key: 'why-guarantee',
      variant: 'guarantee',
      eyebrow: 'Our guarantee',
      heading: '100% satisfaction, guaranteed',
      subheading: 'We stand behind every job we do.',
      theme: 'light',
      differentiators: [
        {_key: 'd1', icon: 'ShieldCheck', title: 'Workmanship guarantee', desc: 'Covered as standard.'},
        {_key: 'd2', icon: 'Clock', title: 'On-time promise', desc: 'Or we make it right.'},
        {_key: 'd3', icon: 'Award', title: 'Quality assured', desc: 'Checked before we leave.'},
        {_key: 'd4', icon: 'Heart', title: 'Happy or fixed', desc: 'We will put it right.'},
      ],
    },
  },
  {
    label: 'compare',
    block: {
      _type: 'whyChooseUs',
      _key: 'why-compare',
      variant: 'compare',
      eyebrow: 'Comparison',
      heading: 'How we compare',
      theme: 'light',
      usLabel: 'Us',
      themLabel: 'Typical competitor',
      compareRows: [
        {_key: 'c1', label: 'Free written quotes', usHas: true},
        {_key: 'c2', label: 'Same-day response', usHas: true},
        {_key: 'c3', label: 'Workmanship guarantee', usHas: true},
        {_key: 'c4', label: 'Fully insured', usHas: true},
        {_key: 'c5', label: 'Tidy, respectful service', usHas: true},
      ],
    },
  },
]

export const processSectionSamples: Sample[] = [
  {
    label: 'grid',
    block: {
      _type: 'processSection',
      _key: 'proc-grid',
      variant: 'grid',
      eyebrow: 'How it works',
      heading: 'Our simple process',
      subheading: 'From first call to finished job.',
      theme: 'light',
      steps: [
        {_key: 's1', icon: 'Phone', title: 'Get in touch', description: 'Call or message us with your needs.'},
        {_key: 's2', icon: 'ClipboardList', title: 'Free quote', description: 'We assess and quote, no obligation.'},
        {_key: 's3', icon: 'Wrench', title: 'We do the work', description: 'Carried out by our expert team.'},
        {_key: 's4', icon: 'Check', title: 'All done', description: 'Finished, tidied, and guaranteed.'},
      ],
    },
  },
  {
    label: 'flow',
    block: {
      _type: 'processSection',
      _key: 'proc-flow',
      variant: 'flow',
      eyebrow: 'How it works',
      heading: 'Four easy steps',
      subheading: 'Straightforward from start to finish.',
      theme: 'light',
      steps: [
        {_key: 's1', icon: 'Phone', title: 'Contact', description: 'Tell us what you need.'},
        {_key: 's2', icon: 'ClipboardList', title: 'Plan', description: 'We agree the details.'},
        {_key: 's3', icon: 'Wrench', title: 'Deliver', description: 'We get it done.'},
      ],
    },
  },
  {
    label: 'timeline',
    block: {
      _type: 'processSection',
      _key: 'proc-timeline',
      variant: 'timeline',
      eyebrow: 'Our process',
      heading: 'What to expect',
      subheading: 'A clear path to a great result.',
      theme: 'light',
      steps: [
        {_key: 's1', icon: 'Phone', title: 'Initial consultation', description: 'We discuss your project.'},
        {_key: 's2', icon: 'Search', title: 'Assessment', description: 'We review the requirements.'},
        {_key: 's3', icon: 'Wrench', title: 'The work', description: 'Carried out to a high standard.'},
        {_key: 's4', icon: 'Check', title: 'Sign-off', description: 'We walk you through the result.'},
      ],
    },
  },
  {
    label: 'bigNumber',
    block: {
      _type: 'processSection',
      _key: 'proc-bignum',
      variant: 'bigNumber',
      eyebrow: 'Our approach',
      heading: 'Methodical and proven',
      subheading: 'Every step matters.',
      theme: 'light',
      steps: [
        {_key: 's1', icon: 'Search', title: 'Discovery', description: 'Understanding your goals.'},
        {_key: 's2', icon: 'ClipboardList', title: 'Planning', description: 'Mapping out the work.'},
        {_key: 's3', icon: 'Wrench', title: 'Execution', description: 'Delivering with care.'},
        {_key: 's4', icon: 'Check', title: 'Review', description: 'Making sure it is perfect.'},
      ],
    },
  },
]

// =====================================================================
// C — testimonials / faq / cta / intro / info
// =====================================================================

export const testimonialsSamples: Sample[] = [
  {
    label: 'cards (avatars omitted)',
    block: {
      _type: 'testimonials',
      _key: 'test-cards',
      variant: 'cards',
      eyebrow: 'Testimonials',
      heading: 'What our customers say',
      theme: 'light',
      items: [
        {_key: 'i1', quote: 'Prompt, professional and tidy. Could not be happier.', authorName: 'Sarah M.', authorLocation: 'Riverside', rating: 5, avatar: null},
        {_key: 'i2', quote: 'Fair price and a brilliant job. Highly recommend.', authorName: 'James T.', authorLocation: 'Oakfield', rating: 5, avatar: null},
        {_key: 'i3', quote: 'They turned up on time and got it sorted fast.', authorName: 'Priya K.', authorLocation: 'Greenway', rating: 5, avatar: null},
      ],
      reviewsUrl: 'https://www.google.com/',
      leaveReviewUrl: 'https://www.google.com/',
      aggregateRatingValue: 4.9,
      aggregateReviewCount: 240,
      aggregateSourceName: 'Google',
    },
  },
  {
    label: 'caseStudy (image omitted)',
    block: {
      _type: 'testimonials',
      _key: 'test-case',
      variant: 'caseStudy',
      eyebrow: 'Case study',
      heading: 'A complete transformation',
      caseBody: 'We took on a tired, dated space and turned it into something the customer loves — on time and on budget.',
      caseImage: null,
      caseCustomer: 'The Harper family',
      caseLocation: 'Hillcrest',
      caseBadge: 'Featured project',
      caseStats: [
        {_key: 'st1', value: '3 days', label: 'Total time'},
        {_key: 'st2', value: '100%', label: 'On budget'},
        {_key: 'st3', value: '5★', label: 'Customer rating'},
      ],
      theme: 'light',
    },
  },
  {
    label: 'resultsCTA (avatar omitted)',
    block: {
      _type: 'testimonials',
      _key: 'test-results',
      variant: 'resultsCTA',
      heading: 'Real results, real customers',
      theme: 'dark',
      items: [
        {_key: 'i1', quote: 'The best decision we made all year.', authorName: 'Daniel R.', authorLocation: 'Westgate', avatar: null},
      ],
      resultsStats: [
        {_key: 'st1', value: '500+', label: 'Jobs completed'},
        {_key: 'st2', value: '4.9★', label: 'Average rating'},
        {_key: 'st3', value: '10+', label: 'Years experience'},
      ],
      ctaButton: href('Get your free quote', '/contact'),
      resultsNote: 'Join hundreds of happy customers in your area.',
    },
  },
]

export const faqSamples: Sample[] = [
  {
    label: 'split',
    block: {
      _type: 'faq',
      _key: 'faq-split',
      variant: 'split',
      eyebrow: 'FAQs',
      heading: 'Frequently asked questions',
      subheading: 'Everything you need to know before getting started.',
      theme: 'light',
      items: [
        {_key: 'q1', question: 'How quickly can you start?', answer: pt('In most cases we can be with you within 24 to 48 hours.', 'a1')},
        {_key: 'q2', question: 'Are you insured?', answer: pt('Yes — we are fully insured for your peace of mind.', 'a2')},
        {_key: 'q3', question: 'Do you charge for quotes?', answer: pt('No, all of our quotes are completely free and without obligation.', 'a3')},
      ],
    },
  },
  {
    label: 'accordion',
    block: {
      _type: 'faq',
      _key: 'faq-accordion',
      variant: 'accordion',
      eyebrow: 'FAQs',
      heading: 'Common questions',
      theme: 'light',
      items: [
        {_key: 'q1', question: 'What areas do you cover?', answer: pt('We cover the whole local region and surrounding towns.', 'a1')},
        {_key: 'q2', question: 'Do you offer guarantees?', answer: pt('Yes, all of our work is guaranteed.', 'a2')},
        {_key: 'q3', question: 'How do I pay?', answer: pt('We accept card, bank transfer and cash.', 'a3')},
      ],
      ctaTitle: 'Still have questions?',
      ctaText: 'Our team is happy to help.',
      ctaButton: href('Contact us', 'tel:+441234567890'),
    },
  },
  {
    label: 'grid',
    block: {
      _type: 'faq',
      _key: 'faq-grid',
      variant: 'grid',
      eyebrow: 'FAQs',
      heading: 'Good to know',
      subheading: 'A quick rundown of the questions we hear most.',
      theme: 'light',
      items: [
        {_key: 'q1', question: 'Are you local?', answer: pt('Yes, we are based right here in your area.', 'a1')},
        {_key: 'q2', question: 'Can I book online?', answer: pt('Absolutely — use our contact form any time.', 'a2')},
        {_key: 'q3', question: 'Do you do emergencies?', answer: pt('Yes, we offer a 24/7 emergency call-out service.', 'a3')},
        {_key: 'q4', question: 'What if I am not happy?', answer: pt('We will return and put it right, guaranteed.', 'a4')},
      ],
      ctaTitle: 'Need more help?',
      ctaText: 'Get in touch and we will answer anything.',
      ctaButton: href('Ask a question', '/contact'),
    },
  },
]

// cta — the CtaSection dispatcher (block._type === 'cta')
export const ctaSamples: Sample[] = [
  {
    label: 'standard',
    block: {
      _type: 'cta',
      _key: 'cta-standard',
      variant: 'standard',
      eyebrow: 'Ready to start?',
      heading: 'Let us help with your next project',
      subheading: 'Get a free, no-obligation quote today.',
      theme: 'brand',
      textAlignment: 'center',
      primaryButton: href('Call now', 'tel:+441234567890'),
      secondaryButton: href('Send a message', '/contact'),
      trustItems: [
        {_key: 't1', icon: 'Clock', label: 'Fast turnaround'},
        {_key: 't2', icon: 'Shield', label: 'Fully insured'},
        {_key: 't3', icon: 'Check', label: 'Free quotes'},
      ],
    },
  },
  {
    label: 'band',
    block: {
      _type: 'cta',
      _key: 'cta-band',
      variant: 'band',
      eyebrow: 'Next step',
      heading: 'Book your free quote',
      subheading: 'It only takes a minute.',
      primaryButton: href('Get a quote', '/contact'),
      secondaryButton: href('Call us', 'tel:+441234567890'),
      trustItems: [
        {_key: 't1', icon: 'Clock', label: 'Same-day reply'},
        {_key: 't2', icon: 'Check', label: 'No obligation'},
      ],
    },
  },
  {
    label: 'phone',
    block: {
      _type: 'cta',
      _key: 'cta-phone',
      variant: 'phone',
      eyebrow: 'Speak to us',
      heading: 'Prefer to talk it through?',
      subheading: 'Our friendly team is ready to help.',
      phone: '+441234567890',
      theme: 'dark',
      primaryButton: href('Call now', 'tel:+441234567890'),
      secondaryButton: href('Message us', '/contact'),
    },
  },
  {
    label: 'form (embeds real QuoteForm — async)',
    block: {
      _type: 'cta',
      _key: 'cta-form',
      variant: 'form',
      eyebrow: 'Get in touch',
      heading: 'Request a callback',
      subheading: 'Fill in a few details and we will be in touch.',
      primaryButton: href('Submit', '/contact'),
      services: [{name: 'Installation'}, {name: 'Repairs'}, {name: 'Maintenance'}],
    },
  },
]

// callToAction — the legacy Cta block (block._type === 'callToAction')
export const callToActionSamples: Sample[] = [
  {
    label: 'callToAction (legacy, image omitted)',
    block: {
      _type: 'callToAction',
      _key: 'legacy-cta',
      eyebrow: 'Special offer',
      heading: 'Ready when you are',
      body: pt('Professional service for your home or business, delivered with care.', 'cta-body'),
      button: href('Get started', '/contact'),
      image: null,
      theme: 'light',
      contentAlignment: 'textFirst',
    },
  },
]

export const introOverviewSamples: Sample[] = [
  {
    label: 'split (image omitted)',
    block: {
      _type: 'introOverviewSection',
      _key: 'intro-split',
      variant: 'split',
      eyebrow: 'About us',
      heading: 'Trusted by your neighbours for over a decade',
      body: pt('We are a local, family-run team dedicated to doing things properly.', 'i-split'),
      stats: [
        {_key: 'st1', value: '500+', label: 'Jobs completed'},
        {_key: 'st2', value: '10+', label: 'Years experience'},
      ],
      checklist: ['Fully insured professionals', 'Tidy, respectful service', 'Workmanship guarantee'],
      cta: href('Get a quote', '/contact'),
      secondaryCta: href('Our services', '/services'),
      image: null,
      theme: 'light',
      imageAlignment: 'right',
    },
  },
  {
    label: 'editorial',
    block: {
      _type: 'introOverviewSection',
      _key: 'intro-editorial',
      variant: 'editorial',
      eyebrow: 'Our story',
      heading: 'Built on quality, trust and a job done right',
      body: pt('From a single van to a trusted local name, our values have never changed: do great work and treat people well.', 'i-ed'),
      cta: href('Learn more', '/about'),
      theme: 'light',
    },
  },
  {
    label: 'facts',
    block: {
      _type: 'introOverviewSection',
      _key: 'intro-facts',
      variant: 'facts',
      eyebrow: 'At a glance',
      heading: 'The essentials',
      body: pt('Here is a quick snapshot of who we are and what we do.', 'i-facts'),
      facts: [
        {_key: 'f1', label: 'Established', value: '2012'},
        {_key: 'f2', label: 'Team size', value: '12'},
        {_key: 'f3', label: 'Coverage', value: 'Region-wide'},
        {_key: 'f4', label: 'Rating', value: '4.9 / 5'},
      ],
      cta: href('Contact us', '/contact'),
      theme: 'light',
    },
  },
  {
    label: 'centered',
    block: {
      _type: 'introOverviewSection',
      _key: 'intro-centered',
      variant: 'centered',
      eyebrow: 'Who we are',
      heading: 'A team you can count on',
      body: pt('We bring care, skill and reliability to every single job.', 'i-cen'),
      stats: [
        {_key: 'st1', value: '500+', label: 'Happy customers'},
        {_key: 'st2', value: '4.9★', label: 'Average rating'},
        {_key: 'st3', value: '24/7', label: 'Availability'},
      ],
      theme: 'light',
    },
  },
]

export const infoSectionSamples: Sample[] = [
  {
    label: 'infoSection',
    block: {
      _type: 'infoSection',
      _key: 'info-1',
      heading: 'About our service',
      subheading: 'Quality & reliability',
      content: pt('We deliver professional results with genuine attention to detail, every time.', 'info-c'),
    },
  },
]

// =====================================================================
// D — areas / before-after / blog
// =====================================================================

export const areasWeCoverSamples: Sample[] = [
  {
    label: 'chips',
    block: {
      _type: 'areasWeCover',
      _key: 'areas-chips',
      variant: 'chips',
      eyebrow: 'Service areas',
      heading: 'Areas we cover',
      subheading: 'Fast, reliable service across the region.',
      theme: 'light',
      areas: [
        {_key: 'a1', name: 'Riverside', region: 'North', slug: 'riverside'},
        {_key: 'a2', name: 'Oakfield', region: 'North', slug: 'oakfield'},
        {_key: 'a3', name: 'Greenway', region: 'South', slug: 'greenway'},
        {_key: 'a4', name: 'Hillcrest', region: 'South', slug: 'hillcrest'},
      ],
      footerNote: 'Cannot see your area?',
      footerButton: href('Get in touch', '/contact'),
    },
  },
  {
    label: 'map (mapImage omitted → pattern placeholder)',
    block: {
      _type: 'areasWeCover',
      _key: 'areas-map',
      variant: 'map',
      eyebrow: 'Coverage',
      heading: 'Where we work',
      subheading: 'An established presence across the area.',
      theme: 'light',
      mapImage: null,
      areas: [
        {_key: 'a1', name: 'Riverside', slug: 'riverside'},
        {_key: 'a2', name: 'Oakfield', slug: 'oakfield'},
        {_key: 'a3', name: 'Greenway', slug: 'greenway'},
      ],
      footerNote: 'Expanding to new areas all the time.',
      footerButton: href('Ask about your area', '/contact'),
    },
  },
  {
    label: 'directory',
    block: {
      _type: 'areasWeCover',
      _key: 'areas-dir',
      variant: 'directory',
      eyebrow: 'Find your area',
      heading: 'Searchable directory',
      subheading: 'Search for your town below.',
      theme: 'light',
      areas: [
        {_key: 'a1', name: 'Riverside', region: 'North', slug: 'riverside'},
        {_key: 'a2', name: 'Oakfield', region: 'North', slug: 'oakfield'},
        {_key: 'a3', name: 'Greenway', region: 'South', slug: 'greenway'},
        {_key: 'a4', name: 'Hillcrest', region: 'South', slug: 'hillcrest'},
        {_key: 'a5', name: 'Westgate', region: 'West', slug: 'westgate'},
        {_key: 'a6', name: 'Eastbrook', region: 'East', slug: 'eastbrook'},
      ],
    },
  },
]

// beforeAfter — images omitted → each variant shows its "Add before & after images" placeholder.
export const beforeAfterSamples: Sample[] = [
  {
    label: 'grid (images omitted → placeholders)',
    block: {
      _type: 'beforeAfter',
      _key: 'ba-grid',
      variant: 'grid',
      eyebrow: 'Transformations',
      heading: 'Before & after',
      subheading: 'See the difference our work makes.',
      columns: 2,
      theme: 'light',
      items: [
        {_key: 'i1', title: 'Kitchen refresh', description: 'A full modern makeover.', beforeImage: null, afterImage: null},
        {_key: 'i2', title: 'Bathroom remodel', description: 'From dated to stunning.', beforeImage: null, afterImage: null},
      ],
    },
  },
  {
    label: 'featured (images omitted → placeholder)',
    block: {
      _type: 'beforeAfter',
      _key: 'ba-featured',
      variant: 'featured',
      eyebrow: 'Showcase',
      heading: 'Featured transformation',
      subheading: 'Our best work in full detail.',
      theme: 'light',
      items: [
        {_key: 'i1', title: 'Complete renovation', description: 'Inside and out.', beforeImage: null, afterImage: null},
      ],
    },
  },
  {
    label: 'thumbs (images omitted → placeholders)',
    block: {
      _type: 'beforeAfter',
      _key: 'ba-thumbs',
      variant: 'thumbs',
      eyebrow: 'Gallery',
      heading: 'Featured with thumbnails',
      subheading: 'Browse our recent projects.',
      theme: 'light',
      items: [
        {_key: 't1', title: 'Project one', description: 'High-end kitchen.', beforeImage: null, afterImage: null},
        {_key: 't2', title: 'Project two', description: 'Bathroom suite.', beforeImage: null, afterImage: null},
        {_key: 't3', title: 'Project three', description: 'Living room.', beforeImage: null, afterImage: null},
      ],
    },
  },
]

// blogSection — posts provided directly (normally GROQ-projected). Cover images omitted.
export const blogSectionSamples: Sample[] = [
  {
    label: 'grid (cover images omitted)',
    block: {
      _type: 'blogSection',
      _key: 'blog-grid',
      variant: 'grid',
      eyebrow: 'Latest news',
      heading: 'From our blog',
      subheading: 'Tips, guides and industry insights.',
      maxPosts: 3,
      theme: 'light',
      posts: [
        {_id: 'p1', title: 'Getting started: a simple guide', slug: 'getting-started', excerpt: 'Five easy steps to get going.', coverImage: null, date: '2026-06-01'},
        {_id: 'p2', title: 'Advanced techniques explained', slug: 'advanced-techniques', excerpt: 'Master the professional methods.', coverImage: null, date: '2026-05-25'},
        {_id: 'p3', title: 'Common mistakes to avoid', slug: 'common-mistakes', excerpt: 'Steer clear of these pitfalls.', coverImage: null, date: '2026-05-20'},
      ],
    },
  },
  {
    label: 'featured (cover images omitted)',
    block: {
      _type: 'blogSection',
      _key: 'blog-featured',
      variant: 'featured',
      eyebrow: 'Latest',
      heading: 'Featured article',
      subheading: 'Our top story right now.',
      theme: 'light',
      posts: [
        {_id: 'p1', title: 'The ultimate guide', slug: 'ultimate-guide', excerpt: 'Everything you need to know.', coverImage: null, date: '2026-06-01'},
        {_id: 'p2', title: 'Quick tips for beginners', slug: 'quick-tips', excerpt: 'A five-minute read.', coverImage: null, date: '2026-05-28'},
        {_id: 'p3', title: 'Industry news roundup', slug: 'industry-news', excerpt: 'What happened this week.', coverImage: null, date: '2026-05-25'},
        {_id: 'p4', title: 'A real-world case study', slug: 'case-study', excerpt: 'Results that speak for themselves.', coverImage: null, date: '2026-05-20'},
      ],
    },
  },
  {
    label: 'list (no images)',
    block: {
      _type: 'blogSection',
      _key: 'blog-list',
      variant: 'list',
      eyebrow: 'Archive',
      heading: 'All posts',
      subheading: 'Browse everything by date.',
      maxPosts: 6,
      theme: 'light',
      posts: [
        {_id: 'p1', title: 'First post', slug: 'first-post', excerpt: 'A short summary.', date: '2026-06-01'},
        {_id: 'p2', title: 'Second post', slug: 'second-post', excerpt: 'A little more detail.', date: '2026-05-25'},
        {_id: 'p3', title: 'Third post', slug: 'third-post', excerpt: 'Even more to read.', date: '2026-05-20'},
        {_id: 'p4', title: 'Fourth post', slug: 'fourth-post', excerpt: 'Keep on reading.', date: '2026-05-15'},
        {_id: 'p5', title: 'Fifth post', slug: 'fifth-post', excerpt: 'Almost at the end.', date: '2026-05-10'},
        {_id: 'p6', title: 'Sixth post', slug: 'sixth-post', excerpt: 'The last one.', date: '2026-05-05'},
      ],
    },
  },
]

// =====================================================================
// Page-builder blocks that live in BlockRenderer but have no internal variants
// =====================================================================

export const serviceCardsSamples: Sample[] = [
  {
    label: 'serviceCards (images omitted)',
    block: {
      _type: 'serviceCards',
      _key: 'svc-cards',
      eyebrow: 'Services',
      heading: 'What we offer',
      subheading: 'High-quality solutions for every need.',
      theme: 'light',
      columns: 3,
      cards: [
        {_key: 'c1', title: 'Installation', description: 'Professional fitting and setup, done right.', image: null, button: href('Learn more', '/services/installation')},
        {_key: 'c2', title: 'Repairs', description: 'Fast, lasting fixes you can rely on.', image: null, button: href('Learn more', '/services/repairs')},
        {_key: 'c3', title: 'Maintenance', description: 'Keep everything running smoothly.', image: null, button: href('Learn more', '/services/maintenance')},
      ],
    },
  },
]

export const mainServiceGridSamples: Sample[] = [
  {
    label: 'mainServiceGrid',
    block: {
      _type: 'mainServiceGrid',
      _key: 'main-svc',
      eyebrow: 'Our services',
      heading: 'Comprehensive solutions',
      subheading: 'Everything you need, under one roof.',
      theme: 'light',
      columns: 3,
      items: [
        {_key: 'i1', icon: 'Wrench', title: 'Installation', description: 'Expert fitting for any project.', bullets: ['Free assessment', 'Tidy work', 'Guaranteed'], cta: href('Get a quote', '/contact')},
        {_key: 'i2', icon: 'Hammer', title: 'Repairs', description: 'Quick, dependable fixes.', bullets: ['Same-day options', 'Fair pricing'], cta: href('Get a quote', '/contact')},
        {_key: 'i3', icon: 'ShieldCheck', title: 'Maintenance', description: 'Keep small issues small.', bullets: ['Scheduled visits', 'Priority support'], cta: href('Get a quote', '/contact')},
      ],
    },
  },
]

export const emergencyCtaStripSamples: Sample[] = [
  {
    label: 'emergencyCtaStrip (brand)',
    block: {
      _type: 'emergencyCtaStrip',
      _key: 'emerg-brand',
      heading: 'Emergency? We are here 24/7',
      subheading: 'Rapid response, any time of day.',
      phoneNumber: '0800 123 4567',
      button: href('Book a callback', '/contact'),
      theme: 'brand',
    },
  },
  {
    label: 'emergencyCtaStrip (dark)',
    block: {
      _type: 'emergencyCtaStrip',
      _key: 'emerg-dark',
      heading: 'Need urgent help?',
      subheading: 'Call our emergency line now.',
      phoneNumber: '0800 123 4567',
      button: href('Contact us', '/contact'),
      theme: 'dark',
    },
  },
  {
    label: 'emergencyCtaStrip (light)',
    block: {
      _type: 'emergencyCtaStrip',
      _key: 'emerg-light',
      heading: 'Available around the clock',
      subheading: 'Day or night, we have you covered.',
      phoneNumber: '0800 123 4567',
      button: href('Get in touch', '/contact'),
      theme: 'light',
    },
  },
]

export const gallerySamples: Sample[] = [
  {
    label: 'gallery (images omitted → empty grid)',
    block: {
      _type: 'gallery',
      _key: 'gallery-1',
      eyebrow: 'Our work',
      heading: 'Recent projects',
      subheading: 'A selection of jobs we are proud of.',
      // Images intentionally omitted — Gallery skips entries without asset._ref,
      // so this renders the header with an empty grid (graceful, no broken images).
      images: [],
      columns: 3,
      theme: 'light',
    },
  },
]

export const contactFormSamples: Sample[] = [
  {
    label: 'contactForm (block)',
    block: {
      _type: 'contactForm',
      _key: 'contact-form',
      title: 'Get in touch',
      intro: 'Tell us about your project and we will get back to you shortly.',
      phone: '0800 123 4567',
      email: 'hello@example.com',
      location: '123 High Street, Your Town',
      services: ['Installation', 'Repairs', 'Maintenance'],
    },
  },
]

// =====================================================================
// E / F — chrome, forms & utility (rendered directly, not via BlockRenderer)
// =====================================================================

// Header — logo omitted on purpose → renders the siteTitle text fallback.
export const headerProps = {
  siteTitle: 'Acme Services',
  nav: {
    logo: undefined,
    items: [
      {label: 'About', kind: 'link', link: {linkType: 'href', href: '/about'}},
      {
        label: 'Resources',
        kind: 'dropdown',
        link: {linkType: 'href', href: '/blog'},
        children: [
          {label: 'Blog', description: 'News & guides', link: {linkType: 'href', href: '/blog'}},
          {label: 'FAQs', description: 'Common questions', link: {linkType: 'href', href: '/faq'}},
        ],
      },
    ],
    cta: {label: 'Get a quote', link: {linkType: 'href', href: '/contact'}, variant: 'primary'},
  },
  searchItems: [
    {_type: 'service', title: 'Installation', slug: 'installation', description: 'Professional fitting'},
    {_type: 'area', title: 'Riverside', slug: 'riverside', description: 'Serving the Riverside area'},
    {_type: 'post', title: 'Getting started', slug: 'getting-started', description: 'A simple guide'},
    {_type: 'page', title: 'About us', slug: 'about', description: 'Learn about our company'},
  ],
  services: [
    {name: 'Installation', slug: 'installation'},
    {name: 'Repairs', slug: 'repairs'},
    {name: 'Maintenance', slug: 'maintenance'},
  ],
  areas: [
    {name: 'Riverside', slug: 'riverside'},
    {name: 'Oakfield', slug: 'oakfield'},
  ],
}

export const footerProps = {
  siteTitle: 'Acme Services',
  footer: {
    columns: [
      {
        title: 'Company',
        links: [
          {label: 'About', link: {linkType: 'href', href: '/about'}},
          {label: 'Contact', link: {linkType: 'href', href: '/contact'}},
        ],
      },
    ],
    social: [
      {platform: 'facebook', url: 'https://facebook.com/'},
      {platform: 'instagram', url: 'https://instagram.com/'},
      {platform: 'linkedin', url: 'https://linkedin.com/'},
    ],
    legal: [{label: 'Terms', link: {linkType: 'href', href: '/terms'}}],
    copyright: '© 2026 Acme Services. All rights reserved.',
  },
  services: [
    {name: 'Installation', slug: 'installation'},
    {name: 'Repairs', slug: 'repairs'},
    {name: 'Maintenance', slug: 'maintenance'},
  ],
  areas: [
    {name: 'Riverside', slug: 'riverside'},
    {name: 'Oakfield', slug: 'oakfield'},
  ],
  contact: {phone: '+441234567890', email: 'hello@example.com'},
}

export const quoteFormProps = {
  context: {service: 'Installation', area: 'Riverside', sourceUrl: '/test'},
  services: ['Installation', 'Repairs', 'Maintenance'],
}

export const contactFormDirectProps = {
  block: {
    title: 'Get in touch',
    intro: 'Tell us about your project and we will get back to you shortly.',
    phone: '0800 123 4567',
    email: 'hello@example.com',
    location: '123 High Street, Your Town',
    services: ['Installation', 'Repairs', 'Maintenance'],
  },
  context: {service: 'Installation', area: 'Riverside', sourceUrl: '/test'},
}
