import {stegaClean} from '@sanity/client/stega'
import {ShieldCheck} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import {diffIcon} from './whyIcons'

/** B · Featured guarantee panel + supporting chips. (eyebrow=kicker, heading=title, subheading=body) */
export default function WhyGuarantee({
  block,
}: {
  block: ExtractPageBuilderType<'whyChooseUs'>
}) {
  const {eyebrow, heading, subheading, image} = block

  // Prefer the variant-native `differentiators`, but fall back to the shared
  // `reasons` list so seeded copy (which populates `reasons`) still renders when
  // a design profile flips this block to the guarantee variant.
  const chips =
    block.differentiators && block.differentiators.length > 0
      ? block.differentiators.map((c) => ({
          _key: c._key,
          icon: diffIcon(c.icon),
          title: c.title,
          body: c.desc,
        }))
      : (block.reasons ?? []).map((r) => ({
          _key: r._key,
          icon: diffIcon(null),
          title: r.title,
          body: r.description,
        }))

  const dark = stegaClean(block.theme) === 'dark'
  const hasImage = Boolean(image?.asset?._ref)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <div className="grid items-stretch gap-10 lg:grid-cols-2">
          {/* guarantee panel */}
          <Reveal className="flex flex-col rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/10 to-blue/5 p-9 sm:p-10" as="div">
            {/* Optional supporting image — sits at the top of the promise panel. */}
            {hasImage && (
              <div className="mb-7 overflow-hidden rounded-2xl">
                <Image
                  id={image!.asset!._ref}
                  alt={image?.alt ?? ''}
                  width={640}
                  crop={image?.crop ?? undefined}
                  hotspot={image?.hotspot ?? undefined}
                  mode="cover"
                  className="h-48 w-full object-cover sm:h-56"
                />
              </div>
            )}
            <span className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-lg">
              <ShieldCheck className="h-8 w-8" />
            </span>
            {eyebrow && (
              <span className="text-xs font-bold uppercase tracking-widest text-brand">{eyebrow}</span>
            )}
            {heading && (
              <h2 className={cn('mt-2 text-balance text-2xl font-extrabold tracking-tight sm:text-3xl', ink)}>
                {heading}
              </h2>
            )}
            {subheading && <p className={cn('mt-4 text-lg leading-relaxed', soft)}>{subheading}</p>}
          </Reveal>

          {/* chips */}
          {chips.length > 0 && (
            <RevealGroup className="grid gap-4 sm:grid-cols-2" as="div">
              {chips.map((c) => {
                const Icon = c.icon
                return (
                  <RevealItem key={c._key} className={cn('flex flex-col gap-2.5 rounded-2xl border p-6 shadow-sm', card)} as="div">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon className="h-6 w-6" />
                    </span>
                    {c.title && (
                      <strong className={cn('text-base font-bold leading-snug', ink)}>{c.title}</strong>
                    )}
                    {c.body && <span className={cn('text-sm leading-relaxed', soft)}>{c.body}</span>}
                  </RevealItem>
                )
              })}
            </RevealGroup>
          )}
        </div>
      </div>
    </section>
  )
}
