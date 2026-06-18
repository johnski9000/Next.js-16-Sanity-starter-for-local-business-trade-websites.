import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, ThListIcon} from '@sanity/icons'

export const serviceCards = defineType({
  name: 'serviceCards',
  title: 'Service Cards',
  type: 'object',
  icon: ThListIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
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
      name: 'cards',
      title: 'Cards',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'serviceCard',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
            }),
            defineField({
              name: 'image',
              title: 'Image',
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
              name: 'button',
              title: 'Button',
              type: 'button',
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'description',
              media: 'image.asset',
            },
            prepare({title, subtitle, media}) {
              return {title: title || 'Service Card', subtitle, media}
            },
          },
        }),
      ],
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
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      description: 'Number of columns in the card grid',
      options: {
        list: [
          {title: '2', value: 2},
          {title: '3', value: 3},
          {title: '4', value: 4},
        ],
        layout: 'radio',
      },
      initialValue: 3,
      group: 'designSystem',
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      cards: 'cards',
    },
    prepare({title, cards}) {
      const n = Array.isArray(cards) ? cards.length : 0
      return {
        title: title || 'Service Cards',
        subtitle: `${n} card${n === 1 ? '' : 's'}`,
        media: ThListIcon,
      }
    },
  },
})