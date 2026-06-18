'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {Clock, Phone, ShieldCheck, Star, Tag} from 'lucide-react'

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
 * Default hero layout: full-bleed background image with a dark overlay and the
 * copy stacked over it. Rendered for the `banner` variant (and any hero with no
 * variant set). Split variants live in HeroSplitImage / HeroSplitForm.
 */
export default function HeroBannerView({
  block,
}: {
  block: ExtractPageBuilderType<'heroBanner'>
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
    textAlignment,
  } = block

  const isDark = stegaClean(theme) !== 'light'
  const isCentered = stegaClean(textAlignment) === 'center'
  const hasImage = Boolean(backgroundImage?.asset?._ref)
  // The hero text sits on a dark backdrop when either the dark theme is chosen
  // OR a background image is present (which gets a dark gradient overlay).
  // Only the light theme WITHOUT an image needs dark text — otherwise the
  // headline/subtext/buttons render white-on-light and disappear.
  const onDark = hasImage || isDark

  return (
    <section
      className={cn(
        'relative flex min-h-[760px] items-center overflow-hidden sm:min-h-[85vh]',
        isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-950',
      )}
    >
      {hasImage && (
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
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </>
      )}

      <div className={cn('container relative py-16 sm:py-24 md:py-28', isCentered ? 'text-center' : 'text-left')}>
        <div className={cn('max-w-3xl', isCentered && 'mx-auto')}>
          {eyebrow && (
            <motion.span
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              className="mb-5 inline-block max-w-sm text-sm font-bold uppercase tracking-wide text-blue-deep sm:text-base"
            >
              {eyebrow}
            </motion.span>
          )}

          {heading && (
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0.1}
              className={cn(
                'text-4xl font-bold leading-tight sm:text-5xl md:text-6xl',
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
              custom={0.2}
              className={cn(
                'mt-5 max-w-2xl text-lg leading-relaxed sm:text-xl',
                onDark ? 'text-gray-200' : 'text-gray-600',
                isCentered && 'mx-auto',
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
              custom={0.3}
              className={cn('mt-8 flex flex-wrap gap-4', isCentered && 'justify-center')}
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
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0.4}
              className={cn(
                'mt-10 grid grid-cols-2 overflow-hidden rounded-2xl md:grid-cols-4',
                onDark ? 'bg-white/10 backdrop-blur' : 'bg-gray-900/5',
              )}
            >
              {trustBadges.map((item, index) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || ShieldCheck
                const badgeBorder = onDark ? 'border-white/10' : 'border-gray-900/10'

                return (
                  <div
                    key={item._key}
                    className={cn(
                      'flex flex-col items-center justify-center gap-3 px-4 py-6 text-center',
                      index !== 0 && cn('md:border-l', badgeBorder),
                      index > 1 && cn('border-t md:border-t-0', badgeBorder),
                    )}
                  >
                    <Icon className="h-8 w-8 text-blue" />
                    <p
                      className={cn(
                        'text-sm font-bold leading-snug sm:text-base',
                        onDark ? 'text-white' : 'text-gray-900',
                      )}
                    >
                      {item.label}
                    </p>
                  </div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
