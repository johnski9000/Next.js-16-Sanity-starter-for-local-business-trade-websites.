import type {Metadata} from 'next'
import {notFound, permanentRedirect} from 'next/navigation'

import ServiceArea from '@/app/components/ServiceArea/ServiceArea'
import {getServiceAreaByRefsQuery, getServiceQuery} from '@/sanity/lib/queries'
import {buildMetadata} from '@/sanity/lib/seo'
import {serviceAreaGatePasses} from '@/sanity/lib/serviceArea'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {GetServiceAreaByRefsQueryResult, GetServiceQueryResult} from '@/sanity.types'

type Props = {params: Promise<{service: string; area: string}>}

/**
 * Service x Area combo route. Hierarchical URL (/services/<service>/<area>)
 * for silo + canonicalisation reasons.
 *
 * Resolution:
 *  - parent service must exist (else 404)
 *  - find a serviceArea doc matching (service, area) by ref
 *  - gate passes -> render combo
 *  - gate fails OR doc missing -> 301 to /services/<service> (preserves the
 *    equity of the parent service page; never a thin/doorway 404)
 *
 * At launch: zero serviceArea docs pass the gate, so every combo URL 301s
 * to its parent service. That's the right behaviour for the reserved
 * pattern — it never wastes link equity.
 */
export async function generateMetadata(props: Props): Promise<Metadata> {
  const {service, area} = await props.params
  const {data: sa, tenant} = await tenantFetch<GetServiceAreaByRefsQueryResult>({
    query: getServiceAreaByRefsQuery,
    params: {service, area},
  })
  if (!serviceAreaGatePasses(sa)) return {}
  return buildMetadata({
    seo: sa!.seo,
    fallbackTitle: `${sa!.service?.name} in ${sa!.area?.name}`,
    path: `/services/${service}/${area}`,
    baseUrl: tenant.siteUrl || undefined,
    imageOpts: {projectId: tenant.projectId, dataset: tenant.dataset},
  })
}

export default async function ServiceAreaPage(props: Props) {
  const {service, area} = await props.params

  // Parent service must exist; otherwise the URL is meaningless -> 404.
  const {data: parent} = await tenantFetch<GetServiceQueryResult>({
    query: getServiceQuery,
    params: {slug: service},
  })
  if (!parent?._id) notFound()

  const {data: sa} = await tenantFetch<GetServiceAreaByRefsQueryResult>({
    query: getServiceAreaByRefsQuery,
    params: {service, area},
  })

  if (!serviceAreaGatePasses(sa)) {
    // Gate fails OR no doc: hand the user (and the link equity) to the
    // canonical parent service page.
    permanentRedirect(`/services/${service}`)
  }

  return <ServiceArea sa={sa!} />
}
