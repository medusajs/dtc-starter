# Shared Components

## Overview

This document defines the reusable shared components available in the storefront, where they live, how to use them, and the rules for extending them. Shared components are extracted from page-specific code into `src/modules/common/components/shared/` so they can be reused across multiple pages without duplication.

## Available Shared Components

### PageBanner

**Location**: `src/modules/common/components/shared/page-banner/index.tsx`  
**Type**: Client component (`"use client"`)  
**Purpose**: Unified page header with breadcrumb, title, description, badge, and optional actions.

#### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | `string` | Yes | — | Page title |
| `description` | `string` | No | — | Short description below the title |
| `badge` | `string` | No | — | Pill badge text |
| `onBack` | `() => void` | No | `router.back()` | Back button handler |
| `actions` | `React.ReactNode` | No | — | Action buttons/links rendered below description |
| `backLabel` | `string` | No | `"Home"` | Text for the breadcrumb back-link |

#### Usage

```tsx
import { PageBanner } from "@modules/common/components/shared/page-banner"

<PageBanner
  title="About Us"
  description="Learn more about our store."
  badge="Our Story"
  backLabel="Home"
/>
```

#### Rules

- Always provide `title`.
- Use `description` for a short summary below the title.
- Use `badge` for optional pill text above the title.
- The `backLabel` prop exists because different pages have different back-link semantics.
- Do not add inline styles. Use Tailwind utilities.
- Use Medusa UI tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`) for all colors.

#### Consumers

| Page | Path | Notes |
|---|---|---|
| About | `app/[countryCode]/(main)/about/page.tsx` | Full-width banner outside `content-container` |
| Contact | `app/[countryCode]/(main)/contact/page.tsx` | Full-width banner outside `content-container` |
| FAQ | `app/[countryCode]/(main)/faq/page.tsx` | Full-width banner outside `content-container` |
| Terms | `app/[countryCode]/(main)/terms/page.tsx` | Full-width banner outside `content-container` |
| Returns | `app/[countryCode]/(main)/returns/page.tsx` | Full-width banner outside `content-container` |
| Seller Policy | `app/[countryCode]/(main)/seller-policy/page.tsx` | Full-width banner outside `content-container` |
| Privacy | `app/[countryCode]/(main)/privacy/page.tsx` | Full-width banner outside `content-container` |
| Featured Products | `app/[countryCode]/(main)/featured/page.tsx` | Full-width banner outside `content-container` |
| Track Order | `app/[countryCode]/(main)/track-order/page.tsx` | Full-width banner outside `content-container` |
| Wishlist | `app/[countryCode]/(main)/wishlist/page.tsx` | Full-width banner outside `content-container` |
| Categories | `app/[countryCode]/(main)/categories/page.tsx` | Full-width banner outside `content-container` |
| Account | `app/[countryCode]/(main)/account/layout.tsx` via `AccountLayout` | Banner outside `content-container`; account nav/content wrapped separately |

#### Not Used On

- **Checkout** (`app/[countryCode]/(checkout)/checkout/page.tsx`) — checkout has its own minimal chrome.
- **Cart** (`app/[countryCode]/(main)/cart/page.tsx`) — cart has its own template.
- **Account dashboard pages** (`profile`, `orders`, `addresses`, `orders/details/[id]`) — the account layout already renders the banner; do not add another `PageBanner` inside these pages.

### PageBanner Width Rule

`PageBanner` renders its own full-width outer wrapper:

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
```

Because of this, **do not wrap `PageBanner` in `content-container` or any other centered/max-width wrapper**. If you do, the banner will be narrowed because it will inherit the parent’s max-width instead of using its own.

Correct pattern for normal pages:

```tsx
<div className="w-full">
  <PageBanner title="Page Title" description="Page description." />
  <div className="w-full flex justify-center px-8 py-12">
    <div className="max-w-3xl w-full">
      {/* page body */}
    </div>
  </div>
</div>
```

Account layout exception:

```tsx
<div data-testid="account-page">
  <PageBanner ... />
  <div className="content-container bg-white flex flex-col">
    <div className="max-w-7xl mx-auto w-full">
      {/* account nav + content */}
    </div>
  </div>
</div>
```

This keeps the banner full-width while constraining the account chrome below it.

### Account Page Consumer Notes

The account page (`modules/account/templates/account-layout.tsx`) uses `PageBanner` differently from other pages:

- The banner is rendered **outside** `content-container` so it can use its built-in full-width wrapper.
- The account nav, main content, and footer block are wrapped in a separate `content-container` + `max-w-7xl mx-auto w-full` div for readability.
- The welcome message was moved from `modules/account/components/overview/index.tsx` into the banner via `title` and `description` props.
- When the user is logged out, the banner shows `title="Account"` and `description="Please login or sign up to continue"`.

---

### CategoryBarCarousel

**Location**: `src/modules/common/components/shared/category-bar/index.tsx`  
**Type**: Client component (`"use client"`)  
**Purpose**: Horizontal scrollable category navigation with left/right scroll controls, drag-to-scroll, and active-state styling.

#### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `categories` | `Array<{ id: string; name: string; handle?: string }>` | Yes | — | Category list from `listCategories()` |
| `selectedCategory` | `string` | No | `"All"` | Currently selected category name |
| `onSelectCategory` | `(name: string, handle?: string) => void` | No | — | Custom selection handler; when omitted, carousel navigates to `/${countryCode}/categories/<handle>` |
| `countryCode` | `string` | No | — | Country code for localized navigation when `onSelectCategory` is omitted |
| `className` | `string` | No | — | Additional wrapper classes |

#### Usage

```tsx
import CategoryBarCarousel from "@modules/common/components/shared/category-bar"

<CategoryBarCarousel
  categories={categories}
  countryCode={params.countryCode}
/>
```

#### Rules

- Always fetch categories in the server component via `listCategories()` and pass them as props. Do not fetch inside the carousel.
- The carousel prepends an `All` button automatically. Do not include it in the `categories` array.
- Use Medusa UI tokens for all colors. Do not hardcode colors like `bg-blue-600`.
- The carousel handles its own scroll state, drag-to-scroll, and active-item auto-scroll. Do not wrap it in another scroll container.
- For pages that need custom category selection behavior (e.g. filtering the store), pass `onSelectCategory`. For simple navigation, pass `countryCode` and let the carousel handle routing.

#### Consumers

| Page | Path | Notes |
|---|---|---|
| Home | `app/[countryCode]/(main)/page.tsx` | Default navigation via `countryCode` |
| Store | `app/[countryCode]/(main)/store/page.tsx` | Default navigation via `countryCode` |
| Categories | `app/[countryCode]/(main)/categories/page.tsx` | Default navigation via `countryCode` |
| Category Detail | `app/[countryCode]/(main)/categories/[...category]/page.tsx` | Passes `selectedCategory` from current category |

---

## Where to Use Shared Components

| Component | Current Consumers | Notes |
|---|---|---|
| `PageBanner` | About, Contact, FAQ, Terms, Returns, Seller Policy, Privacy, Featured Products, Track Order, Wishlist, Categories, Account | Use for any page-level hero with breadcrumb |
| `CategoryBarCarousel` | Home, Store, Categories, Category Detail | Use for horizontal category navigation under the header |
| `FAQSection` | Account (footer block) | Use for "Got questions?" footer section with link to FAQ page |
| `FAQSection` | Account (footer block) | Reusable "Got questions?" section with title, description, and FAQ link |

### Account Page Consumer Notes

The account page (`modules/account/templates/account-layout.tsx`) uses `PageBanner` differently from other pages:

- The banner is rendered **outside** `content-container` so it can use its built-in full-width wrapper.
- The account nav, main content, and footer block are wrapped in a separate `content-container` + `max-w-7xl mx-auto w-full` div for readability.
- The welcome message was moved from `modules/account/components/overview/index.tsx` into the banner via `title` and `description` props.
- When the user is logged out, the banner shows `title="Account"` and `description="Please login or sign up to continue"`.

### FAQSection

**Location**: `src/modules/common/components/shared/faq-section/index.tsx`
**Type**: Server component (no `"use client"`)
**Purpose**: Reusable "Got questions?" section with a title, description text, and a link to the FAQ page. Rendered in a bordered card.

#### Props

None — the component is self-contained.

#### Usage

```tsx
import FAQSection from "@modules/common/components/shared/faq-section"

<FAQSection />
```

#### Consumers

| Page | Path | Notes |
|---|---|---|
| Account | `modules/account/templates/account-layout.tsx` | Rendered as the footer block after the main account content |

---

## Adding a New Shared Component

1. Create the folder under `src/modules/common/components/shared/<component-name>/index.tsx`.
2. Use `"use client"` only when the component needs hooks, event handlers, or browser APIs.
3. Define props with a TypeScript interface. Do not use `any`.
4. Keep the component small and focused. A component should do one thing.
5. Export both named and default exports if the component might be used in different import styles.
6. Document the component in this file after it is merged.

## Rules

- Do not modify shared components to suit a single page. If a page needs a variant, add a prop with a sensible default.
- Do not add JSDoc comments unless explicitly asked.
- Do not introduce new UI libraries. Reuse existing local UI primitives (`@modules/common/components/ui`) and Medusa preset tokens.
- All shared components must support dark mode via `dark:` variants.
- Use Medusa UI tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`) for all colors. Do not hardcode color values.
