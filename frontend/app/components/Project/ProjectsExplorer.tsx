'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import {ArrowRight} from 'lucide-react'

import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'

type Tag = {name?: string | null; slug?: string | null}

export type ProjectCard = {
  _id: string
  title?: string | null
  slug?: string | null
  summary?: string | null
  coverImage?: {asset?: {_ref?: string | null} | null} | null
  area?: {name?: string | null; slug?: string | null} | null
  locationLabel?: string | null
  services?: Tag[] | null
}

export default function ProjectsExplorer({items}: {items: ProjectCard[]}) {
  const services = useMemo(() => {
    const m = new Map<string, string>()
    items.forEach((p) =>
      (p.services ?? []).forEach((s) => {
        if (s?.slug && s?.name) m.set(s.slug, s.name)
      }),
    )
    return [...m.entries()]
  }, [items])

  const areas = useMemo(() => {
    const m = new Map<string, string>()
    items.forEach((p) => {
      if (p.area?.slug && p.area?.name) m.set(p.area.slug, p.area.name)
    })
    return [...m.entries()]
  }, [items])

  const [service, setService] = useState<string | null>(null)
  const [area, setArea] = useState<string | null>(null)

  const filtered = items.filter((p) => {
    const sOk = !service || (p.services ?? []).some((s) => s?.slug === service)
    const aOk = !area || p.area?.slug === area
    return sOk && aOk
  })

  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
      active
        ? 'border-blue bg-blue/10 text-gray-950'
        : 'border-gray-200 bg-white text-gray-700 hover:border-blue/40',
    )

  return (
    <div className="container py-12 sm:py-16">
      {(services.length > 0 || areas.length > 0) && (
        <div className="mb-10 flex flex-col gap-4">
          {services.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              <button className={chip(!service)} onClick={() => setService(null)}>
                All services
              </button>
              {services.map(([s, label]) => (
                <button key={s} className={chip(service === s)} onClick={() => setService(s)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {areas.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              <button className={chip(!area)} onClick={() => setArea(null)}>
                All areas
              </button>
              {areas.map(([a, label]) => (
                <button key={a} className={chip(area === a)} onClick={() => setArea(a)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-neutral">No projects match those filters yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p._id}
              href={`/projects/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow duration-300 hover:shadow-lg"
            >
              {p.coverImage?.asset?._ref && (
                <div className="relative h-52 overflow-hidden">
                  <Image
                    id={p.coverImage.asset._ref}
                    alt={p.title ?? ''}
                    width={700}
                    mode="cover"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-6">
                <span className="text-xs font-medium text-neutral">
                  {p.area?.name ?? p.locationLabel ?? ''}
                </span>
                <h3 className="text-base font-semibold text-gray-950">{p.title}</h3>
                {p.summary && (
                  <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-neutral">
                    {p.summary}
                  </p>
                )}
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-deep transition-all group-hover:gap-2.5">
                  View project
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
