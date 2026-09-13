# Plan 06 — Shop Page Sort & Filter Styles

## Objective

Apply stage-1 styling to the shop page sort-by and filter sidebar to match the reference frontend's visual pattern, using only existing components, existing data, and Medusa UI preset tokens. No new features, no new files, no component logic changes, no new npm packages.

This plan is storefront-only. Backend remains untouched.

---

## Key Principles

1. **Designs and global styling first.** Use Medusa UI preset tokens and existing global classes before adding new components.
2. **Static/visual adaptations second.** Implement purely with Tailwind utility classes on existing JSX — no new data fetching, no new components, no new files.
3. **New features third.** Anything requiring new components, new data, or new files is deferred to later stages.
4. **No duplicates.** Reuse the existing `RefinementList`, `SortProducts`, `OptionsPicker`, and `FilterRadioGroup` components. Do not create a second sorting UI or filter panel.
5. **Respect Medusa architecture.** Keep `FilterRadioGroup` as a client component. Keep page templates as server components. Do not add new npm packages.
6. **Adapt, don't copy.** The reference uses `lucide-react`, `motion/react`, and theme contexts. We use `@medusajs/icons` and Medusa UI tokens.
7. **Stage-1 is style-only.** No new props, no new state, no new behavior. Only class attribute changes.

---

## Reference Research

### Reference Shop Page

**File:** `ref/modern/Nextjsfrontend/frontend/src/@modules/products/templates/shop-page.tsx`

**Type:** Client component (`'use client'`)

**Sort-by pattern:**
- Labeled control with icon in a top control bar
- `<label>` + icon in a rounded-square container + "Sort By:" text
- `<select>` with `appearance-none` + custom chevron
- Reshuffle button (random only) — **new feature, out of scope for stage-1**

**Filter sidebar pattern:**
- Card panel with `bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm`
- Section header: `font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2` with icon
- "Reset (N)" button appears only when `activeFiltersCount > 0`
- Search input with icon inside a rounded-xl bordered field
- Category/brand/rating sections separated by `border-t border-slate-100`
- Each filter item: `px-3 py-2 rounded-xl text-xs font-bold transition` with selected/hover states
- Count badges: `text-[10px] px-1.5 py-0.5 rounded-full`
- Check icon on selected items

**Mobile filter:**
- `lg:hidden` button with `bg-slate-900 text-white`
- Slide-in drawer with backdrop — **new feature, out of scope for stage-1**

### Reference Patterns to Adapt

| Pattern | Reference Implementation | Medusa Adaptation |
|---|---|---|
| Sort-by label + icon | Icon in rounded-square + label text | `@medusajs/icons` `ChevronUpDown` in `bg-ui-bg-component` rounded container |
| Filter panel card | `bg-white border rounded-3xl shadow-sm` | `bg-ui-bg-base border-ui-border-base rounded-large shadow-elevation-card-rest` |
| Section headers | `font-extrabold text-slate-900 uppercase tracking-tight` | `txt-compact-small-plus text-ui-fg-base font-medium uppercase tracking-tight` |
| Separator lines | `border-t border-slate-100` | `border-t border-ui-border-base` |
| Filter item padding | `px-3 py-2 rounded-xl` | `px-3 py-2 rounded-base hover:bg-ui-bg-component-hover` |
| Count badges | `text-[10px] px-1.5 py-0.5 rounded-full` | Same pattern with Medusa tokens |
| Active item state | `bg-blue-600 text-white` | `bg-ui-bg-component-hover text-ui-fg-base` |
| Chevron rotation | CSS `rotate-180` on open | Radix `data-[state=open]` variant via `tailwindcss-radix` |

---

## Current State Analysis

### Existing Components

| Component | File | Current State |
|---|---|---|
| `RefinementList` | `src/modules/store/components/refinement-list/index.tsx` | Card panel applied: `bg-ui-bg-base border border-ui-border-base rounded-large shadow-elevation-card-rest` |
| `SortProducts` | `src/modules/store/components/refinement-list/sort-products/index.tsx` | Icon + label header applied; `ChevronUpDown` imported and rendered |
| `FilterRadioGroup` | `src/modules/common/components/filter-radio-group/index.tsx` | Item rows padded with `px-3 py-2 rounded-base`; `ml-[-23px]` removed; hover/active states applied |
| `OptionsPicker` | `src/modules/store/components/refinement-list/options-picker/index.tsx` | Header styled with `text-ui-fg-base font-medium uppercase tracking-tight`; accordion trigger padded with hover state; chevron container has `rounded-base` |

### Current Architecture

```
StoreTemplate (server)
  ├── RefinementList (client sidebar)
  │    ├── SortProducts
  │    │    └── FilterRadioGroup
  │    └── OptionsPicker (hidden on category/collection)
  │         └── Radix Accordion
  └── PaginatedProducts (server)
```

- `RefinementList` is used on: store, category, and collection pages
- `hideOptionsPicker` hides the options picker on category/collection pages
- `FilterRadioGroup` uses `EllipseMiniSolid` from `@medusajs/icons` for selected radio indicator
- `OptionsPicker` uses `ChevronDownMini` from `@medusajs/icons`
- URL state is managed via `useSearchParams` + `router.push` in `RefinementList`

### Current Token Usage

- `FilterRadioGroup` uses `text-ui-fg-muted`, `text-ui-fg-base`, `text-ui-fg-subtle` — consistent with preset
- `OptionsPicker` uses `border-ui-border-base`, `border-ui-border-interactive`, `text-small-regular`, `rounded-rounded` — consistent with preset
- `SortProducts` imports `ChevronUpDown` from `@medusajs/icons` — icon import applied for stage-1 header

---

## Stage Roadmap

| Stage | Scope | Status |
|---|---|---|
| **Stage 1** | Style-only: card panel, sort header, filter item padding/hover, accordion trigger styling | **Done** |
| Stage 2 | Active filter pills + reset button (new state, new JSX) | Deferred |
| Stage 3 | Search input in filter sidebar (new state + data) | Deferred |
| Stage 4 | Category/brand/rating filters in sidebar (new data fetching) | Deferred |
| Stage 5 | Mobile filter drawer (new state + animation) | Deferred |
| Stage 6 | Layout toggle (grid/list view) | Deferred |

---

## Proposed Implementation

### Stage 1 — Style-only

**Status:** Done

Apply visual styling to the existing sort-by and filter components without changing any props, state, behavior, or file structure.

#### Stage 1.1 — Style `RefinementList` wrapper as a card panel

**Status:** Done

**File:** `apps/storefront/src/modules/store/components/refinement-list/index.tsx`

**Change:** Wrap the existing content in a card-panel container.

**Before:**
```tsx
<div className="flex flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
```

**After:**
```tsx
<div className="flex flex-col gap-8 py-5 mb-8 pl-6 small:px-5 small:mr-8 small:min-w-[250px] small:ml-[1.675rem] bg-ui-bg-base border border-ui-border-base rounded-large shadow-elevation-card-rest">
```

**Rationale:**
- `bg-ui-bg-base` — surface background from preset
- `border-ui-border-base` — subtle border
- `rounded-large` — 16px radius
- `shadow-elevation-card-rest` — preset card shadow
- `gap-8` — slightly tighter than `gap-12` for card density
- `py-5` — vertical padding for card feel

#### Stage 1.2 — Add section header to `SortProducts`

**Status:** Done

**File:** `apps/storefront/src/modules/store/components/refinement-list/sort-products/index.tsx`

**Change:** Add an icon + label header row above the `FilterRadioGroup`.

**Before:**
```tsx
return (
  <FilterRadioGroup
    title="Sort by"
    items={sortOptions}
    value={sortBy}
    handleChange={handleChange}
    data-testid={dataTestId}
  />
)
```

**After:**
```tsx
import { ChevronUpDown } from "@medusajs/icons"

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: string) => {
    setQueryParams("sortBy", value as SortOptions)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-base bg-ui-bg-component border border-ui-border-base text-ui-fg-subtle">
          <ChevronUpDown />
        </span>
        <span className="txt-compact-small-plus text-ui-fg-base font-medium uppercase tracking-tight">
          Sort by
        </span>
      </div>
      <FilterRadioGroup
        title=""
        items={sortOptions}
        value={sortBy}
        handleChange={handleChange}
        data-testid={dataTestId}
      />
    </div>
  )
}
```

**Rationale:**
- Icon container: `h-7 w-7 rounded-base bg-ui-bg-component border border-ui-border-base` — matches reference's icon-in-square pattern
- Label: `txt-compact-small-plus text-ui-fg-base font-medium uppercase tracking-tight` — section header styling
- `FilterRadioGroup` `title` prop set to `""` to suppress the old muted title line

#### Stage 1.3 — Style `FilterRadioGroup` items

**Status:** Done

**File:** `apps/storefront/src/modules/common/components/filter-radio-group/index.tsx`

**Change:** Add padding, hover state, and remove the `ml-[-23px]` offset hack.

**Before:**
```tsx
<div
  key={i.value}
  className={clx("flex gap-x-2 items-center", {
    "ml-[-23px]": i.value === value,
  })}
>
```

**After:**
```tsx
<div
  key={i.value}
  className={clx("flex gap-x-2 items-center px-3 py-2 rounded-base transition-colors duration-150", {
    "bg-ui-bg-component-hover": i.value === value,
  })}
>
```

**Additional change:** Update the `Label` className to remove the `!transform-none` override and add hover cursor:

**Before:**
```tsx
<Label
  htmlFor={i.value}
  className={clx(
    "!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer",
    {
      "text-ui-fg-base": i.value === value,
    }
  )}
  data-testid="radio-label"
  data-active={i.value === value}
>
```

**After:**
```tsx
<Label
  htmlFor={i.value}
  className={clx(
    "txt-compact-small text-ui-fg-subtle hover:cursor-pointer",
    {
      "text-ui-fg-base": i.value === value,
    }
  )}
  data-testid="radio-label"
  data-active={i.value === value}
>
```

**Rationale:**
- `px-3 py-2 rounded-base` — clickable row padding matching reference filter items
- `bg-ui-bg-component-hover` on selected — subtle active background
- `transition-colors duration-150` — smooth hover/active transitions
- Remove `ml-[-23px]` — the offset hack was compensating for the hidden radio input; with the new padded row it's no longer needed and causes misalignment
- Remove `!transform-none` — unnecessary override that may conflict with future label styling

#### Stage 1.4 — Style `OptionsPicker` header and accordion trigger

**Status:** Done

**File:** `apps/storefront/src/modules/store/components/refinement-list/options-picker/index.tsx`

**Change 1 — Header:**

**Before:**
```tsx
<div className="flex items-center justify-between px-1">
  <span className="txt-compact-small-plus text-ui-fg-subtle">
    Options
  </span>
</div>
```

**After:**
```tsx
<div className="flex items-center justify-between px-1 mb-3">
  <span className="txt-compact-small-plus text-ui-fg-base font-medium uppercase tracking-tight">
    Options
  </span>
</div>
```

**Change 2 — Accordion trigger:**

**Before:**
```tsx
<Accordion.Trigger className="flex w-full items-center justify-between py-3 text-left">
```

**After:**
```tsx
<Accordion.Trigger className="flex w-full items-center justify-between px-3 py-2.5 rounded-base hover:bg-ui-bg-component-hover transition-colors duration-150 text-left">
```

**Change 3 — Chevron container:**

**Before:**
```tsx
<span
  className={clsx(
    "flex h-7 w-7 items-center justify-center text-ui-fg-muted transition-transform duration-150",
    {
      "rotate-180": isOpen,
    }
  )}
>
```

**After:**
```tsx
<span
  className={clsx(
    "flex h-7 w-7 items-center justify-center rounded-base text-ui-fg-muted transition-transform duration-150",
    {
      "rotate-180": isOpen,
    }
  )}
>
```

**Rationale:**
- Header: `text-ui-fg-base font-medium uppercase tracking-tight` — matches reference section header pattern
- Trigger: `px-3 py-2.5 rounded-base hover:bg-ui-bg-component-hover` — padded clickable row with hover feedback
- Chevron: `rounded-base` — subtle rounded background on the chevron container
- `mb-3` on header — spacing between header and first accordion item

---

## Files Changed

| File | Change type | Change |
|---|---|---|
| `apps/storefront/src/modules/store/components/refinement-list/index.tsx` | **edit** | Card panel classes on wrapper div |
| `apps/storefront/src/modules/store/components/refinement-list/sort-products/index.tsx` | **edit** | Add icon + label header; import `ChevronUpDown` |
| `apps/storefront/src/modules/common/components/filter-radio-group/index.tsx` | **edit** | Add padding/hover to item rows; remove `ml-[-23px]`; remove `!transform-none` |
| `apps/storefront/src/modules/store/components/refinement-list/options-picker/index.tsx` | **edit** | Style header + accordion trigger + chevron container |

No new files. No new dependencies. No new props. No new state. No new components.

---

## Verification

After implementing stage-1:

1. **TypeScript:** `cd apps/storefront && pnpm exec tsc --noEmit` — 0 new errors
2. **Lint:** `cd apps/storefront && pnpm run lint` — no new warnings or errors
3. **Runtime:** `pnpm run dev` — sort/filter panel renders on `/store`, `/categories`, and `/collections` pages
4. **Visual check:** Sort-by section shows icon + "SORT BY" label; filter panel is a bordered card; accordion triggers have hover states; selected items have subtle background
5. **Dark mode:** Manually toggle `.dark` on `<html>` — all new classes render with dark tokens; no unstyled elements
6. **No regression:** Product grid, pagination, category bar, and all existing pages render identically

---

## Out of Scope for Stage 1

The following reference features are **not** part of stage-1 and require separate plans:

- **Active filter pills** — "Category: Shirts" / "Brand: Nike" dismissible pills with X buttons
- **Reset button** — "Reset (N)" button in filter header
- **Search input** — search box inside filter sidebar
- **Category filter** — category list with counts inside sidebar
- **Brand filter** — brand list with counts inside sidebar
- **Rating filter** — star rating filter buttons
- **Mobile filter drawer** — slide-in panel with backdrop for `lg:hidden`
- **Layout toggle** — Grid / List view switcher
- **Reshuffle button** — randomize button next to sort dropdown
- **Results count** — "Displaying 12 products" + "clear all filters" link

---

## Ignored Features

The following reference patterns are **intentionally not adopted** in stage-1 because they are new features, not style changes:

- **Mobile filter drawer** (`mobileFiltersOpen` state + `AnimatePresence` + `motion.div`) — requires new state, new `motion/react` dependency, and new component structure. Deferred to a later stage.
- **Active filter pills** — requires new state tracking and new JSX; not a style-only change.
- **Reset button** — requires `activeFiltersCount` computation and click handler wiring.
- **Search input** — requires new state, new API call or client-side filter logic.
- **Category/brand/rating filters** — require new data fetching (`/store/product-options` or `/store/categories`) and new selection state.
- **`lucide-react` icons** — not in dependencies; we use `@medusajs/icons` exclusively. The reference's icon set is not ported.
- **`motion/react` (Framer Motion)** — not in dependencies. The reference's `AnimatePresence` + `motion.div` drawer animation is deferred.

**Rule:** If a design element from the reference requires new state, new data fetching, or a new dependency, it is "ignored" for stage-1 and must be raised as a separate plan before implementation.

---

## Dependencies and Decisions Required

1. **Confirm stage-1 scope is style-only.** This plan assumes no new props, no new state, and no new files. If active filter pills or reset buttons are desired immediately, they require a separate stage.
2. **Confirm `rounded-large` (16px) is acceptable.** The reference uses `rounded-3xl` (24px) for cards. Our preset's `large` is 16px. If 24px is required, use `rounded-3xl` (added in plan 01) explicitly.
3. **Confirm `bg-ui-bg-component-hover` for selected radio rows.** This is a subtle hover token. If a stronger active state is desired, consider `bg-ui-bg-interactive text-ui-fg-on-color` — but that changes the radio group's visual weight significantly.
4. **Confirm dark mode manual testing is sufficient.** The reference has a runtime dark-mode toggle. Our storefront has `darkMode: "class"` configured but no toggle. Stage-1 styling must render correctly when `.dark` is manually applied to `<html>`.
