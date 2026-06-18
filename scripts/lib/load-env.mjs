// Shared .env loader for the operational scripts.
//
// History: every script grew its own naive `KEY=(.*)` loader. That regex keeps
// the trailing inline ` # comment` AS PART OF THE VALUE, so a perfectly normal
//   NEXT_PUBLIC_SANITY_API_VERSION="2025-09-25" # Optional…
// corrupts the Sanity API version/URL and 405s onboarding at the worst possible
// time (a first paying client's setup). `apply-profile.mjs` already had the fix;
// this module is the single source of truth so it can never drift back.
//
// Resolution: process.env wins, then the files in order (earlier files win over
// later ones — root `.env` before `frontend/.env`). Surrounding quotes are
// stripped; an inline `# comment` after the value is dropped.

import fs from 'node:fs'

export const DEFAULT_ENV_FILES = ['.env.local', '.env', 'frontend/.env.local', 'frontend/.env']

/** Parse one raw RHS value: honour surrounding quotes, else strip a trailing
 *  ` # comment` and trim. (Quoted values keep everything up to the closing
 *  quote verbatim, so a `#` inside quotes is preserved.) */
export function parseEnvValue(raw) {
  let v = (raw ?? '').trim()
  if (v[0] === '"' || v[0] === "'") {
    const q = v[0]
    const end = v.indexOf(q, 1)
    if (end > 0) return v.slice(1, end)
  }
  return v.replace(/\s+#.*$/, '').trim()
}

/** Load env from the given files (default: root + frontend), layered over
 *  process.env. A non-empty value already present is never overwritten; a
 *  BLANK process.env var (empty string — as CI/Vercel inject for declared-but-
 *  unset vars) is treated as absent so a populated `.env` value still wins
 *  (matches the behaviour of the per-script loaders this replaces). A `#` after
 *  whitespace is an inline comment; comment out a whole line (leading `#`) to
 *  disable a key rather than `KEY=# …`. */
export function loadEnv(files = DEFAULT_ENV_FILES) {
  const env = {...process.env}
  for (const file of files) {
    try {
      for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
        if (m && (env[m[1]] === undefined || env[m[1]] === '')) env[m[1]] = parseEnvValue(m[2])
      }
    } catch {
      // missing file is fine — layered config
    }
  }
  return env
}

/** Canonical host form — MUST match frontend/sanity/lib/tenants.ts normaliseHost
 *  so a host stored by onboarding resolves to the same key the frontend looks up:
 *  lower-case, strip port and a leading `www.`. */
export function normaliseHost(host) {
  return (host || '')
    .toLowerCase()
    .split(':')[0]
    .replace(/^www\./, '')
    .trim()
}
