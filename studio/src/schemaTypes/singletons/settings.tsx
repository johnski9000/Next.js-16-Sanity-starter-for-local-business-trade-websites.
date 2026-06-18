import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import type {Settings} from '../../../sanity.types'

export const settings = defineType({
  name: 'settings',
  title: 'Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'branding',
      title: 'Branding',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: 'siteTitle',
          title: 'Site Title',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'logo',
          title: 'Logo',
          type: 'image',
          options: {hotspot: true},
        }),
        defineField({
          name: 'whatsappNumber',
          title: 'WhatsApp Number',
          type: 'string',
          description:
            'International format without spaces or +, e.g. 447700000000. Leave blank to hide the floating WhatsApp button.',
        }),
      ],
    }),

    defineField({
      name: 'seo',
      title: 'SEO Defaults',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: 'title',
          title: 'Default Title',
          type: 'string',
          description: 'Used when a page does not provide its own meta title.',
        }),
        defineField({
          name: 'description',
          title: 'Default Description',
          type: 'text',
          rows: 3,
          description: 'Used when a page does not provide its own meta description.',
        }),

        defineField({
          name: 'metadataBase',
          title: 'Site URL (metadataBase)',
          type: 'url',
          description: 'Example: https://www.example.com',
          validation: (rule) => rule.uri({scheme: ['http', 'https']}),
        }),

        defineField({
          name: 'ogImage',
          title: 'Default Open Graph Image',
          type: 'image',
          description: 'Fallback social share image.',
          options: {
            hotspot: true,
            aiAssist: {imageDescriptionField: 'alt'},
          },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternative text',
              type: 'string',
              validation: (rule) =>
                rule.custom((alt, context) => {
                  const parent = context.parent as any
                  if (parent?.asset?._ref && !alt) return 'Required'
                  return true
                }),
            }),
          ],
        }),

        // ✅ optional but useful
        defineField({
          name: 'twitterHandle',
          title: 'Twitter/X handle (optional)',
          type: 'string',
          description: 'Example: @yourbusiness',
        }),

        defineField({
          name: 'robots',
          title: 'Robots defaults',
          type: 'object',
          options: {collapsible: true, collapsed: true},
          fields: [
            defineField({
              name: 'index',
              title: 'Index by default',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'follow',
              title: 'Follow links by default',
              type: 'boolean',
              initialValue: true,
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'structuredData',
      title: 'Structured Data (Schema.org)',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({
          name: 'enabled',
          title: 'Enable schema output',
          type: 'boolean',
          initialValue: true,
        }),

        defineField({
          name: 'language',
          title: 'Language',
          type: 'string',
          initialValue: 'en-GB',
          description: 'Example: en-GB',
        }),

        // ✅ WebSite inputs
        defineField({
          name: 'website',
          title: 'WebSite',
          type: 'object',
          options: {collapsible: true, collapsed: true},
          fields: [
            defineField({
              name: 'name',
              title: 'Website name',
              type: 'string',
              description: 'Usually the same as the business name',
            }),
            defineField({
              name: 'url',
              title: 'Website URL',
              type: 'url',
              validation: (r) => r.required(),
              description: 'Example: https://www.example.com',
            }),
            defineField({
              name: 'enableSearchAction',
              title: 'Enable SearchAction',
              type: 'boolean',
              initialValue: false,
              description: 'Enable only if you actually have a working /search route.',
            }),
            defineField({
              name: 'searchUrlTemplate',
              title: 'Search URL template',
              type: 'string',
              hidden: ({parent}) => !parent?.enableSearchAction,
              description: 'Example: https://example.com/search?q={search_term_string}',
            }),
          ],
        }),

        // ✅ Organization / ProfessionalService inputs
        defineField({
          name: 'organization',
          title: 'Organization / Professional Service',
          type: 'object',
          fields: [
            defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'legalName', type: 'string'}),
            defineField({
              name: 'url',
              type: 'url',
              validation: (r) => r.required(),
              description: 'Must match Website URL for consistent @id links.',
            }),
            defineField({name: 'description', type: 'text', rows: 3}),
            defineField({name: 'slogan', type: 'string'}),
            defineField({name: 'foundingDate', type: 'date'}),

            defineField({
              name: 'awards',
              title: 'Awards / Certifications',
              type: 'array',
              of: [{type: 'string'}],
              description: 'Only include real awards/certifications.',
            }),

            defineField({
              name: 'sameAs',
              title: 'Social profiles (sameAs)',
              type: 'array',
              of: [{type: 'url'}],
            }),

            defineField({
              name: 'logo',
              title: 'Logo',
              type: 'image',
              options: {hotspot: true},
            }),
            defineField({
              name: 'image',
              title: 'Share image / hero image',
              type: 'image',
              options: {hotspot: true},
            }),

            defineField({
              name: 'contact',
              title: 'Contact',
              type: 'object',
              fields: [
                defineField({name: 'phone', type: 'string'}),
                defineField({name: 'email', type: 'string'}),
                defineField({
                  name: 'contactType',
                  type: 'string',
                  initialValue: 'Customer Service',
                }),
                defineField({
                  name: 'availableLanguage',
                  type: 'string',
                  initialValue: 'English',
                }),
              ],
            }),

            defineField({
              name: 'address',
              title: 'Address (optional)',
              description: 'Leave blank if you are service-area only.',
              type: 'object',
              fields: [
                defineField({name: 'streetAddress', type: 'string'}),
                defineField({name: 'addressLocality', title: 'City', type: 'string'}),
                defineField({name: 'addressRegion', title: 'Region', type: 'string'}),
                defineField({name: 'postalCode', type: 'string'}),
                defineField({name: 'addressCountry', type: 'string', initialValue: 'GB'}),
              ],
            }),

            defineField({
              name: 'geo',
              title: 'Geo (optional)',
              type: 'object',
              fields: [
                defineField({name: 'latitude', type: 'number'}),
                defineField({name: 'longitude', type: 'number'}),
              ],
            }),

            defineField({
              name: 'areaServed',
              title: 'Area served',
              type: 'string',
              initialValue: 'United Kingdom',
            }),

            defineField({
              name: 'founder',
              title: 'Founder (optional)',
              type: 'object',
              fields: [
                defineField({name: 'name', type: 'string'}),
                defineField({name: 'jobTitle', type: 'string'}),
                defineField({name: 'sameAs', title: 'Profile URL', type: 'url'}),
              ],
            }),

            // ✅ Optional “brands/partners”
            defineField({
              name: 'brands',
              title: 'Brands / Partners (optional)',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'schemaBrand',
                  fields: [
                    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
                    defineField({name: 'url', type: 'url'}),
                    defineField({name: 'logo', type: 'image', options: {hotspot: true}}),
                  ],
                  preview: {select: {title: 'name'}},
                },
              ],
            }),
          ],
        }),

        // ✅ LocalBusiness inputs (optional)
        defineField({
          name: 'localBusiness',
          title: 'LocalBusiness',
          type: 'object',
          options: {collapsible: true, collapsed: true},
          fields: [
            defineField({name: 'enabled', type: 'boolean', initialValue: true}),

            defineField({
              name: 'serviceAreaOnly',
              title: 'Service-area business (no public address)',
              type: 'boolean',
              initialValue: true,
            }),

            defineField({name: 'priceRange', type: 'string', description: 'Example: ££'}),
            defineField({name: 'currency', type: 'string', initialValue: 'GBP'}),

            defineField({
              name: 'openingHours',
              title: 'Opening hours',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'openingHoursSpec',
                  fields: [
                    defineField({
                      name: 'dayOfWeek',
                      title: 'Day(s)',
                      type: 'array',
                      of: [{type: 'string'}],
                      options: {
                        list: [
                          {title: 'Monday', value: 'Monday'},
                          {title: 'Tuesday', value: 'Tuesday'},
                          {title: 'Wednesday', value: 'Wednesday'},
                          {title: 'Thursday', value: 'Thursday'},
                          {title: 'Friday', value: 'Friday'},
                          {title: 'Saturday', value: 'Saturday'},
                          {title: 'Sunday', value: 'Sunday'},
                        ],
                      },
                    }),
                    defineField({name: 'opens', type: 'string', description: '09:00'}),
                    defineField({name: 'closes', type: 'string', description: '17:00'}),
                  ],
                  preview: {
                    select: {opens: 'opens', closes: 'closes'},
                    prepare({opens, closes}) {
                      return {title: `${opens || ''}–${closes || ''}`.trim() || 'Opening hours'}
                    },
                  },
                },
              ],
            }),
          ],
        }),

        // ✅ Services => used for makesOffer/OfferCatalog
        defineField({
          name: 'services',
          title: 'Services (Offers)',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'schemaService',
              fields: [
                defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
                defineField({name: 'description', type: 'text', rows: 2}),
                defineField({name: 'url', type: 'url'}),
                defineField({name: 'price', type: 'string'}),
                defineField({name: 'priceCurrency', type: 'string', initialValue: 'GBP'}),
              ],
              preview: {select: {title: 'title'}},
            },
          ],
        }),

        // ✅ Cities served (optional)
        defineField({
          name: 'areaServedCities',
          title: 'Cities served (optional)',
          description: 'Only needed if you want City geo entities in schema.',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'servedCity',
              fields: [
                defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
                defineField({name: 'latitude', type: 'number'}),
                defineField({name: 'longitude', type: 'number'}),
              ],
              preview: {select: {title: 'title'}},
            },
          ],
        }),

        // ✅ Reviews (optional, risky) — keep gated
        defineField({
          name: 'reviews',
          title: 'Reviews & Ratings (optional)',
          type: 'object',
          options: {collapsible: true, collapsed: true},
          fields: [
            defineField({
              name: 'enabled',
              title: 'Enable reviews schema',
              type: 'boolean',
              initialValue: false,
              description:
                'Only enable if reviews are visible on the site and represent real customer reviews.',
            }),
            defineField({
              name: 'aggregateRating',
              title: 'Aggregate Rating (optional)',
              type: 'object',
              hidden: ({parent}) => !parent?.enabled,
              fields: [
                defineField({name: 'ratingValue', type: 'number'}),
                defineField({name: 'reviewCount', type: 'number'}),
                defineField({name: 'bestRating', type: 'number', initialValue: 5}),
                defineField({name: 'worstRating', type: 'number', initialValue: 1}),
              ],
            }),
            defineField({
              name: 'items',
              title: 'Reviews (optional)',
              type: 'array',
              hidden: ({parent}) => !parent?.enabled,
              of: [
                {
                  type: 'object',
                  name: 'schemaReview',
                  fields: [
                    defineField({name: 'author', type: 'string'}),
                    defineField({name: 'rating', type: 'number'}),
                    defineField({name: 'body', type: 'text', rows: 3}),
                  ],
                  preview: {select: {title: 'author'}},
                },
              ],
            }),
            defineField({
              name: 'platforms',
              title: 'Review platforms (optional)',
              description:
                'Per-platform ratings for the "Review cells" trust bar. Only add platforms with real, publicly visible reviews.',
              type: 'array',
              hidden: ({parent}) => !parent?.enabled,
              of: [
                {
                  type: 'object',
                  name: 'reviewPlatform',
                  fields: [
                    defineField({name: 'platform', title: 'Platform', type: 'string'}),
                    defineField({name: 'score', title: 'Score', type: 'string'}),
                    defineField({name: 'subLabel', title: 'Sub label', type: 'string'}),
                    defineField({
                      name: 'showStars',
                      title: 'Show stars',
                      type: 'boolean',
                      initialValue: true,
                    }),
                  ],
                  preview: {select: {title: 'platform', subtitle: 'score'}},
                },
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'trust',
      title: 'Trust signals',
      description:
        'Powers the Trust Bar blocks. Leave any part empty to hide it. Only enter claims that are true and verifiable — UK law (DMCC Act 2024) treats fake reviews and credentials as illegal.',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({
          name: 'stat',
          title: 'Headline stat (optional)',
          type: 'object',
          fields: [
            defineField({
              name: 'headline',
              title: 'Headline',
              type: 'string',
              description: 'e.g. "Since 2009"',
            }),
            defineField({
              name: 'sub',
              title: 'Sub',
              type: 'string',
              description: 'e.g. "15 years · 12,000+ jobs completed"',
            }),
          ],
        }),
        defineField({
          name: 'accreditations',
          title: 'Certifications & accreditations',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'accreditation',
              fields: [
                defineField({
                  name: 'icon',
                  title: 'Icon',
                  type: 'string',
                  options: {
                    list: [
                      {title: 'Shield Check', value: 'ShieldCheck'},
                      {title: 'Badge Check', value: 'BadgeCheck'},
                      {title: 'Award', value: 'Award'},
                      {title: 'Leaf', value: 'Leaf'},
                      {title: 'Clock', value: 'Clock'},
                      {title: 'Users', value: 'Users'},
                      {title: 'Star', value: 'Star'},
                      {title: 'Tag', value: 'Tag'},
                    ],
                  },
                  initialValue: 'ShieldCheck',
                }),
                defineField({name: 'title', title: 'Title', type: 'string'}),
                defineField({name: 'sub', title: 'Sub', type: 'string'}),
              ],
              preview: {select: {title: 'title', subtitle: 'sub'}},
            },
          ],
        }),
        defineField({
          name: 'press',
          title: '"As featured in" logos (optional)',
          description: 'Only add publications that genuinely featured the business.',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'pressItem',
              fields: [
                defineField({name: 'name', title: 'Name', type: 'string'}),
                defineField({
                  name: 'logo',
                  title: 'Logo',
                  type: 'image',
                  options: {hotspot: true},
                  fields: [defineField({name: 'alt', title: 'Alt text', type: 'string'})],
                }),
              ],
              preview: {select: {title: 'name', media: 'logo.asset'}},
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({
          name: 'colorScheme',
          title: 'Color Scheme',
          type: 'string',
          initialValue: 'jw-orange-black',
          options: {
            list: [
              {title: 'JW Orange / Black', value: 'jw-orange-black'},
              {title: 'Blue / White', value: 'blue-white'},
              {title: 'Black / White', value: 'black-white'},
              {title: 'Green / Charcoal', value: 'green-charcoal'},
              {title: 'Purple / Dark', value: 'purple-dark'},
            ],
            layout: 'dropdown',
          },
          validation: (rule) => rule.required(),
        }),

        defineField({
          name: 'mode',
          title: 'Mode',
          type: 'string',
          initialValue: 'light',
          options: {
            list: [
              {title: 'Light', value: 'light'},
              {title: 'Dark', value: 'dark'},
              {title: 'System', value: 'system'},
            ],
            layout: 'dropdown',
          },
          validation: (rule) => rule.required(),
        }),

        defineField({
          name: 'accent',
          title: 'Accent Style',
          type: 'string',
          initialValue: 'solid',
          options: {
            list: [
              {title: 'Solid', value: 'solid'},
              {title: 'Outline', value: 'outline'},
              {title: 'Soft', value: 'soft'},
            ],
            layout: 'dropdown',
          },
          validation: (rule) => rule.required(),
        }),

        defineField({
          name: 'headingFont',
          title: 'Heading Font',
          type: 'string',
          initialValue: 'inter',
          options: {
            list: [
              {title: 'Inter', value: 'inter'},
              {title: 'Poppins', value: 'poppins'},
              {title: 'Montserrat', value: 'montserrat'},
              {title: 'Playfair Display', value: 'playfair'},
            ],
            layout: 'dropdown',
          },
          validation: (rule) => rule.required(),
        }),

        defineField({
          name: 'bodyFont',
          title: 'Body Font',
          type: 'string',
          initialValue: 'inter',
          options: {
            list: [
              {title: 'Inter', value: 'inter'},
              {title: 'Roboto', value: 'roboto'},
              {title: 'Open Sans', value: 'opensans'},
            ],
            layout: 'dropdown',
          },
          validation: (rule) => rule.required(),
        }),

        defineField({
          name: 'monoFont',
          title: 'Mono Font',
          type: 'string',
          initialValue: 'ibmplexmono',
          options: {
            list: [
              {title: 'IBM Plex Mono', value: 'ibmplexmono'},
              {title: 'JetBrains Mono', value: 'jetbrainsmono'},
              {title: 'Space Mono', value: 'spacemono'},
            ],
            layout: 'dropdown',
          },
          validation: (rule) => rule.required(),
        }),

        defineField({
          name: 'radius',
          title: 'Corner Radius',
          type: 'string',
          initialValue: 'xl',
          options: {
            list: [
              {title: 'None', value: 'none'},
              {title: 'Small', value: 'sm'},
              {title: 'Medium', value: 'md'},
              {title: 'Large', value: 'lg'},
              {title: 'XL', value: 'xl'},
              {title: '2XL', value: '2xl'},
            ],
            layout: 'dropdown',
          },
          validation: (rule) => rule.required(),
        }),

        defineField({
          name: 'buttonStyle',
          title: 'Button Style',
          type: 'string',
          initialValue: 'pill',
          options: {
            list: [
              {title: 'Pill', value: 'pill'},
              {title: 'Rounded', value: 'rounded'},
              {title: 'Square', value: 'square'},
            ],
            layout: 'dropdown',
          },
          validation: (rule) => rule.required(),
        }),

        defineField({
          name: 'container',
          title: 'Container Width',
          type: 'string',
          initialValue: 'default',
          options: {
            list: [
              {title: 'Default', value: 'default'},
              {title: 'Wide', value: 'wide'},
              {title: 'Narrow', value: 'narrow'},
            ],
            layout: 'dropdown',
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Settings'}
    },
  },
})
