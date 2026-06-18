// Author research-driven page copy into a tenant's Sanity project AS DRAFTS.
//
// This is the "author per the spec into Studio (as drafts)" step of the content
// pipeline:
//   research-brief.mjs  ->  author-content.mjs  ->  verify-tenant --drafts  ->  publish
//
// An AI agent (or, later, the API generator) writes a per-page **authored** JSON
// for each core page, following docs/CONTENT-AUTHORING-SPEC.md and the page's
// content brief. This script turns those files into Sanity DRAFT documents
// (drafts.<id>) by MERGING the authored fields onto the existing DRAFT if one
// exists, else the published doc — so heroImage, seo, references and other Studio
// edits are preserved, and nothing goes live until a human reviews + publishes.
//
// Authored files live under (mirrors the content-briefs layout):
//   frontend/seo/data/authored/<key>/service--<slug>.json
//   frontend/seo/data/authored/<key>/area--<slug>.json
//
//   service: { page:"service", slug, h1?, summary?, pricingIndication?,
//              overview:[para,...], whatsIncluded:[{title,description}],
//              faqs:[{question, answer:[para,...]}], trustSignals:[{icon,label}] }
//   area:    { page:"area", slug, h1?, intro:[para,...],
//              faqs:[{question, answer:[para,...]}] }
//   (paragraph fields are arrays of plain strings; converted to Portable Text.)
//
// Usage (from REPO ROOT):
//   node scripts/author-content.mjs frontend/seo/data/authored/<key>           # writes drafts
//   node scripts/author-content.mjs frontend/seo/data/authored/<key> --dry     # preview, no write
//
// Env (root .env): NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET, SANITY_WRITE_TOKEN
// (Editor token, required to write). A read token (SANITY_API_READ_TOKEN) is
// enough for --dry. Override per-run with --project/--dataset/--token.

import fs from "node:fs";
import path from "node:path";

import { loadEnv } from "./lib/load-env.mjs";

const env = loadEnv([".env.local", ".env"]);

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
// Resolve flags FIRST and record the indices they consume (the flag + its value),
// so a flag value (e.g. --token sk…) is never mistaken for the positional <dir>.
const consumed = new Set();
argv.forEach((a, i) => {
  if (a === "--dry") consumed.add(i);
});
const flag = (name) => {
  const i = argv.indexOf(name);
  if (i < 0) return null;
  consumed.add(i);
  consumed.add(i + 1);
  return argv[i + 1];
};

const PROJECT = flag("--project") || env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = flag("--dataset") || env.NEXT_PUBLIC_SANITY_DATASET || "production";
const RAW_V = env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";
const API_V = /^v/.test(RAW_V) ? RAW_V : `v${RAW_V}`;
const WRITE = flag("--token") || env.SANITY_WRITE_TOKEN;
const READ = env.SANITY_API_READ_TOKEN || WRITE;

// The positional <dir> = the first arg that isn't a flag and wasn't consumed as a
// flag value.
const dir = argv.find((a, i) => !consumed.has(i) && !a.startsWith("--") && !["true", "false"].includes(a));
if (!dir) {
  console.error("Usage: node scripts/author-content.mjs <authored-dir> [--dry] [--project X] [--dataset Y] [--token TOK]");
  process.exit(1);
}
if (!fs.existsSync(dir)) {
  console.error(`Authored dir not found: ${dir}`);
  process.exit(1);
}

if (!PROJECT) {
  console.error("MISSING: NEXT_PUBLIC_SANITY_PROJECT_ID (or --project).");
  process.exit(1);
}
if (!DRY && !WRITE) {
  console.error("MISSING: SANITY_WRITE_TOKEN (Editor token) — required to write drafts. Use --dry to preview without it.");
  process.exit(1);
}
const FETCH_TOKEN = READ || WRITE;
if (!FETCH_TOKEN) {
  console.error("MISSING: a token to read the published docs (SANITY_API_READ_TOKEN or SANITY_WRITE_TOKEN).");
  process.exit(1);
}

const BASE = `https://${PROJECT}.api.sanity.io/${API_V}`;

async function query(groq, perspective) {
  const url = `${BASE}/data/query/${DATASET}?query=${encodeURIComponent(groq)}${perspective ? `&perspective=${perspective}` : ""}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${FETCH_TOKEN}` } });
  const j = await res.json();
  if (j.error) throw new Error(`${j.error.description || j.error}`);
  return j.result;
}

async function mutate(mutations) {
  // Sanity's mutation endpoint is POST — PUT returns 405 Method Not Allowed.
  const url = `${BASE}/data/mutate/${DATASET}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WRITE}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`mutate ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

// Plain-string paragraphs -> blockContentTextOnly Portable Text. Inline markdown
// links [text](/url) are parsed into real `link` annotations (the field supports
// them and the frontend renders them via ResolvedLink) — otherwise the literal
// "[text](/url)" would show as raw text. Deterministic _keys (idBase + index) so
// re-running produces a stable draft (no key churn).
const MD_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
function inlineToSpans(idBase, bi, text) {
  const children = [];
  const markDefs = [];
  let last = 0;
  let si = 0;
  let m;
  MD_LINK.lastIndex = 0;
  while ((m = MD_LINK.exec(text))) {
    if (m.index > last) {
      children.push({ _type: "span", _key: `${idBase}-b${bi}s${si++}`, text: text.slice(last, m.index), marks: [] });
    }
    const markKey = `${idBase}-b${bi}l${si}`;
    markDefs.push({ _type: "link", _key: markKey, linkType: "href", href: m[2] });
    children.push({ _type: "span", _key: `${idBase}-b${bi}s${si++}`, text: m[1], marks: [markKey] });
    last = m.index + m[0].length;
  }
  if (last < text.length || children.length === 0) {
    children.push({ _type: "span", _key: `${idBase}-b${bi}s${si++}`, text: text.slice(last), marks: [] });
  }
  return { children, markDefs };
}
function toPortable(idBase, paras) {
  const arr = Array.isArray(paras) ? paras : [paras];
  return arr
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .map((text, i) => {
      const { children, markDefs } = inlineToSpans(idBase, i, text);
      return { _type: "block", _key: `${idBase}-b${i}`, style: "normal", markDefs, children };
    });
}

const ALLOWED_TRUST_ICONS = new Set(["ShieldCheck", "Clock", "Star", "Tag", "BadgeCheck", "Sparkles"]);

// A field counts as "authored" only when it has real content — so a blank/empty
// array left by the writer never CLOBBERS existing body copy with nothing.
const hasText = (a) => Array.isArray(a) && a.some((p) => String(p || "").trim());
const hasItems = (a) => Array.isArray(a) && a.length > 0;

// Build the draft for one page: authored fields layered onto the existing draft if
// one exists (preserve in-Studio draft edits), else the published doc.
function buildDraft(published, existingDraft, authored, kind) {
  const baseId = published._id.replace(/^drafts\./, "");
  const draftId = `drafts.${baseId}`;
  const merged = { ...(existingDraft || published), _id: draftId, _type: published._type };
  delete merged._rev;
  delete merged._createdAt;
  delete merged._updatedAt;

  if (authored.h1) merged.h1 = authored.h1;
  if (authored.summary) merged.summary = authored.summary;
  if (authored.pricingIndication) merged.pricingIndication = authored.pricingIndication;

  if (kind === "service") {
    if (hasText(authored.overview)) merged.overview = toPortable(`${baseId}-ovw`, authored.overview);
    if (hasItems(authored.whatsIncluded)) {
      merged.whatsIncluded = authored.whatsIncluded.map((it, i) => ({
        _type: "inclusion",
        _key: `${baseId}-inc${i}`,
        title: it.title,
        description: it.description,
      }));
    }
    if (hasItems(authored.trustSignals)) {
      merged.trustSignals = authored.trustSignals.map((it, i) => ({
        _type: "trustSignal",
        _key: `${baseId}-trust${i}`,
        icon: ALLOWED_TRUST_ICONS.has(it.icon) ? it.icon : "ShieldCheck",
        label: it.label,
      }));
    }
  } else if (kind === "area") {
    if (hasText(authored.intro)) merged.intro = toPortable(`${baseId}-intro`, authored.intro);
  }

  if (Array.isArray(authored.faqs)) {
    merged.faqs = authored.faqs.map((f, i) => ({
      _type: "faqItem",
      _key: `${baseId}-faq${i}`,
      question: f.question,
      answer: toPortable(`${baseId}-faq${i}-a`, f.answer),
    }));
  }
  return merged;
}

async function main() {
  const allJson = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const files = allJson.filter((f) => /^(service|area)--.*\.json$/.test(f));
  // home.json + combo--*.json are valid research-brief outputs but this tool only
  // authors service/area docs — say so rather than dropping them silently.
  const unsupported = allJson.filter((f) => /^(home|combo--)/.test(f.replace(/\.json$/, "")) || f === "home.json");
  if (!files.length) {
    console.error(`No service--*.json / area--*.json files in ${dir}`);
    process.exit(1);
  }

  console.log(`Author content -> DRAFTS   ${PROJECT}/${DATASET}${DRY ? "   [DRY RUN — no write]" : ""}`);
  console.log(`Source: ${dir}  (${files.length} page(s))`);
  if (unsupported.length) console.log(`Note: ${unsupported.length} home/combo file(s) skipped — this tool authors service + area docs only (home copy is page-builder/Studio-authored).`);
  console.log("");

  const mutations = [];
  let ok = 0;
  let skipped = 0;
  for (const f of files) {
    const kind = f.startsWith("service--") ? "service" : "area";
    let authored;
    try {
      authored = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    } catch (e) {
      console.error(`  ✗ ${f}: invalid JSON — ${e.message}`);
      skipped++;
      continue;
    }
    const slug = authored.slug || f.replace(/^(service|area)--/, "").replace(/\.json$/, "");
    const type = kind;
    let published;
    let existingDraft = null;
    try {
      // Pin the published doc deterministically (exclude drafts) so the merge base
      // is never a non-deterministic [0] of {published, draft} under the raw default.
      published = await query(`*[_type=="${type}" && slug.current=="${slug}" && !(_id in path("drafts.**"))][0]`, "raw");
      if (published) existingDraft = await query(`*[_id=="drafts.${published._id}"][0]`, "raw");
    } catch (e) {
      console.error(`  ✗ ${f}: could not read published doc — ${e.message}`);
      skipped++;
      continue;
    }
    if (!published) {
      console.error(`  ✗ ${f}: no published ${type} with slug "${slug}" — run onboard-client first.`);
      skipped++;
      continue;
    }
    const draft = buildDraft(published, existingDraft, authored, kind);
    // Author-time validation against the RESULTING draft (so a targeted patch that
    // leaves the published faqs/included in place doesn't false-warn). Catches real
    // contract gaps here, not at the Studio publish step.
    const warn = [];
    const portableHasText = (pt) => Array.isArray(pt) && pt.some((b) => (b.children || []).some((c) => String(c.text || "").trim()));
    if (draft.summary && draft.summary.length > 220) warn.push(`summary ${draft.summary.length} chars (>220 — won't publish)`);
    if (kind === "service") {
      if (!portableHasText(draft.overview)) warn.push("no overview body");
      if (!(draft.whatsIncluded || []).length) warn.push("no whatsIncluded (spec: 5-8 items)");
      if (!(draft.faqs || []).length) warn.push("no faqs (spec: 4-5)");
    } else if (kind === "area") {
      if (!portableHasText(draft.intro)) warn.push("no intro (required by schema)");
    }
    const ow = kind === "service" ? (authored.overview || []).join(" ").split(/\s+/).filter(Boolean).length : (authored.intro || []).join(" ").split(/\s+/).filter(Boolean).length;
    const mark = warn.length ? "⚠" : "✓";
    console.log(`  ${mark} ${f.padEnd(48)} -> ${draft._id}  (${kind === "service" ? "overview" : "intro"} ${ow}w, faqs ${(authored.faqs || []).length}${kind === "service" ? `, incl ${(authored.whatsIncluded || []).length}` : ""})${existingDraft ? " [merged onto existing draft]" : ""}`);
    if (warn.length) console.log(`      ⚠ ${warn.join("; ")}`);
    mutations.push({ createOrReplace: draft });
    ok++;
  }

  console.log(`\n${ok} draft(s) prepared, ${skipped} skipped.`);
  if (!ok) process.exit(1);

  if (DRY) {
    console.log("\nDRY RUN — nothing written. Sample draft doc:");
    console.log(JSON.stringify(mutations[0].createOrReplace, null, 2).slice(0, 1400));
    console.log(`\nTo apply: node scripts/author-content.mjs ${dir}   (needs SANITY_WRITE_TOKEN)`);
    console.log(`Then gate: node scripts/verify-tenant.mjs <key> --drafts --briefs <briefs-dir>`);
    return;
  }

  const result = await mutate(mutations);
  console.log(`\n✓ wrote ${result.results?.length ?? mutations.length} draft(s) to ${PROJECT}/${DATASET}.`);
  console.log(`Review in Studio, then gate: node scripts/verify-tenant.mjs <key> --drafts --briefs <briefs-dir>`);
  console.log(`Publish from Studio (or your publish flow) once the gate is green.`);
}

main().catch((e) => {
  console.error(`\nFAILED: ${e.message}`);
  process.exit(1);
});
