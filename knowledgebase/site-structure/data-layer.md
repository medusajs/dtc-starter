# Data Layer Reference

## Overview
The storefront data layer is built on **Next.js Server Actions** (every `src/lib/data/*.ts` file begins with `"use server"`). It uses the **Medusa JS SDK** to talk to the backend REST API. All data fetching goes through Next.js fetch cache with cache tags for revalidation.

## Architecture

```
Page (Server Component)
  → Data Layer (Server Action)
    → Medusa JS SDK
      → Backend REST API
        → Medusa Core Modules
```

### Key Principles
- Server Components by default; data fetched in the component body
- Server Actions (`"use server"`) for mutations and form submissions
- Cache tags per entity, scoped by the `_medusa_cache_id` cookie namespace
- Cookie-based state: cart ID, auth token, locale, cache ID
- Region-aware: all product/cart queries are scoped to a region

## SDK Configuration

`src/lib/config.ts`:
```ts
let MEDUSA_BACKEND_URL = "http://localhost:9000"
if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

// Inject x-medusa-locale on every request
const originalFetch = sdk.client.fetch.bind(sdk.client)
sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs
): Promise<T> => {
  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  const newHeaders = {
    ...localeHeader,
    ...headers,
  }
  init = { ...init, headers: newHeaders }
  return originalFetch(input, init)
}
```

`MEDUSA_BACKEND_URL` is a module-level `let` that is **reassigned** in an `if` block (not a `??` nullish-coalescing default). The SDK constructor runs after the assignment, so the env var takes precedence when set.

Locale resolution lives in `src/lib/util/get-locale-header.ts`, which calls `getLocale()` from `@lib/data/locale-actions`.

## Middleware (`src/middleware.ts`)

Runs on the Edge runtime. **Cannot use the Medusa JS SDK** (Node-only) — uses raw `fetch()`.

Responsibilities:
1. Detect region from URL prefix (first segment) → `request.cf.country` (Cloudflare Workers) → `x-vercel-ip-country` (Vercel) → `NEXT_PUBLIC_DEFAULT_REGION` fallback
2. 307 redirect to `/{countryCode}/{rest-of-path}` if missing
3. Manage `_medusa_cache_id` cookie: set on first request with a country URL, `maxAge: 60 * 60 * 24` (24h)
4. Maintain a 1-hour in-memory region map (`regionMapCache` module-level): `{ regionMap: Map<string, HttpTypes.StoreRegion>, regionMapUpdated: number }`. Refreshes when missing or older than `Date.now() - 3600 * 1000`. Re-fetch uses `next: { revalidate: 3600, tags: [`regions-${cacheId}`] }, cache: "force-cache"` so cache is per-user.
5. Fetches `${BACKEND_URL}/store/regions` with `x-publishable-api-key` from `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

Matcher excludes: `api`, `_next/static`, `_next/image`, `favicon.ico`, `images`, `assets`, image extensions.

## Cookie Management (`src/lib/data/cookies.ts`)

The file starts with `import "server-only"`. All helpers are `async` (await `nextCookies()`).

| Cookie | Purpose | Expiry | SameSite | httpOnly |
|---|---|---|---|---|
| `_medusa_cart_id` | Cart ID | 7 days | `lax` | true |
| `_medusa_jwt` | Customer auth token | 7 days | `lax` | true |
| `_medusa_locale` | Locale preference | 1 year (`setLocaleCookie`) | `strict` | **false** (client-readable) |
| `_medusa_cache_id` | Cache tag namespace (UUID) | 24 hours (middleware) | n/a | n/a |
| `_medusa_pending_customer` | Pending customer (verification) | 24 hours | `strict` | true |
| `_medusa_onboarding` | Admin onboarding flag (`onboarding.ts`) | cleared with `maxAge: -1` | n/a | n/a |

### Key Helpers
```ts
getAuthHeaders()         // { authorization: "Bearer <token>" } | {}
getCacheTag(tag)         // `${tag}-${cacheId}`  (async)
getCacheOptions(tag)     // { tags: [`${tag}-${cacheId}`] } | {}   (async, NOT { next: { tags } })
setAuthToken(token) / removeAuthToken()
getCartId() / setCartId(id) / removeCartId()
getPendingCustomer() / setPendingCustomer(data) / removePendingCustomer()
export type PendingCustomer = { email: string; first_name?; last_name?; phone? }
```

`getCacheOptions` returns `{ tags: [string] }` directly — consumers (e.g. `products.ts`) spread it into a `next` object that is then passed to the SDK as the `next` field of the fetch call. The result is a fetch call that looks like `fetch(url, { next: { tags: [...] }, cache: "force-cache" })`.

`setAuthToken` and `setCartId` use `sameSite: "lax"` rather than `"strict"` (with an inline code comment explaining why): the customer returns from a redirect-based payment method (iDEAL, Bancontact, …) via a cross-site top-level navigation. A `strict` cookie is withheld on that navigation, so the storefront would see a logged-out, cartless visitor and render a 404 for the checkout page instead of resuming the order. `lax` is sent on top-level GET navigations while still blocking cross-site subrequests. `setPendingCustomer` and `setLocaleCookie` use `sameSite: "strict"` because they are not on the payment-return path.

## Data Layer Files (`src/lib/data/`)

Every file except `cookies.ts` and `categories.ts` opens with `"use server"`. **All exported functions are server actions** in those files (so they're individually wrapped).

### cart.ts
Cart CRUD, line items, shipping, promotions, checkout.

| Function | Purpose | Endpoint |
|---|---|---|
| `retrieveCart(cartId?, fields?)` | Get cart by ID/cookie | `GET /store/carts/{id}` |
| `getOrSetCart(countryCode)` | Get or create cart | `POST /store/carts` |
| `updateCart(data)` | Update cart | `POST /store/carts/{id}` |
| `addToCart({ variantId, quantity, countryCode })` | Add item | `POST /store/carts/{id}/line-items` |
| `updateLineItem({ lineId, quantity })` | Update qty | `POST /store/carts/{id}/line-items/{lineId}` |
| `deleteLineItem(lineId)` | Remove item | `DELETE /store/carts/{id}/line-items/{lineId}` |
| `setShippingMethod({ cartId, shippingMethodId })` | Set shipping | `POST /store/carts/{id}/shipping-methods` |
| `initiatePaymentSession(cart, data)` | Start payment | `POST /store/payment-collections/{id}/sessions` |
| `applyPromotions(codes)` | Apply promo codes | `POST /store/carts/{id}/promotions` |
| `applyGiftCard(code)` | (stub) apply gift card | `POST /store/carts/{id}` |
| `removeDiscount(code)` | (stub) remove discount | `POST /store/carts/{id}` |
| `removeGiftCard(code)` | (stub) remove gift card | `POST /store/carts/{id}` |
| `placeOrder(cartId?)` | Complete checkout | `POST /store/carts/{id}/complete` |
| `updateRegion(countryCode, currentPath)` | Change region + redirect | `POST /store/carts/{id}` |
| `listCartOptions()` | Shipping options for cart | `GET /store/shipping-options?cart_id={id}` |

Server actions (form actions): `submitPromotionForm`, `setAddresses`.

### customer.ts
```ts
export type CustomerAuthState = /* ... */
```
| Function | Purpose |
|---|---|
| `retrieveCustomer()` | Get current customer (`GET /store/customers/me`) |
| `updateCustomer(body)` | Update profile |
| `signup(_state, formData)` | Register (`sdk.auth.register`) |
| `login(_state, formData)` | Login (`sdk.auth.login`) |
| `confirmEmailVerification(token)` | Confirm email |
| `signout(countryCode)` | Logout (`sdk.auth.logout`) |
| `transferCart()` | Transfer guest cart |
| `addCustomerAddress`, `deleteCustomerAddress`, `updateCustomerAddress` | Address CRUD |

### products.ts
- `listProducts({ pageParam, queryParams, countryCode, regionId })`
- `listProductsWithSort({ page, queryParams, countryCode, sortBy, optionValueIds })`

Query params: `limit` (default 12), `offset`, `region_id`, `handle`, `options`, `sortBy`.

### collections.ts
- `retrieveCollection(id)`, `listCollections(queryParams)`, `getCollectionByHandle(handle)`

### categories.ts  *(NOT a server-actions file)*
- `listCategories(query?)` → `GET /store/product-categories`
- `getCategoryByHandle(categoryHandle)` → derives from `listCategories()`

### regions.ts
- `listRegions()`, `retrieveRegion(id)`, `getRegion(countryCode)` (derived from region list)

### fulfillment.ts
- `listCartShippingMethods(cartId)` → `GET /store/shipping-options?cart_id={id}`
- `calculatePriceForShippingOption(optionId, cartId, data?)` → `POST /store/shipping-options/{id}/calculate`

### payment.ts
- `listCartPaymentMethods(regionId)` → `GET /store/payment-providers?region_id={id}`

### orders.ts
- `retrieveOrder(id)` → `GET /store/orders/{id}`
- `listOrders(limit, offset, filters)` → `GET /store/orders`
- `createTransferRequest`, `acceptTransferRequest`, `declineTransferRequest` (form actions)

### variants.ts
- `retrieveVariant(variant_id)` → `GET /store/product-variants/{id}`

### locales.ts
```ts
export type Locale = { code: string; name: string }
```
- `listLocales()` → `GET /store/locales` *(currently 404 in v2.20.1; benign probe)*

### locale-actions.ts
- `getLocale()` — reads `_medusa_locale` cookie; returns `string | null`
- `setLocaleCookie(locale)` — sets `_medusa_locale` for 1 year; `httpOnly: false`, `sameSite: "strict"`, `secure: process.env.NODE_ENV === "production"`
- `updateLocale(localeCode)` — sets the cookie; if a cart exists, calls `sdk.store.cart.update(cartId, { locale })`; revalidates the `carts`, `products`, `categories`, and `collections` cache tags

### onboarding.ts
- `resetOnboardingState(orderId)` — clears the `_medusa_onboarding` cookie (`maxAge: -1`, value `"false"`) and `redirect()`s to `http://localhost:7001/a/orders/{orderId}` (the legacy v1 admin port; this onboarding action is vestigial and not used in the v2 admin flow)

### cookies.ts  *(NOT a server-actions file)*
Helpers listed above.

## Caching Strategy

### Cache Tags
Each entity type has its own tag, suffixed by `cacheId`:
`carts-{id}`, `products-{id}`, `regions-{id}`, `customers-{id}`, `orders-{id}`, `collections-{id}`, `categories-{id}`, `fulfillment-{id}`, `payment_providers-{id}`, `shippingOptions-{id}`, `variants-{id}`, `locales-{id}`.

### Revalidation
After mutations, `revalidateTag(getCacheTag("carts"))` (etc.).

### Cache Duration
- Regions: 1 hour (`next: { revalidate: 3600 }`)
- Products / carts: force-cache with tags

## Error Handling (`src/lib/util/medusa-error.ts`)

```ts
type MedusaError = {
  response?: { data: { message?: string } | string; status: number; headers: unknown }
  request?: unknown
  message?: string
  config?: { url: string; baseURL: string }
}

export default function medusaError(error: unknown): never {
  const err = error as MedusaError
  if (err.response) {
    const u = new URL(err.config?.url ?? "", err.config?.baseURL ?? "")
    console.error("Resource:", u.toString())
    console.error("Response data:", err.response.data)
    console.error("Status code:", err.response.status)
    console.error("Headers:", err.response.headers)
    const data = err.response.data
    const message =
      typeof data === "object" && data !== null ? data.message || String(data) : data
    throw new Error(
      message.charAt(0).toUpperCase() + message.slice(1) + "."
    )
  } else if (err.request) {
    throw new Error("No response received: " + String(err.request))
  } else {
    throw new Error("Error setting up the request: " + err.message)
  }
}
```

Note: the URL is constructed as `new URL(err.config?.url ?? "", err.config?.baseURL ?? "")` — the request path is the first arg, the backend base URL is the second, and either may be absent. `data.message || String(data)` falls back to coercing the whole response body to a string when the API returns a non-object error payload.

## Utility Functions (`src/lib/util/`)

| File | Exports |
|---|---|
| `env.ts` | `getBaseURL()` returns `process.env.NEXT_PUBLIC_BASE_URL` or `"https://localhost:8000"` |
| `get-locale-header.ts` | `getLocaleHeader()` returns `{ "x-medusa-locale": locale } as const` (calls `getLocale()` from `@lib/data/locale-actions`) |
| `medusa-error.ts` | `medusaError(error): never` (default export) — see Error Handling above |
| `money.ts` | `convertToLocale({ amount, currency_code, minimumFractionDigits?, maximumFractionDigits?, locale? })` — uses `Intl.NumberFormat(locale, { style: "currency", currency: currency_code, ... })`; falls back to `amount.toString()` when `currency_code` is `isEmpty` (see `isEmpty.ts`) |
| `get-percentage-diff.ts` | `getPercentageDiff(original, calculated)` — returns `(diff/original)*100` as a **string** (`.toFixed()` with no precision arg → 0 fractional digits) |
| `get-product-price.ts` | `getPricesForVariant(variant)` returns `{ calculated_price_number, calculated_price, original_price_number, original_price, currency_code, price_type, percentage_diff }` or `null`; `getProductPrice({ product, variantId? })` returns `{ product, cheapestPrice, variantPrice }` where each is the result of `getPricesForVariant` for the cheapest or specified variant (or `null`) |
| `product.ts` | `isSimpleProduct(product)` — true if exactly one option with one value |
| `product-option-filters.ts` | `OPTION_VALUE_QUERY_KEY = "optionValueIds"`, `OptionValueIds` type, `parseOptionValueIds(searchParams)` (accepts both `URLSearchParams` and the `Record<string, string|string[]\|undefined>` shape Next.js gives for `searchParams`) |
| `sort-products.ts` | `sortProducts(products, sortBy)` — keys `price_asc`, `price_desc`, `created_at` |
| `repeat.ts` | `repeat(times)` default export — `Array.from(Array(times).keys())` |
| `isEmpty.ts` | `isObject`, `isArray`, `isEmpty` — `isEmpty` returns true for `null`/`undefined`, empty objects, empty arrays, **and** whitespace-only strings (string-trim check) |
| `compare-addresses.ts` | `compareAddresses(a, b)` default export — `isEqual(pick(a, [...]), pick(b, [...]))` over 9 fields: `first_name, last_name, address_1, company, postal_code, city, country_code, province, phone` |

## Constants (`src/lib/constants.tsx`)

- `paymentInfoMap`: provider id → `{ title, icon }` for `pp_stripe_stripe`, `pp_medusa-payments_default`, `pp_stripe-ideal_stripe`, `pp_stripe-bancontact_stripe`, `pp_paypal_paypal`, `pp_system_default`.
- `isStripeLike(providerId?)`, `isPaypal(providerId?)`, `isManual(providerId?)` helpers.
- `noDivisionCurrencies`: `["krw", "jpy", "vnd", "clp", "pyg", "xaf", "xof", "bif", "djf", "gnf", "kmf", "mga", "rwf", "xpf", "htg", "vuv", "xag", "xdr", "xau"]`.

## Hooks (`src/lib/hooks/`)

- `use-toggle-state.tsx` — `useToggleState(initialState = false)` (default export). Returns an intersection type that supports both array and object destructuring: `const [state, open, close, toggle] = useToggleState()` *and* `const { state, open, close, toggle } = useToggleState()`. The exported `StateType` is `[boolean, () => void, () => void, () => void] & { state: boolean; open: () => void; close: () => void; toggle: () => void }`.
- `use-in-view.tsx` — `useIntersection(element: RefObject<HTMLDivElement | null>, rootMargin: string) => boolean` (named export). Uses an `IntersectionObserver`; returns `isVisible` (whether the target is intersecting).

## Contexts (`src/lib/context/modal-context.tsx`)

- `ModalProvider` (client) — props `{ children?, close }`. Provides `ModalContext`.
- `ModalContext` value: `{ close: () => void }`.
- `useModal()` — throws if not within a `ModalProvider`.