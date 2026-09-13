# Static Features and Data

## Overview

This document defines what "static" means in this storefront, where to add static content, and how to extend the site without changing backend schemas or adding new Medusa modules. Most UI enhancements can be implemented as static features using existing Medusa data patterns.

## What Is a Static Feature?

A static feature is any storefront addition that:
- Does **not** require a new Medusa module, workflow, or API endpoint
- Does **not** require a database migration or schema change
- Uses existing Medusa entities (products, categories, collections, regions) or purely client-side data
- Lives entirely in the storefront codebase under `apps/storefront/src/`

Examples:
- New page sections (testimonials, brand showcases, feature grids)
- Shared UI components (banners, carousels, tabs)
- Static content pages (About, FAQ, Privacy Policy)
- Client-side features (wishlists, recently viewed, quick view modals)
- UI theme customizations (colors, typography, spacing)

Non-examples (require backend work):
- New product attributes or metadata fields
- Custom checkout steps
- New API endpoints
- Admin dashboard widgets
- Webhook handlers

## Where to Add Static Features

### Pages Without Schema Changes

| Feature Type | Location | Example |
|---|---|---|
| New storefront page | `src/app/[countryCode]/(main)/<page>/page.tsx` | `/about`, `/faq`, `/contact` |
| New component | `src/modules/<feature>/components/` or `src/modules/common/components/` | Product card variant, brand logo |
| New server action | `src/lib/data/<feature>.ts` | Static content fetch, search |
| New client component | `src/modules/<feature>/components/<name>/index.tsx` | Interactive widget, modal |
| Static data (arrays, configs) | `src/lib/constants.tsx` or `src/data/` | Navigation links, feature flags |
| Global styles | `src/styles/globals.css` and `tailwind.config.js` | Typography, colors, animations |

### Using Existing Medusa Data

Before adding static mock data, check if the data already exists in Medusa:

| Need | Use This Medusa Entity |
|---|---|
| Product listings | `listProducts()` from `@lib/data/products` |
| Categories | `listCategories()` from `@lib/data/products` |
| Collections | `listCollections()` from `@lib/data/products` |
| Brands | Product `brand` field (if populated) or static list |
| Regions/countries | `listRegions()` from `@lib/data/cart` |
| Store info | `store` object from SDK |
| Customer data | `retrieveCustomer()` from `@lib/data/customer` |

If the data exists in Medusa, fetch it via server actions or directly in server components. Do not duplicate it in static files.

## Static Content Pages

### About, FAQ, Contact, Policy Pages

These pages should be:
- Server components by default
- Located under `src/app/[countryCode]/(main)/<page>/page.tsx`
- Fetched from `src/lib/data/` if they need dynamic content
- Rendered with existing layout chrome (`Nav`, `Footer`)

Example structure:
```
src/app/[countryCode]/(main)/
├── about/page.tsx
├── faq/page.tsx
├── contact/page.tsx
├── privacy-policy/page.tsx
├── returns-policy/page.tsx
└── terms-and-conditions/page.tsx
```

### Content Sources

Static page content can come from:
1. **Hardcoded in the component** — simplest, no backend needed
2. **Markdown files in `public/`** — load and render with a markdown parser
3. **Medusa CMS** (if installed) — fetch via SDK
4. **Environment variables** — for small config strings

For this storefront, use option 1 or 2. Medusa CMS is not installed.

## Client-Side Static Features

### Features That Can Be Purely Client-Side

- **Recently viewed products** — uses `localStorage` + existing product catalog
- **Wishlist** — uses `localStorage` or React context (no backend wishlist module in Medusa 2.20.1)
- **Quick view modal** — fetches product data via existing store API
- **Image gallery/lightbox** — purely presentational
- **Search suggestions** — client-side filter over existing products
- **Theme switcher** — toggles CSS classes or data attributes

### Rules for Client-Side Features

- Use `"use client"` at the top of the component.
- Fetch data via existing server actions (`@lib/data/*`) or directly via `@medusajs/js-sdk`.
- Do not call the SDK directly from client components without going through server actions or a proxy. The publishable API key is exposed in `.env.local`, but direct SDK calls from the client bypass server-side caching and auth checks.
- Store client-side state in `localStorage` or React context. Do not create new backend tables for client-only features.

## Shared Components vs Static Features

Shared components (`PageBanner`, `CategoryBarCarousel`, `RecentlyViewedSection`) are a **subset** of static features. They are the reusable building blocks. Static features are the **pages and sections** built from those blocks.

| Category | Examples | Location |
|---|---|---|
| Shared components | `PageBanner`, `CategoryBarCarousel` | `src/modules/common/components/shared/` |
| Static pages | About, FAQ, Contact | `src/app/[countryCode]/(main)/<page>/` |
| Static sections | Testimonials, BrandGrid, FeatureList | `src/modules/home/components/` or `src/modules/common/components/` |
| Static data | Navigation links, SEO configs | `src/lib/constants.tsx` |

## When to Add a New Module vs Static Feature

| Scenario | Approach |
|---|---|
| New UI pattern used on 2+ pages | Shared component in `common/components/shared/` |
| New page with no new data requirements | Static page in `app/[countryCode]/(main)/` |
| New section on an existing page | Component in the relevant feature module |
| New data that doesn't exist in Medusa | Static array/object in `src/lib/` or `src/data/` |
| New data that must be editable in admin | Backend module + migration — not static |
| New API behavior | Backend workflow + route — not static |

## SEO and Routing for Static Pages

### Routing

Static pages use the same `[countryCode]` prefix as the rest of the storefront:
```
/dk/about
/us/about
```

### SEO Metadata

Use `updateSEOMetadata()` from `@lib/data/seo` (or equivalent) in server components:
```ts
import { updateSEOMetadata } from "@/lib/data/seo"

updateSEOMetadata("About Us | Mrbulk", "Learn about Mrbulk...", "/about")
```

### Sitemap

Add static pages to `next-sitemap.js` if they should be indexed:
```js
// next-sitemap.js
export default {
  siteUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
  generateRobotsTxt: true,
  exclude: ["/checkout", "/account/*", "/[sitemap]"],
  // Add static pages here if needed
}
```

## Verification

Static features are storefront-only. Verify with:
1. `cd apps/storefront && pnpm exec tsc --noEmit` — 0 errors
2. `cd apps/storefront && pnpm run lint` — no new errors
3. `pnpm run dev` — page renders without 500
4. Check dark mode by toggling `.dark` on `<html>`
5. Check responsive breakpoints (`small`, `medium`, `large`) in DevTools

## Common Patterns

### Static Data File

```ts
// src/lib/constants.tsx
export const NAVIGATION_LINKS = [
  { href: "/store", label: "Store" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
] as const

export const FEATURE_ITEMS = [
  { icon: "truck", title: "Free Shipping", description: "On orders over $50" },
  { icon: "shield", title: "Secure Checkout", description: "SSL encrypted" },
]
```

### Static Page Component

```tsx
// src/app/[countryCode]/(main)/about/page.tsx
import { Heading, Text } from "@modules/common/components/ui"
import { updateSEOMetadata } from "@/lib/data/seo"

export default async function AboutPage() {
  updateSEOMetadata("About Us | Mrbulk", "Learn about Mrbulk...", "/about")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Heading as="h2" level="h2">About Mrbulk</Heading>
      <Text className="text-ui-fg-subtle">
        Mrbulk is a premium ecommerce platform...
      </Text>
    </div>
  )
}
```

## Related Files

- `site-structure/global-styles.md` — global CSS and Tailwind config
- `site-structure/components.md` — component catalog
- `customizations/shared-components.md` — shared component API reference
- `customizations/rules.md` — editing rules and conventions
