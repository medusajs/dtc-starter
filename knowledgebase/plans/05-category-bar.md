# Plan 05 — Category Bar Carousel

## Objective

Add a horizontal category bar carousel to the storefront, matching the reference frontend's category navigation pattern. The carousel appears under the header on the home page and on archive pages (store, search, category detail, categories listing). It provides quick category filtering with left/right scroll controls, drag-to-scroll, and active-state styling.

This plan is storefront-only. Backend remains untouched.

---

## Key Principles

1. **Designs and global styling first.** Use Medusa UI preset tokens and global classes before adding new components.
2. **Static/visual adaptations second.** Implement the carousel as a shared component using existing category data.
3. **New features third.** The carousel is a new UI component, but it uses existing data (`listCategories`) and existing routing patterns.
4. **No duplicates.** Reuse the existing `listCategories` data fetching. Do not create a new data layer.
5. **Respect Medusa architecture.** Keep the carousel a client component. Keep page templates as server components. Do not add new npm packages.
6. **Adapt, don't copy.** The reference uses `lucide-react` and theme contexts. We use inline SVGs and Medusa UI tokens.

---

## Reference Category Bar Research

### Reference Component

**File:** `ref/modern/Nextjsfrontend/frontend/src/components/shared/category-bar/index.tsx`

**Type:** Client component (`'use client'`)

**Features:**
- Horizontal scrollable button track with left/right scroll controls
- Drag-to-scroll support (mouse + touch)
- Auto-scrolls active item into view
- Theme-driven active/hover styling via `themeColor` prop
- "All" item prepended automatically
- Gradient edge indicators when scrollable

### Reference Patterns to Adapt

| Pattern | Reference Implementation | Medusa Adaptation |
|---|---|---|
| Scroll controls | Left/right buttons with disabled state | Same pattern, inline SVG icons |
| Drag-to-scroll | Mouse/touch event handlers | Same handlers, no new dependencies |
| Active state | `currentTheme.bg` or `themeColor`-based classes | Medusa UI token classes |
| Hover state | `themeColor`-based hover classes | Medusa UI token hover classes |
| "All" button | Prepended to category list | Same pattern |
| Edge gradients | Gradient indicators on scroll | Optional enhancement |

---

## Current State Analysis

### Existing Category Data

**File:** `apps/storefront/src/lib/data/categories.ts`

- `listCategories()` — fetches all categories from the Medusa store API
- Returns `categories[]` with `id`, `name`, `handle`, `description`, `parent_category`, `category_children`
- Used by footer and categories page

### Existing Category Pages

| Page | Path | Current State |
|---|---|---|
| Categories listing | `app/[countryCode]/(main)/categories/page.tsx` | Grid of category cards, no carousel |
| Category detail | `app/[countryCode]/(main)/categories/[...category]/page.tsx` | Product listing with breadcrumb, no carousel |
| Store | `app/[countryCode]/(main)/store/page.tsx` | Product listing with `RefinementList` sidebar, no carousel |
| Home | `app/[countryCode]/(main)/page.tsx` | Hero + featured products, no category carousel |

### Existing Shared Components

**File:** `apps/storefront/src/modules/common/components/shared/page-banner/index.tsx`

- Already exists, client component
- Proves the shared component pattern works

---

## Proposed Implementation

### Step 1 — Create CategoryBarCarousel Component

**File:** `apps/storefront/src/modules/common/components/shared/category-bar/index.tsx`

**Type:** Client component (`"use client"`)

**Props:**
```ts
interface CategoryBarCarouselProps {
  categories: Array<{ id: string; name: string; handle?: string }>
  selectedCategory?: string
  onSelectCategory: (categoryName: string, categoryId?: string) => void
  className?: string
}
```

**Behavior:**
- Renders a horizontal scrollable button track
- Prepends "All" button
- Left/right scroll buttons with disabled states
- Drag-to-scroll support
- Active category highlighting using Medusa UI tokens
- Auto-scrolls active item into view

**Styling:**
- Use Medusa UI tokens: `bg-ui-bg-base`, `text-ui-fg-base`, `border-ui-border-base`, etc.
- Active state: `bg-ui-bg-interactive text-ui-fg-on-color`
- Hover state: `hover:bg-ui-bg-base-hover hover:text-ui-fg-base`
- No hardcoded colors like `bg-blue-600`

**Icons:**
- Use inline SVG for `ChevronLeft` and `ChevronRight` (no `lucide-react`)

### Step 2 — Integrate into Pages

Add the carousel to these pages:

| Page | Integration Point |
|---|---|
| Home (`page.tsx`) | Below `PageBanner`, above `FeaturedProducts` |
| Store (`store/page.tsx`) | Above `StoreTemplate` content |
| Categories (`categories/page.tsx`) | Below `PageBanner`, above category grid |
| Category detail (`categories/[...category]/page.tsx`) | Below `PageBanner`, above product listing |

### Step 3 — Create Inline SVG Icons

**Files:**
- `apps/storefront/src/modules/common/icons/chevron-left.tsx`
- `apps/storefront/src/modules/common/icons/chevron-right.tsx`

**Pattern:** Follow existing icon component pattern — default export, accept standard SVG props.

### Step 4 — Update Page Components

Each page that uses the carousel needs:
1. Import `CategoryBarCarousel`
2. Fetch categories via `listCategories()` (server component)
3. Pass categories + selection handler to the carousel
4. Handle category selection (update URL or filter state)

---

## Page-Specific Integration Details

### Home Page

**File:** `apps/storefront/src/app/[countryCode]/(main)/page.tsx`

- Fetch categories via `listCategories()`
- Render `CategoryBarCarousel` with `categories` prop
- `selectedCategory` always `"All"` on home
- `onSelectCategory` navigates to `/categories/<handle>` or `/store?category=<name>`

### Store Page

**File:** `apps/storefront/src/app/[countryCode]/(main)/store/page.tsx`

- Fetch categories via `listCategories()`
- Render `CategoryBarCarousel` above `StoreTemplate`
- `selectedCategory` derived from URL search params or `"All"`
- `onSelectCategory` updates URL search params or navigates to filtered store

### Categories Page

**File:** `apps/storefront/src/app/[countryCode]/(main)/categories/page.tsx`

- Fetch categories via `listCategories()` (already done)
- Render `CategoryBarCarousel` below `PageBanner`
- `selectedCategory` derived from current category or `"All"`
- `onSelectCategory` navigates to `/categories/<handle>` or stays on listing

### Category Detail Page

**File:** `apps/storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx`

- Fetch categories via `listCategories()` (add if missing)
- Render `CategoryBarCarousel` below `PageBanner`
- `selectedCategory` derived from the current category handle
- `onSelectCategory` navigates to different category or `/categories`

---

## Styling Approach

### Medusa UI Tokens to Use

| Element | Token Classes |
|---|---|
| Button background | `bg-ui-bg-base` |
| Button text | `text-ui-fg-subtle` |
| Button border | `border-ui-border-base` |
| Active background | `bg-ui-bg-interactive` |
| Active text | `text-ui-fg-on-color` |
| Hover background | `hover:bg-ui-bg-base-hover` |
| Hover text | `hover:text-ui-fg-base` |
| Scroll button background | `bg-ui-bg-base` |
| Scroll button border | `border-ui-border-base` |

### Dark Mode

All tokens automatically switch via CSS variables. No manual `dark:` classes needed for basic colors.

### Responsive Behavior

- Buttons: `px-4 sm:px-5 py-2`
- Scroll buttons: `w-8 h-8 sm:w-9 sm:h-9`
- Gap: `gap-1.5 sm:gap-2`

---

## Data Flow

```
Server Component (page)
  ├── fetch categories via listCategories()
  └── render CategoryBarCarousel (client)
        ├── "All" button + category buttons
        ├── onSelectCategory handler
        └── scroll/drag state
```

**Rule:** Categories are fetched in the server component and passed as props. The carousel itself does not fetch data.

---

## Edge Cases

- **No categories:** If `listCategories()` returns empty, render nothing or a minimal fallback.
- **Many categories:** The carousel handles unlimited categories via horizontal scroll.
- **Touch devices:** Drag-to-scroll works with touch events via `onMouseDown/Move/Up/Leave`.
- **Keyboard navigation:** Buttons are native `<button>` elements, so they're keyboard accessible.

---

## Verification

After implementing this plan:

1. **TypeScript:** `cd apps/storefront && pnpm exec tsc --noEmit` — 0 errors
2. **Lint:** `cd apps/storefront && pnpm run lint` — no new errors
3. **Runtime:** `pnpm run dev` — carousel renders on all target pages
4. **Dark mode:** Toggle `.dark` on `<html>` — carousel renders correctly
5. **Responsive:** Test at `320px`, `768px`, `1024px` — carousel adapts correctly
6. **Scroll:** Left/right buttons work, drag-to-scroll works, edge gradients appear
7. **Active state:** Selected category shows active styling, auto-scrolls into view

---

## Files Changed

| File | Change |
|---|---|
| `apps/storefront/src/modules/common/components/shared/category-bar/index.tsx` | **NEW** — CategoryBarCarousel component |
| `apps/storefront/src/modules/common/icons/chevron-left.tsx` | **NEW** — inline SVG icon |
| `apps/storefront/src/modules/common/icons/chevron-right.tsx` | **NEW** — inline SVG icon |
| `apps/storefront/src/app/[countryCode]/(main)/page.tsx` | **UPDATED** — add carousel |
| `apps/storefront/src/app/[countryCode]/(main)/store/page.tsx` | **UPDATED** — add carousel |
| `apps/storefront/src/app/[countryCode]/(main)/categories/page.tsx` | **UPDATED** — add carousel |
| `apps/storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx` | **UPDATED** — add carousel |
| `knowledgebase/customizations/shared-components.md` | **UPDATED** — document carousel |

---

## Out of Scope

- **Search integration** — the carousel is for category filtering only
- **Category images** — the reference may show images in the carousel; we use text-only buttons
- **Animations** — no `motion/react` or `framer-motion`
- **Persistent selection** — selection is URL-based, not stored in localStorage
- **Category reordering** — static order from Medusa API

## Ignored Features

- **Category images/icons** — the reference may include images in carousel buttons. We use text-only buttons to match the current storefront style.
- **Animations/transitions** — the reference may use `motion/react` for smooth transitions. We use CSS transitions only.
- **Persistent category selection** — the reference may store selected category in localStorage. We use URL-based state only.
- **Category drag reordering** — not applicable, categories are managed in Medusa admin.

**Rule:** If the reference carousel has features not listed above, document them here as "ignored" and ask the user whether to proceed before implementing.
