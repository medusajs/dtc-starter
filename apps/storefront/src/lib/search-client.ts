import {
  createInstantSearchAdapter,
  type MedusaSdkLike,
} from "@medusajs/instantsearch-adapter"

import { sdk } from "@lib/config"

export const PRODUCT_INDEX_NAME = "product"

const medusaSdk = sdk as unknown as MedusaSdkLike

export const { searchClient } = createInstantSearchAdapter({
  sdk: medusaSdk,
  path: "/store/search",
  placeholderSearch: false,
})

export const { searchClient: browseSearchClient } = createInstantSearchAdapter({
  sdk: medusaSdk,
  path: "/store/search",
})
