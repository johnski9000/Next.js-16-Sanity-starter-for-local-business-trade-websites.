import {describe, it, expect} from 'vitest'

// Tests the SHARED ops env loader at repo-root scripts/lib/load-env.mjs (the module
// that fixed the inline-comment .env parser bug). It lives outside frontend, but
// frontend's vitest is the only runner — import it via relative path.
import {parseEnvValue, normaliseHost as scriptNormalise} from '../../scripts/lib/load-env.mjs'
import {normaliseHost as appNormalise} from '@/sanity/lib/tenants'

describe('parseEnvValue (inline-comment + quote handling)', () => {
  it('strips a trailing inline comment after whitespace', () => {
    expect(parseEnvValue('value # a comment')).toBe('value')
    expect(parseEnvValue('2024-01-01   # API version')).toBe('2024-01-01')
  })
  it('honours surrounding quotes and keeps a # INSIDE them', () => {
    expect(parseEnvValue('"2025-09-25" # Optional')).toBe('2025-09-25')
    expect(parseEnvValue("'has # hash'")).toBe('has # hash')
  })
  it('passes plain values through, trimmed', () => {
    expect(parseEnvValue('sk-abc123')).toBe('sk-abc123')
    expect(parseEnvValue('   spaced   ')).toBe('spaced')
  })
})

describe('normaliseHost parity with the frontend tenants.ts twin', () => {
  const hosts = [
    'www.Foo.COM:443',
    'Bar.com',
    'www.x.io',
    'sub.example.co.uk',
    'WWW.MixedCase.org',
    '*',
    '',
  ]
  it('lower-cases, strips port + leading www', () => {
    expect(scriptNormalise('www.Foo.COM:443')).toBe('foo.com')
    expect(scriptNormalise('Bar.com')).toBe('bar.com')
  })
  it('matches the app normaliseHost exactly (must stay identical twins)', () => {
    for (const h of hosts) expect(scriptNormalise(h)).toBe(appNormalise(h))
  })
})
