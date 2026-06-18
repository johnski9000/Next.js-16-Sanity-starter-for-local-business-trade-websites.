import {Phone} from 'lucide-react'

import QuoteForm from '@/app/components/sections/contact/QuoteForm'
import ResolvedLink from '@/app/components/ResolvedLink'
import {Reveal} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/**
 * B · Split copy + the real QuoteForm (consent + Turnstile + /api/contact).
 * Services come from `block.services` (projected from the Service docs in the
 * page query) — the demo's 2-field form can't satisfy the lead API, so we embed
 * the genuine form for a compliant, working callback CTA.
 */
export default function CtaForm({
  block,
}: {
  block: ExtractPageBuilderType<'cta'>
}) {
  const {eyebrow, heading, subheading, primaryButton} = block
  const serviceNames = (block.services ?? []).map((s) => s?.name ?? '').filter(Boolean)
  const hasPhone = Boolean(primaryButton?.buttonText && primaryButton?.link)

  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal as="div">
            {eyebrow && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
                {eyebrow}
              </span>
            )}
            {heading && (
              <h2 className={cn('mt-2 text-balance text-3xl font-extrabold tracking-tight text-gray-950 md:text-4xl')}>
                {heading}
              </h2>
            )}
            {subheading && <p className="mt-4 max-w-prose text-lg leading-relaxed text-gray-600">{subheading}</p>}
            {hasPhone && (
              <ResolvedLink
                link={primaryButton!.link as unknown as DereferencedLink}
                className="mt-6 inline-flex items-center gap-2 text-base font-bold text-brand transition-opacity hover:opacity-80"
              >
                <Phone className="h-5 w-5" />
                {primaryButton!.buttonText}
              </ResolvedLink>
            )}
          </Reveal>

          <Reveal as="div" delay={0.1} className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-xl sm:p-8">
            <QuoteForm services={serviceNames} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
