import "server-only"
import { sdk } from "@lib/config"
import { getCacheTag, setCartId } from "@lib/data/cookies"
import { listRegions } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getDefaultCountryCode } from "./site"

export const MAX_LINE_ITEM_QUANTITY = 100

/** Stores the cart in the shopper's cookie and clears cached cart reads. */
export const activateCart = async (cartId: string) => {
  await setCartId(cartId)
  const cartCacheTag = await getCacheTag("carts")
  if (cartCacheTag) {
    revalidateTag(cartCacheTag, { expire: 0 })
  }
}

/**
 * Resolves the region from an explicit country code, falling back to the
 * store's default country only when none was requested.
 */
export const resolveRegion = async (
  countryCode?: string
): Promise<{ countryCode: string; region: HttpTypes.StoreRegion } | null> => {
  const regions = await listRegions()
  const code = countryCode?.toLowerCase() || getDefaultCountryCode(regions)
  const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === code))
  return code && region ? { countryCode: code, region } : null
}

export const createCartWithItems = async (
  regionId: string,
  items: { variant_id: string; quantity: number }[]
) => {
  const { cart } = await sdk.store.cart.create({ region_id: regionId })
  for (const item of items) {
    await sdk.store.cart.createLineItem(cart.id, item)
  }
  return cart.id
}

/** Returns the requested variant IDs that don't exist in the store's sales channel. */
export const findMissingVariantIds = async (variantIds: string[]) => {
  const { variants } = await sdk.client.fetch<{
    variants: { id: string }[]
  }>("/store/product-variants", {
    query: { id: variantIds, fields: "id", limit: variantIds.length },
  })
  const found = new Set(variants.map((variant) => variant.id))
  return variantIds.filter((id) => !found.has(id))
}
