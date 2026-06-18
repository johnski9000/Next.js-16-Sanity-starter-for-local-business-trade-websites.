/**
 * Wraps a set of schema.org nodes in a single <script> with
 * {@context, @graph: [...]}. Strips per-node @context (the root one
 * applies to everything in the graph). Nulls are filtered out.
 *
 * Use this for every per-page bundle of related entities so @id
 * cross-refs (Service.provider → LocalBusiness, BlogPosting.publisher
 * → LocalBusiness, Project.creator → LocalBusiness, FAQPage.isPartOf
 * → its parent doc) resolve cleanly into one knowledge graph.
 */
import {serializeJsonLd} from './JsonLd'

type Node = (Record<string, unknown> & {'@context'?: unknown}) | null | undefined

export default function GraphJsonLd({nodes}: {nodes: Node[]}) {
  const graph = nodes
    .filter((n): n is Record<string, unknown> & {'@context'?: unknown} => Boolean(n))
    .map((n) =>
      Object.fromEntries(Object.entries(n).filter(([k]) => k !== '@context')),
    )
  if (graph.length === 0) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd({'@context': 'https://schema.org', '@graph': graph}),
      }}
    />
  )
}
