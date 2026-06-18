import {describe, it, expect} from 'vitest'

import {tokensMatch} from './safe-token'

// Guards the gate used by tenant-check / health / lead-health. A regression to a
// short-circuit compare (or a length-mismatch crash) would silently weaken every
// diagnostic route, so assert the contract directly.
describe('tokensMatch (constant-time gate)', () => {
  it('returns true only for an exact match', () => {
    expect(tokensMatch('s3cr3t-token', 's3cr3t-token')).toBe(true)
  })
  it('returns false for a different same-length token', () => {
    expect(tokensMatch('aaaaaaaa', 'aaaaaaab')).toBe(false)
  })
  it('returns false on a length mismatch (no crash from timingSafeEqual)', () => {
    expect(tokensMatch('short', 'a-much-longer-token')).toBe(false)
    expect(tokensMatch('a-much-longer-token', 'short')).toBe(false)
  })
  it('returns false when either side is missing/empty', () => {
    expect(tokensMatch(null, 'x')).toBe(false)
    expect(tokensMatch('x', null)).toBe(false)
    expect(tokensMatch(undefined, undefined)).toBe(false)
    expect(tokensMatch('', '')).toBe(false)
    expect(tokensMatch('', 'x')).toBe(false)
  })
})
