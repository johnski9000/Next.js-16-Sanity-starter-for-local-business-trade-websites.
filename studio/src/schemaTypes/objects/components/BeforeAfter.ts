import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, TransferIcon} from '@sanity/icons'

const imageField = (name: string, title: string) =>
  defineField({
    name,
    title,
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
  })

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? 'grid')

export const beforeAfter = defineType({
  name: 'beforeAfter',
  title: 'Before & After',
  type: 'object',
  icon: TransferIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
    defineField({
      name: 'variant',
      title: 'Layout Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Grid — grid of draggable sliders', value: 'grid'},
          {title: 'Featured — one large slider', value: 'featured'},
          {title: 'Featured + thumbnails — slider with a project rail', value: 'thumbs'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
      group: 'content',
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
      group: 'content',
    }),
    defineField({
      name: 'items',
      title: 'Projects',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'beforeAfterItem',
          fields: [
            defineField({
              name: 'title',
              title: 'Project Title',
              type: 'string',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            }),
            imageField('beforeImage', 'Before Image'),
            imageField('afterImage', 'After Image'),
          ],
          preview: {
            select: {title: 'title', subtitle: 'description', media: 'afterImage.asset'},
            prepare({title, subtitle, media}) {
              return {title: title || 'Before & After', subtitle, media}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'columns',
      title: 'Columns (Grid)',
      type: 'number',
      options: {
        list: [
          {title: '2', value: 2},
          {title: '3', value: 3},
        ],
        layout: 'radio',
      },
      initialValue: 2,
      group: 'designSystem',
      hidden: only('grid'),
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'string',
      options: {
        list: [
          {title: 'Light', value: 'light'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
      },
      initialValue: 'light',
      group: 'designSystem',
    }),
  ],
  preview: {
    select: {title: 'heading', items: 'items'},
    prepare({title, items}) {
      const n = Array.isArray(items) ? items.length : 0
      return {
        title: title || 'Before & After',
        subtitle: `${n} project${n === 1 ? '' : 's'}`,
        media: TransferIcon,
      }
    },
  },
})
