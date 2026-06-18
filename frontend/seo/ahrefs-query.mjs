// Base Ahrefs API v3 wrapper. Reads AHREF_API_KEY from .env / .env.local.
// Pattern matches frontend/seo/gsc-query.mjs.
//
// Usage as a library:
//   import { ahrefs } from "./ahrefs-query.mjs";
//   const dr = await ahrefs.domainRating("example.com");
//
// Usage as a CLI smoke test:
//   node frontend/seo/ahrefs-query.mjs                    # default target from .env
//   node frontend/seo/ahrefs-query.mjs example.com        # arbitrary target

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
if (!env.AHREF_API_KEY && !env.AHREFS_API_KEY) {
  console.error("Missing AHREF_API_KEY (or AHREFS_API_KEY) in .env or .env.local");
  process.exit(1);
}

const API_KEY = env.AHREF_API_KEY || env.AHREFS_API_KEY;
const BASE_URL = "https://api.ahrefs.com/v3";

// Track API units consumed across this process (best-effort — only when
// Ahrefs returns the `units_cost` header or in response metadata).
const _consumed = { units: 0, requests: 0 };

/**
 * Core request helper. Handles auth + JSON parsing + error surfacing.
 * Most v3 endpoints accept GET with query params; a few require POST.
 */
export async function ahrefsRequest(endpoint, params = {}, opts = {}) {
  const method = opts.method ?? "GET";
  const url = new URL(BASE_URL + endpoint);

  if (method === "GET") {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }
  }

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    Accept: "application/json",
  };

  const reqOpts = { method, headers };
  if (method !== "GET" && params && Object.keys(params).length > 0) {
    headers["Content-Type"] = "application/json";
    reqOpts.body = JSON.stringify(params);
  }

  const res = await fetch(url.toString(), reqOpts);
  _consumed.requests += 1;

  // Track units cost when surfaced by API
  const unitsHeader = res.headers.get("x-units-cost") || res.headers.get("x-api-units");
  if (unitsHeader && !Number.isNaN(Number(unitsHeader))) {
    _consumed.units += Number(unitsHeader);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Ahrefs API ${endpoint} ${res.status}: ${text.slice(0, 500)}`);
  }
  try {
    const data = JSON.parse(text);
    // Some endpoints embed units cost in response body — surface it too
    if (data && typeof data === "object") {
      if (typeof data.units_cost === "number") _consumed.units += data.units_cost;
      if (typeof data.cost === "number") _consumed.units += data.cost;
    }
    return data;
  } catch {
    throw new Error(`Ahrefs API ${endpoint} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

export function unitsConsumedThisProcess() {
  return { ..._consumed };
}

/** Today's date in YYYY-MM-DD (UTC). Used as default `date` param. */
function todayUtc() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Named helpers for the endpoints the toolkit uses. Each one wraps
 * ahrefsRequest with sensible defaults (UK location, subdomain mode,
 * `select` to limit columns and save units). If endpoint names or
 * params drift in future Ahrefs API revisions, adjust here only —
 * downstream scripts call these helpers, not the raw API.
 */
export const ahrefs = {
  /** Domain Rating snapshot for a domain on a given date. */
  domainRating: (target, { date = todayUtc() } = {}) =>
    ahrefsRequest("/site-explorer/domain-rating", {
      target,
      mode: "subdomains",
      date,
    }),

  /** Overview: DR, traffic, keywords count, referring domains count. */
  overview: (target, { date = todayUtc() } = {}) =>
    ahrefsRequest("/site-explorer/overview", {
      target,
      mode: "subdomains",
      date,
    }),

  /** Referring domains list.
   *  Columns chosen to match the current Ahrefs v3 schema returned by the API:
   *  domain, domain_rating, first_seen, last_seen, links_to_target,
   *  dofollow_links, traffic_domain, is_root_domain, dofollow_refdomains,
   *  is_spam. Add/remove as needed. */
  refdomains: (target, { limit = 200, offset = 0, date = todayUtc() } = {}) =>
    ahrefsRequest("/site-explorer/refdomains", {
      target,
      mode: "subdomains",
      date,
      limit,
      offset,
      order_by: "domain_rating:desc",
      select:
        "domain,domain_rating,first_seen,last_seen,links_to_target,dofollow_links,traffic_domain,is_root_domain",
    }),

  /** Individual backlinks for a target. */
  backlinks: (target, { limit = 200, offset = 0, date = todayUtc() } = {}) =>
    ahrefsRequest("/site-explorer/backlinks", {
      target,
      mode: "subdomains",
      date,
      limit,
      offset,
      order_by: "domain_rating_source:desc",
      select:
        "url_from,url_to,anchor,domain_rating_source,first_seen,last_seen,is_dofollow,is_lost,is_nofollow",
    }),

  /** Organic keywords a domain ranks for (in a country).
   *
   *  Returns each keyword with `best_position_set` (bucket string),
   *  `best_position_url`, `volume`, `sum_traffic`, `cpc`,
   *  `keyword_difficulty`, and `all_positions` (array of `{position, url}`
   *  objects giving the exact integer position per ranking URL).
   *
   *  Use `all_positions[0].position` for the exact best position integer. */
  organicKeywords: (
    target,
    {
      country = "gb",
      limit = 200,
      offset = 0,
      where = null,
      date = todayUtc(),
    } = {},
  ) => {
    const params = {
      target,
      mode: "subdomains",
      country,
      date,
      limit,
      offset,
      order_by: "sum_traffic:desc",
      select:
        "keyword,best_position_set,best_position_url,volume,sum_traffic,cpc,keyword_difficulty,all_positions",
    };
    if (where) params.where = where;
    return ahrefsRequest("/site-explorer/organic-keywords", params);
  },

  /** Competing domains — domains competing with target for organic keywords. */
  competingDomains: (target, { country = "gb", limit = 50, date = todayUtc() } = {}) =>
    ahrefsRequest("/site-explorer/competing-domains", {
      target,
      mode: "subdomains",
      country,
      date,
      limit,
      order_by: "common_keywords:desc",
      select: "competitor_domain,common_keywords,domain_rating",
    }),

  /** SERP overview for a single keyword + location.
   *
   *  Returns positions 1-N for the keyword in the given country. The
   *  response shape is `{ urls: [{position, url, ...}, ...] }` or similar
   *  (varies — downstream code should fall back across `.urls`, `.serp`,
   *  `.results`, `.data`).
   *
   *  Use `select: "url,position"` minimum. Add `domain_rating` if needed
   *  (uses more units). */
  serpOverview: (keyword, { country = "gb", location = null, limit = 50, date = todayUtc() } = {}) => {
    const params = { keyword, country, date, limit, select: "url,position" };
    if (location) params.location = location;
    return ahrefsRequest("/serp-overview/serp-overview", params);
  },

  /** Keywords-by-domain bulk — alias of organicKeywords for keyword-gap workflows. */
  keywordsForDomain: (target, opts = {}) => ahrefs.organicKeywords(target, opts),
};

// CLI smoke test
const __isMain = (() => {
  try {
    const argv = process.argv[1] ?? "";
    const norm = argv.replace(/\\/g, "/");
    return import.meta.url === `file://${norm}` || import.meta.url.endsWith(norm);
  } catch {
    return false;
  }
})();

if (__isMain) {
  // Default target: try env var first, otherwise fall back to Sanity bridge
  let target = process.argv[2];
  if (!target) {
    try {
      const { getTargetDomain } = await import("./_sanity-seo-data.mjs");
      target = await getTargetDomain();
    } catch {}
  }
  if (!target) target = "example.com";
  console.log(`Smoke-testing Ahrefs API against target: ${target}`);
  try {
    const dr = await ahrefs.domainRating(target);
    console.log("Domain Rating response:");
    console.log(JSON.stringify(dr, null, 2));
    console.log(`\nUnits consumed: ${JSON.stringify(unitsConsumedThisProcess())}`);
  } catch (e) {
    console.error("Smoke test failed:");
    console.error(e.message);
    console.error("\nIf the endpoint path differs from /site-explorer/domain-rating,");
    console.error("adjust ahrefs.domainRating in this file to match the current API spec.");
    process.exit(1);
  }
}
