import { HttpTypes } from "@medusajs/types"

export const isVariantInStock = (
  variant: HttpTypes.StoreProductVariant | undefined
) =>
  !!variant &&
  (!variant.manage_inventory ||
    !!variant.allow_backorder ||
    (variant.inventory_quantity ?? 0) > 0)
