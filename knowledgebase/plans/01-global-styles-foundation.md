# Plan 01 — Global Styles Foundation

## Objective

Before porting any components from the reference frontend (`ref/modern/Nextjsfrontend`, "LuxeStore"), establish a global style foundation that:

1. **Preserves MedusaJS token authority** — `@medusajs/ui-preset` remains the source of truth for colors, shadows, borders, and typography. Preset variables are **extended, never overridden**.
2. **Adds only the tokens/utilities the reference patterns actually need** and that the preset lacks (e-commerce surfaces: badges, pricing, stock dots, inputs, button tokens, geometry, focus ring).
3. **Keeps all changes inside `globals.css` and `tailwind.config.js`** — no inline styles, no new CSS files, no new dependencies, no runtime toggle.
4. **Adopts the reference design without copying it blindly** — maps each reference token onto the Medusa preset where the role overlaps, and adds the rest as additive `:root` custom properties, translating Tailwind **v4** constructs into **v3** (`@layer`/`@apply`) equivalents.

This plan is storefront-only. Backend remains untouched.

> **Scope guard.** This is a *planning* document — it describes global-style edits to `globals.css` and `tailwind.config.js` only. It does **not** authorize writing new feature code (no dark-mode toggle, no `theme-provider.tsx` port, no `motion/react`).

---

## Current State Analysis

### MedusaJS Style Layers (authoritative order)

1. **`@medusajs/ui-preset`** (v2.20.1) — CSS custom properties (`--fg-base`, `--bg-base`, `--button-neutral`, `--tag-*`, `--border-base`, etc.) injected via `addBase` into `:root` (light) and `.dark` (dark), plus `theme.extend` for colors/boxShadow/fontFamily/keyframes/animation.
2. **`globals.css`** (`apps/storefront/src/styles/globals.css`, 112 lines) — `@layer utilities` (`.no-scrollbar`, floating-label, autofill, search-decorations) and `@layer components` (`.content-container`, `.contrast-btn`, `text-*-regular/semi` scale). **Has no `:root` block of its own and no `@layer base` override.**
3. **`tailwind.config.js`** — local `grey` scale, `borderRadius`, `screens`, `fontSize`, `fontFamily`, `keyframes`, `animation`, `transitionProperty`, `tailwindcss-radix` plugin. `darkMode: "class"`.

### What the Reference Frontend Uses

The reference (`ref/modern/Nextjsfrontend/frontend`) is a **different stack** and the mapping below is what justifies the "translate, don't copy" rule:

- **Tailwind v4** — `@import "tailwindcss"` (not v3's three directives), `@custom-variant dark (&:where(.dark, .dark *))`, `@utility`/`@theme` in CSS, **no `tailwind.config.js`**:
- **Semantic CSS vars** declared in `:root` / `.dark` in `frontend/src/index.css` (1190 lines): `--bg-canvas`, `--text-primary`, `--border-default`, `--input-bg`, `--btn-primary-bg`, `--price-sale`, `--badge-sale-bg`, `--radius-md`, `--focus-ring`, etc.
- **Component surfaces as global classes**: `.surface-card`, `.surface-elevated`, `.surface-glass`, `.card-base`, `.modal-surface`, `.drawer-surface`, `.popover-surface`, `.product-card-surface`, `.order-summary-surface`, `.toast-surface`, `.table-container`, `.navbar-surface`, `.header-surface`, `.footer-surface`.
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.btn-icon`, `.btn-icon-circle` (with `aspect-ratio: 1 / 1` to guarantee true circles).
- **Badges / stock**: `.badge`, `.badge-sale`, `.badge-new`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.stock-dot-in/low/out` (low pulses).
- **Pricing**: `.price-tag` (tabular-nums), `.price-sale`, `.price-original`, `.price-discount-pill`.
- **Forms**: global `input[type=...]` base + `.input-control`, `.form-label`, `.form-helper-text`, `.form-error-text`.
- **Utilities**: `.scrollbar-thin` (6px, dark-tuned), `.scrollbar-none`, `.divider*` variants, `.icon-box`, `.bg-card`/`.text-theme-*` shorthands.
- **Base/foundation**: `* { box-sizing }`, `color-scheme`, `html { font-feature-settings, scroll-behavior, tap-highlight-color }`, `::selection`, global `h1`–`h6` with `clamp` + negative letter-spacing.
- **Theme accent system**: `getThemeClasses(themeColor)` in `frontend/src/providers/theme-provider.tsx` returns class strings for `blue | indigo | emerald | rose | amber | slag` and **overrides 7 CSS variables at runtime** (`--text-accent`, `--border-focus`, `--btn-primary-bg`, `--focus-ring`, `--input-ring`, `--badge-new-bg`, `--badge-new-text`). The default accent is **blue** (`#2563eb`).
- **Dark mode**: a `beforeInteractive` init script in `frontend/src/app/layout.tsx` toggles `.dark` on `<html>` from `localStorage` / `prefers-color-scheme`. **This is a JS feature, not a global style.**

### Our storefront: what's actually present vs missing

Verified facts (grep across `apps/storefront/src/`):

- `@layer`/`@apply` appear **only** in `src/styles/globals.css` — no other global CSS files.
- **Zero** matches for `surface-card|btn-primary|badge-sale|card-base|input-control|scrollbar-thin|popover-surface|drawer-surface|price-tag|stock-dot|badge-success|form-error-text|divider-subtle|icon-box` — none of the reference's global surface/utility classes exist. Our components inline Tailwind utilities or use the local UI kit primitives.
- `globals.css` has **no `:root` block**, **no `@layer base` override**, **no global `h1`–`h6` base**, **no `:focus-visible` ring**, **no `::selection`**, **no scrollbar styling** beyond `.no-scrollbar`.
- `tailwind.config.js` `borderRadius` has no `3xl`; the reference uses `rounded-3xl` (24px) for `PageBanner`/`rounded-2xl` (16px) for cards.
- Dark mode: `darkMode: "class"` is set, but `<html data-mode="light">` is hardcoded in `layout.tsx` — **no toggle** and no dark token overrides of our own (the preset provides `.dark` overrides).

Full token-level gap analysis and the reference → Medusa cross-map live in `knowledgebase/site-structure/global-styles.md` → *"Reference Design Language"*.

---

## Strategic Approach

**Do NOT blindly copy the reference's theme system.** Instead:

1. **Extend the preset, never override it.** Reuse Medusa preset tokens (`text-ui-fg-base`, `bg-ui-bg-base`, `border-ui-border-base`, `shadow-elevation-*`, `bg-ui-tag-*`) for every role the preset already owns.
2. **Add the missing e-commerce tokens to `:root`** in `globals.css` — the preset has no `--input-*`, `--btn-primary-*`, `--price-*`, `--badge-*`, `--rating-star`, `--focus-ring`, or `--radius-*` vocabulary. These become the single source the new global classes reference, and they come in light + dark pairs so they are theme-aware automatically.
3. **Add global component classes into the existing `@layer components` / `@layer utilities`** — buttons, cards, badges, pricing, stock dots, input-control, form helpers, scrollbars, dividers, icon-box. Each references Medusa vars or the new `:root` vars (never hardcoded hex), so they flip to dark mode for free.
4. **Add base foundations into `@layer base`** — box-sizing, `color-scheme`, heading base, `::selection`, `:focus-visible`, reduced-motion guard, `visually-hidden`.
5. **Keep the accent blue-by-default.** The reference's runtime accent toggle is a **JS feature** (out of scope). We mirror only the *default* (blue) by adding the 7 accent tokens to `:root`; swapping the default hue later is a single-value global edit, not a new theme type.
6. **Translate Tailwind v3 → v4 constructs.** Never paste the reference's v4 `@utility`/`@custom-variant`/`@theme` syntax. Use `@layer utilities { .x { @apply ...; } }` and `theme.extend` in `tailwind.config.js`.

---

## Step 1 — Extend `tailwind.config.js` with missing scale tokens (additive only)

### 1.1 Add `3xl` border radius

**File**: `apps/storefront/tailwind.config.js` → `theme.extend.borderRadius`

```js
borderRadius: {
  none: "0px",
  soft: "2px",
  base: "4px",
  rounded: "8px",
  large: "16px",
  "3xl": "1.5rem",   // NEW — maps to reference rounded-3xl (24px)
  circle: "9999px",
},
```

**Why**: The reference uses `rounded-3xl` for hero banners and `rounded-2xl` (already = our `large`) for cards. Adding `3xl` is additive and does **not** rename existing Medusa tokens (`rounded`/`large`) that the local UI kit and preset components rely on.

### 1.2 Add missing e-commerce tokens to `:root` (NOT a new color namespace)

**Do NOT** add a `theme.*` Tailwind color namespace or a `theme-utils.ts` helper. Instead, declare the missing semantic custom properties directly in `globals.css`:

**File**: `apps/storefront/src/styles/globals.css` — add a `:root { ... }` block (currently absent) and a matching `.dark { ... }` block:

```css
:root {
  /* Form / input tokens (preset has none) */
  --input-bg: #ffffff;
  --input-bg-subtle: #f8fafc;
  --input-border: #cbd5e1;
  --input-border-hover: #94a3b8;
  --input-border-focus: #2563eb;
  --input-text: #0f172a;
  --input-placeholder: #94a3b8;
  --input-ring: rgba(37, 99, 235, 0.2);
  --input-ring-error: rgba(225, 29, 72, 0.2);

  /* Button tokens (adds accent vocabulary the preset's single --bg-interactive lacks) */
  --btn-primary-bg: #1d4ed8;
  --btn-primary-text: #ffffff;
  --btn-primary-hover: #1e40af;
  --btn-primary-active: #172554;
  --btn-secondary-bg: #f1f5f9;
  --btn-secondary-text: #0f172a;
  --btn-secondary-border: #e2e8f0;

  /* E-commerce: pricing, badges, stock, rating */
  --price-primary: #0f172a;
  --price-sale: #e11d48;
  --price-original: #94a3b8;
  --badge-sale-bg: #ffe4e6;
  --badge-sale-text: #be123c;
  --badge-new-bg: #dbeafe;
  --badge-new-text: #1d4ed8;
  --badge-stock-in: #059669;
  --badge-stock-low: #d97706;
  --badge-stock-out: #e11d48;
  --rating-star: #f59e0b;

  /* Geometry */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  /* Card & shadow tokens (reference .surface-card / .surface-elevated shadows) */
  --card-bg: #ffffff;
  --card-border: #e2e8f0;
  --card-hover-border: #cbd5e1;
  --card-shadow: 0 1px 3px 0 rgba(0,0,0,.04), 0 1px 2px -1px rgba(0,0,0,.03);
  --card-shadow-hover: 0 10px 25px -5px rgba(15,23,42,.08), 0 8px 10px -6px rgba(15,23,42,.04);
  --shadow-elevated: 0 20px 25px -5px rgba(15,23,42,.1), 0 8px 10px -6px rgba(15,23,42,.06);

  /* Surface / border variants the preset lacks (reference --bg-surface-* / --border-subtle) */
  --bg-surface-elevated: #ffffff;
  --bg-surface-subtle: #f8fafc;
  --border-subtle: #f1f5f9;

  /* Focus / interaction */
  --focus-ring: rgba(37, 99, 235, 0.4);

  color-scheme: light;
}

.dark {
  color-scheme: dark;
  /* ...dark equivalents for every token above... */
  --input-bg: #1e293b;
  --input-border: #334155;
  --input-border-focus: #3b82f6;
  --input-text: #f8fafc;
  --input-placeholder: #64748b;
  --input-ring: rgba(59, 130, 246, 0.3);
  --input-ring-error: rgba(244, 63, 94, 0.3);
  --btn-primary-bg: #2563eb;
  --btn-primary-hover: #3b82f6;
  --btn-primary-active: #1d4ed8;
  --btn-secondary-bg: #334155;
  --btn-secondary-text: #f8fafc;
  --btn-secondary-border: #475569;
  --price-primary: #f8fafc;
  --price-sale: #fb7185;
  --badge-sale-bg: rgba(225, 29, 72, 0.25);
  --badge-sale-text: #fda4af;
  --badge-new-bg: rgba(37, 99, 235, 0.25);
  --badge-new-text: #93c5fd;
  --badge-stock-in: #34d399;
  --badge-stock-low: #fbbf24;
  --badge-stock-out: #f87171;
  --rating-star: #fbbf24;
  --card-bg: #1e293b;
  --card-border: #334155;
  --card-hover-border: #475569;
  --card-shadow: 0 1px 3px 0 rgba(0,0,0,.3), 0 1px 2px -1px rgba(0,0,0,.2);
  --card-shadow-hover: 0 10px 25px -5px rgba(0,0,0,.5), 0 8px 10px -6px rgba(0,0,0,.4);
  --shadow-elevated: 0 20px 25px -5px rgba(0,0,0,.6), 0 8px 10px -6px rgba(0,0,0,.4);
  --bg-surface-elevated: #334155;
  --bg-surface-subtle: #1e293b;
  --border-subtle: #1e293b;
  --focus-ring: rgba(59, 130, 246, 0.5);
}
```

**Why**: These values come straight from the reference `index.css` `:root` / `.dark`. Adding them to the **existing** `globals.css` (which currently has no `:root` block) is "updating the existing global styles," not inventing a new token system. The `bg-ui-*` / `text-ui-fg-*` preset utilities remain untouched and authoritative for their roles.

### 1.3 Add gradient utilities (Tailwind v3 `@layer`, not v4 `@utility`)

The reference defines theme gradients inline on components (e.g. `PageBanner` builds a gradient per `themeColor`). Do **not** add a `backgroundImage` theme namespace that duplicates Tailwind's built-in `bg-gradient-to-*`. Instead, if a reusable themed gradient is needed by 2+ shared components, add it as a v3 `@layer utilities` rule in `globals.css` that references the `:root` accent tokens:

```css
@layer utilities {
  .bg-gradient-theme-blue {
    @apply bg-gradient-to-br from-blue-200/90 via-blue-100/75 to-blue-50/85;
  }
  .dark .bg-gradient-theme-blue {
    @apply from-blue-950/90 via-blue-900/60 to-blue-950/80;
  }
  /* Ambient glow (decorative blurred circle) — v3 equivalent of the reference .glow-* */
  .glow-blue { @apply bg-blue-400/20 dark:bg-blue-500/25; }
}
```

**Rule**: Keep component-level gradients inline unless shared by 2+ components. Global gradient utilities are the exception, not the rule.

---

## Step 2 — Extend `globals.css` with the missing global component surfaces & utilities

All additions go into the **existing** `apps/storefront/src/styles/globals.css`. New component classes → `@layer components`. New shorthand utilities → `@layer utilities`.

### 2.1 Base foundations (`@layer base` + `:root`)

Add (additive; does not remove the preset's `addBase`):

```css
@layer base {
  *, *::before, *::after { box-sizing: border-box; }

  html {
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    scroll-behavior: smooth;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background-color: var(--bg-base);
    color: var(--fg-base);
    min-height: 100vh;
  }

  /* Global heading base — mirrors the reference's clamp + tracking, but uses
     preset foreground tokens so it stays Medusa-themed. Do not remove the
     txt-* / text-*-semi classes; this only styles unmarked <h1>..<h6>. */
  h1, h2, h3, h4, h5, h6 { color: var(--fg-base); font-weight: 700; line-height: 1.25; }
  h1 { font-size: clamp(1.875rem, 4vw, 2.75rem); letter-spacing: -0.03em; font-weight: 750; }
  h2 { font-size: clamp(1.5rem, 3vw, 2rem); letter-spacing: -0.025em; }
  h3 { font-size: clamp(1.25rem, 2.5vw, 1.5rem); letter-spacing: -0.02em; }
  h4 { font-size: 1.125rem; letter-spacing: -0.015em; }
  h5 { font-size: 1rem; letter-spacing: -0.01em; }
  h6 { font-size: 0.875rem; letter-spacing: -0.005em; }

  a { color: inherit; text-decoration: none; transition: color 0.15s ease; }

  ::selection { background-color: var(--btn-primary-bg); color: var(--fg-on-color); }

  /* Accessible focus ring — replaces the ad-hoc per-component focus shadows */
  :focus-visible { outline: 2px solid var(--border-interactive); outline-offset: 2px; }
  button:focus:not(:focus-visible),
  a:focus:not(:focus-visible),
  input:focus:not(:focus-visible) { outline: none; }

  /* Creative addition #1 — reduced motion (reference has none) */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}

/* Creative addition #2 — screen-reader-only utility (neither site has it) */
@layer utilities {
  .visually-hidden, .sr-only {
    position: absolute !important;
    width: 1px !important; height: 1px !important;
    padding: 0 !important; margin: -1px !important;
    overflow: hidden !important; clip: rect(0,0,0,0) !important;
    white-space: nowrap !important; border: 0 !important;
  }
}

/* Creative addition #3 — balanced heading wrapping for responsive headings */
h1, h2, h3 { text-wrap: balance; }
/* Creative addition #4 — anchor scroll margin pairs with html scroll-behavior:smooth */
:target, h1[id], h2[id], h3[id] { scroll-margin-top: 4rem; }
```

> These are **additive base-level rules**. They reference Medusa preset variables (`--bg-base`, `--fg-base`, `--fg-on-color`, `--border-interactive`) so they inherit the preset's light/dark values and are never hardcoded.

### 2.2 Global component surfaces (`@layer components`)

Add the reference's surface classes, each wired to the new `:root` tokens + preset vars. Only the class bodies are shown (paste into `@layer components`):

```css
/* Cards / surfaces (reference .surface-card .surface-elevated .surface-glass .surface-subtle) */
.surface-card   { background: var(--card-bg, var(--bg-component)); border: 1px solid var(--card-border, var(--border-base)); border-radius: var(--radius-xl); box-shadow: var(--shadow-elevation-card-rest); transition: border-color .2s, box-shadow .2s; }
.surface-card-hover:hover { border-color: var(--card-hover-border, var(--border-strong)); box-shadow: var(--shadow-elevation-card-hover); }
.surface-elevated  { background: var(--bg-surface-elevated, var(--bg-component)); border: 1px solid var(--border-base); border-radius: var(--radius-2xl); box-shadow: var(--shadow-elevated); }
.surface-subtle    { background: var(--bg-surface-subtle, var(--bg-subtle)); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
.surface-glass     { background: rgba(255,255,255,.8); backdrop-filter: blur(12px); border: 1px solid rgba(226,232,240,.8); }
.dark .surface-glass { background: rgba(30,41,59,.85); border: 1px solid rgba(51,65,85,.8); }

/* Layout surfaces (reference .navbar-surface .header-surface .footer-surface) */
.navbar-surface, .header-surface { background: var(--bg-base); border-color: var(--border-base); color: var(--fg-base); }
.footer-surface { background: var(--bg-subtle); border-top: 1px solid var(--border-base); color: var(--fg-base); }
```

For shadows, prefer the preset's `boxShadow` tokens via Tailwind utilities (`shadow-elevation-card-rest`, `shadow-elevation-flyout`, `shadow-elevation-modal`) inside `@apply` where possible; only fall back to a `--shadow-elevated` CSS var when the preset lacks the exact shadow.

### 2.3 Buttons, badges, pricing, stock, input, form (`@layer components`)

Adopt the reference's button/badge/pricing/stock/input system as **global** classes. These **complement** (do not replace) the local UI kit `Button`/`Badge`:

- **Buttons** (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.btn-sm`/`.btn`/`btn-lg`, `.btn-icon`, `.btn-icon-circle` with `aspect-ratio:1/1`). Wire to `--btn-primary-*` and `--bg-interactive`. **Add `.btn-icon-circle`** — this fixes a real consistency gap: without `aspect-ratio:1/1`, icon buttons render as ovals when their icon isn't square.
- **Badges** (`.badge`, `.badge-sale`, `.badge-new`, `.badge-success`, `.badge-warning`, `.badge-danger`) + **stock dots** (`.stock-dot`, `.stock-dot-in/low/out`, low pulses). Wire to `--badge-*` / `--price-*` / `--badge-stock-*` tokens.
- **Pricing** (`.price-tag` w/ `font-variant-numeric: tabular-nums`, `.price-sale`, `.price-original`, `.price-discount-pill`). Prevents layout shift during discount recalculation — a consistency improvement.
- **Form** (`.input-control`, `.form-label`, `.form-helper-text`, `.form-error-text`).
- **Tables** (`.table-container`, `.table-row-surface`).
- **Tabs** (`.tab-pill-active`, `.tab-pill-inactive`, `.tab-underline-active`).
- **Tooltips/toasts** (`.tooltip-surface`, `.toast-surface`).

### 2.4 Scrollbar + dividers + icon foundation (`@layer utilities`)

- `.scrollbar-thin` (6px, dark-tuned) and `.scrollbar-none` — ours only has `.no-scrollbar`; add `.scrollbar-thin` for containers that should keep a subtle scrollbar.
- `.divider`, `.divider-subtle`, `.divider-strong`.
- `.icon-box` / `.icon-base` foundation + `.icon-box-sm/md/lg` sizes.
- Direct token shorthands (`.bg-card`, `.text-theme-primary`, `.border-theme`) only where the `!important` guarantee is actually needed by a shared component; otherwise prefer the preset utilities directly.

---

## Step 3 — Accent / theme-color strategy (blue-by-default, no runtime toggle)

The reference's six-hue accent system lives in `theme-provider.tsx` (a **client component** that overrides CSS vars at mount). Adding that is a **feature** (a new provider + toggle), explicitly out of scope. Instead:

- The **default accent is blue**, already exposed by the Medusa preset as `--fg-interactive` / `--bg-interactive` (`#2563eb` / `#3b82f6`).
- By adding `--btn-primary-bg` / `--text-accent` / `--badge-new-*` etc. to `:root` with the reference's **blue** values, every new global class is accent-consistent with the preset out of the box.
- If a non-blue default is ever needed, it is a **single-value edit** in `:root` (change `#1d4ed8` → `#10b981` for emerald, etc.) + the same line in `.dark`. No new module, no runtime toggle, no per-component changes.
  - If *per-page* accent variation is ever required, scope it with an attribute selector on the existing mechanism, e.g. `html[data-theme="emerald"] { --btn-primary-bg: #059669; ... }` — this extends `:root`, it does not create a new theme system.

**No `src/lib/theme-utils.ts` is created.** The runtime `getThemeClasses()` helper and `ThemeProvider` stay as reference-only concepts; porting them is a separate feature plan.

---

## Step 4 — Typography strategy (use, don't duplicate)

### 4.1 Do NOT add new typography classes to `globals.css`

Arbitrary values (`text-2xl`, `text-4xl`, `font-black`, `tracking-tight`, `text-xs`) are already valid Tailwind v3 utilities. Use them directly in components.

### 4.2 Document the two-system contract (already exists — do not fragment)

- **Preset `txt-*`** classes — for `@medusajs/ui` primitives (`Text`, `Heading` from the local UI kit).
- **Local `text-*-regular` / `text-*-semi`** — for page-level headings (already in `globals.css` `@layer components`).
- **New shared components** may use arbitrary Tailwind values (`text-2xl`, `font-black`, `tracking-tight`) for design-agnostic styling, OR the local `text-*-semi` scale for consistency with existing pages.
- The new global `h1`–`h6` base styles (Step 2.1) **augment** — not replace — these; unmarked headings get sensible defaults, while `txt-*`/`text-*-semi` remain the explicit choice in JSX.

**Rule**: Do not mix `txt-medium` with `text-base-regular` on the same element (different line heights: 22.4px vs 24px).

---

## Step 5 — Dark mode strategy (config stays; toggle is out of scope)

### 5.1 Keep existing `darkMode: "class"`

The reference's dark variants work because `darkMode: "class"` is set — ours already has it. **No change** to `tailwind.config.js` dark mode.

### 5.2 Do NOT port the dark-mode toggle

The reference's `layout.tsx` init script (`beforeInteractive`, reads `localStorage.luxestore_dark_mode`, toggles `.dark`) is a **JS runtime feature**. Per scope ("no new features such as darkmode"), do not add it. The `.dark` class can still be toggled manually in DevTools to validate the new `.dark` token overrides authored in Step 1.2 / 2.1.

### 5.3 All new shared components must be theme-aware

Every new surface class must include a `.dark` clause (via the `.dark { ... }` block + `.dark .surface-glass` pattern) so light/dark tokens resolve. Use preset tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`) where possible; for new `--*` tokens, author the dark value in the `.dark` block.

---

## Step 6 — Spacing and layout

### 6.1 Keep `.content-container` as-is

Reference uses `max-w-7xl` (1280px); Medusa uses `max-w-[1440px]`. Keep Medusa's wider default.

### 6.2 Standardize the padding pattern

Document as the standard for new pages: `px-4 sm:px-6 lg:px-8`, `py-8 sm:py-12`, `space-y-4 sm:space-y-6`. Already valid Tailwind v3.

### 6.3 No new spacing tokens

Standard Tailwind spacing is sufficient.

---

## Step 7 — Animation and motion

### 7.1 Keep preset animations

`tailwindcss-animate` (via the preset) provides `animate-in`/`animate-out` etc.

### 7.2 Keep local animations

`fade-in-right`, `fade-in-top`, `accordion-open/close`, `ring`, `enter`/`leave`, `slide-in` are defined in `tailwind.config.js`.

### 7.3 Do NOT add `motion/react`

The reference uses `motion/react` (Framer Motion). Not in our dependencies. Out of scope; would be a separate plan + dependency decision. The `prefers-reduced-motion` guard added in Step 2.1 ensures any future animations remain accessible.

---

## Verification

After authoring (no runtime code changes, so these are CSS/typography checks):

1. **Tailwind compile**: `cd apps/storefront && pnpm exec tailwindcss -i ./src/styles/globals.css -o /dev/null` (or a one-off build) — confirms v3 syntax in the new `@layer`/`@apply` rules compiles. (Use `npx tailwindcss` if `@tailwindcss/cli` is installed; otherwise rely on the next build step.)
2. **Build**: `cd apps/storefront && pnpm run build` — no Tailwind compile errors from new classes.
3. **Dark toggle test**: Manually add `.dark` to `<html>` in DevTools — all new surface/badge/button/input classes render with dark tokens; no unstyled elements.
4. **Focus indicator**: Tab through the app — `:focus-visible` 2px ring appears on all interactive elements.
5. **Reduced motion**: Toggle `prefers-reduced-motion: reduce` in DevTools → `ring` spinner and all `fade-in-*`/`accordion-*` animations freeze.
6. **No regressions**: Existing `txt-*` classes, local `text-*-semi` classes, and `.content-container`/`.contrast-btn`/`.no-scrollbar` render identically.

---

## Files Changed (documentation + CSS only)

| File | Change type | Change |
|---|---|---|
| `apps/storefront/src/styles/globals.css` | **append** | `:root { ... }` + `.dark { ... }` e-commerce tokens; `@layer base` (box-sizing, color-scheme, heading base, `::selection`, `:focus-visible`, reduced-motion, `text-wrap:balance`, scroll-margin); new `@layer utilities` (`.visually-hidden`, `.scrollbar-thin`); new `@layer components` (surfaces, buttons, badges, pricing, stock dots, input-control, form helpers, dividers, icon-box, layout surfaces, e-commerce surfaces) |
| `apps/storefront/tailwind.config.js` | **edit** | Add `"3xl": "1.5rem"` to `borderRadius` (additive). No other config change. |
| `knowledgebase/site-structure/global-styles.md` | **append** | Reference design-language section + token cross-map + gap table (done in this change set). |
| `knowledgebase/plans/01-global-styles-foundation.md` | **this file** | Corrected plan replacing the `theme.*` namespace + `theme-utils.ts` approach with the "extend `:root` + `@layer`" approach above. |

No new files, no new dependencies, no `.d.ts` additions, no `@layer` imports from other CSS files.

---

## Out of Scope for This Plan

- **Runtime accent toggle / `ThemeProvider` port** — a feature, not a global style. (Reference: `frontend/src/providers/theme-provider.tsx`.)
- **`motion/react` / Framer Motion** — not in dependencies; separate plan if needed.
- **Tailwind v4 migration** — our storefront is on v3; the new classes are authored in v3 syntax. Migrating is a separate, larger effort.
- **Backend schema changes** — global styles are storefront-only.
- **Admin dashboard customizations** — storefront only.
- **Third-party integrations** — out of scope for a styles foundation.

### Ignored Design Elements (reference features that require a feature, not a global style)

The following reference patterns are **intentionally not adopted** here because they are features or architectural choices, not global styles:

- **Runtime theme-color switching** (`getThemeClasses` in `theme-provider.tsx`, `blue|indigo|emerald|rose|amber|slate`) — a client feature + localStorage. Documented as a future accent-swap path (Step 3), not implemented.
- **`<head>` dark-mode init script** (`layout.tsx` `beforeInteractive` Script) — JS, not CSS. Documented as togglable manually in DevTools; not installed.
- **`<head>` JSON-LD / meta / GTM scripts** — metadata/feature, not global style.
- **Gradient presets** in `data/presets.ts` — data, not global style.
- **`motion/react` animations** (`whileHover`, `AnimatePresence`) — a dependency + feature.
- **`next.config.mjs` image `qualities`** — config, not style.

> **Rule:** If a design element from the reference requires any of the above, it is "ignored" here and must be raised as a separate request before backend/feature work. Global styles only.

---

## Dependencies and Decisions Required

1. **Confirm the default accent stays blue.** The plan assumes blue-by-default (matches the Medusa preset). If a different default hue is required, change the `:root` token values in Step 1.2 — a one-line decision, no code architecture change.
2. **Confirm `3xl: 1.5rem`** is acceptable alongside the existing Medusa `borderRadius` scale. It is additive; no existing class changes meaning.
3. **Confirm the dark-mode toggle is out of scope.** If a toggle is later approved, it is a separate feature plan (JS + `layout.tsx` script), not a global-style edit.
4. **Confirm font stack.** The reference loads *Plus Jakarta Sans* + *JetBrains Mono* via Google Fonts. Our storefront uses **Inter** only (no `@font-face`; system/Google-fonts CDN). Adding font imports is a global-style edit (a `<link>` in `layout.tsx` or an `@import` in `globals.css`), but it increases JS/shared-dict cost. Decision: keep Inter-only unless branding requires the switch — do not add fonts speculatively.
