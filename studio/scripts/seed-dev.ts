/**
 * CONTENT SEED — typed content model, parameterised by TRADE.
 *
 *   cd studio
 *   npx sanity exec scripts/seed-dev.ts --with-user-token
 *   # or: npm run seed:dev
 *
 * The DATA (services, areas, projects, blog posts, author, plus shared trust
 * signals / steps / area-link list) comes from the trade pack resolved by
 * `getPack(process.env.SEED_TRADE)` — see scripts/trade-packs/. The default
 * pack is `plumber` (the fictional "Vanguard Plumbing & Heating" demo). The
 * seeding LOGIC (asset upload, createOrReplace, references, deterministic
 * `_id`s) lives here and is trade-agnostic.
 *
 * Populates services, areas, projects, blog posts and (intentionally
 * invalid) serviceArea fixtures.
 *
 * ═══ AI AGENT CONTENT REQUIREMENTS ═══
 *
 * When modifying or replacing content (now in the trade pack), meet these
 * minimums (from structure/optimal-page-structures.md and setup.md §6):
 *
 * SERVICE PAGES (6 docs):
 *   Overview:   ≥150 words across 2-3 paragraphs (optimal: 300-600)
 *   What's Included: ≥4 items, each with title + ≥15-word description
 *   Process Steps: ≥3 steps, each with title + ≥15-word description
 *   FAQs:        ≥3 questions, answers 50-100 words (never one-liners)
 *   Trust Signals: ≥3 (insured, rated, free quotes, accredited, etc.)
 *   Pricing:     single-sentence estimate (e.g. "single room from £X")
 *   SEO:         metaTitle ≤60 chars, metaDescription ≤155 chars
 *
 * AREA PAGES (12 docs):
 *   Intro:       ≥150 words across 2-3 paragraphs, mention ≥1 local
 *                street/landmark per area (optimal: 300-600 total)
 *   CoverageNote: one sentence listing sub-areas / postcodes
 *   FAQs:        ≥2 area-specific questions (4-6 for tier-1 areas)
 *   Geo:         lat/long for Place structured data (all areas)
 *   Testimonials: NEVER fabricate. Leave localTestimonials[] empty
 *                 unless real, attributable reviews exist.
 *
 * BLOG POSTS (6 docs):
 *   Content:     ≥800 words, 4-7 H2 subheadings, ≥1 internal link
 *                to a service page embedded naturally in body
 *   Excerpt:     ≤155 chars, includes target keyword
 *   Author:      must reference a published person doc (seeded below)
 *
 * PROJECTS (6 docs):
 *   Body:        ≥200 words describing challenge → solution → approach
 *   Before/After: ≥1 pair per project (images seeded as placeholders)
 *   Testimonials: Demo reviews are fictional and pre-approved for this
 *                 demo only. Per-project testimonials stay empty —
 *                 homepage testimonials are seeded in seed-site.ts.
 *
 * FAQ ANSWER DEPTH (all FAQs across services / areas / combos):
 *   30-50 words: minimum for FAQPage schema eligibility
 *   50-100 words: sweet spot — scannable, full enough for rich results
 *   100-150 words: strong topical signal for high-volume queries
 *   NEVER: one-word answers ("Yes."), duplicate FAQs across pages,
 *          copy-pasted generic questions, no FAQ section at all
 *
 * See setup.md §6 for the full content depth table and pre-launch audit.
 *
 * ═══════════════════════════════════════════════════════
 *
 * Idempotent: deterministic `_id`s + `createOrReplace`. Placeholder images
 * are fetched from picsum (Sanity dedupes identical bytes by hash) — real
 * project photos must replace these before the gallery is launched.
 *
 * The two serviceArea fixtures at the bottom are deliberately invalid
 * (one draft, one published-but-gate-fails) — they exist as QA coverage
 * for the gate logic and render 404+noindex on the live site. They are
 * deliberate test data and stay in this seed script rather than the pack.
 */
import {client, image, key, localImageRef, portableText, richPortableText, uploadImage} from './seed'
import {getPack} from './trade-packs'

// Trade-specific content (services, areas, projects, posts, person, shared
// trust signals / steps / area-link list) all come from the resolved pack.
// The seeding LOGIC below — asset upload, createOrReplace, references and
// deterministic _ids — stays here and is trade-agnostic.
const pack = getPack(process.env.SEED_TRADE)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const imgCache = new Map<string, string>()

async function asset(seed: string): Promise<string> {
  let ref = imgCache.get(seed)
  if (!ref) {
    try {
      ref = await uploadImage(`https://picsum.photos/seed/${seed}/1200/900`, `${seed}.jpg`)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`! image "${seed}" skipped (${(e as Error).message})`)
      ref = ''
    }
    imgCache.set(seed, ref)
  }
  return ref
}

async function img(seed: string, alt: string) {
  const ref = await asset(seed)
  return ref ? image({assetRef: ref, alt}) : undefined
}

async function galleryImg(seed: string, alt: string, caption: string) {
  const ref = await asset(seed)
  return ref ? {...image({assetRef: ref, alt}), _key: key(), caption} : undefined
}

async function beforeAfter(seed: string, label: string) {
  const before = await img(`${seed}-before`, `${label} — before`)
  const after = await img(`${seed}-after`, `${label} — after`)
  if (!before || !after) return undefined
  return {_type: 'beforeAfterPair', _key: key(), label, beforeImage: before, afterImage: after}
}

// --- Real plumber seed images (mapped by purpose, not by slug-string) -------
// Service photos keyed by the (stable) plumber service slugs; areas/person use a
// single shared photo; projects cycle the before/after pairs; posts cycle covers.
// Unmapped keys fall back to the picsum helpers above.
// A trade pack may override any of these via pack.images (keyed by ITS service
// slugs); anything omitted keeps the plumber default below (which resolves from
// the plumber image set via the per-file fallback in localImageRef).
const SERVICE_IMAGES: Record<string, string> = pack.images?.service ?? {
  'boiler-installation-heating-upgrades': 'boiler-installation-photo.webp',
  'emergency-plumbing-repairs': 'emergency-plumbing.webp',
  'bathroom-design-renovation': 'bathroom-renovation-photo.webp',
  'gas-safety-certificates-boiler-servicing': 'gas-safety-servicing-photo.webp',
  'power-flushing-system-clean': 'power-flushing-photo.webp',
  'underfloor-heating-installation': 'underfloor-heating-photo.webp',
}
const AREA_HERO_IMAGE = pack.images?.areaHero ?? 'uk-residential-street.webp'
const PERSON_IMAGE = pack.images?.person ?? 'plumber-headshot.webp'
const BEFORE_AFTER_PAIRS: Array<[string, string]> = pack.images?.beforeAfter ?? [
  ['before-bathroom.webp', 'after-bathroom.webp'],
  ['before-boiler.webp', 'after-boiler.webp'],
]
const POST_COVERS = pack.images?.postCovers ?? ['dripping-tap.webp', 'radiator.webp', 'water-heater.webp']

async function localImg(filename: string, alt: string) {
  return image({assetRef: await localImageRef(filename), alt})
}
async function localGalleryImg(filename: string, alt: string, caption: string) {
  return {...image({assetRef: await localImageRef(filename), alt}), _key: key(), caption}
}
async function localBeforeAfter(beforeFile: string, afterFile: string, label: string) {
  return {
    _type: 'beforeAfterPair',
    _key: key(),
    label,
    beforeImage: await localImg(beforeFile, `${label} — before`),
    afterImage: await localImg(afterFile, `${label} — after`),
  }
}

const seo = (title: string, description: string) => ({
  title,
  description,
  noIndex: false,
  noFollow: false,
  hideFromSitemap: false,
})

const ref = (id: string) => ({_type: 'reference', _ref: id})
const refKeyed = (id: string) => ({_type: 'reference', _ref: id, _key: key()})
// Wraps each answer in `richPortableText` so the FAQ field shape matches
// the upgraded `blockContentTextOnly` schema. Inline `[anchor](/url)`
// markdown in the answer string becomes a real link annotation; plain
// answers fall through to plain-text PT blocks. The frontend FAQ accordion
// renders the link; `faqPageJsonLd` flattens back to plain text per spec.
const faq = (question: string, answer: string) => ({
  _type: 'faqItem',
  _key: key(),
  question,
  answer: richPortableText(answer),
})
const inclusion = (title: string, description: string) => ({
  _type: 'inclusion',
  _key: key(),
  title,
  description,
})
const step = (icon: string, title: string, description: string) => ({
  _type: 'step',
  _key: key(),
  icon,
  title,
  description,
})

// ---------------------------------------------------------------------------
// Services  (data: pack.services / pack.shared)
// ---------------------------------------------------------------------------

// Shared trust signals shown on every service page (from the pack).
const SHARED_TRUST_SIGNALS = pack.shared.trustSignals

const SERVICES = pack.services

const serviceId = (slug: string) => `service-${slug}`

async function seedServices() {
  for (const s of SERVICES) {
    const heroFile = SERVICE_IMAGES[s.slug]
    const hero = heroFile
      ? await localImg(heroFile, `${s.name} — ${pack.business.siteTitle}`)
      : await img(`svc-${s.slug}`, `${s.name} — ${pack.business.siteTitle}`)
    const areaSlugs = s.areasServed ?? AREAS.map((a) => a.slug)
    await client.createOrReplace({
      _id: serviceId(s.slug),
      _type: 'service',
      name: s.name,
      ...(s.h1 ? {h1: s.h1} : {}),
      slug: {_type: 'slug', current: s.slug},
      order: s.order,
      icon: s.icon,
      summary: s.summary,
      ...(hero ? {heroImage: hero} : {}),
      overview: richPortableText(s.overview),
      trustSignals: SHARED_TRUST_SIGNALS.map(([icon, label]) => ({
        _type: 'trustSignal',
        _key: key(),
        icon,
        label,
      })),
      whatsIncluded: s.whatsIncluded.map(([t, d]) => inclusion(t, d)),
      steps: s.steps.map(([i, t, d]) => step(i, t, d)),
      faqs: s.faqs.map(([q, a]) => faq(q, a)),
      pricingIndication: s.pricingIndication,
      areasServed: areaSlugs.map((slug) => refKeyed(areaId(slug))),
      seo: seo(s.metaTitle, s.metaDescription),
    })
    // eslint-disable-next-line no-console
    console.log(`✓ service  ${s.name}  (${areaSlugs.length} areas)`)
  }
}

// ---------------------------------------------------------------------------
// Areas  (data: pack.areas)
// ---------------------------------------------------------------------------

const AREAS = pack.areas

const areaId = (slug: string) => `area-${slug}`

async function seedAreas() {
  for (const a of AREAS) {
    const hero = await localImg(AREA_HERO_IMAGE, `${pack.sections.areaHeroAltPrefix} in ${a.name}`)
    await client.createOrReplace({
      _id: areaId(a.slug),
      _type: 'area',
      name: a.name,
      ...(a.h1 ? {h1: a.h1} : {}),
      slug: {_type: 'slug', current: a.slug},
      order: a.order,
      ...(hero ? {heroImage: hero} : {}),
      intro: richPortableText(a.intro),
      coverageNote: a.coverageNote,
      ...(a.geo ? {geo: a.geo} : {}),
      // Local testimonials intentionally empty — real reviews surface on the
      // homepage via seed-site.ts; per-area attribution would require
      // confirming which job each reviewer is referring to.
      localTestimonials: [],
      faqs: a.faqs.map(([q, ans]) => faq(q, ans)),
      seo: seo(a.metaTitle, a.metaDescription),
    })
    // eslint-disable-next-line no-console
    console.log(`✓ area  ${a.name}`)
  }
}

// ---------------------------------------------------------------------------
// Projects (spread across area × service)  (data: pack.projects)
// ---------------------------------------------------------------------------
//
// Project photos remain picsum placeholders — replace these with real job
// photos before the gallery is presented publicly.

const PROJECTS = pack.projects

const projectId = (slug: string) => `project-${slug}`

async function seedProjects() {
  for (const p of PROJECTS) {
    const [beforeFile, afterFile] = BEFORE_AFTER_PAIRS[PROJECTS.indexOf(p) % BEFORE_AFTER_PAIRS.length]
    const cover = await localImg(afterFile, p.title)
    const g1 = await localGalleryImg(beforeFile, `${p.title} — before`, 'Before')
    const g2 = await localGalleryImg(afterFile, `${p.title} — after`, 'After')
    const ba = await localBeforeAfter(beforeFile, afterFile, p.title)
    await client.createOrReplace({
      _id: projectId(p.slug),
      _type: 'project',
      title: p.title,
      slug: {_type: 'slug', current: p.slug},
      services: p.services.map((s) => refKeyed(serviceId(s))),
      area: ref(areaId(p.area)),
      summary: p.summary,
      body: portableText([p.body]),
      completedAt: p.completedAt,
      featured: PROJECTS.indexOf(p) < 3,
      ...(cover ? {coverImage: cover} : {}),
      gallery: [g1, g2].filter(Boolean),
      ...(ba ? {beforeAfter: [ba]} : {}),
      // Per-project testimonials deliberately not seeded — attributing real
      // reviews to specific jobs would be fabrication. Real reviews surface
      // on the homepage instead (see seed-site.ts).
      seo: seo(p.metaTitle, p.metaDescription),
    })
    // eslint-disable-next-line no-console
    console.log(`✓ project  ${p.title}`)
  }
}

// ---------------------------------------------------------------------------
// Person (blog author)  (data: pack.person)
// ---------------------------------------------------------------------------

const personId = pack.person.id

async function seedPerson() {
  await client.createOrReplace({
    _id: personId,
    _type: 'person',
    firstName: pack.person.firstName,
    lastName: pack.person.lastName,
    slug: {_type: 'slug', current: pack.person.slug},
    picture: await localImg(PERSON_IMAGE, `${pack.person.firstName} ${pack.person.lastName}`),
  })
  // eslint-disable-next-line no-console
  console.log(`✓ person  ${pack.person.firstName} ${pack.person.lastName}`)
}

// ---------------------------------------------------------------------------
// Blog posts (evergreen seed content)  (data: pack.posts)
// ---------------------------------------------------------------------------
//
// Long-form SEO content targeting long-tail queries that the service pages
// don't compete for directly. Each post uses `## ` markdown-style headings
// and inline `[anchor](/url)` links — both parsed by `richPortableText`.

const POSTS = pack.posts

const postId = (slug: string) => `post-${slug}`

async function seedPosts() {
  // Ensure author exists before posts reference it
  await seedPerson()
  for (const p of POSTS) {
    const coverImage = await localImg(POST_COVERS[POSTS.indexOf(p) % POST_COVERS.length], p.title)
    await client.createOrReplace({
      _id: postId(p.slug),
      _type: 'post',
      title: p.title,
      slug: {_type: 'slug', current: p.slug},
      date: p.date,
      excerpt: p.excerpt,
      coverImage,
      content: richPortableText(p.content),
      author: ref(personId),
    })
    // eslint-disable-next-line no-console
    console.log(`✓ post  ${p.title}`)
  }
}

// ---------------------------------------------------------------------------
// serviceArea — 2 reserved fixtures, deliberately NOT launchable
// ---------------------------------------------------------------------------
//
// These are deliberate QA test data (not per-trade content) and reference the
// plumber fixtures by id. They stay in the seed script per the trade-pack
// design — they exercise the gate logic, not the trade's real content.

async function seedServiceAreas() {
  // Pack-derived so the fixtures work for ANY trade pack (not just plumber):
  // use the current pack's first two services/areas + its projects.
  const svcA = SERVICES[0]?.slug
  const svcB = SERVICES[1]?.slug ?? svcA
  const areaA = AREAS[0]?.slug
  const areaB = AREAS[1]?.slug ?? areaA
  if (!svcA || !areaA || !svcB || !areaB) return
  const projRef = (i: number) => (PROJECTS[i] ? [refKeyed(projectId(PROJECTS[i].slug))] : [])

  // (A) DRAFT — would pass the gate, but unpublished -> route must 404.
  await client.createOrReplace({
    _id: `drafts.serviceArea-${svcA}-${areaA}`,
    _type: 'serviceArea',
    service: ref(serviceId(svcA)),
    area: ref(areaId(areaA)),
    localIntro:
      'Reserved fixture — a genuinely local two-to-three-sentence intro long enough to clear the minimum length gate so this draft is otherwise complete. It stays a draft so the route returns 404.',
    projects: [...projRef(0), ...projRef(1)],
    localFaqs: [faq('Do you cover this area?', 'Yes — and the surrounding postcodes.')],
    seo: seo('Reserved fixture', 'Reserved fixture — should never be indexed.'),
  })
  // eslint-disable-next-line no-console
  console.log(`✓ serviceArea  ${svcA}-${areaA}  [DRAFT — unpublished]`)

  // (B) PUBLISHED but FAILS the gate (1 project, short intro, no testimonial/FAQ)
  //     -> route must render 404 + noindex despite being published.
  await client.createOrReplace({
    _id: `serviceArea-${svcB}-${areaB}`,
    _type: 'serviceArea',
    service: ref(serviceId(svcB)),
    area: ref(areaId(areaB)),
    localIntro: 'Reserved fixture — gate intentionally fails.',
    projects: projRef(0),
    seo: seo('Reserved fixture', 'Reserved fixture — published but gate fails by design.'),
  })
  // eslint-disable-next-line no-console
  console.log(`✓ serviceArea  ${svcB}-${areaB}  [PUBLISHED — gate fails on purpose]`)
}

// ---------------------------------------------------------------------------

async function main() {
  // Order matters: strong references require the target to exist first.
  // areas ← services(areasServed) ← projects(services,area) ← serviceAreas.
  // Posts reference person(author) — seedPosts creates the person first, then posts.
  await seedAreas()
  await seedServices()
  await seedProjects()
  await seedServiceAreas()
  await seedPosts()
  // eslint-disable-next-line no-console
  console.log(
    '\nContent seed complete. Images are illustrative demo stock (frontend/public/images/) — replace with the client’s own photos before launch.',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
