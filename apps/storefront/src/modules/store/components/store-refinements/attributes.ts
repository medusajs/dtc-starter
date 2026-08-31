import { PRODUCT_INDEX_NAME } from "@lib/search-client"

export const OPTION_VALUES_ATTRIBUTE = "option_values"
export const COLLECTION_ATTRIBUTE = "collection_title"
export const CATEGORY_ATTRIBUTE = "category_names"
export const TAGS_ATTRIBUTE = "tags"

export const SORT_OPTIONS = [
  { value: PRODUCT_INDEX_NAME, label: "Relevance" },
  { value: `${PRODUCT_INDEX_NAME}/sort/created_at:desc`, label: "Latest Arrivals" },
  { value: `${PRODUCT_INDEX_NAME}/sort/title:asc`, label: "Title: A -> Z" },
  { value: `${PRODUCT_INDEX_NAME}/sort/title:desc`, label: "Title: Z -> A" },
]
