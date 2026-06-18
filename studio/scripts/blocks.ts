/**
 * Typed factory helpers for every `pageBuilder` component on the `page`
 * document, plus the shared field types (button, link, portable text, image).
 *
 * Each factory:
 *  - injects the correct `_type` and a random `_key`
 *  - merges your props over schema-accurate defaults, so a bare call
 *    (e.g. `heroBanner()`) still produces a valid, on-brand block
 *  - keeps array members keyed and typed correctly
 *
 * The button shape produced here matches the real `button` object schema
 * (`{buttonText, link}`) and the frontend GROQ (`resolvedButton`) — not the
 * `{label, href, variant}` shorthand some schema `initialValue`s use (those
 * never persist through the API).
 */
import {randomBytes} from 'node:crypto'

export type Block = Record<string, unknown> & {_type: string; _key: string}

/** 12-char key, same alphabet Sanity uses for array `_key`s. */
export const key = (): string => randomBytes(6).toString('hex')

/** Add a unique `_key` to every member of an object array. */
const keyed = <T extends object>(items: T[]): Array<T & {_key: string}> =>
  items.map((item) => ({_key: key(), ...item}))

/** Strip `undefined` values so they don't overwrite defaults on spread. */
const defined = <T extends object>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>

// ---------------------------------------------------------------------------
// Shared field helpers
// ---------------------------------------------------------------------------

export type LinkInput = {
  href?: string
  pageRef?: string
  postRef?: string
  newTab?: boolean
}

export function link(input: LinkInput) {
  const base = {_type: 'link' as const, openInNewTab: Boolean(input.newTab)}
  if (input.pageRef) {
    return {...base, linkType: 'page', page: {_type: 'reference', _ref: input.pageRef}}
  }
  if (input.postRef) {
    return {...base, linkType: 'post', post: {_type: 'reference', _ref: input.postRef}}
  }
  return {...base, linkType: 'href', href: input.href ?? '/'}
}

export type ButtonInput = {
  text: string
} & LinkInput

export function button(input: ButtonInput) {
  return {
    _type: 'button',
    buttonText: input.text,
    link: link(input),
  }
}

/**
 * Portable Text for `blockContentTextOnly` / `blockContent` fields.
 * Pass a string (one paragraph) or string[] (one paragraph each).
 */
export function portableText(input: string | string[]) {
  const paragraphs = Array.isArray(input) ? input : [input]
  return paragraphs.map((text) => ({
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: key(), text, marks: []}],
  }))
}

/**
 * Like `portableText()` but also parses:
 *  - Inline markdown-style links `[anchor text](/relative-url)` into
 *    Sanity link annotations (markDefs), rendered as real `<a>` tags via
 *    the frontend PortableText component's `link` mark handler.
 *  - Leading `## ` for h2 blocks and `### ` for h3 blocks (useful for
 *    blog posts, the privacy policy and other long-form body copy).
 *
 * Use for body copy where 2–3 in-content editorial links matter for SEO
 * (e.g. cross-linking sibling services, the most relevant area page, or
 * the /areas hub). Don't force a link — only when it reads naturally.
 *
 * Supported syntax:
 *   "Plain prose with a [contextual link](/services/foo) inside."
 *   "## Section heading"
 *   "### Sub-section heading"
 *
 * Limitations:
 *   - No nested brackets or parens inside the anchor / URL.
 *   - All produced links are `linkType: 'href'`. For page/post references
 *     in seeded prose, set them in Studio after seeding (or extend this).
 *   - No list support — paragraphs and headings only.
 */
export function richPortableText(input: string | string[]) {
  const paragraphs = Array.isArray(input) ? input : [input]
  return paragraphs.map((paragraph) => {
    let style: 'normal' | 'h2' | 'h3' = 'normal'
    let body = paragraph
    if (body.startsWith('### ')) {
      style = 'h3'
      body = body.slice(4)
    } else if (body.startsWith('## ')) {
      style = 'h2'
      body = body.slice(3)
    }

    const markDefs: Array<{
      _key: string
      _type: 'link'
      linkType: 'href'
      href: string
      openInNewTab: boolean
    }> = []
    const children: Array<{_type: 'span'; _key: string; text: string; marks: string[]}> = []
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = linkRegex.exec(body)) !== null) {
      if (match.index > lastIndex) {
        children.push({
          _type: 'span',
          _key: key(),
          text: body.slice(lastIndex, match.index),
          marks: [],
        })
      }
      const linkKey = key()
      markDefs.push({
        _key: linkKey,
        _type: 'link',
        linkType: 'href',
        href: match[2],
        openInNewTab: false,
      })
      children.push({_type: 'span', _key: key(), text: match[1], marks: [linkKey]})
      lastIndex = linkRegex.lastIndex
    }

    if (lastIndex < body.length) {
      children.push({_type: 'span', _key: key(), text: body.slice(lastIndex), marks: []})
    }
    if (children.length === 0) {
      children.push({_type: 'span', _key: key(), text: '', marks: []})
    }

    return {_type: 'block', _key: key(), style, markDefs, children}
  })
}

export type ImageInput = {assetRef: string; alt?: string}

/** Image object for a single image field (no `_key` — that's added in arrays). */
export function image({assetRef, alt}: ImageInput) {
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: assetRef},
    ...(alt ? {alt} : {}),
  }
}

type Theme = 'light' | 'dark'

// ---------------------------------------------------------------------------
// Page builder component factories
// ---------------------------------------------------------------------------

export function heroBanner(props: {
  eyebrow?: string
  heading?: string
  subheading?: string
  primaryButton?: ButtonInput
  secondaryButton?: ButtonInput
  trustBadges?: Array<{icon?: string; label: string}>
  backgroundImage?: ImageInput
  theme?: Theme
  textAlignment?: 'left' | 'center'
} = {}): Block {
  return {
    _type: 'heroBanner',
    _key: key(),
    eyebrow: props.eyebrow ?? 'Trusted Local Trade',
    heading: props.heading ?? 'Quality Work, Done Properly',
    subheading:
      props.subheading ??
      'Professional, reliable workmanship with clear communication, fair pricing and a tidy finish.',
    primaryButton: button(props.primaryButton ?? {text: 'Get a Free Quote', href: '/quote'}),
    secondaryButton: button(
      props.secondaryButton ?? {text: 'Contact Us', href: '/contact'},
    ),
    trustBadges: keyed(
      (props.trustBadges ?? [
        {icon: 'ShieldCheck', label: 'Fully Insured'},
        {icon: 'Clock', label: 'Fast Response'},
        {icon: 'Star', label: '5-Star Rated'},
        {icon: 'Tag', label: 'Free Quotes'},
      ]).map((b) => ({_type: 'trustBadge', icon: b.icon ?? 'ShieldCheck', label: b.label})),
    ),
    ...(props.backgroundImage ? {backgroundImage: image(props.backgroundImage)} : {}),
    theme: props.theme ?? 'dark',
    textAlignment: props.textAlignment ?? 'left',
  }
}

export function heroCarousel(props: {
  slides: Array<{
    eyebrow?: string
    heading: string
    subheading?: string
    primaryButton?: ButtonInput
    secondaryButton?: ButtonInput
    backgroundImage?: ImageInput
    theme?: Theme
  }>
  textAlignment?: 'left' | 'center'
  autoPlay?: boolean
  interval?: number
}): Block {
  return {
    _type: 'heroCarousel',
    _key: key(),
    slides: keyed(
      props.slides.map((s) => ({
        _type: 'heroSlide',
        ...defined({
          eyebrow: s.eyebrow,
          heading: s.heading,
          subheading: s.subheading,
          primaryButton: s.primaryButton ? button(s.primaryButton) : undefined,
          secondaryButton: s.secondaryButton ? button(s.secondaryButton) : undefined,
          backgroundImage: s.backgroundImage ? image(s.backgroundImage) : undefined,
        }),
        theme: s.theme ?? 'dark',
      })),
    ),
    textAlignment: props.textAlignment ?? 'left',
    autoPlay: props.autoPlay ?? true,
    interval: props.interval ?? 5,
  }
}

export function callToAction(props: {
  eyebrow?: string
  heading: string
  body?: string | string[]
  button?: ButtonInput
  image?: ImageInput
  theme?: Theme
  contentAlignment?: 'textFirst' | 'imageFirst'
}): Block {
  return {
    _type: 'callToAction',
    _key: key(),
    ...defined({
      eyebrow: props.eyebrow,
      heading: props.heading,
      body: props.body ? portableText(props.body) : undefined,
      button: props.button ? button(props.button) : undefined,
      image: props.image ? image(props.image) : undefined,
    }),
    theme: props.theme ?? 'light',
    contentAlignment: props.contentAlignment ?? 'textFirst',
  }
}

export function infoSection(props: {
  heading?: string
  subheading?: string
  content: string | string[]
}): Block {
  return {
    _type: 'infoSection',
    _key: key(),
    ...defined({heading: props.heading, subheading: props.subheading}),
    // Uses `richPortableText` so `## ` headings and inline `[anchor](/url)`
    // links in the seeded content are parsed into proper Sanity blocks.
    content: richPortableText(props.content),
  }
}

export function testimonials(props: {
  eyebrow?: string
  heading?: string
  items: Array<{
    quote: string
    authorName: string
    authorLocation?: string
    rating?: number
    avatar?: ImageInput
  }>
  /** Optional external aggregate (e.g. Facebook). When all three of
   * `aggregateRatingValue` / `aggregateReviewCount` / `reviewsUrl` are set,
   * the bottom reviews CTA renders enriched as "★★★★★ 5.0 · 19 reviews on Facebook →". */
  aggregateRatingValue?: number
  aggregateReviewCount?: number
  aggregateSourceName?: string
  reviewsUrl?: string
  leaveReviewUrl?: string
  /** `resultsCTA` variant: featured quote (items[0]) beside a stats+button panel.
   * Seeded on every testimonials block (harmless/hidden on cards & caseStudy) so
   * the panel is never empty whichever variant a design profile applies. */
  resultsStats?: Array<{value: string; label: string}>
  ctaButton?: ButtonInput
  resultsNote?: string
  /** `caseStudy` variant: a single mini case study (photo + story + result
   * stats + attribution). Seeded on every testimonials block so the variant is
   * never an empty shell; hidden on cards & resultsCTA. */
  caseBody?: string
  caseImage?: ImageInput
  caseStats?: Array<{value: string; label: string}>
  caseCustomer?: string
  caseLocation?: string
  caseBadge?: string
  theme?: Theme
}): Block {
  return {
    _type: 'testimonials',
    _key: key(),
    eyebrow: props.eyebrow ?? 'Trusted by Homeowners',
    heading: props.heading ?? 'What Our Customers Say',
    items: keyed(
      props.items.map((t) => ({
        _type: 'testimonialItem',
        quote: t.quote,
        authorName: t.authorName,
        ...defined({
          authorLocation: t.authorLocation,
          avatar: t.avatar ? image(t.avatar) : undefined,
        }),
        rating: t.rating ?? 5,
      })),
    ),
    ...defined({
      aggregateRatingValue: props.aggregateRatingValue,
      aggregateReviewCount: props.aggregateReviewCount,
      aggregateSourceName: props.aggregateSourceName,
      reviewsUrl: props.reviewsUrl,
      leaveReviewUrl: props.leaveReviewUrl,
      resultsStats: props.resultsStats
        ? keyed(props.resultsStats.map((s) => ({_type: 'proofStat', value: s.value, label: s.label})))
        : undefined,
      ctaButton: props.ctaButton ? button(props.ctaButton) : undefined,
      resultsNote: props.resultsNote,
      caseBody: props.caseBody,
      caseImage: props.caseImage ? image(props.caseImage) : undefined,
      caseStats: props.caseStats
        ? keyed(props.caseStats.map((s) => ({_type: 'proofStat', value: s.value, label: s.label})))
        : undefined,
      caseCustomer: props.caseCustomer,
      caseLocation: props.caseLocation,
      caseBadge: props.caseBadge,
    }),
    theme: props.theme ?? 'light',
  }
}

export function serviceCards(props: {
  eyebrow?: string
  heading?: string
  subheading?: string
  cards: Array<{title: string; description?: string; image?: ImageInput; button?: ButtonInput}>
  theme?: Theme
  columns?: 2 | 3 | 4
}): Block {
  return {
    _type: 'serviceCards',
    _key: key(),
    eyebrow: props.eyebrow ?? 'What We Do',
    heading: props.heading ?? 'Our Services',
    subheading: props.subheading ?? 'A full range of professional services for your home or property.',
    cards: keyed(
      props.cards.map((c) => ({
        _type: 'serviceCard',
        title: c.title,
        ...defined({
          description: c.description,
          image: c.image ? image(c.image) : undefined,
          button: c.button ? button(c.button) : undefined,
        }),
      })),
    ),
    theme: props.theme ?? 'light',
    columns: props.columns ?? 3,
  }
}

export function whyChooseUs(props: {
  eyebrow?: string
  heading?: string
  subheading?: string
  reasons: Array<{title: string; description?: string; icon?: ImageInput}>
  image?: ImageInput
  button?: ButtonInput
  theme?: Theme
  imageAlignment?: 'left' | 'right'
}): Block {
  return {
    _type: 'whyChooseUs',
    _key: key(),
    eyebrow: props.eyebrow ?? 'Why Choose Us',
    heading: props.heading ?? 'Trusted Local Professionals',
    subheading:
      props.subheading ??
      'Honest pricing, quality workmanship and a tidy, on-schedule approach on every job.',
    reasons: keyed(
      props.reasons.map((r) => ({
        _type: 'reason',
        title: r.title,
        ...defined({
          description: r.description,
          icon: r.icon ? image(r.icon) : undefined,
        }),
      })),
    ),
    ...(props.image ? {image: image(props.image)} : {}),
    button: button(props.button ?? {text: 'Get a Free Quote', href: '/contact'}),
    theme: props.theme ?? 'light',
    imageAlignment: props.imageAlignment ?? 'right',
  }
}

export function emergencyCtaStrip(props: {
  heading?: string
  subheading?: string
  phoneNumber?: string
  button?: ButtonInput
  theme?: 'brand' | 'dark' | 'light'
} = {}): Block {
  return {
    _type: 'emergencyCtaStrip',
    _key: key(),
    heading: props.heading ?? 'Need a Quote?',
    subheading:
      props.subheading ?? 'Get in touch for a free, no-obligation quote on your project.',
    phoneNumber: props.phoneNumber ?? '',
    button: button(props.button ?? {text: 'Request a Free Quote', href: '/contact'}),
    theme: props.theme ?? 'brand',
  }
}

export function areasWeCover(props: {
  eyebrow?: string
  heading?: string
  subheading?: string
  areas: Array<{name: string; pageRef?: string}>
  theme?: Theme
}): Block {
  return {
    _type: 'areasWeCover',
    _key: key(),
    eyebrow: props.eyebrow ?? 'Coverage',
    heading: props.heading ?? 'Areas We Cover',
    subheading: props.subheading ?? 'Serving customers across the following areas.',
    areas: keyed(
      props.areas.map((a) => ({
        _type: 'area',
        name: a.name,
        ...(a.pageRef ? {page: {_type: 'reference', _ref: a.pageRef}} : {}),
      })),
    ),
    theme: props.theme ?? 'light',
  }
}

export function faq(props: {
  eyebrow?: string
  heading?: string
  subheading?: string
  items: Array<{question: string; answer: string | string[]}>
  theme?: Theme
}): Block {
  return {
    _type: 'faq',
    _key: key(),
    eyebrow: props.eyebrow ?? 'FAQs',
    heading: props.heading ?? 'Frequently Asked Questions',
    subheading:
      props.subheading ??
      'Common questions about our work, how we quote and how we work around your home.',
    items: keyed(
      props.items.map((i) => ({
        _type: 'faqItem',
        question: i.question,
        answer: portableText(i.answer),
      })),
    ),
    theme: props.theme ?? 'light',
  }
}

export function cta(props: {
  eyebrow?: string
  heading?: string
  subheading?: string
  primaryButton?: ButtonInput
  secondaryButton?: ButtonInput
  theme?: 'brand' | 'dark' | 'light'
  textAlignment?: 'center' | 'left'
} = {}): Block {
  return {
    _type: 'cta',
    _key: key(),
    eyebrow: props.eyebrow ?? 'Get in Touch',
    heading: props.heading ?? 'Ready to Get Started?',
    subheading:
      props.subheading ??
      'Send a few details about your project and get a written quote back, usually within 48 hours.',
    primaryButton: button(
      props.primaryButton ?? {text: 'Get a Free Quote', href: '/quote'},
    ),
    secondaryButton: button(props.secondaryButton ?? {text: 'View Services', href: '/services'}),
    theme: props.theme ?? 'brand',
    textAlignment: props.textAlignment ?? 'center',
  }
}

export function introOverviewSection(props: {
  eyebrow?: string
  heading: string
  body?: string | string[]
  stats?: Array<{value: string; label: string}>
  checklist?: string[]
  cta?: ButtonInput
  secondaryCta?: ButtonInput
  image?: ImageInput
  theme?: Theme
  imageAlignment?: 'left' | 'right'
}): Block {
  return {
    _type: 'introOverviewSection',
    _key: key(),
    eyebrow: props.eyebrow ?? 'Local & Trusted',
    heading: props.heading,
    body: portableText(
      props.body ??
        'Professional, reliable service for homes and small commercial properties, with honest pricing and quality workmanship on every job.',
    ),
    // Default stats deliberately empty so we don't bake in fabricated review
    // counts. Pass `stats: [...]` explicitly when you have real numbers.
    stats: keyed(
      (props.stats ?? []).map((s) => ({_type: 'stat', value: s.value, label: s.label})),
    ),
    checklist: props.checklist ?? [
      'Free, no-obligation quotes',
      'Fully insured and accredited',
      'Honest, fixed pricing',
      'Tidy, reliable workmanship',
    ],
    cta: button(props.cta ?? {text: 'Get a Free Quote', href: '/quote'}),
    secondaryCta: button(props.secondaryCta ?? {text: 'Get a Free Quote', href: '/contact'}),
    ...(props.image ? {image: image(props.image)} : {}),
    theme: props.theme ?? 'light',
    imageAlignment: props.imageAlignment ?? 'right',
  }
}

export function mainServiceGrid(props: {
  eyebrow?: string
  heading: string
  subheading?: string
  items: Array<{
    icon?: string
    title: string
    description?: string
    bullets?: string[]
    cta?: ButtonInput
  }>
  theme?: Theme
  columns?: 2 | 3 | 4
}): Block {
  return {
    _type: 'mainServiceGrid',
    _key: key(),
    eyebrow: props.eyebrow ?? 'What We Can Help With',
    heading: props.heading,
    subheading:
      props.subheading ?? 'A full range of professional services for domestic and small commercial projects.',
    items: keyed(
      props.items.map((i) => ({
        _type: 'serviceItem',
        icon: i.icon ?? 'Wrench',
        title: i.title,
        ...defined({
          description: i.description,
          bullets: i.bullets,
          cta: i.cta ? button(i.cta) : undefined,
        }),
      })),
    ),
    theme: props.theme ?? 'light',
    columns: props.columns ?? 3,
  }
}

export function processSection(props: {
  eyebrow?: string
  heading: string
  subheading?: string
  steps: Array<{icon?: string; title: string; description?: string}>
  theme?: Theme
}): Block {
  return {
    _type: 'processSection',
    _key: key(),
    eyebrow: props.eyebrow ?? 'How It Works',
    heading: props.heading,
    subheading:
      props.subheading ??
      'From first enquiry to sign-off, the process is straightforward — clear communication, tidy work and finished on the timeline agreed.',
    steps: keyed(
      props.steps.map((s) => ({
        _type: 'processStep',
        icon: s.icon ?? 'CheckCircle2',
        title: s.title,
        ...defined({description: s.description}),
      })),
    ),
    theme: props.theme ?? 'light',
  }
}

export function contactForm(props: {title?: string} = {}): Block {
  return {
    _type: 'contactForm',
    _key: key(),
    title: props.title ?? 'Request a Free Quote',
  }
}
