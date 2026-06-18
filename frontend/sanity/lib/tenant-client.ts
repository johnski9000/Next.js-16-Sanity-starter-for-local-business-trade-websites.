import 'server-only'

import {cache} from 'react'
import {createClient, type SanityClient} from 'next-sanity'
import {draftMode} from 'next/headers'

import {type Tenant} from '@/sanity/lib/tenants'

const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-09-25'
const studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333'

/**
 * `next build` prerenders pages, which runs their Sanity fetches at build time. In
 * CI (or any build without reachable Sanity creds) those fetches fail, and a thrown
 * error aborts the whole prerender. `buildSafe` swallows the error ONLY during the
 * production build phase — returning a fallback so the page prerenders an empty
 * shell (ISR fills it in at runtime) instead of crashing the build. At runtime the
 * error propagates normally, so a real outage is never silently hidden.
 */
export const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

export async function buildSafe<T, F = T>(p: Promise<T>, fallback: F): Promise<T | F> {
  if (!isBuildPhase) return p
  try {
    return await p
  } catch {
    return fallback
  }
}

/**
 * SINGLE-TENANT branch: this deployment serves exactly ONE site, configured
 * entirely from `NEXT_PUBLIC_SANITY_*` env. There is no control plane, no tenant
 * registry, and no per-request host resolution — every request renders the same
 * site. (The multi-tenant platform lives on `main`.)
 *
 * The exported function signatures are kept identical to the multi-tenant version
 * so call sites are unchanged; the internals just always resolve the one env site.
 */
function singleTenant(): Tenant {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  if (!projectId || !dataset) {
    throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET')
  }
  return {
    key: 'default',
    hosts: ['*'],
    projectId,
    dataset,
    readToken: process.env.SANITY_API_READ_TOKEN || '',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
    theme: process.env.NEXT_PUBLIC_THEME || 'default',
    // Design preset + brand colour for a single-tenant site come from env (set
    // once per deployment), mirroring the per-tenant `branding` of the platform.
    branding: {
      design: process.env.NEXT_PUBLIC_DESIGN || undefined,
      primaryColor: process.env.NEXT_PUBLIC_BRAND_COLOR || undefined,
    },
    ga4MeasurementId: process.env.NEXT_PUBLIC_GA_ID || undefined,
  }
}

/** Resolve the single tenant. (host param ignored — kept for signature parity.) */
export async function getTenantByHost(_host: string): Promise<Tenant | null> {
  return singleTenant()
}

/** Resolve the current request's tenant. Single-tenant: always the one env site. */
export async function getTenant(): Promise<Tenant> {
  return singleTenant()
}

/** Request-memoised tenant resolution — resolve once, reuse across the render. */
export const currentTenant = cache(getTenant)

export type TenantMail = {
  leadEmail?: string
  host?: string
  port?: number
  secure?: boolean
  user?: string
  pass?: string
  fromName?: string
  autoReply?: boolean
  autoReplyMessage?: string
}

/**
 * Single-tenant: there is no per-tenant SMTP registry. Enquiries deliver via the
 * site's own `NODEMAILER_*` mailbox (the contact route's fallback route). Returns
 * `null` so the contact route uses that path. (Signature kept for parity.)
 */
export async function getTenantMail(
  _host: string,
): Promise<{key?: string; siteName?: string; mail: TenantMail} | null> {
  return null
}

export type TenantLeadStore = {
  key?: string
  projectId?: string
  dataset?: string
  writeToken?: string
}

/**
 * Single-tenant: leads persist into THE site's own project (`NEXT_PUBLIC_SANITY_*`)
 * using `SANITY_WRITE_TOKEN`. Returns `null` (→ persistence skipped) if no write
 * token is configured.
 */
export async function getTenantLeadStore(_host: string): Promise<TenantLeadStore | null> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const writeToken = process.env.SANITY_WRITE_TOKEN
  if (!projectId || !writeToken) return null
  return {
    key: 'default',
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    writeToken,
  }
}

/**
 * Server-only: persist one enquiry as a `lead` document. Best-effort — returns a
 * result rather than throwing, so the contact route never fails the request because
 * persistence failed. A no-op (`error: 'no-store'`) when no write token is configured.
 */
export async function persistLead(
  store: TenantLeadStore | null,
  doc: Record<string, unknown>,
): Promise<{ok: boolean; id?: string; error?: string}> {
  if (!store?.projectId || !store?.writeToken) return {ok: false, error: 'no-store'}
  try {
    const client = createClient({
      projectId: store.projectId,
      dataset: store.dataset || 'production',
      apiVersion,
      token: store.writeToken,
      useCdn: false,
    })
    // Idempotent when the caller supplies a stable _id (client idempotencyKey):
    // a replayed submission with the same key is a no-op rather than a duplicate.
    const {_id, ...rest} = doc as {_id?: string} & Record<string, unknown>
    const created =
      typeof _id === 'string' && _id
        ? await client.createIfNotExists({_id, _type: 'lead', ...rest})
        : await client.create({_type: 'lead', ...rest})
    return {ok: true, id: created._id}
  } catch (err) {
    return {ok: false, error: String(err)}
  }
}

/**
 * Single-tenant has no separate control dead-letter dataset; the own-project lead
 * store + the `NODEMAILER_*` inbox are the safety nets. Kept as a no-op for
 * signature parity with the contact route's last-resort call.
 */
export async function persistDeadLetter(
  _doc: Record<string, unknown>,
): Promise<{ok: boolean; error?: string}> {
  return {ok: false, error: 'no-control-write-token'}
}

export type TenantSummary = {
  key: string
  hosts: string[]
  projectId: string
  dataset: string
  siteUrl: string
  hasMail: boolean
  hasWrite: boolean
}

/** Single-tenant: the one site this deployment serves (used by /api/health). */
export async function getActiveTenants(): Promise<TenantSummary[]> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  if (!projectId) return []
  return [
    {
      key: 'default',
      hosts: ['*'],
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
      hasMail: Boolean(process.env.NODEMAILER_EMAIL && process.env.NODEMAILER_PASSWORD),
      hasWrite: Boolean(process.env.SANITY_WRITE_TOKEN),
    },
  ]
}

/** A Sanity client bound to the tenant's project/dataset/token.
 *  stega encodes invisible visual-editing markup into every string — only ship it
 *  in DRAFT mode (visual editing), never to production browsers. Defaults OFF. */
export function getClient(tenant: Tenant, opts?: {stega?: boolean}): SanityClient {
  return createClient({
    projectId: tenant.projectId,
    dataset: tenant.dataset,
    apiVersion,
    useCdn: true,
    token: tenant.readToken,
    stega: opts?.stega ? {studioUrl} : false,
  })
}

type FetchArgs = {
  query: string
  params?: Record<string, unknown>
  revalidate?: number | false
  tags?: string[]
}

/**
 * Tenant-scoped fetch. Resolves the tenant, fetches with that tenant's client, and
 * namespaces the Next cache tags by tenant key (a no-op-but-harmless `tenant:default`
 * prefix in single-tenant).
 */
export async function tenantFetch<T>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
}: FetchArgs): Promise<{data: T; tenant: Tenant}> {
  const tenant = await getTenant()
  // stega only in draft mode (visual editing) — never encode markup into the
  // strings shipped to production browsers.
  const {isEnabled: isDraftMode} = await draftMode()
  const client = getClient(tenant, {stega: isDraftMode})
  // buildSafe: during `next build` a failed fetch (e.g. dummy CI creds) yields null
  // instead of aborting the prerender; at runtime the error propagates as normal.
  const data = (await buildSafe(
    client.fetch<T>(query, params, {
      next: {
        revalidate: revalidate === false ? false : revalidate,
        tags: [`tenant:${tenant.key}`, ...tags.map((t) => `tenant:${tenant.key}:${t}`)],
      },
    }),
    null,
  )) as T
  return {data, tenant}
}
