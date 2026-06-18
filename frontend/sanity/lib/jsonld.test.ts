import {describe, it, expect, beforeAll, afterAll, vi} from 'vitest'

import {localBusinessJsonLd, reviewJsonLd, breadcrumbJsonLd, placeJsonLd} from './jsonld'
import {localBusinessId, placeIdForArea} from './siteIds'

// absoluteUrl (used by the @id helpers) falls back to NEXT_PUBLIC_SITE_URL outside
// a request scope, so pin it for deterministic @id host assertions. stubEnv +
// unstub so this file doesn't leak the var to others under --no-isolate.
const BASE = 'https://acme-test.example'
beforeAll(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', BASE)
})
afterAll(() => {
  vi.unstubAllEnvs()
})

const sd = {enabled: true, organization: {name: 'Acme Plumbing', url: BASE}}

describe('localBusinessJsonLd — aggregateRating gating (DMCC: never fabricate)', () => {
  it('omits aggregateRating when there are no reviews', () => {
    expect(localBusinessJsonLd(sd, {aggregateRating: null})!.aggregateRating).toBeUndefined()
    expect(
      localBusinessJsonLd(sd, {aggregateRating: {ratingValue: 5, reviewCount: 0}})!.aggregateRating,
    ).toBeUndefined()
  })

  it('emits aggregateRating (rounded to 1dp) only when reviewCount > 0', () => {
    const node = localBusinessJsonLd(sd, {aggregateRating: {ratingValue: 4.866, reviewCount: 12}})!
    expect(node.aggregateRating).toMatchObject({
      '@type': 'AggregateRating',
      ratingValue: 4.9,
      reviewCount: 12,
    })
  })

  it('returns null when structured data is disabled / missing org', () => {
    expect(localBusinessJsonLd({enabled: false})).toBeNull()
    expect(localBusinessJsonLd({enabled: true, organization: {name: 'X'}})).toBeNull()
  })
})

describe('@id host correctness', () => {
  it('builds @ids on the resolved base host', () => {
    expect(localBusinessId()).toBe(`${BASE}/#localbusiness`)
    expect(placeIdForArea('didsbury')).toBe(`${BASE}/areas/didsbury#place`)
    expect(localBusinessJsonLd(sd)!['@id']).toBe(`${BASE}/#localbusiness`)
    expect(placeJsonLd({slug: 'sale', name: 'Sale'})!['@id']).toBe(`${BASE}/areas/sale#place`)
  })
})

describe('reviewJsonLd — only real reviews', () => {
  it('returns null without both a body and an author', () => {
    expect(reviewJsonLd({body: '', authorName: 'Jo'})).toBeNull()
    expect(reviewJsonLd({body: 'Great work', authorName: ''})).toBeNull()
  })
  it('emits a Review when body + author are present', () => {
    const r = reviewJsonLd({body: 'Great work', authorName: 'Jo', rating: 5})
    expect(r).toMatchObject({'@type': 'Review', reviewBody: 'Great work'})
  })
})

describe('breadcrumbJsonLd — base precedence', () => {
  it('uses an explicit base when given', () => {
    const bc = breadcrumbJsonLd([{label: 'Home', href: '/'}], 'https://other.example')
    expect(bc!.itemListElement[0].item).toBe('https://other.example/')
  })
  it('falls back to the resolved base otherwise', () => {
    const bc = breadcrumbJsonLd([{label: 'Areas', href: '/areas'}])
    expect(bc!.itemListElement[0].item).toBe(`${BASE}/areas`)
  })
})
