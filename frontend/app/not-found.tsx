import type {Metadata} from 'next'
import Link from 'next/link'
import {ArrowRight, Search as SearchIcon} from 'lucide-react'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import {allServicesQuery, allAreasQuery} from '@/sanity/lib/queries'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {AllServicesQueryResult, AllAreasQueryResult} from '@/sanity.types'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: {index: false, follow: true},
}

export default async function NotFound() {
  const [{data: services}, {data: areas}] = await Promise.all([
    tenantFetch<AllServicesQueryResult>({query: allServicesQuery}),
    tenantFetch<AllAreasQueryResult>({query: allAreasQuery}),
  ])

  return (
    <article>
      <Breadcrumbs items={[{label: 'Home', href: '/'}, {label: 'Not found', href: '#'}]} />

      <section className="bg-white py-16 sm:py-24">
        <div className="container max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-deep">
            404
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
            Page not found
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral">
            The page you were looking for doesn&apos;t exist or has moved. Try one of the routes
            below, or search the site.
          </p>

          <form action="/search" method="get" className="mt-8 flex items-center gap-2">
            <label htmlFor="q" className="sr-only">
              Search
            </label>
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="q"
                name="q"
                type="search"
                placeholder="Search services, areas, posts…"
                className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </form>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get a Free Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/projects"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              See our work
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {(services ?? []).length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="container max-w-3xl">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-deep">
              Our services
            </h2>
            <ul className="flex flex-wrap gap-2.5">
              {(services ?? []).map((s) => (
                <li key={s._id}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue/40 hover:text-gray-950"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {(areas ?? []).length > 0 && (
        <section className="bg-white py-12">
          <div className="container max-w-3xl">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-deep">
              Areas we cover
            </h2>
            <ul className="flex flex-wrap gap-2.5">
              {(areas ?? []).map((a) => (
                <li key={a._id}>
                  <Link
                    href={`/areas/${a.slug}`}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue/40 hover:text-gray-950"
                  >
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  )
}
