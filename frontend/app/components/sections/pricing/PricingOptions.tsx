import {stegaClean} from '@sanity/client/stega'
import {Check} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import ResolvedLink from '@/app/components/ResolvedLink'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

import {pricingIcon} from './pricingIcons'

const gridCols = (n: number) =>
  n >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : n === 3 ? 'sm:grid-cols-3' : n === 2 ? 'sm:grid-cols-2' : ''

/** C · Quote options — pricing-table shape with quoting language (no prices). */
export default function PricingOptions({
  block,
}: {
  block: ExtractPageBuilderType<'pricingSection'>
}) {
  const {eyebrow, title, badgeText} = block
  const options = block.options ?? []
  const dark = stegaClean(block.theme) === 'dark'

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const cardBg = dark ? 'bg-gray-900' : 'bg-white'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center" as="div">
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

        {options.length > 0 && (
          <RevealGroup className={cn('grid grid-cols-1 items-start gap-5', gridCols(options.length))} as="div">
            {options.map((o) => {
              const Icon = pricingIcon(o.icon)
              const featured = Boolean(o.featured)
              const hasCta = Boolean(o.cta?.buttonText && o.cta?.link)
              return (
                <RevealItem
                  key={o._key}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-7 shadow-md',
                    cardBg,
                    featured ? 'border-brand/50 shadow-xl lg:-translate-y-1.5' : line,
                  )}
                  as="div"
                >
                  {featured && badgeText && (
                    <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      {badgeText}
                    </span>
                  )}
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-6 w-6" />
                  </span>
                  {o.name && (
                    <strong className={cn('mt-4 text-lg font-extrabold tracking-tight', ink)}>{o.name}</strong>
                  )}
                  <div className={cn('mt-3 flex flex-col gap-0.5 border-b pb-4', line)}>
                    {o.price && (
                      <span className={cn('text-3xl font-extrabold tracking-tight', ink)}>{o.price}</span>
                    )}
                    {o.note && <span className={cn('text-sm', soft)}>{o.note}</span>}
                  </div>
                  {o.who && <span className={cn('mt-4 text-sm', soft)}>{o.who}</span>}
                  {o.includes && o.includes.length > 0 && (
                    <ul className="mt-4 flex flex-1 flex-col gap-2.5">
                      {o.includes.map((x, j) => (
                        <li key={j} className={cn('flex items-start gap-2.5 text-sm', ink)}>
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  )}
                  {hasCta && (
                    <ResolvedLink
                      link={o.cta!.link as unknown as DereferencedLink}
                      className={cn(
                        'mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all',
                        featured
                          ? 'bg-brand text-white shadow-lg hover:opacity-90'
                          : 'border border-brand/40 text-brand hover:bg-brand/5',
                      )}
                    >
                      {o.cta!.buttonText}
                    </ResolvedLink>
                  )}
                </RevealItem>
              )
            })}
          </RevealGroup>
        )}
      </div>
    </section>
  )
}
