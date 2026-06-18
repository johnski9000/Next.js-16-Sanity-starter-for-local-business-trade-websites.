import React from 'react'

import Cta from '@/app/components/sections/cta/Cta'
import Info from '@/app/components/sections/intro/InfoSection'
import HeroBanner from '@/app/components/sections/hero/HeroBanner'
import HeroCarousel from '@/app/components/sections/hero/HeroCarousel'
import TrustBar from '@/app/components/sections/trust/TrustBar'
import ProblemSection from '@/app/components/sections/problem/ProblemSection'
import SolutionSection from '@/app/components/sections/solution/SolutionSection'
import ServicesOverview from '@/app/components/sections/services/ServicesOverview'
import PricingSection from '@/app/components/sections/pricing/PricingSection'
import CtaSection from '@/app/components/sections/cta/CtaSection'
import EmergencyCtaStrip from '@/app/components/sections/cta/EmergencyCtaStrip'
import ServiceCards from '@/app/components/sections/services/ServiceCards'
import WhyChooseUs from '@/app/components/sections/why-choose-us/WhyChooseUs'
import AreasWeCover from '@/app/components/sections/areas/AreasWeCover'
import FAQ from '@/app/components/sections/faq/FAQ'
import IntroOverviewSection from '@/app/components/sections/intro/IntroOverviewSection'
import MainServiceGrid from '@/app/components/sections/services/MainServiceGrid'
import ProcessSection from '@/app/components/sections/process/ProcessSection'
import ContactForm from '@/app/components/sections/contact/ContactForm'
import Testimonials from '@/app/components/sections/testimonials/Testimonials'
import Gallery from '@/app/components/sections/gallery/Gallery'
import BeforeAfter from '@/app/components/sections/gallery/BeforeAfter'
import BlogSection from '@/app/components/sections/blog/BlogSection'
import {dataAttr} from '@/sanity/lib/utils'
import {PageBuilderSection} from '@/sanity/lib/types'

type BlockProps = {
  index: number
  block: PageBuilderSection
  pageId: string
  pageType: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Blocks: Record<string, React.FC<any>> = {
  callToAction: Cta,
  infoSection: Info,
  heroBanner: HeroBanner,
  heroCarousel: HeroCarousel,
  trustBar: TrustBar,
  problemSection: ProblemSection,
  solutionSection: SolutionSection,
  servicesOverview: ServicesOverview,
  pricingSection: PricingSection,
  cta: CtaSection,
  emergencyCtaStrip: EmergencyCtaStrip,
  serviceCards: ServiceCards,
  whyChooseUs: WhyChooseUs,
  areasWeCover: AreasWeCover,
  faq: FAQ,
  testimonials: Testimonials,
  introOverviewSection: IntroOverviewSection,
  mainServiceGrid: MainServiceGrid,
  processSection: ProcessSection,
  contactForm: ContactForm,
  gallery: Gallery,
  beforeAfter: BeforeAfter,
  blogSection: BlogSection,
}

export default function BlockRenderer({block, index, pageId, pageType}: BlockProps) {
  if (typeof Blocks[block._type] !== 'undefined') {
    return (
      <div
        key={block._key}
        data-sanity={dataAttr({
          id: pageId,
          type: pageType,
          path: `pageBuilder[_key=="${block._key}"]`,
        }).toString()}
      >
        {React.createElement(Blocks[block._type], {
          key: block._key,
          block: block,
          index: index,
          pageId: pageId,
          pageType: pageType,
        })}
      </div>
    )
  }

  return React.createElement(
    () => (
      <div className="w-full bg-gray-100 text-center text-gray-500 p-20 rounded">
        A &ldquo;{block._type}&rdquo; block hasn&apos;t been created
      </div>
    ),
    {key: block._key},
  )
}
