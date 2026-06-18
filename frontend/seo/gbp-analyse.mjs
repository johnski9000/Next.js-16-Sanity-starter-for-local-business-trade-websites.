// Weekly Google Business Profile (GBP) analyser.
//
// Pulls a 90-day window of GBP performance data (totals, daily timeseries
// for impressions/clicks/calls/directions/conversations/bookings, plus a
// 3-month search-keyword list), saves it as a dated snapshot, and writes a
// markdown report. If a previous snapshot exists the report is a
// delta-vs-previous; otherwise it's a baseline.
//
// Mirrors the GA4 weekly analyser pattern (ga4-analyse.mjs).
//
// Usage:
//   node frontend/seo/gbp-analyse.mjs
//
// Schedule weekly. Idempotent: re-running the same day overwrites that day's
// snapshot but the comparison logic always picks the most recent *older*
// snapshot.
//
// IMPORTANT: The GBP Performance API is still gated behind an allowlist for
// this account. Until
// the allowlist lands, calls will return 403 PERMISSION_DENIED /
// quotaExceeded — in that case we print a banner and exit 0 so the Monday
// runner can skip cleanly.

import fs from "node:fs";
import path from "node:path";
import { gbp, ACCOUNT_NAME, LOCATION_NAME, unitsConsumedThisProcess } from "./gbp-query.mjs";
import { DIRS } from "./seo-paths.mjs";

// ─── Config ─────────────────────────────────────────────────────────────────
const DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const OUTPUT_DIR = DIRS.gbp;
const SNAPSHOT_DIR = path.join(OUTPUT_DIR, "snapshots");
const REPORT_DIR = path.join(OUTPUT_DIR, "reports");

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

fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
fs.mkdirSync(REPORT_DIR, { recursive: true });

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n == null || Number.isNaN(Number(n)) ? "—" : Number(n).toLocaleString("en-GB"));

function pctChange(curr, prev) {
  if (prev == null || prev === 0) return curr > 0 ? "new" : "—";
  const delta = ((curr - prev) / prev) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

function pctOf(num, denom) {
  if (!denom) return "0.00%";
  return ((num / denom) * 100).toFixed(2) + "%";
}

function logStep(msg) {
  console.log(`[gbp-analyse] ${msg}`);
}

function logError(stage, err) {
  console.error(`[gbp-analyse] ERROR at ${stage}: ${err?.message || err}`);
  if (err?.stack) console.error(err.stack);
}

// Detect the well-known "GBP Performance API not yet allowlisted" error so we
// can degrade gracefully instead of crashing. Match on HTTP 403 + quota-ish
// signals in the error message.
function isQuotaNotGrantedError(err) {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  const hit403 = /\b403\b/.test(msg) || msg.includes("permission_denied") || msg.includes("permission denied");
  const quotaSignal =
    msg.includes("quota") ||
    msg.includes("quotaexceeded") ||
    msg.includes("rate_limit") ||
    msg.includes("ratelimit") ||
    msg.includes("not enabled") ||
    msg.includes("has not been used") ||
    msg.includes("performance api");
  return hit403 && quotaSignal;
}

function quotaBanner(stage, err) {
  console.log("");
  console.log("════════════════════════════════════════════════════════════════════");
  console.log(" GBP PERFORMANCE API — QUOTA NOT YET GRANTED");
  console.log("════════════════════════════════════════════════════════════════════");
  console.log(` Stage: ${stage}`);
  console.log(` Error: ${err?.message || err}`);
  console.log("");
  console.log(" Submit the GBP API allowlist form at https://support.google.com/business/contact/api_default");
  console.log(" approval in 7-10 business days). Skipping snapshot + report and");
  console.log(" exiting 0 so monday-runner.mjs can continue.");
  console.log("════════════════════════════════════════════════════════════════════");
  console.log("");
}

// Convert a number of impressions (or any positive integer) into a tiny
// sparkline. Uses Unicode block characters; falls back to '.' for zero.
const SPARK_CHARS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
function sparkline(values) {
  if (!values || values.length === 0) return "";
  const nums = values.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0));
  const max = Math.max(...nums);
  if (max <= 0) return ".".repeat(nums.length);
  return nums
    .map((n) => {
      if (n <= 0) return ".";
      const idx = Math.min(SPARK_CHARS.length - 1, Math.floor((n / max) * (SPARK_CHARS.length - 1)));
      return SPARK_CHARS[idx];
    })
    .join("");
}

// Extract a flat { date: value } map for one metric out of a timeseries
// response from gbp.dailyMetricsTimeSeries.
function extractDailySeries(timeseriesResponse, metricName) {
  const all = timeseriesResponse?.multiDailyMetricTimeSeries || [];
  // Each entry has shape { dailyMetricTimeSeries: { dailyMetric, timeSeries: { datedValues: [...] } } }
  const flat = [];
  for (const entry of all) {
    const inner = entry?.dailyMetricTimeSeries;
    // The API sometimes returns this as an array, sometimes as a single object.
    const candidates = Array.isArray(inner) ? inner : (inner ? [inner] : []);
    for (const c of candidates) {
      if (c?.dailyMetric === metricName) {
        const datedValues = c?.timeSeries?.datedValues || [];
        for (const dv of datedValues) {
          const d = dv?.date;
          if (!d) continue;
          const iso = `${String(d.year).padStart(4, "0")}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
          flat.push({ date: iso, value: Number(dv?.value ?? 0) });
        }
      }
    }
  }
  flat.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return flat;
}

// Compact timeseries for the snapshot: { METRIC: [{ date, value }, ...] }
function compactTimeseries(timeseriesResponse) {
  const out = {};
  for (const metric of DAILY_METRICS) {
    out[metric] = extractDailySeries(timeseriesResponse, metric);
  }
  return out;
}

// Render the keyword count or threshold range into a printable string.
function renderKeywordValue(insightsValue) {
  if (!insightsValue) return "—";
  if (insightsValue.value != null) return fmt(insightsValue.value);
  if (insightsValue.threshold != null) return `< ${fmt(insightsValue.threshold)}`;
  // Sometimes the API returns { value: "123" } as a string — already handled
  // by fmt() — or a range object. Be defensive.
  return "—";
}

// For ranking / concentration math we need a numeric value even when the API
// gave us a threshold. Use the threshold as an upper bound.
function numericKeywordValue(insightsValue) {
  if (!insightsValue) return 0;
  if (insightsValue.value != null) return Number(insightsValue.value) || 0;
  if (insightsValue.threshold != null) return Number(insightsValue.threshold) || 0;
  return 0;
}

// ─── 90-day window (pinned BEFORE any API call) ─────────────────────────────
const today = new Date();
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
const ninetyAgo = new Date(yesterday.getTime() - 89 * 24 * 60 * 60 * 1000);
const windowEnd = yesterday.toISOString().slice(0, 10);
const windowStart = ninetyAgo.toISOString().slice(0, 10);

logStep(`Account:  ${ACCOUNT_NAME}`);
logStep(`Location: ${LOCATION_NAME}`);
logStep(`Window:   ${windowStart} → ${windowEnd} (90 days)`);

// ─── 1. Pull data in sequence (gracefully degrade on quota errors) ──────────
let locationMetadata = null;
let totals = null;
let timeseriesRaw = null;
let searchKeywordsRaw = null;

try {
  logStep("Fetching gbp.getLocation(...)...");
  locationMetadata = await gbp.getLocation({
    readMask: "name,title,storefrontAddress,websiteUri,phoneNumbers,categories,serviceArea,labels,metadata",
  });
  logStep(`  title="${locationMetadata?.title ?? "(unknown)"}" website=${locationMetadata?.websiteUri ?? "(none)"}`);
} catch (err) {
  if (isQuotaNotGrantedError(err)) {
    quotaBanner("gbp.getLocation", err);
    process.exit(0);
  }
  logError("gbp.getLocation", err);
  process.exit(1);
}

try {
  logStep(`Fetching gbp.totalsForWindow({ ${windowStart} → ${windowEnd} })...`);
  totals = await gbp.totalsForWindow({ startDate: windowStart, endDate: windowEnd });
  const totalImpressions =
    (totals?.impressions_desktop_maps ?? 0) +
    (totals?.impressions_desktop_search ?? 0) +
    (totals?.impressions_mobile_maps ?? 0) +
    (totals?.impressions_mobile_search ?? 0);
  logStep(`  impressions=${totalImpressions} website_clicks=${totals?.website_clicks ?? 0} call_clicks=${totals?.call_clicks ?? 0}`);
} catch (err) {
  if (isQuotaNotGrantedError(err)) {
    quotaBanner("gbp.totalsForWindow", err);
    process.exit(0);
  }
  logError("gbp.totalsForWindow", err);
  process.exit(1);
}

try {
  logStep(`Fetching gbp.dailyMetricsTimeSeries({ ${DAILY_METRICS.length} metrics, ${windowStart} → ${windowEnd} })...`);
  timeseriesRaw = await gbp.dailyMetricsTimeSeries({
    metrics: DAILY_METRICS,
    startDate: windowStart,
    endDate: windowEnd,
  });
  logStep(`  raw timeseries entries=${timeseriesRaw?.multiDailyMetricTimeSeries?.length ?? 0}`);
} catch (err) {
  if (isQuotaNotGrantedError(err)) {
    quotaBanner("gbp.dailyMetricsTimeSeries", err);
    process.exit(0);
  }
  logError("gbp.dailyMetricsTimeSeries", err);
  process.exit(1);
}

try {
  logStep("Fetching gbp.searchKeywords({ monthsBack: 3 })...");
  searchKeywordsRaw = await gbp.searchKeywords({ monthsBack: 3 });
  logStep(`  keywords returned=${searchKeywordsRaw?.searchKeywordsCounts?.length ?? 0}`);
} catch (err) {
  if (isQuotaNotGrantedError(err)) {
    quotaBanner("gbp.searchKeywords", err);
    process.exit(0);
  }
  logError("gbp.searchKeywords", err);
  process.exit(1);
}

// ─── 2. Save raw snapshot ───────────────────────────────────────────────────
const timeseries = compactTimeseries(timeseriesRaw);

const snapshot = {
  date: DATE,
  account_name: ACCOUNT_NAME,
  location_name: LOCATION_NAME,
  location_metadata: locationMetadata,
  window: { start: windowStart, end: windowEnd, days: 90 },
  totals,
  timeseries,
  search_keywords: searchKeywordsRaw?.searchKeywordsCounts || [],
  generated_at: new Date().toISOString(),
};

const snapshotFile = path.join(SNAPSHOT_DIR, `gbp-${DATE}.json`);
fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
logStep(`Snapshot saved: ${snapshotFile}`);

// ─── 3. Locate previous snapshot (most recent before today) ─────────────────
const snapshots = fs
  .readdirSync(SNAPSHOT_DIR)
  .filter((f) => f.startsWith("gbp-") && f.endsWith(".json") && !f.endsWith(`${DATE}.json`))
  .sort();

let previous = null;
let prevDate = null;
if (snapshots.length > 0) {
  const prevFile = snapshots[snapshots.length - 1];
  try {
    previous = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, prevFile), "utf8"));
    prevDate = previous.date || prevFile.replace(/^gbp-|\.json$/g, "");
    logStep(`Comparing against previous snapshot: ${prevFile}`);
  } catch (err) {
    logError(`reading previous snapshot ${prevFile}`, err);
    previous = null;
  }
}

// ─── 4. Derived aggregates ──────────────────────────────────────────────────
function aggregateTotals(t) {
  if (!t) return null;
  const get = (k) => Number(t?.[k] ?? 0);
  const impressions_search = get("impressions_desktop_search") + get("impressions_mobile_search");
  const impressions_maps = get("impressions_desktop_maps") + get("impressions_mobile_maps");
  const impressions_mobile = get("impressions_mobile_search") + get("impressions_mobile_maps");
  const impressions_desktop = get("impressions_desktop_search") + get("impressions_desktop_maps");
  const total_impressions = impressions_search + impressions_maps;
  return {
    total_impressions,
    impressions_search,
    impressions_maps,
    impressions_mobile,
    impressions_desktop,
    website_clicks: get("website_clicks"),
    call_clicks: get("call_clicks"),
    direction_requests: get("direction_requests"),
    conversations: get("conversations"),
    bookings: get("bookings"),
  };
}

const aggCurr = aggregateTotals(totals);
const aggPrev = previous ? aggregateTotals(previous.totals) : null;

// ─── 5. Render markdown report ──────────────────────────────────────────────
const lines = [];

// ── Header
lines.push(`# GBP 90-Day Report — ${DATE}`);
lines.push("");
lines.push(`- **Account**: \`${ACCOUNT_NAME}\``);
lines.push(`- **Location**: \`${LOCATION_NAME}\``);
lines.push(`- **Business name**: ${locationMetadata?.title ?? "(unknown)"}`);
if (locationMetadata?.websiteUri) lines.push(`- **Website**: ${locationMetadata.websiteUri}`);
lines.push(`- **Window**: ${windowStart} → ${windowEnd} (90 days)`);
if (previous) {
  lines.push(`- **Previous snapshot**: ${prevDate}`);
}
lines.push("");

// ── Top-line metrics
lines.push("## Top-line metrics");
lines.push("");
const headlineMetrics = [
  ["Total impressions",   "total_impressions"],
  ["Website clicks",      "website_clicks"],
  ["Call clicks",         "call_clicks"],
  ["Direction requests",  "direction_requests"],
  ["Conversations",       "conversations"],
  ["Bookings",            "bookings"],
];
if (aggPrev) {
  lines.push("| Metric | This snapshot | Previous | Δ |");
  lines.push("|---|---:|---:|---:|");
  for (const [label, key] of headlineMetrics) {
    const curr = Number(aggCurr?.[key] ?? 0);
    const prev = Number(aggPrev?.[key] ?? 0);
    lines.push(`| ${label} | ${fmt(curr)} | ${fmt(prev)} | ${pctChange(curr, prev)} |`);
  }
} else {
  lines.push("| Metric | Value |");
  lines.push("|---|---:|");
  for (const [label, key] of headlineMetrics) {
    lines.push(`| ${label} | ${fmt(Number(aggCurr?.[key] ?? 0))} |`);
  }
}
lines.push("");

// ── Search vs Maps split
lines.push("## Search vs Maps — impression split");
lines.push("");
const totImpr = aggCurr?.total_impressions ?? 0;
if (aggPrev) {
  lines.push("| Surface | This snapshot | % share | Previous | Δ |");
  lines.push("|---|---:|---:|---:|---:|");
  lines.push(
    `| Search | ${fmt(aggCurr?.impressions_search ?? 0)} | ${pctOf(aggCurr?.impressions_search ?? 0, totImpr)} | ${fmt(aggPrev?.impressions_search ?? 0)} | ${pctChange(aggCurr?.impressions_search ?? 0, aggPrev?.impressions_search ?? 0)} |`,
  );
  lines.push(
    `| Maps | ${fmt(aggCurr?.impressions_maps ?? 0)} | ${pctOf(aggCurr?.impressions_maps ?? 0, totImpr)} | ${fmt(aggPrev?.impressions_maps ?? 0)} | ${pctChange(aggCurr?.impressions_maps ?? 0, aggPrev?.impressions_maps ?? 0)} |`,
  );
} else {
  lines.push("| Surface | Impressions | % share |");
  lines.push("|---|---:|---:|");
  lines.push(`| Search | ${fmt(aggCurr?.impressions_search ?? 0)} | ${pctOf(aggCurr?.impressions_search ?? 0, totImpr)} |`);
  lines.push(`| Maps | ${fmt(aggCurr?.impressions_maps ?? 0)} | ${pctOf(aggCurr?.impressions_maps ?? 0, totImpr)} |`);
}
lines.push("");

// ── Mobile vs Desktop split
lines.push("## Mobile vs Desktop — impression split");
lines.push("");
if (aggPrev) {
  lines.push("| Device | This snapshot | % share | Previous | Δ |");
  lines.push("|---|---:|---:|---:|---:|");
  lines.push(
    `| Mobile | ${fmt(aggCurr?.impressions_mobile ?? 0)} | ${pctOf(aggCurr?.impressions_mobile ?? 0, totImpr)} | ${fmt(aggPrev?.impressions_mobile ?? 0)} | ${pctChange(aggCurr?.impressions_mobile ?? 0, aggPrev?.impressions_mobile ?? 0)} |`,
  );
  lines.push(
    `| Desktop | ${fmt(aggCurr?.impressions_desktop ?? 0)} | ${pctOf(aggCurr?.impressions_desktop ?? 0, totImpr)} | ${fmt(aggPrev?.impressions_desktop ?? 0)} | ${pctChange(aggCurr?.impressions_desktop ?? 0, aggPrev?.impressions_desktop ?? 0)} |`,
  );
} else {
  lines.push("| Device | Impressions | % share |");
  lines.push("|---|---:|---:|");
  lines.push(`| Mobile | ${fmt(aggCurr?.impressions_mobile ?? 0)} | ${pctOf(aggCurr?.impressions_mobile ?? 0, totImpr)} |`);
  lines.push(`| Desktop | ${fmt(aggCurr?.impressions_desktop ?? 0)} | ${pctOf(aggCurr?.impressions_desktop ?? 0, totImpr)} |`);
}
lines.push("");

// ── Top 30 search keywords
lines.push("## Top 30 search keywords (last 3 months)");
lines.push("");
lines.push("_Low-volume keywords are returned by the GBP API as a threshold range (e.g. `< 5`) rather than an exact count._");
lines.push("");
const keywords = (searchKeywordsRaw?.searchKeywordsCounts || []).slice();
keywords.sort((a, b) => numericKeywordValue(b.insightsValue) - numericKeywordValue(a.insightsValue));
const top30Keywords = keywords.slice(0, 30);
if (top30Keywords.length === 0) {
  lines.push("_No search-keyword data returned for the window._");
} else {
  lines.push("| Rank | Keyword | Impressions (3-month) |");
  lines.push("|---:|---|---:|");
  top30Keywords.forEach((k, i) => {
    lines.push(`| ${i + 1} | \`${k.searchKeyword ?? "(unknown)"}\` | ${renderKeywordValue(k.insightsValue)} |`);
  });
}
lines.push("");

// ── Daily-trend sparklines
lines.push("## Daily trend — sparklines (90 days)");
lines.push("");
const websiteClicksSeries = timeseries["WEBSITE_CLICKS"] || [];
const callClicksSeries = timeseries["CALL_CLICKS"] || [];
lines.push("```");
lines.push(`website_clicks  ${sparkline(websiteClicksSeries.map((d) => d.value))}  total=${fmt(websiteClicksSeries.reduce((s, d) => s + Number(d.value || 0), 0))}`);
lines.push(`call_clicks     ${sparkline(callClicksSeries.map((d) => d.value))}  total=${fmt(callClicksSeries.reduce((s, d) => s + Number(d.value || 0), 0))}`);
lines.push("```");
lines.push("");

// ── Action items
lines.push("## Action items");
lines.push("");
const actions = [];

// Flag metrics that dropped >20% week-over-week vs previous snapshot.
if (aggPrev) {
  const watchKeys = [
    ["total_impressions", "Total impressions"],
    ["website_clicks", "Website clicks"],
    ["call_clicks", "Call clicks"],
    ["direction_requests", "Direction requests"],
    ["conversations", "Conversations"],
    ["bookings", "Bookings"],
  ];
  for (const [key, label] of watchKeys) {
    const curr = Number(aggCurr?.[key] ?? 0);
    const prev = Number(aggPrev?.[key] ?? 0);
    if (prev > 0) {
      const deltaPct = ((curr - prev) / prev) * 100;
      if (deltaPct <= -20) {
        actions.push(`- **${label} dropped ${deltaPct.toFixed(1)}%** (was ${fmt(prev)}, now ${fmt(curr)}). Investigate listing changes, review velocity, or category drift.`);
      }
    }
  }
} else {
  actions.push("- Baseline snapshot — re-run next week for week-over-week drop alerts.");
}

// Flag any single keyword driving >30% of impressions (concentration risk).
const numericKeywordTotal = keywords.reduce((s, k) => s + numericKeywordValue(k.insightsValue), 0);
if (numericKeywordTotal > 0) {
  for (const k of keywords) {
    const v = numericKeywordValue(k.insightsValue);
    if (v / numericKeywordTotal > 0.30) {
      const share = ((v / numericKeywordTotal) * 100).toFixed(1);
      actions.push(`- **Keyword concentration risk**: \`${k.searchKeyword}\` drives ${share}% of search-keyword impressions. Diversify ranking terms via additional service/area content.`);
    }
  }
}

if (actions.length === 0) {
  lines.push("_No action items flagged this week._");
} else {
  for (const a of actions) lines.push(a);
}
lines.push("");

// ── Footer
lines.push("---");
lines.push("");
lines.push(`API units consumed this run: \`${JSON.stringify(unitsConsumedThisProcess())}\``);
lines.push("");

// ─── 6. Write report ────────────────────────────────────────────────────────
const reportFile = previous
  ? path.join(REPORT_DIR, `gbp-delta-${DATE}.md`)
  : path.join(REPORT_DIR, `gbp-baseline-${DATE}.md`);
fs.writeFileSync(reportFile, lines.join("\n"));
logStep(`Report saved: ${reportFile}`);

logStep(`Units consumed: ${JSON.stringify(unitsConsumedThisProcess())}`);
logStep(previous ? `Delta report (${prevDate} → ${DATE}) complete.` : `Baseline report complete. Re-run next week for delta.`);
