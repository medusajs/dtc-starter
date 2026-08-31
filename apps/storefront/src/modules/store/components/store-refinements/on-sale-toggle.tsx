"use client"

import { useToggleRefinement } from "react-instantsearch"

import { ON_SALE_ATTRIBUTE } from "./attributes"

/**
 * Narrows to products whose calculated price is below their original — the
 * index's `on_sale` boolean. Hides itself when nothing is discounted, which is
 * the case until a price list applies to some product.
 */
const OnSaleToggle = () => {
  const { value, refine, canRefine } = useToggleRefinement({
    attribute: ON_SALE_ATTRIBUTE,
    on: true,
  })

  if (!canRefine) {
    return null
  }

  return (
    <label className="flex cursor-pointer items-center gap-x-2">
      <input
        type="checkbox"
        checked={value.isRefined}
        onChange={() => refine(value)}
        className="shrink-0 accent-ui-fg-interactive"
        data-testid="on-sale-toggle"
      />
      <span className="txt-compact-small-plus text-ui-fg-subtle">
        On sale only
      </span>
      {typeof value.count === "number" && (
        <span className="text-small-regular text-ui-fg-muted">
          ({value.count})
        </span>
      )}
    </label>
  )
}

export default OnSaleToggle
