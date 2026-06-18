/**
 * Escapes a JSON string for safe embedding inside a <script> tag.
 * JSON.stringify does NOT escape `<`, so CMS free-text containing `</script>`
 * (or `<!--`) would otherwise break out of the tag and execute. Unicode-escaping
 * `<`, `>` and `&` closes that hole while keeping the JSON byte-for-byte valid.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

/**
 * Renders a JSON-LD <script>. Server component — no client JS.
 * Pass a schema.org object (or null to render nothing).
 */
export default function JsonLd({data}: {data: unknown}) {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: serializeJsonLd(data)}}
    />
  )
}
