import {stegaClean} from '@sanity/client/stega'
import {MapPin} from 'lucide-react'
import Link from 'next/link'
import type {CSSProperties} from 'react'

import Image from '@/app/components/SanityImage'
import ResolvedLink from '@/app/components/ResolvedLink'
import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

const PINS = [
  {x: 30, y: 32},
  {x: 58, y: 24},
  {x: 72, y: 52},
  {x: 44, y: 60},
  {x: 22, y: 66},
  {x: 64, y: 74},
]

/** B · Stylised map + location link list. */
export default function AreaMap({
  block,
}: {
  block: ExtractPageBuilderType<'areasWeCover'>
}) {
  const {eyebrow, heading, subheading, mapImage, footerNote, footerButton} = block
  const areas = block.areas ?? []
  const dark = stegaClean(block.theme) === 'dark'
  const hasImage = Boolean(mapImage?.asset?._ref)
  const hasFooterBtn = Boolean(footerButton?.buttonText && footerButton?.link)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const placeholderBg: CSSProperties = {
    backgroundImage:
      'linear-gradient(color-mix(in oklab, var(--color-brand) 12%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--color-brand) 12%, transparent) 1px, transparent 1px)',
    backgroundSize: '44px 44px',
    WebkitMaskImage: 'radial-gradient(circle at 50% 45%, #000 60%, transparent 100%)',
    maskImage: 'radial-gradient(circle at 50% 45%, #000 60%, transparent 100%)',
  }

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* copy + list */}
          <div>
            <Reveal as="div">
              {eyebrow && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-deep">
                  <MapPin className="h-3.5 w-3.5" />
                  {eyebrow}
                </span>
              )}
              {heading && (
                <h2 className={cn('mt-2.5 text-balance text-3xl font-extrabold tracking-tight md:text-4xl', ink)}>
                  {heading}
                </h2>
              )}
              {subheading && <p className={cn('mt-3 text-base leading-relaxed', soft)}>{subheading}</p>}
            </Reveal>

            {areas.length > 0 && (
              <RevealGroup className="mt-6 grid grid-cols-2 gap-x-5 gap-y-2.5" as="div">
                {areas.map((a, i) => {
                  const href = a.slug ? `/${a.slug}` : null
                  const inner = (
                    <>
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" />
                      {a.name}
                    </>
                  )
                  return href ? (
                    <RevealItem key={i} as="div">
                      <Link
                        href={href}
                        className={cn('inline-flex items-center gap-2 text-base font-semibold hover:text-brand', ink)}
                      >
                        {inner}
                      </Link>
                    </RevealItem>
                  ) : (
                    <RevealItem key={i} as="div">
                      <span className={cn('inline-flex items-center gap-2 text-base font-semibold', soft)}>
                        {inner}
                      </span>
                    </RevealItem>
                  )
                })}
              </RevealGroup>
            )}

            {(footerNote || hasFooterBtn) && (
              <p className={cn('mt-6 text-base', soft)}>
                {footerNote}{' '}
                {hasFooterBtn && (
                  <ResolvedLink
                    link={footerButton!.link as unknown as DereferencedLink}
                    className="font-bold text-brand hover:underline"
                  >
                    {footerButton!.buttonText}
                  </ResolvedLink>
                )}
              </p>
            )}
          </div>

          {/* map */}
          <div className="relative aspect-5/4 overflow-hidden rounded-3xl border border-border bg-brand/5 shadow-xl">
            {hasImage ? (
              <Image
                id={mapImage!.asset!._ref}
                alt={mapImage?.alt ?? 'Service-area map'}
                width={760}
                height={608}
                crop={mapImage?.crop ?? undefined}
                hotspot={mapImage?.hotspot ?? undefined}
                mode="cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div aria-hidden className="absolute inset-0" style={placeholderBg} />
            )}
            {PINS.map((p, i) => (
              <span
                key={i}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-full drop-shadow',
                  i === 2 ? 'text-green-600' : 'text-brand',
                )}
                style={{left: `${p.x}%`, top: `${p.y}%`}}
              >
                <MapPin className="h-6 w-6" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
