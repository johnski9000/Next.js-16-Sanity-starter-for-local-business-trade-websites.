import {ArrowRight} from 'lucide-react'
import Link from 'next/link'

import {RevealGroup, RevealItem} from '@/app/components/Reveal'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'

import {serviceIcon, type ServiceItem} from './serviceIcons'

const gridCols = (n: number) =>
  n >= 4
    ? 'sm:grid-cols-2 lg:grid-cols-4'
    : n === 3
      ? 'sm:grid-cols-2 lg:grid-cols-3'
      : 'sm:grid-cols-2'

/** B · Image tiles — photo-led, scrim + hover "Explore"; the whole tile links. */
export default function ServicesTiles({
  services,
  columns,
  dark,
}: {
  services: ServiceItem[]
  columns: number
  dark: boolean
}) {
  return (
    <RevealGroup className={cn('grid grid-cols-1 gap-4', gridCols(columns))} as="div">
      {services.map((s) => {
        const Icon = serviceIcon(s.icon)
        const hasImage = Boolean(s.heroImage?.asset?._ref)
        return (
          <RevealItem key={s.slug} as="div">
            <Link
              href={`/services/${s.slug}`}
              className="group relative block aspect-4/3 overflow-hidden rounded-2xl border border-border shadow-lg"
            >
              {hasImage ? (
                <Image
                  id={s.heroImage!.asset!._ref}
                  alt={s.heroImage?.alt ?? s.title}
                  width={640}
                  height={480}
                  crop={s.heroImage?.crop ?? undefined}
                  hotspot={s.heroImage?.hotspot ?? undefined}
                  mode="cover"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className={cn('absolute inset-0', dark ? 'bg-gray-800' : 'bg-gray-300')} />
              )}

              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-colors group-hover:from-black/95" />

              <span className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white backdrop-blur">
                <Icon className="h-5 w-5" />
              </span>

              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-white">
                <strong className="text-xl font-extrabold tracking-tight">{s.title}</strong>
                <span className="text-sm text-white/80">{s.sub}</span>
                <span className="mt-1 inline-flex translate-y-1 items-center gap-1.5 text-sm font-bold opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                  Explore <ArrowRight className="h-4 w-4" />
                </span>
              </span>
            </Link>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}
