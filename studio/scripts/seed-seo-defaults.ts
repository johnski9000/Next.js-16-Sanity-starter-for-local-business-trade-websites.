/**
 * Seed SEO-specific defaults onto the settings singleton.
 *
 * This script is idempotent — it reads the current settings document from
 * Sanity, fills in any missing SEO-relevant fields with sensible defaults,
 * and writes back. It is the `seed:seo` step inside `pnpm -F studio seed:all`,
 * so you normally don't run it by hand — only re-run it if you edited the
 * settings singleton outside the seed flow and want missing SEO defaults backfilled.
 *
 * Usage:
 *   npx sanity exec scripts/seed-seo-defaults.ts --with-user-token
 *   (or from studio root)
 *
 * Fields seeded (only if currently null/undefined/missing):
 *   - structuredData.organization.name (falls back to branding.siteTitle)
 *   - structuredData.organization.url (falls back to seo.metadataBase)
 *   - structuredData.organization.description
 *   - structuredData.language (defaults to "en-GB")
 *   - structuredData.website.name (falls back to branding.siteTitle)
 *   - structuredData.website.url (falls back to seo.metadataBase)
 */

import {getCliClient} from 'sanity/cli'

const apiVersion = '2025-09-25'
const base = getCliClient({apiVersion})
const client = process.env.SANITY_WRITE_TOKEN
  ? base.withConfig({token: process.env.SANITY_WRITE_TOKEN, useCdn: false})
  : base

const SETTINGS_ID = 'siteSettings'

async function seedSeoDefaults() {
  // Fetch current settings from the LIVE dataset (not CDN — we're about to write).
  const current = await client.fetch(
    `*[_id == $id][0]`,
    {id: SETTINGS_ID}
  )

  if (!current) {
    console.error(
      `Settings document "${SETTINGS_ID}" not found. Run seed:all first.`
    )
    process.exit(1)
  }

  // Drop read-only system fields so we never write a stale _rev / timestamps back
  // (keep _id + _type, which createOrReplace needs).
  const currentClean = {...current}
  delete currentClean._rev
  delete currentClean._createdAt
  delete currentClean._updatedAt

  // Shallow‑merge defaults under structuredData; never overwrite existing values.
  const sd = current.structuredData ?? {}

  // Ensure the top‑level structuredData container exists
  const patched = {
    ...currentClean,
    structuredData: {
      ...sd,
      enabled: sd.enabled ?? true,
      language: sd.language ?? 'en-GB',
    },
  }

  const orgName = current.branding?.siteTitle ?? 'My Business'

  // --- Organization block ---
  if (!patched.structuredData.organization) {
    patched.structuredData.organization = {}
  }
  const org = patched.structuredData.organization as Record<string, unknown>

  org.name = org.name ?? orgName
  org.url = org.url ?? current.seo?.metadataBase ?? ''
  org.description = org.description ?? current.seo?.description ?? ''

  if (!org.contact) {
    org.contact = {contactType: 'Customer Service'}
  }
  const contact = org.contact as Record<string, unknown>
  contact.contactType = contact.contactType ?? 'Customer Service'

  if (!org.address) {
    org.address = {addressCountry: 'GB'}
  }
  const addr = org.address as Record<string, unknown>
  addr.addressCountry = addr.addressCountry ?? 'GB'

  if (!org.geo) {
    org.geo = {}
  }

  // --- WebSite block ---
  if (!patched.structuredData.website) {
    patched.structuredData.website = {}
  }
  const ws = patched.structuredData.website as Record<string, unknown>
  ws.name = ws.name ?? orgName
  ws.url = ws.url ?? current.seo?.metadataBase ?? ''

  // --- LocalBusiness block (default to enabled for service businesses) ---
  if (!patched.structuredData.localBusiness) {
    patched.structuredData.localBusiness = {enabled: false}
  }
  const lb = patched.structuredData.localBusiness as Record<string, unknown>
  // Don't force-enable — leave as-is if already set, default to false until client confirms

  // Write back
  await client.createOrReplace(patched)
  console.log('✓ settings.seo-defaults  [siteSettings]')
  console.log(`  structuredData.organization.name  = "${org.name}"`)
  console.log(`  structuredData.organization.url   = "${org.url}"`)
  console.log(`  structuredData.language           = "${patched.structuredData.language}"`)
  console.log(`  structuredData.website.name       = "${ws.name}"`)
  console.log('')
  console.log('SEO defaults seeded. Update the following in Studio:')
  console.log('  - structuredData → Organization → Address (street, city, postcode)')
  console.log('  - structuredData → Organization → Contact (phone, email)')
  console.log('  - structuredData → Organization → Geo (latitude, longitude)')
  console.log('  - structuredData → Organization → sameAs (social profiles)')
  console.log('  - structuredData → LocalBusiness → enable + openingHours')
}

seedSeoDefaults().catch((err) => {
  console.error('seed-seo-defaults failed:', err.message)
  process.exit(1)
})
