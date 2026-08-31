"use client"

import { useClearRefinements, useSortBy } from "react-instantsearch"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import {
  CATEGORY_ATTRIBUTE,
  COLLECTION_ATTRIBUTE,
  SORT_OPTIONS,
  TAGS_ATTRIBUTE,
} from "./attributes"
import OptionRefinements from "./option-refinements"
import RefinementGroup from "./refinement-group"

const SortProducts = () => {
  const { currentRefinement, refine } = useSortBy({ items: SORT_OPTIONS })

  return (
    <FilterRadioGroup
      title="Sort by"
      items={SORT_OPTIONS}
      value={currentRefinement}
      handleChange={refine}
      data-testid="sort-by-container"
    />
  )
}

const ClearRefinements = () => {
  const { canRefine, refine } = useClearRefinements()

  if (!canRefine) {
    return null
  }

  return (
    <button
      onClick={refine}
      className="txt-compact-small-plus text-ui-fg-interactive hover:text-ui-fg-interactive-hover self-start"
      data-testid="clear-refinements"
    >
      Clear all filters
    </button>
  )
}

const StoreRefinements = () => {
  return (
    <div className="flex flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:w-[250px] small:shrink-0 small:ml-[1.675rem]">
      <SortProducts />
      <ClearRefinements />
      <OptionRefinements />
      <RefinementGroup attribute={COLLECTION_ATTRIBUTE} title="Collection" />
      <RefinementGroup attribute={CATEGORY_ATTRIBUTE} title="Category" />
      <RefinementGroup attribute={TAGS_ATTRIBUTE} title="Tags" />
    </div>
  )
}

export default StoreRefinements
