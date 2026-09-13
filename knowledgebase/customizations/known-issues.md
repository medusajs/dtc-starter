# Known Issues & Environment Notes

## Bug Catalog

All bugs use a `BUG-01` through `BUG-99` identifier system. Statuses: **(Fixed)** | **(Not Fixed)** | **(No Fix Needed)**.

### Runtime Bugs (Affect Users)

| ID | Bug | File | Status |
|---|---|---|---|
| BUG-01 | `/account/orders` crashes for anonymous visitors (HTTP 200 with blank body) | `src/app/[countryCode]/(main)/account/@dashboard/orders/page.tsx` | (Fixed) |
| BUG-02 | Modal panel clips/scrolls content on long forms | `src/modules/common/components/modal/index.tsx:62` | (Fixed) |
| BUG-03 | Add Address modal too narrow on desktop | `src/modules/account/components/address-card/add-address.tsx:58` | (Fixed) |
| BUG-04 | Edit Address modal too narrow on desktop | `src/modules/account/components/address-card/edit-address-modal.tsx:122` | (Fixed) |
| BUG-05 | Profile billing address type mismatch (`error: false` vs `string | null`) | `src/modules/account/components/profile-billing-address/index.tsx:43` | (Fixed) |
| BUG-06 | Profile email form overflow (form Disclosure.Panel uses `overflow-visible`) | `src/modules/account/components/account-info/index.tsx:113` | (Fixed) |
| BUG-07 | Profile email form is a no-op (can't change email) | `src/modules/account/components/profile-email/index.tsx` | (No Fix Needed) |
| BUG-15 | Profile name form overflow (form uses `overflow-visible`) | `src/modules/account/components/profile-name/index.tsx:49` | (Fixed) |

### Lint/TypeScript Bugs (Dev-Only)

| ID | Bug | File | Status |
|---|---|---|---|
| BUG-08 | `@ts-ignore` should be `@ts-expect-error` (2 occurrences) | `src/modules/layout/components/language-select/index.tsx:135,169` | (Not Fixed) |
| BUG-09 | `useEffect` missing deps warning in shipping | `src/modules/checkout/components/shipping/index.tsx:150` | (Not Fixed) |
| BUG-10 | `useEffect` missing deps warning in shipping-address | `src/modules/checkout/components/shipping-address/index.tsx:75` | (Not Fixed) |
| BUG-11 | `useEffect` missing deps warning in product-actions | `src/modules/products/components/product-actions/index.tsx:78` | (Not Fixed) |
| BUG-12 | `as any` casts and `catch(e: any)` in cart data layer | `src/lib/data/cart.ts` (8 errors) | (Not Fixed) |

### Config Bugs

| ID | Bug | File | Status |
|---|---|---|---|
| BUG-13 | `.gitignore` missing `*.tsbuildinfo` entries | `.gitignore` | (Fixed) |
| BUG-14 | `next.config.js` missing `images.qualities` array | `apps/storefront/next.config.js:27` | (Fixed) |

---

## Bug Details

### BUG-01 — `/account/orders` crashes for anonymous visitors

**Status: (Fixed)**

The upstream `Orders` page calls `listOrders()` without first checking auth. When an anonymous visitor hits `/<country>/account/orders`, the page returns HTTP 200 with a near-blank body. The dev log shows `⨯ Error: Error setting up the request: Unauthorized`.

**Fix applied:** `retrieveCustomer()` + `notFound()` guard added at the top of `orders/page.tsx`. Anonymous visitors now get a 404.

### BUG-02 — Modal panel clips/scrolls content

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/common/components/modal/index.tsx:62`

**Fix applied:** Changed `max-h-[75vh]` to `max-h-[90vh]` on the `Dialog.Panel` className. This gives long forms more vertical room before scrolling.

### BUG-03 — Add Address modal too narrow on desktop

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/address-card/add-address.tsx:58`

**Fix applied:** Added `size="large"` prop to the `<Modal>` component. This changes the max-width from `max-w-xl` (36rem) to `max-w-3xl` (48rem).

### BUG-04 — Edit Address modal too narrow on desktop

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/address-card/edit-address-modal.tsx:122`

**Fix applied:** Added `size="large"` prop to the `<Modal>` component.

### BUG-05 — Profile billing address type mismatch

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/profile-billing-address/index.tsx:43`

**Fix applied:** Changed `error: false` to `error: null as string | null` in the `initialState` object. This matches the `error` shape used by other form components (`addCustomerAddress`, `updateCustomerAddress`) which return `{ success: boolean; error: string | null }`.

### BUG-06 — Profile email form overflow

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/account-info/index.tsx:113`

**Fix applied:** Changed `overflow-visible` to `overflow-hidden` on the third `Disclosure.Panel` className (the one that expands/collapses the form body). This prevents form content from peeking out during the max-height animation.

### BUG-07 — Profile email form is a no-op

**Status: (No Fix Needed)**

The scaffold already handles this correctly. The `profile-email/index.tsx` file has the email update API call commented out (line 9) and the `updateCustomerEmail` function returns `{ success: true, error: null }` as a no-op (lines 23-25). Email changes require the backend's email-verification flow (`sdk.auth.verification.request/confirm`) which this starter does not implement. No code fix is required.

### BUG-15 — Profile name form overflow

**Status: (Fixed)**

**File:** `apps/storefront/src/modules/account/components/profile-name/index.tsx:49`

**Fix applied:** Changed `overflow-visible` to `overflow-hidden` on the `<form>` className. This prevents the form content from overflowing its container when the `AccountInfo` Disclosure panel animates.

### BUG-08 — `@ts-ignore` in language-select

**Status: (Not Fixed)**

Two `/* @ts-ignore */` comments remain in `language-select/index.tsx` (lines 135 and 169). ESLint flags these with `@typescript-eslint/ban-ts-comment`.

**Fix needed:** Remove the comments or replace with `@ts-expect-error`. The `countryCode` prop on `ReactCountryFlag` accepts `string`, so the comments are likely unnecessary.

### BUG-09/BUG-10/BUG-11 — useEffect missing deps

**Status: (Not Fixed)**

Three `useEffect` hooks in `shipping/index.tsx:150`, `shipping-address/index.tsx:75`, and `product-actions/index.tsx:78` trigger `react-hooks/exhaustive-deps` warnings because they intentionally omit dependencies (Next.js router objects, stable refs, etc.).

**Fix needed (optional):** Add `// eslint-disable-next-line react-hooks/exhaustive-deps` with explanatory comments.

### BUG-12 — `as any` and `catch(e: any)` in cart.ts

**Status: (Not Fixed)**

`src/lib/data/cart.ts` contains 8 ESLint errors: `as any` casts (lines 261, 331, 361, 380) and `catch(e: any)` patterns. These are upstream code patterns that don't affect runtime.

**Fix needed (optional):** Replace with proper types. **Do NOT change empty no-op stubs** (`applyGiftCard`, `removeDiscount`, `removeGiftCard`) to throw errors — that changes runtime behavior.

### BUG-13 — `.gitignore` missing tsbuildinfo entries

**Status: (Fixed)**

**File:** `.gitignore`

**Fix applied:** Added `*.tsbuildinfo` and `**/tsconfig.tsbuildinfo` to the root `.gitignore` under the Next.js section.

### BUG-14 — `next.config.js` missing `images.qualities`

**Status: (Fixed)**

**File:** `apps/storefront/next.config.js:27`

**Fix applied:** Added `qualities: [25, 50, 75, 100]` to the `images` config object.

---

## Environment-Level Issues (Noise)

These are expected on every fresh install and are **not bugs**:

| Symptom | Severity | Notes |
|---|---|---|
| `redisUrl not found` / `Local Event Bus installed` | Noise | In-memory event bus fallback. Fine for local dev. |
| `GET /store/customers/me 401` in dev log | Noise | Anonymous user hitting protected endpoint — expected. |
| `GET /store/locales 404` in dev log | Noise | Scaffold probes an endpoint that doesn't exist in 2.20.1. Benign. |
| `pnpm overries in package.json` warning | Noise | Not present in this scaffold — overrides are correctly in `pnpm-workspace.yaml`. |
| ~335 `TS2786` errors on `tsc --noEmit` (without overrides) | Noise | Resolved by `overrides` block in `pnpm-workspace.yaml`. Already applied. |
| `next lint` is deprecated | Noise | Use `pnpm exec next lint` or migrate to `eslint .`. |
| `tsconfig.tsbuildinfo` tracked by git | Noise | Added to `.gitignore` (BUG-13). |
| Production build clobbers dev `.next/` | Noise | Stop dev server before running build. |

---

## Conditional Issues

| If you see this... | Cause | Fix |
|---|---|---|
| Port 9000 already in use | A prior Medusa backend instance is still bound | `Get-NetTCPConnection -LocalPort 9000 -State Listen \| Select-Object OwningProcess; Stop-Process -Id <pid> -Force` |
| PostgreSQL DB creation fails with hyphens | PowerShell strips quotes around identifiers with hyphens | Use underscores, or write SQL to a temp file and run with `psql -f` |
| `create-medusa-app` hangs at the end | CLI tries to open the admin dashboard in default browser | Always pass `--no-browser` on headless shells |
| Storefront 404s with "Missing publishable API key" | `.env.local` ships with empty value | Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` |

---

*See `frontend-fixes.md` for fix details, `rules.md` for editing guidelines, and `instructions.md` for how to make changes. Last updated 2026-09-06.*
