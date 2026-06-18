import Link from 'next/link'
import {ChevronRight} from 'lucide-react'

import JsonLd from '@/app/components/JsonLd'
import {breadcrumbJsonLd, type BreadcrumbItem} from '@/sanity/lib/jsonld'

/**
 * Shared breadcrumb trail. Server component — renders the nav AND emits
 * `BreadcrumbList` JSON-LD. Every typed template builds its own `items`
 * (e.g. Home › Services › Interior Painting). The last item is the current
 * page (not linked).
 */
export default function Breadcrumbs({
  items,
  baseUrl,
  className,
}: {
  items: BreadcrumbItem[]
  baseUrl?: string
  className?: string
}) {
  if (!items || items.length === 0) return null

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items, baseUrl)} />
      <nav aria-label="Breadcrumb" className={className ?? 'container py-1'}>
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-neutral">
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <li key={item.href} className="flex items-center gap-1.5">
                {isLast ? (
                  <span aria-current="page" className="font-medium text-gray-950">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className="transition-colors hover:text-blue-deep">
                    {item.label}
                  </Link>
                )}
                {!isLast && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
