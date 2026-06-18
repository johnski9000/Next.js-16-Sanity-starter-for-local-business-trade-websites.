// Discovery probe for the Google Business Profile API toolkit.
//
// Confirms:
//   1. The new OAuth refresh token works (includes business.manage scope)
//   2. The three GBP APIs are enabled in Cloud Console
//   3. The canonical account name + location name (so we can pin
//      GBP_ACCOUNT_ID + GBP_LOCATION_ID in .env)
//   4. The scope set returned matches what we asked for
//
// Usage:
//   node frontend/seo/gbp-discover.mjs

import fs from "node:fs";

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
for (const k of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"]) {
  if (!env[k]) {
    console.error(`Missing ${k} in .env`);
    process.exit(1);
  }
}

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OAuth token exchange ${res.status}: ${text}`);
  }
  const json = JSON.parse(text);
  return { accessToken: json.access_token, scopes: (json.scope || "").split(" ") };
}

async function callGoogle(token, url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

const log = (label, msg) => console.log(`[${label}] ${msg}`);

(async () => {
  log("auth", "Exchanging refresh token for access token...");
  const { accessToken, scopes } = await getAccessToken();
  log("auth", `Access token obtained.`);
  log("auth", `Scopes returned: ${scopes.join(", ")}`);

  const required = "https://www.googleapis.com/auth/business.manage";
  if (!scopes.includes(required)) {
    log("auth", `WARNING: ${required} not in returned scopes. The token will 403 on GBP API calls.`);
  } else {
    log("auth", `OK: business.manage scope present.`);
  }

  // 1. List accounts (Business Profile Account Management API)
  log("accounts", "Listing accounts via Account Management API...");
  const acctRes = await callGoogle(
    accessToken,
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
  );
  if (!acctRes.ok) {
    log("accounts", `FAIL ${acctRes.status}: ${JSON.stringify(acctRes.body).slice(0, 800)}`);
    console.error("\nIf you see 'API has not been used' or 'is disabled', enable:");
    console.error("  https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com");
    process.exit(1);
  }
  const accounts = acctRes.body.accounts || [];
  log("accounts", `Found ${accounts.length} accounts.`);
  for (const a of accounts) {
    log("accounts", `  - ${a.name}  type=${a.type}  role=${a.role}  display="${a.accountName}"`);
  }

  if (!accounts.length) {
    console.error("No accounts returned — the OAuth user may not own/manage any GBP listings.");
    process.exit(1);
  }

  // 2. For each account, list locations (Business Information API)
  for (const account of accounts) {
    log("locations", `Listing locations under ${account.name}...`);
    const locRes = await callGoogle(
      accessToken,
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,metadata&pageSize=100`,
    );
    if (!locRes.ok) {
      log("locations", `FAIL ${locRes.status}: ${JSON.stringify(locRes.body).slice(0, 800)}`);
      console.error("\nIf you see 'API has not been used' or 'is disabled', enable:");
      console.error("  https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com");
      continue;
    }
    const locations = locRes.body.locations || [];
    log("locations", `  ${locations.length} location(s) under this account.`);
    for (const loc of locations) {
      log("locations", `    - name=${loc.name}`);
      log("locations", `      title=${loc.title}`);
      if (loc.storefrontAddress) {
        const a = loc.storefrontAddress;
        const addr = [a.addressLines?.join(", "), a.locality, a.postalCode].filter(Boolean).join(", ");
        log("locations", `      address=${addr}`);
      }
      if (loc.websiteUri) log("locations", `      website=${loc.websiteUri}`);
      if (loc.metadata?.placeId) log("locations", `      placeId=${loc.metadata.placeId}`);
    }
  }

  // 3. Optional: hit Performance API for the first location to confirm it's enabled
  const firstAccount = accounts[0];
  const firstLocRes = await callGoogle(
    accessToken,
    `https://mybusinessbusinessinformation.googleapis.com/v1/${firstAccount.name}/locations?readMask=name&pageSize=1`,
  );
  const firstLoc = firstLocRes.body?.locations?.[0];
  if (firstLoc) {
    const locId = firstLoc.name.split("/").pop();
    log("performance", `Probing Performance API against locations/${locId}...`);
    // Daily metrics is the simplest endpoint to confirm API enablement
    const today = new Date();
    const sevenAgo = new Date(today.getTime() - 7 * 86400000);
    const yymmdd = (d) => `year=${d.getUTCFullYear()}&month=${d.getUTCMonth() + 1}&day=${d.getUTCDate()}`;
    const perfUrl =
      `https://businessprofileperformance.googleapis.com/v1/locations/${locId}:fetchMultiDailyMetricsTimeSeries` +
      `?dailyMetrics=WEBSITE_CLICKS` +
      `&dailyRange.start_date.${yymmdd(sevenAgo).replace(/&/g, "&dailyRange.start_date.")}` +
      `&dailyRange.end_date.${yymmdd(today).replace(/&/g, "&dailyRange.end_date.")}`;
    const perfRes = await callGoogle(accessToken, perfUrl);
    if (!perfRes.ok) {
      log("performance", `FAIL ${perfRes.status}: ${JSON.stringify(perfRes.body).slice(0, 500)}`);
      console.error("\nIf 'API has not been used' or 'is disabled', enable:");
      console.error("  https://console.cloud.google.com/apis/library/businessprofileperformance.googleapis.com");
    } else {
      log("performance", `OK: Performance API responded ${perfRes.status}`);
    }
  }

  console.log("\n=== Probe complete. Add the canonical IDs above to .env: ===");
  console.log("  GBP_ACCOUNT_ID=<value from accounts: name field, e.g. accounts/123...>");
  console.log("  GBP_LOCATION_ID=<value from locations: name field, e.g. locations/456...>");
  console.log("(Use either the full path or just the numeric ID — wrapper will normalise.)");
})().catch((err) => {
  console.error("Probe failed:", err.message);
  process.exit(1);
});
