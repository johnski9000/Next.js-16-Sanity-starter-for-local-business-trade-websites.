// research-brief.mjs — turn a client brief into per-page CONTENT BRIEFS that an
// agent (now) or an API generator (later) uses to write unique, keyword-targeted,
// fact-constrained copy. This is the contract between SEO research and writing.
//
//   node scripts/research-brief.mjs [--brief scripts/client-brief.json] [--offline] [--max-combos N]
//
// For each page (home, every service, every area, every service×area combo) it:
//   1. derives seed queries from the brief,
//   2. mines Google Autocomplete (free; the PAA proxy — questions/local/pricing),
//   3. emits a content brief: target keywords, questions→FAQs, the ONLY facts the
//      writer may use (from the brief), required structure/depth, internal links.
//
// Output: frontend/seo/data/content-briefs/<key>/ (one JSON per page + index.json
// + briefs.md summary). NOTHING is written to Sanity here — the agent reads these
// and authors the copy per docs/CONTENT-AUTHORING-SPEC.md, then verify-tenant gates it.
//
// NOTE: author-content.mjs consumes only service--*/area--* briefs (home copy is
// page-builder/Studio-authored; combos are an opt-in growth surface it doesn't write
// yet), so the home (and combo) briefs are advisory keyword/structure guidance whose
// keyword coverage verify-tenant does not gate. That's intentional, not an oversight.

import fs from 'node:fs'
import path from 'node:path'

// ── args ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const getArg = (flag, def) => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def
}
const BRIEF_PATH = getArg('--brief', path.join('scripts', 'client-brief.json'))
const OFFLINE = argv.includes('--offline')
// Combos (service×area) are OFF by default: they're a GROWTH surface that only
// indexes once a client has real local proof (the serviceArea gate), so writing
// 72 of them at launch is wasted effort. Opt in with --combos when a client has
// earned it (and ideally once the API generator makes bulk authoring cheap).
const WANT_COMBOS = argv.includes('--combos')
const MAX_COMBOS = Number(getArg('--max-combos', '0')) // 0 = all (with --combos)

if (!fs.existsSync(BRIEF_PATH)) {
  console.error(`Brief not found: ${BRIEF_PATH}\nPass --brief <path> (or copy client-brief.example.json → client-brief.json).`)
  process.exit(1)
}
const brief = JSON.parse(fs.readFileSync(BRIEF_PATH, 'utf8'))

const trade = (brief.trade || 'plumber').toLowerCase()
const biz = brief.business || {}
const services = (brief.services || []).filter((s) => s?.name && s?.slug)
const areas = (brief.areas || []).filter((a) => a?.name && a?.slug)
const city = brief.address?.addressLocality || ''
// Output dir key: --key wins (so onboard.mjs can pin briefs to the TENANT key and keep
// content-briefs/<key>, authored/<key> and verify-tenant <key> all aligned); else the
// business name slugified.
const key =
  (getArg('--key', '') || biz.name || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
  'client'

if (!services.length || !areas.length) {
  console.error('Brief needs at least one service and one area.')
  process.exit(1)
}

// ── google autocomplete (mirror of frontend/seo/google-autocomplete.mjs) ───────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let suggestCalls = 0
let suggestResults = 0
let suggestErrors = 0
async function googleSuggest(query) {
  if (OFFLINE) return []
  suggestCalls++
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`,
    )
    const json = JSON.parse(await res.text())
    const out = (json[1] || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean)
    suggestResults += out.length
    return out
  } catch (e) {
    // Don't fail the whole run on one blocked/rate-limited request — but COUNT it so
    // a silently-empty live run (Google blocking) is distinguishable from --offline.
    suggestErrors++
    return []
  }
}
const isQuestion = (q) => /^(how|what|why|can|do|is|are|does|should|will|who|when)\b/.test(q)
const isPricing = (q) => /\b(cost|price|quote|pricing|how much|cheap|fee)\b/.test(q)
const isLocal = (q) => /\b(near me|local|nearby)\b/.test(q)

/** Run a set of seeds, return categorised unique suggestions. */
async function mine(seeds) {
  const out = new Set()
  for (const [i, seed] of seeds.entries()) {
    for (const s of await googleSuggest(seed)) out.add(s)
    if (!OFFLINE && i < seeds.length - 1) await sleep(150)
  }
  const all = [...out]
  return {
    keywords: all.filter((q) => !isQuestion(q)).slice(0, 12),
    questions: all.filter(isQuestion).slice(0, 8),
    local: all.filter(isLocal).slice(0, 6),
    pricing: all.filter(isPricing).slice(0, 6),
  }
}

// ── structure specs (the writer's depth contract per page type) ────────────────
const STRUCTURE = {
  home: 'Hero (H1 = "<trade> in <city>"), intro, services overview, why-choose (use differentiators), areas served, CTA. Lead with the strongest differentiator.',
  service:
    'H1 = service name. 2-3 paragraph overview (>=300 words total). "What\'s included" list of 5-8 real items (from service.details, or the service summary when details are absent). 4-5 FAQs built from the questions list. Internal links to 2-3 sibling services + the areas hub.',
  area: 'H1 = "<trade> in <area>". Local intro (>=150 words) referencing the area genuinely. List of services offered there. 3-4 local FAQs. Link to nearby areas + main services.',
  combo:
    'Local intro (>=120 words — the gate minimum) for "<service> in <area>". 1+ local FAQ. NOTE: indexes ONLY when it also has >=2 matching local projects + a testimonial/FAQ (serviceAreaGatePasses); otherwise it 301s to the parent service. Treat as a GROWTH page that fills in as local proof accrues — do not pad to fake depth.',
}

const FACT_RULES =
  'Use ONLY facts present in this brief object (service.details, service.summary, business.differentiators, business.description, trust.accreditations, address, openingHours). NEVER invent accreditations, warranties, prices, response times, or statistics not in the brief. UK English, plain trade voice, no keyword stuffing.'

const trustFacts = brief.trust || {}
const baseFacts = {
  business: {
    name: biz.name,
    shortDescription: biz.shortDescription,
    // description ships to the live site (org JSON-LD) and often holds the client's
    // genuine accreditations/claims — include it so those count as declared facts
    // for the verify-tenant claims allowlist (else they'd be wrongly blocked).
    description: biz.description || '',
    differentiators: biz.differentiators || [],
    yearsTrading: biz.yearsTrading || '',
    priceRange: biz.priceRange || '',
  },
  trust: {accreditations: trustFacts.accreditations || [], stat: trustFacts.stat || null},
  serviceAreaOnly: Boolean(brief.serviceAreaOnly),
}

// ── build per-page briefs ──────────────────────────────────────────────────────
const pages = []

// home
{
  const research = await mine([
    `${trade} ${city}`.trim(),
    `best ${trade} ${city}`.trim(),
    `${trade} near me`,
    `emergency ${trade} ${city}`.trim(),
  ])
  pages.push({
    page: 'home',
    title: `${biz.name} — home`,
    targetKeywords: dedupe([`${trade} ${city}`.trim(), `${trade} near me`, ...research.keywords]),
    questions: research.questions,
    localIntent: research.local,
    pricingQueries: research.pricing,
    facts: {...baseFacts, services: services.map((s) => s.name), areas: areas.map((a) => a.name)},
    internalLinks: [
      ...services.slice(0, 4).map((s) => ({label: s.name, href: `/services/${s.slug}`})),
      {label: 'Areas we cover', href: '/areas'},
    ],
    structure: STRUCTURE.home,
    factRules: FACT_RULES,
  })
}

// services
for (const s of services) {
  // Primary SEARCH term: the declared `keyword` (what people actually type) when present,
  // else the service name (often a zero-volume marketing term — DataForSEO promotion can
  // later swap a dead name-primary for a real searched variant).
  const svcTerm = s.keyword || s.name
  const research = await mine([
    svcTerm.toLowerCase(),
    `${svcTerm} cost`.toLowerCase(),
    `best ${svcTerm}`.toLowerCase(),
    `how much does ${svcTerm} cost`.toLowerCase(),
    `${svcTerm} ${city}`.toLowerCase().trim(),
  ])
  pages.push({
    page: 'service',
    service: s.slug,
    title: s.name,
    targetKeywords: dedupe([svcTerm.toLowerCase(), `${svcTerm} ${city}`.toLowerCase().trim(), ...research.keywords]),
    questions: research.questions,
    localIntent: research.local,
    pricingQueries: research.pricing,
    facts: {
      ...baseFacts,
      service: {name: s.name, summary: s.summary || '', details: s.details || ''},
      areasServed: areas.map((a) => a.name),
    },
    internalLinks: [
      ...services.filter((x) => x.slug !== s.slug).slice(0, 3).map((x) => ({label: x.name, href: `/services/${x.slug}`})),
      {label: 'Areas we cover', href: '/areas'},
    ],
    structure: STRUCTURE.service,
    factRules: FACT_RULES,
  })
}

// areas
for (const a of areas) {
  const research = await mine([
    `${trade} ${a.name}`.toLowerCase(),
    `${trade} in ${a.name}`.toLowerCase(),
    `emergency ${trade} ${a.name}`.toLowerCase(),
  ])
  const areaPrimary = (a.keyword || `${trade} ${a.name}`).toLowerCase().trim()
  pages.push({
    page: 'area',
    area: a.slug,
    title: `${biz.name} in ${a.name}`,
    targetKeywords: dedupe([areaPrimary, `${trade} in ${a.name}`.toLowerCase(), ...research.keywords]),
    questions: research.questions,
    localIntent: research.local,
    pricingQueries: research.pricing,
    facts: {...baseFacts, area: a.name, services: services.map((s) => s.name)},
    internalLinks: [
      ...services.slice(0, 4).map((s) => ({label: s.name, href: `/services/${s.slug}`})),
      ...areas.filter((x) => x.slug !== a.slug).slice(0, 3).map((x) => ({label: x.name, href: `/areas/${x.slug}`})),
    ],
    structure: STRUCTURE.area,
    factRules: FACT_RULES,
  })
}

// service × area combos — opt-in (--combos) GROWTH surface, composed from
// service+area (no extra network calls). Off by default; core pages come first.
let comboCount = 0
if (WANT_COMBOS) for (const s of services) {
  for (const a of areas) {
    if (MAX_COMBOS && comboCount >= MAX_COMBOS) break
    comboCount++
    const comboTerm = s.keyword || s.name
    pages.push({
      page: 'combo',
      service: s.slug,
      area: a.slug,
      title: `${s.name} in ${a.name}`,
      targetKeywords: [`${comboTerm} ${a.name}`.toLowerCase(), `${comboTerm} in ${a.name}`.toLowerCase(), `${trade} ${a.name}`.toLowerCase()],
      questions: [`how much is ${comboTerm} in ${a.name}`.toLowerCase(), `do you cover ${a.name}`.toLowerCase()],
      localIntent: [],
      pricingQueries: [],
      facts: {business: baseFacts.business, trust: baseFacts.trust, service: {name: s.name, summary: s.summary || '', details: s.details || ''}, area: a.name},
      internalLinks: [
        {label: s.name, href: `/services/${s.slug}`},
        {label: a.name, href: `/areas/${a.slug}`},
      ],
      structure: STRUCTURE.combo,
      factRules: FACT_RULES,
      gate: 'Indexes only with localIntro>=120 chars + >=2 matching local projects + (testimonial OR FAQ). Else 301 to the service page.',
    })
  }
}

function dedupe(arr) {
  return [...new Set(arr.filter(Boolean))]
}

// ── write ──────────────────────────────────────────────────────────────────────
const OUT = path.resolve('frontend/seo/data/content-briefs', key)
fs.mkdirSync(OUT, {recursive: true})
const slugFor = (p) =>
  p.page === 'combo' ? `combo--${p.service}--${p.area}` : p.page === 'service' ? `service--${p.service}` : p.page === 'area' ? `area--${p.area}` : 'home'
for (const p of pages) fs.writeFileSync(path.join(OUT, `${slugFor(p)}.json`), JSON.stringify(p, null, 2))

const counts = pages.reduce((m, p) => ((m[p.page] = (m[p.page] || 0) + 1), m), {})
// Research outcome — so a live run that Google silently blocked (0 results) is
// distinguishable from a true --offline run, both in index.json and on stdout.
const researchEmpty = !OFFLINE && suggestResults === 0
const research = {mode: OFFLINE ? 'offline' : 'live', calls: suggestCalls, suggestions: suggestResults, errors: suggestErrors, empty: researchEmpty}
fs.writeFileSync(
  path.join(OUT, 'index.json'),
  JSON.stringify({client: biz.name, key, trade, generatedFrom: BRIEF_PATH, offline: OFFLINE, research, counts, pages: pages.map(slugFor)}, null, 2),
)

// human-readable summary
const md = [
  `# Content briefs — ${biz.name} (${trade})`,
  ``,
  `Generated from \`${BRIEF_PATH}\`${OFFLINE ? ' (OFFLINE — no live keyword research)' : ''}. ` +
    `Pages: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}.`,
  ``,
  `The agent authors each page per **docs/CONTENT-AUTHORING-SPEC.md** using ONLY the facts in each brief, ` +
    `then \`node scripts/verify-tenant.mjs <key>\` gates structure/depth/keywords/uniqueness/claims.`,
  ``,
  `## Pages`,
  ...pages.map((p) => `- **${p.title}** \`${slugFor(p)}\` — ${p.targetKeywords.slice(0, 3).join(' · ')}${p.questions?.length ? ` — ${p.questions.length} Q` : ''}`),
].join('\n')
fs.writeFileSync(path.join(OUT, 'briefs.md'), md + '\n')

console.log(`✓ ${pages.length} content briefs → ${OUT}`)
console.log(`  ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(' · ')}${OFFLINE ? '  (offline)' : ''}`)
if (!OFFLINE) console.log(`  research: ${suggestResults} suggestions from ${suggestCalls} queries${suggestErrors ? `, ${suggestErrors} failed` : ''}`)
if (researchEmpty)
  console.warn(`  ⚠ LIVE run but autocomplete returned NOTHING (rate-limited/blocked?) — briefs have no question seeds. Re-run later, or proceed treating it as offline.`)
console.log(`  Next: agent writes copy per docs/CONTENT-AUTHORING-SPEC.md, then verify-tenant <key>.`)
