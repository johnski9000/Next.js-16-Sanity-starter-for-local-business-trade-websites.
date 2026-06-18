'use client'

import {useState} from 'react'
import {stegaClean} from '@sanity/client/stega'
import {ArrowRight, Search} from 'lucide-react'
import Link from 'next/link'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

type AreaItem = NonNullable<ExtractPageBuilderType<'areasWeCover'>['areas']>[number]

/** C · Searchable, region-grouped directory. */
export default function AreaDirectory({
  block,
}: {
  block: ExtractPageBuilderType<'areasWeCover'>
}) {
  const {eyebrow, heading, areas = []} = block
  const dark = stegaClean(block.theme) === 'dark'
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  // Group filtered areas by region (ungrouped → "Service areas").
  const groups = new Map<string, AreaItem[]>()
  for (const a of areas ?? []) {
    if (query && !(a.name ?? '').toLowerCase().includes(query)) continue
    const region = a.region || 'Service areas'
    const list = groups.get(region) ?? []
    list.push(a)
    groups.set(region, list)
  }
  const entries = [...groups.entries()]

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <Reveal as="div">
            {eyebrow && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
                {eyebrow}
              </span>
            )}
            {heading && (
              <h2 className={cn('mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl', ink)}>
                {heading}
              </h2>
            )}
          </Reveal>
          <label
            className={cn(
              'inline-flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 sm:w-80',
              card,
              soft,
            )}
          >
            <Search className="h-5 w-5 shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your town or suburb…"
              className={cn('w-full border-none bg-transparent text-base outline-none', ink)}
            />
          </label>
        </div>

        {entries.length > 0 ? (
          <RevealGroup className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" as="div">
            {entries.map(([region, items]) => (
              <RevealItem key={region} as="div">
                <span
                  className={cn(
                    'block border-b-2 border-brand pb-2.5 text-xs font-bold uppercase tracking-widest',
                    soft,
                  )}
                >
                  {region}
                </span>
                <ul>
                  {items.map((a, i) => {
                    const href = a.slug ? `/${a.slug}` : null
                    return (
                      <li key={i} className={cn('border-b', line)}>
                        {href ? (
                          <Link
                            href={href}
                            className={cn(
                              'group flex items-center justify-between gap-2 py-3 text-base font-semibold transition-colors hover:text-brand',
                              ink,
                            )}
                          >
                            {a.name}
                            <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-brand opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                          </Link>
                        ) : (
                          <span className={cn('block py-3 text-base font-semibold', soft)}>{a.name}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className={cn('text-base', soft)}>
            No match for &ldquo;{q}&rdquo;. Give us a call — we may still cover your area.
          </p>
        )}
      </div>
    </section>
  )
}
