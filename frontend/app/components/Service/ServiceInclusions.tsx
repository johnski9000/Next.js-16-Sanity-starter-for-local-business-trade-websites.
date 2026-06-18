'use client'

import {motion} from 'framer-motion'
import {CheckCircle2} from 'lucide-react'

import {cn} from '@/lib/utils'

type Inclusion = {
  _key?: string
  title?: string | null
  description?: string | null
}

type ServiceInclusionsProps = {
  eyebrow?: string
  heading?: string
  subheading?: string
  inclusions: Inclusion[]
  className?: string
}

export default function ServiceInclusions({
  eyebrow,
  heading,
  subheading,
  inclusions,
  className,
}: ServiceInclusionsProps) {
  if (inclusions.length === 0) return null

  return (
    <section className={cn('bg-white py-20 sm:py-28', className)}>
      <div className="container">
        {/* Header row — full width, max-w'd for readability */}
        <div className="mb-12 max-w-2xl">
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
              className="text-3xl font-semibold text-gray-950 md:text-4xl"
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
              className="mt-3 text-base leading-relaxed text-gray-600"
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {/* 2-rows × 4-cols grid (8 items). Stacks to 2 cols on sm,
            1 col on mobile. Stagger delays cycle per row so each row
            animates together instead of all 8 cascading down the page. */}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {inclusions.map((inc, i) => (
            <motion.li
              key={inc._key ?? i}
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-40px'}}
              transition={{duration: 0.45, delay: 0.1 + (i % 4) * 0.07, ease: 'easeOut'}}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue/10">
                <CheckCircle2 className="h-5 w-5 text-blue" />
              </div>
              {inc.title && (
                <p className="font-semibold text-gray-950">{inc.title}</p>
              )}
              {inc.description && (
                <p className="text-sm leading-relaxed text-gray-500">
                  {inc.description}
                </p>
              )}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
