"use client"

import * as Slider from "@radix-ui/react-slider"
import { useEffect, useState } from "react"
import { useRange } from "react-instantsearch"

import { indexedCurrency, priceAttribute } from "@lib/search-client"

function formatAmount(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0,
      }).format(amount)
    } catch {
      // An unrecognised currency code shouldn't take the sidebar down.
      return `${Math.round(amount)} ${currency.toUpperCase()}`
    }
}

/**
 * Price filter over the region currency's `min_price_*` field, which is
 * declared `facetable({ types: ["stats"] })` — the stats facet is what
 * supplies the slider's bounds. Refines on release rather than per pixel.
 */
const PriceRange = ({ currencyCode }: { currencyCode: string }) => {
  const { start, range, canRefine, refine } = useRange({
    attribute: priceAttribute("min_price", currencyCode),
  })
  const currency = indexedCurrency(currencyCode)
  const format = (amount: number) => formatAmount(amount, currency)

  const min = Math.floor(range.min ?? 0)
  const max = Math.ceil(range.max ?? 0)

  // `start` holds ±Infinity for an unset bound, so fall back to the extremes.
  const from = Number.isFinite(start[0]) ? (start[0] as number) : min
  const to = Number.isFinite(start[1]) ? (start[1] as number) : max

  const [value, setValue] = useState<number[]>([from, to])

  // Follow the refinement when it changes elsewhere — clearing all filters, or
  // a bound arriving from the URL on load.
  useEffect(() => {
    setValue([from, to])
  }, [from, to])

  // No stats yet, or every product costs the same: nothing to slide between.
  if (!canRefine || min >= max) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4">
      <span className="txt-compact-small-plus text-ui-fg-subtle">Price</span>

      <div className="flex flex-col gap-y-3 pr-6">
        <Slider.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          value={value}
          min={min}
          max={max}
          step={1}
          minStepsBetweenThumbs={0}
          onValueChange={setValue}
          // Only refine when the thumb is released, so dragging doesn't fire a
          // search per pixel.
          onValueCommit={(committed) => refine([committed[0], committed[1]])}
          aria-label="Price range"
          data-testid="price-range"
        >
          <Slider.Track className="relative h-0.5 w-full grow rounded-full bg-ui-border-base">
            <Slider.Range className="absolute h-full rounded-full bg-ui-fg-interactive" />
          </Slider.Track>
          {value.map((_, index) => (
            <Slider.Thumb
              key={index}
              className="block h-4 w-4 rounded-full border border-ui-border-interactive bg-ui-bg-base shadow-elevation-card-rest outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
              aria-label={index === 0 ? "Minimum price" : "Maximum price"}
            />
          ))}
        </Slider.Root>

        <div className="flex items-center justify-between">
          <span className="text-small-regular text-ui-fg-subtle">
            {format(value[0])}
          </span>
          <span className="text-small-regular text-ui-fg-subtle">
            {format(value[1])}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PriceRange
