# Features Reference

## Overview

How each major feature works in the storefront, from the user journey through the code. This file maps features to their page routes, data-layer functions, templates, and key implementation details. Product-related features (Home, Store listing, PDP, Collections, Categories, Related Products, Featured Products) are documented in [store-and-products.md](./store-and-products.md). This file covers everything else.

## Feature Map

| Feature | Pages | Data Layer | Templates | Key Components |
|---|---|---|---|---|
| Home | `/` | `listCollections()` | Hero, FeaturedProducts | ProductRail |
| Product Listing | `/store` | `listProductsWithSort()` | StoreTemplate | PaginatedProducts, RefinementList |
| Product Detail | `/products/[handle]` | `listProducts()` | ProductTemplate | ProductActionsWrapper, ProductTabs |
| Collections | `/collections/[handle]` | `retrieveCollection()` | CollectionTemplate | PaginatedProducts |
| Categories | `/categories/[...category]` | `getCategoryByHandle()` | CategoryTemplate | PaginatedProducts |
| Cart | `/cart` | `retrieveCart()`, `addToCart()`, `updateLineItem()` | Cart template | CartLineItem, DiscountCode, CartTotals |
| Checkout | `/checkout` | `listCartShippingMethods()`, `listCartPaymentMethods()` | CheckoutForm, CheckoutSummary | Addresses, Shipping, Payment, Review |
| Account | `/account` | `retrieveCustomer()`, `signup()`, `login()` | Account dashboard | AccountNav, AccountInfo, AddressBook |
| Orders | `/account/orders`, `/order/[id]/confirmed` | `retrieveOrder()`, `listOrders()` | Order confirmation | OrderDetails, OrderCard |
| Order Transfer | `/order/[id]/transfer/[token]` | `createTransferRequest()`, `acceptTransferRequest()`, `declineTransferRequest()` | Transfer request page | TransferRequest |
| Email Verification | `/verify-account` | `confirmEmailVerification()` | Verification page | — |

> For Home, Product Listing, Product Detail, Collections, and Categories — see [store-and-products.md](./store-and-products.md).

## Cart

**Route**: `src/app/[countryCode]/(main)/cart/page.tsx`

**Cart page** (`modules/cart/templates/index.tsx`):
- 2-column layout: items list (left) + summary (right)
- Items list: `<ItemsPreviewTemplate>` with quantity selectors and delete buttons
- Summary: `<CartTotals>` (subtotal, shipping, discount, total) + `<DiscountCode>` + checkout CTA

**Cart state**:
- Cart ID stored in `_medusa_cart_id` cookie (7 days, `lax`, `httpOnly`)
- Cart ID also passed as a prop to `getOrSetCart(countryCode)` if the cookie is missing
- `retrieveCart()` reads the cart from the cookie or by ID

**Operations (data layer: `src/lib/data/cart.ts`)**:

| Operation | Function | Endpoint |
|---|---|---|
| Get cart | `retrieveCart(cartId?, fields?)` | `GET /store/carts/{id}` |
| Create/get cart | `getOrSetCart(countryCode)` | `POST /store/carts` |
| Update cart | `updateCart(data)` | `POST /store/carts/{id}` |
| Add item | `addToCart({ variantId, quantity, countryCode })` | `POST /store/carts/{id}/line-items` |
| Update item | `updateLineItem({ lineId, quantity })` | `POST /store/carts/{id}/line-items/{lineId}` |
| Delete item | `deleteLineItem(lineId)` | `DELETE /store/carts/{id}/line-items/{lineId}` |
| Set shipping | `setShippingMethod({ cartId, shippingMethodId })` | `POST /store/carts/{id}/shipping-methods` |
| Apply promo | `applyPromotions(codes)` | `POST /store/carts/{id}/promotions` |
| Place order | `placeOrder(cartId?)` | `POST /store/carts/{id}/complete` |

**Server actions (form actions)**: `submitPromotionForm`, `setAddresses`.

**Cart not-found**: If `retrieveCart()` fails (e.g., cookie points to a deleted cart), `cart/page.tsx` calls `notFound()`, which routes to `cart/not-found.tsx` ("The cart you tried to access does not exist. Clear your cookies and try again.").

## Checkout

**Route**: `src/app/[countryCode]/(checkout)/checkout/page.tsx`

Steps (URL-driven via `?step=`):
1. Address (shipping + billing) — `Addresses`, `ShippingAddress`, `BillingAddress`
2. Delivery (shipping method) — `Shipping` → `setShippingMethod`
3. Payment (provider + Stripe Elements if applicable) — `Payment` (RadioGroup of providers), `initiatePaymentSession` on select, then `PaymentButton` (Stripe / Manual switch) — `stripe.confirmPayment({ redirect: "if_required" })` for Stripe, `placeOrder()` direct for `pp_system_default`
4. Review + place order — `Review`

Promo codes are applied inline via `DiscountCode` (`applyPromotions` from `@lib/data/cart`).

`PaymentWrapper` (`src/modules/checkout/components/payment-wrapper/`) loads `loadStripe(publishableKey)` lazily and conditionally renders `StripeWrapper` → `StripePaymentContainer` for card capture. `cart.complete()` finalizes the order and redirects to `/order/{id}/confirmed`. Stripe return is handled by `src/app/api/payment-return/route.ts`.

**Checkout summary** (`modules/checkout/templates/checkout-summary/index.tsx`):
- Right sidebar on wider screens
- Contains `<ItemsPreviewTemplate>`, `<CartTotals>`, `<DiscountCode>`
- Checkout CTA links to `/checkout?step={getCheckoutStep(cart)}`

## Account

**Routes**: parallel `@dashboard` + `@login`

**Account layout** (`app/[countryCode]/(main)/account/layout.tsx`):
- `AccountPageLayout` component switches between `dashboard` and `login` slots based on `retrieveCustomer()`
- If customer is logged in, renders `@dashboard` slot
- If not, renders `@login` slot
- Both slots are pre-rendered by Next.js; only one is shown based on auth state

| Feature | Route | Data Layer |
|---|---|---|
| Profile | `/account/profile` | `updateCustomer()` |
| Addresses | `/account/addresses` | `addCustomerAddress`, `deleteCustomerAddress`, `updateCustomerAddress` |
| Orders | `/account/orders` | `listOrders()` |
| Order Details | `/account/orders/details/[id]` | `retrieveOrder()` |
| Login/Register | `/account` (parallel `@login` slot) | `login()`, `signup()` |
| Logout | N/A (server action redirect) | `signout()` |

**Auth flow**:
1. Signup: `sdk.auth.register()` → auth identity + email verification (if enabled)
2. Login: `sdk.auth.login()` → JWT
3. Token stored in `_medusa_jwt` cookie (7 days, `lax`, `httpOnly`)
4. Guest cart transferred to customer on login via `transferCart()`

**AccountNav** (`modules/account/components/account-nav/index.tsx`):
- Sidebar navigation: Overview, Profile, Addresses, Orders, Logout
- Active link highlighted with `bg-ui-bg-interactive`
- Logout calls `signout()` server action which clears the JWT cookie and redirects

## Orders

**Route**: `src/app/[countryCode]/(main)/order/[id]/confirmed/page.tsx`

- Server component
- Calls `retrieveOrder(params.id)` (no `fields` parameter) to get the order. Uses `.catch(() => null)` and renders `notFound()` if missing.
- Renders `<OrderCompletedTemplate>` with order summary, items, and "Continue Shopping" link

**Order details** (`/account/orders/details/[id]`):
- `retrieveOrder(id)` with fields expanded
- Shows line items, shipping address, billing address, payment status

## Order Transfer

**Routes**:
- `/order/[id]/transfer/[token]` — Create / view transfer request
- `/order/[id]/transfer/[token]/accept` — Accept
- `/order/[id]/transfer/[token]/decline` — Decline

**Transfer flow**:
1. Customer requests transfer → `createTransferRequest(orderId, email)` creates a token
2. Recipient clicks link → sees order summary + accept/decline buttons
3. Accept → `acceptTransferRequest(token)` transfers order ownership
4. Decline → `declineTransferRequest(token)` cancels the request

## Regions and Localization

1. `src/middleware.ts` reads country from URL prefix → `cf.country` → `x-vercel-ip-country` → `NEXT_PUBLIC_DEFAULT_REGION` fallback
2. 307 redirect to region-prefixed URL if missing
3. 1-hour in-memory region map
4. `_medusa_cache_id` cookie namespaced fetch cache

### Locale

- `_medusa_locale` cookie stores user preference (1 year, `strict`, `httpOnly: false`)
- `x-medusa-locale` header injected on every SDK call via monkey-patch in `src/lib/config.ts`
- `updateLocale(localeCode)` server action sets the cookie and revalidates cache tags

## Seed Data

The `initial-data-seed.ts` script creates (executed by `pnpm exec medusa db:migrate`):

| Entity | Count | Details |
|---|---|---|
| Sales Channel | 1 | `Default Sales Channel` |
| Publishable API Key | 1 | `Default Publishable API Key`, linked to default channel |
| Store | 1 | `Default Store`; currencies EUR (default) + USD |
| Region | 1 | `Europe`, currency EUR; countries gb, de, dk, se, fr, es, it (7) |
| Tax Regions | 7 | One per country, provider `tp_system` |
| Stock Location | 1 | `European Warehouse` (Copenhagen, DK) |
| Fulfillment Set | 1 | `European Warehouse delivery` (shipping) with `Europe` service zone |
| Shipping Options | 2 | `Standard Shipping` (2-3 days) + `Express Shipping` (24h), `flat` pricing in EUR/USD/region |
| Product Categories | 4 | `Shirts`, `Sweatshirts`, `Pants`, `Merch` |
| Product Options | 2 | Size (S/M/L/XL), Color (Black/White) |
| Products | 4 | Medusa T-Shirt, Medusa Sweatshirt, Medusa Sweatpants, Medusa Shorts |
| Variants | 20 | T-Shirt has 8 (Size × Color); Sweatshirts/Sweatpants/Shorts have 4 each (Size) |
| Pricing | — | All variants 10 EUR / 15 USD |
| Inventory | — | 1,000,000 units per variant at European Warehouse |
| Images | — | S3-hosted thumbnails + back/front images from medusa-public-images bucket |

Verified post-seed counts:
- 4 products, 20 variants, 1 region, 1 stock location, 1 publishable API key, 1 sales channel, 1 store

## Current Feature Gaps

1. **Gift cards**: data-layer stubs but no UI
2. **Promotions UI**: `applyPromotions()` works but no storefront entry UI
3. **Wishlists / Reviews / Search UI**: not implemented
4. **Multi-currency switcher**: EUR + USD seeded, but no UI to switch
5. **Tax display in cart/checkout**: backend calculates, UI doesn't render
6. **Returns/Exchanges storefront**: not implemented

## Feature Architecture

```
┌────────────────────────────────────────────────────────────┐
│              Storefront (Next.js 15, Turbopack)            │
├────────────────────────────────────────────────────────────┤
│  Pages (App Router, Server Components)                     │
│   → Data Layer (Server Actions, "use server")              │
│      → Medusa JS SDK                                       │
│        → Backend REST API (http://localhost:9000)          │
│          → Medusa Core Modules                             │
│            → PostgreSQL Database                          │
└────────────────────────────────────────────────────────────┘
```

## Feature Implementation Details

### Data Flow Pattern

Every feature follows this pattern:
1. **Page** (Server Component) reads params/query params
2. **Page** calls a data-layer function (server action)
3. **Data layer** calls the Medusa JS SDK
4. **SDK** makes an HTTP request to the backend with `x-publishable-api-key` and `x-medusa-locale` headers
5. **Backend** routes to the appropriate module/workflow
6. **Response** flows back through the SDK to the data layer to the page
7. **Page** renders the template with the data

### Cache Strategy

- **Force-cache** for regions (1 hour TTL)
- **Force-cache with tags** for products, carts, customers, orders, collections, categories
- Tags are scoped by `_medusa_cache_id` cookie
- After mutations, `revalidateTag(getCacheTag("carts"))` etc. invalidates the cache

### Cookie-Based State

| Cookie | Purpose | Expiry |
|---|---|---|
| `_medusa_cart_id` | Cart ID | 7 days |
| `_medusa_jwt` | Customer auth token | 7 days |
| `_medusa_locale` | Locale preference | 1 year |
| `_medusa_cache_id` | Cache tag namespace | 24 hours (middleware) |
| `_medusa_pending_customer` | Pending customer (verification) | 24 hours |

### Region-Aware Queries

All product/cart queries are scoped to a region:
- `getRegion(countryCode)` resolves the region from the region map
- `listProducts({ countryCode, ... })` passes the region to the backend
- `getOrSetCart(countryCode)` creates a cart in the correct region

### Client vs Server Components

- **Server Components** by default — pages fetch data directly in the component body
- **Client Components** (`"use client"`) are used for:
  - Interactive elements: cart dropdown, country/language selectors, side menu
  - Checkout forms: addresses, shipping, payment, review
  - Modals: add/edit address, delete confirmation
  - Stateful UI: variant selection, quantity selectors, pagination

### Error Handling

- **404 (notFound)**: Used when a resource is missing (cart, order, product)
- **403 (forbidden)**: Used when a customer tries to access another customer's order
- **401 (unauthorized)**: Handled by the backend; storefront redirects to login
- **500 (server error)**: Handled by Next.js error boundaries

### Loading States

Each route has a matching `loading.tsx` that renders skeletons from `src/modules/skeletons/`:
- `skeleton-product-preview` — product image placeholder
- `skeleton-card-details` — product info placeholder
- `skeleton-page` — full page placeholder
