# Plan 02 — Header

## Objective

Style and refine the existing MedusaJS header (`src/modules/layout/templates/nav/index.tsx`) and its child components to match the visual quality of the reference frontend, **without adding new features, duplicating existing functionality, or breaking Medusa's architecture**.

**Current priority:** Implement the left-side navigation buttons/links that lead to pages in the header. Some styling work has already been completed (marked below). The remaining work is to add functional desktop nav links on the left side, ensure they work, then refine their styling.

The reference header (`ref/modern/Nextjsfrontend`) was researched thoroughly. It contains a cart **drawer**, search **megamenu overlay**, desktop **nav links with hover dropdowns**, and a full-screen mobile **drawer**. Our Medusa header uses a cart **dropdown**, a Popover-based mobile **SideMenu**, and has no search or desktop nav links. We will adapt the reference visual patterns into Medusa's existing structure using our global style system and Medusa UI tokens.

---

## Key Principles

1. **Designs and global styling first.** Before touching any component logic or adding features, apply global classes, tokens, and layout improvements to what already exists.
2. **Functionality first, styling second (for nav links).** Add the navigation links and ensure they render and navigate correctly before applying refined styling.
3. **Static/visual adaptations second.** Reference patterns that can be implemented purely with styling or existing Medusa components (no new files, no new data fetching) come next.
4. **New features third.** Anything requiring new components, new pages, or new data fetching only happens after the above are complete.
5. **No duplicates.** If Medusa already has a feature, we refine it — we do not create a second implementation.
6. **Respect Medusa architecture.** Keep server components server-side. Keep client components client-side. Do not add new npm packages.
7. **Adapt, don't copy.** The reference is a different stack. We take the visual pattern and implement it with Medusa's components and data layer.

---

## Completion Status

### Completed

| Item | File | Notes |
|---|---|---|
| Header container with `.navbar-surface` | `apps/storefront/src/modules/layout/templates/nav/index.tsx` | Applied |
| Brand link styling | `apps/storefront/src/modules/layout/templates/nav/index.tsx` | `text-xl-semi`-like classes, uppercase, tracking-tight |
| Cart button with `.btn.btn-icon` + `.badge` | `apps/storefront/src/modules/layout/components/cart-dropdown/index.tsx` | Applied |
| Account icon button with `.btn.btn-icon` | `apps/storefront/src/modules/layout/components/account-link/index.tsx` | Applied |
| Hamburger menu with icon button | `apps/storefront/src/modules/layout/components/side-menu/index.tsx` | Icon button applied |
| SideMenu items: Home, Store, Account, Cart | `apps/storefront/src/modules/layout/components/side-menu/index.tsx` | Active states implemented |
| Footer with full site map | `apps/storefront/src/modules/layout/templates/footer/index.tsx` | All links present |

### Remaining

| Item | File | Notes |
|---|---|---|
| Desktop left-side navigation links | `apps/storefront/src/modules/layout/templates/nav/index.tsx` | Handled in separate plan: [`02a-header-desktop-navlinks.md`](./02a-header-desktop-navlinks.md) |

---

## Reference Header Research Summary

### Reference Architecture

The reference header is a single client component (`StoreHeader`) with multiple child components:

| Component | Type | Purpose |
|---|---|---|
| `StoreHeader` | Client (`'use client'`) | Main header orchestrator, manages scroll state, search state, mobile menu state |
| `DesktopNavLinks` | Client | Desktop navigation: Home, Shop, Categories dropdown, Company dropdown, User menu dropdown, Seller Hub, Admin |
| `HeaderSearch` | Client | Desktop search input with autocomplete |
| `HeaderActions` | Client | Right-side actions: theme toggle, account icon, wishlist icon, cart icon, mobile search toggle, mobile menu toggle |
| `MobileNavDrawer` | Client | Full-screen mobile drawer with accordions for Categories, Company, Account/Orders, Wishlist, Track Order, Seller Hub, Admin |
| `CategoriesDropdown` | Client | Hover-based dropdown with category images, subcategories, item counts |
| `CompanyDropdown` | Client | Hover-based dropdown with About, Contact, FAQ |
| `UserMenuDropdown` | Client | Hover/click dropdown with Account, Order Tracking, Wishlist, Cart trigger, Seller Portal |
| `SearchMegamenuOverlay` | Client | Full-width overlay with popular search tags, search results grid, quick add to cart |
| `CartButton` | Client | Icon button that opens a cart **drawer** (not dropdown) |

### Reference Patterns We Can Adapt Without Adding Features

| Pattern | Reference Implementation | Medusa Adaptation | Requires New Feature? |
|---|---|---|---|
| Desktop nav links | `DesktopNavLinks` with pill-shaped `Link` components | Add left-side nav links in `nav/index.tsx` using `LocalizedClientLink` | No — existing routes |
| Icon-style account button | `User` icon in rounded-full button with active state | Already done in `account-link/index.tsx` | No — uses existing link |
| Cart badge styling | Icon + count badge with theme color | Already done in `CartDropdown` | No — existing cart |
| Active state styling | `isActive(path)` with theme colors | Use `usePathname()` in client `NavLink` wrapper | No — client component |
| Hover/focus micro-interactions | `hover:scale-105 active:scale-95`, `focus-visible:ring-2` | Add transition utilities via global classes | No — pure CSS |
| Brand prominence | Logo text + icon, `text-lg font-extrabold` | Already styled in `nav/index.tsx` | No — existing brand link |
| Mobile hamburger | Icon button, `lg:hidden` | Already done in `SideMenu` | No — existing SideMenu |
| Cart drawer → dropdown | Reference uses `cartOpen` state + drawer panel | Our `CartDropdown` is a Popover — style it to match reference visual quality | No — different mechanism, same visual goal |

### Reference Features That Are Out of Scope

| Feature | Why Out of Scope |
|---|---|
| **Cart drawer** | Reference uses a drawer (slides from right). Medusa uses a Popover dropdown. Converting to a drawer requires new component structure and state management. Out of scope unless explicitly requested. |
| **Search megamenu overlay** | Reference has a full search overlay with popular tags, results grid, and quick add to cart. Medusa handles search on `/store` via `RefinementList`. Adding header search requires a new modal/page or integration with existing search params. Create a separate plan if needed. |
| **Desktop nav dropdowns** | Reference has hover-based dropdowns for Categories, Company, and User menu. These require new client components and state management. We add plain nav links first; dropdowns can be a follow-up plan. |
| **Wishlist button** | No Medusa module for wishlists. Would require backend changes. |
| **Theme toggle** | No dark mode toggle in the storefront. `darkMode: "class"` is configured but not exposed to users. |
| **User avatar** | Reference shows user avatars in the header. Medusa does not fetch avatar URLs in the current customer schema. |
| **Lucide icons** | Reference uses `lucide-react`. Medusa uses `@medusajs/icons` and inline SVGs. Do not add new icon libraries. |
| **Mobile full-screen drawer** | Reference has a full-screen mobile drawer with accordions for Categories, Company, User menu. Medusa uses a Popover-based `SideMenu`. Converting to a drawer requires new component structure. Out of scope unless explicitly requested. |

---

## Stage 1 — Global and Design Foundation (Styling Only)

**Goal:** Apply global styling to the existing header structure. No new buttons, no new links, no new data fetching, no component creation. This is purely a styling pass using `globals.css` utilities and Medusa preset tokens.

### 1.1 Header Container

**Status:** Complete

**File:** `apps/storefront/src/modules/layout/templates/nav/index.tsx`

The `.navbar-surface` global class is already applied to the `<header>` element. This gives us:
- `background: var(--bg-base)` / `border-color: var(--border-base)` / `color: var(--fg-base)`
- Automatic dark mode switching via `.dark` on `<html>`

Subtle elevation via `shadow-elevation-card-rest` is already in place.

### 1.2 Brand Link

**Status:** Complete

**File:** `apps/storefront/src/modules/layout/templates/nav/index.tsx`

The `LocalizedClientLink` is already styled with `text-sm small:text-lg font-extrabold hover:text-ui-fg-base uppercase tracking-tight`.

### 1.3 Cart Button Styling

**Status:** Complete

**File:** `apps/storefront/src/modules/layout/components/cart-dropdown/index.tsx`

The cart trigger already uses `.btn.btn-icon.btn-ghost.rounded-full` classes. The count badge already uses `.badge.badge-new`.

### 1.4 SideMenu (Mobile Hamburger)

**Status:** Complete

**File:** `apps/storefront/src/modules/layout/components/side-menu/index.tsx`

The hamburger trigger is already an icon button with proper styling.

### 1.5 Dark Mode Variants

**Status:** Complete

All header classes already work with `darkMode: "class"`. Medusa preset tokens (`bg-ui-bg-base`, `text-ui-fg-base`, `border-ui-border-base`) and the `.navbar-surface` global class handle dark mode automatically.

---

## Stage 2 — Reference Adaptations Without New Features

**Goal:** Apply reference visual patterns using only existing Medusa components, existing data, and global classes. No new buttons, no new links, no new data fetching, no new files.

**Status:** Partially complete. Account icon button, cart badge, and hamburger are done. Remaining: desktop nav links (new feature — see new Stage below).

### 2.1 Account Link → Icon Button

**Status:** Complete

**File:** `apps/storefront/src/modules/layout/components/account-link/index.tsx`

Already uses `User` icon from `@medusajs/icons` with `.btn.btn-icon.btn-ghost.rounded-full.border.border-ui-border-base`.

### 2.2 Active State for Account/Cart Icons

**Status:** Complete

`CartDropdown` and `SideMenu` already use `usePathname()` for active-state highlighting.

### 2.3 Cart Count Badge

**Status:** Complete

The cart count badge already uses `.badge.badge-new` global classes.

### 2.4 Hover/Focus Micro-interactions

**Status:** Complete

Interactive elements already use `transition-all duration-150`, `hover:bg-ui-bg-base-hover`, `focus-visible:ring-2 focus-visible:ring-ui-fg-interactive`.

### 2.5 Spacing and Alignment

**Status:** Complete

Header height, icon button sizes, and gaps already use consistent Medusa spacing tokens.

---

## Stage 3 — Review and Refinement

**Goal:** Verify visual consistency, dark mode, and mobile behavior.

**Status:** Completed during Stages 1–2. Remaining work will be verified after desktop nav links are added.

### 3.1 Visual Audit

Check at all breakpoints:
- Desktop (`>= 1024px`): Brand center, actions right, no hamburger
- Tablet (`768px - 1023px`): Same as desktop
- Mobile (`< 768px`): Hamburger visible, desktop nav hidden

### 3.2 Dark Mode Audit

Toggle `.dark` on `<html>` and verify:
- Header background switches correctly
- Text color switches correctly
- Borders switch correctly
- Buttons/icons remain visible

### 3.3 Accessibility Audit

- All interactive elements have `focus-visible` styles
- Icon buttons have `aria-label` or `title` attributes
- Color contrast meets WCAG AA

---

## Desktop Navigation Links

The desktop left-side navigation links are tracked in a separate plan:

**[`02a-header-desktop-navlinks.md`](./02a-header-desktop-navlinks.md)**

That plan covers:
- Stage 1: Add plain functional desktop nav links between brand and right-side actions
- Stage 2: Add active states via `nav-link/index.tsx` client wrapper
- Stage 3: Refine pill styling, hover/focus transitions, and separators

---

## What We Do Not Change

- No new layout structure beyond the nav links container
- No new data fetching
- No new server actions
- No new npm packages
- No new CSS files
- No changes to `SideMenu` Popover behavior
- No changes to `CartDropdown` open/close logic
- No changes to account/cart routing
- No search, wishlist module, theme toggle, or other reference features not already present in the SideMenu/Footer

---

## Key Differences from Reference (Architectural)

These are **intentional** differences between our Medusa header and the reference. They are **not** bugs or missing features — they reflect different architectural choices.

| Aspect | Reference | Medusa | Reason |
|---|---|---|---|
| Desktop nav | Full nav links with hover dropdowns (Home, Shop, Categories, Company, User, Seller Hub, Admin) | We add plain pill links (Home, Shop, Categories, About, Contact, FAQ, Account, Wishlist, Track Order) | Hover dropdowns require new components; plain pills match existing SideMenu/Footer style |
| Cart interaction | Drawer (slides from right) | Popover dropdown | Medusa scaffold uses Popover; drawer requires new component |
| Search | Megamenu overlay with results grid | No header search; search on `/store` | Medusa handles search via `RefinementList` |
| Mobile menu | Full-screen drawer with accordions | Popover-based `SideMenu` | Medusa scaffold uses Popover |
| Wishlist | Icon button with badge | Link in nav + icon in SideMenu | No separate header wishlist icon yet |
| Theme toggle | Icon button | Not exposed | `darkMode: "class"` configured but no UI toggle |
| User avatar | Shown in header/account button | Not fetched | Medusa customer schema doesn't include avatar URLs |
| State management | React contexts (cart, auth, wishlist, UI) | Server components + SDK | Medusa uses RSC + server actions |

---

## Verification Checklist

- [ ] `pnpm exec tsc --noEmit` — 0 errors
- [ ] `pnpm run lint` — no new errors
- [ ] Dev server compiles without errors
- [ ] Desktop nav links appear at `>= 1024px` between brand and actions
- [ ] Each nav link navigates to the correct page
- [ ] Mobile layout is unaffected — no nav links visible on mobile
- [ ] Active nav pill is highlighted on the current page
- [ ] Cart dropdown opens and shows correct count
- [ ] Account icon button links to `/account`
- [ ] Brand link links to `/`
- [ ] No new npm packages added
- [ ] No new CSS files created
- [ ] All links use `LocalizedClientLink` or `NavLink` wrapper

---

## Out of Scope

- Desktop dropdown navigation (Categories, Company, User menu dropdowns)
- Cart drawer replacement (Medusa uses dropdown)
- Header search / search megamenu
- Wishlist icon button in header
- Theme toggle
- User avatar in header
- Mobile full-screen drawer
- Mega menu / dropdown navigation
- Announcement bar
- Seller Hub / Admin links (role-guarded — add later if needed)

## Ignored Reference Features

The reference header includes features that are **not** part of this plan:

- **Desktop nav dropdowns** — Reference has hover-based dropdowns for Categories, Company, and User menu. These require new client components and state management. We add plain nav links first; dropdowns can be a follow-up plan.
- **Cart drawer** — Reference uses a drawer (slides from right). Medusa uses a Popover dropdown. Converting requires new component structure. Out of scope.
- **Search megamenu overlay** — Reference has a full search overlay with popular tags, results grid, quick add to cart. Medusa handles search on `/store` via `RefinementList`. Adding header search requires a new modal/page. Out of scope.
- **Wishlist button** — No Medusa wishlist module exists. Would require backend changes.
- **Theme toggle** — Reference has a dark/light mode toggle. Medusa's storefront does not expose dark mode to users. Out of scope.
- **User avatar** — Reference shows user avatars in the header. Medusa does not fetch avatar URLs in the current customer schema. Out of scope.
- **Mobile full-screen drawer** — Reference has a full-screen mobile drawer with accordions. Medusa uses a Popover-based `SideMenu`. Converting requires new component structure. Out of scope.
- **Lucide icons** — Reference uses `lucide-react`. Medusa uses `@medusajs/icons` and inline SVGs. Do not add new icon libraries.

**Rule:** If a reference header feature is not in Medusa's scaffold, document it here as "ignored" and ask the user whether to proceed before implementing.
