import {Calendar, Check, Clock, Phone, ShieldCheck, type LucideIcon} from 'lucide-react'

import ResolvedLink from '@/app/components/ResolvedLink'
import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

const TRUST_ICONS: Record<string, LucideIcon> = {Clock, Shield: ShieldCheck, Check}

/** A · Full-bleed brand band — bold restatement + call/book buttons + trust line. */
export default function CtaBand({
  block,
}: {
  block: ExtractPageBuilderType<'cta'>
}) {
  const {eyebrow, heading, subheading, primaryButton, secondaryButton} = block
  const trust = block.trustItems ?? []

  return (
    <section className="relative overflow-hidden bg-brand px-6 py-20 text-center text-white sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 -right-[10%] h-[120%] w-[55%] rounded-full bg-white/15 blur-3xl"
      />
      <div className="container relative">
        <Reveal as="div">
          {eyebrow && (
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">{eyebrow}</span>
          )}
          {heading && (
            <h2 className="mx-auto mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              {heading}
            </h2>
          )}
          {subheading && (
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/85">{subheading}</p>
          )}
        </Reveal>

        {(primaryButton?.buttonText || secondaryButton?.buttonText) && (
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            {primaryButton?.buttonText && primaryButton?.link && (
              <ResolvedLink
                link={primaryButton.link as unknown as DereferencedLink}
                className="inline-flex items-center gap-2.5 rounded-xl bg-white px-7 py-4 text-base font-bold text-brand shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Phone className="h-5 w-5" />
                {primaryButton.buttonText}
              </ResolvedLink>
            )}
            {secondaryButton?.buttonText && secondaryButton?.link && (
              <ResolvedLink
                link={secondaryButton.link as unknown as DereferencedLink}
                className="inline-flex items-center gap-2.5 rounded-xl border-[1.5px] border-white/50 bg-white/10 px-7 py-4 text-base font-bold text-white transition-colors hover:bg-white/20"
              >
                <Calendar className="h-5 w-5" />
                {secondaryButton.buttonText}
              </ResolvedLink>
            )}
          </div>
        )}

        {trust.length > 0 && (
          <RevealGroup as="div" className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2.5">
            {trust.map((x) => {
              const Icon = (x.icon && TRUST_ICONS[x.icon]) || Check
              return (
                <RevealItem as="span" key={x._key} className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <Icon className="h-4 w-4" />
                  {x.label}
                </RevealItem>
              )
            })}
          </RevealGroup>
        )}
      </div>
    </section>
  )
}
