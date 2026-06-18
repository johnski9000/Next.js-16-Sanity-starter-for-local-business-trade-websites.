/**
 * Runnable seed example. Copy/adapt this file for real seeding.
 *
 *   cd studio
 *   npx sanity exec scripts/seed.example.ts --with-user-token
 *   # or: npm run seed
 *
 * Demonstrates a full page assembled from components with props, complete
 * SEO metadata, plus the settings / navigation / footer singletons.
 *
 * ═══ AI AGENT — adapt for each client ═══
 * Replace every "[DEV]" / example value with real client data.
 * See structure/optimal-page-structures.md for component ordering.
 * See setup.md §6 for per-page word count targets and content depth.
 * FAQ answers: 50-100 words minimum, never one-liners.
 */
import {
  createPage,
  upsertSettings,
  upsertNavigation,
  upsertFooter,
  heroBanner,
  introOverviewSection,
  serviceCards,
  whyChooseUs,
  testimonials,
  faq,
  emergencyCtaStrip,
  contactForm,
  cta,
} from './seed'

async function main() {
  // --- Site-wide settings ------------------------------------------------
  await upsertSettings({
    branding: {siteTitle: 'SC Plumbing & Heating'},
    seo: {
      title: 'SC Plumbing & Heating | Liverpool Plumbers & Gas Engineers',
      description:
        'Trusted local plumbing, gas and heating services across Liverpool. Gas Safe registered, fast response, free quotes.',
      metadataBase: 'https://www.sc-plumbingandheating.co.uk',
      twitterHandle: '@scplumbing',
      robots: {index: true, follow: true},
    },
  })

  await upsertNavigation({
    items: [
      {label: 'Home', href: '/'},
      {label: 'About', href: '/about'},
      {
        kind: 'dropdown',
        label: 'Services',
        link: {href: '/services'},
        children: [
          {label: 'Plumbing Services', href: '/services/plumbing-services'},
          {label: 'Gas Services', href: '/services/gas-services'},
          {label: 'Heating Services', href: '/services/heating-services'},
        ],
      },
      {label: 'FAQ', href: '/faq'},
      {label: 'Contact', href: '/contact'},
    ],
    cta: {label: 'Call 07456 937237', href: 'tel:07456937237', variant: 'primary'},
  })

  await upsertFooter({
    columns: [
      {
        title: 'Services',
        links: [
          {label: 'Plumbing', href: '/services/plumbing-services'},
          {label: 'Gas', href: '/services/gas-services'},
          {label: 'Heating', href: '/services/heating-services'},
        ],
      },
      {
        title: 'Company',
        links: [
          {label: 'About', href: '/about'},
          {label: 'Contact', href: '/contact'},
        ],
      },
    ],
    social: [{platform: 'Facebook', url: 'https://facebook.com/scplumbing'}],
    legal: [{label: 'Privacy Policy', href: '/privacy'}],
    copyright: '© SC Plumbing & Heating. Gas Safe Registered, Liverpool.',
  })

  // --- A page assembled from components ----------------------------------
  await createPage({
    name: 'Homepage',
    slug: '/',
    seo: {
      title: 'SC Plumbing & Heating | Liverpool Plumbers & Gas Engineers',
      description:
        'Reliable plumbing, gas and heating services across Liverpool. Emergency callouts, boiler installs, free quotes. Gas Safe registered.',
      keywords: ['plumber liverpool', 'gas engineer liverpool', 'boiler repair liverpool'],
    },
    pageBuilder: [
      heroBanner({
        heading: 'Reliable Plumbing & Heating Services Across Liverpool',
        subheading: 'Emergency callouts, boiler installs, gas safety checks and more.',
      }),
      introOverviewSection({
        heading: 'Your Local Plumbing, Gas & Heating Experts',
      }),
      serviceCards({
        cards: [
          {
            title: 'Plumbing Services',
            description: 'Leaks, repairs, bathrooms and pipework.',
            button: {text: 'View Plumbing', href: '/services/plumbing-services'},
          },
          {
            title: 'Gas Services',
            description: 'Safety checks, installs and gas repairs.',
            button: {text: 'View Gas', href: '/services/gas-services'},
          },
          {
            title: 'Heating Services',
            description: 'Boilers, radiators and central heating.',
            button: {text: 'View Heating', href: '/services/heating-services'},
          },
        ],
      }),
      whyChooseUs({
        reasons: [
          {title: 'Fast Local Response', description: 'Quick callouts across Liverpool.'},
          {title: 'Gas Safe Registered', description: 'Qualified, certified engineers.'},
          {title: 'Honest Pricing', description: 'Transparent quotes, no hidden costs.'},
        ],
      }),
      testimonials({
        items: [
          {
            quote: 'Outstanding emergency service — arrived quickly and sorted it fast.',
            authorName: 'Bianca M.',
            authorLocation: 'Liverpool',
            rating: 5,
          },
        ],
      }),
      faq({
        items: [
          {
            question: 'Do you cover all areas of Liverpool?',
            answer: 'Yes — we cover Liverpool and all surrounding areas.',
          },
          {
            question: 'Do you offer emergency callouts?',
            answer: 'Yes, we offer fast-response emergency plumbing and heating.',
          },
        ],
      }),
      emergencyCtaStrip(),
      contactForm(),
      cta(),
    ],
  })

  // eslint-disable-next-line no-console
  console.log('\nSeed complete.')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
