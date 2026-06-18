import {NextResponse} from 'next/server'

import {getActiveTenants, getTenantByHost, getClient} from '@/sanity/lib/tenant-client'
import {tokensMatch} from '@/lib/safe-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Health check — reports whether the site resolves, its Sanity dataset is reachable
 * (+ doc count), and mail / lead-store is configured. For an uptime / monitoring check.
 *
 * Secret-gated by HEALTH_TOKEN (falls back to LEAD_HEALTH_TOKEN); returns 404 when
 * unset/mismatched so it isn't discoverable. Never returns secrets.
 */
export async function GET(req: Request) {
  const token = process.env.HEALTH_TOKEN || process.env.LEAD_HEALTH_TOKEN
  const url = new URL(req.url)
  const provided = url.searchParams.get('token') || req.headers.get('x-health-token')
  if (!tokensMatch(provided, token)) {
    return NextResponse.json({error: 'Not found'}, {status: 404})
  }

  const summaries = await getActiveTenants()

  const tenants = await Promise.all(
    summaries.map(async (s) => {
      const host = s.hosts?.[0]
      let sanity: 'ok' | 'fail' | 'no-token' = 'no-token'
      let docCount: number | null = null
      let error: string | undefined
      try {
        const tenant = host ? await getTenantByHost(host) : null
        if (tenant?.projectId && tenant.readToken) {
          docCount = await getClient(tenant)
            .withConfig({useCdn: false})
            .fetch<number>('count(*[!(_id in path("drafts.**"))])')
          sanity = 'ok'
        }
      } catch (err) {
        sanity = 'fail'
        error = String(err).slice(0, 160)
      }
      return {
        key: s.key,
        host,
        projectId: s.projectId,
        sanity,
        docCount,
        mailConfigured: s.hasMail,
        leadStoreConfigured: s.hasWrite,
        ...(error ? {error} : {}),
      }
    }),
  )

  const healthy = tenants.every((t) => t.sanity === 'ok')
  return NextResponse.json(
    {ok: healthy, count: tenants.length, tenants},
    {status: healthy ? 200 : 503},
  )
}
