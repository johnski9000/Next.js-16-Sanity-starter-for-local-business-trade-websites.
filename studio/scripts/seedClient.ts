/**
 * Write-enabled Sanity client for seed scripts.
 *
 * Run seeds through the Sanity CLI so this picks up your project/dataset from
 * sanity.cli.ts and authenticates as your logged-in user — no token to manage:
 *
 *   npx sanity exec scripts/seed.ts --with-user-token
 *
 * For CI / non-interactive use, set SANITY_WRITE_TOKEN (a token with write
 * access) and run the same command; the token takes precedence.
 */
import {getCliClient} from 'sanity/cli'

const apiVersion = '2025-09-25'

const base = getCliClient({apiVersion})

export const client = process.env.SANITY_WRITE_TOKEN
  ? base.withConfig({token: process.env.SANITY_WRITE_TOKEN, useCdn: false})
  : base
