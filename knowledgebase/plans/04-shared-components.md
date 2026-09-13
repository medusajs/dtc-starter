# Plan 04 — Shared Components

## Objective

Implement the shared component layer (`PageBanner`) in `src/modules/common/components/shared/`. These components extract repeated UI patterns from page templates into reusable, theme-aware building blocks.

This plan is storefront-only. Backend remains untouched.

---

## Current State Analysis

### Existing Shared Infrastructure

- **Plan 01 (Global Styles)** — Adds `theme.*` color scale, `globals.css` utilities, and `theme-utils.ts`. **Must be completed first.**
- **Local UI kit** (`src/modules/common/components/ui/`) — `Button`, `Heading`, `Badge`, `Text`, `Input`, etc. These are the primitive building blocks.
- **Path aliases** — `@modules/*` → `modules/*`, `@lib/*` → `lib/*`
- **Existing layout components** — `Modal`, `LocalizedClientLink`, `CartTotals`, etc.

### Reference Components to Adapt

| Reference Component | Purpose | Medusa Equivalent |
|---|---|---|
| `PageBanner` | Page hero with breadcrumb, title, description, badge, background image | **Implemented** — created under `shared/page-banner/` |

---

## Strategic Approach

**Do NOT copy-paste the reference components.** Instead:

1. **Extract the pattern, not the code** — Understand what the reference component does, then implement it using Medusa's primitives and conventions.
2. **Use Medusa tokens** — All components must use `@medusajs/ui-preset` tokens.
3. **Keep components small** — Each shared component does one thing. If a page needs a variant, add a prop with a sensible default.
4. **Server vs client boundary** — Use `"use client"` only when the component needs hooks, event handlers, or browser APIs. Page templates are server components; they can pass props to client components.
5. **TypeScript interfaces** — Define props with interfaces. Do not use `any`.
6. **No new dependencies** — Use existing dependencies only. If a reference component uses a library that Medusa doesn't have (e.g., `motion/react`, `lucide-react`), find an alternative or implement the behavior with existing tools.

---

## Step 1 — PageBanner

### 1.1 Component spec

**File**: `apps/storefront/src/modules/common/components/shared/page-banner/index.tsx`

**Props**:
```ts
interface PageBannerProps {
  title: string
  description?: string
  badge?: string
  onBack?: () => void
  actions?: React.ReactNode
  backLabel?: string
}
```

**Behavior**:
- Renders a breadcrumb back-link (`<ArrowLeft />` + `backLabel`)
- Renders a rounded hero container with optional background image
- Uses Medusa design tokens for styling
- Uses inline SVG for icons (no new icon library)

### 1.2 Implementation notes

- **Breadcrumb**: Use `button` element with `onClick={onBack}`. Default to `router.back()` if `onBack` not provided.
- **Dark mode**: All colors must have `dark:` variants.
- **Responsive**: Use `sm:` and `lg:` breakpoints for padding and font sizes.

### 1.3 Consumers

Added to:
- `about/page.tsx`
- `contact/page.tsx`
- `faq/page.tsx`
- `terms/page.tsx`
- `returns/page.tsx`
- `seller-policy/page.tsx`
- `privacy/page.tsx`
- `featured/page.tsx`
- `track-order/page.tsx`
- `wishlist/page.tsx`
- `categories/page.tsx`
- `account/layout.tsx` via `AccountLayout` — shows "Hello {name}" when logged in, "Please login or sign up to continue" when logged out

**Not added to**:
- `checkout/page.tsx` — checkout has its own minimal chrome
- `cart/page.tsx` — cart has its own template

---

## Step 2 — Future Components (Not Yet Implemented)

### 2.1 CategoryBarCarousel

**File**: `apps/storefront/src/modules/common/components/shared/category-bar/index.tsx`

**Status**: Planned, not yet implemented.

### 2.2 RecentlyViewedSection

**File**: `apps/storefront/src/modules/common/components/shared/recently-viewed/index.tsx`

**Status**: Planned, not yet implemented.

---

## Step 3 — Verification

After implementing this plan:

1. **TypeScript**: `cd apps/storefront && pnpm exec tsc --noEmit` — 0 errors
2. **Lint**: `cd apps/storefront && pnpm run lint` — no new errors introduced
3. **Runtime**: `pnpm run dev` — all pages load without errors
4. **Dark mode**: Toggle `.dark` on `<html>` — all shared components render correctly
5. **Responsive**: Test at `320px`, `768px`, `1024px`, `1440px` — components adapt correctly

---

## Files Changed

| File | Change |
|---|---|
| `apps/storefront/src/modules/common/components/shared/page-banner/index.tsx` | **NEW** — PageBanner component |
| `apps/storefront/src/app/[countryCode]/(main)/about/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/contact/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/faq/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/terms/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/returns/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/seller-policy/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/privacy/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/featured/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/track-order/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/wishlist/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/app/[countryCode]/(main)/categories/page.tsx` | **UPDATED** — uses PageBanner |
| `apps/storefront/src/modules/account/templates/account-layout.tsx` | **UPDATED** — uses PageBanner with customer-aware title/description |
| `apps/storefront/src/modules/account/components/overview/index.tsx` | **UPDATED** — removed duplicate welcome message, now handled by PageBanner in layout |

---

## Prerequisites

- **Plan 01 (Global Styles)** must be completed first. Shared components depend on Medusa UI tokens and `globals.css` utilities.
- **Plan 02 (Header)** is independent but benefits from the same theme tokens.
- **Plan 03 (Footer)** is independent but benefits from the same theme tokens.

---

## Out of Scope for This Plan

- `motion/react` / Framer Motion — ignored by default
- New npm dependencies — ignored by default
- Backend schema changes — never in scope
- Admin customizations — out of scope

## Ignored Features

The following are intentionally **not** part of this plan and should not be added unless the user explicitly requests them:

- **Animation libraries** (`motion/react`, `framer-motion`) — the reference may use these for transitions. Medusa does not currently have them. Do not add unless explicitly requested.
- **Icon libraries** (`lucide-react`) — the reference uses `lucide-react`. Medusa uses inline SVGs and `@medusajs/icons`. Do not add `lucide-react` unless explicitly requested.
- **Image gallery/lightbox** — if the reference has a product image gallery with lightbox, that is a separate component plan. This plan only covers PageBanner.
- **Product card variants** — if the reference has specialized product cards, create a separate plan for those. Use existing product card patterns in this plan.
- **Backend personalization** — if the reference's recently viewed or category carousel uses backend-stored preferences, that requires backend modules. Client-side `localStorage` is sufficient for this plan.
- **Server actions for shared components** — shared components should accept data via props. Do not create new server actions specifically for shared components; use existing ones in the consuming pages.

**Rule:** If a reference shared-component feature requires any of the above, document it here as "ignored" and ask the user whether to proceed before implementing.
