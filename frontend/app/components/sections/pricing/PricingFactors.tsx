import {stegaClean} from '@sanity/client/stega'
import {ArrowRight, Check} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import ResolvedLink from '@/app/components/ResolvedLink'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

import {pricingIcon} from './pricingIcons'

const gridCols = (n: number) =>
  n >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : n === 3 ? 'sm:grid-cols-3' : n === 2 ? 'sm:grid-cols-2' : ''

/** B · What goes into a quote — factors grid + reassurance bar. */
export default function PricingFactors({
  block,
}: {
  block: ExtractPageBuilderType<'pricingSection'>
}) {
  const {eyebrow, title, reassurance, ctaButton} = block
  const factors = block.factors ?? []
  const dark = stegaClean(block.theme) === 'dark'
  const hasCta = Boolean(ctaButton?.buttonText && ctaButton?.link)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center" as="div">
          {eyebrow && (
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 className={cn('mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl', ink)}>
              {title}
            </h2>
          )}
        </Reveal>

        {factors.length > 0 && (
          <RevealGroup className={cn('grid grid-cols-1 gap-4', gridCols(factors.length))} as="div">
            {factors.map((f) => {
              const Icon = pricingIcon(f.icon)
              return (
                <RevealItem key={f._key} className={cn('flex flex-col gap-3 rounded-2xl border p-6 shadow-sm', card)} as="div">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-6 w-6" />
                  </span>
                  {f.title && <strong className={cn('text-lg font-bold tracking-tight', ink)}>{f.title}</strong>}
                  {f.desc && <span className={cn('text-sm leading-relaxed', soft)}>{f.desc}</span>}
                </RevealItem>
              )
            })}
          </RevealGroup>
        )}

        {(reassurance || hasCta) && (
          <Reveal className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-green-600/25 bg-green-500/5 px-6 py-5 sm:flex-row" as="div">
            {reassurance && (
              <span className={cn('inline-flex items-center gap-3 text-base font-semibold', ink)}>
                <Check className="h-5 w-5 shrink-0 text-green-600" />
                {reassurance}
              </span>
            )}
            {hasCta && (
              <ResolvedLink
                link={ctaButton!.link as unknown as DereferencedLink}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                {ctaButton!.buttonText}
                <ArrowRight className="h-4 w-4" />
              </ResolvedLink>
            )}
          </Reveal>
        )}
      </div>
    </section>
  )
}
