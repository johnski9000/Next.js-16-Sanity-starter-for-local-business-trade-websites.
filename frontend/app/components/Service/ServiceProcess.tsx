'use client'

import {motion} from 'framer-motion'
import {
  BadgeCheck,
  Bath,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Droplet,
  Fan,
  FileText,
  Flame,
  Hammer,
  Home,
  Leaf,
  MessageSquare,
  PaintBucket,
  PaintRoller,
  Paintbrush,
  Phone,
  Plug,
  Ruler,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Thermometer,
  Truck,
  User,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import {cn} from '@/lib/utils'

type Step = {
  _key?: string
  icon?: string | null
  title?: string | null
  description?: string | null
}

type ServiceProcessProps = {
  eyebrow?: string
  heading?: string
  subheading?: string
  steps: Step[]
  className?: string
}

const ICON_MAP: Record<string, LucideIcon> = {
  // Service icons (match studio SERVICE_ICONS)
  Wrench,
  Hammer,
  Flame,
  Droplet,
  Zap,
  Thermometer,
  ShieldCheck,
  Siren,
  Bath,
  Home,
  Building2,
  Paintbrush,
  PaintRoller,
  PaintBucket,
  Ruler,
  Sparkles,
  Plug,
  Fan,
  Leaf,
  Truck,
  // Process-step icons
  Phone,
  ClipboardList,
  BadgeCheck,
  MessageSquare,
  Calendar,
  Search,
  User,
  FileText,
  CheckCircle2,
  Star,
}

export default function ServiceProcess({
  eyebrow,
  heading,
  subheading,
  steps,
  className,
}: ServiceProcessProps) {
  if (steps.length === 0) return null

  const count = steps.length

  return (
    <section className={cn('bg-gray-50 py-20 sm:py-28', className)}>
      <div className="container">
        <div className="mb-16 text-center">
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
              className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-600"
            >
              {subheading}
            </motion.p>
          )}
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-x-[6%] top-9 hidden h-px bg-gray-200 lg:block"
          />

          <ol
            className={cn(
              'relative grid gap-10 sm:gap-8',
              count === 3 && 'lg:grid-cols-3',
              count === 4 && 'lg:grid-cols-4',
              count === 5 && 'lg:grid-cols-5',
            )}
          >
            {steps.map((step, i) => {
              const iconName = step.icon ?? 'CheckCircle2'
              const Icon = ICON_MAP[iconName] ?? CheckCircle2

              return (
                <motion.li
                  key={step._key ?? i}
                  initial={{opacity: 0, y: 24}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true, margin: '-40px'}}
                  transition={{duration: 0.5, delay: i * 0.1, ease: 'easeOut'}}
                  className="flex flex-col items-center text-center"
                >
                  <div className="relative z-10 mb-6">
                    <div className="flex h-18 w-18 items-center justify-center rounded-2xl border-2 border-brand bg-white shadow-md">
                      <Icon className="h-7 w-7 text-blue" />
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white ring-2 ring-white">
                      {i + 1}
                    </span>
                  </div>

                  {step.title && (
                    <h3 className="text-base font-semibold text-gray-950">{step.title}</h3>
                  )}
                  {step.description && (
                    <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-gray-600">
                      {step.description}
                    </p>
                  )}
                </motion.li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
