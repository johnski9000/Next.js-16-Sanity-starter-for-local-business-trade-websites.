// Monday SEO runner. One command, runs the whole Monday stack in order,
// captures stdout/stderr/exit-code per step, and writes a unified digest
// to frontend/seo/data/monday-run-YYYY-MM-DD.md.
//
// Usage:
//   node frontend/seo/monday-runner.mjs
//   node frontend/seo/monday-runner.mjs --skip=ahrefs-smoke,gbp-analyse
//
// Step ids (for --skip):
//   gsc-query, sanity-content-snapshot, dataforseo-kd, gsc-analyse, gsc-analyse-phase2,
//   ahrefs-smoke, ahrefs-analyse, ga4-analyse, gbp-analyse, attribution,
//   autocomplete-research, xlsx-report
//
// Each step is launched as a child node process via spawnSync so a crash in
// one step never kills the runner. Steps are intentionally independent — none
// depends on the in-memory state of the previous, only on the files the
// previous step wrote to disk.
//
// Defensive behaviours:
//   - Missing script file => marked "skipped (missing)" not failed.
//   - GBP step that exits 0 with a quota-not-granted banner is flagged ⚠
//     ("blocked, not failed") instead of ✓.
//   - Single-step failures never abort the run.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { DIRS, DATA_DIR } from "./seo-paths.mjs";

// ─── ANSI ───────────────────────────────────────────────────────────────────
const useColor = process.stdout.isTTY === true;
const c = {
  green: (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s),
  red: (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s),
  yellow: (s) => (useColor ? `\x1b[33m${s}\x1b[0m` : s),
  dim: (s) => (useColor ? `\x1b[2m${s}\x1b[0m` : s),
  bold: (s) => (useColor ? `\x1b[1m${s}\x1b[0m` : s),
};
const MARK_OK = "✓";
const MARK_FAIL = "✗";
const MARK_WARN = "⚠";

// ─── CLI args ───────────────────────────────────────────────────────────────
const skipSet = new Set();
for (const arg of process.argv.slice(2)) {
  const m = arg.match(/^--skip=(.+)$/);
  if (m) {
    for (const id of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
      skipSet.add(id);
    }
  }
}

// ─── Paths / config ─────────────────────────────────────────────────────────
const REPO_ROOT = process.cwd();
const SEO_DIR = path.join("frontend", "seo");
// DATA_DIR comes from seo-paths so it honours per-tenant namespacing (SEO_TENANT).
fs.mkdirSync(DATA_DIR, { recursive: true });

const RUN_DATE = new Date().toISOString().slice(0, 10);
const RUN_TIMESTAMP = new Date().toISOString();
const DIGEST_PATH = path.join(DATA_DIR, `monday-run-${RUN_DATE}.md`);

// Load .env(.local) so the runner can pre-flight per-step env requirements
// (e.g. cleanly skip the optional GBP step when its IDs aren't configured).
function loadEnv() {
  const merged = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && !merged[m[1]]) merged[m[1]] = m[2].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
      }
    } catch {}
  }
  return merged;
}
const RUN_ENV = loadEnv();

// ─── Resolve the GSC analysers dynamically ──────────────────────────────────
// Each analyse-gsc-phase<N>.mjs is a DISTINCT layer (phase 1 = page-level, phase 2
// = query-level), NOT a replacement — so we run them ALL, ordered by phase number,
// rather than only the highest. New phases are picked up automatically.
function pickPhaseAnalysers(globPrefix) {
  return fs
    .readdirSync(SEO_DIR)
    .filter((e) => e.startsWith(globPrefix) && e.endsWith(".mjs"))
    .map((e) => ({ e, n: parseInt(e.match(/phase(\d+)/i)?.[1] ?? "0", 10) }))
    .sort((a, b) => a.n - b.n)
    .map(({ e, n }) => ({
      id: n <= 1 ? "gsc-analyse" : `gsc-analyse-phase${n}`,
      label: `GSC analyse — phase ${n || 1}`,
      script: e,
    }));
}
const GSC_ANALYSERS = pickPhaseAnalysers("analyse-gsc");

// ─── Step definitions ───────────────────────────────────────────────────────
// `script` is allowed to be null when no matching file exists; the runner
// records that as "skipped (missing)" rather than failed.
// Google-credential env groups, matched to the EXACT vars each sub-script
// checks, so a tenant with no Google access SKIPS (⚠/·) instead of hard-failing.
const GOOGLE_OAUTH = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"];
const GA4_ENV = ["GA4_PROPERTY_ID", ...GOOGLE_OAUTH]; // ga4-query.mjs / ga4-analyse.mjs
const GSC_ENV = ["GSC_SITE_URL", ...GOOGLE_OAUTH]; // gsc-query.mjs
// gsc-ga4-gbp-attribution.mjs REQUIRES the OAuth trio + GA4_PROPERTY_ID
// (GSC_SITE_URL is enrichment-only there and skips cleanly when absent).
const ATTRIBUTION_ENV = ["GA4_PROPERTY_ID", ...GOOGLE_OAUTH];

const steps = [
  // GSC fetch needs GSC_SITE_URL + the Google OAuth trio (gsc-query.mjs). Pulls the
  // page export AND the phase-2 query/query×page/query×country exports in one step.
  { id: "gsc-query", label: "GSC fresh fetch", script: "gsc-query.mjs", requiresEnv: GSC_ENV },
  // Phase-2 producers — feed the query-level analyser. The Sanity snapshot self-degrades
  // (writes an empty age map) when no project id is set; the DataForSEO KD step is gated
  // on its creds and skips cleanly when absent (phase 2 then routes on position only).
  { id: "sanity-content-snapshot", label: "Sanity content-age snapshot", script: "sanity-content-snapshot.mjs" },
  { id: "dataforseo-kd", label: "Keyword difficulty (DataForSEO)", script: "dataforseo-kd.mjs", requiresEnv: ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"] },
  // GSC analysers (page-level phase 1 + query-level phase 2) read gsc-query's on-disk
  // output — no API calls, no Google env — so they are intentionally NOT gated.
  ...GSC_ANALYSERS,
  { id: "ahrefs-smoke", label: "Ahrefs smoke test", script: "ahrefs-query.mjs" },
  { id: "ahrefs-analyse", label: "Ahrefs analyse", script: "analyse-ahrefs.mjs" },
  // GA4 needs GA4_PROPERTY_ID + the Google OAuth trio (ga4-query.mjs).
  { id: "ga4-analyse", label: "GA4 analyse", script: "ga4-analyse.mjs", requiresEnv: GA4_ENV },
  // GBP is optional — skipped cleanly when its account/location IDs aren't set.
  { id: "gbp-analyse", label: "GBP analyse", script: "gbp-analyse.mjs", isGbp: true, requiresEnv: ["GBP_ACCOUNT_ID", "GBP_LOCATION_ID"] },
  {
    id: "attribution",
    label: "GSC <-> GA4 <-> GBP attribution",
    script: "gsc-ga4-gbp-attribution.mjs",
    requiresEnv: ATTRIBUTION_ENV,
  },
  {
    id: "autocomplete-research",
    label: "Google Autocomplete research",
    script: "google-autocomplete.mjs",
  },
  {
    id: "xlsx-report",
    label: "XLSX report",
    script: "report-xlsx.mjs",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const QUOTA_PATTERNS = [
  /quota.*not.*grant/i,
  /not.*allowlist/i,
  /allowlist.*pending/i,
  /allowlist.*not.*grant/i,
  /PERMISSION_DENIED/i,
  /quota.*exceed/i,
  /performance.*api.*not.*enabled/i,
  /rate.?limit.*exceed/i,
  /gbp.*blocked/i,
];

function looksLikeGbpQuotaGate(stdout, stderr) {
  const blob = `${stdout}\n${stderr}`;
  return QUOTA_PATTERNS.some((re) => re.test(blob));
}

function extractOutputFiles(stdout) {
  const found = new Set();
  const lines = stdout.split(/\r?\n/);
  const re = /(?:wrote|written(?:\s+to)?|saved(?:\s+to)?|output(?:\s+to)?|->)\s+([\.\/\\\w\-]+\.(?:md|json|txt|csv))/i;
  for (const line of lines) {
    const m = line.match(re);
    if (m) found.add(m[1].replace(/\\/g, "/"));
  }
  return [...found];
}

function runStep(step) {
  const result = {
    id: step.id,
    label: step.label,
    script: step.script,
    status: "pending",
    code: null,
    durationSec: 0,
    outputs: [],
    note: "",
  };

  if (skipSet.has(step.id)) {
    result.status = "skipped";
    result.note = "skipped via --skip flag";
    return result;
  }

  // Optional steps with unmet env requirements skip cleanly (not a failure).
  if (step.requiresEnv && step.requiresEnv.some((k) => !RUN_ENV[k])) {
    result.status = "skipped";
    result.note = `not configured (optional) — set ${step.requiresEnv.join(" + ")} to enable`;
    return result;
  }

  if (!step.script) {
    result.status = "missing";
    result.note = "no matching script found in frontend/seo/";
    return result;
  }

  const scriptPath = path.join(SEO_DIR, step.script);
  if (!fs.existsSync(scriptPath)) {
    result.status = "missing";
    result.note = `${scriptPath} does not exist`;
    return result;
  }

  const t0 = Date.now();
  const proc = spawnSync(process.execPath, [scriptPath], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
  result.durationSec = +((Date.now() - t0) / 1000).toFixed(2);
  result.code = proc.status;

  const stdout = proc.stdout || "";
  const stderr = proc.stderr || "";
  result.outputs = extractOutputFiles(stdout);

  if (proc.error) {
    result.status = "fail";
    result.note = `spawn error: ${proc.error.message}`;
  } else if (proc.status === 0) {
    if (step.isGbp && looksLikeGbpQuotaGate(stdout, stderr)) {
      result.status = "warn";
      result.note = "GBP allowlist not yet granted — blocked, not failed";
    } else {
      result.status = "ok";
    }
  } else {
    result.status = "fail";
    const tail = (stderr.trim() || stdout.trim()).split(/\r?\n/).slice(-1)[0] || "";
    result.note = tail.slice(0, 200);
  }

  result._stdout = stdout;
  result._stderr = stderr;
  return result;
}

function statusLine(r) {
  if (r.status === "ok") {
    return `${c.green(MARK_OK)} ${r.label} ${c.dim(`(${r.durationSec}s)`)}`;
  }
  if (r.status === "warn") {
    return `${c.yellow(MARK_WARN)} ${r.label} ${c.dim(`(${r.durationSec}s)`)} — ${r.note}`;
  }
  if (r.status === "fail") {
    return `${c.red(MARK_FAIL)} ${r.label} ${c.dim(`(${r.durationSec}s, exit ${r.code})`)} — ${r.note}`;
  }
  if (r.status === "skipped") {
    return `${c.dim("·")} ${r.label} ${c.dim("(skipped)")}`;
  }
  if (r.status === "missing") {
    return `${c.dim("·")} ${r.label} ${c.dim("(missing)")} — ${r.note}`;
  }
  return `? ${r.label}`;
}

function digestMark(r) {
  if (r.status === "ok") return MARK_OK;
  if (r.status === "warn") return MARK_WARN;
  if (r.status === "fail") return MARK_FAIL;
  if (r.status === "skipped") return "·";
  if (r.status === "missing") return "·";
  return "?";
}

// ─── Run ────────────────────────────────────────────────────────────────────
console.log(c.bold(`Monday SEO run — ${RUN_TIMESTAMP}`));
if (skipSet.size > 0) {
  console.log(c.dim(`Skipping: ${[...skipSet].join(", ")}`));
}
console.log();

const results = [];
for (const step of steps) {
  process.stdout.write(c.dim(`→ ${step.label} ... `) + (useColor ? "" : "\n"));
  const r = runStep(step);
  results.push(r);
  if (useColor) process.stdout.write("\r");
  console.log(statusLine(r));
}

// ─── "What to look at first" — point to freshest reports ───────────────────
function freshestUnder(dir, exts = [".md", ".json", ".csv", ".xlsx", ".txt"]) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...freshestUnder(full, exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      try {
        const stat = fs.statSync(full);
        out.push({ path: full.replace(/\\/g, "/"), mtime: stat.mtimeMs });
      } catch {}
    }
  }
  return out;
}

function pickFreshest(dir, pattern) {
  const all = freshestUnder(dir).filter((f) => pattern.test(f.path));
  all.sort((a, b) => b.mtime - a.mtime);
  return all[0] || null;
}

const lookAt = [];
const todayMs = Date.now() - 36 * 60 * 60 * 1000;

const candidates = [
  { tag: "XLSX workbook", entry: pickFreshest(DATA_DIR, /monday-run.*\.xlsx$/i) },
  { tag: "CSV exports", entry: pickFreshest(DIRS.csv, /\.csv$/i) },
  { tag: "GSC page report", entry: pickFreshest(DIRS.gsc, /\.md$/i) },
  { tag: "GSC page priorities (CSV)", entry: pickFreshest(DIRS.csv, /gsc-page-priorities.*\.csv$/i) },
  { tag: "GA4 report", entry: pickFreshest(DIRS.ga4Reports, /\.md$/i) },
  { tag: "Attribution", entry: pickFreshest(DATA_DIR, /attribution.*\.md$/i) },
  { tag: "Ahrefs reports", entry: pickFreshest(DIRS.ahrefs, /\.(md|json)$/i) },
  { tag: "GBP report", entry: pickFreshest(DIRS.gbpReports, /\.md$/i) },
];
for (const { tag, entry } of candidates) {
  if (entry && entry.mtime >= todayMs) {
    lookAt.push(`- **${tag}**: \`${entry.path}\``);
  }
}

const declared = new Set();
for (const r of results) {
  for (const o of r.outputs) declared.add(o);
}
for (const p of declared) {
  if (!lookAt.some((l) => l.includes(p))) {
    lookAt.push(`- Output: \`${p}\``);
  }
}

// ─── Write digest ───────────────────────────────────────────────────────────
const lines = [];
lines.push(`# Monday SEO run — ${RUN_DATE}`);
lines.push("");
lines.push(`Run timestamp: \`${RUN_TIMESTAMP}\``);
if (skipSet.size > 0) {
  lines.push(`Skipped via flag: \`${[...skipSet].join(", ")}\``);
}
lines.push("");
lines.push("## Step-by-step outcomes");
lines.push("");
lines.push("| | Step | Duration | Exit | Notes |");
lines.push("|---|---|---:|---:|---|");
for (const r of results) {
  const script = r.script ? `\`${r.script}\`` : "_(no script)_";
  const note = (r.note || "").replace(/\|/g, "\\|");
  lines.push(
    `| ${digestMark(r)} | ${r.label} (${script}) | ${r.durationSec}s | ${
      r.code === null ? "—" : r.code
    } | ${note} |`,
  );
}
lines.push("");

const stepsWithOutputs = results.filter((r) => r.outputs.length > 0);
if (stepsWithOutputs.length > 0) {
  lines.push("## Files written by each step");
  lines.push("");
  for (const r of stepsWithOutputs) {
    lines.push(`- **${r.label}**`);
    for (const o of r.outputs) lines.push(`  - \`${o}\``);
  }
  lines.push("");
}

lines.push("## What to look at first");
lines.push("");
if (lookAt.length === 0) {
  lines.push("_No fresh reports detected — check step failures above._");
} else {
  for (const l of lookAt) lines.push(l);
}
lines.push("");

const failed = results.filter((r) => r.status === "fail");
if (failed.length > 0) {
  lines.push("## Failure logs (tail)");
  lines.push("");
  for (const r of failed) {
    lines.push(`### ${r.label} — exit ${r.code}`);
    lines.push("");
    const tail = ((r._stderr || "") + "\n" + (r._stdout || ""))
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-20)
      .join("\n");
    lines.push("```");
    lines.push(tail || "(no output captured)");
    lines.push("```");
    lines.push("");
  }
}

fs.writeFileSync(DIGEST_PATH, lines.join("\n"), "utf8");

console.log();
console.log(`Digest: ${DIGEST_PATH.replace(/\\/g, "/")}`);

const hardFails = results.filter((r) => r.status === "fail").length;
process.exit(hardFails > 0 ? 1 : 0);
