# Storefront: Account Module Architecture

## Overview

The account module uses **parallel routes** (`@dashboard` + `@login`) inside the `/account` layout. `AccountLayout` renders a 2-column grid with a sidebar nav and the active slot content, plus a footer CTA. This file documents the layout, nav, overview dashboard, and the shared `AccountInfo` profile editor pattern.

## File Map

```
src/app/[countryCode]/(main)/account/
├── layout.tsx                  ← parallel route switch (dashboard vs login)
├── loading.tsx
├── @dashboard/
│   ├── page.tsx                ← redirects to profile
│   ├── loading.tsx
│   ├── profile/page.tsx        ← Profile editor
│   ├── addresses/page.tsx      ← Address book
│   ├── orders/page.tsx         ← Order list (with auth gate)
│   └── orders/details/[id]/page.tsx  ← Single order
└── @login/
    └── page.tsx                ← Login + Register tabs

src/modules/account/
├── templates/
│   └── account-layout.tsx      ← sidebar + content + footer
├── components/
│   ├── account-nav/index.tsx   ← sidebar navigation
│   ├── overview/index.tsx      ← dashboard with profile completion %
│   ├── account-info/index.tsx  ← shared Disclosure editor shell
│   ├── profile-name/index.tsx
│   ├── profile-email/index.tsx
│   ├── profile-phone/index.tsx
│   ├── profile-password/index.tsx
│   ├── profile-billing-address/index.tsx
│   ├── address-card/
│   │   ├── add-address.tsx
│   │   └── edit-address-modal.tsx
│   ├── address-book/index.tsx
│   ├── order-overview/index.tsx
│   ├── order-card/index.tsx
│   ├── register/index.tsx
│   ├── login/index.tsx
│   ├── verify-account/index.tsx
│   └── transfer-request-form/index.tsx
```

## Parallel Route Switch

`app/[countryCode]/(main)/account/layout.tsx`:

```tsx
export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
    </AccountLayout>
  )
}
```

- If the customer is logged in, the `@dashboard` slot is rendered.
- If not, the `@login` slot is rendered.
- Both slots are pre-rendered by Next.js; only one is shown based on auth state.

## AccountLayout Template

`modules/account/templates/account-layout.tsx` — 43 lines:

```
┌──────────────────────────────────────────────────────────────┐
│ content-container max-w-5xl mx-auto                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ grid grid-cols-1 small:grid-cols-[240px_1fr] gap-6    │  │
│  │                                                        │  │
│  │  ┌──────────────────┐  ┌──────────────────────────┐  │  │
│  │  │ AccountNav       │  │  Active slot content       │  │  │
│  │  │ (panel surface)  │  │  (profile / addresses /    │  │  │
│  │  │ (240px)          │  │   orders)                │  │  │
│  │  └──────────────────┘  └──────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ Footer: "Got questions?" + Customer Service link │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- Sidebar: `240px` fixed width on `small:` screens (≥1024px), hidden on mobile. Wrapped in a panel surface (`bg-white border border-ui-border-base rounded-3xl p-3 sm:p-4 shadow-elevation-card-rest`).
- Content: `flex-1` fills the remaining space.
- Footer: always visible, contains a CTA to `/customer-service`.

## AccountNav (Client)

`modules/account/components/account-nav/index.tsx` — 199 lines. Renders the sidebar links.
### Mobile version

Shown only on screens smaller than `small` (<1024px). Two states:

- When NOT on `/account`: single "Account" back-link (`data-testid="account-main-link"`) that navigates to `/account`.
- When ON `/account`: full menu with Profile, Addresses, Orders, and Logout.

Mobile nav links use `py-3` padding (reduced from `py-4`) to avoid excessive height on smaller screens.
### Desktop version
Shown only on `small:` screens (≥1024px). Static list of links with icons:
- Profile (`User` icon)
- Addresses (`MapPin` icon)
- Orders (`Package` icon)
- Logout (`ArrowRightOnRectangle` icon) — calls `signout(countryCode)` on click

The active link is highlighted with `border-l-2 border-ui-border-interactive`.

### Data-Test IDs
- `mobile-account-nav` — mobile nav wrapper
- `account-main-link` — "Account" back-link
- `profile-link` — Profile nav item

## Overview (Server)

`modules/account/components/overview/index.tsx` — 168 lines. The dashboard shown at `/account`.

### Profile Completion Calculation

`getProfileCompletion(customer)` returns a percentage (0–100):

| Field | Points |
|---|---|
| `customer.email` | 1 |
| `customer.first_name && customer.last_name` | 1 |
| `customer.phone` | 1 |
| Default billing address exists | 1 |

4 fields total → `(count / 4) * 100`.

### Dashboard Sections
- **Welcome message**: "Hello {first_name}" + "Signed in as: {email}" (hidden on mobile).
- **Profile completion**: large percentage badge with label, inside a card surface (`bg-white border border-ui-border-base rounded-3xl p-6 shadow-elevation-card-rest`).
- **Addresses**: count of customer addresses + "Saved" label, inside a card surface matching Profile card.
- **Recent orders**: up to 5 most recent orders, each showing date placed, order number, and total amount, inside a card surface matching the Profile/Addresses cards.

Profile and Addresses are laid out in a `grid grid-cols-1 sm:grid-cols-2 gap-6` on desktop (side by side), stacking vertically on mobile.

### Data-Test IDs
- `overview-page-wrapper` — main wrapper
- `welcome-message` — "Hello {first_name}"
- `customer-email` — signed-in email
- `customer-profile-completion` — percentage badge
- `addresses-count` — address count

## AccountInfo — Shared Profile Editor (Client)

`modules/account/components/account-info/index.tsx` — the shared Disclosure-based editor shell used by all five profile sections (name, email, phone, password, billing address).

### Props

| Prop | Type | Purpose |
|---|---|---|
| `label` | `string` | Section label (e.g., "Name", "Billing address") |
| `currentInfo` | `string \| ReactNode` | Current value display |
| `isSuccess` | `boolean` | Show success badge when true |
| `isError` | `boolean` | Show error badge when true |
| `errorMessage` | `string \| undefined` | Error text |
| `clearState` | `() => void` | Reset form state callback |
| `children` | `ReactNode` | Form fields + submit button |
| `data-testid` | `string` | Test identifier |

### Disclosure Panels (3)

1. **Info panel** (default open): Shows `currentInfo` + an "Edit" button.
2. **Form panel** (collapsed): Contains `children` (form fields). Animates via `max-h-0 opacity-0` → `max-h-[1000px] opacity-100`. Uses `overflow-hidden` to clip content during animation.
3. **Success/Error panel** (collapsed): Shows green checkmark + "Updated successfully" or red X + error message.

### Auto-Close Pattern

```ts
useEffect(() => {
  if (successState) {
    close() // collapses the form panel
  }
}, [successState])
```

When the child form's `useActionState` reports success, `successState` is set to `true`, the `useEffect` fires `close()` (which collapses the form Disclosure), and the success badge panel becomes visible.

### Edit/Clear Cycle

1. User clicks "Edit" → `toggle()` opens the form panel, collapses the info panel.
2. User fills form and clicks Save → `useFormStatus()` sets pending, action runs.
3. On success → `useActionState` updates `state.success=true`, `useEffect` sets `successState=true`, `close()` collapses the form, success badge animates open.
4. User clicks "Edit" again → `clearState()` resets `successState=false` (badge collapses), then 100ms later `toggle()` opens the form again.

## Profile Components

Each profile component uses `AccountInfo` as its shell and `useActionState` for the form:

| Component | File | Server Action | Fields |
|---|---|---|---|
| `ProfileName` | `profile-name/index.tsx` | `updateCustomer` | First name, last name |
| `ProfileEmail` | `profile-email/index.tsx` | no-op (commented out) | Email (read-only, no-op action) |
| `ProfilePhone` | `profile-phone/index.tsx` | `updateCustomer` | Phone |
| `ProfilePassword` | `profile-password/index.tsx` | `updateCustomer` | Current password, new password, confirm |
| `ProfileBillingAddress` | `profile-billing-address/index.tsx` | `updateCustomerAddress` | Full address form |

**Note**: `profile-phone/index.tsx` exports `ProfileEmail` (upstream filename/export mismatch — the component actually updates the phone number).

### Known Issue: Profile Email

`profile-email/index.tsx` has the email update API call commented out (line 9) and the action returns `{ success: true, error: null }` as a no-op. Email changes require the backend's email-verification flow (`sdk.auth.verification.request/confirm`) which this starter does not implement. **No fix needed.**

## Address Card Modals

`address-card/add-address.tsx` and `address-card/edit-address-modal.tsx`:

- Both use `useToggleState` for open/close.
- Both use `useActionState` with `addCustomerAddress` / `updateCustomerAddress`.
- Both use `useEffect` to close the modal on success: `if (formState.success) toggle.close()`.
- Both render a `SubmitButton` (from `checkout/components/submit-button`) that shows "Loading..." during the pending state.
- Both use `size="large"` on `<Modal>` for the 2-column address form layout.

## Login / Register

`@login/page.tsx` renders `<LoginTemplate>` which shows either `<Login>` (sign in) or `<Register>` (sign up) — only one at a time.

- `<Login>` uses `useActionState` with `login()` from `@lib/data/customer`. The form is centered and constrained to `max-w-md` (448px).
- `<Register>` uses `useActionState` with `signup()` from `@lib/data/customer`. Also centered and constrained to `max-w-md`.
- Both use `SubmitButton` for the submit action.

## Logout

Logout is not a page — it's a server action:

```ts
// src/lib/data/customer.ts
export async function signout(countryCode: string) {
  "use server"
  await sdk.auth.logout()
  redirect(`/${countryCode}`)
}
```

`AccountNav` calls `signout(countryCode)` on logout button click. The action clears the JWT cookie and redirects to the store home.

## Key Patterns

### Auth Guard on Account Pages

Account pages that require auth (orders, profile, addresses) call `retrieveCustomer()` at the top of the page component. If the customer is null, they call `notFound()`. The `AccountLayout` parallel route switch handles the redirect to login for unauthenticated users at the layout level, but individual pages also guard for direct navigation.

### `AccountInfo` Disclosure Pattern

The `AccountInfo` component is a reusable shell. Each profile section:
1. Wraps form fields inside `<AccountInfo>`.
2. Uses `useActionState` with the appropriate server action.
3. Passes `isSuccess={successState}` and `isError={!!state.error}` to `AccountInfo`.
4. Uses `useEffect` to set `successState` when `state.success` changes.

This pattern decouples the form logic from the Disclosure UI, making it easy to add new profile sections.
