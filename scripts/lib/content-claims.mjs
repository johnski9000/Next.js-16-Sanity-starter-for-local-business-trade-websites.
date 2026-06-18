// Shared "risky claim" detector — used by verify-tenant's content guard to block a
// site that shipped un-rewritten demo copy or fabricated trust claims, and as the
// canonical list of what was stripped from the trade packs.
//
// Two tiers:
//   DEMO_PHRASES   — distinctive strings from the seed packs. Treated as BLOCKING by
//                    the caller UNLESS the client's brief declares them (verify-tenant
//                    allowlists any phrase present in the brief's facts when run with
//                    --briefs): a genuine Worcester-Bosch-accredited client who states
//                    it in their brief may say it; a phrase in the copy but absent from
//                    the brief is inherited pack phrasing / an unsubstantiated claim.
//   GENERIC_RISKY  — shapes of fabrication-prone claims (specific prices, warranty
//                    lengths, %, response-time SLAs, regulator claims). WARN: legitimate
//                    ONLY if the client genuinely holds them — a human must confirm.

// Distinctive seed-pack claims (lower-cased substring match). Keep in sync if packs change.
export const DEMO_PHRASES = [
  'worcester bosch diamond',
  'vaillant advance',
  '12-year manufacturer',
  '12 year manufacturer',
  'flat call-out',
  'under-60-minute',
  'under 60 minute',
  'first-time fix',
  'thermal imaging leak detection',
  'from £1,950',
  'gas safe registered plumbing, heating',
]

// Generic fabrication-prone shapes — WARN, confirm against real client facts.
export const GENERIC_RISKY = [
  {label: 'specific price/fee', re: /£\s?\d{2,5}\b/},
  {label: 'warranty length', re: /\b\d{1,2}[\s-]?year(s)?\b[^.]{0,30}\bwarrant/i},
  {label: 'percentage stat', re: /\b\d{1,3}\s?%/},
  {label: 'response-time SLA', re: /\bunder[\s-]?\d+[\s-]?(min|minute|hour)/i},
  {label: 'regulator/accreditation claim', re: /\b(gas safe|niceic|napit|fensa|checkatrade)\b/i},
]

// Shared normaliser. DEMO_PHRASE detection AND the verify-tenant allowlist MUST use
// this same function, or a phrase could be detected in copy yet fail to match the
// brief that declared it (e.g. "&" vs "and", or a comma), causing a spurious FAIL.
// Lower-case, "&"→"and", strip punctuation to spaces, collapse whitespace.
export function normaliseClaimText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Scan plain text. Returns {blocking:[phrase…], warnings:[{label,sample}…]}. */
export function findRiskyClaims(text) {
  const t = normaliseClaimText(text)
  // Detect on the normalised forms so detection matches how the allowlist compares.
  const blocking = DEMO_PHRASES.filter((p) => t.includes(normaliseClaimText(p)))
  const warnings = []
  for (const {label, re} of GENERIC_RISKY) {
    // GENERIC_RISKY shapes need the punctuation (£, %, hyphens) — run on raw text.
    const m = String(text || '').match(re)
    if (m) warnings.push({label, sample: m[0]})
  }
  return {blocking, warnings}
}
