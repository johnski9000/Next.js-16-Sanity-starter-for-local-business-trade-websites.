// Base Google Business Profile API wrapper. Reads OAuth + account/location
// ids from .env / .env.local. Pattern matches frontend/seo/ga4-query.mjs and
// frontend/seo/gsc-query.mjs.
//
// Usage as a library:
//   import { gbp, ACCOUNT_NAME, LOCATION_NAME } from "./gbp-query.mjs";
//   const loc = await gbp.getLocation({
//     readMask: "name,title,storefrontAddress,websiteUri",
//   });
//
// Usage as a CLI smoke test:
//   node frontend/seo/gbp-query.mjs
//
// GBP is split across three host APIs that each share the same OAuth scope
// (business.manage). This wrapper hides which host backs which call so
// callers don't have to remember:
//   - mybusinessaccountmanagement.googleapis.com  (accounts)
//   - mybusinessbusinessinformation.googleapis.com (locations, categories)
//   - businessprofileperformance.googleapis.com   (daily metrics, keywords)

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
// GBP is OPTIONAL. THROW (don't process.exit) on missing config so importers —
// the Monday runner's GBP step and the 3-way attribution overlay — can CATCH this
// and skip GBP cleanly instead of crashing the whole run. Run directly as a CLI,
// an uncaught throw still exits non-zero with this message.
{
  const missing = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "GBP_ACCOUNT_ID",
    "GBP_LOCATION_ID",
  ].filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(
      `GBP not configured — missing ${missing.join(", ")} in .env. GBP local-pack ` +
        `metrics are optional; add these (and complete the one-time Business Profile ` +
        `API allowlist for your agency Cloud project) to enable them.`,
    );
  }
}

// Normalise account/location ids — env values may arrive with or without
// the "accounts/" / "locations/" prefix. Strip then re-add so downstream
// callers can rely on the canonical "accounts/123" / "locations/456" form.
export const ACCOUNT_NAME = `accounts/${String(env.GBP_ACCOUNT_ID).replace(
  /^accounts\//,
  "",
)}`;
export const LOCATION_NAME = `locations/${String(env.GBP_LOCATION_ID).replace(
  /^locations\//,
  "",
)}`;

const HOSTS = {
  account: "https://mybusinessaccountmanagement.googleapis.com",
  info: "https://mybusinessbusinessinformation.googleapis.com",
  perf: "https://businessprofileperformance.googleapis.com",
};

// Track API usage across this process. Mirrors ga4-query.mjs so the rest of
// the toolkit can rely on a uniform shape.
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
      throw new Error(
        `GBP OAuth token exchange ${res.status}: ${text.slice(0, 500)}`,
      );
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(
        `GBP OAuth token returned non-JSON: ${text.slice(0, 200)}`,
      );
    }
    if (!json.access_token) {
      throw new Error(`GBP OAuth token response missing access_token`);
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

export function unitsConsumedThisProcess() {
  return { ..._consumed };
}

/**
 * Low-level authed fetch. `url` is the full URL (caller chooses host).
 * `method` defaults to GET. `body` is JSON-encoded when provided.
 */
async function callGoogle({ method = "GET", url, body = null } = {}) {
  if (!url) throw new Error("gbp.callGoogle requires `url`");
  const token = await getAccessToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  const reqOpts = { method, headers };
  if (body != null) {
    headers["Content-Type"] = "application/json";
    reqOpts.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const res = await fetch(url, reqOpts);
  _consumed.requests += 1;
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`GBP API ${method} ${url} ${res.status}: ${text.slice(0, 800)}`);
    err.status = res.status;
    err.body = text;
    try {
      err.json = JSON.parse(text);
    } catch {}
    throw err;
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`GBP API ${method} ${url} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

// Supported DailyMetric enum values. Order is preserved for totalsForWindow.
const DAILY_METRICS = [
  "WEBSITE_CLICKS",
  "CALL_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "BUSINESS_CONVERSATIONS",
  "BUSINESS_BOOKINGS",
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
];

// Map enum → snake_case key used in totalsForWindow's response shape.
const TOTAL_KEYS = {
  WEBSITE_CLICKS: "website_clicks",
  CALL_CLICKS: "call_clicks",
  BUSINESS_DIRECTION_REQUESTS: "direction_requests",
  BUSINESS_CONVERSATIONS: "conversations",
  BUSINESS_BOOKINGS: "bookings",
  BUSINESS_IMPRESSIONS_DESKTOP_MAPS: "impressions_desktop_maps",
  BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: "impressions_desktop_search",
  BUSINESS_IMPRESSIONS_MOBILE_MAPS: "impressions_mobile_maps",
  BUSINESS_IMPRESSIONS_MOBILE_SEARCH: "impressions_mobile_search",
};

// Parse "YYYY-MM-DD" into integer parts. Throws on malformed input.
function parseYmd(s, label) {
  const m = String(s ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`gbp: ${label} must be YYYY-MM-DD, got ${s}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

// Sum the numeric values inside a single dailyMetricTimeSeries response.
// datedValues entries look like { date: { year, month, day }, value: "12" }.
// Missing days simply don't appear; absent `value` is treated as 0.
function sumDatedValues(series) {
  const dv = series?.timeSeries?.datedValues ?? [];
  let total = 0;
  for (const row of dv) {
    const n = Number(row?.value ?? 0);
    if (Number.isFinite(n)) total += n;
  }
  return total;
}

export const gbp = {
  /** Generic OAuth-authed fetch for ad-hoc calls. */
  callGoogle,

  // ───────────────────────── Account Management ─────────────────────────

  /** List every GBP account the authed user can see. */
  listAccounts: () =>
    callGoogle({ method: "GET", url: `${HOSTS.account}/v1/accounts` }),

  // ──────────────────────── Business Information ────────────────────────

  /** List locations under an account. `readMask` is required by the API. */
  listLocations: ({ accountName = ACCOUNT_NAME, readMask } = {}) => {
    if (!readMask) throw new Error("gbp.listLocations requires readMask");
    const qs = new URLSearchParams({ readMask });
    return callGoogle({
      method: "GET",
      url: `${HOSTS.info}/v1/${accountName}/locations?${qs}`,
    });
  },

  /** Fetch the configured location with a readMask. */
  getLocation: ({ readMask } = {}) => {
    if (!readMask) throw new Error("gbp.getLocation requires readMask");
    const qs = new URLSearchParams({ readMask });
    return callGoogle({
      method: "GET",
      url: `${HOSTS.info}/v1/${LOCATION_NAME}?${qs}`,
    });
  },

  /** PATCH the configured location. updateMask is comma-joined field paths. */
  updateLocation: ({ updateMask, body } = {}) => {
    if (!updateMask) throw new Error("gbp.updateLocation requires updateMask");
    if (!body) throw new Error("gbp.updateLocation requires body");
    const qs = new URLSearchParams({ updateMask });
    return callGoogle({
      method: "PATCH",
      url: `${HOSTS.info}/v1/${LOCATION_NAME}?${qs}`,
      body,
    });
  },

  /** List GBP categories for a region/language. */
  listCategories: ({ regionCode = "GB", languageCode = "en", view = "FULL" } = {}) => {
    const qs = new URLSearchParams({ regionCode, languageCode, view });
    return callGoogle({
      method: "GET",
      url: `${HOSTS.info}/v1/categories?${qs}`,
    });
  },

  // ─────────────────────── Business Profile Performance ─────────────────────

  /**
   * Daily metric time series.
   *  metrics: array of DailyMetric enum strings.
   *  startDate/endDate: "YYYY-MM-DD".
   * Returns the raw API shape so callers can keep per-day granularity.
   */
  dailyMetricsTimeSeries: ({ metrics, startDate, endDate } = {}) => {
    if (!Array.isArray(metrics) || metrics.length === 0) {
      throw new Error("gbp.dailyMetricsTimeSeries requires a non-empty metrics[]");
    }
    for (const m of metrics) {
      if (!DAILY_METRICS.includes(m)) {
        throw new Error(`gbp.dailyMetricsTimeSeries: unsupported metric ${m}`);
      }
    }
    const s = parseYmd(startDate, "startDate");
    const e = parseYmd(endDate, "endDate");

    // URLSearchParams handles repeating ?dailyMetrics= keys cleanly.
    const qs = new URLSearchParams();
    for (const m of metrics) qs.append("dailyMetrics", m);
    qs.append("dailyRange.start_date.year", String(s.year));
    qs.append("dailyRange.start_date.month", String(s.month));
    qs.append("dailyRange.start_date.day", String(s.day));
    qs.append("dailyRange.end_date.year", String(e.year));
    qs.append("dailyRange.end_date.month", String(e.month));
    qs.append("dailyRange.end_date.day", String(e.day));

    return callGoogle({
      method: "GET",
      url: `${HOSTS.perf}/v1/${LOCATION_NAME}:fetchMultiDailyMetricsTimeSeries?${qs}`,
    });
  },

  /**
   * Convenience: fetch every supported DailyMetric over the window and
   * return a flat snake_case object of summed totals.
   */
  totalsForWindow: async ({ startDate, endDate } = {}) => {
    const raw = await gbp.dailyMetricsTimeSeries({
      metrics: DAILY_METRICS,
      startDate,
      endDate,
    });
    const out = {};
    for (const key of Object.values(TOTAL_KEYS)) out[key] = 0;
    const list = raw?.multiDailyMetricTimeSeries ?? [];
    // The response may nest each metric one level deeper as
    // `{ dailyMetricTimeSeries: [ { dailyMetric, timeSeries } ] }`,
    // or flatten it directly under the top entry. Handle both shapes.
    for (const entry of list) {
      const inner = entry?.dailyMetricTimeSeries;
      const seriesList = Array.isArray(inner) ? inner : inner ? [inner] : [entry];
      for (const series of seriesList) {
        const metric = series?.dailyMetric;
        if (!metric) continue;
        const key = TOTAL_KEYS[metric];
        if (!key) continue;
        out[key] += sumDatedValues(series);
      }
    }
    return out;
  },

  /**
   * Search keywords (monthly impressions). `monthsBack` controls the
   * range; the API expects whole months. Defaults to the last 6 months
   * up to (and including) the current month.
   */
  searchKeywords: ({ monthsBack = 6 } = {}) => {
    const now = new Date();
    const endYear = now.getUTCFullYear();
    const endMonth = now.getUTCMonth() + 1; // 1–12
    // Walk back monthsBack-1 months from end so the window is inclusive.
    const startTotal = endYear * 12 + (endMonth - 1) - (monthsBack - 1);
    const startYear = Math.floor(startTotal / 12);
    const startMonth = (startTotal % 12) + 1;

    const qs = new URLSearchParams();
    qs.append("monthlyRange.start_month.year", String(startYear));
    qs.append("monthlyRange.start_month.month", String(startMonth));
    qs.append("monthlyRange.end_month.year", String(endYear));
    qs.append("monthlyRange.end_month.month", String(endMonth));

    return callGoogle({
      method: "GET",
      url: `${HOSTS.perf}/v1/${LOCATION_NAME}/searchkeywords/impressions/monthly?${qs}`,
    });
  },
};

// ─────────────────────────── CLI smoke test ───────────────────────────

const __isMain = (() => {
  try {
    const argv = process.argv[1] ?? "";
    const norm = argv.replace(/\\/g, "/");
    return import.meta.url === `file://${norm}` || import.meta.url.endsWith(norm);
  } catch {
    return false;
  }
})();

// Detect the specific "allowlist not yet granted" failure: GBP performance
// APIs return HTTP 403 with status RESOURCE_EXHAUSTED and a quota metric
// whose quota_limit_value is "0" until the project is on the allowlist.
function isQuotaNotGranted(err) {
  if (!err || err.status !== 403) return false;
  const details = err.json?.error?.details ?? [];
  for (const d of details) {
    if (d?.reason === "RATE_LIMIT_EXCEEDED" || d?.reason === "RESOURCE_EXHAUSTED") {
      const violations = d.quotaMetric ? [d] : d.violations ?? d.quotaViolations ?? [];
      for (const v of violations) {
        if (String(v?.quotaValue ?? v?.quota_limit_value ?? "") === "0") return true;
      }
    }
  }
  // Fallback: status string + zero-quota mention in the raw body.
  const status = err.json?.error?.status;
  if (status === "RESOURCE_EXHAUSTED" && /quota_limit_value[^0-9]*0/.test(err.body ?? "")) {
    return true;
  }
  return false;
}

function ymdDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

if (__isMain) {
  console.log(`[gbp-query] ACCOUNT_NAME=${ACCOUNT_NAME}`);
  console.log(`[gbp-query] LOCATION_NAME=${LOCATION_NAME}`);

  try {
    console.log("[gbp-query] getLocation(...)");
    const loc = await gbp.getLocation({
      readMask: "name,title,storefrontAddress,websiteUri",
    });
    console.log(JSON.stringify(loc, null, 2));

    const endDate = ymdDaysAgo(1);
    const startDate = ymdDaysAgo(90);
    console.log(`[gbp-query] totalsForWindow ${startDate} → ${endDate}`);
    const totals = await gbp.totalsForWindow({ startDate, endDate });
    console.log(JSON.stringify(totals, null, 2));

    console.log(
      `[gbp-query] usage this process: ${JSON.stringify(unitsConsumedThisProcess())}`,
    );
    process.exit(0);
  } catch (e) {
    if (isQuotaNotGranted(e)) {
      console.log(
        "[gbp-query] QUOTA NOT YET GRANTED — see frontend/seo/gbp-README.md for allowlist instructions. Exiting 0 cleanly.",
      );
      process.exit(0);
    }
    console.error("[gbp-query] Smoke test failed:");
    console.error(e.message);
    process.exit(1);
  }
}
