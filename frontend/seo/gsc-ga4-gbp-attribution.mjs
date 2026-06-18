// Three-way attribution analyser: GSC <-> GA4 <-> GBP.
// Extends gsc-ga4-attribution.mjs with a Google Business Profile (local-pack)
// overlay so SEO movement can be attributed to one of three channels:
//   1. Classic organic search (GSC impressions/clicks <-> GA4 Organic Search sessions)
//   2. Local pack / Maps (GBP Performance API totals + GA4 sessions whose
//      sessionSource/Medium look like Maps/GMB)
//   3. Combined (page appears in both)
//
// GBP's Performance API is LOCATION-LEVEL, not URL-level — so per-URL GBP
// attribution is approximated via GA4's sessionSource/sessionMedium dimensions.
//
// Inputs
//   - frontend/seo/data/gsc/gsc-pages-90d.json     (existing GSC page-level export)
//   - GA4 Data API (pulled fresh for the same 90d window ending yesterday)
//   - GBP Performance API via frontend/seo/gbp-query.mjs (graceful skip if quota
//     not yet granted — submit allowlist form at support.google.com/business/contact/api_default)
//
// Outputs
//   - frontend/seo/data/gbp/attribution/gsc-ga4-gbp-YYYY-MM-DD.json
//   - frontend/seo/data/gbp/reports/gsc-ga4-gbp-attribution-YYYY-MM-DD.md
//
// Usage
//   node frontend/seo/gsc-ga4-gbp-attribution.mjs
//
// Env (loaded from .env / .env.local)
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
//   GA4_PROPERTY_ID, GSC_SITE_URL
//   GBP_ACCOUNT_ID, GBP_LOCATION_ID (used by gbp-query.mjs)
import fs from "node:fs";
import path from "node:path";
import { DIRS, GSC_EXPORT, ensureDir } from "./seo-paths.mjs";

// ---------- env loader (mirrors ga4-discover.mjs / gsc-ga4-attribution.mjs) ----------
function loadEnv() {
  const env = { ...process.env };
  for (const file of [".env", ".env.local"]) {
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
const REQUIRED = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GA4_PROPERTY_ID"];
const missing = REQUIRED.filter((k) => !env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  console.error("Add them to .env or .env.local at repo root.");
  process.exit(1);
}

// ---------- path normaliser (the join key) ----------
function normalisePath(input) {
  if (input == null) return "";
  let s = String(input).trim();
  if (!s || s === "(not set)") return "";
  try {
    if (/^https?:\/\//i.test(s)) s = new URL(s).pathname + (new URL(s).search || "");
  } catch {}
  const qIdx = s.search(/[?#]/);
  if (qIdx !== -1) s = s.slice(0, qIdx);
  if (!s.startsWith("/")) s = "/" + s;
  s = s.replace(/\/{2,}/g, "/");
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s.toLowerCase();
}

// ---------- date helpers ----------
function yyyyMmDd(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
const today = new Date();
const yesterday = new Date(today);
yesterday.setUTCDate(today.getUTCDate() - 1);
const startWindow = new Date(yesterday);
startWindow.setUTCDate(yesterday.getUTCDate() - 89);
const WINDOW = { startDate: yyyyMmDd(startWindow), endDate: yyyyMmDd(yesterday) };
const REPORT_DATE = yyyyMmDd(today);

// ---------- GBP-attribution regexes ----------
// Used to classify GA4 rows by sessionSource / sessionMedium.
const GBP_SOURCE_RE = /(maps|business|gmb)/i;
const GBP_MEDIUM_RE = /(local|maps|gmb)/i;
function isGbpAttributedRow({ source, medium }) {
  return GBP_SOURCE_RE.test(source || "") || GBP_MEDIUM_RE.test(medium || "");
}

// ---------- 1. Read GSC export ----------
const GSC_PATH = GSC_EXPORT;
if (!fs.existsSync(GSC_PATH)) {
  console.error(`GSC export not found at ${GSC_PATH}.`);
  console.error("Generate it first: node frontend/seo/gsc-query.mjs");
  process.exit(1);
}
const gscRaw = JSON.parse(fs.readFileSync(GSC_PATH, "utf8"));
const gscRows = (gscRaw.rows ?? []).map((r) => {
  const url = r.keys?.[0] || "";
  return {
    url,
    path: normalisePath(url),
    impressions: Number(r.impressions || 0),
    clicks: Number(r.clicks || 0),
    ctr: Number(r.ctr || 0),
    position: Number(r.position || 0),
  };
}).filter((r) => r.path);
console.error(`gsc: loaded ${gscRows.length} page rows from ${GSC_PATH}`);

// ---------- 2. OAuth access token ----------
async function fetchAccessToken() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`OAuth token exchange failed: HTTP ${r.status} ${text}`);
  const j = JSON.parse(text);
  if (!j.access_token) throw new Error(`OAuth response had no access_token: ${text}`);
  return j.access_token;
}

const accessToken = await fetchAccessToken();
console.error("oauth: access token acquired");
const authHeaders = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

// ---------- 3. GSC query enrichment (top 5 queries per page) ----------
const queriesByPath = new Map();
const allGscQueryRows = []; // For the GBP vs GSC keyword comparison.
if (env.GSC_SITE_URL) {
  try {
    const site = encodeURIComponent(env.GSC_SITE_URL);
    // 3a. Per-page top queries
    const body = {
      startDate: WINDOW.startDate,
      endDate: WINDOW.endDate,
      dimensions: ["page", "query"],
      rowLimit: 25000,
    };
    const r = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
      { method: "POST", headers: authHeaders, body: JSON.stringify(body) }
    );
    if (!r.ok) {
      console.error(`gsc page-query: HTTP ${r.status} — skipping query enrichment`);
    } else {
      const j = await r.json();
      for (const row of j.rows || []) {
        const p = normalisePath(row.keys?.[0]);
        const q = row.keys?.[1] || "";
        if (!p || !q) continue;
        if (!queriesByPath.has(p)) queriesByPath.set(p, []);
        queriesByPath.get(p).push({
          query: q,
          clicks: Number(row.clicks || 0),
          impressions: Number(row.impressions || 0),
          position: Number(row.position || 0),
        });
      }
      for (const [p, arr] of queriesByPath) {
        arr.sort((a, b) => b.impressions - a.impressions);
        queriesByPath.set(p, arr.slice(0, 5));
      }
      console.error(`gsc page-query: enriched ${queriesByPath.size} pages with top-5 queries`);
    }

    // 3b. Site-wide top queries (for GBP keyword comparison)
    const qBody = {
      startDate: WINDOW.startDate,
      endDate: WINDOW.endDate,
      dimensions: ["query"],
      rowLimit: 1000,
    };
    const qr = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
      { method: "POST", headers: authHeaders, body: JSON.stringify(qBody) }
    );
    if (!qr.ok) {
      console.error(`gsc top-queries: HTTP ${qr.status} — skipping site-wide query export`);
    } else {
      const qj = await qr.json();
      for (const row of qj.rows || []) {
        allGscQueryRows.push({
          query: row.keys?.[0] || "",
          impressions: Number(row.impressions || 0),
          clicks: Number(row.clicks || 0),
          ctr: Number(row.ctr || 0),
          position: Number(row.position || 0),
        });
      }
      allGscQueryRows.sort((a, b) => b.impressions - a.impressions);
      console.error(`gsc top-queries: ${allGscQueryRows.length} site-wide queries`);
    }
  } catch (e) {
    console.error(`gsc queries: ${e.message} — skipping query enrichment`);
  }
} else {
  console.error("gsc queries: GSC_SITE_URL not set, skipping query enrichment");
}

// ---------- 4. GA4 landing-page report ----------
const propertyId = String(env.GA4_PROPERTY_ID).replace(/^properties\//, "").trim();

async function ga4RunReport(body) {
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    { method: "POST", headers: authHeaders, body: JSON.stringify(body) }
  );
  const text = await r.text();
  if (!r.ok) throw new Error(`GA4 runReport ${r.status}: ${text}`);
  return JSON.parse(text);
}

async function ga4PickConversionMetric() {
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}/metadata`,
    { headers: authHeaders }
  );
  if (!r.ok) {
    console.error(`ga4 metadata: HTTP ${r.status} — defaulting to keyEvents`);
    return { conv: "keyEvents", convRate: "sessionKeyEventRate", names: [] };
  }
  const meta = await r.json();
  const names = (meta.metrics || []).map((m) => m.apiName);
  if (names.includes("keyEvents")) {
    return { conv: "keyEvents", convRate: names.includes("sessionKeyEventRate") ? "sessionKeyEventRate" : null, names };
  }
  if (names.includes("conversions")) {
    return { conv: "conversions", convRate: names.includes("sessionConversionRate") ? "sessionConversionRate" : null, names };
  }
  return { conv: null, convRate: null, names };
}

let ga4Helper = null;
try {
  const url = new URL("./ga4-query.mjs", import.meta.url);
  if (fs.existsSync(url)) {
    ga4Helper = await import(url.href);
    console.error("ga4: using helper from ./ga4-query.mjs");
  }
} catch (e) {
  console.error(`ga4: ./ga4-query.mjs import skipped (${e.message})`);
  ga4Helper = null;
}

let landingRows = [];
let convMetric = null;
let convRateMetric = null;

if (ga4Helper && typeof ga4Helper.fetchLandingPages === "function") {
  try {
    landingRows = await ga4Helper.fetchLandingPages({
      window: WINDOW,
      accessToken,
      propertyId,
    });
    convMetric = ga4Helper.conversionMetricName || "keyEvents";
    convRateMetric = ga4Helper.conversionRateMetricName || null;
    console.error(`ga4: helper returned ${landingRows.length} landing pages`);
  } catch (e) {
    console.error(`ga4 helper failed (${e.message}) — falling back to inline call`);
    ga4Helper = null;
  }
}

if (!ga4Helper) {
  const picked = await ga4PickConversionMetric();
  convMetric = picked.conv;
  convRateMetric = picked.convRate;
  if (!convMetric) {
    console.error("ga4: property exposes neither 'conversions' nor 'keyEvents' — conversion sections will be empty.");
  } else {
    console.error(`ga4: using conversion metric '${convMetric}'${convRateMetric ? `, rate '${convRateMetric}'` : ""}`);
  }

  const landingDim = "landingPagePlusQueryString";
  const metrics = [
    { name: "sessions" },
    { name: "totalUsers" },
    ...(convMetric ? [{ name: convMetric }] : []),
    ...(convRateMetric ? [{ name: convRateMetric }] : []),
  ];

  let report;
  try {
    report = await ga4RunReport({
      dateRanges: [WINDOW],
      dimensions: [{ name: landingDim }],
      metrics,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10000,
    });
  } catch (e) {
    console.error(`ga4 landing report (${landingDim}) failed: ${e.message}`);
    console.error("ga4: retrying with dimension 'landingPage'");
    report = await ga4RunReport({
      dateRanges: [WINDOW],
      dimensions: [{ name: "landingPage" }],
      metrics,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10000,
    });
  }

  landingRows = (report.rows || []).map((row) => {
    const pageRaw = row.dimensionValues?.[0]?.value || "";
    const vals = row.metricValues || [];
    let i = 0;
    const sessions = Number(vals[i++]?.value || 0);
    const totalUsers = Number(vals[i++]?.value || 0);
    const conversions = convMetric ? Number(vals[i++]?.value || 0) : 0;
    const conversionRate = convRateMetric ? Number(vals[i++]?.value || 0) : (sessions > 0 ? conversions / sessions : 0);
    return {
      pageRaw,
      page: normalisePath(pageRaw),
      sessions,
      totalUsers,
      conversions,
      conversionRate,
    };
  }).filter((r) => r.page);
  console.error(`ga4: ${landingRows.length} landing pages returned (after pathname normalisation)`);

  if (convMetric) {
    try {
      const evReport = await ga4RunReport({
        dateRanges: [WINDOW],
        dimensions: [{ name: "landingPagePlusQueryString" }, { name: "eventName" }],
        metrics: [{ name: convMetric }],
        orderBys: [{ metric: { metricName: convMetric }, desc: true }],
        limit: 25000,
      });
      const primaryByPath = new Map();
      for (const row of evReport.rows || []) {
        const p = normalisePath(row.dimensionValues?.[0]?.value || "");
        const ev = row.dimensionValues?.[1]?.value || "";
        const c = Number(row.metricValues?.[0]?.value || 0);
        if (!p || !ev || c <= 0) continue;
        if (!primaryByPath.has(p)) primaryByPath.set(p, []);
        primaryByPath.get(p).push({ event: ev, count: c });
      }
      for (const lr of landingRows) {
        const arr = primaryByPath.get(lr.page) || [];
        arr.sort((a, b) => b.count - a.count);
        lr.primaryEvents = arr.slice(0, 3);
      }
      console.error(`ga4: enriched ${primaryByPath.size} pages with primary conversion events`);
    } catch (e) {
      console.error(`ga4 primary-events report failed: ${e.message} — skipping enrichment`);
    }
  }
}

// ---------- 5. GA4 channel/source breakdown (the GSC vs GBP attribution split) ----------
// Per-landing-page sessions by sessionDefaultChannelGroup + sessionSource +
// sessionMedium so we can tag each row as "GSC-attributed" (Organic Search) or
// "GBP-attributed" (source/medium matches the local-pack regex).
const ga4ChannelByPath = new Map(); // path -> { organic, gbp, otherChannels: Map(channel -> sessions) }
function ensureChannelEntry(p) {
  if (!ga4ChannelByPath.has(p)) {
    ga4ChannelByPath.set(p, {
      organic: 0,
      gbp: 0,
      total: 0,
      sources: new Map(),       // "source / medium" -> sessions
      channels: new Map(),      // channelGroup -> sessions
    });
  }
  return ga4ChannelByPath.get(p);
}

try {
  const channelReport = await ga4RunReport({
    dateRanges: [WINDOW],
    dimensions: [
      { name: "landingPagePlusQueryString" },
      { name: "sessionDefaultChannelGroup" },
      { name: "sessionSource" },
      { name: "sessionMedium" },
    ],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 100000,
  });
  let attributedRows = 0;
  for (const row of channelReport.rows || []) {
    const p = normalisePath(row.dimensionValues?.[0]?.value || "");
    const channelGroup = row.dimensionValues?.[1]?.value || "(unknown)";
    const source = row.dimensionValues?.[2]?.value || "";
    const medium = row.dimensionValues?.[3]?.value || "";
    const sessions = Number(row.metricValues?.[0]?.value || 0);
    if (!p || sessions <= 0) continue;
    const e = ensureChannelEntry(p);
    e.total += sessions;
    const sourceKey = `${source} / ${medium}`;
    e.sources.set(sourceKey, (e.sources.get(sourceKey) || 0) + sessions);
    e.channels.set(channelGroup, (e.channels.get(channelGroup) || 0) + sessions);
    if (channelGroup === "Organic Search") {
      e.organic += sessions;
    }
    if (isGbpAttributedRow({ source, medium })) {
      e.gbp += sessions;
    }
    attributedRows++;
  }
  console.error(`ga4 channel breakdown: ${attributedRows} rows aggregated across ${ga4ChannelByPath.size} landing pages`);
} catch (e) {
  console.error(`ga4 channel breakdown failed: ${e.message} — GBP-attribution column will be 0 everywhere`);
}

// ---------- 6. GBP overlay (Performance API via gbp-query.mjs) ----------
let gbpAvailable = false;
let gbpQuotaExceeded = false;
let gbpError = null;
let gbpTotals = null;
let gbpKeywords = [];
let gbpLocationMeta = null;
let gbpAccountName = null;
let gbpLocationName = null;

try {
  const url = new URL("./gbp-query.mjs", import.meta.url);
  if (!fs.existsSync(url)) {
    throw new Error("./gbp-query.mjs not found (script not yet deployed)");
  }
  const mod = await import(url.href);
  gbpAccountName = mod.ACCOUNT_NAME || null;
  gbpLocationName = mod.LOCATION_NAME || null;
  if (!mod.gbp) throw new Error("./gbp-query.mjs did not export `gbp`");

  // Pull location metadata (cheap) first to confirm OAuth + location resolve.
  try {
    gbpLocationMeta = await mod.gbp.getLocation({ readMask: "name,title,storefrontAddress,websiteUri" });
  } catch (e) {
    if (/quota|rate.?limit|429|403/i.test(e.message)) {
      gbpQuotaExceeded = true;
      gbpError = e.message;
    } else {
      gbpError = e.message;
    }
    throw e;
  }

  // Totals over the same 90-day window.
  try {
    gbpTotals = await mod.gbp.totalsForWindow({
      startDate: WINDOW.startDate,
      endDate: WINDOW.endDate,
    });
  } catch (e) {
    if (/quota|rate.?limit|429|403/i.test(e.message)) {
      gbpQuotaExceeded = true;
      gbpError = e.message;
    } else {
      gbpError = e.message;
    }
    throw e;
  }

  // Search keywords (monthly impressions; default 6 months — clip later).
  try {
    const kw = await mod.gbp.searchKeywords({ monthsBack: 6 });
    const rawCounts = kw?.searchKeywordsCounts || [];
    gbpKeywords = rawCounts.map((row) => {
      const insightsValue = row.insightsValue || {};
      const raw = insightsValue.value ?? insightsValue.threshold ?? 0;
      const value = Number(raw) || 0;
      return {
        keyword: row.searchKeyword || "",
        impressions: value,
        thresholded: insightsValue.value == null && insightsValue.threshold != null,
      };
    }).filter((r) => r.keyword);
    gbpKeywords.sort((a, b) => b.impressions - a.impressions);
  } catch (e) {
    // Keyword endpoint can 403 separately; don't block overall GBP section.
    console.error(`gbp searchKeywords failed (non-fatal): ${e.message}`);
    gbpKeywords = [];
  }

  gbpAvailable = true;
  console.error(`gbp: overlay ready — totals + ${gbpKeywords.length} keywords`);
} catch (e) {
  if (!gbpError) gbpError = e.message;
  if (/quota|rate.?limit|429|403/i.test(e.message)) {
    gbpQuotaExceeded = true;
  }
  console.error(`gbp: overlay unavailable — ${e.message}`);
}

// ---------- 7. Join GSC + GA4 ----------
const merged = new Map();
function ensure(p) {
  if (!merged.has(p)) {
    merged.set(p, {
      path: p,
      gsc: null,
      ga4: null,
    });
  }
  return merged.get(p);
}
for (const r of gscRows) {
  const e = ensure(r.path);
  e.gsc = {
    url: r.url,
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: r.ctr,
    position: r.position,
    topQueries: queriesByPath.get(r.path) || [],
  };
}
for (const r of landingRows) {
  const e = ensure(r.page);
  e.ga4 = {
    raw: r.pageRaw,
    sessions: r.sessions,
    totalUsers: r.totalUsers,
    conversions: r.conversions,
    conversionRate: r.conversionRate,
    primaryEvents: r.primaryEvents || [],
  };
}

const joined = [...merged.values()];

// ---------- 8. Aggregates ----------
const totalConversions = joined.reduce((s, j) => s + (j.ga4?.conversions || 0), 0);
const noConversionsConfigured = !convMetric || totalConversions === 0;

// ---------- 9. Row picker (now with channel attribution) ----------
function fmt(n, digits = 0) {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toFixed(digits);
}
function fmtPct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return (Number(n) * 100).toFixed(2) + "%";
}
function pickRow(j) {
  const chan = ga4ChannelByPath.get(j.path) || { organic: 0, gbp: 0, total: 0, sources: new Map(), channels: new Map() };
  return {
    path: j.path,
    gscImpr: j.gsc?.impressions ?? 0,
    gscClicks: j.gsc?.clicks ?? 0,
    gscPos: j.gsc?.position ?? null,
    gscCtr: j.gsc?.ctr ?? null,
    ga4Sessions: j.ga4?.sessions ?? 0,
    ga4Users: j.ga4?.totalUsers ?? 0,
    ga4Conv: j.ga4?.conversions ?? 0,
    ga4ConvRate: j.ga4?.conversionRate ?? (j.ga4 && j.ga4.sessions > 0 ? (j.ga4.conversions / j.ga4.sessions) : null),
    ga4OrganicSessions: chan.organic,
    ga4GbpSessions: chan.gbp,
    ga4ChannelTotal: chan.total,
    topQueries: j.gsc?.topQueries || [],
    primaryEvents: j.ga4?.primaryEvents || [],
  };
}
const allRows = joined.map(pickRow);

// Sections (same as the GSC×GA4 script)
const section1 = allRows
  .filter((r) => r.gscImpr > 0)
  .sort((a, b) => b.gscImpr - a.gscImpr)
  .slice(0, 50);

const section2 = allRows
  .filter((r) => r.gscPos != null && r.gscPos >= 5 && r.gscPos <= 25 && r.gscImpr >= 50)
  .sort((a, b) => b.gscImpr - a.gscImpr)
  .slice(0, 50);

const section3 = allRows
  .filter((r) => r.gscImpr > 0 && r.ga4Conv > 0)
  .map((r) => ({ ...r, convPerImpr: r.ga4Conv / r.gscImpr }))
  .sort((a, b) => b.convPerImpr - a.convPerImpr)
  .slice(0, 30);

const section4 = allRows
  .filter((r) => r.gscImpr >= 200 && (r.ga4Conv || 0) === 0)
  .sort((a, b) => b.gscImpr - a.gscImpr)
  .slice(0, 50);

const section5 = allRows
  .filter((r) => r.ga4Conv > 0 && r.gscImpr < 100)
  .sort((a, b) => b.ga4Conv - a.ga4Conv)
  .slice(0, 50);

const section6 = allRows
  .filter((r) => r.ga4Conv > 0)
  .sort((a, b) => b.ga4Conv - a.ga4Conv)
  .slice(0, 10);

// Section 7: pages where GBP attribution is meaningfully large (top GBP-attributed pages).
const section7Gbp = allRows
  .filter((r) => r.ga4GbpSessions > 0)
  .sort((a, b) => b.ga4GbpSessions - a.ga4GbpSessions)
  .slice(0, 25);

// ---------- 10. GBP vs GSC keyword compare ----------
// Pull top 20 from each side, then mark overlap (case-insensitive token match).
const topGscQueries = allGscQueryRows.slice(0, 20);
const topGbpKeywords = gbpKeywords.slice(0, 20);

function normKw(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}
const gscKwSet = new Set(topGscQueries.map((q) => normKw(q.query)));
const gbpKwSet = new Set(topGbpKeywords.map((q) => normKw(q.keyword)));
const compareRows = [];
const maxRows = Math.max(topGscQueries.length, topGbpKeywords.length);
for (let i = 0; i < maxRows; i++) {
  const g = topGscQueries[i] || null;
  const b = topGbpKeywords[i] || null;
  compareRows.push({
    rank: i + 1,
    gsc: g,
    gbp: b,
    gscInGbp: g ? gbpKwSet.has(normKw(g.query)) : false,
    gbpInGsc: b ? gscKwSet.has(normKw(b.keyword)) : false,
  });
}

// ---------- 11. Markdown rendering ----------
const lines = [];
const banner = noConversionsConfigured
  ? `> **No GA4 conversions recorded in the last 90 days.**\n> ${!convMetric ? "Property exposes neither 'conversions' nor 'keyEvents' — Data API conversion tracking unavailable. " : "Either no events are marked as conversions (or 'key events') in GA4 Admin, or those events have not fired in this window. "}Sections 3, 5, and 6 will be empty until conversion events are configured AND firing. Section 4 will list every page with traffic but no conversions.`
  : null;

lines.push(`# GSC <-> GA4 <-> GBP three-way attribution report`);
lines.push("");
lines.push(`*Generated: ${new Date().toISOString()}*  `);
lines.push(`*Window: ${WINDOW.startDate} -> ${WINDOW.endDate} (90 days, ending yesterday)*  `);
lines.push(`*GSC source: \`${GSC_PATH}\`*  `);
lines.push(`*GA4 property: \`${propertyId}\`*  `);
lines.push(`*Conversion metric: \`${convMetric || "(none)"}\`*  `);
if (gbpAccountName || gbpLocationName) {
  lines.push(`*GBP: \`${gbpAccountName || "(account?)"}\` / \`${gbpLocationName || "(location?)"}\`*  `);
}
lines.push("");
if (banner) {
  lines.push(banner);
  lines.push("");
}

// --- GBP overlay banner ---
lines.push("## GBP overlay");
lines.push("");
if (!gbpAvailable) {
  if (gbpQuotaExceeded) {
    lines.push("> **GBP attribution skipped — quota not yet granted (submit allowlist form).**");
    lines.push("> The Business Profile Performance API requires explicit allowlisting. Once Google approves the request the overlay will populate automatically on the next run.");
  } else {
    lines.push(`> **GBP overlay unavailable: ${gbpError || "unknown error"}**`);
    lines.push("> The GSC <-> GA4 join below is unaffected.");
  }
  lines.push("");
} else {
  if (gbpLocationMeta) {
    lines.push(`Location: **${gbpLocationMeta.title || gbpLocationName}**  `);
    if (gbpLocationMeta.websiteUri) lines.push(`Website: ${gbpLocationMeta.websiteUri}  `);
    if (gbpLocationMeta.storefrontAddress?.addressLines?.length) {
      lines.push(`Address: ${gbpLocationMeta.storefrontAddress.addressLines.join(", ")}  `);
    }
    lines.push("");
  }
  if (gbpTotals) {
    lines.push("### 90-day GBP performance totals");
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("| --- | --- |");
    const metricLabels = [
      ["website_clicks", "Website clicks"],
      ["call_clicks", "Call clicks"],
      ["direction_requests", "Direction requests"],
      ["conversations", "Messaging conversations"],
      ["bookings", "Bookings"],
      ["impressions_desktop_maps", "Impressions — desktop Maps"],
      ["impressions_desktop_search", "Impressions — desktop Search"],
      ["impressions_mobile_maps", "Impressions — mobile Maps"],
      ["impressions_mobile_search", "Impressions — mobile Search"],
    ];
    for (const [k, label] of metricLabels) {
      const v = gbpTotals[k];
      lines.push(`| ${label} | ${v == null ? "—" : fmt(v)} |`);
    }
    lines.push("");
  }
}

lines.push(`Pages joined: **${joined.length}** total — `
  + `GSC only: ${joined.filter((j) => j.gsc && !j.ga4).length}, `
  + `GA4 only: ${joined.filter((j) => !j.gsc && j.ga4).length}, `
  + `both: ${joined.filter((j) => j.gsc && j.ga4).length}.`);
lines.push("");

// --- GSC vs GBP keyword side-by-side ---
lines.push("## GSC top queries vs GBP top keywords (90 day window)");
lines.push("");
if (!gbpAvailable || gbpKeywords.length === 0) {
  if (!gbpAvailable) {
    lines.push("_GBP keyword list unavailable (see GBP overlay banner above)._");
  } else {
    lines.push("_GBP returned no search keywords for this window._");
  }
} else if (topGscQueries.length === 0) {
  lines.push("_No site-wide GSC queries available — was `GSC_SITE_URL` set?_");
} else {
  lines.push("Side-by-side ranking of the 20 highest-impression queries from each surface. **(*)** marks queries present in both lists, hinting at terms that drive both classic organic and local-pack visibility.");
  lines.push("");
  lines.push("| # | GSC query | GSC impr | GSC clicks | GSC pos | GBP keyword | GBP impr |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const r of compareRows) {
    const gQ = r.gsc ? `\`${r.gsc.query}\`${r.gscInGbp ? " (*)" : ""}` : "—";
    const gI = r.gsc ? fmt(r.gsc.impressions) : "—";
    const gC = r.gsc ? fmt(r.gsc.clicks) : "—";
    const gP = r.gsc ? fmt(r.gsc.position, 1) : "—";
    const bK = r.gbp ? `\`${r.gbp.keyword}\`${r.gbp.thresholded ? " *(thresh)*" : ""}${r.gbpInGsc ? " (*)" : ""}` : "—";
    const bI = r.gbp ? fmt(r.gbp.impressions) : "—";
    lines.push(`| ${r.rank} | ${gQ} | ${gI} | ${gC} | ${gP} | ${bK} | ${bI} |`);
  }
  lines.push("");
  lines.push("_GBP *(thresh)* means Google returned the impression count as a threshold (low-volume / privacy floor), not an exact value._");
}
lines.push("");

function renderJoinedTable(rows, opts = {}) {
  // Default: include GBP-attributed sessions column.
  const includeGbpCol = opts.includeGbpCol !== false;
  const headers = ["Page", "GSC impr", "GSC clicks", "GSC pos", "GA4 sessions", "GA4 conv", "Conv rate"];
  if (includeGbpCol) headers.push("GBP-attr sessions");
  if (opts.extraColumn) headers.push(opts.extraColumn.header);
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const r of rows) {
    const row = [
      `\`${r.path}\``,
      fmt(r.gscImpr),
      fmt(r.gscClicks),
      r.gscPos != null ? fmt(r.gscPos, 1) : "—",
      fmt(r.ga4Sessions),
      fmt(r.ga4Conv),
      r.ga4ConvRate != null ? fmtPct(r.ga4ConvRate) : "—",
    ];
    if (includeGbpCol) row.push(fmt(r.ga4GbpSessions));
    if (opts.extraColumn) row.push(opts.extraColumn.value(r));
    lines.push(`| ${row.join(" | ")} |`);
  }
}

// Section 1
lines.push("## Section 1 — Top 50 pages by GSC impressions (joined with GA4)");
lines.push("");
lines.push("The pages search engines show the most. The GA4 columns reveal whether that visibility is producing commercial outcomes. The `GBP-attr sessions` column counts GA4 sessions whose source/medium hint at Maps / local-pack traffic.");
lines.push("");
if (section1.length === 0) {
  lines.push("_No GSC impressions in the export — is `gsc-pages-90d.json` empty?_");
} else {
  renderJoinedTable(section1);
}
lines.push("");

// Section 2
lines.push("## Section 2 — Striking-distance pages (GSC pos 5–25)");
lines.push("");
lines.push("Highest-leverage SEO work: a small position shift here ripples directly into clicks and (where conversion tracking works) leads. Filtered to pages with >= 50 impressions to suppress noise.");
lines.push("");
if (section2.length === 0) {
  lines.push("_No pages in the position 5–25 band with >= 50 impressions._");
} else {
  renderJoinedTable(section2);
}
lines.push("");

// Section 3
lines.push("## Section 3 — Conversions per impression leaderboard");
lines.push("");
lines.push("Pages where every GSC impression is most likely to end in a GA4 conversion event. Highest SEO investment ROI per impression.");
lines.push("");
if (noConversionsConfigured || section3.length === 0) {
  lines.push("_Empty — no pages have both GSC impressions and GA4 conversions in this window._");
} else {
  renderJoinedTable(section3, {
    extraColumn: {
      header: "Conv / impr",
      value: (r) => (r.convPerImpr * 1000).toFixed(2) + " per 1k",
    },
  });
}
lines.push("");

// Section 4
lines.push("## Section 4 — SEO without commerce (high impressions, zero conversions)");
lines.push("");
lines.push("Pages that rank but don't convert. Investigation checklist:");
lines.push("");
lines.push("- Is the page's search intent matched but the on-page CTA broken?");
lines.push("- Is the page ranking for vanity queries that wouldn't convert even if intent were right?");
lines.push("- Is GA4 conversion tracking firing on the page at all (check Realtime / DebugView)?");
lines.push("- Has a conversion event been MARKED as a conversion / key event in GA4 Admin?");
lines.push("");
lines.push(`Filtered to pages with >= 200 GSC impressions in the 90-day window.`);
lines.push("");
if (section4.length === 0) {
  lines.push("_No pages match — either every high-impression page converts at least once, or there's no GSC traffic at all._");
} else {
  renderJoinedTable(section4, {
    extraColumn: {
      header: "Top GSC query",
      value: (r) => r.topQueries[0] ? `\`${r.topQueries[0].query}\` (impr ${r.topQueries[0].impressions})` : "—",
    },
  });
}
lines.push("");

// Section 5
lines.push("## Section 5 — Commerce without SEO (converts well, low search visibility)");
lines.push("");
lines.push("These pages already convert — but Google barely shows them. Best SEO-investment candidates: get the page in front of more searchers and the conversion math will follow.");
lines.push("");
lines.push("Filtered to pages with >= 1 GA4 conversion and < 100 GSC impressions in the 90-day window.");
lines.push("");
if (noConversionsConfigured || section5.length === 0) {
  lines.push("_Empty — no pages convert without already getting search impressions._");
} else {
  renderJoinedTable(section5, {
    extraColumn: {
      header: "Primary events",
      value: (r) => r.primaryEvents.length ? r.primaryEvents.map((e) => `${e.event} (${e.count})`).join(", ") : "—",
    },
  });
}
lines.push("");

// Section 6
lines.push("## Section 6 — Top 10 conversion-driving pages");
lines.push("");
lines.push("The pages that produce the leads. Use this as the prioritisation backbone — every SEO/content/UX decision should preserve or amplify these.");
lines.push("");
if (noConversionsConfigured || section6.length === 0) {
  lines.push("_Empty — no GA4 conversions recorded in this window._");
} else {
  renderJoinedTable(section6, {
    extraColumn: {
      header: "Primary events",
      value: (r) => r.primaryEvents.length ? r.primaryEvents.map((e) => `${e.event} (${e.count})`).join(", ") : "—",
    },
  });
}
lines.push("");

// Section 7 — GBP-attributed page leaderboard
lines.push("## Section 7 — Top GBP-attributed landing pages");
lines.push("");
lines.push("Pages whose GA4 traffic looks like it arrived from the local pack / Maps. Classified by `sessionSource ~ /(maps|business|gmb)/i` OR `sessionMedium ~ /(local|maps|gmb)/i`. This is a proxy for GBP attribution — the Performance API itself is location-level only.");
lines.push("");
if (section7Gbp.length === 0) {
  lines.push("_No GA4 sessions matched the GBP source/medium heuristic in this window._");
} else {
  renderJoinedTable(section7Gbp);
}
lines.push("");

// Methodology footer
lines.push("---");
lines.push("");
lines.push("### Methodology");
lines.push("");
lines.push("- GSC data: `frontend/seo/data/gsc/gsc-pages-90d.json`, dimensions=[page] (plus a secondary [page,query] pull for the 'top GSC query' column and a [query] pull for the GBP comparison).");
lines.push(`- GA4 data: live Data API call against property ${propertyId}, landing-page dimension, ${WINDOW.startDate} -> ${WINDOW.endDate}.`);
lines.push("- GA4 channel attribution: a second Data API call with dimensions [landingPagePlusQueryString, sessionDefaultChannelGroup, sessionSource, sessionMedium] — rows classified as 'Organic Search' (GSC-attributed) or matching `/(maps|business|gmb)/i` on source / `/(local|maps|gmb)/i` on medium (GBP-attributed).");
lines.push(`- GBP data: Business Profile Performance API via \`frontend/seo/gbp-query.mjs\`. The API is **location-level only** — there is no per-URL breakdown, so per-URL GBP attribution is necessarily a proxy from GA4 session source/medium.`);
lines.push(`- Conversion metric: \`${convMetric || "(unavailable)"}\` (GA4 mid-2025 renamed 'conversions' to 'keyEvents' — the script auto-detects which the property exposes).`);
lines.push("- Join key: URL pathname (host/protocol/query/trailing-slash/case all stripped).");
lines.push("- Full-outer-join semantics: pages present on only one side are still reported (section 4 catches GSC-only, section 5 catches GA4-only).");
lines.push("- GBP quota: requires explicit Google allowlisting. If quota is not yet granted the GBP overlay is skipped and the rest of the report is unaffected.");
lines.push("");

// ---------- 12. Write outputs ----------
const jsonDir = DIRS.gbpAttribution;
const mdDir = DIRS.gbpReports;
ensureDir(jsonDir);
ensureDir(mdDir);

const jsonOut = path.join(jsonDir, `gsc-ga4-gbp-${REPORT_DATE}.json`);
const mdOut = path.join(mdDir, `gsc-ga4-gbp-attribution-${REPORT_DATE}.md`);

// Serialise channel map for JSON output (Maps don't survive JSON.stringify).
const channelByPathSerialised = {};
for (const [p, e] of ga4ChannelByPath) {
  channelByPathSerialised[p] = {
    organic: e.organic,
    gbp: e.gbp,
    total: e.total,
    channels: Object.fromEntries(e.channels),
    sources: Object.fromEntries(e.sources),
  };
}

const jsonPayload = {
  generated_at: new Date().toISOString(),
  window: WINDOW,
  property_id: propertyId,
  gsc_source: GSC_PATH,
  conversion_metric: convMetric,
  conversion_rate_metric: convRateMetric,
  no_conversions_configured: noConversionsConfigured,
  gbp: {
    available: gbpAvailable,
    quota_exceeded: gbpQuotaExceeded,
    error: gbpError,
    support_case: null, // set to your Google support case ID after submitting the allowlist form
    account_name: gbpAccountName,
    location_name: gbpLocationName,
    location_meta: gbpLocationMeta,
    totals: gbpTotals,
    keywords: gbpKeywords,
  },
  attribution_heuristic: {
    organic_channel_group: "Organic Search",
    gbp_source_regex: GBP_SOURCE_RE.toString(),
    gbp_medium_regex: GBP_MEDIUM_RE.toString(),
  },
  totals: {
    pages_joined: joined.length,
    gsc_only: joined.filter((j) => j.gsc && !j.ga4).length,
    ga4_only: joined.filter((j) => !j.gsc && j.ga4).length,
    both: joined.filter((j) => j.gsc && j.ga4).length,
    total_gsc_impressions: joined.reduce((s, j) => s + (j.gsc?.impressions || 0), 0),
    total_gsc_clicks: joined.reduce((s, j) => s + (j.gsc?.clicks || 0), 0),
    total_ga4_sessions: joined.reduce((s, j) => s + (j.ga4?.sessions || 0), 0),
    total_ga4_conversions: totalConversions,
    total_ga4_organic_sessions: [...ga4ChannelByPath.values()].reduce((s, e) => s + e.organic, 0),
    total_ga4_gbp_attributed_sessions: [...ga4ChannelByPath.values()].reduce((s, e) => s + e.gbp, 0),
  },
  sections: {
    top_by_impressions: section1,
    striking_distance: section2,
    conversions_per_impression: section3,
    seo_without_commerce: section4,
    commerce_without_seo: section5,
    top_conversion_drivers: section6,
    top_gbp_attributed: section7Gbp,
  },
  gsc_vs_gbp_keywords: {
    top_gsc_queries: topGscQueries,
    top_gbp_keywords: topGbpKeywords,
    compare_rows: compareRows,
  },
  channel_by_path: channelByPathSerialised,
  joined_rows: allRows,
};

fs.writeFileSync(jsonOut, JSON.stringify(jsonPayload, null, 2));
fs.writeFileSync(mdOut, lines.join("\n"));

console.log("");
console.log("=== GSC <-> GA4 <-> GBP THREE-WAY ATTRIBUTION ===");
console.log(`Window:            ${WINDOW.startDate} -> ${WINDOW.endDate}`);
console.log(`Pages joined:      ${joined.length}  (gsc-only ${joined.filter((j) => j.gsc && !j.ga4).length}, ga4-only ${joined.filter((j) => !j.gsc && j.ga4).length}, both ${joined.filter((j) => j.gsc && j.ga4).length})`);
console.log(`Conversion metric: ${convMetric || "(unavailable)"}`);
console.log(`Total conversions: ${totalConversions}${noConversionsConfigured ? "  (no_conversions_configured — see banner in report)" : ""}`);
if (gbpAvailable) {
  console.log(`GBP overlay:       ON  (location ${gbpLocationName})`);
  if (gbpTotals?.website_clicks != null) console.log(`GBP website clicks (90d): ${gbpTotals.website_clicks}`);
  console.log(`GBP top keywords:  ${gbpKeywords.length}`);
} else if (gbpQuotaExceeded) {
  console.log(`GBP overlay:       SKIPPED — QUOTA NOT YET GRANTED (submit allowlist form)`);
} else {
  console.log(`GBP overlay:       SKIPPED — ${gbpError || "unknown"}`);
}
console.log("");
console.log(`JSON written:      ${jsonOut}`);
console.log(`Markdown written:  ${mdOut}`);
