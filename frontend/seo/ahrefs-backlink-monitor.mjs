// Weekly backlink monitor. Reads TARGET from ahrefs-config.mjs.
//
// Fetches current referring domains, compares against the previous
// snapshot, and writes a markdown report of new / lost referring domains
// plus a JSON data file for the next comparison.
//
// Usage:
//   node frontend/seo/ahrefs-backlink-monitor.mjs
//
// Schedule weekly. Idempotent: running twice in the same day creates a
// second snapshot but doesn't break the comparison.

import fs from "node:fs";
import path from "node:path";
import { ahrefs, unitsConsumedThisProcess } from "./ahrefs-query.mjs";
import { TARGET, OUTPUT_DIR } from "./ahrefs-config.mjs";

const DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const SNAPSHOT_DIR = path.join(OUTPUT_DIR, "refdomain-snapshots");
const REPORT_DIR = path.join(OUTPUT_DIR, "reports");

fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
fs.mkdirSync(REPORT_DIR, { recursive: true });

console.log(`[backlink-monitor] Target: ${TARGET}`);
console.log(`[backlink-monitor] Date: ${DATE}`);

// Fetch referring domains (paginate up to 1,000 — top by DR).
async function fetchAllRefdomains(target) {
  const all = [];
  const PAGE = 200;
  let offset = 0;
  for (let i = 0; i < 5; i++) {
    const result = await ahrefs.refdomains(target, { limit: PAGE, offset });
    const rows = result?.refdomains ?? result?.data ?? result?.results ?? [];
    if (!rows.length) break;
    all.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

console.log("[backlink-monitor] Fetching current refdomains...");
const current = await fetchAllRefdomains(TARGET);
console.log(`[backlink-monitor] Found ${current.length} refdomains.`);

// Save snapshot
const snapshotFile = path.join(SNAPSHOT_DIR, `refdomains-${DATE}.json`);
fs.writeFileSync(snapshotFile, JSON.stringify({ date: DATE, target: TARGET, count: current.length, refdomains: current }, null, 2));
console.log(`[backlink-monitor] Snapshot saved: ${snapshotFile}`);

// Find previous snapshot (most recent before today)
const snapshots = fs
  .readdirSync(SNAPSHOT_DIR)
  .filter((f) => f.startsWith("refdomains-") && f.endsWith(".json") && !f.endsWith(`${DATE}.json`))
  .sort();

if (snapshots.length === 0) {
  console.log("[backlink-monitor] No previous snapshot — baseline saved. Re-run next week for delta report.");
  console.log(`[backlink-monitor] Units consumed: ${JSON.stringify(unitsConsumedThisProcess())}`);
  process.exit(0);
}

const prevFile = snapshots[snapshots.length - 1];
const prevData = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, prevFile), "utf8"));
const prevDate = prevData.date;
const previous = prevData.refdomains;

console.log(`[backlink-monitor] Comparing against: ${prevFile} (${previous.length} refdomains, ${prevDate})`);

// Diff by domain key
const prevByDomain = new Map(previous.map((r) => [r.domain, r]));
const currByDomain = new Map(current.map((r) => [r.domain, r]));

const newDomains = current.filter((r) => !prevByDomain.has(r.domain));
const lostDomains = previous.filter((r) => !currByDomain.has(r.domain));

// Sort highest-DR first for actionable reading
const byDR = (a, b) => (b.domain_rating ?? 0) - (a.domain_rating ?? 0);
newDomains.sort(byDR);
lostDomains.sort(byDR);

// Build markdown report
const lines = [];
lines.push(`# Backlink Delta Report — ${TARGET}`);
lines.push("");
lines.push(`**Comparison**: ${prevDate} → ${DATE}`);
lines.push("");
lines.push(`- Previous refdomain count: **${previous.length}**`);
lines.push(`- Current refdomain count: **${current.length}**`);
lines.push(`- Net change: **${current.length - previous.length >= 0 ? "+" : ""}${current.length - previous.length}**`);
lines.push(`- New domains: **${newDomains.length}**`);
lines.push(`- Lost domains: **${lostDomains.length}**`);
lines.push("");

if (newDomains.length > 0) {
  lines.push("## NEW referring domains (sorted by DR)");
  lines.push("");
  lines.push("| Domain | DR | Links to target | Dofollow links | First seen |");
  lines.push("|---|---:|---:|---:|---|");
  for (const d of newDomains.slice(0, 50)) {
    lines.push(
      `| \`${d.domain}\` | ${d.domain_rating ?? "-"} | ${d.links_to_target ?? "-"} | ${d.dofollow_links ?? "-"} | ${d.first_seen ?? "-"} |`,
    );
  }
  if (newDomains.length > 50) {
    lines.push("");
    lines.push(`_(${newDomains.length - 50} more new domains in JSON snapshot)_`);
  }
  lines.push("");
}

if (lostDomains.length > 0) {
  lines.push("## LOST referring domains (sorted by DR)");
  lines.push("");
  lines.push("| Domain | DR | Links to target | Last seen |");
  lines.push("|---|---:|---:|---|");
  for (const d of lostDomains.slice(0, 50)) {
    lines.push(
      `| \`${d.domain}\` | ${d.domain_rating ?? "-"} | ${d.links_to_target ?? "-"} | ${d.last_seen ?? "-"} |`,
    );
  }
  if (lostDomains.length > 50) {
    lines.push("");
    lines.push(`_(${lostDomains.length - 50} more lost domains in JSON snapshot)_`);
  }
  lines.push("");
}

if (newDomains.length === 0 && lostDomains.length === 0) {
  lines.push("## No changes detected in referring domain set");
  lines.push("");
  lines.push("Either Ahrefs hasn't recrawled in the period, or the link landscape is genuinely stable.");
  lines.push("");
}

lines.push(`---`);
lines.push("");
lines.push(`Units consumed this run: ${JSON.stringify(unitsConsumedThisProcess())}`);
lines.push("");

const reportFile = path.join(REPORT_DIR, `backlink-delta-${prevDate}-to-${DATE}.md`);
fs.writeFileSync(reportFile, lines.join("\n"));

console.log(`[backlink-monitor] Report saved: ${reportFile}`);
console.log(`[backlink-monitor] Summary: +${newDomains.length} new / -${lostDomains.length} lost`);
console.log(`[backlink-monitor] Units consumed: ${JSON.stringify(unitsConsumedThisProcess())}`);
