'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'

import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'

type Tag = {name?: string | null; slug?: string | null}
type Img = {asset?: {_ref?: string | null} | null; alt?: string | null} | null

export type GalleryProject = {
  _id: string
  title?: string | null
  slug?: string | null
  area?: {name?: string | null; slug?: string | null} | null
  locationLabel?: string | null
  services?: Tag[] | null
  coverImage?: Img
  gallery?: Img[] | null
}

type Flat = {
  key: string
  ref: string
  alt: string
  href: string
  serviceSlugs: string[]
  areaSlug?: string
}

export default function GalleryExplorer({projects}: {projects: GalleryProject[]}) {
  const flat = useMemo<Flat[]>(() => {
    const out: Flat[] = []
    projects.forEach((p) => {
      const imgs = [p.coverImage, ...(p.gallery ?? [])].filter(Boolean) as NonNullable<Img>[]
      const serviceSlugs = (p.services ?? [])
        .map((s) => s?.slug)
        .filter((x): x is string => Boolean(x))
      imgs.forEach((im, i) => {
        if (!im?.asset?._ref) return
        out.push({
          key: `${p._id}-${i}`,
          ref: im.asset._ref,
          alt: im.alt ?? p.title ?? 'Project image',
          href: `/projects/${p.slug}`,
          serviceSlugs,
          areaSlug: p.area?.slug ?? undefined,
        })
      })
    })
    return out
  }, [projects])

  const services = useMemo(() => {
    const m = new Map<string, string>()
    projects.forEach((p) =>
      (p.services ?? []).forEach((s) => {
        if (s?.slug && s?.name) m.set(s.slug, s.name)
      }),
    )
    return [...m.entries()]
  }, [projects])

  const areas = useMemo(() => {
    const m = new Map<string, string>()
    projects.forEach((p) => {
      if (p.area?.slug && p.area?.name) m.set(p.area.slug, p.area.name)
    })
    return [...m.entries()]
  }, [projects])

  const [service, setService] = useState<string | null>(null)
  const [area, setArea] = useState<string | null>(null)

  const filtered = flat.filter(
    (f) =>
      (!service || f.serviceSlugs.includes(service)) && (!area || f.areaSlug === area),
  )

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
        <p className="text-neutral">No images match those filters yet.</p>
      ) : (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
          {filtered.map((f) => (
            <Link
              key={f.key}
              href={f.href}
              className="group block overflow-hidden rounded-xl break-inside-avoid"
            >
              <Image
                id={f.ref}
                alt={f.alt}
                width={600}
                mode="cover"
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
