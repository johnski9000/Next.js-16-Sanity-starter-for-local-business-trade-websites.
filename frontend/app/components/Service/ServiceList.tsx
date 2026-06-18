'use client'

import {motion} from 'framer-motion'
import {ArrowRight} from 'lucide-react'
import Link from 'next/link'

import {cn} from '@/lib/utils'

type ServiceItem = {
  _id: string
  name?: string | null
  slug?: string | null
  summary?: string | null
}

type ServiceListProps = {
  items: ServiceItem[]
  eyebrow?: string
  heading?: string
  subheading?: string
  columns?: 2 | 3 | 4
  className?: string
}

const colClass: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function ServiceList({
  items,
  eyebrow,
  heading,
  subheading,
  columns = 3,
  className,
}: ServiceListProps) {
  if (items.length === 0) return null

  return (
    <section className={cn('bg-white py-20 sm:py-28', className)}>
      <div className="container">
        {(eyebrow || heading || subheading) && (
          <div className="mb-14 max-w-2xl">
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
        )}

        <div className={cn('grid gap-6', colClass[columns] ?? colClass[3])}>
          {items.map((s, i) => (
            <motion.div
              key={s._id}
              initial={{opacity: 0, y: 28}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-60px'}}
              transition={{duration: 0.5, delay: i * 0.08, ease: 'easeOut'}}
            >
              <Link
                href={`/services/${s.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow duration-300 hover:shadow-lg hover:shadow-gray-100"
              >
                <div className="flex flex-1 flex-col gap-3 p-6">
                  {s.name && (
                    <h3 className="text-lg font-semibold text-gray-950">{s.name}</h3>
                  )}
                  {s.summary && (
                    <p className="flex-1 text-sm leading-relaxed text-gray-600">
                      {s.summary}
                    </p>
                  )}
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-deep transition-all group-hover:gap-2.5">
                      Learn more
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
