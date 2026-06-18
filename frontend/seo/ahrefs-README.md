# Ahrefs Helper Toolkit

Lightweight Ahrefs API v3 wrapper + 4 workflow scripts for the client site's SEO automation (target domain resolved from `.env` / Sanity).

Built around the existing `frontend/seo/` Node.js script pattern (matches `gsc-query.mjs`).

## Setup

1. Add your Ahrefs API key to `.env`:
   ```
   AHREF_API_KEY=your-key-here
   ```
   (`.env.local` also supported; either filename works.)

2. Edit [`ahrefs-config.mjs`](./ahrefs-config.mjs):
   - `TARGET` — your domain (auto-resolved from `NEXT_PUBLIC_SITE_URL` / `AHREFS_TARGET` in `.env`, or Sanity; override here only if needed)
   - `COMPETITORS` — 3-7 genuine competitor domains
   - `PRIORITY_KEYWORDS` — 20-40 keywords to track positions for

3. Verify the API key works:
   ```bash
   node frontend/seo/ahrefs-query.mjs
   ```
   Should output Domain Rating for the target domain.

## Scripts

### `ahrefs-query.mjs`

Base API wrapper. Imports as a library from the other scripts.

```bash
# Smoke test — fetch Domain Rating for default target
node frontend/seo/ahrefs-query.mjs

# Or for any other target
node frontend/seo/ahrefs-query.mjs example.com
```

Exposes named helpers (`ahrefs.domainRating`, `ahrefs.refdomains`, `ahrefs.backlinks`, `ahrefs.organicKeywords`, `ahrefs.competingDomains`, `ahrefs.serpOverview`) so the workflow scripts call these instead of raw fetch.

### `ahrefs-backlink-monitor.mjs`

**Run weekly.** Fetches current referring domains for the target, compares against the previous snapshot, and outputs a markdown delta report (new domains, lost domains, DR distribution).

```bash
node frontend/seo/ahrefs-backlink-monitor.mjs
```

Outputs:
- `frontend/seo/data/ahrefs/refdomain-snapshots/refdomains-YYYY-MM-DD.json`
- `frontend/seo/data/ahrefs/reports/backlink-delta-YYYY-MM-DD-to-YYYY-MM-DD.md`

API cost: ~500-1,000 units per run.

### `ahrefs-competitor-gap.mjs`

**Run monthly.** Fetches referring domains for each competitor in config, finds domains that link to ≥2 competitors but NOT to the target. Output is a prospect list sorted by Domain Rating — your link-building target list.

```bash
node frontend/seo/ahrefs-competitor-gap.mjs
```

Outputs:
- `frontend/seo/data/ahrefs/competitor-gap/prospects-YYYY-MM-DD.json`
- `frontend/seo/data/ahrefs/reports/competitor-gap-YYYY-MM-DD.md`

API cost: ~2,500-5,000 units per run depending on competitor count.

### `ahrefs-keyword-gap.mjs`

**Run monthly.** Fetches top organic keywords for each competitor (positions 1-30 only). Then fetches target keywords. Outputs the keywords competitors rank for in top 30 that the target doesn't rank for (or ranks for at position 30+).

```bash
node frontend/seo/ahrefs-keyword-gap.mjs
```

Outputs:
- `frontend/seo/data/ahrefs/keyword-gap/gap-YYYY-MM-DD.json`
- `frontend/seo/data/ahrefs/reports/keyword-gap-YYYY-MM-DD.md`

API cost: ~3,000-6,000 units per run.

### `ahrefs-position-tracker.mjs`

**Run weekly or bi-weekly.** For each priority keyword, fetches SERP for the configured location, finds the target's position, and compares to previous snapshot. Outputs position-changes report.

```bash
node frontend/seo/ahrefs-position-tracker.mjs
```

Outputs:
- `frontend/seo/data/ahrefs/position-snapshots/positions-YYYY-MM-DD.json`
- `frontend/seo/data/ahrefs/reports/positions-YYYY-MM-DD-to-YYYY-MM-DD.md`

API cost: ~1,000-2,500 units per run (varies with `PRIORITY_KEYWORDS` count).

## Suggested schedule

| Day | Script | Frequency |
|---|---|---|
| Monday | `ahrefs-backlink-monitor.mjs` | Weekly |
| Monday | `ahrefs-position-tracker.mjs` | Weekly |
| 1st of month | `ahrefs-competitor-gap.mjs` | Monthly |
| 1st of month | `ahrefs-keyword-gap.mjs` | Monthly |

Total monthly API cost: **~8,000-15,000 units** (10-15% of 100k Lite allocation).

You can schedule via Windows Task Scheduler, cron (on a server), or GitHub Actions:

```yaml
# .github/workflows/ahrefs-weekly.yml — example
name: Ahrefs Weekly
on:
  schedule:
    - cron: "0 8 * * 1" # 8am every Monday
  workflow_dispatch:
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: |
          echo "AHREF_API_KEY=${{ secrets.AHREF_API_KEY }}" > .env
          node frontend/seo/ahrefs-backlink-monitor.mjs
          node frontend/seo/ahrefs-position-tracker.mjs
      - uses: actions/upload-artifact@v4
        with:
          name: ahrefs-reports
          path: frontend/seo/data/ahrefs/reports/
```

## When endpoints break

Ahrefs API v3 has evolved — if a script fails with a `400` or `404`, the endpoint path or parameter name has likely changed. Fixes go in **one place**: the named helpers in [`ahrefs-query.mjs`](./ahrefs-query.mjs). All four workflow scripts call those helpers, so updating once propagates.

Common drift points:
- `order_by` syntax (e.g. `field_name_desc` vs `field_name:desc`)
- `select` field names (Ahrefs occasionally renames fields)
- New required parameters (e.g. `date` was added to several endpoints)

If a 400 error mentions a missing argument, check the Ahrefs API v3 docs at https://ahrefs.com/api/documentation and add the parameter to the helper.

## Cancel-or-keep decision protocol

After 8 weeks of running this toolkit, decide whether to keep Ahrefs Lite (£129/mo) or migrate to DataForSEO API (~£30-80/mo):

- **Keep Ahrefs** if: the backlink data quality (refdomains, anchor text, DR over time) was the primary value, OR you used the Ahrefs UI for ad-hoc lookups outside the scripts.
- **Switch to DataForSEO** if: 90%+ of value came from the scripts themselves, AND backlink data felt adequate (not industry-leading).

Migration path: same script structure, swap the endpoint paths and field names. The output format and storage pattern stays identical, so existing snapshots remain comparable.

## Files

```
frontend/seo/
├── ahrefs-config.mjs              # Shared config
├── ahrefs-query.mjs               # Base API wrapper + named helpers
├── ahrefs-backlink-monitor.mjs    # Weekly delta
├── ahrefs-competitor-gap.mjs      # Monthly link prospecting
├── ahrefs-keyword-gap.mjs         # Monthly content opportunity report
├── ahrefs-position-tracker.mjs    # Weekly/bi-weekly position tracking
├── ahrefs-README.md               # This file
└── data/ahrefs/                   # All output snapshots + reports
    ├── refdomain-snapshots/
    ├── position-snapshots/
    ├── competitor-gap/
    ├── keyword-gap/
    └── reports/                   # Markdown reports (human consumption)
```
