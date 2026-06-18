import {defineField, defineType} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, DocumentTextIcon} from '@sanity/icons'

export const blogSection = defineType({
  name: 'blogSection',
  title: 'Blog Section',
  type: 'object',
  icon: DocumentTextIcon,
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
          {title: 'Grid — 3-card grid', value: 'grid'},
          {title: 'Featured — lead post + recent list', value: 'featured'},
          {title: 'List — minimal text index', value: 'list'},
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
      name: 'maxPosts',
      title: 'Number of Posts',
      type: 'number',
      description: 'How many of the most recent posts to show.',
      options: {
        list: [
          {title: '2', value: 2},
          {title: '3', value: 3},
          {title: '4', value: 4},
          {title: '6', value: 6},
        ],
        layout: 'radio',
      },
      initialValue: 3,
      group: 'content',
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
    select: {title: 'heading'},
    prepare({title}) {
      return {
        title: title || 'Blog Section',
        subtitle: 'Latest posts',
        media: DocumentTextIcon,
      }
    },
  },
})
