import {stegaClean} from '@sanity/client/stega'

import {Reveal} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import ServicesDirectory from './ServicesDirectory'
import ServicesTiles from './ServicesTiles'

type ServicesOverviewProps = {
  block: ExtractPageBuilderType<'servicesOverview'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Services overview dispatcher. Auto-lists the tenant's Service documents
 * (projected in the page query) in the chosen layout; renders nothing if there
 * are no services. Header + section chrome live here.
 */
export default function ServicesOverview({block}: ServicesOverviewProps) {
  const variant = stegaClean(block.variant) || 'directory'
  const dark = stegaClean(block.theme) === 'dark'
  const columns = stegaClean(block.columns) ?? 3
  const services = block.services ?? []

  if (!services.length) return null

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        {(block.eyebrow || block.title || block.sub) && (
          <Reveal className="mb-9 max-w-2xl" as="div">
            {block.eyebrow && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
                {block.eyebrow}
              </span>
            )}
            {block.title && (
              <h2 className={cn('mt-2 text-3xl font-semibold tracking-tight md:text-4xl', ink)}>
                {block.title}
              </h2>
            )}
            {block.sub && <p className={cn('mt-3 text-lg leading-relaxed', soft)}>{block.sub}</p>}
          </Reveal>
        )}

        {variant === 'tiles' ? (
          <ServicesTiles services={services} columns={columns} dark={dark} />
        ) : (
          <ServicesDirectory services={services} dark={dark} />
        )}
      </div>
    </section>
  )
}
