import {describe, it, expect} from 'vitest'

import {DESIGNS} from './themes'

// WCAG 2.x relative luminance + contrast ratio.
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}
function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// colorBlueDeep is used for links + small accent text on white, so it must meet
// WCAG AA for normal text (>= 4.5:1). Guards against a future preset edit
// reintroducing a sub-AA accent (the slate preset was 3.9:1 before this gate).
describe('design preset accent contrast (AA)', () => {
  for (const [key, preset] of Object.entries(DESIGNS)) {
    it(`${key}: colorBlueDeep meets AA on white`, () => {
      expect(contrast(preset.colorBlueDeep, '#ffffff')).toBeGreaterThanOrEqual(4.5)
    })
  }
})
