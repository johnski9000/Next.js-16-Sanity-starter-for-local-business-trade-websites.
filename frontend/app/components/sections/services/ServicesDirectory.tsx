import {ArrowRight} from 'lucide-react'
import Link from 'next/link'

import {RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'

import {serviceIcon, type ServiceItem} from './serviceIcons'

/** A · Directory list — scannable rows; the whole row links to the service page. */
export default function ServicesDirectory({
  services,
  dark,
}: {
  services: ServiceItem[]
  dark: boolean
}) {
  const soft = dark ? 'text-gray-400' : 'text-gray-600'

  return (
    <RevealGroup
      className={cn(
        'grid grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2',
        dark ? 'border-white/10 bg-white/10' : 'border-gray-200 bg-gray-200',
      )}
      as="div"
    >
      {services.map((s) => {
        const Icon = serviceIcon(s.icon)
        return (
          <RevealItem key={s.slug} as="div">
            <Link
              href={`/services/${s.slug}`}
              className={cn(
                'group flex h-full items-center gap-4 p-5 transition-colors',
                dark ? 'bg-gray-950 hover:bg-gray-900' : 'bg-white hover:bg-gray-50',
              )}
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <strong
                  className={cn(
                    'block truncate text-lg font-bold tracking-tight transition-colors group-hover:text-brand',
                    dark ? 'text-white' : 'text-gray-900',
                  )}
                >
                  {s.title}
                </strong>
                <span className={cn('block text-sm leading-snug', soft)}>{s.sub}</span>
              </span>
              <ArrowRight
                className={cn(
                  'h-5 w-5 shrink-0 transition-all group-hover:translate-x-1 group-hover:text-brand',
                  soft,
                )}
              />
            </Link>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}
