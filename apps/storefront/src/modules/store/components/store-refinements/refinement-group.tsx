"use client"

import clsx from "clsx"
import { useRefinementList } from "react-instantsearch"

type RefinementGroupProps = {
  attribute: string
  title: string
}

const RefinementGroup = ({ attribute, title }: RefinementGroupProps) => {
  const { items, refine } = useRefinementList({
    attribute,
    limit: 20,
    sortBy: ["count:desc", "name:asc"],
  })

  if (!items.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3">
      <span className="txt-compact-small-plus text-ui-fg-subtle">
        {title}
      </span>
      <ul className="flex flex-col gap-y-2 pr-6">
        {items.map((item) => (
          <li key={item.value}>
            <label className="flex cursor-pointer items-start gap-x-2">
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                className="mt-1 shrink-0 accent-ui-fg-interactive"
                data-testid={`refinement-${attribute}`}
              />
              <span
                className={clsx("text-small-regular min-w-0 break-words", {
                  "text-ui-fg-base": item.isRefined,
                  "text-ui-fg-subtle": !item.isRefined,
                })}
              >
                {item.label}
              </span>
              <span className="text-small-regular shrink-0 text-ui-fg-muted">
                ({item.count})
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RefinementGroup
