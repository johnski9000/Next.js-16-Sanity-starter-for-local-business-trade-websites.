'use client'

import {motion} from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Bath,
  Building2,
  Clock,
  Droplet,
  Fan,
  Flame,
  Hammer,
  Home,
  Leaf,
  PaintBucket,
  PaintRoller,
  Paintbrush,
  Plug,
  Ruler,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Tag,
  Thermometer,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import type {PortableTextBlock} from 'next-sanity'

import CustomPortableText from '@/app/components/PortableText'
import {cn} from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  // Trust-signal icons (match studio trustSignal list)
  ShieldCheck,
  Clock,
  Star,
  Tag,
  BadgeCheck,
  Sparkles,
  // Service icons (match studio SERVICE_ICONS)
  Wrench,
  Hammer,
  Flame,
  Droplet,
  Zap,
  Thermometer,
  Siren,
  Bath,
  Home,
  Building2,
  Paintbrush,
  PaintRoller,
  PaintBucket,
  Ruler,
  Plug,
  Fan,
  Leaf,
  Truck,
}

export type TrustSignal = {
  _key?: string
  icon?: string | null
  label?: string | null
}

type ServiceOverviewProps = {
  eyebrow?: string
  heading?: string
  body: PortableTextBlock[]
  ctaText?: string
  ctaHref?: string
  trustSignals?: TrustSignal[]
}

export default function ServiceOverview({
  eyebrow,
  heading,
  body,
  ctaText,
  ctaHref,
  trustSignals = [],
}: ServiceOverviewProps) {
  const hasCta = Boolean(ctaText && ctaHref)
  const validSignals = trustSignals.filter((s) => Boolean(s.label))
  const hasTrust = validSignals.length > 0

  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="container">
        {/* When trust signals are present, content takes 3/5 and signals take
            2/5 — gives the 2×2 trust grid enough room for spacious cards. */}
        <div className={cn('grid gap-12', hasTrust && 'lg:grid-cols-5')}>
          <div className={cn(hasTrust && 'lg:col-span-3')}>
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

            <motion.div
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.55, delay: 0.1}}
              className="mt-4"
            >
              <CustomPortableText
                value={body}
                className="text-base leading-relaxed text-gray-600"
              />
            </motion.div>

            {hasCta && (
              <motion.div
                initial={{opacity: 0, y: 12}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.3}}
                className="mt-8"
              >
                <Link
                  href={ctaHref!}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  {ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )}
          </div>

          {hasTrust && (
            <aside className="lg:col-span-2 lg:pt-12">
              {/* 2×2 grid (works cleanly for 4 trust signals). On wider
                  signal lists the grid keeps wrapping in 2-col rows. */}
              <ul className="grid grid-cols-2 gap-3">
                {validSignals.map((sig, i) => {
                  const iconName = sig.icon ?? 'ShieldCheck'
                  const Icon = ICON_MAP[iconName] ?? ShieldCheck

                  return (
                    <motion.li
                      key={sig._key ?? i}
                      initial={{opacity: 0, y: 12}}
                      whileInView={{opacity: 1, y: 0}}
                      viewport={{once: true}}
                      transition={{duration: 0.4, delay: 0.2 + (i % 2) * 0.06, ease: 'easeOut'}}
                      className="flex flex-col items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue/10">
                        <Icon className="h-5 w-5 text-blue" />
                      </div>
                      <span className="text-sm font-semibold text-gray-950">{sig.label}</span>
                    </motion.li>
                  )
                })}
              </ul>
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}
