'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {Clock, Phone, ShieldCheck, Star, Tag} from 'lucide-react'
import type {ReactNode} from 'react'

import {Whatsapp} from '@/components/brand-icons'

import ResolvedLink from '@/app/components/ResolvedLink'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

const fadeUp = {
  hidden: {opacity: 0, y: 24},
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      delay,
    },
  }),
}

const iconMap = {
  ShieldCheck,
  Clock,
  Star,
  Tag,
}

/**
 * Shared chrome for the split hero variants (HeroSplitImage / HeroSplitForm):
 * the section wrapper, decorative grid + brand glow, and the left copy column
 * (eyebrow, heading, subheading, CTAs, trust badges). The right column is
 * passed in as `media` so each variant only supplies its own image or form.
 *
 * `showBackgroundImage` makes the shell paint `block.backgroundImage` as a
 * full-bleed cover layer behind everything (with a left→right dark gradient so
 * the copy/form stay legible). HeroSplitForm sets this so the form variant gets
 * a photo backdrop; HeroSplitImage leaves it off because it already uses
 * `backgroundImage` as its side card and shouldn't double it.
 *
 * All colours map to the design tokens (bg-brand / text-blue / neutral grays),
 * so the layout recolours per-tenant via the CSS vars injected in layout.tsx.
 */
export default function HeroSplitShell({
  block,
  media,
  showBackgroundImage = false,
}: {
  block: ExtractPageBuilderType<'heroBanner'>
  media: ReactNode
  showBackgroundImage?: boolean
}) {
  const {
    eyebrow,
    heading,
    subheading,
    primaryButton,
    secondaryButton,
    trustBadges,
    backgroundImage,
    theme,
    mediaSide,
  } = block

  const isDark = stegaClean(theme) !== 'light'
  const mediaLeft = stegaClean(mediaSide) === 'left'

  // Full-bleed photo backdrop (splitForm only). When present the copy always
  // sits on a dark gradient, so force the on-dark text treatment.
  const bgFill = showBackgroundImage && Boolean(backgroundImage?.asset?._ref)
  const onDark = isDark || bgFill

  // Decorative grid line colour — neutral, not brand, so it reads on either theme.
  // Over a photo backdrop, lift it slightly so it stays visible.
  const gridLine = onDark ? 'rgba(255,255,255,0.05)' : 'rgba(17,24,39,0.04)'

  return (
    <section
      className={cn(
        'relative isolate flex items-center overflow-hidden',
        isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-950',
      )}
    >
      {/* full-bleed background photo (splitForm) + left→right dark gradient */}
      {bgFill && (
        <>
          <Image
            id={backgroundImage!.asset!._ref}
            alt={backgroundImage?.alt ?? ''}
            width={1920}
            height={1080}
            crop={backgroundImage?.crop ?? undefined}
            hotspot={backgroundImage?.hotspot ?? undefined}
            mode="cover"
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/40"
          />
        </>
      )}

      {/* decorative grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          WebkitMaskImage: 'linear-gradient(115deg, #000 0%, transparent 62%)',
          maskImage: 'linear-gradient(115deg, #000 0%, transparent 62%)',
        }}
      />
      {/* soft radial brand glow, top-right — brand-tinted on light, white-tinted on dark */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-1/4 -right-[10%] -z-10 h-[90%] w-[55vw] rounded-full blur-[120px]',
          onDark ? 'bg-white/10' : 'bg-brand opacity-20',
        )}
      />

      <div className="container relative grid grid-cols-1 items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* COPY */}
        <div className={cn('text-left', mediaLeft && 'lg:order-2')}>
          {eyebrow && (
            <motion.span
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              className={cn(
                'inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide sm:text-[13px]',
                onDark
                  ? 'border-white/15 bg-white/10 text-white'
                  : 'border-brand/20 bg-brand/10 text-brand',
              )}
            >
              <span className="h-[7px] w-[7px] rounded-full bg-blue" />
              {eyebrow}
            </motion.span>
          )}

          {heading && (
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0.08}
              className={cn(
                'mt-5 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl',
                onDark ? 'text-white' : 'text-gray-950',
              )}
            >
              {heading}
            </motion.h1>
          )}

          {subheading && (
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0.16}
              className={cn(
                'mt-5 max-w-xl text-pretty text-lg leading-relaxed sm:text-xl',
                onDark ? 'text-gray-300' : 'text-gray-700',
              )}
            >
              {subheading}
            </motion.p>
          )}

          {(primaryButton?.buttonText || secondaryButton?.buttonText) && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0.24}
              className="mt-8 flex flex-wrap gap-4"
            >
              {primaryButton?.buttonText && primaryButton?.link && (
                <ResolvedLink
                  link={primaryButton.link as unknown as DereferencedLink}
                  className="inline-flex min-w-[190px] items-center justify-center gap-3 rounded-xl bg-brand px-7 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
                >
                  <Phone className="h-6 w-6 fill-white" />
                  {primaryButton.buttonText}
                </ResolvedLink>
              )}

              {secondaryButton?.buttonText && secondaryButton?.link && (
                <ResolvedLink
                  link={secondaryButton.link as unknown as DereferencedLink}
                  className={cn(
                    'inline-flex min-w-[190px] items-center justify-center gap-3 rounded-xl border border-green-500 px-7 py-4 text-base font-bold transition-colors hover:bg-green-500/10',
                    onDark ? 'text-white' : 'text-gray-900',
                  )}
                >
                  <Whatsapp className="h-6 w-6 text-green-500" />
                  {secondaryButton.buttonText}
                </ResolvedLink>
              )}
            </motion.div>
          )}

          {!!trustBadges?.length && (
            <motion.ul
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0.32}
              className={cn(
                'mt-10 grid max-w-xl grid-cols-1 gap-px overflow-hidden rounded-2xl sm:grid-cols-2',
                onDark ? 'bg-white/10' : 'bg-gray-900/10',
              )}
            >
              {trustBadges.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || ShieldCheck
                return (
                  <li
                    key={item._key}
                    className={cn(
                      'flex items-center gap-3 px-5 py-4',
                      onDark ? 'bg-gray-950' : 'bg-white',
                    )}
                  >
                    <Icon className="h-6 w-6 shrink-0 text-blue" />
                    <span
                      className={cn(
                        'text-sm font-semibold leading-tight',
                        onDark ? 'text-white' : 'text-gray-900',
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                )
              })}
            </motion.ul>
          )}
        </div>

        {/* MEDIA (image or form) */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.18}
          className={cn(
            'relative mx-auto flex w-full max-w-[460px] justify-center lg:max-w-none',
            mediaLeft && 'lg:order-1',
          )}
        >
          {/* accent-coloured panel offset behind the media card */}
          <div
            aria-hidden
            className={cn(
              'absolute -bottom-5 -right-4 h-[88%] w-[88%] rotate-3 rounded-[26px] bg-brand',
              onDark ? 'opacity-20' : 'opacity-[0.14]',
            )}
          />
          {media}
        </motion.div>
      </div>
    </section>
  )
}
