import {revalidateTag} from 'next/cache'
import {NextResponse, type NextRequest} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

export const runtime = 'nodejs'

/**
 * Sanity → Next on-publish revalidation. Each client project gets a Sanity webhook
 * pointing here with their tenant key in the URL (`/api/revalidate?tenant=<key>`)
 * and the shared `SANITY_REVALIDATE_SECRET` as the signing secret. On a valid,
 * signed delivery we bust that tenant's cache tag (`tenant:<key>`) so edits appear
 * immediately — and let us safely lengthen ISR windows (lower Sanity API cost).
 *
 * No-op (501) until SANITY_REVALIDATE_SECRET is configured.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({error: 'Revalidation not configured'}, {status: 501})
  }

  const tenant = req.nextUrl.searchParams.get('tenant')
  if (!tenant) {
    return NextResponse.json({error: 'Missing ?tenant='}, {status: 400})
  }

  let parsed: {isValidSignature: boolean | null; body: {_type?: string} | null}
  try {
    parsed = await parseBody<{_type?: string}>(req, secret)
  } catch {
    return NextResponse.json({error: 'Invalid body'}, {status: 400})
  }
  if (!parsed.isValidSignature) {
    return NextResponse.json({error: 'Invalid signature'}, {status: 401})
  }

  const tag = `tenant:${tenant}`
  // Next 16 requires the cache-profile arg; 'max' is the recommended value for
  // on-demand purge from a route handler.
  revalidateTag(tag, 'max')
  return NextResponse.json({revalidated: true, tag, type: parsed.body?._type ?? null})
}
