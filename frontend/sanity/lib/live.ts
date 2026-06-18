import {defineLive} from 'next-sanity/live'
import {client} from '@/sanity/lib/client'
import {token} from '@/sanity/lib/token'

/**
 * Use defineLive to enable automatic revalidation and refreshing of your fetched content
 * Learn more: https://github.com/sanity-io/next-sanity?tab=readme-ov-file#1-configure-definelive
 */

export const {sanityFetch, SanityLive} = defineLive({
  client,
  // Required for showing draft content when the Sanity Presentation Tool is used, or to enable the Vercel Toolbar Edit Mode
  serverToken: token,
  // Required for stand-alone live previews. next-sanity only ships this token to
  // the browser during an active Draft Mode session — but because it CAN reach the
  // browser, SANITY_API_READ_TOKEN must be a **Viewer-scoped** token (read-only).
  // Never use an Editor/Deploy-scoped token here.
  browserToken: token,
})
