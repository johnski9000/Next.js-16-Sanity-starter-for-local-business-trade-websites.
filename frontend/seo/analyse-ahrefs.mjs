// Ahrefs analysis orchestrator — runs the Ahrefs workflow scripts as independent
// child processes (a failure in one never aborts the others).
//
// Ahrefs is the ONLY paid part of the toolkit (GSC/GA4/GBP/autocomplete are free),
// so operations are individually selectable and cost-labelled. An onboarding agent
// should run `--list`, show the human the costs, and only run the ops they approve.
//
// Usage:
//   node frontend/seo/analyse-ahrefs.mjs --list            # show ops + cost estimates, run nothing
//   node frontend/seo/analyse-ahrefs.mjs                   # run ALL ops (weekly cron default)
//   node frontend/seo/analyse-ahrefs.mjs --ops keyword-gap # run only the named op(s), comma-separated
//
// Requires AHREF_API_KEY (or AHREFS_API_KEY) in .env, plus COMPETITORS /
// PRIORITY_KEYWORDS in ahrefs-config.mjs (or via the AHREFS_COMPETITORS /
// AHREFS_PRIORITY_KEYWORDS env overrides for per-tenant runs).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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

// Ordered cheapest → most expensive. Cost estimates from ahrefs-README.md.
const OPS = [
  { key: "backlink-monitor", script: "ahrefs-backlink-monitor.mjs", cost: "~500–1,000 units", tier: "recurring", desc: "referring-domain delta (new/lost links)" },
  { key: "position-tracker", script: "ahrefs-position-tracker.mjs", cost: "~1,000–2,500 units", tier: "recurring", desc: "rank tracking for PRIORITY_KEYWORDS" },
  { key: "competitor-gap", script: "ahrefs-competitor-gap.mjs", cost: "~2,500–5,000 units", tier: "EXPENSIVE", desc: "link-building prospect list (needs COMPETITORS)" },
  { key: "keyword-gap", script: "ahrefs-keyword-gap.mjs", cost: "~3,000–6,000 units", tier: "EXPENSIVE", desc: "content opportunities competitors rank for (needs COMPETITORS)" },
];

const args = process.argv.slice(2);
const wantsList = args.includes("--list");
const opsArgIdx = args.indexOf("--ops");
const selected =
  opsArgIdx >= 0 && args[opsArgIdx + 1]
    ? args[opsArgIdx + 1].split(",").map((s) => s.trim()).filter(Boolean)
    : null;

if (wantsList) {
  console.log("Ahrefs operations (paid — Lite tier = 100,000 units/month):\n");
  for (const op of OPS) {
    console.log(`  ${op.key.padEnd(16)} ${op.cost.padEnd(20)} [${op.tier}]  ${op.desc}`);
  }
  console.log("\nFree alternative for keyword research (run instead/first, £0):");
  console.log("  node frontend/seo/google-autocomplete.mjs");
  console.log("\nRun specific ops:  node frontend/seo/analyse-ahrefs.mjs --ops keyword-gap,competitor-gap");
  process.exit(0);
}

if (!env.AHREF_API_KEY && !env.AHREFS_API_KEY) {
  console.log(
    "Ahrefs analyse skipped: AHREF_API_KEY (or AHREFS_API_KEY) not set. Add it to .env " +
      "and populate COMPETITORS / PRIORITY_KEYWORDS (in ahrefs-config.mjs or via the " +
      "AHREFS_COMPETITORS / AHREFS_PRIORITY_KEYWORDS env overrides) to enable Ahrefs ops.",
  );
  process.exit(0);
}

let toRun = OPS;
if (selected) {
  const unknown = selected.filter((k) => !OPS.some((o) => o.key === k));
  if (unknown.length) {
    console.error(`Unknown op(s): ${unknown.join(", ")}. Valid: ${OPS.map((o) => o.key).join(", ")}`);
    process.exit(1);
  }
  toRun = OPS.filter((o) => selected.includes(o.key));
}

const SEO_DIR = path.join("frontend", "seo");
let ran = 0;
let failures = 0;
for (const op of toRun) {
  const scriptPath = path.join(SEO_DIR, op.script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`· ${op.script} missing — skipped`);
    continue;
  }
  console.log(`\n→ ${op.key}  (${op.cost})`);
  ran += 1;
  const proc = spawnSync(process.execPath, [scriptPath], { stdio: "inherit", env: process.env });
  if (proc.status !== 0) {
    failures += 1;
    console.error(`✗ ${op.key} exited ${proc.status}`);
  }
}

console.log(`\nAhrefs analyse: ${ran - failures}/${ran} ops succeeded.`);
process.exit(ran > 0 && failures === ran ? 1 : 0);
