import {stegaClean} from '@sanity/client/stega'
import {Check} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import ResolvedLink from '@/app/components/ResolvedLink'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/** A · Transparency promise — split copy + pricing principles. */
export default function PricingPromise({
  block,
}: {
  block: ExtractPageBuilderType<'pricingSection'>
}) {
  const {eyebrow, title, body, ctaButton} = block
  const principles = block.principles ?? []
  const dark = stegaClean(block.theme) === 'dark'
  const hasCta = Boolean(ctaButton?.buttonText && ctaButton?.link)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal as="div">
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
            {body && <p className={cn('mt-4 max-w-prose text-lg leading-relaxed', soft)}>{body}</p>}
            {hasCta && (
              <ResolvedLink
                link={ctaButton!.link as unknown as DereferencedLink}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              >
                {ctaButton!.buttonText}
              </ResolvedLink>
            )}
          </Reveal>

          {principles.length > 0 && (
            <RevealGroup className="flex flex-col gap-3.5" as="ul">
              {principles.map((p) => (
                <RevealItem
                  key={p._key}
                  className={cn('flex items-start gap-3.5 rounded-2xl border p-5 shadow-sm', card)}
                  as="li"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    {p.title && <strong className={cn('text-base font-bold', ink)}>{p.title}</strong>}
                    {p.desc && <span className={cn('text-sm leading-relaxed', soft)}>{p.desc}</span>}
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>
    </section>
  )
}
