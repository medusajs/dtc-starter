# Plan 02a — Header Desktop Navigation Links

## Objective

Add functional navigation links on the left side of the desktop header, between the brand and the right-side actions. Ensure they work first, then refine styling to match the existing SideMenu and Footer patterns.

This plan covers only the desktop left-side navigation links. For the overall header styling and other header components, see [`02-header.md`](./02-header.md).

---

## Key Principles

1. **Functionality first, styling second.** Add the navigation links and ensure they render and navigate correctly before applying refined styling.
2. **Copy patterns from existing working components.** The `SideMenu` and `Footer` already demonstrate the correct Medusa patterns for internal links, active states, and spacing. Use them as the style reference.
3. **No duplicates.** Reuse existing components and routing. Do not create a second navigation system.
4. **Respect Medusa architecture.** Keep server components server-side. Keep client components client-side. Do not add new npm packages.
5. **Adapt, don't copy.** The reference is a different stack. We take the structural pattern and implement it with Medusa's components and data layer.

---

## Implementation Order

**Step 1 — Add the desktop nav links (functionality first).** Render the links in `nav/index.tsx` between the brand and the right-side actions. Use `LocalizedClientLink` for each page route. Ensure navigation works at all breakpoints (`hidden lg:flex`).

**Step 2 — Verify navigation works.** Run the dev server and confirm each link navigates to the correct page. Confirm mobile layout is unaffected.

**Step 3 — Apply active states.** Use `usePathname()` in a small client wrapper to highlight the active nav pill.

**Step 4 — Apply refined styling.** Apply the pill shape, hover/focus transitions, and active-state colors matching the SideMenu pattern.

---

## Stage 1 — Add Desktop Navigation Links

**Goal:** Add functional left-side navigation links to the header. No styling refinement yet — just plain links that work.

### 1.1 Identify the insertion point

**File:** `apps/storefront/src/modules/layout/templates/nav/index.tsx`

The current nav layout is:

```tsx
<nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-12 small:h-14 text-small-regular">
  <div className="flex-1 basis-0 flex items-center">
    <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
  </div>

  <div className="flex items-center h-full">
    <LocalizedClientLink href="/" ...>Medusa Store</LocalizedClientLink>
  </div>

  <div className="flex items-center gap-x-6 flex-1 basis-0 justify-end">
    <div className="hidden small:flex items-center gap-x-6">
      <AccountLink />
    </div>
    <Suspense ...><CartButton /></Suspense>
  </div>
</nav>
```

The new desktop nav links go between the brand and the right-side actions, inside a `hidden lg:flex` wrapper:

```tsx
<div className="hidden lg:flex items-center gap-x-1 lg:gap-x-1.5 flex-1 basis-0 justify-center">
  <LocalizedClientLink href="/" className="...">Home</LocalizedClientLink>
  <LocalizedClientLink href="/store" className="...">Shop</LocalizedClientLink>
  <LocalizedClientLink href="/categories" className="...">Categories</LocalizedClientLink>
  ...
</div>
```

### 1.2 Define the navigation items

The navigation items mirror the existing `SideMenuItems` in `side-menu/index.tsx` and the footer links in `footer/index.tsx`:

| Label | Href | Notes |
|---|---|---|
| Home | `/` | Always visible |
| Shop | `/store` | Always visible |
| Categories | `/categories` | Always visible |
| About | `/about` | Company section |
| Contact | `/contact` | Company section |
| FAQ | `/faq` | Company section |
| Account | `/account` | User section |
| Wishlist | `/wishlist` | User section |
| Track Order | `/track-order` | User section |

These are the same routes already present in the SideMenu and Footer. No new pages are introduced.

### 1.3 Group into sections with separators

Match the reference's grouping pattern. Use subtle separators between groups:

```tsx
<nav className="hidden lg:flex items-center gap-x-1 lg:gap-x-1.5 flex-1 basis-0 justify-center">
  {/* Shop group */}
  <LocalizedClientLink href="/">Home</LocalizedClientLink>
  <LocalizedClientLink href="/store">Shop</LocalizedClientLink>
  <LocalizedClientLink href="/categories">Categories</LocalizedClientLink>

  {/* Separator */}
  <span className="w-px h-4 bg-ui-border-base mx-1" />

  {/* Company group */}
  <LocalizedClientLink href="/about">About</LocalizedClientLink>
  <LocalizedClientLink href="/contact">Contact</LocalizedClientLink>
  <LocalizedClientLink href="/faq">FAQ</LocalizedClientLink>

  {/* Separator */}
  <span className="w-px h-4 bg-ui-border-base mx-1" />

  {/* Account group */}
  <LocalizedClientLink href="/account">Account</LocalizedClientLink>
  <LocalizedClientLink href="/wishlist">Wishlist</LocalizedClientLink>
  <LocalizedClientLink href="/track-order">Track Order</LocalizedClientLink>
</nav>
```

### 1.4 Files to modify in Stage 1

| File | Change |
|---|---|
| `apps/storefront/src/modules/layout/templates/nav/index.tsx` | Add desktop nav links between brand and right-side actions |

**No new files in Stage 1.**

---

## Stage 2 — Add Active States

**Goal:** Highlight the currently active navigation pill using `usePathname()`.

### 2.1 Create a small client wrapper

Since `nav/index.tsx` is a server component, create a client sub-component that wraps `LocalizedClientLink` with active-state logic:

**File:** `apps/storefront/src/modules/layout/components/nav-link/index.tsx`

```tsx
"use client"

import { usePathname } from "next/navigation"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type NavLinkProps = {
  href: string
  children: React.ReactNode
}

const NavLink = ({ href, children }: NavLinkProps) => {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))

  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-150",
        isActive
          ? "bg-theme-lighter text-white font-bold dark:bg-blue-950/60 dark:text-blue-400"
          : "text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover"
      )}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default NavLink
```

### 2.2 Wire into `nav/index.tsx`

Import `NavLink` and replace the plain `LocalizedClientLink` nav items:

```tsx
import NavLink from "@modules/layout/components/nav-link"

// In JSX:
<NavLink href="/">Home</NavLink>
<NavLink href="/store">Shop</NavLink>
...
```

### 2.3 Files to modify in Stage 2

| File | Change |
|---|---|
| `apps/storefront/src/modules/layout/components/nav-link/index.tsx` | New file — client wrapper with `usePathname()` active state |
| `apps/storefront/src/modules/layout/templates/nav/index.tsx` | Replace plain links with `NavLink` |

---

## Stage 3 — Refine Styling

**Goal:** Apply the reference's pill styling, hover/focus micro-interactions, and spacing to match the existing SideMenu pattern.

### 3.1 Pill shape and spacing

Apply to each `NavLink`:

- `rounded-full` — pill shape
- `px-3 py-1.5` — compact padding
- `text-sm font-semibold` — label weight
- `gap-x-1` or `gap-x-1.5` between pills — tight spacing matching reference

### 3.2 Hover/focus states

Apply to each `NavLink`:

- Default: `text-ui-fg-subtle`
- Hover: `hover:text-ui-fg-base hover:bg-ui-bg-base-hover`
- Focus visible: `focus-visible:ring-2 focus-visible:ring-ui-fg-interactive`
- Active: `bg-theme-lighter text-white font-bold dark:bg-blue-950/60 dark:text-blue-400`
- Transition: `transition-all duration-150`

### 3.3 Separator styling

Use the existing Medusa border token:

```tsx
<span className="w-px h-4 bg-ui-border-base mx-1" aria-hidden="true" />
```

### 3.4 Files modified in Stage 3

| File | Change |
|---|---|
| `apps/storefront/src/modules/layout/components/nav-link/index.tsx` | Refine className with full pill styling |
| `apps/storefront/src/modules/layout/templates/nav/index.tsx` | Ensure separators and layout spacing match reference |

---

## Files to Modify

| File | Change | Stage |
|---|---|---|
| `apps/storefront/src/modules/layout/templates/nav/index.tsx` | Add desktop nav links between brand and right-side actions | 1 |
| `apps/storefront/src/modules/layout/components/nav-link/index.tsx` | New file — client wrapper with `usePathname()` active state | 2 |
| `apps/storefront/src/modules/layout/components/nav-link/index.tsx` | Refine className with full pill styling | 3 |
| `apps/storefront/src/modules/layout/templates/nav/index.tsx` | Replace plain links with `NavLink`, ensure separators | 2 + 3 |

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
