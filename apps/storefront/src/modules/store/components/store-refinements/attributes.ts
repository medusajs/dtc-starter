import { PRODUCT_INDEX_NAME } from "@lib/search-client"

export const OPTION_VALUES_ATTRIBUTE = "option_values"
export const MIN_PRICE_ATTRIBUTE = "min_price"
export const ON_SALE_ATTRIBUTE = "on_sale"
export const BRAND_ATTRIBUTE = "brand"
export const CATEGORY_ATTRIBUTE = "category"
// The index calls the product's tags "labels".
export const LABELS_ATTRIBUTE = "labels"

export const SORT_OPTIONS = [
  { value: PRODUCT_INDEX_NAME, label: "Relevance" },
  { value: `${PRODUCT_INDEX_NAME}/sort/created_at:desc`, label: "Latest Arrivals" },
  {
    value: `${PRODUCT_INDEX_NAME}/sort/min_price:asc`,
    label: "Price: Low -> High",
  },
  {
    value: `${PRODUCT_INDEX_NAME}/sort/min_price:desc`,
    label: "Price: High -> Low",
  },
  { value: `${PRODUCT_INDEX_NAME}/sort/title:asc`, label: "Title: A -> Z" },
  { value: `${PRODUCT_INDEX_NAME}/sort/title:desc`, label: "Title: Z -> A" },
]
