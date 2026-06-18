import {defineField, defineType} from 'sanity'
import {DocumentIcon} from '@sanity/icons'

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      validation: (Rule) => Rule.required(),
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      options: {collapsible: true, collapsed: true},
    }),

    defineField({
      name: 'pageBuilder',
      title: 'Page builder',
      type: 'array',
      of: [{type: 'heroBanner'}, {type: 'heroCarousel'}, {type: 'trustBar'}, {type: 'problemSection'}, {type: 'solutionSection'}, {type: 'servicesOverview'}, {type: 'pricingSection'}, {type: 'callToAction'}, {type: 'infoSection'}, {type: 'testimonials'}, {type: 'serviceCards'}, {type: 'whyChooseUs'}, {type: 'emergencyCtaStrip'}, {type: 'areasWeCover'}, {type: 'faq'}, {type: 'cta'}, {type: 'introOverviewSection'}, {type: 'mainServiceGrid'}, {type: 'processSection'}, {type: 'contactForm'}, {type: 'gallery'}, {type: 'beforeAfter'}, {type: 'blogSection'}],
      options: {
        insertMenu: {
          views: [
            {
              name: 'grid',
              previewImageUrl: (schemaTypeName) =>
                `/static/page-builder-thumbnails/${schemaTypeName}.webp`,
            },
          ],
        },
      },
    }),
  ],
})
