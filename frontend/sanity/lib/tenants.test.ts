import {describe, expect, it} from 'vitest'

import {normaliseHost} from './tenants'

describe('normaliseHost', () => {
  it('lower-cases, strips port and leading www', () => {
    expect(normaliseHost('WWW.Plumber-A.co.uk:3000')).toBe('plumber-a.co.uk')
  })
  it('handles null/undefined', () => {
    expect(normaliseHost(undefined)).toBe('')
    expect(normaliseHost(null)).toBe('')
  })
})
