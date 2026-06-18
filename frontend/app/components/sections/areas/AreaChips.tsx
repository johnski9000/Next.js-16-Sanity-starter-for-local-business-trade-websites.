'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {MapPin} from 'lucide-react'
import Link from 'next/link'

import ResolvedLink from '@/app/components/ResolvedLink'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/** A · Tappable area chip cloud (the existing default layout). */
export default function AreaChips({
  block,
}: {
  block: ExtractPageBuilderType<'areasWeCover'>
}) {
  const {eyebrow, heading, subheading, areas = [], theme, footerNote, footerButton} = block

  const isDark = stegaClean(theme) === 'dark'
  const resolvedAreas = areas ?? []
  const hasFooterBtn = Boolean(footerButton?.buttonText && footerButton?.link)

  return (
    <section className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        {(eyebrow || heading || subheading) && (
          <div className="mb-12 text-center">
            {eyebrow && (
              <motion.span
                initial={{opacity: 0, y: 12}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5}}
                className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-blue-deep"
              >
                {eyebrow}
              </motion.span>
            )}
            {heading && (
              <motion.h2
                initial={{opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.55, delay: 0.05}}
                className={cn('text-3xl font-semibold md:text-4xl', isDark ? 'text-white' : 'text-gray-950')}
              >
                {heading}
              </motion.h2>
            )}
            {subheading && (
              <motion.p
                initial={{opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.55, delay: 0.1}}
                className={cn(
                  'mx-auto mt-3 max-w-xl text-base leading-relaxed',
                  isDark ? 'text-gray-400' : 'text-gray-600',
                )}
              >
                {subheading}
              </motion.p>
            )}
          </div>
        )}

        {resolvedAreas.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{once: true, margin: '-60px'}}
            variants={{hidden: {}, show: {transition: {staggerChildren: 0.04}}}}
            className="flex flex-wrap justify-center gap-3"
          >
            {resolvedAreas.map((area, i) => {
              const href = area.slug ? `/${area.slug}` : null
              const chipClass = cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                href
                  ? isDark
                    ? 'border-white/10 bg-gray-900 text-gray-300 hover:border-brand/60 hover:bg-gray-800 hover:text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand/40 hover:bg-brand/5 hover:text-gray-950 shadow-xs'
                  : isDark
                    ? 'border-white/8 bg-gray-900 text-gray-500 cursor-default'
                    : 'border-gray-100 bg-white text-gray-400 cursor-default',
              )

              return (
                <motion.div
                  key={i}
                  variants={{
                    hidden: {opacity: 0, scale: 0.9},
                    show: {opacity: 1, scale: 1, transition: {duration: 0.3, ease: 'easeOut' as const}},
                  }}
                  whileHover={href ? {y: -3, scale: 1.06} : undefined}
                  whileTap={href ? {scale: 0.97} : undefined}
                  transition={{type: 'spring', stiffness: 400, damping: 20}}
                >
                  {href ? (
                    <Link href={href} className={chipClass}>
                      <MapPin className="h-3.5 w-3.5 text-blue" />
                      {area.name}
                    </Link>
                  ) : (
                    <span className={chipClass}>
                      <MapPin className="h-3.5 w-3.5 opacity-40" />
                      {area.name}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {(footerNote || hasFooterBtn) && (
          <p className={cn('mt-9 text-center text-base', isDark ? 'text-gray-400' : 'text-gray-600')}>
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
    </section>
  )
}
