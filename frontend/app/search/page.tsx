import type {Metadata} from 'next'
import Link from 'next/link'
import {ArrowRight, Search as SearchIcon} from 'lucide-react'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import {searchIndexQuery} from '@/sanity/lib/queries'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {SearchIndexQueryResult} from '@/sanity.types'

export const metadata: Metadata = {
  title: 'Search',
  robots: {index: false, follow: true},
  alternates: {canonical: '/search'},
}

type Props = {searchParams: Promise<{q?: string}>}

type IndexedItem = {
  _type: string | null
  title: string | null
  slug: string | null
  description: string | null
}

const hrefFor = (item: IndexedItem): string => {
  const slug = (item.slug ?? '').replace(/^\/+/, '')
  if (item._type === 'service') return `/services/${slug}`
  if (item._type === 'area') return `/areas/${slug}`
  if (item._type === 'project') return `/projects/${slug}`
  if (item._type === 'post') return `/blog/${slug}`
  if (!slug || slug === 'homepage') return '/'
  return `/${slug}`
}

const TYPE_LABEL: Record<string, string> = {
  service: 'Service',
  area: 'Area',
  project: 'Project',
  post: 'Blog',
  page: 'Page',
}

export default async function SearchPage(props: Props) {
  const {q = ''} = await props.searchParams
  const query = q.trim().toLowerCase()
  const {data: items} = await tenantFetch<SearchIndexQueryResult>({query: searchIndexQuery})

  const results = query
    ? (items ?? []).filter((it: IndexedItem) => {
        const haystack = `${it.title ?? ''} ${it.description ?? ''}`.toLowerCase()
        return haystack.includes(query)
      })
    : []

  return (
    <article>
      <Breadcrumbs items={[{label: 'Home', href: '/'}, {label: 'Search', href: '/search'}]} />

      <section className="bg-white py-12 sm:py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
            Search
          </h1>

          <form action="/search" method="get" className="mt-6 flex items-center gap-2">
            <label htmlFor="q" className="sr-only">
              Search
            </label>
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search services, areas, posts…"
                className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Go
            </button>
          </form>

          <div className="mt-10">
            {!query ? (
              <p className="text-neutral">Type a query above to search the site.</p>
            ) : results.length === 0 ? (
              <p className="text-neutral">
                No matches for &ldquo;{q}&rdquo;. Try a service or area name.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {results.map((r: IndexedItem) => (
                  <li key={`${r._type}-${r.slug}`} className="py-4">
                    <Link
                      href={hrefFor(r)}
                      className="group flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-gray-950 group-hover:text-blue-deep">
                            {r.title}
                          </h2>
                          {r._type && TYPE_LABEL[r._type] && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                              {TYPE_LABEL[r._type]}
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-neutral">
                            {r.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-blue-deep transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </article>
  )
}
