# Plan 03 — Footer

## Objective

Adapt the reference frontend's footer patterns to the MedusaJS storefront's existing `Footer` component in `src/modules/layout/templates/footer/`. The goal is to align the footer's structure, content sections, and styling with the reference design, while preserving Medusa's data-fetching architecture and avoiding any backend changes.

This plan is storefront-only. Backend remains untouched.

---

## Current State Analysis

### MedusaJS Footer (`src/modules/layout/templates/footer/index.tsx`)

- **Type**: Async server component by default
- **Data fetching**: Previously used `Promise.all` with `listCollections({ fields: "*products" })` and `listCategories()`
- **Renders**:
  - Top-level categories (skips entries with `parent_category`)
  - Up to 6 collections
  - GitHub/Docs/Source links
  - `MedusaCTA` line ("Powered by Medusa & Next.js")

### Reference Footer Patterns

The reference frontend (`ref/modern/Nextjsfrontend/frontend/src/@modules/layout/templates/footer/index.tsx`) uses:
- Multi-column footer with: brand/logo, navigation links, contact info, social links, newsletter signup
- Consistent spacing and typography
- Theme-driven accent colors for headings
- Dark mode support
- Bottom bar with copyright and legal links
- Responsive: stacks columns on mobile
- Column titles with bottom border dividers
- Links with hover transitions
- Border around the links grid card
- Divider above the bottom bar

### Gap Analysis

| Need | MedusaJS Current State | Gap |
|---|---|---|
| Multi-column layout | Single-column category/collection list | Need to restructure into columns |
| Brand/logo section | None — only `MedusaCTA` | Need to add brand block with description |
| Navigation columns | Flat list of categories | Need to group into columns (e.g., Shop, Account, Company) |
| Social links | None | **Ignored** — would require static data or backend integration |
| Newsletter signup | None | **Ignored** — would require backend email integration |
| Contact info | None | **Ignored** — static content, but out of scope unless user asks |
| Bottom bar | `MedusaCTA` only | Need to add copyright + legal links |
| Theme styling | Minimal — uses default Medusa tokens | Need to align with reference's visual hierarchy |
| Dark mode | Not explicitly styled | Need `dark:` variants |
| Column title dividers | None | Add `border-b` under column titles |
| Links grid border | None | Add border around the links grid |
| Bottom bar divider | None | Add `border-t` above copyright section |

---

## Strategic Approach

**Do NOT replace the footer with a copy of the reference.** Instead:

1. **Enhance the existing `Footer` template** — Restructure the layout into columns while keeping the existing data fetching.
2. **Use static link groups** — Since the footer now uses static pages, use `LocalizedClientLink` for all internal links.
3. **Theme tokens only** — Use `@medusajs/ui-preset` tokens for all styling.
4. **Preserve `MedusaCTA`** — Keep the existing attribution in the bottom bar.
5. **Match reference styling** — Apply borders, dividers, spacing, and hover transitions from the reference design.

---

## Step 1 — Footer Container

### 1.1 Update root element styling

**File**: `apps/storefront/src/modules/layout/templates/footer/index.tsx`

Enhance the footer container with:
- Border top (`border-t border-ui-border-base`)
- Padding (`pt-12 pb-10`)
- Typography (`text-ui-fg-subtle`)

The `footer-surface` class in `globals.css` already provides:
- Background (`bg-ui-bg-subtle`)
- Border top (`border-top: 1px solid var(--border-base)`)
- Color (`color: var(--fg-base)`)

**Why**: The reference uses a distinct footer background, border, and generous padding. Medusa's current footer is minimal.

---

## Step 2 — Footer Columns

### 2.1 Restructure into columns

**File**: `apps/storefront/src/modules/layout/templates/footer/index.tsx`

Replace the current flat list with a grid:
```
[Shopping] [User] [Company] [Policies]
```

Where:
- **Shopping**: Home (`/`), Shop (`/store`), Categories (`/categories`)
- **User**: Account (`/account`), Cart (`/cart`), Wishlist (`/wishlist`), Track Order (`/track-order`)
- **Company**: About Us (`/about`), Contact Us (`/contact`), FAQ (`/faq`)
- **Policies**: Terms and Conditions (`/terms`), Returns Policy (`/returns`), Privacy Policy (`/privacy`), Seller Policy (`/seller-policy`)

**Why**: The reference uses a multi-column layout. This is a common footer pattern that improves navigation and SEO.

### 2.2 Column title styling

Each column title has:
- `txt-small-plus txt-ui-fg-base` for the text
- `border-b border-ui-border-base pb-2` for the divider line

### 2.3 Link styling

Each link has:
- `text-ui-fg-subtle txt-small` for the text
- `hover:text-ui-fg-base transition block py-0.5` for hover effect

---

## Step 3 — Bottom Bar

### 3.1 Add divider and copyright

**File**: `apps/storefront/src/modules/layout/templates/footer/index.tsx`

Add a bottom bar below the main columns:
- Divider: `border-t border-ui-border-base pt-8`
- Copyright text: `© {year} Medusa Store. All rights reserved.`
- `MedusaCTA` component (keep existing)

**Why**: The reference has a bottom bar with a divider above copyright. This is standard ecommerce footer pattern.

---

## Step 4 — Theme and Dark Mode

### 4.1 Apply theme tokens

Use Medusa UI Preset tokens:
- `text-ui-fg-subtle` for body text
- `text-ui-fg-base` for headings and hover states
- `border-ui-border-base` for dividers and borders
- `footer-surface` for the footer background

### 4.2 Dark mode

All footer elements use Medusa UI tokens which automatically switch via CSS variables:
- Background: `footer-surface` → uses `var(--bg-subtle)`
- Text: `text-ui-fg-subtle` → uses `var(--fg-subtle)`
- Borders: `border-ui-border-base` → uses `var(--border-base)`

---

## Step 5 — Responsive Behavior

### 5.1 Column stacking

Use Tailwind responsive utilities:
- Desktop: `grid-cols-4`
- Tablet/mobile: `grid-cols-2`

### 5.2 Bottom bar

Stack copyright and MedusaCTA on mobile:
- `flex flex-col sm:flex-row items-center justify-between gap-4`

---

## Step 6 — Verification

After implementing this plan:

1. **TypeScript**: `cd apps/storefront && pnpm exec tsc --noEmit` — 0 errors
2. **Lint**: `cd apps/storefront && pnpm run lint` — no new errors introduced
3. **Runtime**: `pnpm run dev` — footer renders correctly at all breakpoints
4. **Dark mode**: Toggle `.dark` on `<html>` — footer renders correctly in dark mode
5. **Links**: Click footer links — they navigate correctly (or 404 if page doesn't exist yet)

---

## Files Changed

| File | Change |
|---|---|
| `apps/storefront/src/modules/layout/templates/footer/index.tsx` | Restructure into 4 columns, add dividers, add bottom bar with divider |
| `knowledgebase/site-structure/header-footer.md` | Update footer architecture docs |

---

## Out of Scope for This Plan

- Social media links/buttons — ignored by default
- Newsletter signup form — ignored by default
- Contact info section — ignored by default
- About/Contact/Policy pages — separate static-feature plans
- Backend content management — ignored by default

## Ignored Features

The following are intentionally **not** part of this plan and should not be added unless the user explicitly requests them:

- **Social media links/buttons** — the reference may include Instagram, Twitter, etc. These require static URLs or backend integration. Out of scope.
- **Newsletter signup form** — requires backend email integration or a third-party service. Out of scope.
- **Contact information section** — address, phone, email. Static content, but out of scope unless user asks.
- **About/Contact/Privacy/Terms pages** — creating these static pages is separate work. The footer can link to them once they exist.
- **Footer theme switcher** — if the reference has a theme toggle in the footer, ignore it. The site uses `darkMode: "class"` with no toggle.
- **Backend content management** — if the reference allows editing footer content in an admin panel, that requires backend modules and is out of scope.
- **New npm dependencies for icons/social widgets** — use existing `@medusajs/icons` or inline SVGs only.

**Rule:** If a reference footer feature requires any of the above, document it here as "ignored" and ask the user whether to proceed before implementing.
### MedusaJS Footer (`src/modules/layout/templates/footer/index.tsx`)

- **Type**: Async server component by default
- **Data fetching**: `Promise.all` with `listCollections({ fields: "*products" })` and `listCategories()`
- **Renders**:
  - Top-level categories (skips entries with `parent_category`)
  - Up to 6 collections
  - GitHub/Docs/Source links
  - `MedusaCTA` line ("Powered by Medusa & Next.js")

### Reference Footer Patterns

The reference frontend uses:
- Multi-column footer with: brand/logo, navigation links, contact info, social links, newsletter signup
- Consistent spacing and typography
- Theme-driven accent colors for headings
- Dark mode support
- Bottom bar with copyright and legal links
- Responsive: stacks columns on mobile

### Gap Analysis

| Need | MedusaJS Current State | Gap |
|---|---|---|
| Multi-column layout | Single-column category/collection list | Need to restructure into columns |
| Brand/logo section | None — only `MedusaCTA` | Need to add brand block with description |
| Navigation columns | Flat list of categories | Need to group into columns (e.g., Shop, Account, Company) |
| Social links | None | **Ignored** — would require static data or backend integration |
| Newsletter signup | None | **Ignored** — would require backend email integration |
| Contact info | None | **Ignored** — static content, but out of scope unless user asks |
| Bottom bar | `MedusaCTA` only | Need to add copyright + legal links |
| Theme styling | Minimal — uses default Medusa tokens | Need to align with reference's visual hierarchy |
| Dark mode | Not explicitly styled | Need `dark:` variants |

---

## Strategic Approach

**Do NOT replace the footer with a copy of the reference.** Instead:

1. **Enhance the existing `Footer` template** — Restructure the layout into columns while keeping the existing data fetching.
2. **Use existing Medusa data** — Categories and collections are already fetched. Add static link groups for Account, Company, etc.
3. **Theme tokens only** — Use `@medusajs/ui-preset` tokens and the `theme.*` scale from Plan 01.
4. **Static content for non-Medusa sections** — Use static arrays in `src/lib/constants.tsx` for navigation groups that don't map to Medusa entities.
5. **Preserve `MedusaCTA`** — Keep the existing attribution, but place it in a bottom bar alongside copyright and legal links.

---

## Step 1 — Footer Container

### 1.1 Update root element styling

**File**: `apps/storefront/src/modules/layout/templates/footer/index.tsx`

Enhance the footer container with:
- Background (`bg-ui-bg-subtle dark:bg-ui-bg-subtle`)
- Border (`border-t border-ui-border-base`)
- Padding (`py-12 sm:py-16`)
- Typography (`text-ui-fg-subtle`)

**Why**: The reference uses a distinct footer background and generous padding. Medusa's current footer is minimal.

---

## Step 2 — Footer Columns

### 2.1 Restructure into columns

**File**: `apps/storefront/src/modules/layout/templates/footer/index.tsx`

Replace the current flat list with a grid:
```
[Brand/Logo] [Shop Links] [Account Links] [Company Info]
```

Where:
- **Brand/Logo**: Store name, short description, social icons (if desired)
- **Shop Links**: Categories (from `listCategories()`), Collections (from `listCollections()`)
- **Account Links**: Static links — `/account`, `/account/orders`, `/account/addresses`
- **Company Info**: Static links — About, Contact, Privacy Policy, Terms

**Why**: The reference uses a multi-column layout. This is a common footer pattern that improves navigation and SEO.

### 2.2 Add static link groups

**File**: `apps/storefront/src/lib/constants.tsx` (or create if missing)

Add static navigation groups:
```tsx
export const FOOTER_ACCOUNT_LINKS = [
  { href: "/account", label: "My Account" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
]

export const FOOTER_COMPANY_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
]
```

**Why**: These links don't map to Medusa entities. They're static site navigation.

**Note**: The `/about`, `/contact`, `/privacy-policy`, and `/terms-and-conditions` pages don't exist yet. Creating them is a separate static-feature task. For now, the links can be placeholders or point to existing pages.

---

## Step 3 — Brand Section

### 3.1 Add brand block

**File**: `apps/storefront/src/modules/layout/templates/footer/index.tsx`

Add a brand/logo block in the first column:
- Store name (from `sdk.store.retrieve()` or static)
- Short description (static string or from store metadata)
- Theme accent color for the store name

**Why**: The reference has a prominent brand section in the footer. This reinforces brand identity and provides a second navigation entry point.

### 3.2 Brand data source

**Option A — Static**: Use a hardcoded store name and description in `constants.tsx`.
**Option B — Dynamic**: Fetch store metadata via `sdk.store.retrieve()` in the footer template.

**Recommendation**: Use static for now. If the store name/description needs to be editable in Medusa admin, that requires a backend feature and is out of scope.

---

## Step 4 — Bottom Bar

### 4.1 Add copyright and legal links

**File**: `apps/storefront/src/modules/layout/templates/footer/index.tsx`

Add a bottom bar below the main columns:
- Copyright text: `© {year} {store name}. All rights reserved.`
- Legal links: Privacy Policy, Terms & Conditions
- `MedusaCTA` component (keep existing)

**Why**: The reference has a bottom bar with copyright and legal links. This is standard ecommerce footer pattern.

### 4.2 Year calculation

Use `new Date().getFullYear()` for the copyright year. This can be done in the server component.

---

## Step 5 — Theme and Dark Mode

### 5.1 Apply theme tokens

Use Plan 01 tokens:
- `theme.*` colors for headings and links
- `text-ui-fg-subtle` for body text
- `border-ui-border-base` for dividers
- `bg-ui-bg-subtle` for the footer background

### 5.2 Dark mode

All footer elements must include `dark:` variants:
- Background: `bg-ui-bg-subtle dark:bg-ui-bg-subtle`
- Text: `text-ui-fg-subtle dark:text-ui-fg-subtle`
- Links: `text-ui-fg-interactive dark:text-ui-fg-interactive`
- Borders: `border-ui-border-base dark:border-ui-border-base`

---

## Step 6 — Responsive Behavior

### 6.1 Column stacking

Use Tailwind responsive utilities:
- Desktop: `grid grid-cols-4 gap-8`
- Tablet: `grid-cols-2 gap-6`
- Mobile: `grid-cols-1 gap-8`

### 6.2 Bottom bar

Stack copyright and legal links on mobile:
- Desktop: `flex justify-between items-center`
- Mobile: `flex flex-col items-center gap-2`

---

## Step 7 — MedusaCTA Placement

### 7.1 Move MedusaCTA to bottom bar

**File**: `apps/storefront/src/modules/layout/templates/footer/index.tsx`

Move the `MedusaCTA` from the main footer content to the bottom bar alongside copyright and legal links.

**Why**: The reference separates main footer content from attribution. This is a cleaner layout.

---

## Verification

After implementing this plan:

1. **TypeScript**: `cd apps/storefront && pnpm exec tsc --noEmit` — 0 errors
2. **Lint**: `cd apps/storefront && pnpm run lint` — no new errors
3. **Build**: `cd apps/storefront && pnpm run build` — succeeds
4. **Runtime**: `pnpm run dev` — footer renders correctly at all breakpoints
5. **Dark mode**: Toggle `.dark` on `<html>` — footer renders correctly in dark mode
6. **Links**: Click footer links — they navigate correctly (or 404 if page doesn't exist yet)
7. **Data**: Verify categories and collections are fetched and rendered correctly

---

## Files Changed

| File | Change |
|---|---|
| `apps/storefront/src/modules/layout/templates/footer/index.tsx` | Restructure into columns, add brand section, bottom bar |
| `apps/storefront/src/lib/constants.tsx` | **NEW** — static footer link groups |
| `knowledgebase/site-structure/components.md` | Update footer component docs |
| `knowledgebase/customizations/rules.md` | Add footer-specific rules if needed |
| `knowledgebase/customizations/instructions.md` | Add footer implementation guidance |

---

## Out of Scope for This Plan

- Social media links/buttons — ignored by default
- Newsletter signup form — ignored by default
- Contact info section — ignored by default
- About/Contact/Policy pages — separate static-feature plans
- Backend content management — ignored by default

## Ignored Features

The following are intentionally **not** part of this plan and should not be added unless the user explicitly requests them:

- **Social media links/buttons** — the reference may include Instagram, Twitter, etc. These require static URLs or backend integration. Out of scope.
- **Newsletter signup form** — requires backend email integration or a third-party service. Out of scope.
- **Contact information section** — address, phone, email. Static content, but out of scope unless user asks.
- **About/Contact/Privacy/Terms pages** — creating these static pages is separate work. The footer can link to them once they exist.
- **Footer theme switcher** — if the reference has a theme toggle in the footer, ignore it. The site uses `darkMode: "class"` with no toggle.
- **Backend content management** — if the reference allows editing footer content in an admin panel, that requires backend modules and is out of scope.
- **New npm dependencies for icons/social widgets** — use existing `@medusajs/icons` or inline SVGs only.

**Rule:** If a reference footer feature requires any of the above, document it here as "ignored" and ask the user whether to proceed before implementing.
