import {describe, expect, it} from 'vitest'

import {serializeJsonLd} from '@/app/components/JsonLd'

describe('serializeJsonLd', () => {
  it('escapes < > and & so a "</script>" payload cannot break out of the tag', () => {
    const out = serializeJsonLd({name: 'Acme </script><script>alert(1)</script>'})

    // None of the raw breakout characters survive in the serialised output.
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    expect(out).not.toContain('&')
    expect(out).toContain('\\u003c')
    expect(out).toContain('\\u003e')
    // Specifically the literal closing tag must be gone.
    expect(out).not.toContain('</script>')
  })

  it('unicode-escapes & (e.g. HTML entities / query strings)', () => {
    const out = serializeJsonLd({url: 'https://example.com/?a=1&b=2'})
    expect(out).not.toContain('&')
    expect(out).toContain('\\u0026')
  })

  it('round-trips: the escaped output is still valid JSON equal to the input', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Bright & Bold </script>',
      tags: ['a < b', 'c > d', 'e & f'],
      nested: {note: '1 < 2 && 3 > 2'},
    }

    const out = serializeJsonLd(data)
    // Escapes are pure \uXXXX sequences, so JSON.parse decodes them back.
    expect(JSON.parse(out)).toEqual(data)
  })

  it('produces no extra characters versus JSON.stringify (byte-for-byte same length intent)', () => {
    const data = {a: 1, b: 'plain'}
    // No <, >, & present → output must be identical to JSON.stringify.
    expect(serializeJsonLd(data)).toBe(JSON.stringify(data))
  })
})
