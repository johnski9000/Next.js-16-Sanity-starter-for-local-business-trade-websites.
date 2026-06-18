import {person} from './documents/person'
import {page} from './documents/page'
import {post} from './documents/post'
import {service} from './documents/service'
import {area} from './documents/area'
import {project} from './documents/project'
import {serviceArea} from './documents/serviceArea'
import {lead} from './documents/lead'
import {navigation} from './documents/navigation'
import {footer} from './documents/footer'
import {callToAction} from './objects/callToAction'
import {infoSection} from './objects/infoSection'
import {settings} from './singletons/settings'
import {link} from './objects/link'
import {seo} from './objects/seo'
import {blockContent} from './objects/blockContent'
import button from './objects/button'
import {blockContentTextOnly} from './objects/blockContentTextOnly'
import {navCta, navItem} from './objects/navigation'
import {footerColumn, legalLink, socialLink} from './objects/footer'
import {heroSlide} from './objects/components/heroSlide'
import {heroBanner} from './objects/components/HeroBanner'
import {heroCarousel} from './objects/components/HeroCarousel'
import {trustBar} from './objects/components/TrustBar'
import {problemSection} from './objects/components/ProblemSection'
import {solutionSection} from './objects/components/SolutionSection'
import {servicesOverview} from './objects/components/ServicesOverview'
import {pricingSection} from './objects/components/PricingSection'
import {testimonials} from './objects/components/Testimonials'
import {serviceCards} from './objects/components/ServiceCards'
import {whyChooseUs} from './objects/components/WhyChooseUs'
import {emergencyCtaStrip} from './objects/components/EmergencyCtaStrip'
import {areasWeCover} from './objects/components/AreasWeCover'
import {faq} from './objects/components/Faq'
import {cta} from './objects/components/Cta'
import {introOverviewSection} from './objects/components/IntroOverviewSection'
import {mainServiceGrid} from './objects/components/MainServiceGrid'
import {processSection} from './objects/components/ProcessSection'
import {contactForm} from './objects/components/ContactForm'
import {gallery} from './objects/components/Gallery'
import {beforeAfter} from './objects/components/BeforeAfter'
import {blogSection} from './objects/components/BlogSection'

// Export an array of all the schema types.  This is used in the Sanity Studio configuration. https://www.sanity.io/docs/studio/schema-types

export const schemaTypes = [
  navItem,
  navCta,
  footerColumn,
  socialLink,
  legalLink,
  // Singletons
  settings,
  // Documents
  navigation,
  footer,
  page,
  post,
  person,
  service,
  area,
  project,
  serviceArea,
  lead,
  // Objects
  button,
  blockContent,
  blockContentTextOnly,
  infoSection,
  callToAction,
  link,
  seo,
  heroSlide,
  heroBanner,
  heroCarousel,
  trustBar,
  problemSection,
  solutionSection,
  servicesOverview,
  pricingSection,
  testimonials,
  serviceCards,
  whyChooseUs,
  emergencyCtaStrip,
  areasWeCover,
  faq,
  cta,
  introOverviewSection,
  mainServiceGrid,
  processSection,
  contactForm,
  gallery,
  beforeAfter,
  blogSection,
]
