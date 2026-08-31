"use client"

import { useInstantSearch } from "react-instantsearch"

/**
 * Whether the results InstantSearch is holding belong to the current query and
 * refinements. Until they do, `items` still carries the previous search's hits,
 * so rendering them shows stale products for a moment.
 *
 * `__isArtificial` is the flag InstantSearch puts on the placeholder results it
 * renders before its first response. It isn't part of the public types — hence
 * the cast — but it's the library's own signal, used the same way inside
 * `connectInfiniteHits`.
 */
export function useSearchSettled() {
  const { status, results } = useInstantSearch()

  const isSearching = status !== "idle" && status !== "error"
  const hasNoResultsYet = Boolean(
    (results as unknown as { __isArtificial?: boolean } | undefined)
      ?.__isArtificial
  )

  return {
    isSearching,
    hasNoResultsYet,
    isSettled: !isSearching && !hasNoResultsYet,
  }
}

export default useSearchSettled
