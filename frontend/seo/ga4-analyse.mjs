// Weekly GA4 analyser. Reads GA4_PROPERTY_ID from .env.
//
// Pulls a 90-day window of GA4 data (totals, top landing pages, conversion
// events, and per-event landing-page leaders), saves it as a dated snapshot,
// and writes a markdown report. If a previous snapshot exists the report is
// a delta-vs-previous; otherwise it's a baseline.
//
// Mirrors the GSC Phase 1 pattern (analyse-gsc-phase1.mjs) but for GA4, and
// the snapshot/delta pattern from ahrefs-backlink-monitor.mjs.
//
// Usage:
//   node frontend/seo/ga4-analyse.mjs
//
// Schedule weekly. Idempotent: re-running the same day overwrites that day's
// snapshot but the comparison logic always picks the most recent *older*
// snapshot.

import fs from "node:fs";
import path from "node:path";
import { ga4, unitsConsumedThisProcess } from "./ga4-query.mjs";
import { DIRS } from "./seo-paths.mjs";

// ─── Config ─────────────────────────────────────────────────────────────────
const DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const OUTPUT_DIR = DIRS.ga4;
const SNAPSHOT_DIR = path.join(OUTPUT_DIR, "snapshots");
const REPORT_DIR = path.join(OUTPUT_DIR, "reports");

// Fallback list mirrors CONVERSION_EVENTS in ga4-query.mjs in case that module
// doesn't export it (older versions). We prefer the runtime-imported one when
// available.
const FALLBACK_CONVERSION_EVENTS = ["form_submit", "mail_click", "phone_click", "purchase"];

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
  console.log(`[ga4-analyse] ${msg}`);
}

function logError(stage, err) {
  console.error(`[ga4-analyse] ERROR at ${stage}: ${err?.message || err}`);
  if (err?.stack) console.error(err.stack);
}

// ─── Resolve the configured conversion-event list ───────────────────────────
// Prefer whatever ga4-query.mjs exports (single source of truth). Fall back to
// the hard-coded list if not present.
let CONVERSION_EVENTS;
try {
  const mod = await import("./ga4-query.mjs");
  CONVERSION_EVENTS = Array.isArray(mod.CONVERSION_EVENTS) && mod.CONVERSION_EVENTS.length
    ? mod.CONVERSION_EVENTS
    : FALLBACK_CONVERSION_EVENTS;
} catch {
  CONVERSION_EVENTS = FALLBACK_CONVERSION_EVENTS;
}
logStep(`Conversion events to drill into: ${CONVERSION_EVENTS.join(", ")}`);

// 90-day window ending yesterday — pinned upfront so every API call below
// uses the same window as the snapshot metadata.
const today = new Date();
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
const ninetyAgo = new Date(yesterday.getTime() - 89 * 24 * 60 * 60 * 1000);
const windowEnd = yesterday.toISOString().slice(0, 10);
const windowStart = ninetyAgo.toISOString().slice(0, 10);

// ─── 1. Pull data in sequence ───────────────────────────────────────────────
let summary;
try {
  logStep(`Fetching dateRangeSummary({ ${windowStart} → ${windowEnd} })...`);
  summary = await ga4.dateRangeSummary({ startDate: windowStart, endDate: windowEnd });
  logStep(`  sessions=${summary?.sessions ?? "?"} users=${summary?.totalUsers ?? "?"} conv=${summary?.conversions ?? "?"}`);
} catch (err) {
  logError("dateRangeSummary", err);
  process.exit(1);
}

let topLandingPages;
try {
  logStep("Fetching topLandingPages({ limit: 200 })...");
  const res = await ga4.topLandingPages({ startDate: windowStart, endDate: windowEnd, limit: 200 });
  topLandingPages = Array.isArray(res) ? res : (res?.rows ?? res?.pages ?? []);
  logStep(`  ${topLandingPages.length} landing pages returned`);
} catch (err) {
  logError("topLandingPages", err);
  process.exit(1);
}

let conversionEvents;
try {
  logStep("Fetching conversionEvents({ limit: 30 })...");
  const res = await ga4.conversionEvents({ startDate: windowStart, endDate: windowEnd, limit: 30 });
  conversionEvents = Array.isArray(res) ? res : (res?.rows ?? res?.events ?? []);
  logStep(`  ${conversionEvents.length} conversion events returned`);
} catch (err) {
  logError("conversionEvents", err);
  process.exit(1);
}

const landingPagesByEvent = {};
for (const eventName of CONVERSION_EVENTS) {
  try {
    logStep(`Fetching landingPagesByEvent({ eventName: "${eventName}", limit: 50 })...`);
    const res = await ga4.landingPagesByEvent({ eventName, startDate: windowStart, endDate: windowEnd, limit: 50 });
    const rows = Array.isArray(res) ? res : (res?.rows ?? res?.pages ?? []);
    landingPagesByEvent[eventName] = rows;
    logStep(`  ${rows.length} landing pages returned for ${eventName}`);
  } catch (err) {
    logError(`landingPagesByEvent[${eventName}]`, err);
    landingPagesByEvent[eventName] = [];
  }
}

// ─── 2. Save raw snapshot ───────────────────────────────────────────────────
// Resolve property_id either from the ga4 module (if exposed) or fall back to
// env so the snapshot is self-describing.
let propertyId = null;
try {
  const mod = await import("./ga4-query.mjs");
  propertyId = mod.PROPERTY_ID || mod.propertyId || mod.ga4?.propertyId || null;
} catch {}
if (!propertyId) propertyId = process.env.GA4_PROPERTY_ID || null;

const snapshot = {
  date: DATE,
  property_id: propertyId,
  window: { start: windowStart, end: windowEnd, days: 90 },
  conversion_events_tracked: CONVERSION_EVENTS,
  summary,
  topLandingPages,
  conversionEvents,
  landingPagesByEvent,
  generated_at: new Date().toISOString(),
};

const snapshotFile = path.join(SNAPSHOT_DIR, `ga4-${DATE}.json`);
fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
logStep(`Snapshot saved: ${snapshotFile}`);

// ─── 3. Locate previous snapshot (most recent before today) ─────────────────
const snapshots = fs
  .readdirSync(SNAPSHOT_DIR)
  .filter((f) => f.startsWith("ga4-") && f.endsWith(".json") && !f.endsWith(`${DATE}.json`))
  .sort();

let previous = null;
let prevDate = null;
if (snapshots.length > 0) {
  const prevFile = snapshots[snapshots.length - 1];
  try {
    previous = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, prevFile), "utf8"));
    prevDate = previous.date || prevFile.replace(/^ga4-|\.json$/g, "");
    logStep(`Comparing against previous snapshot: ${prevFile}`);
  } catch (err) {
    logError(`reading previous snapshot ${prevFile}`, err);
    previous = null;
  }
}

// ─── 4. Render markdown report ──────────────────────────────────────────────
const lines = [];

// ── Header
lines.push(`# GA4 90-Day Report — ${DATE}`);
lines.push("");
lines.push(`- **Property ID**: \`${propertyId || "(unknown)"}\``);
lines.push(`- **Window**: ${windowStart} → ${windowEnd} (90 days)`);
if (previous) {
  lines.push(`- **Previous snapshot**: ${prevDate}`);
}
lines.push("");

// ── Top-line metrics
lines.push("## Top-line metrics");
lines.push("");
const summaryMetrics = [
  ["Sessions",          "sessions"],
  ["Total users",       "totalUsers"],
  ["Engaged sessions",  "engagedSessions"],
  ["Conversions",       "conversions"],
  ["Event count",       "eventCount"],
  ["Screen page views", "screenPageViews"],
];
if (previous) {
  lines.push("| Metric | This snapshot | Previous | Δ |");
  lines.push("|---|---:|---:|---:|");
  for (const [label, key] of summaryMetrics) {
    const curr = Number(summary?.[key] ?? 0);
    const prev = Number(previous.summary?.[key] ?? 0);
    lines.push(`| ${label} | ${fmt(curr)} | ${fmt(prev)} | ${pctChange(curr, prev)} |`);
  }
} else {
  lines.push("| Metric | Value |");
  lines.push("|---|---:|");
  for (const [label, key] of summaryMetrics) {
    const curr = Number(summary?.[key] ?? 0);
    lines.push(`| ${label} | ${fmt(curr)} |`);
  }
}
lines.push("");

// ── Top 30 landing pages
lines.push("## Top 30 landing pages");
lines.push("");
// Build a lookup of previous sessions per page for delta column.
const prevPageSessions = new Map();
if (previous && Array.isArray(previous.topLandingPages)) {
  for (const p of previous.topLandingPages) {
    const key = p.page ?? p.landingPage ?? p.path ?? p.landingPagePlusQueryString;
    if (key != null) prevPageSessions.set(key, Number(p.sessions ?? 0));
  }
}

// Normalise the current landing-page rows so we can read them uniformly.
const normalisedLanding = topLandingPages.map((p) => {
  const page = p.page ?? p.landingPage ?? p.path ?? p.landingPagePlusQueryString ?? "(unknown)";
  const sessions = Number(p.sessions ?? 0);
  const conversions = Number(p.conversions ?? p.keyEvents ?? 0);
  return { page, sessions, conversions };
});

const top30Landing = normalisedLanding.slice(0, 30);
lines.push("| Rank | Page | Sessions | Conversions | Conv % | Δ vs prev |");
lines.push("|---:|---|---:|---:|---:|---:|");
top30Landing.forEach((row, i) => {
  const delta = previous ? pctChange(row.sessions, prevPageSessions.get(row.page) ?? 0) : "—";
  lines.push(`| ${i + 1} | \`${row.page}\` | ${fmt(row.sessions)} | ${fmt(row.conversions)} | ${pctOf(row.conversions, row.sessions)} | ${delta} |`);
});
lines.push("");

// ── Conversion events
lines.push("## Conversion events");
lines.push("");
const normalisedConvEvents = conversionEvents.map((e) => ({
  event: e.event ?? e.eventName ?? e.name ?? "(unknown)",
  count: Number(e.count ?? e.conversions ?? e.keyEvents ?? e.eventCount ?? 0),
}));
const totalConvCount = normalisedConvEvents.reduce((s, e) => s + e.count, 0);
if (normalisedConvEvents.length === 0) {
  lines.push("_No conversion events returned in window._");
} else {
  lines.push("| Event | Count | % of all conversions |");
  lines.push("|---|---:|---:|");
  for (const e of normalisedConvEvents) {
    lines.push(`| \`${e.event}\` | ${fmt(e.count)} | ${pctOf(e.count, totalConvCount)} |`);
  }
}
lines.push("");

// ── Per-event landing-page leaders
lines.push("## Per-event landing-page leaders");
lines.push("");
for (const eventName of CONVERSION_EVENTS) {
  const rows = landingPagesByEvent[eventName] || [];
  lines.push(`### \`${eventName}\` — top 10 landing pages`);
  lines.push("");
  if (rows.length === 0) {
    lines.push(`_No data for \`${eventName}\` in window._`);
    lines.push("");
    continue;
  }
  const normalised = rows.map((r) => ({
    page: r.page ?? r.landingPage ?? r.path ?? r.landingPagePlusQueryString ?? "(unknown)",
    count: Number(r.count ?? r.eventCount ?? r.conversions ?? r.keyEvents ?? 0),
    sessions: Number(r.sessions ?? 0),
  }));
  normalised.sort((a, b) => b.count - a.count);
  lines.push("| Rank | Page | Event count | Sessions |");
  lines.push("|---:|---|---:|---:|");
  normalised.slice(0, 10).forEach((row, i) => {
    lines.push(`| ${i + 1} | \`${row.page}\` | ${fmt(row.count)} | ${fmt(row.sessions)} |`);
  });
  lines.push("");
}

// ── Pages with HIGH SESSIONS but ZERO CONVERSIONS
lines.push("## Pages with HIGH SESSIONS but ZERO CONVERSIONS");
lines.push("");
lines.push("_Top-30-by-sessions pages that converted **0** times in the window — likely SEO success but CRO failure. Worth investigating: page intent mismatch, missing CTA, slow load, etc._");
lines.push("");
const seoCroFailures = top30Landing.filter((p) => p.sessions > 0 && p.conversions === 0);
if (seoCroFailures.length === 0) {
  lines.push("_None — every top-30 page converted at least once._");
} else {
  lines.push("| Page | Sessions | Conversions |");
  lines.push("|---|---:|---:|");
  for (const row of seoCroFailures) {
    lines.push(`| \`${row.page}\` | ${fmt(row.sessions)} | 0 |`);
  }
}
lines.push("");

// ── Pages with sessions UNDER 50 but conversions > 0
lines.push("## Pages with sessions UNDER 50 but conversions > 0");
lines.push("");
lines.push("_High-converting pages that don't get much traffic. Candidates for SEO investment — links, content expansion, internal-linking, schema upgrades._");
lines.push("");
const seoInvestmentCandidates = normalisedLanding
  .filter((p) => p.sessions > 0 && p.sessions < 50 && p.conversions > 0)
  .sort((a, b) => b.conversions - a.conversions || b.sessions - a.sessions);
if (seoInvestmentCandidates.length === 0) {
  lines.push("_None — no low-traffic page produced a conversion in the window._");
} else {
  lines.push("| Page | Sessions | Conversions | Conv % |");
  lines.push("|---|---:|---:|---:|");
  for (const row of seoInvestmentCandidates) {
    lines.push(`| \`${row.page}\` | ${fmt(row.sessions)} | ${fmt(row.conversions)} | ${pctOf(row.conversions, row.sessions)} |`);
  }
}
lines.push("");

// ── Footer
lines.push("---");
lines.push("");
lines.push(`API units consumed this run: \`${JSON.stringify(unitsConsumedThisProcess())}\``);
lines.push("");

// ─── 5. Write report ────────────────────────────────────────────────────────
const reportFile = previous
  ? path.join(REPORT_DIR, `ga4-delta-${prevDate}-to-${DATE}.md`)
  : path.join(REPORT_DIR, `ga4-baseline-${DATE}.md`);
fs.writeFileSync(reportFile, lines.join("\n"));
logStep(`Report saved: ${reportFile}`);

logStep(`Units consumed: ${JSON.stringify(unitsConsumedThisProcess())}`);
logStep(previous ? `Delta report (${prevDate} → ${DATE}) complete.` : `Baseline report complete. Re-run next week for delta.`);
