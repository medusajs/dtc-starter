# Storefront Routing

## Overview

The storefront is a Next.js 15 App Router project with **localized routing** (`/[countryCode]/...`), **two route groups** (`(main)` and `(checkout)`), and **one parallel-route slot** (`account/@dashboard` vs `account/@login`). There is no `error.tsx` anywhere — failures fall through to the nearest `not-found.tsx`. This file is the canonical reference for what is wired where and where the gaps are.

## Localized URL Prefix

Every customer-facing route lives under `app/[countryCode]/...`. The country segment is the first path segment (`/dk`, `/us`, `/gb`, etc.).

- `src/middleware.ts` resolves the country from the URL, `cf.country` (Cloudflare), `x-vercel-ip-country` (Vercel), or `NEXT_PUBLIC_DEFAULT_REGION` (default `"dk"`), and 307-redirects to the country-prefixed path if the prefix is missing.
- `LocalizedClientLink` (`@modules/common/components/localized-client-link`) wraps `next/link` and prepends the active `countryCode` automatically — so application code only writes `/products/...`, `/account`, `/cart`, etc.
- `<RootLayout>` at `app/layout.tsx` sets `metadataBase: new URL(getBaseURL())` (using `NEXT_PUBLIC_BASE_URL || "https://localhost:8000"`). The `[countryCode]/(main)/layout.tsx` sets `metadataBase` again on the regional layout (same value).
- Server components read the country via `props.params` (Next.js 15 made `params` async — every page must `await props.params`).

## Middleware

`src/middleware.ts` runs on the **Edge runtime** and handles three responsibilities: region detection and URL prefixing, cache ID cookie management, and region map caching.

### Why Edge Runtime?

The middleware runs on Vercel Edge Functions (or compatible edge runtimes). This means:
- **Cannot use the Medusa JS SDK** — it requires Node.js built-ins (`Buffer`, `crypto`, etc.) that are not available on the edge.
- Must use raw `fetch()` for all HTTP calls.
- Has access to `request.cf` (Cloudflare Workers geo headers) and `request.headers`.

### Matcher

```ts
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
```

Excluded paths:
- `api/*` — API routes (Next.js and storefront API routes)
- `_next/static/*` — Next.js static assets
- `_next/image/*` — Next.js image optimization
- `favicon.ico` — favicon
- `images/*`, `assets/*` — static asset directories
- `*.{png,svg,jpg,jpeg,gif,webp}` — image file extensions

Everything else (including all `/(main)/`, `/(checkout)/`, and `/order/` routes) passes through the middleware.

### Region Resolution Chain

The middleware resolves the region (country code) in this priority order:

1. **URL prefix** — the first path segment (e.g., `/dk/store`, `/de/account`).
2. **Cloudflare geo header** — `request.cf?.country` (ISO 3166-1 alpha-2).
3. **Vercel geo header** — `x-vercel-ip-country`.
4. **Fallback** — `NEXT_PUBLIC_DEFAULT_REGION` env var (default: `"dk"`).

### 307 Redirect

If the URL does not start with a valid country code, the middleware issues a **307 redirect** to `/{resolvedCountryCode}/{path}`. The 307 preserves the HTTP method and body, which is important for POST requests.

The resolved country code is validated against the region map (fetched from the backend). If the country is not in any region, the middleware falls back to `NEXT_PUBLIC_DEFAULT_REGION`.

### Region Map Cache

The middleware maintains a **1-hour in-memory cache** of regions:

```ts
let regionMapCache = {
  regionMap: Map<string, HttpTypes.StoreRegion>,
  regionMapUpdated: 0,
}
```

- `regionMapUpdated` is a timestamp. The cache is considered stale if `Date.now() - regionMapUpdated > 3600 * 1000`.
- On first request or when stale, the middleware fetches `{BACKEND_URL}/store/regions` with `x-publishable-api-key`.
- The response is indexed by country ISO code (`region.countries.map(c => c.iso_2)`).
- Cache is per-process — in a multi-instance deployment, each instance maintains its own cache.

### Cache Invalidation

There is no explicit invalidation. The cache simply expires after 1 hour and re-fetches. This is acceptable because region data changes infrequently.

### `_medusa_cache_id` Cookie

The middleware manages a `_medusa_cache_id` cookie that namespaces the Next.js fetch cache:

- **Set on first request**: When a request arrives with a country-prefixed URL and no `_medusa_cache_id` cookie, the middleware generates a new UUID and sets the cookie.
- **Expiry**: 24 hours (`maxAge: 60 * 60 * 24`).
- **Purpose**: Ensures that fetch cache tags (`carts-{id}`, `products-{id}`, etc.) are scoped per-user. Without this, one user's cart data could leak into another user's cached response.

### Region Fetch Call

```ts
fetch(`${BACKEND_URL}/store/regions`, {
  next: { revalidate: 3600, tags: [`regions-${cacheId}`] },
  headers: { "x-publishable-api-key": NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY },
  cache: "force-cache",
})
```

- `next: { revalidate: 3600 }` — Next.js caches the response for 1 hour.
- `next: { tags: [`regions-${cacheId}`] }` — cache tag is scoped by the user's `_medusa_cache_id`.
- `cache: "force-cache"` — always reads from cache if fresh; falls back to network on miss or stale.

### Edge Runtime Constraints

Because the middleware runs on the edge:
- **Limited `process.env` access** — only `NEXT_PUBLIC_*` env vars are available (injected at build time). The middleware reads `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_DEFAULT_REGION`.
- **No Node.js APIs** — no `Buffer`, `crypto`, `fs`, etc. Use Web APIs only. The one exception is `crypto.randomUUID()` which is available in the edge runtime.
- **No SDK** — cannot import `@medusajs/js-sdk`. Use raw `fetch` with the correct headers.

### Middleware Common Gotchas

- **The middleware runs on every request** (except excluded paths). Keep it fast — the region map fetch is the only network call, and it's cached.
- **307 redirects preserve the method** — a POST to `/checkout` without a country prefix will 307 to `/dk/checkout` with the POST body intact.
- **`_medusa_cache_id` is set lazily** — it is not set on the first request if the URL already has a country prefix and the cookie exists.
- **Region map is per-process** — in a serverless environment with warm instances, each instance may have a slightly stale region map for up to 1 hour.

## Route Groups

| Group | Layout | Chrome |
|---|---|---|
| `app/[countryCode]/(main)/layout.tsx` | Async server layout | Fetches `retrieveCustomer()`, `retrieveCart()`, `listCartOptions()`; renders `<Nav>`, conditional `<CartMismatchBanner>` (only when `customer && cart`), conditional `<FreeShippingPriceNudge variant="popup">` (only when `cart`), `{children}`, `<Footer>`. |
| `app/[countryCode]/(checkout)/layout.tsx` | Synchronous client/server layout (no data fetch) | Minimal "Back to cart" link + `Medusa Store` brand header (`data-testid="back-to-cart-link"`, `data-testid="store-link"`), `{children}` with `data-testid="checkout-container"`, and `MedusaCTA` footer. |

The two groups **do not share a parent layout** other than `app/layout.tsx`. Checkout intentionally gets a much smaller chrome (no global Nav / no `CartDropdown`) so the focus is on the form.

## Parallel Routes (Account)

`app/[countryCode]/(main)/account/` uses two parallel slots:

| Slot | Folder | Renders when |
|---|---|---|
| `@dashboard` | `account/@dashboard/{page,profile,orders,addresses,orders/details/[id]}/page.tsx` | `customer` is truthy |
| `@login` | `account/@login/page.tsx` | `customer` is `null` |

The `account/layout.tsx` is the **switch**:
```tsx
const customer = await retrieveCustomer().catch(() => null)
return (
  <AccountLayout customer={customer}>
    {customer ? dashboard : login}
  </AccountLayout>
)
```

Both slots have their own `loading.tsx` (a small spinner). `AccountLayout` (template) renders the `<AccountNav>` sidebar + the active slot + a "Ready to place an order?" footer CTA.

There is **no parallel-route conflict resolution** here — the layout explicitly picks one slot based on the customer fetch, so a route group like `@login` is never rendered while the user is signed in.

## Routes Inventory

| URL | File | Type | Notable |
|---|---|---|---|
| `/` | `app/[countryCode]/(main)/page.tsx` | server | `metadata.title = "Medusa Next.js Starter Template"`; fetches `getRegion` + `listCollections({ fields: "id, handle, title" })`; renders `<Hero>` + `<FeaturedProducts>`. |
| `/store` | `app/[countryCode]/(main)/store/page.tsx` | server | Reads `sortBy`, `page`, `optionValueIds` from `searchParams`; renders `<StoreTemplate>`. |
| `/products/[handle]` | `app/[countryCode]/(main)/products/[handle]/page.tsx` | server | Implements `generateStaticParams` (per-region prebuild across all products × regions) + `generateMetadata` (per-product OG tags); renders `<ProductTemplate>`. |
| `/collections/[handle]` | `app/[countryCode]/(main)/collections/[handle]/page.tsx` | server | `generateStaticParams`; renders `<CollectionTemplate>`. |
| `/categories/[...category]` | `app/[countryCode]/(main)/categories/[...category]/page.tsx` | server | `generateStaticParams`; renders `<CategoryTemplate>`. |
| `/cart` | `app/[countryCode]/(main)/cart/page.tsx` | server | `retrieveCart()`; `notFound()` if missing. |
| `/verify-account` | `app/[countryCode]/(main)/verify-account/page.tsx` | client (uses `useEffect`) | Reads `?token=` and calls `confirmEmailVerification` once. |
| `/account` | `app/[countryCode]/(main)/account/layout.tsx` + `@dashboard` / `@login` | server layout | Switches on `retrieveCustomer()`. |
| `/account/profile` / `/orders` / `/addresses` / `/orders/details/[id]` | `@dashboard/...` | server | See `account` features in `features.md`. |
| `/order/[id]/confirmed` | `app/[countryCode]/(main)/order/[id]/confirmed/page.tsx` | server | `retrieveOrder(id)`; `notFound()` if missing; renders `<OrderCompletedTemplate>`. |
| `/order/[id]/transfer/[token]` | `app/[countryCode]/(main)/order/[id]/transfer/[token]/page.tsx` | server | Static transfer-request landing with `<TransferActions>`. |
| `/order/[id]/transfer/[token]/accept` | `…/accept/page.tsx` | server | Calls `acceptTransferRequest(id, token)` server action. |
| `/order/[id]/transfer/[token]/decline` | `…/decline/page.tsx` | server | Calls `declineTransferRequest(id, token)` server action. |
| `/checkout` | `app/[countryCode]/(checkout)/checkout/page.tsx` | server | `retrieveCart()`; `notFound()`; renders `<PaymentWrapper>` + `<CheckoutForm>` + `<CheckoutSummary>`. |
| `/api/payment-return` | `app/api/payment-return/route.ts` | Next.js Route Handler (GET) | Stripe return handler — see `plugins-and-integrations.md`. |

## Loading States

Only **route-level** `loading.tsx` files exist. There is no group-level `(main)/loading.tsx` and no `error.tsx` anywhere.

| `loading.tsx` | Renders |
|---|---|
| `app/[countryCode]/(main)/cart/loading.tsx` | `<SkeletonCartPage />` |
| `app/[countryCode]/(main)/account/loading.tsx` | Spinner (account group level) |
| `app/[countryCode]/(main)/account/@dashboard/loading.tsx` | Spinner (dashboard slot level) |
| `app/[countryCode]/(main)/order/[id]/confirmed/loading.tsx` | Spinner |

`<Suspense>` boundaries are used inside specific templates — notably in `nav/index.tsx` (wraps `<CartButton>` so the static `Cart (0)` link renders immediately), `products/templates/index.tsx` (wraps `<ProductActionsWrapper>` and `<RelatedProducts>`), and `store/templates/index.tsx` (wraps `<PaginatedProducts>`). The nav cart fallback `data-testid="nav-cart-link"` shows `Cart (0)` while the async cart fetch resolves.

## Not-Found Pages

Four `not-found.tsx` files exist at different scopes:

| File | Behavior |
|---|---|
| `app/not-found.tsx` | Top-level 404 (outside any `[countryCode]`). Uses raw `next/link` (no region prefix). |
| `app/[countryCode]/(main)/not-found.tsx` | 404 inside `(main)`. Uses `<InteractiveLink>` (region-aware). |
| `app/[countryCode]/(checkout)/not-found.tsx` | 404 inside `(checkout)`. |
| `app/[countryCode]/(main)/cart/not-found.tsx` | Cart-specific 404 with copy: "Clear your cookies and try again." — fires when `retrieveCart()` returns `null` (e.g. an expired cart cookie). |

`retrieveCart()` in `cart/page.tsx` calls `notFound()` on null, which routes to `cart/not-found.tsx` rather than the parent `(main)/not-found.tsx`.

## Server vs Client Component Map

| Component | Type | Why |
|---|---|---|
| `app/layout.tsx` | server | Static; just sets `<html>` + metadata. |
| `app/[countryCode]/(main)/layout.tsx` | server (async) | Needs `retrieveCustomer`, `retrieveCart`, `listCartOptions` for banner + nudge. |
| `app/[countryCode]/(main)/account/layout.tsx` | server (async) | Needs `retrieveCustomer` to pick the parallel slot. |
| `app/[countryCode]/(main)/account/@dashboard/page.tsx` | server (async) | Fetches `retrieveCustomer` + `listOrders`. |
| `app/[countryCode]/(main)/products/[handle]/page.tsx` | server (async) | `generateStaticParams` + `generateMetadata` + product fetch. |
| `app/[countryCode]/(main)/verify-account/page.tsx` | client | `useEffect` to confirm the token. |
| `app/[countryCode]/(main)/order/[id]/transfer/[token]/{page,accept/page,decline/page}.tsx` | server | Server actions only. |
| `app/[countryCode]/(checkout)/checkout/page.tsx` | server (async) | `retrieveCart` + `notFound()`. |
| `app/api/payment-return/route.ts` | route handler | Server-only. |
| All `account/@dashboard/...` subpages | server (async) | Each fetches its own data. |

## `generateStaticParams` Usage

`generateStaticParams` is implemented in two places — both for the localized catalog:

- `app/[countryCode]/(main)/products/[handle]/page.tsx`: lists every region (`listRegions` with no `limit`) and every product (`listProducts` with `limit=100`), producing a `{ countryCode, handle }` pair for each combination. Lets Next pre-render the PDP for every product in every seeded region.
- `app/[countryCode]/(main)/categories/[...category]/page.tsx` and `collections/[handle]/page.tsx`: each lists the relevant entity across all regions to pre-render the localized listing pages.

Adding a new region (via the admin) requires a re-deploy / re-build for static pages to include it; until then, the middleware's `307` redirect will still work for dynamic fetches, but the prebuilt `not-found.tsx` will render for any `generateStaticParams`-resolved page that wasn't prebuilt.

## Common Gotchas

- **No `error.tsx`** — unhandled errors propagate to the closest `error.tsx` (none), then to the framework's default 500 page. Server actions that throw bubble up to the nearest error boundary in the calling client component.
- **`(checkout)` and `(main)` are separate groups** — components rendered inside `(main)/layout.tsx` (Nav, CartDropdown, CartMismatchBanner, FreeShippingPriceNudge, Footer) are **not** present on `/checkout`. If you need a "Back" link in a checkout sub-route, use the `data-testid="back-to-cart-link"` already provided by the checkout layout.
- **Missing `(main)/loading.tsx`** — the top-level `(main)` group has no fallback, so a slow page render shows blank space rather than a skeleton.
- **`account/layout.tsx` is the only place that picks parallel slots** — adding a new slot requires editing this file too.
- **`<RootLayout>` doesn't import `Toaster`** — the upstream `Toaster` component is intentionally removed; the codebase `// TODO: Re-add Toaster component when needed` comments appear in `account/layout.tsx` and `cart-dropdown/index.tsx`.
