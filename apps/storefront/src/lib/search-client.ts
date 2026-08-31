import {
  createInstantSearchAdapter,
  type MedusaSdkLike,
} from "@medusajs/instantsearch-adapter"

import { sdk } from "@lib/config"

export const PRODUCT_INDEX_NAME = "product"

/**
 * Shared by the navbar search drawer and the store listing. An empty query
 * searches rather than short-circuiting, which is what the listing needs to
 * show every product before anything is refined.
 */
export const { searchClient } = createInstantSearchAdapter({
  sdk: sdk as unknown as MedusaSdkLike,
  path: "/store/search",
  // Range widgets read `facets_stats`, which the adapter only produces for
  // fields listed here — it requests a `stats` facet for them instead of a
  // `value` facet. `min_price` is declared `facetable({ types: ["stats"] })`
  // on the index, which is what makes the stats available at all.
  numericAttributes: ["min_price"],
})
