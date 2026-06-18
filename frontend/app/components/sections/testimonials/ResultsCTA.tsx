import {stegaClean} from '@sanity/client/stega'
import {Phone, Star} from 'lucide-react'

import Image from '@/app/components/SanityImage'
import ResolvedLink from '@/app/components/ResolvedLink'
import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

function initialsOf(name?: string) {
  return (name ?? '')
    .split(/[ &]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/** C · Featured quote + results stats beside a CTA button (uses the first testimonial). */
export default function ResultsCTA({
  block,
}: {
  block: ExtractPageBuilderType<'testimonials'>
}) {
  const featured = block.items?.[0]
  // Drop any zero stat (e.g. "0★", "0+ Verified reviews") — an empty aggregate
  // reads as broken. With no real stats the panel falls back to just the CTA.
  const stats = (block.resultsStats ?? []).filter((s) => {
    const n = Number.parseFloat(String(s.value))
    return Number.isNaN(n) || n !== 0
  })
  const {ctaButton, resultsNote} = block
  const dark = stegaClean(block.theme) === 'dark'
  const hasCta = Boolean(ctaButton?.buttonText && ctaButton?.link)
  const hasAvatar = Boolean(featured?.avatar?.asset?._ref)
  // The side panel only earns its space when it has something to show. Without
  // stats / a CTA / a note it would render as an empty bordered card, so drop
  // it entirely and let the quote run full-width.
  const hasPanel = stats.length > 0 || hasCta || Boolean(resultsNote)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <div
          className={cn(
            'grid items-center gap-10',
            hasPanel && 'lg:grid-cols-[1.15fr_0.85fr]',
          )}
        >
          {/* quote */}
          <Reveal className={cn(!hasPanel && 'mx-auto max-w-3xl text-center')} as="div">
            <span aria-hidden className="block font-serif text-6xl leading-[0.4] text-brand/55">
              &ldquo;
            </span>
            {featured?.quote && (
              <blockquote
                className={cn('mt-3 text-balance text-2xl font-bold leading-snug tracking-tight sm:text-3xl', ink)}
              >
                {featured.quote}
              </blockquote>
            )}
            {featured && (featured.authorName || featured.authorLocation) && (
              <div className="mt-6 flex items-center gap-3">
                {hasAvatar ? (
                  <Image
                    id={featured.avatar!.asset!._ref}
                    alt={featured.authorName ?? ''}
                    width={48}
                    mode="cover"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-extrabold text-brand">
                    {initialsOf(featured.authorName)}
                  </span>
                )}
                <span className="flex flex-col">
                  {featured.authorName && (
                    <strong className={cn('text-base font-bold', ink)}>{featured.authorName}</strong>
                  )}
                  {featured.authorLocation && (
                    <span className={cn('text-sm', soft)}>{featured.authorLocation}</span>
                  )}
                </span>
                <span className="ml-auto flex gap-0.5">
                  {Array.from({length: 5}).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </span>
              </div>
            )}
          </Reveal>

          {/* side: stats + CTA */}
          {hasPanel && (
          <div className={cn('rounded-3xl border p-7 shadow-lg', card)}>
            {stats.length > 0 && (
              <RevealGroup className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-xl border', line, dark ? 'bg-white/10' : 'bg-gray-200')} as="div">
                {stats.map((s) => (
                  <RevealItem key={s._key} className={cn('flex flex-col gap-0.5 p-4', dark ? 'bg-gray-900' : 'bg-white')} as="div">
                    <span className={cn('text-2xl font-extrabold tracking-tight', ink)}>{s.value}</span>
                    <span className={cn('text-xs leading-tight', soft)}>{s.label}</span>
                  </RevealItem>
                ))}
              </RevealGroup>
            )}
            {hasCta && (
              <ResolvedLink
                link={ctaButton!.link as unknown as DereferencedLink}
                className="mt-4 flex items-center justify-center gap-2.5 rounded-xl bg-brand px-6 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              >
                <Phone className="h-5 w-5" />
                {ctaButton!.buttonText}
              </ResolvedLink>
            )}
            {resultsNote && (
              <span className={cn('mt-3 block text-center text-xs', soft)}>{resultsNote}</span>
            )}
          </div>
          )}
        </div>
      </div>
    </section>
  )
}
