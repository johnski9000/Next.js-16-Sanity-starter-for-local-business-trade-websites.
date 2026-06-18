'use client'

import {useState} from 'react'

import BlockRenderer from '@/app/components/BlockRenderer'
import {DESIGN_KEYS, DESIGNS, DEFAULT_DESIGN, designCssVars, type DesignKey} from '@/lib/themes'

// Chrome / forms / utility components (rendered directly, not via BlockRenderer)
import Header from '@/app/components/NavBar/Header'
import Footer from '@/app/components/Footer/Footer'
import QuoteForm from '@/app/components/sections/contact/QuoteForm'
import ContactForm from '@/app/components/sections/contact/ContactForm'

import {
  // A
  heroBannerSamples,
  heroCarouselSamples,
  trustBarSamples,
  problemSectionSamples,
  solutionSectionSamples,
  // B
  servicesOverviewSamples,
  pricingSectionSamples,
  whyChooseUsSamples,
  processSectionSamples,
  // C
  testimonialsSamples,
  faqSamples,
  ctaSamples,
  callToActionSamples,
  introOverviewSamples,
  infoSectionSamples,
  // D
  areasWeCoverSamples,
  beforeAfterSamples,
  blogSectionSamples,
  // page-builder blocks without internal variants
  serviceCardsSamples,
  mainServiceGridSamples,
  emergencyCtaStripSamples,
  gallerySamples,
  contactFormSamples,
  // chrome / forms props
  headerProps,
  footerProps,
  quoteFormProps,
  contactFormDirectProps,
} from './catalogue-data'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Sample = {label: string; block: any}

type Group = {
  blockType: string
  samples: Sample[]
}

// Every page-builder block group, in roughly the order pages use them.
const BLOCK_GROUPS: Group[] = [
  {blockType: 'heroBanner', samples: heroBannerSamples},
  {blockType: 'heroCarousel', samples: heroCarouselSamples},
  {blockType: 'trustBar', samples: trustBarSamples},
  {blockType: 'problemSection', samples: problemSectionSamples},
  {blockType: 'solutionSection', samples: solutionSectionSamples},
  {blockType: 'servicesOverview', samples: servicesOverviewSamples},
  {blockType: 'serviceCards', samples: serviceCardsSamples},
  {blockType: 'mainServiceGrid', samples: mainServiceGridSamples},
  {blockType: 'pricingSection', samples: pricingSectionSamples},
  {blockType: 'whyChooseUs', samples: whyChooseUsSamples},
  {blockType: 'processSection', samples: processSectionSamples},
  {blockType: 'testimonials', samples: testimonialsSamples},
  {blockType: 'faq', samples: faqSamples},
  {blockType: 'cta', samples: ctaSamples},
  {blockType: 'callToAction', samples: callToActionSamples},
  {blockType: 'emergencyCtaStrip', samples: emergencyCtaStripSamples},
  {blockType: 'introOverviewSection', samples: introOverviewSamples},
  {blockType: 'infoSection', samples: infoSectionSamples},
  {blockType: 'areasWeCover', samples: areasWeCoverSamples},
  {blockType: 'beforeAfter', samples: beforeAfterSamples},
  {blockType: 'blogSection', samples: blogSectionSamples},
  {blockType: 'gallery', samples: gallerySamples},
  {blockType: 'contactForm', samples: contactFormSamples},
]

function VariantLabel({blockType, variant}: {blockType: string; variant: string}) {
  return (
    <div className="border-t-4 border-gray-900 bg-gray-100 px-4 py-2 font-mono text-sm text-gray-800">
      <span className="font-bold text-gray-950">{blockType}</span>
      <span className="text-gray-500"> — variant: </span>
      <span className="font-semibold text-blue-700">{variant}</span>
    </div>
  )
}

function SectionHeading({children}: {children: React.ReactNode}) {
  return (
    <h2 className="mt-16 mb-2 border-b border-gray-300 pb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
      {children}
    </h2>
  )
}

export default function Catalogue() {
  const [preset, setPreset] = useState<DesignKey>(DEFAULT_DESIGN)

  // global running index so each BlockRenderer gets a unique index
  let i = 0

  return (
    <div>
      {/* Sticky toolbar (outside the themed wrapper so its own colours stay stable) */}
      <div className="sticky top-0 z-[100] flex flex-wrap items-center gap-2 border-b border-gray-300 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <span className="mr-2 text-sm font-bold text-gray-900">Design preset:</span>
        {DESIGN_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreset(key)}
            className={[
              'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
              preset === key
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            {DESIGNS[key].label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">
          Each block sets its own light/dark <code>theme</code>; the preset recolours brand/accent tokens.
        </span>
      </div>

      {/* Themed catalogue body — designCssVars injects the CSS variables that
          bg-brand / text-blue / text-blue-deep read from. */}
      <div style={designCssVars(preset)}>
        <header className="bg-gray-950 px-4 py-10 text-center text-white">
          <h1 className="text-3xl font-bold">Component Catalogue</h1>
          <p className="mt-2 text-gray-400">
            Every page-builder block + variant, plus chrome, forms &amp; utility components. Internal — noindex.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Images are intentionally omitted so each component shows its graceful empty-image state.
          </p>
        </header>

        {/* ---------- Page-builder blocks (via BlockRenderer) ---------- */}
        <SectionHeading>Page-builder blocks</SectionHeading>

        {BLOCK_GROUPS.map((group) => (
          <section key={group.blockType} className="mb-8">
            {group.samples.map((sample) => {
              const index = i++
              return (
                <div key={`${group.blockType}-${sample.label}-${index}`} className="mb-6">
                  <VariantLabel blockType={group.blockType} variant={sample.label} />
                  <BlockRenderer block={sample.block} index={index} pageId="test" pageType="page" />
                </div>
              )
            })}
          </section>
        ))}

        {/* ---------- Chrome, forms & utility (rendered directly) ---------- */}
        <SectionHeading>Chrome, forms &amp; utility</SectionHeading>

        <div className="mb-6">
          <VariantLabel blockType="Header" variant="default (logo omitted → siteTitle fallback)" />
          {/* Header is position:fixed; wrap in a tall relative box so it is visible in-flow here. */}
          <div className="relative h-24 overflow-hidden border border-gray-200">
            <Header {...(headerProps as any)} />
          </div>
        </div>

        <div className="mb-6">
          <VariantLabel blockType="QuoteForm" variant="default (two-step; async services)" />
          <div className="bg-gray-100 px-4 py-8">
            <div className="mx-auto max-w-2xl">
              <QuoteForm {...(quoteFormProps as any)} />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <VariantLabel blockType="ContactForm" variant="default (two-panel)" />
          <ContactForm {...(contactFormDirectProps as any)} />
        </div>

        <div className="mb-6">
          <VariantLabel blockType="Footer" variant="default (auto-generated columns)" />
          <Footer {...(footerProps as any)} />
        </div>
      </div>
    </div>
  )
}
