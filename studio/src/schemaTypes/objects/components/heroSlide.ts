import {defineField, defineType} from 'sanity'

/**
 * A single hero carousel slide. Shared by the standalone `heroCarousel` block
 * and the `heroBanner` block's `carousel` variant, so the slide shape has one
 * source of truth.
 */
export const heroSlide = defineType({
  name: 'heroSlide',
  title: 'Slide',
  type: 'object',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'primaryButton',
      title: 'Primary Button',
      type: 'button',
    }),
    defineField({
      name: 'secondaryButton',
      title: 'Secondary Button',
      type: 'button',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule) =>
            Rule.custom((alt, ctx) => {
              const hasAsset = Boolean((ctx.parent as any)?.asset?._ref)
              if (hasAsset && !alt) return 'Alt text is required when an image is set'
              return true
            }),
        }),
      ],
    }),
    defineField({
      name: 'theme',
      title: 'Slide Theme',
      type: 'string',
      options: {
        list: [
          {title: 'Dark', value: 'dark'},
          {title: 'Light', value: 'light'},
        ],
        layout: 'radio',
      },
      initialValue: 'dark',
    }),
  ],
  preview: {
    select: {title: 'heading', media: 'backgroundImage.asset'},
    prepare({title, media}) {
      return {title: title || 'Slide', media}
    },
  },
})
