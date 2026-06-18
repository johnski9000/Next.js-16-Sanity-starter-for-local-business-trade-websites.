'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {stegaClean} from '@sanity/client/stega'
import {AnimatePresence, motion} from 'framer-motion'
import {ChevronLeft, ChevronRight} from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'

import ResolvedLink from '@/app/components/ResolvedLink'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/**
 * Presentational hero carousel. Driven entirely by props so it can be reused by
 * both the standalone `heroCarousel` block and the `heroBanner` block's
 * `carousel` variant (the slide shape is the shared `heroSlide` schema type).
 */
export type CarouselSlides = NonNullable<ExtractPageBuilderType<'heroCarousel'>['slides']>

type HeroCarouselViewProps = {
  slides: CarouselSlides
  autoPlay?: boolean | null
  interval?: number | null
  textAlignment?: string | null
}

const textVariants = {
  hidden: {opacity: 0, y: 20},
  show: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: {duration: 0.55, delay: d, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]},
  }),
  exit: {opacity: 0, y: -12, transition: {duration: 0.25}},
}

export default function HeroCarouselView({
  slides,
  autoPlay,
  interval,
  textAlignment,
}: HeroCarouselViewProps) {
  const isCentered = stegaClean(textAlignment) === 'center'
  const shouldAutoPlay = stegaClean(autoPlay) !== false
  const intervalMs = (stegaClean(interval) ?? 5) * 1000

  const [emblaRef, emblaApi] = useEmblaCarousel({loop: true, duration: 40})
  const [activeIndex, setActiveIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (shouldAutoPlay && emblaApi) {
      timerRef.current = setTimeout(() => emblaApi.scrollNext(), intervalMs)
    }
  }, [shouldAutoPlay, emblaApi, intervalMs])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap())
      resetTimer()
    }
    emblaApi.on('select', onSelect)
    resetTimer()
    return () => {
      emblaApi.off('select', onSelect)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [emblaApi, resetTimer])

  if (!slides.length) return null

  const activeSlide = slides[activeIndex]
  const isDark = stegaClean(activeSlide?.theme) !== 'light'

  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-gray-950">
      {/* Embla viewport */}
      <div ref={emblaRef} className="absolute inset-0 h-full">
        <div className="flex h-full">
          {slides.map((slide, i) => {
            const hasImage = Boolean(slide.backgroundImage?.asset?._ref)
            const slideDark = stegaClean(slide.theme) !== 'light'
            const isFirst = i === 0

            return (
              <div key={slide._key} className="relative min-w-full h-full flex-shrink-0">
                {hasImage && (
                  <>
                    <Image
                      id={slide.backgroundImage!.asset!._ref}
                      alt={slide.backgroundImage?.alt ?? ''}
                      width={1920}
                      height={1080}
                      crop={slide.backgroundImage?.crop ?? undefined}
                      hotspot={slide.backgroundImage?.hotspot ?? undefined}
                      mode="cover"
                      fetchPriority={isFirst ? 'high' : 'low'}
                      sizes="100vw"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div
                      className={cn(
                        'absolute inset-0',
                        slideDark ? 'bg-gray-950/65' : 'bg-white/55',
                      )}
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Animated text — sits above the carousel, re-animates on slide change */}
      <div className={cn('container relative flex min-h-[88vh] items-center py-28', isCentered ? 'text-center' : 'text-left')}>
        <div className={cn('max-w-3xl', isCentered && 'mx-auto')}>
          <AnimatePresence mode="wait">
            <motion.div key={activeIndex} className="flex flex-col">
              {activeSlide?.eyebrow && (
                <motion.span
                  variants={textVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  custom={0}
                  className="mb-5 inline-block text-xs font-semibold uppercase tracking-widest text-blue-deep"
                >
                  {activeSlide.eyebrow}
                </motion.span>
              )}

              {activeSlide?.heading && (
                <motion.h1
                  variants={textVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  custom={0.08}
                  className={cn(
                    'text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl',
                    isDark ? 'text-white' : 'text-gray-950',
                  )}
                >
                  {activeSlide.heading}
                </motion.h1>
              )}

              {activeSlide?.subheading && (
                <motion.p
                  variants={textVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  custom={0.16}
                  className={cn(
                    'mt-5 max-w-xl text-lg leading-relaxed',
                    isCentered && 'mx-auto',
                    isDark ? 'text-gray-300' : 'text-gray-600',
                  )}
                >
                  {activeSlide.subheading}
                </motion.p>
              )}

              {(activeSlide?.primaryButton?.buttonText || activeSlide?.secondaryButton?.buttonText) && (
                <motion.div
                  variants={textVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  custom={0.24}
                  className={cn('mt-8 flex flex-wrap gap-3', isCentered && 'justify-center')}
                >
                  {activeSlide.primaryButton?.buttonText && activeSlide.primaryButton?.link && (
                    <ResolvedLink
                      link={activeSlide.primaryButton.link as unknown as DereferencedLink}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                      {activeSlide.primaryButton.buttonText}
                    </ResolvedLink>
                  )}
                  {activeSlide.secondaryButton?.buttonText && activeSlide.secondaryButton?.link && (
                    <ResolvedLink
                      link={activeSlide.secondaryButton.link as unknown as DereferencedLink}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition-colors',
                        isDark
                          ? 'border-white/25 text-white hover:bg-white/10'
                          : 'border-gray-300 text-gray-800 hover:bg-gray-100',
                      )}
                    >
                      {activeSlide.secondaryButton.buttonText}
                    </ResolvedLink>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      {slides.length > 1 && (
        <>
          {/* Prev / Next */}
          <button
            type="button"
            onClick={() => { scrollPrev(); resetTimer() }}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => { scrollNext(); resetTimer() }}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { emblaApi?.scrollTo(i); resetTimer() }}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === activeIndex ? 'w-6 bg-blue' : 'w-1.5 bg-white/40 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
