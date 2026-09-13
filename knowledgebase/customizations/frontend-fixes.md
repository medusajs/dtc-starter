# Frontend Fixes

## Applied Fixes

### BUG-01 — `/account/orders` crashes for anonymous visitors

**Status: (Fixed)**

**File:** `apps/storefront/src/app/[countryCode]/(main)/account/@dashboard/orders/page.tsx`

**Symptom:** When an anonymous visitor navigates to `/<country>/account/orders`, the page returns HTTP 200 with a near-blank body (only `<title>Orders</title>` survives). The dev log shows `⨯ Error: Error setting up the request: Unauthorized`.

**Root Cause:** The upstream `Orders` page calls `listOrders()` directly. `listOrders()` invokes `medusaError(err)` on 401, which re-throws. Unlike the `Overview` and `Addresses` pages which call `retrieveCustomer()` first and `notFound()` for unauthenticated users, the orders page has no auth gate.

**Fix Applied:** Added `retrieveCustomer()` check (line 16) + `notFound()` (line 18) at the top of the `Orders` function, before `listOrders()` is called. Anonymous visitors now see a 404 instead of a broken page.

---

### BUG-02 — Modal panel clips/scrolls content

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/common/components/modal/index.tsx` (line 62)

**Symptom:** Modal panels with long content can scroll or get clipped because the max-height is too restrictive at 75vh.

**Fix Applied:** Changed `max-h-[75vh]` to `max-h-[90vh]` on the `Dialog.Panel` className.

---

### BUG-03 — Add Address modal too narrow on desktop

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/address-card/add-address.tsx` (line 58)

**Symptom:** The Add Address modal is uncomfortably narrow on desktop screens (defaults to `medium` / `max-w-xl`).

**Fix Applied:** Added `size="large"` prop to the `<Modal>` component. This changes the max-width from `max-w-xl` (36rem) to `max-w-3xl` (48rem).

---

### BUG-04 — Edit Address modal too narrow on desktop

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/address-card/edit-address-modal.tsx` (line 122)

**Symptom:** Same as BUG-03 but in the Edit Address modal.

**Fix Applied:** Added `size="large"` prop to the `<Modal>` component.

---

### BUG-05 — Profile billing address type mismatch

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/profile-billing-address/index.tsx` (line 43)

**Symptom:** TypeScript type mismatch where `error` is initialized as `false` (boolean) but later treated as `string | null` in `AccountInfo`'s `isError` prop and in the `useActionState` return shape shared by other form actions.

**Fix Applied:** Changed `error: false` to `error: null as string | null` in the `initialState` object.

---

### BUG-06 — Profile email form overflow

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/account-info/index.tsx` (line 113)

**Symptom:** The form's `Disclosure.Panel` uses `overflow-visible`, which can cause content to overflow its container when the form is collapsed/expanded during the max-height animation.

**Fix Applied:** Changed `overflow-visible` to `overflow-hidden` on the third `Disclosure.Panel` className (the one that expands/collapses the form body).

---

### BUG-13 — `.gitignore` missing tsbuildinfo entries

**Status: (Fixed)**

**File:** `.gitignore`

**Fix Applied:** Added `*.tsbuildinfo` and `**/tsconfig.tsbuildinfo` under the Next.js section. This prevents the TypeScript incremental build cache from being tracked by git.

---

### BUG-14 — `next.config.js` missing `images.qualities`

**Status: (Fixed)**

**File:** `apps/storefront/next.config.js` (line 27)

**Symptom:** Next.js logs `next-image-unconfigured-qualities` warning because the `images` config has `unoptimized: true` but no explicit `qualities` array.

**Fix Applied:** Added `qualities: [25, 50, 75, 100]` to the `images` config object.

---

### BUG-15 — Profile name form overflow

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/profile-name/index.tsx` (line 49)

**Symptom:** The `<form>` uses `overflow-visible` className, which can cause content to overflow its container when the `AccountInfo` Disclosure panel animates open/closed.

**Fix Applied:** Changed `overflow-visible` to `overflow-hidden` on the `<form>` className.

---

### BUG-16 — Logout redirects to malformed `/account` URL

**Status: (Fixed)**

**File:** `apps/storefront/src/lib/data/customer.ts` (line 250)

**Symptom:** Clicking Log out from any account sub-page redirects to `/<countryCode>/account`. Because the logout server action hardcodes a redirect, the browser ends up on a malformed path like `/dk/us/account` and the account layout re-renders as a 404 instead of showing the login form.

**Root Cause:** The upstream `signout()` server action calls `redirect(\`/${countryCode}/account\`)` after clearing the auth token. This was a workaround for the old parallel-route behavior, but it produces an invalid URL when the caller is already on `/account/profile`, `/account/orders`, etc. The official Medusa starter no longer performs this redirect; it only revalidates auth/cart cache tags and lets the current page re-render.

**Fix Applied:** Removed the `redirect()` call from `signout()` entirely. The client-side logout handler now calls `router.refresh()` after `signout()` so the current account page re-renders and shows the login form (since `retrieveCustomer()` now returns `null`). This matches the official starter behavior.

---

### BUG-17 — Product images have non-square aspect ratio

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/products/components/thumbnail/index.tsx` (line 32)

**Symptom:** Product card images use `aspect-[11/14]` for featured products and `aspect-[9/16]` for non-featured products, creating tall rectangular containers that look disproportionate on the store page and homepage.

**Fix Applied:** Changed all aspect ratio conditions to `aspect-[1/1]: true`, making every product thumbnail square. This is a visual improvement only — no data or behavior changes.

---

### Lesson Learned — Scope Discipline

**Issue:** During the product thumbnail fix, the assistant initially removed the `isFeatured` prop from the `Thumbnail` component type and all its call sites. This cascaded into unnecessary changes across `product-preview/index.tsx`, `product-rail/index.tsx`, `order/components/item/index.tsx`, `cart/components/item/index.tsx`, and `cart-dropdown/index.tsx`.

**Resolution:** Reverted all unnecessary changes back to committed state. Kept only the minimal aspect-ratio change in `thumbnail/index.tsx`. When a prop exists but becomes unused for a specific visual change, keep the prop interface intact and only change the styling logic. This avoids breaking downstream consumers and keeps diffs minimal.

---

## Not Fixed (Upstream / Optional)

### BUG-07 — Profile email form is a no-op

**Status: (No Fix Needed)**

**File:** `apps/storefront/src/modules/account/components/profile-email/index.tsx`

**Symptom:** N/A — the scaffold already handles this correctly.

**Current State:** The email update API call is commented out (line 9: `// import { updateCustomer } from "@lib/data/customer"`). The `updateCustomerEmail` function returns `{ success: true, error: null }` as a no-op (lines 23-25). There is a `// TODO: It seems we don't support updating emails now?` comment on line 18.

**Why No Fix Is Needed:** The scaffold already avoids the rejected API call. Email changes require the backend's email-verification flow (`sdk.auth.verification.request/confirm`) which this starter does not implement. The TODO comment could optionally be expanded to explain why email updates are not supported, but no code fix is required.

---

## Lint Cleanup (Not Applied)

### BUG-08 — `@ts-ignore` comments in language-select

**Status: (Not Fixed)**

**File:** `apps/storefront/src/modules/layout/components/language-select/index.tsx` (lines 135, 169)

**Symptom:** ESLint error: `@typescript-eslint/ban-ts-comment` — `@ts-ignore` should be `@ts-expect-error`.

**Fix (optional):** Remove both `/* @ts-ignore */` comments. The `countryCode` prop accepts a `string`, so the comments are unnecessary.

### BUG-09 — Missing `eslint-disable` in shipping useEffect

**Status: (Not Fixed)**

**File:** `apps/storefront/src/modules/checkout/components/shipping/index.tsx` (line 150)

**Symptom:** ESLint warning: `react-hooks/exhaustive-deps` — missing dependency `isOpen`.

**Fix (optional):** Add `// eslint-disable-next-line react-hooks/exhaustive-deps` before the `useEffect` at line 150. The `isOpen` dep is intentionally omitted since the effect should only fire when the step opens, not on every dependency change.

### BUG-10 — Missing `eslint-disable` in shipping-address useEffect

**Status: (Not Fixed)**

**File:** `apps/storefront/src/modules/checkout/components/shipping-address/index.tsx` (line 75)

**Symptom:** ESLint warning: `react-hooks/exhaustive-deps` — missing dependency `customer.email`.

**Fix (optional):** Add `// eslint-disable-next-line react-hooks/exhaustive-deps` before the `useEffect`. The `customer` object is intentionally omitted from deps to avoid infinite loops.

### BUG-11 — Missing `eslint-disable` in product-actions useEffect

**Status: (Not Fixed)**

**File:** `apps/storefront/src/modules/products/components/product-actions/index.tsx` (line 78)

**Symptom:** ESLint warning: `react-hooks/exhaustive-deps` — missing dependencies `pathname`, `router`, and `searchParams`.

**Fix (optional):** Add `// eslint-disable-next-line react-hooks/exhaustive-deps` before the `useEffect`. These Next.js objects are intentionally omitted from deps.

### BUG-12 — `as any` and `catch(e: any)` in cart.ts

**Status: (Not Fixed)**

**File:** `apps/storefront/src/lib/data/cart.ts`

**Symptom:** ESLint errors: `@typescript-eslint/no-explicit-any` — 8 errors across `cart.ts`:
- Line 281: `'code' is defined but never used` (`@typescript-eslint/no-unused-vars`)
- Line 293: `'code' is defined but never used` (`@typescript-eslint/no-unused-vars`)
- Line 305: `'codeToRemove' is defined but never used` (`@typescript-eslint/no-unused-vars`)
- Line 306: `'giftCards' is defined but never used` (`@typescript-eslint/no-unused-vars`) + `Unexpected any` (`@typescript-eslint/no-explicit-any`)
- Line 331: `Unexpected any` (`catch(e: any)`)
- Line 361: `as any` cast
- Line 380: `Unexpected any` (`catch(e: any)`)

**Fix (optional):** Replace `as any` casts with proper types and `catch(e: any)` with `catch(e: unknown)` + type guards. **Do NOT change empty stubs** (`applyGiftCard`, `removeDiscount`, `removeGiftCard`) to throw errors — that changes runtime behavior.

---

## Monitoring Items (v2.21.0 Allowlist)

### MONITOR-01 — Store API strict allowlist may silently drop nested order/variant fields

**Status: (Monitoring Required)**

**Files:**
- `apps/storefront/src/lib/data/orders.ts:21-22`
- `apps/storefront/src/lib/data/orders.ts:52`

**Symptom:** Medusa v2.21.0 enforces a strict allowlist on every Store API route. The `fields` selections in `orders.ts` use wildcard expansions (`*items.variant`, `*items.product`, `*payment_collections.payments`) that may silently drop nested fields not explicitly listed in the route's `allowed` array. The request still returns `200`, but the missing fields are absent from the JSON response.

**Current Assessment:** Static audit against the installed v2.21.0 allowlist shows the base relations (`items.variant`, `items.product`, `payment_collections.payments`) are allowed. However, deeper nested paths under these relations may be stripped if they are not explicitly listed. The storefront code that consumes these endpoints should be tested to verify all expected data is present at runtime.

**Action Required:** After deployment, verify the order detail and order list pages render all expected data (variant details, product details, payment information). If fields are missing, add them back via the `allowFields` middleware in `apps/backend/src/api/middlewares.ts`.

**Do not add allowlist entries speculatively.** Only add fields that are confirmed missing at runtime.

---

*Based on audit 2026-09-12. See `known-issues.md` for the full issue catalog, `rules.md` for editing guidelines, and `instructions.md` for how to make changes.*
