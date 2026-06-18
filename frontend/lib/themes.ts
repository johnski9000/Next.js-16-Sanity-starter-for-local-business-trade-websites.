/**
 * Design presets — TRADE-NEUTRAL visual themes (palette). A tenant picks one via
 * `branding.design`; the layout injects the matching CSS variables onto <html>, so
 * `bg-brand` / `text-blue` / `text-blue-deep` recolour per client without touching
 * components. Any trade can use any design (designs are orthogonal to trade packs).
 *
 * Each preset overrides the brand-driven tokens from globals.css:
 *   --color-brand / --primary  (CTA fills, primary surfaces — kept in sync)
 *   --color-blue / --ring      (accent + focus ring)
 *   --color-blue-deep          (links & small accent text — keep ≥ AA contrast on white)
 * The ink (--foreground) and dark-section grays are neutral in globals.css, so they
 * work under any brand. A tenant's branding.primaryColor (if set) overrides the brand
 * colour (--color-brand + --primary) on top of the chosen preset.
 */

export type DesignPreset = {
  label: string
  colorBrand: string
  colorBlue: string
  colorBlueDeep: string
}

export const DESIGNS = {
  navy: {label: 'Navy (classic)', colorBrand: '#1e345b', colorBlue: '#1b9cde', colorBlueDeep: '#15799f'},
  slate: {label: 'Slate (modern)', colorBrand: '#0f172a', colorBlue: '#38bdf8', colorBlueDeep: '#0369a1'},
  forest: {label: 'Forest (trust)', colorBrand: '#14532d', colorBlue: '#22c55e', colorBlueDeep: '#15803d'},
  crimson: {label: 'Crimson (bold)', colorBrand: '#7f1d1d', colorBlue: '#f87171', colorBlueDeep: '#b91c1c'},
  graphite: {label: 'Graphite (minimal)', colorBrand: '#111827', colorBlue: '#f59e0b', colorBlueDeep: '#b45309'},
} as const satisfies Record<string, DesignPreset>

export type DesignKey = keyof typeof DESIGNS
export const DEFAULT_DESIGN: DesignKey = 'navy'
export const DESIGN_KEYS = Object.keys(DESIGNS) as DesignKey[]

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/**
 * CSS-variable overrides for a tenant's chosen design + optional brand-colour
 * override. Returned as a style object for the layout's <html>. Falls back to the
 * default design for an unknown/empty key.
 */
export function designCssVars(design?: string | null, primaryColor?: string | null): Record<string, string> {
  const preset = (design && DESIGNS[design as DesignKey]) || DESIGNS[DEFAULT_DESIGN]
  const vars: Record<string, string> = {
    '--color-brand': preset.colorBrand,
    '--primary': preset.colorBrand, // shadcn primary tracks the brand
    '--color-blue': preset.colorBlue,
    '--ring': preset.colorBlue, // focus ring tracks the accent
    '--color-blue-deep': preset.colorBlueDeep,
  }
  // A valid hex primaryColor overrides the brand colour, on top of the preset.
  if (primaryColor && HEX.test(primaryColor.trim())) {
    vars['--color-brand'] = primaryColor.trim()
    vars['--primary'] = primaryColor.trim()
  }
  return vars
}
