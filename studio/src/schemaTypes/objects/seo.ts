import {defineField, defineType} from 'sanity'

/**
 * Shared SEO object embedded by every routable document
 * (page, service, area, project, serviceArea).
 *
 * Field names are stable — GROQ projections and the frontend metadata
 * helper read this exact shape everywhere. Extend here, not per-doc.
 */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Meta Title',
      type: 'string',
      description: 'Recommended: 50–60 characters.',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return true
          if (value.length > 70) return 'Try to keep the title under ~70 characters'
          return true
        }),
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Recommended: 140–160 characters.',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return true
          if (value.length > 180) return 'Try to keep the description under ~180 characters'
          return true
        }),
    }),

    defineField({
      name: 'canonical',
      title: 'Canonical URL (optional)',
      type: 'url',
      description:
        'Leave blank to use the default URL based on slug. Use only if you know you need a custom canonical.',
    }),

    defineField({
      name: 'noIndex',
      title: 'No index',
      type: 'boolean',
      initialValue: false,
      description: 'Prevents search engines from indexing this page.',
    }),
    defineField({
      name: 'noFollow',
      title: 'No follow',
      type: 'boolean',
      initialValue: false,
      description: 'Tells search engines not to follow links on this page.',
    }),

    defineField({
      name: 'hideFromSitemap',
      title: 'Hide from sitemap',
      type: 'boolean',
      initialValue: false,
      description: 'Useful for thank-you pages, experiments, or temporary landing pages.',
    }),

    defineField({
      name: 'ogImage',
      title: 'Social Share Image (OG)',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Important for accessibility and SEO.',
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
      name: 'ogTitle',
      title: 'OG Title (optional)',
      type: 'string',
      description: 'Overrides Meta Title for social sharing. Leave blank to use Meta Title.',
    }),
    defineField({
      name: 'ogDescription',
      title: 'OG Description (optional)',
      type: 'text',
      rows: 2,
      description:
        'Overrides Meta Description for social sharing. Leave blank to use Meta Description.',
    }),

    defineField({
      name: 'keywords',
      title: 'Keywords (optional)',
      type: 'array',
      of: [{type: 'string'}],
      description:
        'Not a major ranking factor today, but can be useful for internal consistency.',
    }),
  ],
})
