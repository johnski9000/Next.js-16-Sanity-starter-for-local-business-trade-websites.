import {describe, expect, it} from 'vitest'

import {buildSanityQueryUrl, normalizeApiVersion} from './_sanity-seo-data.mjs'

describe('normalizeApiVersion', () => {
  it('prepends the required "v" when the date version lacks it', () => {
    // A bare date (e.g. "2024-01-01") makes the query API 404 with
    // "no Route matched with those values" — the v is mandatory.
    expect(normalizeApiVersion('2024-01-01')).toBe('v2024-01-01')
  })

  it('leaves an already-prefixed version untouched', () => {
    expect(normalizeApiVersion('v2025-09-25')).toBe('v2025-09-25')
  })

  it('trims surrounding whitespace before prefixing', () => {
    expect(normalizeApiVersion('  2024-01-01  ')).toBe('v2024-01-01')
  })
})

describe('buildSanityQueryUrl', () => {
  const args = {
    projectId: 'abc123',
    dataset: 'production',
    apiVersion: '2024-01-01',
    query: '*[_type == "service"]',
  }

  it('embeds the v-prefixed API version in the path', () => {
    expect(buildSanityQueryUrl(args)).toContain('/v2024-01-01/data/query/production')
  })

  it('normalizes the API version even when passed without the v', () => {
    const url = buildSanityQueryUrl({...args, apiVersion: '2024-01-01'})
    expect(url).toContain('.api.sanity.io/v2024-01-01/')
  })

  it('NEVER puts the token in the query string (the API rejects unknown params)', () => {
    // Regression guard: the token must travel in the Authorization header.
    expect(buildSanityQueryUrl(args)).not.toContain('token=')
  })

  it('requests the published perspective', () => {
    expect(buildSanityQueryUrl(args)).toContain('perspective=published')
  })

  it('url-encodes the GROQ query so it round-trips', () => {
    const url = buildSanityQueryUrl(args)
    expect(new URL(url).searchParams.get('query')).toBe(args.query)
    // raw spaces / brackets must not appear unencoded in the query string
    expect(url).not.toContain('[_type == "service"]')
  })

  it('targets the correct project host', () => {
    expect(buildSanityQueryUrl(args)).toContain('https://abc123.api.sanity.io/')
  })
})
