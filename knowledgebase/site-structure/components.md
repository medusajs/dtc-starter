# Components Reference

## Overview
Catalog of components in the storefront. Components live under `src/modules/` with shared primitives in `src/modules/common/`. The fresh install **does** ship a hand-rolled local UI kit in `src/modules/common/components/ui/` (it was NOT removed in this codebase). The `@medusajs/ui-preset` Tailwind preset is still used for design tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`).

## Component Organization

```
src/modules/
├── common/
│   ├── components/
│   │   ├── ui/                    # Local hand-rolled UI kit (Text, Button, Table, ...)
│   │   ├── cart-totals/
│   │   ├── checkbox/
│   │   ├── delete-button/
│   │   ├── divider/
│   │   ├── filter-radio-group/
│   │   ├── input/
│   │   ├── interactive-link/
│   │   ├── line-item-options/
│   │   ├── line-item-price/
│   │   ├── line-item-unit-price/
│   │   ├── localized-client-link/
│   │   ├── modal/
│   │   ├── native-select/
│   │   ├── radio/
│   │   └── shared/                # Shared components (PageBanner)
│   ├── icons/                     # 19 inline SVG icons
│   └── templates/                 # (empty in this install)
├── layout/
│   ├── components/                # cart-button, cart-dropdown, country-select, language-select, side-menu, medusa-cta, cart-mismatch-banner
│   └── templates/                 # nav, footer
├── account/                       # dashboard, profile, addresses, orders, login, register
├── cart/                          # items, summary, preview, item select
├── categories/
├── checkout/                      # addresses, payment, shipping, review, payment-container, payment-wrapper
├── collections/
├── home/                          # hero, featured-products
├── order/                         # confirmation, details, items, transfer
├── products/                      # product cards, tabs, options, gallery, related
├── shipping/
├── store/                         # listing, refinement list, pagination, sort
└── skeletons/                     # loading skeletons
```

## Local UI Kit (Hand-Rolled)

**File**: `src/modules/common/components/ui/index.tsx`

Built with `clsx` + Tailwind. **This file IS present in this fresh install** — my earlier note that it was missing was wrong.

### Exports
- `clx` — re-export of `clsx`
- `Text` — polymorphic `p | span | div`; default `txt-medium`
- `Heading` — `h1 | h2 | h3` with size + `font-semibold`
- `Button` — variants `primary | secondary | transparent`; sizes `small | medium | large`; `isLoading` prop
- `Container` — `bg-white rounded-lg p-4`
- `Badge` — colors `green | red | blue | orange | grey | purple`
- `IconBadge`, `IconButton`
- `Label`, `Input` (optional `label` prop)
- `Table` compound (`Table.Header / .Body / .Row / .Head / .HeaderCell / .Cell`)
- `RadioGroup` compound (`RadioGroup.Item`)
- `Checkbox`

All primitives use `forwardRef` and set `displayName`. Compound components use `Object.assign`. The consumer `className` is appended last via `clx(base, conditional && "...", className)`.

```tsx
import { Text, Heading, Button, clx } from "@modules/common/components/ui"

<Heading as="h2" level="h2">Section Title</Heading>
<Button variant="primary" size="large" isLoading={false}>Click me</Button>
<Text as="span" className="text-ui-fg-base">Inline text</Text>
```

## Common Feature Components

| Component | Location | Purpose |
|---|---|---|
| `CartTotals` | `modules/common/components/cart-totals/` | Cart subtotal, tax, shipping, total |
| `DeleteButton` | `modules/common/components/delete-button/` | Reusable delete with confirmation |
| `Divider` | `modules/common/components/divider/` | Visual separator |
| `FilterRadioGroup` | `modules/common/components/filter-radio-group/` | Product filter UI |
| `InteractiveLink` | `modules/common/components/interactive-link/` | Interactive anchor |
| `LineItemOptions` | `modules/common/components/line-item-options/` | Cart line item options |
| `LineItemPrice` | `modules/common/components/line-item-price/` | Cart line item price |
| `LineItemUnitPrice` | `modules/common/components/line-item-unit-price/` | Cart unit price |
| `LocalizedClientLink` | `modules/common/components/localized-client-link/` | Wraps `next/link` and prefixes `countryCode` |
| `Modal` | `modules/common/components/modal/` | `@headlessui/react` modal |
| `NativeSelect` | `modules/common/components/native-select/` | Native select dropdown |
| `PageBanner` | `modules/common/components/shared/page-banner/` | Page header with breadcrumb, title, description, badge |
| `CategoryBarCarousel` | `modules/common/components/shared/category-bar/` | Horizontal scrollable category navigation with scroll controls |
| `Radio` | `modules/common/components/radio/` | Custom radio button |
| `Input` | `modules/common/components/input/` | Floating-label input |

```tsx
import LocalizedClientLink from "@modules/common/components/localized-client-link"
<LocalizedClientLink href="/products/some-product">View Product</LocalizedClientLink>
```

## Layout Components (`src/modules/layout/`)

### Templates
| Template | Export | Notes |
|---|---|---|
| `templates/nav/index.tsx` | `Nav` (default async server component) | Fetches `listRegions()`, `listLocales()`, `getLocale()` in parallel via `Promise.all`; renders sticky header with `SideMenu`, brand `LocalizedClientLink`, `Account` link, and a `Suspense` boundary around `CartButton` (fallback shows `Cart (0)`) |
| `templates/footer/index.tsx` | `Footer` (default async server component) | Fetches `listCollections({ fields: "*products" })` and `listCategories()`; renders top-level categories (skips entries with `parent_category`) and up to 6 collections, plus GitHub/Docs/Source links and a `MedusaCTA` line |

### Components
| Folder | Export | Notes |
|---|---|---|
| `cart-button/index.tsx` | `CartButton` (default async SSR server component) | Calls `retrieveCart().catch(() => null)`, renders `<CartDropdown cart={cart} />` — wrapped in `Suspense` from `Nav` |
| `cart-dropdown/index.tsx` | `CartDropdown` (default client component, `"use client"`) | Uses `@headlessui/react` `Popover`/`PopoverButton`/`PopoverPanel`/`Transition`; tracks `totalItems` vs `itemRef` and auto-opens the dropdown for 5s when item count changes (unless pathname includes `/cart`); renders `Cart (n)` link + 420px-wide popover with line items, subtotal, and Go-to-cart `Button` |
| `cart-mismatch-banner/index.tsx` | `CartMismatchBanner` | Region/cart mismatch warning |
| `country-select/index.tsx` | `CountrySelect` (default client component) | `react-country-flag` SVG flag + `@headlessui/react` `Listbox`; `useToggleState` for open/close; `updateRegion(country, currentPath)` from `@lib/data/cart` on select |
| `language-select/index.tsx` | `LanguageSelect` (default client component) | `useToggleState`; `Locale` type from `@lib/data/locales`; uses `updateLocale()` from `@lib/data/locale-actions` inside `useTransition`; resolves country flag via `Intl.Locale` region; localized language name via `Intl.DisplayNames` |
| `medusa-cta/index.tsx` | `MedusaCTA` (default) | "Powered by Medusa & Next.js" footer line with `@modules/common/icons/medusa` + `nextjs` icons |
| `side-menu/index.tsx` | `SideMenu` (default client component) | `@headlessui/react` `Popover` with backdrop and blur panel; renders a fixed `SideMenuItems` list (`Home`/`Store`/`Account`/`Cart`) plus `LanguageSelect` and `CountrySelect`; manages two `useToggleState` hooks for the language and country popovers |

## Icons (`src/modules/common/icons/`)

**19** inline SVG icon components (one file per icon, named with the kebab-case SVG name: `back.tsx`, `x.tsx`, `chevron-up-down.tsx`, …). Each is a default export accepting `color`, `size`, and standard SVG props.

Available icons: `Back`, `Bancontact`, `ChevronDown`, `ChevronUpDown`, `Eye`, `EyeOff`, `FastDelivery`, `Ideal`, `MapPin`, `Medusa`, `NextJs`, `Package`, `PayPal`, `PlaceholderImage`, `Refresh`, `Spinner`, `Trash`, `User`, `X`.

```tsx
import { UserIcon } from "@modules/common/icons"
<UserIcon size={24} color="var(--fg-base)" />
```

## Feature Modules

### Account (`src/modules/account/`)
**Templates** (`templates/`):
- `login-template.tsx` → `LoginTemplate`
- `account-layout.tsx` → `AccountLayout`

**Components** (`components/`):
| Folder | Export |
|---|---|
| `verify-account/` | `VerifyAccount` |
| `transfer-request-form/` | `TransferRequestForm` (default export) |
| `register/` | `Register` |
| `login/` | `Login` |
| `overview/` | `Overview` |
| `account-nav/` | `AccountNav` |
| `account-info/` | `AccountInfo` |
| `address-book/` | `AddressBook` |
| `address-card/add-address.tsx` | `AddAddress` |
| `address-card/edit-address-modal.tsx` | `EditAddress` |
| `profile-name/` | `ProfileName` |
| `profile-email/` | `ProfileEmail` |
| `profile-phone/` | `ProfileEmail` (note: filename is `profile-phone` but export is `ProfileEmail` — upstream inconsistency; component actually updates phone) |
| `profile-password/` | `ProfilePassword` |
| `profile-billing-address/` | `ProfileBillingAddress` |
| `order-card/` | `OrderCard` |
| `order-overview/` | `OrderOverview` |

### Profile-Edit Pattern

`AccountInfo` is the shared editor shell for all five profile sections (name/email/phone/password/billing-address). It uses `@headlessui/react` `Disclosure` with `static` panels and a `useEffect(isSuccess → close)` to auto-close the form after a successful save.

**Observed issues (2026-09-05/06):**

1. `account-info/index.tsx` line 113: the form `<Disclosure.Panel>` had `overflow-visible` instead of `overflow-hidden`. When the form was collapsed (`max-h-0 opacity-0`), the form fields were still rendered in the DOM and visually leaked through the 0-height container, overlapping the success badge. The user saw the badge text on top of (or instead of) the fields.

   **Fix applied:** Changed `overflow-visible` → `overflow-hidden` on the form panel only. The success/error panels already had `overflow-hidden` and were fine. This matches the behavior of the other two panels in the same component.

2. `profile-email/index.tsx`: the original `updateCustomerEmail` action returns `{ success: true, error: null }` as a no-op. The email update API call is commented out (line 9: `// import { updateCustomer } from "@lib/data/customer"`). There is a `// TODO: It seems we don't support updating emails now?` comment on line 18. **No fix is needed** — the scaffold already avoids the rejected API call. Email changes require the backend's email-verification flow (`sdk.auth.verification.request/confirm`) which this starter does not implement.

3. `profile-billing-address/index.tsx`: the `useActionState` initial state had `error: false` (boolean), but the `addCustomerAddress`/`updateCustomerAddress` actions return `error: null` (string | null). **Fix applied:** Changed to `error: null as string | null` for type consistency with the action return shape.

**Behavior after fix:**
- Click Edit → form panel animates open (`max-h-[1000px] opacity-100`), fields are fully visible and interactive.
- Click Save → `useFormStatus()` sets `pending=true`, the Save button shows `"Loading..."`, the action runs.
- On success → `useActionState` updates `state.success=true`, the `useEffect` sets `successState=true`, the success badge panel animates open, and `close()` collapses the form panel. The badge is now cleanly visible because the form panel's content is clipped by `overflow-hidden`.
- Click Edit again (after a save) → `clearState()` resets `successState=false` (badge collapses), then 100ms later `toggle()` opens the form again. Same correct cycle.

**Files changed:**
- `apps/storefront/src/modules/account/components/account-info/index.tsx` (1 line: `overflow-visible` → `overflow-hidden`)
- `apps/storefront/src/modules/account/components/profile-billing-address/index.tsx` (1 line: `error: false` → `error: null as string | null`)

**Files intentionally NOT changed:**
- `apps/storefront/src/modules/account/components/profile-email/index.tsx` — already a no-op; email updates require backend email-verification flow not implemented in this starter.

### Cart (`src/modules/cart/`)
**Templates** (`templates/`):
- `index.tsx` → `CartTemplate`
- `items.tsx` → `ItemsTemplate`
- `preview.tsx` → `ItemsPreviewTemplate`
- `summary.tsx` → `Summary`

**Components** (`components/`):
- `item/` → `Item`
- `empty-cart-message/` → `EmptyCartMessage`
- `sign-in-prompt/` → `SignInPrompt`
- `cart-item-select/` → `CartItemSelect`

### Checkout (`src/modules/checkout/`)
**Components** (`components/`):
| Folder | Export | Notes |
|---|---|---|
| `addresses/index.tsx` | `Addresses` | Wraps `shipping-address` and `billing_address` |
| `address-select/` | `AddressSelect` | Pick from existing saved addresses |
| `billing_address/` | `BillingAddress` | Billing form |
| `country-select/` | `CountrySelect` | Region switcher used in the checkout shipping form |
| `discount-code/` | `DiscountCode` (default client component) | Toggleable `Add Promotion Code(s)` form; calls `applyPromotions(codes)`; lists applied promotions with `Badge` + trash button; uses `applyPromotions` revalidates the `carts` tag |
| `error-message/` | `ErrorMessage` (default) | Simple `text-rose-500` error row; renders nothing when `error` is falsy |
| `payment/` | `Payment` (default client component) | `@headlessui/react` `RadioGroup` of providers; reads `?step=payment` from URL; calls `initiatePaymentSession` on select; renders `StripePaymentContainer` for Stripe-like and `PaymentContainer` for others; handles the `paidByGiftcard` short-circuit; submit button text depends on whether Stripe details need to be entered |
| `payment-button/` | `PaymentButton` (default client component) | Top-level switch on `cart.payment_collection?.payment_sessions?.[0]?.provider_id`: renders `StripePaymentButton` (uses `useStripe`/`useElements`, calls `stripe.confirmPayment` with `redirect: "if_required"`, then `placeOrder()`) for Stripe-like providers, `ManualTestPaymentButton` (calls `placeOrder()` directly) for `pp_system_default`, or a disabled "Select a payment method" button otherwise |
| `payment-test/` | `PaymentTest` (default) | `<Badge color="orange">` saying "For testing purposes only." |
| `payment-container/` | `PaymentContainer` (default), plus named export `StripePaymentContainer` | Container/card row for a single provider; Stripe variant is wired to Stripe Elements |
| `payment-wrapper/` | `PaymentWrapper` (default), `StripeWrapper` (default from `stripe-wrapper.tsx`), named `StripeContext` | `@stripe/react-stripe-js` `Elements` provider; loads `loadStripe(publishableKey, { stripeAccount })` lazily; `stripeKey` is `NEXT_PUBLIC_STRIPE_KEY || NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY`; `medusaAccountId` is `NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID` |
| `review/` | `Review` | Review step (address, shipping, payment summary) before place order |
| `shipping/` | `Shipping` | Shipping-method picker (calls `setShippingMethod`) |
| `shipping-address/` | `ShippingAddress` | Shipping form |
| `submit-button/` | `SubmitButton` (named) | Button used inside `<form action={...}>` server actions (uses `useFormStatus`) |

**Templates** (`templates/`):
- `checkout-form/index.tsx` → `CheckoutForm` (default async server component)
- `checkout-summary/index.tsx` → `CheckoutSummary` (default async server component)

### Collections (`src/modules/collections/`)
- `templates/index.tsx` → collection template
- (no `components/` folder in this install)

### Categories (`src/modules/categories/`)
- `templates/index.tsx` → category template
- (no `components/` folder)

### Home (`src/modules/home/components/`)
| Folder | Export |
|---|---|
| `hero/index.tsx` | `Hero` |
| `featured-products/index.tsx` | `FeaturedProducts` (async) |
| `featured-products/product-rail/index.tsx` | `ProductRail` (async) |

(No `templates/` under home.)

### Order (`src/modules/order/`)
**Templates** (`templates/`):
- `order-completed-template.tsx` → `OrderCompletedTemplate` (async)
- `order-details-template.tsx` → `OrderDetailsTemplate`

**Components** (`components/`):
- `help/`, `item/`, `items/`, `transfer-image/`, `transfer-actions/`
- `shipping-details/`, `payment-details/`, `order-summary/`, `order-details/`, `onboarding-cta/`

### Products (`src/modules/products/`)
**Templates** (`templates/`):
| Folder | Export |
|---|---|
| `index.tsx` | `ProductTemplate` |
| `product-info/` | `ProductInfo` |
| `product-actions-wrapper/` | `ProductActionsWrapper` (async) |

**Components** (`components/`):
| Folder | Export |
|---|---|
| `thumbnail/` | `Thumbnail` |
| `related-products/` | `RelatedProducts` (async) |
| `product-tabs/` | `ProductTabs` |
| `product-tabs/accordion.tsx` | `Accordion` (Radix) |
| `product-price/` | `ProductPrice` |
| `product-preview/` | `ProductPreview` |
| `product-preview/price.tsx` | `PreviewPrice` (async) |
| `product-onboarding-cta/` | `ProductOnboardingCta` |
| `product-actions/` | `ProductActions` (default function) |
| `product-actions/option-select.tsx` | `OptionSelect` |
| `product-actions/mobile-actions.tsx` | `MobileActions` |
| `image-gallery/` | `ImageGallery` |

### Shipping (`src/modules/shipping/components/`)
Shipping options components.

### Store (`src/modules/store/`)
**Templates** (`templates/`):
- `index.tsx` → `StoreTemplate`
- `paginated-products.tsx` → `PaginatedProducts` (async)

**Components** (`components/`):
- `pagination/index.tsx` → `Pagination`
- `refinement-list/index.tsx` → `RefinementList`
- `refinement-list/sort-products/index.tsx` → `SortProducts` (also exports `SortOptions` type)
- `refinement-list/options-picker/index.tsx` → `OptionsPicker`

### Skeletons (`src/modules/skeletons/`)
**Components** (`components/`):
- `skeleton-product-preview/` → `SkeletonProductPreview`
- `skeleton-order-summary/` → `SkeletonOrderSummary`
- `skeleton-order-items/` → `SkeletonOrderItems`
- `skeleton-order-information/` → `SkeletonOrderInformation`
- `skeleton-order-confirmed-header/` → `SkeletonOrderConfirmedHeader`
- `skeleton-line-item/` → `SkeletonLineItem`
- `skeleton-cart-item/` → `SkeletonCartItem`
- `skeleton-code-form/` → `SkeletonCodeForm`
- `skeleton-cart-totals/` → `SkeletonCartTotals`
- `skeleton-card-details/` → `SkeletonCardDetails`
- `skeleton-button/` → `SkeletonButton`

**Templates** (`templates/`):
- `skeleton-product-grid/` → `SkeletonProductGrid`
- `skeleton-related-products/` → `SkeletonRelatedProducts`
- `skeleton-order-confirmed/` → `SkeletonOrderConfirmed`
- `skeleton-cart-page/` → `SkeletonCartPage`

## Component Patterns

### Server vs Client
- **Server Components** by default. Pages fetch via `@lib/data/*` server actions.
- **Client Components** start with `"use client"` — `cart-dropdown`, `country-select`, `language-select`, `side-menu`, `modal-context`, checkout sub-forms, the `local-ui-kit` `Input`/etc. where interactive.

### Path Aliases
```json
{
  "@lib/*": ["lib/*"],
  "@modules/*": ["modules/*"],
  "@pages/*": ["pages/*"]   // unused
}
```
`baseUrl: "./src"` (from `tsconfig.json`).

### Forward Refs + Display Names
All UI primitives use `forwardRef` and set `displayName`.

### Compound Components
Where applicable, the `Object.assign` compound-component pattern is used (e.g. `Table`, `RadioGroup`).

## React Contexts

**File**: `src/lib/context/modal-context.tsx`
- `ModalProvider` — client component, props `{ children?, close }`, provides `ModalContext`
- `ModalContext` value: `{ close: () => void }` (module-private)
- Hook `useModal()` — throws if not within a `ModalProvider`

## Custom Hooks (`src/lib/hooks/`)

| File | API |
|---|---|
| `use-toggle-state.tsx` | `useToggleState(initialState = false) => StateType` where `StateType` is tuple `[state, open, close, toggle]` and object `{ state, open, close, toggle }` |
| `use-in-view.tsx` | `useIntersection(element: RefObject<HTMLDivElement>, rootMargin: string) => boolean` |

## Related Files

- `storefront-checkout-architecture.md` — how `CartDropdown`'s 5s auto-open, `CartMismatchBanner`, `FreeShippingPriceNudge`, checkout step routing, payment-return state machine, cart page template, and `CartTotals` work.
- `ui-primitives-and-modals.md` — the `Input` floating-label CSS contract, `Modal` API, and the canonical form-modal pattern using `useActionState` + `useToggleState` (see `add-address.tsx`, `edit-address-modal.tsx`).
- `store-and-products.md` — the `sortBy` / `page` / `optionValueIds` URL contract consumed by `<RefinementList>`, `<SortProducts>`, `<OptionsPicker>`, `<Pagination>`, plus `listProductsWithSort`, product cards, and archive patterns.