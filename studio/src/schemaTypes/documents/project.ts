import {defineField, defineType, defineArrayMember} from 'sanity'
import {ImageIcon} from '@sanity/icons'

const altField = defineField({
  name: 'alt',
  title: 'Alt Text',
  type: 'string',
  validation: (Rule) =>
    Rule.custom((alt, ctx) => {
      const hasAsset = Boolean((ctx.parent as any)?.asset?._ref)
      if (hasAsset && !alt) return 'Alt text is required when an image is set'
      return true
    }),
})

const imageField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    fields: [altField],
  })

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: ImageIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'media', title: 'Media'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Bare slug — route prefix /projects/ is added automatically.',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      description: 'Which service(s) this project showcases. Drives service-page galleries.',
      validation: (Rule) => Rule.required().min(1),
      group: 'content',
      of: [defineArrayMember({type: 'reference', to: [{type: 'service'}]})],
    }),
    defineField({
      name: 'area',
      title: 'Area',
      type: 'reference',
      to: [{type: 'area'}],
      description:
        'Where the job was. Link to an area doc when it exists (required for service×area combo pages).',
      group: 'content',
    }),
    defineField({
      name: 'locationLabel',
      title: 'Location Label',
      type: 'string',
      description:
        'Display label when there is no area doc (e.g. "Stretford"). Used for non-launch areas.',
      group: 'content',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
      description: 'Short blurb for project cards and related-content.',
      validation: (Rule) => Rule.required().max(220),
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: 'Case Study',
      type: 'blockContentTextOnly',
      description: 'The brief, what was done, materials/finishes, outcome.',
      group: 'content',
    }),
    defineField({
      name: 'completedAt',
      title: 'Completed',
      type: 'date',
      group: 'content',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Surface on the homepage / featured rails.',
      initialValue: false,
      group: 'content',
    }),
    defineField({
      ...imageField('coverImage', 'Cover Image'),
      group: 'media',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          name: 'galleryImage',
          options: {hotspot: true},
          fields: [
            altField,
            defineField({name: 'caption', title: 'Caption', type: 'string'}),
          ],
          preview: {select: {title: 'caption', subtitle: 'alt', media: 'asset'}},
        }),
      ],
    }),
    defineField({
      name: 'beforeAfter',
      title: 'Before / After Pairs',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'beforeAfterPair',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string'}),
            imageField('beforeImage', 'Before Image'),
            imageField('afterImage', 'After Image'),
          ],
          preview: {select: {title: 'label', media: 'afterImage'}},
        }),
      ],
    }),
    defineField({
      name: 'testimonial',
      title: 'Client Testimonial',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'quote', title: 'Quote', type: 'text', rows: 4}),
        defineField({name: 'authorName', title: 'Author Name', type: 'string'}),
        defineField({
          name: 'rating',
          title: 'Rating',
          type: 'number',
          validation: (Rule) => Rule.min(1).max(5).integer(),
          options: {list: [1, 2, 3, 4, 5], layout: 'radio'},
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      options: {collapsible: true, collapsed: true},
      group: 'seo',
    }),
  ],
  preview: {
    select: {title: 'title', area: 'area.name', location: 'locationLabel', media: 'coverImage'},
    prepare({title, area, location, media}) {
      return {title: title || 'Project', subtitle: area || location || undefined, media}
    },
  },
})
