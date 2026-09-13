# Pages

## Overview

This document tracks page inventory, gaps, creation patterns, and content-management options for the Medusa Next.js starter storefront.

## Current Page Inventory

### Existing Pages

| URL | File | Type | Notes |
|---|---|---|---|
| `/` | `app/[countryCode]/(main)/page.tsx` | server | Home; Hero + FeaturedProducts |
| `/store` | `app/[countryCode]/(main)/store/page.tsx` | server | Product listing with sort/filter |
| `/products/[handle]` | `app/[countryCode]/(main)/products/[handle]/page.tsx` | server | PDP with generateStaticParams |
| `/collections/[handle]` | `app/[countryCode]/(main)/collections/[handle]/page.tsx` | server | Collection page |
| `/categories/[...category]` | `app/[countryCode]/(main)/categories/[...category]/page.tsx` | server | Category listing |
| `/cart` | `app/[countryCode]/(main)/cart/page.tsx` | server | Cart template |
| `/verify-account` | `app/[countryCode]/(main)/verify-account/page.tsx` | client | Email verification |
| `/account` | `app/[countryCode]/(main)/account/layout.tsx` + parallel slots | server | Dashboard / login switch |
| `/account/profile` | `account/@dashboard/profile/page.tsx` | server | Profile editing |
| `/account/orders` | `account/@dashboard/orders/page.tsx` | server | Order list |
| `/account/addresses` | `account/@dashboard/addresses/page.tsx` | server | Address book |
| `/account/orders/details/[id]` | `account/@dashboard/orders/details/[id]/page.tsx` | server | Order detail |
| `/order/[id]/confirmed` | `app/[countryCode]/(main)/order/[id]/confirmed/page.tsx` | server | Order confirmation |
| `/order/[id]/transfer/[token]` | `.../transfer/[token]/page.tsx` | server | Transfer request |
| `/order/[id]/transfer/[token]/accept` | `.../accept/page.tsx` | server | Accept transfer |
| `/order/[id]/transfer/[token]/decline` | `.../decline/page.tsx` | server | Decline transfer |
| `/checkout` | `app/[countryCode]/(checkout)/checkout/page.tsx` | server | Checkout form |

### Requested Pages

| Page | Status | Path |
|---|---|---|
| About | Created | `app/[countryCode]/(main)/about/page.tsx` |
| Contact | Created | `app/[countryCode]/(main)/contact/page.tsx` |
| FAQ | Created | `app/[countryCode]/(main)/faq/page.tsx` |
| Terms and Conditions | Created | `app/[countryCode]/(main)/terms/page.tsx` |
| Returns Policy | Created | `app/[countryCode]/(main)/returns/page.tsx` |
| Seller Policy | Created | `app/[countryCode]/(main)/seller-policy/page.tsx` |
| Privacy Policy | Created | `app/[countryCode]/(main)/privacy/page.tsx` |
| Categories | Exists | `app/[countryCode]/(main)/categories/[...category]/page.tsx` |
| Featured Products | Created | `app/[countryCode]/(main)/featured/page.tsx` |
| Track Order | Created | `app/[countryCode]/(main)/track-order/page.tsx` |
| Wishlist | Created | `app/[countryCode]/(main)/wishlist/page.tsx` |

## How to Create a Page

### Simplest Pattern: Static Server Page

The simplest way to add a new page in this storefront is to create a `page.tsx` file under `app/[countryCode]/(main)/`. Because `(main)/layout.tsx` wraps all main pages with `<Nav>` and `<Footer>`, the new page automatically gets the site chrome.

Example:

```ts
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description.",
}

export default async function PageName() {
  return (
    <div className="w-full flex justify-center px-8 py-12">
      <div className="max-w-3xl w-full">
        <h1 className="text-2xl-semi mb-4">Page Title</h1>
        <p className="text-base-regular text-ui-fg-base">
          Page content here.
        </p>
      </div>
    </div>
  )
}
```

Notes:
- The file must be named `page.tsx` for Next.js App Router to recognize it as a route.
- Because this project uses localized routing, the page automatically lives under `/[countryCode]/page-name`.
- Use `LocalizedClientLink` for internal links so the countryCode prefix is preserved.
- Server components are preferred; add `"use client"` only when interactivity is required.
- For content pages, use the `PageBanner` shared component for consistent page headers with breadcrumbs.

### Recommended Page Pattern with PageBanner

For static content pages, the recommended structure is:

```ts
import { Metadata } from "next"
import PageBanner from "@modules/common/components/shared/page-banner"

export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description.",
}

export default async function PageName() {
  return (
    <div className="w-full">
      <PageBanner title="Page Title" description="Page description." />
      <div className="w-full flex justify-center px-8 py-12">
        <div className="max-w-3xl w-full">
          <p className="text-base-regular text-ui-fg-base">
            Page content here.
          </p>
        </div>
      </div>
    </div>
  )
}
```

### PageBanner Placement Rule

`PageBanner` renders its own full-width outer wrapper (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`). Because of that:

- On normal `(main)` pages, place `PageBanner` directly inside a plain `<div className="w-full">` so it can span the full viewport width like the other pages.
- Do **not** wrap `PageBanner` in `content-container` or another centered/max-width wrapper, or the banner will be narrowed.
- The page body content below the banner should still be wrapped in `w-full flex justify-center px-8 py-12` with `max-w-3xl` for readability.

### Account Page Exception

The account page is a special case because it has its own layout chrome (`AccountNav` sidebar and the “Got questions?” footer block). In `modules/account/templates/account-layout.tsx`:

- `PageBanner` is placed **outside** `content-container` so it spans full width.
- The account nav/content section is wrapped separately in `content-container` + `max-w-7xl mx-auto w-full` so the sidebar and main content remain readable.

If `PageBanner` is wrapped in `content-container` on the account page, it will be narrowed to the inner content width instead of spanning the full viewport width like the other pages. This is because `PageBanner` already includes its own full-width outer wrapper.

### Page Creation Best Practices

Based on the current storefront architecture:

- **Static pages** go under `src/app/[countryCode]/(main)/<page-name>/page.tsx`.
- Use **server components** by default. Add `"use client"` only when the page needs interactivity, browser APIs, or client-side state.
- Use `Metadata` API for SEO: set `title` and `description` at minimum.
- Use `LocalizedClientLink` for all internal links so the `countryCode` prefix is preserved.
- Use `PageBanner` for page headers with breadcrumbs on content pages.
- Keep page content readable with `max-w-3xl w-full` inside a centered wrapper.
- Do not create duplicate layouts — reuse the existing `(main)/layout.tsx` chrome (Nav + Footer).
- For data-fetching, use server actions from `src/lib/data/` or the Medusa SDK directly in server components.

### When NOT to Create a New Page File

- If the content can be added to an existing page/module, extend that instead of creating a new route.
- If the page requires backend changes (new module, API route, workflow), confirm with the user before proceeding — backend changes are out of scope unless explicitly requested.
- If the page is a variant of an existing page (e.g., a filtered product listing), use URL query parameters instead of a new route.

### Pages That Should NOT Use PageBanner

- **Checkout** (`app/[countryCode]/(checkout)/checkout/page.tsx`) — checkout has its own minimal chrome.
- **Cart** (`app/[countryCode]/(main)/cart/page.tsx`) — cart has its own template.
- **Account dashboard pages** — the account layout already handles the banner; do not add another `PageBanner` inside dashboard pages like `profile`, `orders`, or `addresses`.

### When to Add `generateStaticParams`

If the page needs pre-rendering for multiple locales/regions, add `generateStaticParams` similar to `products/[handle]/page.tsx` and `categories/[...category]/page.tsx`.

### When to Add Loading/Not-Found

- Add `loading.tsx` next to the page if the page has slow async data and needs a skeleton.
- Add `not-found.tsx` if the page has custom 404 handling beyond the group default.

## Security Best Practices

### Environment Variables

- **Never expose secrets to the client.** Only variables prefixed with `NEXT_PUBLIC_` are available in the browser.
- Backend secrets (`JWT_SECRET`, `COOKIE_SECRET`, `DATABASE_URL`) must stay in `apps/backend/.env` and never be referenced from storefront code.
- The storefront’s `check-env-variables.js` enforces that `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is present at startup.

### Content Security Policy (CSP)

CSP protects against XSS, clickjacking, and code injection. Next.js supports CSP via `next.config.js` headers or middleware nonces.

- **Static pages** can use static CSP headers in `next.config.js`.
- **Dynamic pages** that need nonces must opt into dynamic rendering.
- Development usually requires `'unsafe-eval'`; production should tighten directives.
- Reference: https://nextjs.org/docs/app/guides/content-security-policy

### Input Sanitization

- Server components receive route params from Next.js, but content rendered from CMS or user input must still be sanitized before rendering HTML.
- When using `dangerouslySetInnerHTML`, ensure the source is trusted and escaped.
- For JSON-LD structured data, escape `<` characters: `JSON.stringify(data).replace(/</g, "\\u003c")` to prevent XSS via JSON payloads.

### Secure Headers

Consider adding these headers in `next.config.js` or middleware:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` or `SAMEORIGIN`
- `Strict-Transport-Security` for production HTTPS
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` to limit browser features

### API Calls from Storefront

- Always use the Medusa JS SDK (`sdk.store.*`, `sdk.client.fetch("/store/...")`). Never use raw `fetch()` for Medusa APIs — the SDK injects required headers like `x-publishable-api-key`.
- Do not expose admin API methods in the storefront.
- Validate and sanitize any user-provided input before sending it to backend API routes.

### Authentication and Authorization

- Account pages are protected by `retrieveCustomer()` in server components; anonymous users get `notFound()` instead of blank/broken pages.
- Client-side account features should check auth state before rendering sensitive UI.
- Never store JWTs in localStorage; use HTTP-only cookies when possible.

## SEO Best Practices

### Metadata API

Use Next.js Metadata API for every page:

```ts
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description for search engines.",
  alternates: { canonical: "https://example.com/page" },
  openGraph: {
    title: "Page Title",
    description: "Page description.",
    url: "https://example.com/page",
    siteName: "Store Name",
    images: ["/og-image.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Page Title",
    description: "Page description.",
    images: ["/og-image.jpg"],
  },
}
```

### Title Templates

Set a title template in the root or `(main)` layout so child pages inherit a consistent pattern:

```ts
title: {
  template: "%s | Store Name",
  default: "Store Name",
}
```

### Sitemap and Robots

- **`sitemap.xml`**: Use Next.js file-based metadata or a dynamic `app/sitemap.ts` to generate the sitemap. Include all public pages.
- **`robots.txt`**: Add `app/robots.ts` to control crawler access and point to the sitemap.
- Submit the sitemap to Google Search Console and Bing Webmaster Tools after deployment.

### Structured Data (JSON-LD)

Add schema.org JSON-LD for rich snippets. Common types for ecommerce:
- `Organization` on the home page
- `WebSite` with `SearchAction` on the root layout
- `BreadcrumbList` on category and product pages
- `Product` on product pages
- `FAQPage` on the FAQ page
- `WebPage` or `AboutPage` on static content pages

Render JSON-LD with a `<script type="application/ld+json">` tag. Escape `<` in JSON strings to prevent XSS:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
  }}
/>
```

### Open Graph and Social Sharing

- Provide `og:image` for every page. Use `/opengraph-image.jpg` or generate dynamic OG images with `ImageResponse`.
- Ensure `og:url` matches the canonical URL.
- Test sharing with Facebook Sharing Debugger, Twitter Card Validator, and LinkedIn Post Inspector.

### Accessibility and Semantic HTML

- Use semantic elements (`<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`) to help crawlers understand page structure.
- Ensure headings are hierarchical (`<h1>` per page, then `<h2>`, `<h3>`).
- Provide descriptive `alt` text for images.
- Ensure interactive elements are keyboard-accessible.

## Page Structure and Architecture

### Routing

- All customer-facing routes live under `app/[countryCode]/(main)/...`.
- The country segment is resolved by middleware from URL, `cf.country`, `x-vercel-ip-country`, or `NEXT_PUBLIC_DEFAULT_REGION`.
- `LocalizedClientLink` automatically prepends the active `countryCode` — application code only writes `/products/...`, `/account`, etc.

### Layout Inheritance

- `app/[countryCode]/(main)/layout.tsx` wraps every main page with `<Nav>`, conditional `<CartMismatchBanner>`, conditional `<FreeShippingPriceNudge>`, and `<Footer>`.
- New pages under `(main)` automatically inherit this chrome.
- Checkout uses a separate `(checkout)` route group with a minimal layout.

### Server vs Client Components

- Prefer server components for static or data-fetching pages.
- Add `"use client"` only when the page needs interactivity, browser APIs, or client-side state.
- Reference `storefront-routing.md` for the current server/client component map.

### Typography

Use the project’s two typography systems correctly:

| Scenario | Use |
|---|---|
| Inside `@medusajs/ui` components (`Text`, `Heading`) | Preset `txt-*` classes |
| Custom headings / page titles | Local `text-*-semi` classes |
| Body text | `text-base-regular` or `text-base-semi` |
| Small labels | `txt-small` / `txt-small-plus` |

Do not mix `txt-medium` with `text-base-regular` on the same element — they have different line heights.

### Color and Theme

- Use Medusa UI design tokens via Tailwind utility classes (`text-ui-fg-base`, `bg-ui-bg-base`, `border-ui-border-base`, etc.).
- Dark mode is handled by the `.dark` class on `<html>`; tokens automatically switch via CSS variables.
- Reference `global-styles.md` for the full token catalog.

### Spacing and Layout

- Page content wrapper: `w-full flex justify-center px-8 py-12`
- Content container: `max-w-3xl w-full` for text-heavy pages
- Use `content-container` class inside templates for consistent horizontal padding.
- Archive templates (`StoreTemplate`, `CategoryTemplate`, `CollectionTemplate`) must use `py-6`, not `pb-6`. The top padding separates the refinement sidebar from the carousel/header above it; bottom padding separates the product grid from the footer below. All three archive templates share the same vertical rhythm.

### Images and Media

- Use `next/image` for all images to get automatic optimization, modern formats, and lazy loading.
- Provide explicit `width` and `height` or use `fill` with a positioned parent to avoid layout shift.
- Place static assets in `public/` and reference them with `/path-to-asset`.

### Performance

- Static pages are automatically optimized by Next.js; they can be cached by CDNs.
- If a page must be dynamic, consider `fetch` caching or React `cache()` to avoid redundant data fetches.
- Avoid client-side data fetching when server components can fetch at build time or request time.

### Forms and Validation

- Use server actions or API route handlers for form submissions.
- Validate input on the server; never trust client-side validation alone.
- Show inline validation errors using the project’s existing form patterns.

## Content Management Options

For content-heavy pages (About, FAQ, Policies), there are several approaches:

### Option 1: Hardcoded Static Pages (Current Approach)

- Pros: Simple, no extra infrastructure, full design control
- Cons: Requires code deploy to update content
- Best for: Content that rarely changes

### Option 2: Medusa Content Plugin (`medusa-plugin-content`)

- Plugin: `medusa-plugin-content`
- Provides: Headless CMS inside Medusa admin, content collections, draft/published workflow, public store API with caching
- Best for: Structured content managed by non-technical users
- Tradeoff: Requires backend plugin install and migration

### Option 3: Third-Party CMS

- Examples: Contentful, Sanity, Strapi
- Best for: Rich content, multi-channel publishing
- Tradeoff: External dependency, more integration work

### Option 4: Custom Backend API + SDK

- Create custom API routes in `apps/backend/src/api/`
- Fetch from storefront using `sdk.client.fetch()`
- Best for: Fully custom content models
- Tradeoff: Requires backend + frontend work

## Recommendation

For the current set of requested pages, **Option 1 (hardcoded static pages)** is the fastest path. If content needs to become editable by non-technical users later, migrate to **Option 2 (`medusa-plugin-content`)** because it keeps content management inside the Medusa admin without adding external services.

## Missing Features to Consider

- **Wishlist**: No wishlist module exists in the current scaffold. Implementing this requires either a custom module or an external service.
- **Track Order**: The order confirmation page exists, but a dedicated tracking page would need order lookup by ID/email or integration with a shipping provider.
- **Featured Products**: Homepage already shows featured products; a standalone page may duplicate that unless it is paginated or filterable.

## Production Checklist

Before shipping static pages to production, verify:

- [ ] Each page exports unique `metadata.title` and `metadata.description`
- [ ] Canonical URLs are set via `alternates.canonical`
- [ ] Open Graph images are provided or inherited from layout
- [ ] JSON-LD structured data is added where appropriate
- [ ] `sitemap.xml` and `robots.txt` are configured
- [ ] Environment variables are documented in `.env.template`, not committed
- [ ] No secrets are exposed in client-side code
- [ ] Images use `next/image` with proper `alt` text
- [ ] Pages pass Lighthouse accessibility and SEO audits
