import {timingSafeEqual} from 'node:crypto'

/**
 * Constant-time secret comparison for the token-gated diagnostic/health routes.
 * Returns false on any missing value or length mismatch WITHOUT leaking timing
 * (a plain `a !== b` short-circuits and is theoretically timing-attackable).
 * nodejs runtime only (node:crypto).
 */
export function tokensMatch(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
