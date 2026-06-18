import {stegaClean} from '@sanity/client/stega'

import QuoteForm from '@/app/components/sections/contact/QuoteForm'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import HeroSplitShell from './HeroSplitShell'

/**
 * Hero variant `splitForm` — copy on one side, the real quote form on the
 * other. Embeds the shared QuoteForm, which routes through the genuine lead
 * pipeline (/api/contact — per-tenant SMTP, consent, Turnstile, honeypot,
 * dead-letter).
 *
 * Service options come from `block.availableServices`, projected into the page
 * GROQ query server-side — the whole page-builder tree is a client tree
 * (PageBuilder is `'use client'` for visual editing), so we can't fetch them
 * here without pulling a `server-only` module into the client bundle.
 *
 * The form sits in a light card regardless of hero theme so its own (light)
 * styling always reads.
 */
export default function HeroSplitForm({
  block,
}: {
  block: ExtractPageBuilderType<'heroBanner'>
}) {
  const serviceNames = (block.availableServices ?? [])
    .map((s) => s?.name ?? '')
    .filter(Boolean)

  const media = (
    <div className="relative z-1 w-full rounded-3xl border border-border bg-card p-6 text-left text-card-foreground shadow-2xl sm:p-8">
      <QuoteForm services={serviceNames} />
    </div>
  )

  // Two looks, driven by `theme`:
  //  • dark  → paint `block.backgroundImage` as a full-bleed cover backdrop with
  //            a left→right dark gradient (bold, photographic hero).
  //  • light → no full-bleed photo; the shell renders the light solid backdrop
  //            (grid + brand glow) with dark text — the clean "form on a light
  //            page" look. The background photo is intentionally ignored here so
  //            a seeded image can't force the hero dark.
  const dark = stegaClean(block.theme) !== 'light'
  return <HeroSplitShell block={block} media={media} showBackgroundImage={dark} />
}
