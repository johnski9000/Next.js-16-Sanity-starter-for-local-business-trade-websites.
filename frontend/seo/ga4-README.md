# GA4 Toolkit

Lightweight Google Analytics 4 Data API wrapper + workflow scripts that join GA4 conversion data with Google Search Console ranking data for the client site (target resolved from `.env` / Sanity).

Built around the existing `frontend/seo/` Node.js script pattern (matches `gsc-query.mjs` and `ahrefs-query.mjs`).

## Setup

1. Add the GA4 credentials to `.env`:
   ```
   GOOGLE_CLIENT_ID=your-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-oauth-client-secret
   GOOGLE_REFRESH_TOKEN=your-refresh-token-with-both-scopes
   GA4_PROPERTY_ID=421368622
   ```
   (`.env.local` also supported; either filename works.)

2. **Find your GA4 Property ID.** In the GA4 web UI go to **Admin -> Property Settings**. The numeric ID near the top of the panel (e.g. `421368622`) is what `GA4_PROPERTY_ID` needs. It is *not* the measurement ID (`G-XXXXXXX`) and *not* the stream ID. The same value is also visible in the URL when you have the property selected (`...p421368622...`).

3. **Enable the GA4 Data API in Google Cloud.** Open the Google Cloud Console for the project that owns the OAuth client, go to **APIs & Services -> Library**, search for *Google Analytics Data API*, and click **Enable**. This is separate from the Search Console API — both must be enabled on the same project.

4. **Regenerate the refresh token with both scopes.** The toolkit shares one OAuth refresh token across GSC and GA4, so the token must be issued with both scopes at consent time:
   - `https://www.googleapis.com/auth/webmasters.readonly`
   - `https://www.googleapis.com/auth/analytics.readonly`

   In the OAuth playground (or your local consent script) pass both scopes in the same authorise request, click through consent, and exchange the resulting code for a refresh token. Replace `GOOGLE_REFRESH_TOKEN` in `.env` with the new value. A token issued with only one scope will 403 on the other API.

5. **Verify access works.**
   ```bash
   node frontend/seo/ga4-query.mjs
   ```
   Should print sessions / users / key-event totals for the last 90 days against the configured property. If you see `403 PERMISSION_DENIED`, the OAuth user does not have at least *Viewer* on the GA4 property — fix in **GA4 Admin -> Property Access Management**. If you see `400 INVALID_ARGUMENT` mentioning `conversions`, see the gotcha in [When endpoints break](#when-endpoints-break) below.

## Scripts

### `ga4-query.mjs`

Base API wrapper. Imports as a library from the other scripts.

```bash
# Smoke test — sessions / users / key events for last 90d
node frontend/seo/ga4-query.mjs
```

Exposes named helpers (`ga4.runReport`, `ga4.totals`, `ga4.byLandingPage`, `ga4.byEvent`, `ga4.byChannel`) so the workflow scripts call these instead of raw fetch. Centralising the request shape here means schema fixes (see [When endpoints break](#when-endpoints-break)) only happen in one place.

### `ga4-analyse.mjs`

**Run weekly.** Pulls a 90-day GA4 baseline (sessions, users, key events, engagement rate, by landing page and by channel), diffs it against the previous snapshot, and writes a markdown report.

```bash
node frontend/seo/ga4-analyse.mjs
```

Outputs:
- `frontend/seo/data/ga4/snapshots/baseline-YYYY-MM-DD.json`
- `frontend/seo/data/ga4/reports/ga4-analyse-YYYY-MM-DD.md`

Schedule: weekly, Monday.

### `gsc-ga4-attribution.mjs`

**Run weekly.** Joins GSC ranking data with GA4 conversion data, keyed on landing-page URL, and outputs a 6-section markdown report.

```bash
node frontend/seo/gsc-ga4-attribution.mjs
```

Requires a fresh GSC export at `frontend/seo/data/gsc/gsc-pages-90d.json` — re-run `node frontend/seo/gsc-query.mjs` first so the GSC side of the join is current.

The six sections of the report are:
1. **Top pages** — landing pages by GSC clicks, with GA4 sessions + key-event count + conversion rate alongside.
2. **Striking-distance** — pages in GSC positions 5-15 that are already converting, ranked by `keyEvents / impressions` (highest-ROI ranking pushes).
3. **Conversions-per-impression leaderboard** — landing pages sorted by `keyEvents / impressions`, regardless of position.
4. **SEO without commerce** — pages with strong GSC impressions/clicks but zero or near-zero key events (high traffic, poor conversion — UX or intent-match problems).
5. **Commerce without SEO** — pages with strong GA4 conversion rate but low GSC impressions (great pages, no one finds them — clear SEO investment target).
6. **Top conversion drivers** — landing pages contributing the most key events in absolute terms, with their GSC position and clicks for context.

Outputs:
- `frontend/seo/data/ga4/attribution/attribution-YYYY-MM-DD.json`
- `frontend/seo/data/ga4/reports/gsc-ga4-attribution-YYYY-MM-DD.md`

Schedule: weekly, Monday (after the fresh `gsc-query.mjs` run).

## Suggested cadence (add into existing weekly cadence)

| Day | Task | Time |
|---|---|---:|
| Monday | Run `ga4-analyse.mjs` | 2 min |
| Monday | Run `gsc-ga4-attribution.mjs` (after fresh `gsc-query.mjs`) | 5 min |

Slots in next to the existing Monday Ahrefs runs — full weekly SEO read in ~15 minutes.

## What GA4 unlocks vs GSC alone

GSC tells you: did our ranking move? did impressions grow? did clicks grow?

GA4 adds: did the visitors who arrived actually convert? what's the conversion rate per landing page? which pages are SEO success but commerce failure (rank well, convert poorly)? which pages are the opposite (commerce success but low search traffic — clear SEO investment target)?

Joining the two via `gsc-ga4-attribution.mjs` is what turns rankings into business outcomes.

## Conversion events configured

The following events are currently marked as **key events** (GA4's mid-2025 rename of *conversions*) in property `421368622`:

- `form_submit`
- `mail_click`
- `phone_click`
- `purchase`

If you mark new events as conversions in GA4 admin, the analyser picks them up automatically on next run — no code change required. The helpers read the metric metadata at runtime and discover any per-event `keyEvents:<name>` series, so newly-flagged events appear in the next report.

> **Heads up:** at the time of toolkit setup, property `421368622` showed zero sessions / zero key events for the trailing 90 days. The four events above are configured in admin but had not yet fired. If reports keep coming back empty, verify `GA4_PROPERTY_ID` matches the live property serving the site and check GA4 Realtime to confirm hits are arriving — the gtag/GTM tag may not be firing in production.

## API cost

The GA4 Data API is free up to the standard quota (200,000 tokens per day per property), which is well above what this toolkit uses (~500-1,000 tokens per weekly run combining both scripts). No billing exposure.

## When endpoints break

The GA4 Data API has had quiet schema renames — most notably the mid-2025 switch from `conversions` to `keyEvents`. Fixes go in **one place**: the named helpers in [`ga4-query.mjs`](./ga4-query.mjs). Both workflow scripts call those helpers, so updating once propagates.

Common drift points:
- **`conversions` -> `keyEvents`.** Requesting `conversions`, `sessionConversionRate`, or `userConversionRate` against a modern property returns `400 INVALID_ARGUMENT`. Use `keyEvents`, `sessionKeyEventRate`, `userKeyEventRate`. Per-event series are now `keyEvents:form_submit` (etc.), not `conversions:form_submit`.
- **Dimension/metric pairing rules.** Not every dimension combines with every metric — e.g. `landingPage` with some session-scoped metrics requires `sessions` to be in the same request. If a request 400s with *incompatible dimensions and metrics*, drop dimensions one at a time to isolate.
- **Date range limits.** A single `runReport` call accepts at most 4 date ranges. Snapshot diffs use two (current + prior) and stay well inside this.

If a 400 error mentions a missing or unknown field, check the GA4 Data API reference at https://developers.google.com/analytics/devguides/reporting/data/v1 and update the helper.

## Files

```
frontend/seo/
├── ga4-query.mjs                  # Base API wrapper + named helpers
├── ga4-analyse.mjs                # Weekly 90-day baseline + diff
├── gsc-ga4-attribution.mjs        # Weekly GSC x GA4 join report
├── ga4-README.md                  # This file
└── data/ga4/
    ├── snapshots/                 # baseline-YYYY-MM-DD.json
    ├── attribution/               # attribution-YYYY-MM-DD.json
    └── reports/                   # Markdown reports (human consumption)
```
