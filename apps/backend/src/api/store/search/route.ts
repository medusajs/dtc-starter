/**
 * TEMPORARY — remove once Medusa v2.20.0 ships a core `/store/search` route.
 *
 * Batched search endpoint for the storefront. `@medusajs/instantsearch-adapter`
 * POSTs `{ queries }` — one query for the hits plus one per disjunctive facet —
 * and expects `{ results }` back in the same order.
 */
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import type { SearchQuery } from '@medusajs/framework/types'

/**
 * The only index the storefront may query. Anything else is rejected rather
 * than silently searched.
 */
const ALLOWED_ENTITY = 'product'

type SearchRequestBody = {
  queries?: SearchQuery[]
}

export async function POST(
  req: MedusaRequest<SearchRequestBody>,
  res: MedusaResponse
) {
  const queries = req.body?.queries

  if (!Array.isArray(queries) || !queries.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'A non-empty `queries` array is required.'
    )
  }

  const sanitizedQueries = queries.map((query) => {
    // An index name may carry a sort suffix, e.g. `product/sort/title:desc`.
    // The adapter strips it before sending, but a hand-rolled client may not,
    // so it is parsed off here and the base name is what gets queried.
    const [entity] = (query?.entity ?? '').split('/sort/')

    if (entity !== ALLOWED_ENTITY) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Only the "${ALLOWED_ENTITY}" index can be searched from the storefront.`
      )
    }

    return {
      ...query,
      entity,
      filters: {
        ...query.filters,
        // Enforced here, never in the storefront — the client can change
        // anything it sends, so an unpublished product must not be reachable
        // by dropping a filter from the request.
        status: 'published',
      },
    } satisfies SearchQuery
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const searchResults = await query.search(sanitizedQueries)

  // Same order as the incoming queries, which is what the adapter pairs its
  // requests against.
  const results = searchResults.map(({ data, search_result }) => ({
    ...search_result,
    hits: data.map((document) => ({ document })),
  }))

  res.json({ results })
}
