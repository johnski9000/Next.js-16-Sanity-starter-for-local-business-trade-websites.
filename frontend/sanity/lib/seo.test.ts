import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {absoluteUrl, buildMetadata} from '@/sanity/lib/seo'

describe('absoluteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the bare path when NEXT_PUBLIC_SITE_URL is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect(absoluteUrl('/services/painting')).toBe('/services/painting')
  })

  it('prefixes the configured base and strips a trailing slash on the base', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://demo.example.com/')
    expect(absoluteUrl('/about')).toBe('https://demo.example.com/about')
  })

  it('does not double-strip when the base has no trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://demo.example.com')
    expect(absoluteUrl('/')).toBe('https://demo.example.com/')
  })
})

describe('buildMetadata', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://demo.example.com')
    // Keep twitter:site deterministic regardless of the host env.
    vi.stubEnv('NEXT_PUBLIC_TWITTER_HANDLE', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses seo.title/description when present', () => {
    const meta = buildMetadata({
      seo: {title: 'SEO Title', description: 'SEO desc'},
      fallbackTitle: 'Fallback',
      fallbackDescription: 'Fallback desc',
    })
    expect(meta.title).toBe('SEO Title')
    expect(meta.description).toBe('SEO desc')
  })

  it('falls back to fallbackTitle/Description when seo fields are empty', () => {
    const meta = buildMetadata({
      seo: {title: '', description: null},
      fallbackTitle: 'Fallback Title',
      fallbackDescription: 'Fallback Description',
    })
    expect(meta.title).toBe('Fallback Title')
    expect(meta.description).toBe('Fallback Description')
  })

  it('builds an absolute canonical from the route path', () => {
    const meta = buildMetadata({path: '/services/interior-painting'})
    expect(meta.alternates?.canonical).toBe('https://demo.example.com/services/interior-painting')
  })

  it('prefers an explicit seo.canonical over the derived path', () => {
    const meta = buildMetadata({
      seo: {canonical: 'https://canonical.example.com/x'},
      path: '/ignored',
    })
    expect(meta.alternates?.canonical).toBe('https://canonical.example.com/x')
  })

  it('omits canonical when neither seo.canonical nor path are given', () => {
    const meta = buildMetadata({})
    expect(meta.alternates).toBeUndefined()
  })

  it('defaults robots to index + follow', () => {
    const meta = buildMetadata({})
    expect(meta.robots).toMatchObject({index: true, follow: true})
  })

  it('flips robots off from noIndex/noFollow', () => {
    const meta = buildMetadata({seo: {noIndex: true, noFollow: true}})
    expect(meta.robots).toMatchObject({index: false, follow: false})
  })

  it('handles a mixed noIndex true / noFollow false', () => {
    const meta = buildMetadata({seo: {noIndex: true, noFollow: false}})
    expect(meta.robots).toMatchObject({index: false, follow: true})
  })

  it('passes keywords through and emits a default OG image when none supplied', () => {
    const meta = buildMetadata({
      seo: {title: 'T', keywords: ['painter', 'decorator']},
    })
    expect(meta.keywords).toEqual(['painter', 'decorator'])
    const images = meta.openGraph?.images as Array<{url: string}>
    expect(images).toHaveLength(1)
    expect(images[0].url).toContain('/api/og?title=')
    expect(images[0].url).toContain(encodeURIComponent('T'))
  })
})
