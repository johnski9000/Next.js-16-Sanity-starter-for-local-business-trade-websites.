// Position tracker for priority keywords.
//
// For each keyword in ahrefs-config.mjs PRIORITY_KEYWORDS, fetches the
// SERP for the configured location, finds the target domain's position
// (if any), and compares to the previous snapshot. Outputs a position-
// changes report.
//
// Usage:
//   node frontend/seo/ahrefs-position-tracker.mjs
//
// Run weekly or bi-weekly. API budget: ~1,000-2,500 units per run
// depending on keyword count (each SERP overview costs ~30-60 units).

import fs from "node:fs";
import path from "node:path";
import { ahrefs, unitsConsumedThisProcess } from "./ahrefs-query.mjs";
import { TARGET, PRIORITY_KEYWORDS, OUTPUT_DIR } from "./ahrefs-config.mjs";

const DATE = new Date().toISOString().slice(0, 10);
const SNAPSHOT_DIR = path.join(OUTPUT_DIR, "position-snapshots");
const REPORT_DIR = path.join(OUTPUT_DIR, "reports");

fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
fs.mkdirSync(REPORT_DIR, { recursive: true });

console.log(`[position-tracker] Target: ${TARGET}`);
console.log(`[position-tracker] Tracking ${PRIORITY_KEYWORDS.length} keywords...`);

// Normalise target domain for SERP URL matching
const targetDomainRoot = TARGET.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");

const positions = [];
for (const { keyword, location } of PRIORITY_KEYWORDS) {
  try {
    const serp = await ahrefs.serpOverview(keyword, {
      country: "gb",
      location,
      limit: 50,
    });
    // Ahrefs v3 typically returns { urls: [...] } for SERP overview; fall
    // back across common shapes in case the schema drifts.
    const results = serp?.urls ?? serp?.serp ?? serp?.results ?? serp?.data ?? [];
    const ourResult = results.find((r) => {
      const url = (r.url ?? "").replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
      return url.includes(targetDomainRoot);
    });
    positions.push({
      keyword,
      location,
      our_position: ourResult?.position ?? null,
      our_url: ourResult?.url ?? null,
      top_competitor: results[0]
        ? {
            position: results[0].position,
            url: results[0].url,
          }
        : null,
      total_results: results.length,
    });
    console.log(
      `[position-tracker] "${keyword}" (${location}): ${ourResult ? `pos ${ourResult.position}` : "not in top 50"}`,
    );
  } catch (e) {
    console.error(`[position-tracker] FAILED for "${keyword}": ${e.message}`);
    positions.push({ keyword, location, error: e.message });
  }
}

// Save snapshot
const snapshotFile = path.join(SNAPSHOT_DIR, `positions-${DATE}.json`);
fs.writeFileSync(snapshotFile, JSON.stringify({ date: DATE, target: TARGET, positions }, null, 2));
console.log(`[position-tracker] Snapshot saved: ${snapshotFile}`);

// Find previous snapshot
const snapshots = fs
  .readdirSync(SNAPSHOT_DIR)
  .filter((f) => f.startsWith("positions-") && f.endsWith(".json") && !f.endsWith(`${DATE}.json`))
  .sort();

if (snapshots.length === 0) {
  console.log("[position-tracker] No previous snapshot — baseline saved. Re-run next week for delta.");
  console.log(`[position-tracker] Units consumed: ${JSON.stringify(unitsConsumedThisProcess())}`);
  process.exit(0);
}

const prevFile = snapshots[snapshots.length - 1];
const prevData = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, prevFile), "utf8"));
const prevDate = prevData.date;
const prevByKw = new Map(prevData.positions.map((p) => [`${p.keyword}::${p.location ?? ""}`, p]));

// Build movement report
const movements = positions.map((curr) => {
  const key = `${curr.keyword}::${curr.location ?? ""}`;
  const prev = prevByKw.get(key);
  const prevPos = prev?.our_position ?? null;
  const currPos = curr.our_position ?? null;
  let delta = null;
  if (prevPos != null && currPos != null) delta = prevPos - currPos; // positive = improved (moved up)
  let movement = "unchanged";
  if (prevPos == null && currPos != null) movement = "new";
  else if (prevPos != null && currPos == null) movement = "lost";
  else if (delta != null && delta >= 5) movement = "improved";
  else if (delta != null && delta <= -5) movement = "declined";
  else if (delta != null && delta !== 0) movement = "minor";
  return { ...curr, prev_position: prevPos, delta, movement };
});

// Sort: improvements first (biggest first), then declines (biggest first), then unchanged
const orderRank = { improved: 0, new: 1, minor: 2, unchanged: 3, declined: 4, lost: 5 };
movements.sort((a, b) => {
  if (orderRank[a.movement] !== orderRank[b.movement]) return orderRank[a.movement] - orderRank[b.movement];
  // Within improvements: biggest delta first
  return Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0);
});

const lines = [];
lines.push(`# Position Tracker — ${TARGET}`);
lines.push("");
lines.push(`**Comparison**: ${prevDate} → ${DATE}`);
lines.push(`**Keywords tracked**: ${movements.length}`);
lines.push("");

const summary = {
  improved: movements.filter((m) => m.movement === "improved").length,
  declined: movements.filter((m) => m.movement === "declined").length,
  new: movements.filter((m) => m.movement === "new").length,
  lost: movements.filter((m) => m.movement === "lost").length,
  unchanged: movements.filter((m) => m.movement === "unchanged" || m.movement === "minor").length,
};

lines.push(`- Improved (≥5 positions): **${summary.improved}**`);
lines.push(`- Declined (≥5 positions): **${summary.declined}**`);
lines.push(`- Newly ranking: **${summary.new}**`);
lines.push(`- Lost from top 50: **${summary.lost}**`);
lines.push(`- Unchanged or minor (±1-4): **${summary.unchanged}**`);
lines.push("");

lines.push("## Position changes");
lines.push("");
lines.push("| Movement | Keyword | Location | Prev | Curr | Δ | URL |");
lines.push("|---|---|---|---:|---:|---:|---|");
for (const m of movements) {
  const movementIcon =
    {
      improved: "📈",
      declined: "📉",
      new: "🆕",
      lost: "❌",
      minor: "—",
      unchanged: "—",
    }[m.movement] ?? "—";
  // Strip the target domain from URLs — reads TARGET from ahrefs-config
  // (imported at top of file). Falls back to a generic regex if not yet resolved.
  const domainRegex = TARGET
    ? new RegExp(`^https?://(www\\.)?${TARGET.replace(/\./g, "\\.")}`)
    : /^https?:\/\/(www\.)?[^/]+/;
  const url = m.our_url ? m.our_url.replace(domainRegex, "") : "";
  lines.push(
    `| ${movementIcon} ${m.movement} | \`${m.keyword}\` | ${m.location ?? "UK"} | ${m.prev_position ?? "—"} | ${m.our_position ?? "—"} | ${m.delta != null ? (m.delta > 0 ? "+" + m.delta : m.delta) : "—"} | ${url} |`,
  );
}
lines.push("");

lines.push(`Units consumed this run: ${JSON.stringify(unitsConsumedThisProcess())}`);
lines.push("");

const reportFile = path.join(REPORT_DIR, `positions-${prevDate}-to-${DATE}.md`);
fs.writeFileSync(reportFile, lines.join("\n"));

console.log(`[position-tracker] Report saved: ${reportFile}`);
console.log(
  `[position-tracker] Summary: ${summary.improved} improved, ${summary.declined} declined, ${summary.new} new, ${summary.lost} lost`,
);
console.log(`[position-tracker] Units consumed: ${JSON.stringify(unitsConsumedThisProcess())}`);
