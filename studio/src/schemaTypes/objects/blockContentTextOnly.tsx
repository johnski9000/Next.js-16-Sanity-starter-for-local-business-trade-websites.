import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Text-only block content — paragraphs with inline link annotations only.
 * Used for body copy fields (service overview, area intro, project body)
 * where editors should be able to add in-body contextual links to other
 * pages, but not embed images or use headings/lists.
 *
 * Link annotation shape mirrors the standalone `link` object so the
 * frontend `ResolvedLink` renderer handles both consistently.
 */
export const blockContentTextOnly = defineType({
  title: 'Block Content (Text + Links)',
  name: 'blockContentTextOnly',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      // Paragraphs only — no headings, lists or block styles. This type backs
      // body copy (area intros, service overviews, FAQ answers) that also
      // flattens into JSON-LD, so editors get plain paragraphs + inline links.
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
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
                description:
                  'e.g. /services/woodwork-and-trim, /areas/didsbury, https://example.com',
                hidden: ({parent}) => parent?.linkType !== 'href' && parent?.linkType != null,
                validation: (Rule) =>
                  Rule.custom((value, context) => {
                    const parent = context.parent as {linkType?: string} | undefined
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
                validation: (Rule) =>
                  Rule.custom((value, context) => {
                    const parent = context.parent as {linkType?: string} | undefined
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
                validation: (Rule) =>
                  Rule.custom((value, context) => {
                    const parent = context.parent as {linkType?: string} | undefined
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
          },
        ],
      },
    }),
  ],
})
