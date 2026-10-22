"use client"

import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import ImageGallery from "."

const getImagesForVariant = (
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string,
) => {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

/**
 * Shows the images of the variant selected with `?v_id=`. Product pages are
 * statically rendered, so the filter is only applied after hydration.
 */
const VariantImageGallery = ({
  product,
}: {
  product: HttpTypes.StoreProduct
}) => {
  const searchParams = useSearchParams()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  const variantId = isMounted ? searchParams.get("v_id") ?? undefined : undefined
  const images = useMemo(
    () => getImagesForVariant(product, variantId) ?? [],
    [product, variantId]
  )

  return <ImageGallery images={images} />
}

export default VariantImageGallery
