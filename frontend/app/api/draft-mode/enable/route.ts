import {defineEnableDraftMode} from 'next-sanity/draft-mode'

import {getTenantByHost, getClient} from '@/sanity/lib/tenant-client'
import {normaliseHost} from '@/sanity/lib/tenants'

/**
 * Enable Sanity draft mode (Presentation tool). Set as previewMode.enable in
 * sanity.config.ts.
 *
 * MULTI-TENANT (security): the preview secret MUST be validated against the same
 * project whose drafts the layout will then render with getClient(tenant). So we
 * resolve the tenant from the request host and build the enable handler with THAT
 * tenant's client per-request — never a single default-tenant client. Validating
 * against the wrong project would let a preview secret from one tenant enable
 * draft mode that reads another tenant's drafts (a cross-tenant access vector).
 *
 * For a single-tenant deployment getTenantByHost falls back to the default env
 * tenant, so behaviour is unchanged.
 */
export async function GET(request: Request): Promise<Response> {
  const host = request.headers.get('x-tenant-host') || request.headers.get('host') || ''
  const tenant = await getTenantByHost(host)
  if (!tenant?.projectId || !tenant.readToken) {
    return new Response(`No tenant resolved for host "${normaliseHost(host)}"`, {status: 404})
  }

  // Validate the preview secret against the tenant's OWN project (fresh, no CDN).
  const client = getClient(tenant).withConfig({useCdn: false})
  const {GET} = defineEnableDraftMode({client})
  return GET(request)
}
