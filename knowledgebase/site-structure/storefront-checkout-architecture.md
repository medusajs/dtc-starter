# Storefront: Cart, Checkout, and Order Architecture

## Overview

The cart is the only piece of the storefront with persistent client-side state (the dropdown's 5-second auto-open timer) and the only one that interacts with cross-site payment redirects. Checkout is a **URL-driven step state machine** — there is no shared state between steps. Each step is a client component that reads `useSearchParams().get("step")` to decide whether it is open. The `CheckoutForm` server component fetches shipping methods and payment providers upfront, then renders all four steps in a single column. After payment, the order module handles order confirmation, order details, and order transfer requests.

This file documents the cart page template, the cart dropdown behavior, the `CartTotals` presentation, the `getCheckoutStep` logic, the checkout step routing, the `Addresses`/`Shipping`/`Payment`/`Review` internals, the `paidByGiftcard` short-circuit, the Stripe Elements provider pattern, the payment-return state machine, and the order confirmation/details/transfer flows.

## File Map

```
src/modules/cart/
├── templates/
│   ├── index.tsx           ← CartTemplate (conditional rendering)
│   ├── items.tsx           ← Items list + quantity selectors
│   ├── preview.tsx         ← Mini cart for dropdown
│   └── summary.tsx         ← DiscountCode + CartTotals + CTA
├── components/
│   ├── item/index.tsx      ← Single cart item row
│   ├── cart-item-select/index.tsx  ← Quantity dropdown
│   ├── empty-cart-message/index.tsx ← Empty state
│   └── sign-in-prompt/index.tsx     ← Sign-in CTA for guests

src/modules/checkout/templates/
  checkout-form/index.tsx          ← server component, fetches methods
  checkout-summary/index.tsx       ← CartTotals + DiscountCode + CTA

src/modules/checkout/components/
  addresses/index.tsx              ← Shipping + billing form, useActionState
  shipping-address/index.tsx       ← Shipping address fields
  billing_address/index.tsx        ← Billing address toggle + fields
  address-select/index.tsx         ← Saved address selector
  shipping/index.tsx               ← Shipping method RadioGroup + pickup split
  payment/index.tsx                ← Payment provider RadioGroup
  payment-wrapper/index.tsx        ← Conditionally wraps Stripe Elements
  stripe-wrapper.tsx               ← Stripe.js provider
  payment-button/index.tsx         ← Stripe confirm / Manual place-order switcher
  review/index.tsx                 ← Guarded Place Order button
  discount-code/index.tsx          ← Promo code form
  error-message/index.tsx          ← Error display
  country-select/index.tsx         ← Country dropdown
  submit-button/index.tsx          ← Loading-aware submit button

src/app/[countryCode]/(main)/
├── order/[id]/confirmed/page.tsx    ← order confirmation page
└── order/[id]/transfer/[token]/
    ├── page.tsx       ← transfer request form
    ├── accept/page.tsx ← accept transfer
    └── decline/page.tsx ← decline transfer

src/modules/order/
├── templates/
│   ├── order-completed-template.tsx  ← thank-you page
│   └── order-details-template.tsx    ← full order view
├── components/
│   ├── order-details/                ← order metadata
│   ├── items/                        ← order items list
│   ├── item/                         ← single order item
│   ├── shipping-details/             ← shipping address display
│   ├── payment-details/              ← payment method display
│   ├── order-summary/                ← totals
│   ├── help/                         ← help text
│   ├── transfer-actions/             ← accept/decline buttons
│   ├── transfer-image/               ← transfer QR/image
│   └── onboarding-cta/               ← legacy admin link
```

## Cart Template

`modules/cart/templates/index.tsx` — the top-level cart page component.

### Conditional Rendering

```tsx
{cart?.items?.length ? (
  <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
    <div className="flex flex-col bg-white py-6 gap-y-6">
      {!customer && (
        <>
          <SignInPrompt />
          <Divider />
        </>
      )}
      <ItemsTemplate cart={cart} />
    </div>
    <div className="relative">
      <div className="flex flex-col gap-y-8 sticky top-12">
        {cart && cart.region && (
          <div className="bg-white py-6">
            <Summary cart={cart} />
          </div>
        )}
      </div>
    </div>
  </div>
) : (
  <EmptyCartMessage />
)}
```

- If the cart has items, renders a 2-column grid: items list (flexible width) + summary (360px fixed).
- If empty, renders a "Your cart is empty" message with a link to `/store`.
- When accessed by an anonymous user (`!customer`), shows `<SignInPrompt>` + `<Divider>` above the items list.
- The summary is `sticky top-12` so it stays visible while scrolling the items list.

## ItemsTemplate

`modules/cart/templates/items.tsx` — renders a `Table` of cart items. Each row is a `<CartItem>` component.

## CartItem (Client)

`modules/cart/components/item/index.tsx` — renders a single cart item row:

- Thumbnail via `<Thumbnail size="square" .../>`.
- Product title, variant options, quantity selector, unit price, line price.
- Delete button (`<DeleteButton>`).
- Quantity changes call `updateLineItem({ lineId, quantity })` from `@lib/data/cart`.
- The quantity selector (`<CartItemSelect>`) has a hardcoded max of 10.

## CartItemSelect

`modules/cart/components/cart-item-select/index.tsx` — a `<select>` dropdown for quantity.

- Options: 1 through 10.
- On change, calls `updateLineItem({ lineId, quantity })`.
- The max of 10 is hardcoded in the component — there is no configurable max.

## CartTotals

`modules/common/components/cart-totals/index.tsx` — 82 lines. Pure presentation, receives the full `HttpTypes.StoreCart` and renders 5 rows:

| Row | `data-testid` | Source | Notes |
|---|---|---|---|
| Subtotal | `cart-subtotal` | `item_subtotal` | Excludes shipping/taxes |
| Shipping | `cart-shipping` | `shipping_total` | Free if 0 |
| Discount | `cart-discount` | `discount_subtotal` | Only when truthy |
| Taxes | `cart-taxes` | `tax_total` | |
| Total | `cart-total` | `total` | Last row, larger/bolder |

Each row's number element also carries a `data-value` with the raw numeric amount. All currency formatting goes through `convertToLocale` from `@lib/util/money`.

## Cart Summary

`modules/cart/templates/summary.tsx` — 46 lines. Composes:
- `<DiscountCode>` — inline promo code form (`applyPromotions` from `@lib/data/cart`).
- `<Divider>` — visual separator.
- `<CartTotals>` — the 5-row totals table.
- Checkout CTA button.

### Checkout CTA

The CTA's `?step=` value is computed by `getCheckoutStep(cart)`:

```ts
function getCheckoutStep(cart) {
  if (!cart.shipping_address?.address_1 || !cart.email) return "address"
  if (!cart.shipping_methods?.length) return "delivery"
  return "payment"
}
```

| Condition | Step |
|---|---|
| No shipping address or no email | `address` |
| Has address but no shipping methods | `delivery` |
| Has address + shipping methods | `payment` |

The button reads `"Go to checkout"` (`data-testid="checkout-button"`) and links to `/checkout?step={getCheckoutStep(cart)}`.

## EmptyCartMessage

`modules/cart/components/empty-cart-message/index.tsx` — renders a centered "Your cart is empty" message with an "Explore products" button that links to `/store`.

## SignInPrompt

`modules/cart/components/sign-in-prompt/index.tsx` — shown when the cart page is accessed by an anonymous user who has items in their cart. Renders a message encouraging the user to sign in to save their cart, with a link to `/account`.

## Cart Page 404

`app/[countryCode]/(main)/cart/page.tsx` calls `retrieveCart().catch((error) => { console.error(error); return notFound() })` when the cart is missing. This routes to `cart/not-found.tsx` ("The cart you tried to access does not exist. Clear your cookies and try again."), not the parent `(main)/not-found.tsx`.

## Preview Template (Cart Dropdown)

`modules/cart/templates/preview.tsx` — renders the mini cart inside the header dropdown. Shows a condensed list of items (thumbnail, title, variant options, quantity, price) and a "Go to cart" button. Uses the same `CartItem` component but in a compact layout.

## Cart Dropdown Behavior

`modules/layout/components/cart-dropdown/index.tsx` — client component using `@headlessui/react` `Popover` / `PopoverButton` / `PopoverPanel` / `Transition`. 420px wide popover; sorts items by `created_at` descending; shows the line-item thumbnail via `Thumbnail size="square"`, `LineItemOptions`, `LineItemPrice`, and a `DeleteButton` per item.

### 5-Second Auto-Open Timer

Defined in `cart-dropdown/index.tsx:25-74`. State machine:

```
1. `totalItems` is derived from cart.items.reduce((acc, i) => acc + i.quantity, 0) || 0.
2. `itemRef = useRef<number>(totalItems || 0)` is a ref that holds the previously-seen count.
3. `useEffect` on `[totalItems, itemRef.current]`:
     - if (itemRef.current !== totalItems && !pathname.includes("/cart")) → call `timedOpen()`.
4. `timedOpen()` calls `open()` (setCartDropdownOpen(true)) and `setTimeout(close, 5000)`.
5. `openAndCancel()` (called on `onMouseEnter` of the wrapper) clears the active timer and opens.
6. The `useEffect` cleanup on `[activeTimer]` calls `clearTimeout(activeTimer)` on unmount.
```

The timer fires **only** when the count actually changes (i.e. a line item was added/removed/quantity-changed) and the user is not on the cart page. Initial mount, server re-renders with the same count, and routes that include `/cart` all suppress the auto-open. The `eslint-disable-next-line react-hooks/exhaustive-deps` on the auto-open effect is intentional — the dependency on `pathname` is captured implicitly via the `usePathname()` read, and adding it would re-fire the effect on every navigation.

### Data-Test IDs in the Cart Dropdown
- `nav-cart-link` (top-level link)
- `nav-cart-dropdown` (popover panel)
- `cart-item`, `product-link`, `cart-item-variant`, `cart-item-quantity`, `cart-item-remove-button`
- `cart-subtotal` (with `data-value={subtotal}`)
- `go-to-cart-button` (the bottom CTA)
- On the empty state: a 0-in-circle and a `Button` reading "Explore products" that links to `/store` and closes the panel.

## Cart Mismatch Banner

`modules/layout/components/cart-mismatch-banner/index.tsx` (56 lines) — client component.

- **When shown**: only inside `(main)/layout.tsx` when `customer && cart` are both present **and** the cart is not yet attached (`!cart.customer_id`). This is the silent-failure case where a guest added items, signed in, but the auto `transferCart()` on login didn't take.
- **UI**: orange `bg-orange-100` banner with inline `<button>` retry.
- **Retry button**: `onClick={async () => { setState("transferring"); await transferCart().finally(() => setState("idle")) }}` — toggles between `"Run transfer again"` and `"Transferring.."`.
- It re-renders whenever the cart or customer changes, so a successful retry removes it automatically (the cart gets `customer_id` set).

## Free-Shipping Price Nudge

`modules/shipping/components/free-shipping-price-nudge/index.tsx` (284 lines) — client component with two variants.

### Rule Resolution

For each shipping option in the cart's `shipping_options`, the component filters `option.prices` to those that:
1. match the cart's `currency_code`, AND
2. have a `price_rules` entry with `attribute === "item_total"`.

The first such price with `amount === 0` is treated as the **free-shipping tier** (the seeded `Standard Shipping` has a single flat price, not a tiered rule, so the nudge **never triggers out of the box** — the rule-based tiers need to be set up in the admin).

### Operators

`computeTarget()` handles `gt`, `gte`, `lt`, `lte` (default `gt`). It returns `{ current_amount, target_amount, target_reached, target_remaining, remaining_percentage }` which drives the progress bar.

### Variants

- `variant="inline"` — a horizontal progress bar used inside the cart page (cart-side bar). Shows `"Only $X away"` → `"Free Shipping unlocked!"` on `target_reached`.
- `variant="popup"` — a fixed bottom-right card used in `(main)/layout.tsx`. Has a dismiss `XMark` button (`isClosed` state in localStorage-style — actually in-memory). When `target_reached` becomes true, it auto-hides after 1s via `opacity-0 invisible delay-1000`.

## CheckoutForm (Server)

`checkout-form/index.tsx` (38 lines):

1. Calls `listCartShippingMethods(cart.id)` — `GET /store/shipping-options?cart_id={id}`.
2. Calls `listCartPaymentMethods(cart.region?.id ?? "")` — `GET /store/payment-providers?region_id={id}`.
3. If either returns `null`, renders nothing (the `checkout-summary` CTA handles redirecting).
4. Renders all four steps in a single `grid-cols-1` column:
   - `<Addresses cart={cart} customer={customer} />`
   - `<Shipping cart={cart} availableShippingMethods={shippingMethods} />`
   - `<Payment cart={cart} availablePaymentMethods={paymentMethods} />`
   - `<Review cart={cart} />`

**Key point**: `CheckoutForm` is a server component that does the expensive SDK calls upfront. Each child step is a client component that reads `useSearchParams` for its open/closed state. There is no shared step state in React — the URL is the single source of truth.

## Step Routing Contract

Every step reads `useSearchParams().get("step")`:

| `step` value | Open component | Close condition |
|---|---|---|
| `"address"` or missing | `Addresses` | Form submits `setAddresses` → pushes `?step=delivery` |
| `"delivery"` | `Shipping` | User selects method → pushes `?step=payment` |
| `"payment"` | `Payment` | User selects provider + submits → pushes `?step=review` |
| `"review"` | `Review` | User clicks Place Order → `placeOrder()` → redirects to `/order/{id}/confirmed` |

The `getCheckoutStep` helper in `cart/templates/summary.tsx` computes the initial `?step=` for the checkout CTA:
- `"address"` if no `shipping_address.address_1` or no `email`
- `"delivery"` if address exists but no `shipping_methods`
- `"payment"` otherwise

## Addresses (Client)

`addresses/index.tsx` — 184 lines. Uses `useActionState` with `setAddresses` server action.

### `sameAsBilling` toggle
- Initial state: `true` if shipping and billing addresses are identical (via `compareAddresses`), `false` otherwise.
- `useToggleState` gives `state`, `toggle`.
- When `sameAsBilling` is `false`, the billing address form is shown.

### Edit button
When collapsed (`isOpen === false`) and a shipping address exists, an "Edit" button appears. Clicking it pushes `?step=address`.

### Form action
`useActionState(setAddresses, null)` — the action PATCHes the cart with both shipping and billing addresses. On success, the action itself redirects to `/{countryCode}/checkout?step=delivery` via `redirect()` inside the server action.

### Success/error display
- `message` from `useActionState` contains `{ success, error }`.
- On error: `<ErrorMessage>{message.error}</ErrorMessage>`.
- On success: the redirect happens in the action, so no success UI is needed.

## ShippingAddress / BillingAddress (Client)

These are presentational sub-components that render the actual address fields:
- `ShippingAddress`: first name, last name, company, address, postal code, city, province, phone, country.
- `BillingAddress`: same fields, conditionally rendered when `sameAsBilling === false`.

Both use `Input` from `@modules/common/components/input` with the floating-label contract.

## Shipping (Client)

`shipping/index.tsx` — 411 lines. `RadioGroup` of available shipping methods.

### Pickup vs shipping split
The component filters `availableShippingMethods` into two groups:
- `_shippingMethods`: options where `type !== "pickup"`.
- `_pickupMethods`: options where `type === "pickup"`.

Each group renders its own `RadioGroup`. A `showPickupOptions` toggle lets users switch between "Shipping" and "Pickup" views.

### Calculated prices
For options with `price_type === "calculated"`, the component calls `calculatePriceForShippingOption(optionId, cartId)` to get the actual price before displaying it. Flat-price options (like the seeded Standard/Express) display their price directly.

### Selection
When the user selects a shipping method, `handleSetShippingMethod` calls `setShippingMethod({ cartId, shippingMethodId })` which PATCHes the cart. The user then clicks "Continue to payment" (`handleSubmit`) which pushes `?step=payment`.

## Payment (Client)

`payment/index.tsx` — 260 lines. `RadioGroup` of payment providers.

### Provider rendering
- Stripe-like providers (`isStripeLike(providerId)` from `@lib/constants`) render `StripePaymentContainer` (wrapped in `PaymentWrapper`).
- Other providers render `PaymentContainer`.

### `paidByGiftcard` bypass
In `payment/index.tsx`, when `cart.gift_cards.length > 0 && cart.total === 0`:
- The provider `RadioGroup` is hidden (`!paidByGiftcard && ...`).
- A static "Gift card" payment method summary is shown instead.
- The "Continue to review" button is enabled without selecting a provider.

In `review/index.tsx`, `previousStepsCompleted` includes `paidByGiftcard`, so the Place Order button shows even when no payment session exists.

This is a Medusa business rule, not a storefront bug.

### Provider selection
When a Stripe-like provider is selected, `setPaymentMethod` calls `initiatePaymentSession(cart, { provider_id })` immediately to create a payment session. When the user clicks "Continue to review", `handleSubmit` calls `initiatePaymentSession` again only if the session is missing, then pushes `?step=review`.

### Button text
- No `activeSession` yet (Stripe): "Enter payment details"
- Has `activeSession` (or non-Stripe): "Continue to review"

## PaymentWrapper / StripeWrapper (Client)

`payment-wrapper/index.tsx` — conditionally wraps children in Stripe Elements:
1. Calls `loadStripe(publishableKey)` lazily (dynamic import of `@stripe/stripe-js`).
2. If the selected provider is Stripe-like, renders `<StripeWrapper>` which provides `stripe` and `elements` via `Elements` provider from `@stripe/react-stripe-js`.
3. Inside that, `<StripePaymentContainer>` renders the actual card input.

`NEXT_PUBLIC_STRIPE_KEY` is required for Stripe. If empty, `StripeWrapper` renders nothing.

## PaymentButton (Client)

`payment-button/index.tsx` — the actual order-placement switcher:

- **Stripe-like providers**: Renders `StripePaymentButton`. Uses `useStripe()` + `useElements()` and calls `stripe.confirmPayment({ redirect: "if_required" })`. Stripe handles the off-site redirect (iDEAL, Bancontact) and comes back to `/api/payment-return`.
- **`pp_system_default`**: Renders `ManualTestPaymentButton`. Calls `placeOrder()` directly, which completes the cart and redirects to `/order/{id}/confirmed`.
- **No provider selected**: Renders a disabled "Select a payment method" button.

## Review (Client)

`review/index.tsx` — 57 lines. The simplest step.

### `previousStepsCompleted` guard
```ts
const previousStepsCompleted =
  cart.shipping_address &&
  (cart.shipping_methods?.length ?? 0) > 0 &&
  (cart.payment_collection || paidByGiftcard)
```

The Review step only renders its content when all three previous steps are complete. If the user manually navigates to `?step=review` without completing the earlier steps, the heading appears dimmed (`opacity-50 pointer-events-none`) and no Place Order button is shown.

### Place Order
`<PaymentButton cart={cart} data-testid="submit-order-button" />` — same component as in the Payment step, but here it represents the final order placement.

## Checkout Summary

`checkout-summary/index.tsx` — the right sidebar on wider screens. Contains:
- `<ItemsPreviewTemplate>` — mini cart preview.
- `<CartTotals>` — subtotal, shipping, discount, taxes, total.
- `<DiscountCode>` — inline promo code form.

The checkout CTA ("Go to checkout") lives on the **cart page** (`cart/templates/summary.tsx`), not on the checkout page. The `getCheckoutStep` helper there ensures the user lands on the correct step when they click the CTA.

## Payment Return State Machine

`app/api/payment-return/route.ts` — the only Next.js Route Handler in the storefront. Triggered when Stripe redirects back to the storefront after an off-site authorization (e.g. iDEAL, Bancontact). Reads these query params:

- `cart_id` (required) — the cart that initiated the session
- `country_code` (required for path prefixing)
- `payment_intent` (required) — Stripe's PaymentIntent id
- `payment_intent_client_secret` (required) — used to validate the session
- `redirect_status` — `"succeeded"` (or absent), `"processing"`, or `"failed"`

Flow:
1. If any required param is missing → redirect to `/{prefix}/cart?error=payment_failed`.
2. Fetch the cart with `fields: "payment_collection.payment_sessions.data"`. If the cart has a `payment_session` whose `data.id === paymentIntent` and `data.client_secret === paymentIntentClientSecret`, validation passes. Otherwise → `payment_failed` redirect.
3. On validation pass, `setCartId(cartId)` re-establishes the cart cookie (the redirect from the bank loses it sometimes — the lax sameSite on the cart cookie handles top-level navigation, but explicitly re-setting here is a belt-and-braces).
4. If `redirect_status === "failed"`: forward the Stripe `payment_intent`, `payment_intent_client_secret`, `redirect_status` query params to `/{prefix}/checkout?step=payment` so the Payment Element can re-mount against the same `requires_payment_method` PaymentIntent and the user can retry.
5. Otherwise, call `placeOrder(cartId)`. On success, `placeOrder` itself redirects to `/{countryCode}/order/{id}/confirmed`. On throw, `unstable_rethrow(error)` re-throws framework errors (redirects, etc.) and otherwise redirects to `/{prefix}/cart?error=order_failed`.

## Order Confirmed Page

`app/[countryCode]/(main)/order/[id]/confirmed/page.tsx`:

- Async server component.
- Calls `retrieveOrder(params.id)` (no `fields` parameter) to get the order. Uses `.catch(() => null)` and renders `notFound()` if missing.
- Renders `<OrderCompletedTemplate>`.

## OrderCompletedTemplate

`modules/order/templates/order-completed-template.tsx`:

### Structure
- Centered thank-you layout with order summary.
- Shows: order number, date, items table, shipping address, billing address, payment method, totals.
- Renders `<CartTotals totals={order}>` for the totals section.
- Renders `<Help>` with contact/return policy text.

### Onboarding CTA
Checks the `_medusa_onboarding` cookie. If present and not cleared, renders `<OnboardingCta>` which calls `resetOnboardingState(orderId)` to clear the cookie and redirect to `http://localhost:7001/a/orders/{orderId}`. This is the **legacy v1 admin port** — the CTA is vestigial in Medusa 2.x and not used in the current admin flow.

**Note**: This onboarding redirect is dead code in the v2 flow. It exists because the seed script sets the `_medusa_onboarding` cookie, but the v2 admin at `/app` does not use it.

## OrderDetailsTemplate

`modules/order/templates/order-details-template.tsx`:

- Renders a full order view with a back link to `/account/orders`.
- Uses `<OrderDetails>` for metadata, `<Items>` + `<Item>` for line items, `<ShippingDetails>` and `<PaymentDetails>` for addresses/payment, `<OrderSummary>` for totals.
- This is the same component tree as `OrderCompletedTemplate` but without the thank-you header.

## Order Transfer Flow

The transfer feature lets a customer share an order with another person via a tokenized link.

### Routes

| Route | Purpose |
|---|---|
| `/order/[id]/transfer/[token]` | Create / view transfer request |
| `/order/[id]/transfer/[token]/accept` | Accept transfer |
| `/order/[id]/transfer/[token]/decline` | Decline transfer |

### Data Layer

`src/lib/data/orders.ts`:
- `createTransferRequest(orderId)` — creates a transfer request with a token.
- `acceptTransferRequest(token)` — accepts the transfer.
- `declineTransferRequest(token)` — declines the transfer.

### UI Components
- `TransferRequestForm` — form to create a transfer request (email + message).
- `TransferActions` — renders accept/decline buttons if the viewer has the token.
- `TransferImage` — renders a QR code or shareable link image.

## Order List

`app/[countryCode]/(main)/account/@dashboard/orders/page.tsx`:

- Calls `listOrders()` after `retrieveCustomer()` auth gate (BUG-01 fixed).
- Renders `OrderOverview` with the list of orders.
- Each order shows: order number, date, total, fulfillment status, payment status.
- Links to `/order/{id}/confirmed` for the confirmation page, or to `/account/orders/details/{id}` for full details.

## Order Data-Test IDs

| Element | `data-testid` |
|---|---|
| Order container | `order-container` |
| Order item | `order-item` |
| Order summary | `order-summary` |
| Transfer accept button | `accept-transfer-button` |
| Transfer decline button | `decline-transfer-button` |

## Key Patterns

### URL is the only source of truth
No step state is held in React context or lifted state. Each step independently reads `useSearchParams().get("step")`. This makes the checkout stateless and bookmarkable — if a user refreshes on `?step=payment`, they land on the payment step exactly where they left off.

### Server actions for mutations
Each step's form action is a server action (`setAddresses`, `setShippingMethod`, `initiatePaymentSession`). The step advancement happens in two ways:
- `setAddresses` calls `redirect()` inside the server action to advance to `?step=delivery`.
- `setShippingMethod` and `initiatePaymentSession` do not redirect — the client pushes the query param (`router.push`) after the action completes.

### `useActionState` for form feedback
`Addresses` uses `useActionState` (not `useFormState`) because `setAddresses` is a server action that returns `{ success, error }`. The `message` from `useActionState` drives the error display.

### `paidByGiftcard` bypass
When the cart total is zero and gift cards cover it, the payment step is effectively skipped. This is a Medusa business rule, not a storefront bug.

### Cart is server-fetched
The cart page is a server component that calls `retrieveCart()` directly. The cart dropdown in the header uses `<Suspense>` with a static "Cart (0)" fallback while `retrieveCart()` loads.

### Quantity updates are client-initiated
`CartItem` uses `useState` for the local quantity selector, then calls `updateLineItem` on change. The server re-fetches the cart after the mutation.

### `getCheckoutStep` is the single source of truth
The same `getCheckoutStep` helper is used by both the cart page CTA and the checkout summary CTA. If you add a new checkout step, update this function.

## Adding a New Checkout Step

1. Create a new `modules/checkout/components/{name}/index.tsx` (client component, reads `useSearchParams`).
2. Add the step constant to all the relevant places (`<Addresses>` handles the default + `"address"`, etc.).
3. Update the `getCheckoutStep` helper in `cart/templates/summary.tsx` to push users to the right step.
4. Update the form-action that completes the previous step to push `?step={newStep}` instead of the next one.
5. If the step needs a server action (e.g. set addresses), add the action to `lib/data/cart.ts` with the appropriate `revalidateTag("carts")` call.

## Data-Test IDs

| Element | `data-testid` |
|---|---|
| Checkout button | `checkout-button` |
| Cart subtotal | `cart-subtotal` |
| Cart shipping | `cart-shipping` |
| Cart discount | `cart-discount` |
| Cart taxes | `cart-taxes` |
| Cart total | `cart-total` |
| Edit address button | `edit-address-button` |
| Submit order button | `submit-order-button` |
| Nav cart link | `nav-cart-link` |
| Nav cart dropdown | `nav-cart-dropdown` |
| Cart item | `cart-item` |
| Product link (dropdown) | `product-link` |
| Cart item variant | `cart-item-variant` |
| Cart item quantity | `cart-item-quantity` |
| Cart item remove button | `cart-item-remove-button` |
| Go to cart button | `go-to-cart-button` |
