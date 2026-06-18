// _sanity-seo-data.mjs — GROQ bridge: reads client data from Sanity
// for the SEO toolkit scripts. This is the single adaptation point
// between the universal toolkit and the Sanity data layer.
//
// Usage from any script in frontend/seo/:
//   import { getSettings, getAreas, getServices, getCanonicalNAP, getNAPRecord } from "./_sanity-seo-data.mjs";
//   const settings = await getSettings();
//   const areas = await getAreas();
//   const services = await getServices();
//   const nap = await getCanonicalNAP();
//   const napObj = await getNAPRecord();

import fs from "node:fs";

function loadEnv() {
  const env = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && !env[m[1]]) env[m[1]] = m[2].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
      }
    } catch {}
  }
  return env;
}

const env = loadEnv();

const PROJECT_ID = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = env.NEXT_PUBLIC_SANITY_DATASET || "production";
const API_VERSION = normalizeApiVersion(env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01");
const TOKEN = env.SANITY_API_READ_TOKEN || "";

/**
 * Sanity's HTTP API requires the version segment to carry a `v` prefix
 * (e.g. /v2024-01-01/…). A bare `2024-01-01` yields a 404 "no Route matched".
 * Tolerate either form in the env value.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeApiVersion(raw) {
  const v = String(raw || "").trim();
  return /^v/.test(v) ? v : `v${v}`;
}

/**
 * Builds the Sanity query API URL. The query API REJECTS unknown query-string
 * params (HTTP 400), so the auth token must NOT be a query param — it goes in
 * the Authorization header (see fetchSanity). Kept pure for unit testing.
 * @param {{projectId: string, dataset: string, apiVersion: string, query: string, params?: Record<string,string>}} args
 * @returns {string}
 */
export function buildSanityQueryUrl({ projectId, dataset, apiVersion, query, params = {} }) {
  const base = `https://${projectId}.api.sanity.io/${normalizeApiVersion(apiVersion)}/data/query/${dataset}`;
  const qs = new URLSearchParams({ query, ...params, perspective: "published" });
  return `${base}?${qs.toString()}`;
}

function sanityUrl(query, params = {}) {
  return buildSanityQueryUrl({ projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION, query, params });
}

async function fetchSanity(query, params = {}) {
  if (!PROJECT_ID) {
    console.error("MISSING NEXT_PUBLIC_SANITY_PROJECT_ID — cannot fetch from Sanity");
    process.exit(1);
  }
  const url = sanityUrl(query, params);
  const res = await fetch(url, TOKEN ? { headers: { Authorization: `Bearer ${TOKEN}` } } : undefined);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity fetch failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.result;
}

// Cache — fetch once, reuse across any script in the same process
let _settings = null;
let _areas = null;
let _services = null;

const SETTINGS_QUERY = `*[_type == "settings"][0]{
  branding,
  seo,
  structuredData
}`;

const ALL_AREAS_QUERY = `*[_type == "area" && defined(slug.current)] | order(order asc, name asc){
  _id, name, "slug": slug.current, order
}`;

const ALL_SERVICES_QUERY = `*[_type == "service" && defined(slug.current)] | order(order asc, name asc){
  _id, name, "slug": slug.current, icon, summary, order
}`;

/**
 * Fetches the settings singleton document from Sanity.
 * Includes branding, seo, and structuredData fields.
 * Cached in memory after first call.
 * @returns {Promise<Object|null>}
 */
export async function getSettings() {
  if (_settings) return _settings;
  _settings = await fetchSanity(SETTINGS_QUERY);
  return _settings;
}

/**
 * Fetches all published area documents, ordered by `order` then `name`.
 * Cached in memory after first call.
 * @returns {Promise<Array<{_id: string, name: string, slug: string, order: number}>>}
 */
export async function getAreas() {
  if (_areas) return _areas;
  _areas = await fetchSanity(ALL_AREAS_QUERY);
  return _areas;
}

/**
 * Fetches all published service documents, ordered by `order` then `name`.
 * Cached in memory after first call.
 * @returns {Promise<Array<{_id: string, name: string, slug: string, icon: string, summary: string, order: number}>>}
 */
export async function getServices() {
  if (_services) return _services;
  _services = await fetchSanity(ALL_SERVICES_QUERY);
  return _services;
}

/**
 * Returns the canonical NAP (Name, Address, Phone) as a formatted
 * multi-line string, suitable for citations and directory listings.
 * @returns {Promise<string|null>}
 */
export async function getCanonicalNAP() {
  const settings = await getSettings();
  const org = settings?.structuredData?.organization;
  if (!org?.name) return null;
  const addr = org.address || {};
  const parts = [
    org.name,
    addr.streetAddress,
    [addr.addressLocality, addr.postalCode].filter(Boolean).join(" "),
    org.contact?.phone,
  ].filter(Boolean);
  return parts.join("\n");
}

/**
 * Returns a structured NAP record object for use in JSON-LD,
 * tracking scripts, and other programmatic consumers.
 * @returns {Promise<Object|null>}
 */
export async function getNAPRecord() {
  const settings = await getSettings();
  const org = settings?.structuredData?.organization;
  if (!org) return null;
  return {
    businessName: org.name,
    legalName: org.legalName || null,
    phone: org.contact?.phone || null,
    email: org.contact?.email || null,
    street: org.address?.streetAddress || null,
    city: org.address?.addressLocality || null,
    region: org.address?.addressRegion || null,
    postcode: org.address?.postalCode || null,
    country: org.address?.addressCountry || "GB",
    latitude: org.geo?.latitude || null,
    longitude: org.geo?.longitude || null,
    siteUrl: org.url || settings?.seo?.metadataBase || null,
    sameAs: org.sameAs || [],
    areaServed: org.areaServed || null,
    whatsappNumber: settings?.branding?.whatsappNumber || null,
    siteTitle: settings?.branding?.siteTitle || null,
    description: org.description || null,
    priceRange: settings?.structuredData?.localBusiness?.priceRange || null,
  };
}

/**
 * Returns the target domain (e.g. "example.com" — no protocol).
 * Used by ahrefs-config and other scripts that need the naked domain.
 * @returns {Promise<string|null>}
 */
export async function getTargetDomain() {
  const settings = await getSettings();
  const url = settings?.seo?.metadataBase || settings?.structuredData?.organization?.url;
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }
}
