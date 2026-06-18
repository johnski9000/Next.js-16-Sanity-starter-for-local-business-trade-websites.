// Apply a design (look) to THIS single-tenant site.
//
//   node scripts/apply-design.mjs <heritage|signature|momentum>   (or 1|2|3)
//   node scripts/apply-design.mjs <design> --colour-only
//
// A design = a COLOUR preset × a per-section LAYOUT. On this single-tenant base:
//   • COLOUR is an env var (NEXT_PUBLIC_DESIGN) read at runtime — a script can't set
//     env for you, so this prints the exact value to put in .env (then redeploy).
//   • LAYOUT is the `variant` on every page-builder block — this writes those to the
//     site's own Sanity dataset.
//
// Env (.env / .env.local): NEXT_PUBLIC_SANITY_PROJECT_ID + SANITY_WRITE_TOKEN (Editor)
// to write layout variants; NEXT_PUBLIC_SANITY_DATASET defaults to "production".
// (Multi-tenant equivalent — colour on a control registry + apply-profile.mjs — lives
// on the `main` branch; single-tenant has no control plane, hence the env colour.)

import { loadEnv } from "./lib/load-env.mjs";
import { PROFILES, PROFILE_KEYS } from "./design-profiles.mjs";

const API_V = "v2024-01-01"; // pinned + clean
const env = loadEnv([".env.local", ".env"]);

// Resolve a design name OR 1-based number to a profile key.
function resolveDesign(input) {
  if (!input) return undefined;
  const s = String(input).trim().toLowerCase();
  if (PROFILE_KEYS.includes(s)) return s;
  const n = Number.parseInt(s, 10);
  if (n >= 1 && n <= PROFILE_KEYS.length) return PROFILE_KEYS[n - 1];
  return null;
}

const [designArg, ...rest] = process.argv.slice(2);
const colourOnly = rest.includes("--colour-only");
const key = resolveDesign(designArg);

if (!designArg || key === null) {
  const menu = PROFILE_KEYS.map((k, i) => `  ${i + 1}) ${PROFILES[k].label}`).join("\n");
  console.error(`Usage: node scripts/apply-design.mjs <${PROFILE_KEYS.join("|")}> (or 1-${PROFILE_KEYS.length}) [--colour-only]\n${menu}`);
  process.exit(1);
}
const profile = PROFILES[key];

const PROJECT_ID = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = env.NEXT_PUBLIC_SANITY_DATASET || "production";
const TOKEN = env.SANITY_WRITE_TOKEN;

console.log(`\nDesign: ${key} — ${profile.label}`);

// ① Colour — env-driven on single-tenant; instruct (can't set env from a script).
console.log(`\n① Colour — set this in .env and redeploy:`);
console.log(`     NEXT_PUBLIC_DESIGN=${profile.design}`);

if (colourOnly) {
  console.log(`\n· Layout: skipped (--colour-only).`);
  process.exit(0);
}

// ② Layout — write the per-section variants into the site's own dataset.
if (!PROJECT_ID || !TOKEN) {
  console.error(
    `\n⚠ Layout: SKIPPED — set NEXT_PUBLIC_SANITY_PROJECT_ID + SANITY_WRITE_TOKEN (Editor) ` +
      `to write layout variants. The colour instruction above still applies.`,
  );
  process.exit(0);
}

async function api(method, endpoint, body) {
  const res = await fetch(`https://${PROJECT_ID}.api.sanity.io/${API_V}/${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${endpoint} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}
const query = (groq) => api("GET", `data/query/${DATASET}?query=${encodeURIComponent(groq)}`).then((r) => r.result);
const mutate = (mutations) => api("POST", `data/mutate/${DATASET}`, { mutations });

async function main() {
  const pages = await query(`*[_type=="page"]{_id, "blocks": pageBuilder[]{_key,_type}}`);
  let count = 0;
  const muts = [];
  for (const page of pages || []) {
    const set = {};
    for (const b of page.blocks || []) {
      const v = profile.variants[b._type];
      if (v) {
        set[`pageBuilder[_key=="${b._key}"].variant`] = v;
        count++;
      }
    }
    if (Object.keys(set).length) muts.push({ patch: { id: page._id, set } });
  }
  if (muts.length) {
    await mutate(muts);
    console.log(`\n② Layout: set ${count} block variant(s) across ${muts.length} page(s) in ${PROJECT_ID}/${DATASET}.`);
  } else {
    console.log(`\n② Layout: no page-builder blocks found to set.`);
  }
  console.log(`\nDone. Layout written; set NEXT_PUBLIC_DESIGN=${profile.design} in .env + redeploy for the colour.`);
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
