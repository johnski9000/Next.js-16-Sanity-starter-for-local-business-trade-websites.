// Design profiles — the client-facing "which design?" pick list. TRADE-NEUTRAL:
// any trade (plumber, electrician, builder, …) can wear any design.
//
// A profile bundles a DESIGN PRESET (colour) with a per-section LAYOUT (the
// `variant` on each page-builder block). On this single-tenant base the colour is
// an env var (NEXT_PUBLIC_DESIGN, read at runtime) and the layout is written to the
// site's own Sanity dataset — apply both in one step with:
//   node scripts/apply-design.mjs <heritage|signature|momentum>
//
// The three designs map to the colour presets in frontend/lib/themes.ts:
//   heritage  → navy    (classic & trustworthy)
//   signature → forest  (upmarket & editorial)
//   momentum  → crimson (bold & conversion-led)
//
// NOTE: fonts are intentionally NOT here. The frontend uses a fixed heading font
// (Montserrat via next/font); per-profile fonts need frontend work first.
//
// Variant values must match the block dispatchers in
// frontend/app/components/sections/<section>/. Unknown values fall back to the
// block's default variant (no crash), but keep these in sync.

export const PROFILES = {
  // Design 1 — classic, trustworthy, solid.
  heritage: {
    label: 'Heritage — classic & trustworthy (navy)',
    design: 'navy',
    variants: {
      heroBanner: 'banner',
      introOverviewSection: 'split',
      whyChooseUs: 'split',
      faq: 'accordion',
      cta: 'standard',
      processSection: 'timeline',
      testimonials: 'cards',
      blogSection: 'grid',
    },
  },
  // Design 2 — upmarket, editorial, refined.
  signature: {
    label: 'Signature — upmarket & editorial (forest)',
    design: 'forest',
    variants: {
      heroBanner: 'splitImage',
      introOverviewSection: 'editorial',
      whyChooseUs: 'editorial',
      faq: 'split',
      cta: 'band',
      processSection: 'flow',
      testimonials: 'caseStudy',
      blogSection: 'list',
    },
  },
  // Design 3 — bold, modern, conversion-led.
  momentum: {
    label: 'Momentum — bold & conversion-led (crimson)',
    design: 'crimson',
    variants: {
      heroBanner: 'splitForm',
      introOverviewSection: 'facts',
      whyChooseUs: 'guarantee',
      faq: 'grid',
      cta: 'phone',
      processSection: 'bigNumber',
      testimonials: 'resultsCTA',
      blogSection: 'featured',
    },
  },
}

export const PROFILE_KEYS = Object.keys(PROFILES)
