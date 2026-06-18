import {stegaClean} from '@sanity/client/stega'
import {Star} from 'lucide-react'

import Image from '@/app/components/SanityImage'
import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

function initialsOf(name?: string) {
  return (name ?? '')
    .split(/[ &]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/** B · Mini case study — photo, story, result stats, attribution. */
export default function CaseStudy({
  block,
}: {
  block: ExtractPageBuilderType<'testimonials'>
}) {
  const {eyebrow, heading, caseImage} = block
  // Fall back to the first testimonial + the aggregate-derived stats so the
  // card is never an empty shell when only the generic testimonial fields are
  // seeded (the cards/resultsCTA shape) and the case-specific ones aren't.
  const featured = block.items?.[0]
  const caseBody = block.caseBody ?? featured?.quote
  const caseCustomer = block.caseCustomer ?? featured?.authorName
  const caseLocation = block.caseLocation ?? featured?.authorLocation
  const caseBadge = block.caseBadge ?? 'Verified review'
  const stats = (block.caseStats?.length ? block.caseStats : block.resultsStats) ?? []
  const dark = stegaClean(block.theme) === 'dark'
  const hasImage = Boolean(caseImage?.asset?._ref)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <div
          className={cn(
            'mx-auto grid max-w-5xl overflow-hidden rounded-3xl border shadow-xl lg:grid-cols-[0.85fr_1.15fr]',
            card,
            line,
          )}
        >
          {/* media */}
          <div
            className={cn(
              'relative min-h-70 lg:min-h-full',
              hasImage
                ? dark
                  ? 'bg-gray-800'
                  : 'bg-gray-200'
                : 'bg-linear-to-br from-brand/15 via-brand/5 to-transparent',
            )}
          >
            {hasImage ? (
              <Image
                id={caseImage!.asset!._ref}
                alt={caseImage?.alt ?? heading ?? ''}
                width={720}
                height={900}
                crop={caseImage?.crop ?? undefined}
                hotspot={caseImage?.hotspot ?? undefined}
                mode="cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-[10rem] leading-none text-brand/25"
              >
                &ldquo;
              </span>
            )}
            {caseBadge && (
              <span
                className={cn(
                  'absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm',
                  card,
                  ink,
                )}
              >
                <span className="flex gap-0.5">
                  {Array.from({length: 5}).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </span>
                {caseBadge}
              </span>
            )}
          </div>

          {/* body */}
          <div className="flex flex-col p-8 sm:p-10">
            {(eyebrow || heading) && (
              <Reveal as="div">
                {eyebrow && (
                  <span className="text-xs font-bold uppercase tracking-widest text-brand">{eyebrow}</span>
                )}
                {heading && (
                  <h2 className={cn('mt-2 text-balance text-2xl font-extrabold tracking-tight sm:text-3xl', ink)}>
                    {heading}
                  </h2>
                )}
              </Reveal>
            )}
            {caseBody && <p className={cn('mt-4 text-base leading-relaxed', soft)}>{caseBody}</p>}

            {stats.length > 0 && (
              <RevealGroup className={cn('mt-7 flex overflow-hidden rounded-xl border', line)} as="div">
                {stats.map((s, i) => (
                  <RevealItem key={s._key} className={cn('flex flex-1 flex-col gap-0.5 p-4', i > 0 && cn('border-l', line))} as="div">
                    <span className="text-xl font-extrabold tracking-tight text-brand">{s.value}</span>
                    <span className={cn('text-xs', soft)}>{s.label}</span>
                  </RevealItem>
                ))}
              </RevealGroup>
            )}

            {(caseCustomer || caseLocation) && (
              <div className="mt-7 flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-extrabold text-brand">
                  {initialsOf(caseCustomer)}
                </span>
                <span className="flex flex-col">
                  {caseCustomer && <strong className={cn('text-sm font-bold', ink)}>{caseCustomer}</strong>}
                  {caseLocation && <span className={cn('text-xs', soft)}>{caseLocation}</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
