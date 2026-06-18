import type {Metadata} from 'next'
import type {ReactNode} from 'react'

import {currentTenant, getClient, buildSafe} from '@/sanity/lib/tenant-client'
import {settingsQuery} from '@/sanity/lib/queries'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How your personal data is collected, used and protected when you use this website.',
}

function H({children}: {children: ReactNode}) {
  return <h2 className="mt-10 text-xl font-bold text-gray-900">{children}</h2>
}
function P({children}: {children: ReactNode}) {
  return <p className="mt-3 text-[15px] leading-relaxed text-neutral">{children}</p>
}

/**
 * Privacy policy. Renders the business as the data controller (name + contact
 * pulled from Sanity settings) and the website provider as processor. A sensible
 * UK-GDPR starting template — review it for your own circumstances.
 */
export default async function PrivacyPage() {
  const tenant = await currentTenant()
  const settings = (await buildSafe(getClient(tenant).fetch(settingsQuery), null)) as
    | {
        branding?: {siteTitle?: string}
        structuredData?: {organization?: {contact?: {email?: string; phone?: string}}}
      }
    | null

  const business = settings?.branding?.siteTitle || 'this business'
  const contact = settings?.structuredData?.organization?.contact || {}
  const email = contact.email
  const phone = contact.phone
  const site = tenant.siteUrl || ''

  return (
    <section className="py-16">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-gray-400">
          This policy explains how {business} handles your personal data.
        </p>

        <H>Who we are</H>
        <P>
          {business} is the “data controller” responsible for the personal data collected through
          {site ? ` ${site}` : ' this website'}. This website is built and maintained on our behalf
          by our website provider, who acts as a “data processor”. If you have any questions about
          this policy or your data, contact us
          {email ? (
            <>
              {' '}at{' '}
              <a href={`mailto:${email}`} className="font-medium text-blue-deep underline">
                {email}
              </a>
            </>
          ) : (
            ' using the details on our contact page'
          )}
          {phone ? (
            <>
              {' '}or on{' '}
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="font-medium text-blue-deep underline">
                {phone}
              </a>
            </>
          ) : null}
          .
        </P>

        <H>What we collect</H>
        <P>
          When you submit our contact or quote form we collect the details you provide — your name,
          email address, phone number, the service you’re interested in, and any information you
          include in your message. Our servers also process basic technical data such as your IP
          address, which we use only to protect the form against spam and abuse.
        </P>

        <H>How we use it &amp; our lawful basis</H>
        <P>
          We use your details solely to respond to your enquiry, provide a quote, and arrange any
          work you ask us to carry out. Our lawful basis is your consent (which you give by ticking
          the box and submitting the form) and our legitimate interest in responding to genuine
          enquiries. We do not use your details for marketing without asking you separately, and we
          never sell your data.
        </P>

        <H>Who we share it with</H>
        <P>
          To run this website and handle your enquiry we use a small number of trusted providers
          (“sub-processors”), each of which only processes the data needed to provide their service,
          under appropriate safeguards:
        </P>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] text-neutral">
          <li>Sanity — content &amp; enquiry-data hosting</li>
          <li>Vercel — website hosting</li>
          <li>Google (Gmail) — email delivery of enquiries</li>
          <li>Cloudflare — bot/spam protection on the form (Turnstile)</li>
          <li>Upstash — rate limiting (abuse protection)</li>
          <li>Sentry — error monitoring</li>
          <li>Google Analytics — site analytics (only if you accept cookies)</li>
        </ul>
        <P>We don’t sell your data or share it with anyone else unless required by law.</P>

        <H>How long we keep it</H>
        <P>
          We keep enquiry details only for as long as needed to deal with your request and to
          provide any services you go on to ask for, plus a reasonable period for our own records
          and legal obligations. After that we delete or anonymise it. You can ask us to delete your
          data sooner at any time (see “Your rights”).
        </P>

        <H>Your rights</H>
        <P>
          Under UK data protection law you have the right to access the personal data we hold about
          you, to have it corrected or erased, to restrict or object to how we use it, and to data
          portability. To exercise any of these rights, contact us
          {email ? (
            <>
              {' '}at{' '}
              <a href={`mailto:${email}`} className="font-medium text-blue-deep underline">
                {email}
              </a>
            </>
          ) : (
            ' using our contact details above'
          )}
          . We’ll respond within one month.
        </P>

        <H>Cookies &amp; spam protection</H>
        <P>
          This site uses essential cookies needed for it to work and to keep the contact form secure
          (for example Cloudflare Turnstile, which helps us tell humans from bots). With your consent
          we also use privacy-friendly analytics cookies (Google Analytics, with IP anonymisation) to
          understand how the site is used — these load only after you accept the cookie banner, and
          you can decline. We don’t use advertising trackers.
        </P>

        <H>Complaints</H>
        <P>
          If you’re unhappy with how we’ve handled your data, please contact us first so we can put
          it right. You also have the right to complain to the UK’s Information Commissioner’s Office
          (ICO) at{' '}
          <a
            href="https://ico.org.uk/make-a-complaint/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-deep underline"
          >
            ico.org.uk
          </a>
          .
        </P>

        <H>Changes to this policy</H>
        <P>
          We may update this policy from time to time. The latest version will always be available
          on this page.
        </P>
      </div>
    </section>
  )
}
