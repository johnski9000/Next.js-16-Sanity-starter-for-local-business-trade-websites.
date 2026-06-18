/**
 * serviceArea publish gate (frontend enforcement).
 *
 * Mirrors the Studio document-level validation AND additionally verifies
 * the project refs actually match this doc's service + area (Studio can't
 * deref during validation). Returns true only when the doc is genuinely
 * launchable; the catch-all route 404s otherwise (a 404 is inherently
 * noindex), so unpublished OR published-but-incomplete combos never index.
 *
 * At launch: zero serviceArea docs pass — the pattern is reserved only.
 */
type SAProject = {
  area?: {_id?: string | null} | null
  services?: Array<{_id?: string | null} | null> | null
}

export type ServiceAreaGateInput = {
  localIntro?: string | null
  localTestimonial?: {quote?: string | null} | null
  localFaqs?: unknown[] | null
  service?: {_id?: string | null} | null
  area?: {_id?: string | null} | null
  projects?: SAProject[] | null
} | null | undefined

export function serviceAreaGatePasses(sa: ServiceAreaGateInput): boolean {
  if (!sa) return false

  if ((sa.localIntro ?? '').trim().length < 120) return false

  const serviceId = sa.service?._id
  const areaId = sa.area?._id
  if (!serviceId || !areaId) return false

  const matching = (sa.projects ?? []).filter(
    (p) =>
      p?.area?._id === areaId &&
      (p?.services ?? []).some((s) => s?._id === serviceId),
  )
  if (matching.length < 2) return false

  const hasTestimonial = Boolean(sa.localTestimonial?.quote)
  const hasFaq = Array.isArray(sa.localFaqs) && sa.localFaqs.length > 0
  return hasTestimonial || hasFaq
}
