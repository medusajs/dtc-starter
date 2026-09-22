"use client"

import { XMarkMini } from "@medusajs/icons"
import { useClearRefinements, useCurrentRefinements } from "react-instantsearch"

import { indexedCurrency, priceAttribute } from "@lib/search-client"
import { convertToLocale } from "@lib/util/money"
import {
  CATEGORY_ATTRIBUTE,
  LABELS_ATTRIBUTE,
  OPTION_VALUES_ATTRIBUTE,
} from "./attributes"

type Refinement = ReturnType<
  typeof useCurrentRefinements
>["items"][number]["refinements"][number]

/**
 * What a single refinement reads as on its chip. The raw label is the facet
 * value, which is the option's `Size:M` form for options and a bare `true` for
 * the on-sale toggle — neither says what it filters on out of context.
 */
function refinementLabel(refinement: Refinement, currencyCode: string) {
  const { attribute, label, value, operator } = refinement

  if (attribute === OPTION_VALUES_ATTRIBUTE) {
    const separator = String(value).indexOf(":")

    return separator < 1
      ? label
      : `${String(value).slice(0, separator)}: ${String(value).slice(
          separator + 1
        )}`
  }

  if (attribute === priceAttribute("on_sale", currencyCode)) {
    return "On sale"
  }

  if (attribute === priceAttribute("min_price", currencyCode)) {
    const amount = convertToLocale({
      amount: Number(value),
      currency_code: indexedCurrency(currencyCode),
      maximumFractionDigits: 0,
    })

    return operator === "<=" || operator === "<"
      ? `Up to ${amount}`
      : `From ${amount}`
  }

  if (attribute === CATEGORY_ATTRIBUTE) {
    return `Category: ${label}`
  }

  if (attribute === LABELS_ATTRIBUTE) {
    return `Label: ${label}`
  }

  return label
}

/**
 * Every active refinement as a chip that drops it, above the filters that set
 * them. The free-text query is excluded by the connector's own defaults, so
 * only what the sidebar controls shows up here.
 */
const CurrentRefinements = ({ currencyCode }: { currencyCode: string }) => {
  const { items, refine } = useCurrentRefinements()
  const { canRefine: canClearAll, refine: clearAll } = useClearRefinements()

  const refinements = items.flatMap((item) => item.refinements)

  if (!refinements.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3" data-testid="current-refinements">
      <div className="flex items-center justify-between gap-x-2 pr-6">
        <span className="txt-compact-small-plus text-ui-fg-subtle">
          Applied filters
        </span>
        {canClearAll && (
          <button
            onClick={clearAll}
            className="txt-compact-small-plus text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            data-testid="clear-refinements"
          >
            Clear all
          </button>
        )}
      </div>

      <ul className="flex flex-wrap gap-2 pr-6">
        {refinements.map((refinement) => {
          const label = refinementLabel(refinement, currencyCode)

          return (
            <li
              key={`${refinement.attribute}:${refinement.operator ?? ""}:${
                refinement.value
              }`}
            >
              <button
                onClick={() => refine(refinement)}
                aria-label={`Remove filter ${label}`}
                className="border-ui-border-interactive text-ui-fg-base border text-small-regular h-8 rounded-rounded px-3 flex items-center gap-x-1.5 transition-colors duration-150 hover:bg-ui-bg-base-hover"
                data-testid="remove-refinement"
              >
                {label}
                <XMarkMini className="text-ui-fg-muted" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default CurrentRefinements
