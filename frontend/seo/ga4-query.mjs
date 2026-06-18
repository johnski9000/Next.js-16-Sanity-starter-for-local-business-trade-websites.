// Base GA4 Data API v1beta wrapper. Reads OAuth + property id from
// .env / .env.local. Pattern matches frontend/seo/ahrefs-query.mjs and
// frontend/seo/gsc-query.mjs.
//
// Usage as a library:
//   import { ga4 } from "./ga4-query.mjs";
//   const summary = await ga4.dateRangeSummary({
//     startDate: "90daysAgo",
//     endDate: "yesterday",
//   });
//
// Usage as a CLI smoke test:
//   node frontend/seo/ga4-query.mjs

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
for (const k of [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GA4_PROPERTY_ID",
]) {
  if (!env[k]) {
    console.error(`Missing ${k} in .env.local/environment`);
    process.exit(1);
  }
}

export const PROPERTY_ID = String(env.GA4_PROPERTY_ID).replace(/^properties\//, "");

// Conversion ("key") events configured in GA4 Admin for this property,
// captured during discovery (frontend/seo/ga4-discover.mjs). Used as the default
// eventName filter when ga4.landingPagesByEvent is called without one.
// If GA4 Admin changes, re-run the discovery probe and update this list.
export const CONVERSION_EVENTS = [
  "form_submit",
  "mail_click",
  "phone_click",
  "purchase",
];

// NOTE on metric naming: in mid-2025 GA4 renamed the `conversions` metric to
// `keyEvents` (and added sessionKeyEventRate / userKeyEventRate). This
// property (id from env) exposes `keyEvents` and does NOT recognise
// `conversions` — a request for `conversions` returns 400 INVALID_ARGUMENT.
// The wrapper therefore requests `keyEvents` everywhere a conversion-style
// metric is needed. Downstream callers should read response rows by the
// `keyEvents` metric name.
const CONVERSION_METRIC = "keyEvents";

const BASE_URL = "https://analyticsdata.googleapis.com/v1beta";

// Track API usage across this process. GA4 doesn't charge units the way
// Ahrefs does, so we surface a simple request counter plus a `tokens_loaded`
// flag so the rest of the toolkit can rely on a uniform shape.
const _consumed = { requests: 0, tokens_loaded: 0 };

// Cached OAuth access token. Exchanged from the refresh token on first use,
// then reused for the life of the process (Google access tokens last ~1h —
// long enough for any single CLI run).
let _accessToken = null;
let _accessTokenPromise = null;

async function getAccessToken() {
  if (_accessToken) return _accessToken;
  if (_accessTokenPromise) return _accessTokenPromise;

  _accessTokenPromise = (async () => {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: env.GOOGLE_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`GA4 OAuth token exchange ${res.status}: ${text.slice(0, 500)}`);
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`GA4 OAuth token returned non-JSON: ${text.slice(0, 200)}`);
    }
    if (!json.access_token) {
      throw new Error(`GA4 OAuth token response missing access_token`);
    }
    _accessToken = json.access_token;
    _consumed.tokens_loaded = 1;
    return _accessToken;
  })();

  try {
    return await _accessTokenPromise;
  } finally {
    _accessTokenPromise = null;
  }
}

/**
 * Core GA4 Data API request helper. Handles auth, JSON encoding, and
 * error surfacing. Most endpoints are POST against
 * /properties/{id}:runReport; metadata is a GET against
 * /properties/{id}/metadata. The `endpoint` argument is the path AFTER
 * /v1beta — e.g. `/properties/123:runReport` or `/properties/123/metadata`.
 *
 * When `body` is null/undefined the request is GET, otherwise POST.
 */
export async function ga4Request(endpoint, body = null) {
  const token = await getAccessToken();
  const method = body == null ? "GET" : "POST";
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  const reqOpts = { method, headers };
  if (body != null) {
    headers["Content-Type"] = "application/json";
    reqOpts.body = JSON.stringify(body);
  }

  const url = BASE_URL + endpoint;
  const res = await fetch(url, reqOpts);
  _consumed.requests += 1;

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GA4 API ${endpoint} ${res.status}: ${text.slice(0, 800)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`GA4 API ${endpoint} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

export function unitsConsumedThisProcess() {
  return { ..._consumed };
}

function toDimensions(list) {
  return (list ?? []).map((name) => (typeof name === "string" ? { name } : name));
}
function toMetrics(list) {
  return (list ?? []).map((name) => (typeof name === "string" ? { name } : name));
}

/**
 * Build a runReport orderBys array from a compact shape:
 *   { metric: "sessions", desc: true }
 *   { dimension: "eventName", desc: false }
 *   [ ...one or more of the above ]
 * Accepts a raw GA4 orderBys array as-is too.
 */
function toOrderBys(orderBy) {
  if (!orderBy) return undefined;
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  return list.map((o) => {
    if (o && (o.metric || o.dimension)) {
      const entry = { desc: !!o.desc };
      if (o.metric) entry.metric = { metricName: o.metric };
      if (o.dimension) entry.dimension = { dimensionName: o.dimension };
      return entry;
    }
    return o;
  });
}

/** Named helpers for the GA4 reports the SEO toolkit uses. */
export const ga4 = {
  /**
   * Generic runReport pass-through.
   * Accepts the high-level options described in the README and converts
   * them to a v1beta runReport body before posting.
   */
  runReport: ({
    startDate,
    endDate,
    dimensions,
    metrics,
    orderBy,
    limit,
    dimensionFilter,
  } = {}) => {
    if (!startDate || !endDate) {
      throw new Error("ga4.runReport requires startDate and endDate");
    }
    const body = {
      dateRanges: [{ startDate, endDate }],
      dimensions: toDimensions(dimensions),
      metrics: toMetrics(metrics),
    };
    const ob = toOrderBys(orderBy);
    if (ob) body.orderBys = ob;
    if (limit != null) body.limit = String(limit);
    if (dimensionFilter) body.dimensionFilter = dimensionFilter;
    return ga4Request(`/properties/${PROPERTY_ID}:runReport`, body);
  },

  /** Top landing pages by sessions over a date window. */
  topLandingPages: ({
    startDate = "90daysAgo",
    endDate = "yesterday",
    limit = 100,
  } = {}) =>
    ga4.runReport({
      startDate,
      endDate,
      dimensions: ["landingPagePlusQueryString"],
      // `keyEvents` is the post-2025 rename of `conversions` — see header
      // note. Callers reading the response should look for the `keyEvents`
      // metric, not `conversions`.
      metrics: ["sessions", "totalUsers", CONVERSION_METRIC, "engagedSessions"],
      orderBy: { metric: "sessions", desc: true },
      limit,
    }),

  /** All event names that fired in the window, ranked by event count. */
  conversionEvents: ({
    startDate = "90daysAgo",
    endDate = "yesterday",
    limit = 50,
  } = {}) =>
    ga4.runReport({
      startDate,
      endDate,
      dimensions: ["eventName"],
      metrics: ["eventCount", "totalUsers"],
      orderBy: { metric: "eventCount", desc: true },
      limit,
    }),

  /**
   * Landing pages that triggered a specific event. If `eventName` is
   * omitted the helper falls back to the first configured conversion event
   * in CONVERSION_EVENTS. Callers that need every conversion event should
   * iterate CONVERSION_EVENTS and call this helper per event.
   */
  landingPagesByEvent: ({
    eventName,
    startDate = "90daysAgo",
    endDate = "yesterday",
    limit = 100,
  } = {}) => {
    const target = eventName ?? CONVERSION_EVENTS[0];
    if (!target) {
      throw new Error(
        "ga4.landingPagesByEvent: no eventName provided and CONVERSION_EVENTS is empty",
      );
    }
    return ga4.runReport({
      startDate,
      endDate,
      dimensions: ["landingPagePlusQueryString"],
      metrics: ["eventCount", "totalUsers"],
      orderBy: { metric: "eventCount", desc: true },
      limit,
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: target },
        },
      },
    });
  },

  /** Available dimensions + metrics for the property (incl. custom). */
  metadata: () => ga4Request(`/properties/${PROPERTY_ID}/metadata`),

  /** Totals across the property for a date window. Returns a single row. */
  dateRangeSummary: ({ startDate, endDate } = {}) => {
    if (!startDate || !endDate) {
      throw new Error("ga4.dateRangeSummary requires startDate and endDate");
    }
    return ga4.runReport({
      startDate,
      endDate,
      dimensions: [],
      metrics: [
        "sessions",
        "totalUsers",
        "engagedSessions",
        CONVERSION_METRIC,
        "eventCount",
        "screenPageViews",
      ],
    });
  },
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
  console.log(`Smoke-testing GA4 Data API against property: ${PROPERTY_ID}`);
  try {
    const summary = await ga4.dateRangeSummary({
      startDate: "90daysAgo",
      endDate: "yesterday",
    });
    console.log("dateRangeSummary response:");
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\nUsage this process: ${JSON.stringify(unitsConsumedThisProcess())}`);
  } catch (e) {
    console.error("Smoke test failed:");
    console.error(e.message);
    console.error(
      "\nIf the property reports zero data, confirm GA4_PROPERTY_ID matches the live",
    );
    console.error(
      "property serving the site and that the gtag/GTM tag is firing in production.",
    );
    process.exit(1);
  }
}
