import {defineField, defineType} from 'sanity'

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      initialValue: 'href',
      options: {
        list: [
          {title: 'URL', value: 'href'},
          {title: 'Page', value: 'page'},
          {title: 'Post', value: 'post'},
        ],
        layout: 'radio',
      },
    }),

    defineField({
      name: 'href',
      title: 'URL',
      type: 'string',
      description: 'e.g. https://example.com, /services#section, tel:07456937237, mailto:info@example.com',
      hidden: ({parent}) => parent?.linkType !== 'href',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as any
          if (parent?.linkType !== 'href') return true
          if (!value) return true
          if (/^(https?:\/\/|tel:|mailto:|\/|#)/.test(value)) return true
          return 'Must start with https://, http://, /, #, tel:, or mailto:'
        }),
    }),

    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{type: 'page'}],
      hidden: ({parent}) => parent?.linkType !== 'page',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as any
          if (parent?.linkType === 'page' && !value) return 'Page reference is required'
          return true
        }),
    }),

    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{type: 'post'}],
      hidden: ({parent}) => parent?.linkType !== 'post',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as any
          if (parent?.linkType === 'post' && !value) return 'Post reference is required'
          return true
        }),
    }),

    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
