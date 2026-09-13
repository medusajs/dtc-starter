# Header and Footer Architecture

## Overview

The header and footer are the two persistent chrome components of the Medusa DTC storefront. Both are rendered by the main layout and are built from a mix of **server components** (data fetching) and **client components** (interactivity). This document explains how they work and how to extend them while respecting Medusa’s architecture.

---

## Header (Nav)

### File Locations

| Purpose | Path |
|---|---|
| Template | `apps/storefront/src/modules/layout/templates/nav/index.tsx` |
| Hamburger menu | `apps/storefront/src/modules/layout/components/side-menu/index.tsx` |
| Cart button bridge | `apps/storefront/src/modules/layout/components/cart-button/index.tsx` |
| Cart dropdown | `apps/storefront/src/modules/layout/components/cart-dropdown/index.tsx` |
| Country selector | `apps/storefront/src/modules/layout/components/country-select/index.tsx` |
| Language selector | `apps/storefront/src/modules/layout/components/language-select/index.tsx` |
| Shared link helper | `apps/storefront/src/modules/common/components/localized-client-link/index.tsx` |

### Component Type

`nav/index.tsx` is an **async server component**. It fetches `listRegions()`, `listLocales()`, and `getLocale()` on the server, then passes those values as props to the client-side `SideMenu`. The cart path follows the same server→client bridge pattern: `CartButton` (server) fetches the cart and renders `CartDropdown` (client).

### Rendered Structure

```
<div class="sticky top-2 ...">          ← outer sticky wrapper
  <header class="navbar-surface ...">   ← visual surface
    <nav class="flex items-center ..."> ← flex row
      <!-- LEFT: SideMenu (hamburger, mobile nav, language + country) -->
      <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />

      <!-- CENTER: Brand link -->
      <LocalizedClientLink href="/">Medusa Store</LocalizedClientLink>

<!-- RIGHT: Account icon (desktop only) -->
      <div class="hidden small:flex items-center gap-x-6">
        <LocalizedClientLink href="/account" class="inline-flex items-center justify-center w-8 h-8 rounded-full border border-ui-border-base text-ui-fg-subtle transition-all duration-150 hover:text-ui-fg-base hover:bg-ui-bg-base-hover">
          [user SVG icon]
        </LocalizedClientLink>
      </div>

      <!-- RIGHT: Cart with Suspense fallback -->
      <Suspense fallback="Cart (0)">
        <CartButton />
      </Suspense>
    </nav>
  </header>
</div>
```

### Key Behaviors

- **Sticky positioning**: The outer wrapper uses `sticky top-2 small:top-3.5` so the header floats as the user scrolls.
- **Pointer-events pattern**: The outer div uses `pointer-events-none`; the header uses `pointer-events-auto`. This lets clicks pass through to sticky-positioned content beneath.
- **Cart bridge**: `CartButton` is an async server component that calls `retrieveCart()`. It renders `CartDropdown` with the cart as a prop. A `<Suspense>` boundary in Nav renders a static fallback while the cart resolves.
- **SideMenu (client)**: Uses `@headlessui/react` `<Popover>`. The hamburger button is an icon button; the panel slides in from the left with a backdrop overlay. It contains the main nav links plus language and country selectors.
- **LocalizedClientLink**: Wraps `next/link` and automatically prepends `/${countryCode}`. All internal links in the header should use this component.

### Adding a Header Link or Icon Button

The header is intentionally minimal. If you need to add a new link or icon:

1. **For internal links**, use `<LocalizedClientLink>` so the `countryCode` prefix is preserved.
2. **For icon buttons**, use inline Tailwind utilities — `inline-flex items-center justify-center w-8 h-8 rounded-full border border-ui-border-base text-ui-fg-subtle transition-all duration-150 hover:text-ui-fg-base hover:bg-ui-bg-base-hover`. All three header icon buttons (menu, cart, account) are consistently `w-8 h-8` (32px). Do not create a `.btn-icon` CSS class; use Tailwind utilities directly.
3. **For data that requires server-side fetching**, add the fetch in `nav/index.tsx` and pass the result as a prop to the child component.
4. **Do not** add a separate header-actions or account-dropdown component in the DTC starter; that pattern was removed. If you need an account dropdown, create a new client component in `modules/layout/components/` and wire it from Nav.

### Active State Pattern

When a dropdown or panel is open, apply active styling to the trigger button. The current convention uses inline Tailwind utilities with Medusa UI tokens:

```tsx
className={clx(
  "inline-flex items-center justify-center w-8 h-8 rounded-full border border-ui-border-base ...",
  open && "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
)}
```

All three header icon buttons (menu, cart, account) use `w-8 h-8` for consistent sizing. No `.btn-icon` class is used — styling is entirely inline Tailwind utilities + Medusa preset tokens.

---

## Footer

### File Locations

| Purpose | Path |
|---|---|
| Template | `apps/storefront/src/modules/layout/templates/footer/index.tsx` |
| Medusa CTA | `apps/storefront/src/modules/layout/components/medusa-cta/index.tsx` |

### Component Type

`footer/index.tsx` is an **async server component**. It fetches `listCollections({ fields: "*products" })` and `listCategories()` on the server, then renders the links inline.

### Rendered Structure

```
<footer class="footer-surface w-full">
  <div class="content-container flex flex-col w-full">
    <!-- Main footer area -->
    <div class="flex flex-col gap-y-6 xsmall:flex-row ...">
      <!-- Brand -->
      <LocalizedClientLink href="/">Medusa Store</LocalizedClientLink>

      <!-- Links grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-x-16">

        <!-- Categories column (if categories exist) -->
        <div>
          <span>Categories</span>
          <ul>
            <!-- up to 6 top-level categories, skipping parent_category -->
            <li>
              <LocalizedClientLink href={`/categories/${c.handle}`}>{c.name}</LocalizedClientLink>
              <!-- If category has children, nested <ul> with child links -->
            </li>
          </ul>
        </div>

        <!-- Collections column (if collections exist) -->
        <div>
          <span>Collections</span>
          <ul class="grid-cols-1 or grid-cols-2 if >3 collections">
            {collections.slice(0, 6).map(c => (
              <li><LocalizedClientLink href={`/collections/${c.handle}`}>{c.title}</LocalizedClientLink></li>
            ))}
          </ul>
        </div>

        <!-- Medusa links column (always rendered) -->
        <div>
          <span>Medusa</span>
          <ul>
            <li><a href="https://github.com/medusajs">GitHub</a></li>
            <li><a href="https://docs.medusajs.com">Documentation</a></li>
            <li><a href="https://github.com/medusajs/dtc-starter">Source code</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="flex w-full mb-16 justify-between text-ui-fg-muted">
      <Text>© {year} Medusa Store. All rights reserved.</Text>
      <MedusaCTA />
    </div>
  </div>
</footer>
```

### Key Behaviors

- **Data fetching**: The footer fetches `listCollections()` and `listCategories()` on the server. There is no client-side data fetching.
- **Category hierarchy**: Categories that have a `parent_category` are skipped at the top level; their children are rendered as nested links under the parent.
- **Slicing**: Only the first 6 categories and first 6 collections are shown.
- **External links**: The Medusa column uses plain `<a>` tags for external URLs (GitHub, docs, source). Internal links use `<LocalizedClientLink>`.
- **Test IDs**: `data-testid="footer-categories"` and `data-testid="category-link"` are present on category elements.

### Adding a Footer Column or Link

The footer currently has three columns: Categories, Collections, and Medusa. To add a new column:

1. **Open** `apps/storefront/src/modules/layout/templates/footer/index.tsx`.
2. **Add a new `<div>`** inside the links grid (`grid grid-cols-2 sm:grid-cols-3 ...`).
3. **For internal links**, use `<LocalizedClientLink href="/path">`.
4. **For external links**, use `<a href="https://...">`.
5. **If the column needs server data**, add the fetch at the top of the async footer component alongside `listCollections()` and `listCategories()`.
6. **Do not** create a separate `footer-menu` component — the DTC starter inlines footer links directly in the template.

### Adding a New Policy/Content Link to the Footer

For static policy pages (About, Contact, Terms, Privacy, Returns, Seller Policy, FAQ):

1. **Create the page** under `app/[countryCode]/(main)/<page-name>/page.tsx` so it inherits the main layout with Nav and Footer.
2. **Add a link** in the footer template using `<LocalizedClientLink href="/<page-name>">Page Title</LocalizedClientLink>`.
3. **If you want the link in a new column**, add a new `<div>` inside the footer grid with a title and a `<ul>` of links.

### Adding a New Column Title

Column titles in the footer are simple `<span>` elements above a `<ul>`:

```tsx
<div>
  <span className="...">Column Title</span>
  <ul>
    <li><LocalizedClientLink href="/path">Link</LocalizedClientLink></li>
  </ul>
</div>
```

---

## Layout Wiring

Both header and footer are rendered by the main layout:

**File:** `apps/storefront/src/app/[countryCode]/(main)/layout.tsx`

```tsx
export default async function Layout(props: LayoutProps) {
  const customer = await retrieveCustomer();
  const cart = await retrieveCart();
  const shippingOptions = cart ? await listCartOptions(cart.id) : null;

  return (
    <>
      <Nav />
      {customer && cart && <CartMismatchBanner customer={customer} cart={cart} />}
      {cart && <FreeShippingPriceNudge variant="popup" cart={cart} shippingOptions={shippingOptions} />}
      {props.children}
      <Footer />
    </>
  );
}
```

- `Nav` and `Footer` are always rendered.
- `CartMismatchBanner` and `FreeShippingPriceNudge` are conditional on cart/customer state.
- All pages under `(main)` automatically inherit this layout.

---

## Server vs Client Boundaries

| Component | Type | Why |
|---|---|---|
| `nav/index.tsx` | Server | Fetches regions, locales, locale |
| `cart-button/index.tsx` | Server | Fetches cart via cookies/API; bridges to client |
| `cart-dropdown/index.tsx` | Client | Popover interactivity, hover, auto-open timer |
| `side-menu/index.tsx` | Client | Popover + Listbox interactivity |
| `country-select/index.tsx` | Client | Listbox + server action call |
| `language-select/index.tsx` | Client | Listbox + `useTransition` for locale switch |
| `footer/index.tsx` | Server | Fetches collections and categories |
| `medusa-cta/index.tsx` | Client | Small static component; effectively server-safe |

**Rule**: Keep data fetching in server components. Only add `"use client"` when the component needs interactivity, browser APIs, or state.

---

## Styling Conventions

- **Design tokens**: Use Medusa UI Preset classes (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`, `shadow-*`).
- **Surface classes**: `navbar-surface` for the header, `footer-surface` for the footer.
- **Typography**: Use preset `txt-*` classes inside `@medusajs/ui` components; use local `text-*-regular`/`text-*-semi` for custom headings.
- **Spacing**: Page content wrapper is `w-full flex justify-center px-8 py-12`; footer uses `content-container` for consistent horizontal padding.
- **Icon buttons**: All header icon buttons (menu, cart, account) use `w-8 h-8` (32px) for consistent sizing. Pattern: `inline-flex items-center justify-center w-8 h-8 rounded-full border border-ui-border-base text-ui-fg-subtle transition-all duration-150 hover:text-ui-fg-base hover:bg-ui-bg-base-hover`. Uses inline Tailwind utilities — no new CSS classes in `globals.css`.
- **Responsive**: Use `small:` prefix for tablet breakpoints (640px), `xsmall:` for small mobile, `2xl:` for large screens.

---

## Adding New Nav Links

To add a new link to the header or mobile menu:

1. **In `nav/index.tsx`**: Add a `<LocalizedClientLink>` in the desired position.
2. **In `side-menu/index.tsx`**: Add a new `<LocalizedClientLink>` inside the `SideMenuItems` map or add a new item to the array.
3. **For desktop-only links**: Wrap in `hidden small:flex` like the account icon.
4. **For mobile-only links**: Add inside the `PopoverPanel` in `side-menu/index.tsx`.

## Adding New Footer Links

To add a new link or column to the footer:

1. **Open** `apps/storefront/src/modules/layout/templates/footer/index.tsx`.
2. **Add a new `<div>` column** inside the links grid, or add `<li>` items to an existing column.
3. **Use `<LocalizedClientLink>`** for internal routes and `<a>` for external URLs.
4. **If the column needs dynamic data**, add the fetch in the async footer component and pass it as a variable.

---

## Reference: Components That Do NOT Exist in DTC Starter

The older `nextjs-starter-medusa` had these header/footer components, but they were removed in the DTC starter:

| Component | Status | Replacement |
|---|---|---|
| `header-actions/index.tsx` | Removed | Account icon is a plain link in Nav; locale/country are in SideMenu |
| `account-dropdown/index.tsx` | Removed | Account link goes directly to `/account` |
| `search/index.tsx` | Removed | No search integration in scaffold |
| `search-button/index.tsx` | Removed | No search button |
| `footer-menu/index.tsx` | Removed | Footer links are inline in `footer/index.tsx` |

If you need any of these patterns, create new client components under `modules/layout/components/` and wire them from the Nav or Footer templates.
