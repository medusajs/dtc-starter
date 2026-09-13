# Global Styles and Theming

## Overview

The storefront uses **Tailwind CSS v3** with the **Medusa UI Preset** (`@medusajs/ui-preset` v2.20.1) as its design system foundation. There are three overlapping style layers:

1. **Medusa UI Preset tokens** — CSS custom properties (`--fg-base`, `--bg-component`, etc.) mapped to Tailwind utility classes (`text-ui-fg-base`, `bg-ui-bg-component`, etc.). These are the primary design tokens.
2. **Local globals.css** — `@layer utilities` and `@layer components` for one-off helpers (`.no-scrollbar`, `.content-container`, floating-label behavior, the local `text-*-regular`/`text-*-semi` scale).
3. **tailwind.config.js extensions** — local `grey` color scale, `borderRadius`, responsive `screens`, custom `keyframes`/`animation`, `transitionProperty`, and the `tailwindcss-radix` plugin.

The preset is the source of truth for colors, shadows, and the `txt-*` typography classes. Local overrides in `tailwind.config.js` and `globals.css` extend it without modifying the preset package.

---

## How the Medusa UI Preset Works

### What it is

`@medusajs/ui-preset` is a **Tailwind CSS preset** (not a React component library). It is auto-generated from Medusa's Figma design tokens. It does three things:

1. **Injects CSS custom properties** into `:root` (light) and `.dark` (dark) via `addBase`
2. **Extends Tailwind's theme** with color, boxShadow, fontFamily, keyframes, and animation tokens via the preset's second argument
3. **Registers component-level CSS classes** (`@layer components`) for typography (`.txt-*`, `.h1-webs`, etc.)

### How it's loaded

`apps/storefront/tailwind.config.js`:
```js
const path = require("path")

module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
}
```

The preset file (`node_modules/@medusajs/ui-preset/src/preset.ts`) exports:
```js
const preset = {
  content: [],
  plugins: [plugin, require("tailwindcss-animate")],
}
```

So `presets: [require("@medusajs/ui-preset")]` loads:
- The preset's plugin (CSS variables + theme extensions)
- `tailwindcss-animate` (animation utilities like `animate-in`, `animate-out`)

**Note**: The storefront's `content` array does **not** include `./node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}`. This is acceptable because the preset's plugin registers its own CSS classes globally via `addComponents(typography)`, and the Tailwind theme extensions are available regardless of content scanning. However, if you add custom Medusa UI component imports from `@medusajs/ui`, you should add the `node_modules` path to `content` to avoid purging.

### Dark mode strategy

The preset supports both `class` and `media` dark mode strategies. This storefront uses `darkMode: "class"`:

- **Light mode** (default): CSS variables are set on `:root`
- **Dark mode** (`.dark` class on `<html>`): CSS variables are overridden on `.dark`

When `darkMode: "media"` is used, the preset instead emits a `@media (prefers-color-scheme: dark)` block. This storefront does **not** use media queries for dark mode.

---

## CSS Variable Token System

The preset defines ~90 CSS custom properties per theme. They are mapped to Tailwind classes via the preset's `theme.extend.colors` and `theme.extend.boxShadow` extensions.

### Token naming convention

CSS variables use **kebab-case** without prefixes. Tailwind classes use **dotted** namespaces:

| CSS variable | Tailwind class |
|---|---|
| `--fg-base` | `text-ui-fg-base` |
| `--bg-base` | `bg-ui-bg-base` |
| `--border-base` | `border-ui-border-base` |
| `--borders-base` | `shadow-borders-base` |
| `--elevation-card-rest` | `shadow-elevation-card-rest` |

### Text / Foreground (`--fg-*`)

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--fg-base` | `rgba(24, 24, 27, 1)` | `rgba(244, 244, 245, 1)` | `text-ui-fg-base` |
| `--fg-subtle` | `rgba(82, 82, 91, 1)` | `rgba(161, 161, 170, 1)` | `text-ui-fg-subtle` |
| `--fg-interactive` | `rgba(59, 130, 246, 1)` | `rgba(96, 165, 250, 1)` | `text-ui-fg-interactive` |
| `--fg-interactive-hover` | `rgba(37, 99, 235, 1)` | `rgba(147, 197, 253, 1)` | `text-ui-fg-interactive-hover` |
| `--fg-error` | `rgba(225, 29, 72, 1)` | `rgba(251, 113, 133, 1)` | `text-ui-fg-error` |
| `--fg-disabled` | `rgba(161, 161, 170, 1)` | `rgba(82, 82, 91, 1)` | `text-ui-fg-disabled` |
| `--fg-muted` | `rgba(113, 113, 122, 1)` | `rgba(113, 113, 122, 1)` | `text-ui-fg-muted` |
| `--fg-on-color` | `rgba(255, 255, 255, 1)` | `rgba(255, 255, 255, 1)` | `text-ui-fg-on-color` |
| `--fg-on-inverted` | `rgba(255, 255, 255, 1)` | `rgba(24, 24, 27, 1)` | `text-ui-fg-on-inverted` |

### Background (`--bg-*`)

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--bg-base` | `rgba(255, 255, 255, 1)` | `rgba(33, 33, 36, 1)` | `bg-ui-bg-base` |
| `--bg-base-hover` | `rgba(244, 244, 245, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-base-hover` |
| `--bg-base-pressed` | `rgba(228, 228, 231, 1)` | `rgba(63, 63, 70, 1)` | `bg-ui-bg-base-pressed` |
| `--bg-subtle` | `rgba(250, 250, 250, 1)` | `rgba(24, 24, 27, 1)` | `bg-ui-bg-subtle` |
| `--bg-subtle-hover` | `rgba(244, 244, 245, 1)` | `rgba(33, 33, 36, 1)` | `bg-ui-bg-subtle-hover` |
| `--bg-subtle-pressed` | `rgba(228, 228, 231, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-subtle-pressed` |
| `--bg-component` | `rgba(250, 250, 250, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-component` |
| `--bg-component-hover` | `rgba(244, 244, 245, 1)` | `rgba(255, 255, 255, 0.1)` | `bg-ui-bg-component-hover` |
| `--bg-component-pressed` | `rgba(228, 228, 231, 1)` | `rgba(255, 255, 255, 0.16)` | `bg-ui-bg-component-pressed` |
| `--bg-field` | `rgba(250, 250, 250, 1)` | `rgba(255, 255, 255, 0.04)` | `bg-ui-bg-field` |
| `--bg-field-hover` | `rgba(244, 244, 245, 1)` | `rgba(255, 255, 255, 0.08)` | `bg-ui-bg-field-hover` |
| `--bg-field-component` | `rgba(255, 255, 255, 1)` | `rgba(33, 33, 36, 1)` | `bg-ui-bg-field-component` |
| `--bg-field-component-hover` | `rgba(250, 250, 250, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-field-component-hover` |
| `--bg-interactive` | `rgba(59, 130, 246, 1)` | `rgba(96, 165, 250, 1)` | `bg-ui-bg-interactive` |
| `--bg-disabled` | `rgba(244, 244, 245, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-disabled` |
| `--bg-overlay` | `rgba(24, 24, 27, 0.4)` | `rgba(24, 24, 27, 0.72)` | `bg-ui-bg-overlay` |
| `--bg-highlight` | `rgba(239, 246, 255, 1)` | `rgba(23, 37, 84, 1)` | `bg-ui-bg-highlight` |
| `--bg-highlight-hover` | `rgba(219, 234, 254, 1)` | `rgba(30, 58, 138, 1)` | `bg-ui-bg-highlight-hover` |
| `--bg-switch-off` | `rgba(228, 228, 231, 1)` | `rgba(63, 63, 70, 1)` | `bg-ui-bg-switch-off` |
| `--bg-switch-off-hover` | `rgba(212, 212, 216, 1)` | `rgba(82, 82, 91, 1)` | `bg-ui-bg-switch-off-hover` |

### Border (`--border-*`)

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--border-base` | `rgba(228, 228, 231, 1)` | `rgba(255, 255, 255, 0.08)` | `border-ui-border-base` |
| `--border-strong` | `rgba(212, 212, 216, 1)` | `rgba(255, 255, 255, 0.16)` | `border-ui-border-strong` |
| `--border-interactive` | `rgba(59, 130, 246, 1)` | `rgba(96, 165, 250, 1)` | `border-ui-border-interactive` |
| `--border-danger` | `rgba(190, 18, 60, 1)` | `rgba(190, 18, 60, 1)` | `border-ui-border-danger` |
| `--border-error` | `rgba(225, 29, 72, 1)` | `rgba(251, 113, 133, 1)` | `border-ui-border-error` |
| `--border-transparent` | `rgba(255, 255, 255, 0)` | `rgba(255, 255, 255, 0)` | `border-ui-border-transparent` |
| `--border-menu-top` | `rgba(228, 228, 231, 1)` | `rgba(33, 33, 36, 1)` | `border-ui-border-menu-top` |
| `--border-menu-bot` | `rgba(255, 255, 255, 1)` | `rgba(255, 255, 255, 0.08)` | `border-ui-border-menu-bot` |

### Button (`--button-*`)

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--button-neutral` | `rgba(255, 255, 255, 1)` | `rgba(255, 255, 255, 0.04)` | `bg-ui-button-neutral` |
| `--button-neutral-hover` | `rgba(244, 244, 245, 1)` | `rgba(255, 255, 255, 0.08)` | `bg-ui-button-neutral-hover` |
| `--button-neutral-pressed` | `rgba(228, 228, 231, 1)` | `rgba(255, 255, 255, 0.12)` | `bg-ui-button-neutral-pressed` |
| `--button-inverted` | `rgba(39, 39, 42, 1)` | `rgba(82, 82, 91, 1)` | `bg-ui-button-primary` |
| `--button-inverted-hover` | `rgba(63, 63, 70, 1)` | `rgba(113, 113, 122, 1)` | `bg-ui-button-primary-hover` |
| `--button-inverted-pressed` | `rgba(82, 82, 91, 1)` | `rgba(161, 161, 170, 1)` | `bg-ui-button-primary-pressed` |
| `--button-danger` | `rgba(225, 29, 72, 1)` | `rgba(159, 18, 57, 1)` | `bg-ui-button-danger` |
| `--button-danger-hover` | `rgba(190, 18, 60, 1)` | `rgba(190, 18, 60, 1)` | `bg-ui-button-danger-hover` |
| `--button-danger-pressed` | `rgba(159, 18, 57, 1)` | `rgba(225, 29, 72, 1)` | `bg-ui-button-danger-pressed` |
| `--button-transparent` | `rgba(255, 255, 255, 0)` | `rgba(255, 255, 255, 0)` | `bg-ui-button-inverted` |
| `--button-transparent-hover` | `rgba(244, 244, 245, 1)` | `rgba(255, 255, 255, 0.08)` | `bg-ui-button-inverted-hover` |
| `--button-transparent-pressed` | `rgba(228, 228, 231, 1)` | `rgba(255, 255, 255, 0.12)` | `bg-ui-button-inverted-pressed` |

### Tag (`--tag-*`)

Six color variants: `green`, `red`, `blue`, `orange`, `purple`, `neutral`. Each has `bg`, `bg-hover`, `border`, `text`, and `icon` sub-tokens.

Example (green):
| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--tag-green-bg` | `rgba(209, 250, 229, 1)` | `rgba(2, 44, 34, 1)` | `bg-ui-tag-green-bg` |
| `--tag-green-bg-hover` | `rgba(167, 243, 208, 1)` | `rgba(6, 78, 59, 1)` | `bg-ui-tag-green-bg-hover` |
| `--tag-green-border` | `rgba(167, 243, 208, 1)` | `rgba(6, 78, 59, 1)` | `border-ui-tag-green-border` |
| `--tag-green-text` | `rgba(6, 95, 70, 1)` | `rgba(52, 211, 153, 1)` | `text-ui-tag-green-text` |
| `--tag-green-icon` | `rgba(16, 185, 129, 1)` | `rgba(16, 185, 129, 1)` | `text-ui-tag-green-icon` |

### Contrast (`--contrast-*`)

Used for high-contrast UI elements (e.g., inverted backgrounds, menu borders):

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--contrast-bg-base` | `rgba(24, 24, 27, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-contrast-bg-base` |
| `--contrast-bg-base-hover` | `rgba(39, 39, 42, 1)` | `rgba(63, 63, 70, 1)` | `bg-ui-contrast-bg-base-hover` |
| `--contrast-bg-base-pressed` | `rgba(63, 63, 70, 1)` | `rgba(82, 82, 91, 1)` | `bg-ui-contrast-bg-base-pressed` |
| `--contrast-bg-subtle` | `rgba(39, 39, 42, 1)` | `rgba(255, 255, 255, 0.04)` | `bg-ui-contrast-bg-subtle` |
| `--contrast-fg-primary` | `rgba(255, 255, 255, 0.88)` | `rgba(255, 255, 255, 0.88)` | `text-ui-contrast-fg-primary` |
| `--contrast-fg-secondary` | `rgba(255, 255, 255, 0.56)` | `rgba(255, 255, 255, 0.56)` | `text-ui-contrast-fg-secondary` |
| `--contrast-border-base` | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.16)` | `border-ui-contrast-border-base` |
| `--contrast-border-top` | `rgba(24, 24, 27, 1)` | `rgba(33, 33, 36, 1)` | `border-ui-contrast-border-top` |
| `--contrast-border-bot` | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.08)` | `border-ui-contrast-border-bot` |

### Alpha / Opacity (`--alpha-*`)

| CSS variable | Value | Tailwind class |
|---|---|---|
| `--alpha-250` | `rgba(24, 24, 27, 0.1)` light / `rgba(255, 255, 255, 0.1)` dark | `text-ui-alpha-250`, `bg-ui-alpha-250` |
| `--alpha-400` | `rgba(24, 24, 27, 0.24)` light / `rgba(255, 255, 255, 0.24)` dark | `text-ui-alpha-400`, `bg-ui-alpha-400` |

---

## Shadow / Box-Shadow Tokens

The preset extends `theme.extend.boxShadow` with named shadow tokens. These are used via standard Tailwind `shadow-*` classes:

| Token | Usage |
|---|---|
| `borders-base` | Default border shadow (used by `Input`, `Radio`, etc.) |
| `borders-strong-with-shadow` | Stronger border + shadow |
| `borders-interactive` | Interactive element shadow |
| `borders-interactive-with-focus` | Interactive element with focus ring |
| `borders-interactive-with-shadow` | Interactive element with shadow |
| `borders-interactive-with-active` | Interactive element with active ring |
| `borders-error` | Error state border |
| `borders-focus` | Focus ring |
| `elevation-card-rest` | Card default elevation |
| `elevation-card-hover` | Card hover elevation |
| `elevation-flyout` | Flyout/dropdown elevation |
| `elevation-tooltip` | Tooltip elevation |
| `elevation-modal` | Modal elevation |
| `elevation-code-block` | Code block elevation |
| `elevation-commandbar` | Command bar elevation |
| `buttons-neutral` | Neutral button shadow |
| `buttons-neutral-focus` | Neutral button focus ring |
| `buttons-danger` | Danger button shadow |
| `buttons-danger-focus` | Danger button focus ring |
| `buttons-inverted` | Inverted/primary button shadow |
| `buttons-inverted-focus` | Inverted/primary button focus ring |
| `buttons-transparent` | Transparent button shadow |
| `buttons-transparent-hover` | Transparent button hover shadow |
| `buttons-transparent-pressed` | Transparent button pressed shadow |
| `details-contrast-on-bg-interactive` | Detail contrast on interactive bg |
| `details-switch-handle` | Switch handle shadow |
| `details-switch-background` | Switch track shadow |
| `details-switch-background-focus` | Switch track focus shadow |

---

## Typography: Two Systems

There are **two** typography systems in this storefront. They are **not** interchangeable.

### 1. Preset `txt-*` classes (from `@medusajs/ui-preset`)

These are registered globally by the preset via `addComponents(typography)`. They use the Inter font family and are the **preferred** classes for Medusa UI consistency.

| Class | Font size | Line height | Weight |
|---|---|---|---|
| `txt-xsmall` | 12px | 19.2px | 400 |
| `txt-xsmall-plus` | 12px | 19.2px | 500 |
| `txt-small` | 13px | 20.8px | 400 |
| `txt-small-plus` | 13px | 20.8px | 500 |
| `txt-medium` | 14px | 22.4px | 400 |
| `txt-medium-plus` | 14px | 22.4px | 500 |
| `txt-large` | 16px | 25.6px | 400 |
| `txt-large-plus` | 16px | 25.6px | 500 |
| `txt-compact-xsmall` | 12px | 20px | 400 |
| `txt-compact-xsmall-plus` | 12px | 20px | 500 |
| `txt-compact-small` | 13px | 20px | 400 |
| `txt-compact-small-plus` | 13px | 20px | 500 |
| `txt-compact-medium` | 14px | 20px | 400 |
| `txt-compact-medium-plus` | 14px | 20px | 500 |
| `txt-compact-large` | 16px | 20px | 400 |
| `txt-compact-large-plus` | 16px | 20px | 500 |
| `txt-compact-xlarge` | 18px | 20px | 400 |
| `txt-compact-xlarge-plus` | 18px | 20px | 500 |
| `txt-xlarge` | 18px | 28.8px | 400 |
| `txt-xlarge-plus` | 18px | 28.8px | 500 |

Plus heading classes: `.h1-webs` (4rem/500), `.h2-webs` (3.5rem/500), `.h3-webs` (2.5rem/500), `.h4-webs` (1.5rem/500), `.h1-core` (1.125rem/500), `.h2-core` (1rem/500), `.h3-core` (0.875rem/500), `.h1-docs` (1.5rem/500), `.h2-docs` (1.125rem/500), `.h3-docs` (1rem/500), `.h4-docs` (0.875rem/500).

And code classes: `.code-label` (0.75rem/400), `.code-label-plus` (0.75rem/500), `.code-paragraph` (0.75rem/400), `.code-paragraph-plus` (0.75rem/500) — all using `Roboto Mono`.

**Where used**: `pagination`, `filter-radio-group`, `cart-totals`, `checkout layout`, `common/input`, `common/checkbox`, `common/ui/Text` component, etc.

### 2. Local `text-*-regular` / `text-*-semi` classes (from `globals.css`)

These are defined in `@layer components` in `src/styles/globals.css`. They use Tailwind's `@apply` and are mapped to arbitrary pixel values:

| Class | Font size | Line height | Weight | Tailwind equivalent |
|---|---|---|---|---|
| `text-xsmall-regular` | 10px | 16 | normal | `text-[10px] leading-4 font-normal` |
| `text-small-regular` | 12px | 20 | normal | `text-xs leading-5 font-normal` |
| `text-small-semi` | 12px | 20 | semibold | `text-xs leading-5 font-semibold` |
| `text-base-regular` | 14px | 24 | normal | `text-sm leading-6 font-normal` |
| `text-base-semi` | 14px | 24 | semibold | `text-sm leading-6 font-semibold` |
| `text-large-regular` | 16px | 24 | normal | `text-base leading-6 font-normal` |
| `text-large-semi` | 16px | 24 | semibold | `text-base leading-6 font-semibold` |
| `text-xl-regular` | 24px | 36 | normal | `text-2xl leading-[36px] font-normal` |
| `text-xl-semi` | 24px | 36 | semibold | `text-2xl leading-[36px] font-semibold` |
| `text-2xl-regular` | 30px | 48 | normal | `text-[30px] leading-[48px] font-normal` |
| `text-2xl-semi` | 30px | 48 | semibold | `text-[30px] leading-[48px] font-semibold` |
| `text-3xl-regular` | 32px | 44 | normal | `text-[32px] leading-[44px] font-normal` |
| `text-3xl-semi` | 32px | 44 | semibold | `text-[32px] leading-[44px] font-semibold` |

**Where used**: Page headings, not-found pages, account loading, cart not-found, etc.

### When to use which

| Scenario | Use |
|---|---|
| Inside `@medusajs/ui` components (`Text`, `Heading`) | Preset `txt-*` classes (they're the default) |
| Custom headings / page titles | Local `text-*-semi` classes |
| Form labels, helper text | Preset `txt-compact-*` classes |
| Legacy page headings | Local `text-*-semi` classes (already in use) |

**Rule**: Do **not** mix `txt-medium` with `text-base-regular` on the same element. They have different font sizes (14px vs 14px but different line heights: 22.4px vs 24px) and different font-weight defaults (400 vs normal, which is equivalent but the line-height difference matters).

---

## Global Stylesheet

**File**: `apps/storefront/src/styles/globals.css`  
**Imported by**: `apps/storefront/src/app/layout.tsx` (`import "styles/globals.css"`)

```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

@layer utilities {
  /* Chrome, Safari and Opera */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .no-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  input:focus ~ label,
  input:not(:placeholder-shown) ~ label {
    @apply -translate-y-2 text-xsmall-regular;
  }

  input:focus ~ label {
    @apply left-0;
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus,
  select:-webkit-autofill,
  select:-webkit-autofill:hover,
  select:-webkit-autofill:focus {
    border: 1px solid #212121;
    -webkit-text-fill-color: #212121;
    -webkit-box-shadow: 0 0 0px 1000px #fff inset;
    transition: background-color 5000s ease-in-out 0s;
  }

  input[type="search"]::-webkit-search-decoration,
  input[type="search"]::-webkit-search-cancel-button,
  input[type="search"]::-webkit-search-results-button,
  input[type="search"]::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }
}

@layer components {
  .content-container {
    @apply max-w-[1440px] w-full mx-auto px-6;
  }

  .contrast-btn {
    @apply px-4 py-2 border border-black rounded-full hover:bg-black hover:text-white transition-colors duration-200 ease-in;
  }

  .text-xsmall-regular {
    @apply text-[10px] leading-4 font-normal;
  }

  .text-small-regular {
    @apply text-xs leading-5 font-normal;
  }

  .text-small-semi {
    @apply text-xs leading-5 font-semibold;
  }

  .text-base-regular {
    @apply text-sm leading-6 font-normal;
  }

  .text-base-semi {
    @apply text-sm leading-6 font-semibold;
  }

  .text-large-regular {
    @apply text-base leading-6 font-normal;
  }

  .text-large-semi {
    @apply text-base leading-6 font-semibold;
  }

  .text-xl-regular {
    @apply text-2xl leading-[36px] font-normal;
  }

  .text-xl-semi {
    @apply text-2xl leading-[36px] font-semibold;
  }

  .text-2xl-regular {
    @apply text-[30px] leading-[48px] font-normal;
  }

  .text-2xl-semi {
    @apply text-[30px] leading-[48px] font-semibold;
  }

  .text-3xl-regular {
    @apply text-[32px] leading-[44px] font-normal;
  }

  .text-3xl-semi {
    @apply text-[32px] leading-[44px] font-semibold;
  }
}
```

---

## Tailwind Configuration

**File**: `apps/storefront/tailwind.config.js`

```js
const path = require("path")

module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      colors: {
        grey: {
          0: "#FFFFFF",
          5: "#F9FAFB",
          10: "#F3F4F6",
          20: "#E5E7EB",
          30: "#D1D5DB",
          40: "#9CA3AF",
          50: "#6B7280",
          60: "#4B5563",
          70: "#374151",
          80: "#1F2937",
          90: "#111827",
        },
      },
      borderRadius: {
        none: "0px",
        soft: "2px",
        base: "4px",
        rounded: "8px",
        large: "16px",
        circle: "9999px",
      },
      maxWidth: {
        "8xl": "100rem",
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      fontSize: {
        "3xl": "2rem",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Ubuntu",
          "sans-serif",
        ],
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "fade-in-top": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out-top": {
          "0%": {
            height: "100%",
          },
          "99%": {
            height: "0",
          },
          "100%": {
            visibility: "hidden",
          },
        },
        "accordion-slide-up": {
          "0%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          "100%": {
            height: "0",
            opacity: "0",
          },
        },
        "accordion-slide-down": {
          "0%": {
            "min-height": "0",
            "max-height": "0",
            opacity: "0",
          },
          "100%": {
            "min-height": "var(--radix-accordion-content-height)",
            "max-height": "none",
            opacity: "1",
          },
        },
        enter: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.9)", opacity: 0 },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right":
          "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top":
          "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "accordion-open":
          "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close":
          "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
```

---

## Where to Edit What (Quick Reference for AI)

| Want to change... | Edit this file |
|---|---|
| Global layout width / padding | `src/styles/globals.css` → `.content-container` |
| Local typography scale | `src/styles/globals.css` → `@layer components` → `.text-*-regular` / `.text-*-semi` |
| Floating label behavior | `src/styles/globals.css` → `input:focus ~ label` |
| Autofill border/color | `src/styles/globals.css` → `input:-webkit-autofill` |
| Search input decoration | `src/styles/globals.css` → `input[type="search"]` |
| Custom button style | `src/styles/globals.css` → `.contrast-btn` |
| Hide scrollbar | `src/styles/globals.css` → `.no-scrollbar` |
| Custom color (grey scale) | `tailwind.config.js` → `theme.extend.colors` |
| Border radius values | `tailwind.config.js` → `theme.extend.borderRadius` |
| Responsive breakpoints | `tailwind.config.js` → `theme.extend.screens` |
| Font family | `tailwind.config.js` → `theme.extend.fontFamily.sans` |
| Animations (keyframes + names) | `tailwind.config.js` → `theme.extend.keyframes` + `theme.extend.animation` |
| Transition properties | `tailwind.config.js` → `theme.extend.transitionProperty` |
| Dark mode | `tailwind.config.js` → `darkMode: "class"` (toggle `.dark` on `<html>`) |
| Medusa design tokens | `@medusajs/ui-preset` (do NOT edit — override in `tailwind.config.js` if needed) |

---

## Layout Utilities

| Class | CSS | Usage |
|---|---|---|
| `.content-container` | `max-w-[1440px] w-full mx-auto px-6` | Main page wrapper — every page uses this. Commonly combined with `py-6` for vertical padding on listing pages. |
| `.contrast-btn` | `px-4 py-2 border border-black rounded-full hover:bg-black hover:text-white transition-colors duration-200 ease-in` | High-contrast button (used sparingly in account/header contexts) |

---

## Custom Color Palette (Local Only)

Only one custom color is defined locally — `grey`. All Medusa tokens (`text-ui-fg-*`, `bg-ui-bg-*`, etc.) come from `@medusajs/ui-preset`.

| Token | Value | Usage |
|---|---|---|
| `grey.0` | `#FFFFFF` | White |
| `grey.5` | `#F9FAFB` | Lightest grey background |
| `grey.10` | `#F3F4F6` | Light grey background |
| `grey.20` | `#E5E7EB` | Border subtle |
| `grey.30` | `#D1D5DB` | Border base |
| `grey.40` | `#9CA3AF` | Muted text |
| `grey.50` | `#6B7280` | Subtle text |
| `grey.60` | `#4B5563` | Secondary text |
| `grey.70` | `#374151` | Body text |
| `grey.80` | `#1F2937` | Heading text |
| `grey.90` | `#111827` | Darkest text |

**Note**: The local `grey` scale is **not** the same as Medusa's `bg-ui-bg-*` tokens. The preset's `--bg-base` is `#FFFFFF` in light mode and `#212121` in dark mode. Use Medusa tokens for consistent theming; use `grey.*` only for one-off grays that don't need dark mode switching.

---

## Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `none` | `0px` | Sharp corners |
| `soft` | `2px` | Subtle rounding |
| `base` | `4px` | Default |
| `rounded` | `8px` | Cards, buttons |
| `large` | `16px` | Modals, containers |
| `circle` | `9999px` | Pills, avatars |

---

## Responsive Breakpoints

| Alias | Min width | Common usage |
|---|---|---|
| `2xsmall` | 320px | Very small phones |
| `xsmall` | 512px | Large phones |
| `small` | 1024px | Tablet / small desktop (sidebar nav, 2-col layout) |
| `medium` | 1280px | Desktop (3-col product grid) |
| `large` | 1440px | Large desktop |
| `xlarge` | 1680px | Extra large |
| `2xlarge` | 1920px | Full HD |

**Note**: `small:1024px` is the most commonly used breakpoint. It controls the sidebar nav, 2→3→4 column grids, and sticky layouts.

---

## Animations

### Preset animations (from `tailwindcss-animate`)

The preset includes `tailwindcss-animate`, which provides:

| Class | Animation | Duration | Easing |
|---|---|---|---|
| `animate-in` | fade-in + slide-in from top | 200ms | ease-out |
| `animate-out` | fade-out + slide-out to top | 150ms | ease-in |
| `animate-pulse` | pulse | 2s | cubic-bezier(0.4, 0, 0.6, 1) |

Plus `slideInFromTop`, `slideInFromBottom`, `slideInFromLeft`, `slideInFromRight`, `fadeIn`, `fadeOut`, `zoomIn`, `zoomOut`, etc.

### Local custom animations

| Name | Duration | Easing | Usage |
|---|---|---|---|
| `ring` | 2.2s | `cubic-bezier(0.5, 0, 0.5, 1)` infinite | Loading spinner |
| `fade-in-right` | 0.3s | `cubic-bezier(0.5, 0, 0.5, 1)` forwards | Slide-in from right |
| `fade-in-top` | 0.2s | `cubic-bezier(0.5, 0, 0.5, 1)` forwards | Fade in from top |
| `fade-out-top` | 0.2s | `cubic-bezier(0.5, 0, 0.5, 1)` forwards | Collapse height then hide |
| `accordion-open` | 300ms | `cubic-bezier(0.87, 0, 0.13, 1)` forwards | Disclosure expand (uses `accordion-slide-down` keyframe) |
| `accordion-close` | 300ms | `cubic-bezier(0.87, 0, 0.13, 1)` forwards | Disclosure collapse (uses `accordion-slide-up` keyframe) |
| `enter` | 200ms | ease-out | Modal/dialog enter |
| `leave` | 150ms | ease-in forwards | Modal/dialog leave |
| `slide-in` | 1.2s | `cubic-bezier(.41,.73,.51,1.02)` | Notification slide |

### Preset accordion animations

The preset also provides:

| Name | Keyframe | Duration | Easing |
|---|---|---|---|
| `accordion-down` | `accordion-down` | 200ms | ease-out |
| `accordion-up` | `accordion-up` | 200ms | ease-out |

These are separate from the local `accordion-open`/`accordion-close` animations. The preset's versions use `height: 0px` → `height: var(--radix-accordion-content-height)`, while the local versions use `min-height`/`max-height` for a smoother slide.

**Underlying keyframes**: `accordion-slide-up` and `accordion-slide-down` are the raw keyframes; `accordion-open`/`accordion-close` are the named animations that reference them.

---

## Font

**Stack**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Ubuntu`, `sans-serif`

- Defined in `tailwind.config.js` → `theme.extend.fontFamily.sans`.
- The preset's own font stack is `Inter`, `ui-sans-serif`, `system-ui`, ... plus emoji fallbacks. The storefront overrides this with the local `fontFamily.sans` in `tailwind.config.js`.
- No `@font-face` declarations — Inter is loaded from the system or Google Fonts CDN if available.
- No font-weight utilities beyond what the typography classes provide (normal + semibold for local, regular/medium/semibold for preset).
- Mono font: `Roboto Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `Liberation Mono`, `Courier New`, `monospace` (from preset).

---

## `@tailwindcss-radix` Plugin

**File**: `apps/storefront/tailwind.config.js` → `plugins`

```js
plugins: [require("tailwindcss-radix")()],
```

The `tailwindcss-radix` plugin adds variant utilities for styling Radix UI primitives based on their internal state. Used for:

- Accordion item open/closed states (`group-data-[state=open]:`, `group-data-[state=closed]:`)
- Radio group checked/unchecked states (`group-data-[state=checked]:`)
- Other Radix component state variants (`data-[state=open]`, `data-[state=closed]`, etc.)

This is why you see selectors like `group-data-[state=checked]:bg-ui-bg-interactive` in the codebase — these are Radix state variants provided by the plugin.

---

## `tailwindcss-animate` Plugin

Included via the preset's `preset.ts`:
```js
plugins: [plugin, require("tailwindcss-animate")]
```

Provides the `animate-in`, `animate-out`, and related animation utility classes. Not heavily used in the current storefront codebase, but available if needed.

---

## Root Layout

**File**: `apps/storefront/src/app/layout.tsx`

```tsx
<html lang="en" data-mode="light">
  <body>
    <main className="relative">{props.children}</main>
  </body>
</html>
```

- `data-mode="light"` is hardcoded — no dark mode toggle.
- `globals.css` is imported here, making it available to the entire app.
- `metadataBase` is set via `getBaseURL()` for OpenGraph and SEO.

---

## Checkout Layout

**File**: `apps/storefront/src/app/[countryCode]/(checkout)/layout.tsx`

- White background (`bg-white`).
- Top nav bar (`h-16 border-b`) with back-to-cart link and store name.
- Children render in a `<div data-testid="checkout-container">`.
- Footer shows `MedusaCTA` component.
- Intentionally minimal — no global Nav, no `CartDropdown`, no `CartMismatchBanner`.

---

## PostCSS Configuration

**File**: `apps/storefront/postcss.config.js`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Standard PostCSS setup. No custom plugins beyond Tailwind and Autoprefixer.

---

## How to Add New Global Styles

1. **New utility class** → add to `@layer utilities` in `src/styles/globals.css`
2. **New component class** → add to `@layer components` in `src/styles/globals.css`
3. **New design token** → add to `theme.extend` in `tailwind.config.js` (colors, spacing, etc.) **or** add a CSS custom property to the `:root` block in `globals.css` (preferred for e-commerce tokens the preset lacks: `--input-*`, `--price-*`, `--badge-*`, `--btn-primary-*`, `--radius-*`, `--focus-ring`)
4. **New animation** → add both `keyframes` and `animation` entries in `tailwind.config.js`
5. **New breakpoint** → add to `theme.extend.screens` in `tailwind.config.js`
6. **New base reset / heading base / focus ring / motion guard** → add to `@layer base` in `globals.css` (add a `:root { color-scheme: light }` block if tokens are needed — currently absent)
7. **Dark-mode token overrides** → add a `.dark { ... }` block in `globals.css` for any `:root` token introduced in step 3. Do **not** override preset variables.

**Rule**: Do NOT add inline `<style>` tags or CSS-in-JS. All global styles go in `globals.css` or `tailwind.config.js`.

---

## Common Style Edits (AI Quick Reference)

| Goal | Where to edit | Example |
|---|---|---|
| Change page max width | `globals.css` → `.content-container` | `max-w-[1440px]` → `max-w-[1280px]` |
| Change body font | `tailwind.config.js` → `fontFamily.sans` | Replace `"Inter"` with `"Geist"` |
| Add new text size | `globals.css` → `@layer components` | Add `.text-4xl-regular` |
| Change button hover | `globals.css` → `.contrast-btn` | Change `hover:bg-black` to `hover:bg-blue-600` |
| Disable dark mode | `tailwind.config.js` → remove `darkMode` | Or set `darkMode: "false"` |
| Add animation | `tailwind.config.js` → `keyframes` + `animation` | Add `shake` keyframe + `animation.shake` |
| Change breakpoint | `tailwind.config.js` → `screens` | Change `small: "1024px"` to `"900px"` |
| Add custom color | `tailwind.config.js` → `colors` | Add `brand: { 500: "#FF0000" }` |
| Change border radius | `tailwind.config.js` → `borderRadius` | Change `rounded: "8px"` to `"12px"` |
| Hide scrollbar on element | Add `no-scrollbar` class | Already defined in `globals.css` |
| Override preset token | `tailwind.config.js` → `theme.extend.colors.ui` | Override `ui.bg.base.DEFAULT` |
| Use Medusa tag color | Add `bg-ui-tag-green-bg text-ui-tag-green-text` | From preset color tokens |
| Add e-commerce token (badge/price/input) | Add `--price-sale` / `--badge-stock-in` etc. to `:root` in `globals.css` | Preset has no such tokens — extend `:root`, not the preset |
| Add component surface (card/badge/button) | Add `.surface-card` / `.btn-primary` etc. to `@layer components` in `globals.css` | Reference-only classes not in preset or local UI kit |
| Add base heading/reset/motion guard | Add to `@layer base` in `globals.css` | Pair with `:root` token additions |
| Add `rounded-3xl` | Add `"3xl": "1.5rem"` to `borderRadius` in `tailwind.config.js` | Additive — does not touch existing `rounded`/`large` |
| Switch default accent hue | Single-value edit to `--btn-primary-bg`/`--text-accent` in `:root` + `.dark` | No per-component changes; no new JS toggle |

---

## Important Notes

- **Do NOT modify `@medusajs/ui-preset`** — it is a shared, auto-generated package. Override tokens in `tailwind.config.js` instead.
- **Do not add new CSS files** — all global styles live in `src/styles/globals.css`. Component-scoped styles use Tailwind utility classes.
- **Do not use `@apply` in component files** — it only works in `globals.css` where `@layer` is defined.
- **The preset is version-locked to `@medusajs/medusa`** — when upgrading Medusa, also upgrade `@medusajs/ui-preset` and `@medusajs/ui` to matching versions.
- **`tailwindcss-animate` is transitively included** via the preset — no separate install needed.
- **Dark mode is disabled in the UI** — `darkMode: "class"` is configured, but there is no toggle in the storefront. The `<html data-mode="light">` is hardcoded.
- **The `content` array does not include `node_modules/@medusajs/ui`** — this is acceptable because the preset registers its typography classes globally. Add it only if you import custom `@medusajs/ui` components.
- **Do not override `@medusajs/ui-preset` variables** to "match" the LuxeStore reference token-for-token. The preset is version-locked to Medusa v2.20.1 and Medusa UI primitives depend on its exact values. Where a role overlaps, reuse the preset utility (`text-ui-fg-base`, `bg-ui-bg-base`, `border-ui-border-base`). Where the preset has no equivalent, **extend** the `:root` block in `globals.css` with new custom properties — never hijack an existing preset variable name.

---

## Reference Design Language (LuxeStore / Mrbulk Frontend) — Token Mapping & Gap Analysis

A sibling storefront in `ref/modern/Nextjsfrontend` (the "LuxeStore" frontend) shares this project's visual lineage but is built on a **different styling stack**. This section maps that design language onto our Medusa token system so the two can be aligned *without* introducing a parallel theme system.

### Stack comparison (must-read before porting anything)

| | This storefront (Medusa DTC) | Reference (LuxeStore) |
|---|---|---|
| Tailwind | **v3** (`@import "tailwindcss/base"; components; utilities`) | **v4** (`@import "tailwindcss"`) |
| Theme source of truth | `@medusajs/ui-preset` CSS vars injected via `addBase`, extended in `tailwind.config.js` | Semantic CSS custom properties declared in `:root` / `.dark`, plus an `@theme` block |
| Token naming | `--fg-base` → utility `text-ui-fg-base` | `--text-primary` → utility `text-theme-primary` (custom) |
| Token location | Preset injects into `:root`/`.dark`; our `globals.css` adds **no** `:root` block today | All tokens defined in `frontend/src/index.css` `:root` / `.dark` |
| Dark mode | `darkMode: "class"` **configured, but no toggle** — `<html data-mode="light">` is hardcoded in `layout.tsx` | `.dark` class driven by a `beforeInteractive` init script in `layout.tsx` (reads `localStorage.luxestore_dark_mode` / `mrbulk_dark_mode`, falls back to `prefers-color-scheme: dark`) |
| Theme accent | Preset single accent: `--fg-interactive` / `--bg-interactive` (blue `#2563eb`) | Runtime accent via `getThemeClasses(themeColor)` returning class strings for `blue | indigo | emerald | rose | amber | slate`, with runtime CSS-var overrides on the 6 accent tokens |
| Config file | `apps/storefront/tailwind.config.js` | none (v4 auto-config) |

> **Incompatibility warning — do not copy-paste.** The reference's `index.css` uses **Tailwind v4** constructs that are **invalid syntax under our Tailwind v3** build. When porting a token or class, always translate:
> - `@utility name { ... }` → `@layer utilities { .name { @apply ...; } }` in `globals.css`
> - `@theme { --color-x: ... }` → `theme.extend` entry in `tailwind.config.js`
> - `@custom-variant dark (&:where(.dark, .dark *))` → already covered by `darkMode: "class"`
> Do **not** drop the reference's raw `index.css` into `globals.css`; it will not compile.

### Semantic token cross-map (reference → Medusa preset)

For each reference token, the rule is: **use the Medusa preset token where the role overlaps; add a brand-new CSS custom property to the `:root` block in `globals.css` only where the preset has no equivalent.** Never override preset variables — extend the existing `:root` block (which is currently empty in our `globals.css`).

#### Surfaces & canvas

| Reference token (light / dark) | Medusa preset token | Medusa utility class | Action for our storefront |
|---|---|---|---|
| `--bg-canvas` `#fff` / `#020617` | `--bg-base` | `bg-ui-bg-base` | Reuse preset. (Note: preset dark canvas is `#212121` vs reference near-black `#020617` — if matching the reference's near-black canvas is required, this is the one place to override `--bg-base` in `.dark`; prefer reusing the preset value for consistency with Medusa UI.) |
| `--bg-surface` `#fff` / `#1e293b` | `--bg-component` (preset `bg-ui-bg-component`) + `--bg-base` | `bg-ui-bg-component` / `bg-ui-bg-base` | Reuse preset. |
| `--bg-surface-elevated` `#fff` / `#334155` | `--bg-component` | `bg-ui-bg-component` | Reuse preset (preset has no "elevated" variant; map to `--bg-component`). |
| `--bg-surface-subtle` `#f8fafc` / `#1e293b` | `--bg-subtle` | `bg-ui-bg-subtle` | Reuse preset. |
| `--bg-surface-hover` `#f1f5f9` / `#334155` | `--bg-component-hover` | `bg-ui-bg-component-hover` | Reuse preset. |
| `--bg-surface-active` `#e2e8f0` / `#475569` | `--bg-component-pressed` | `bg-ui-bg-component-pressed` | Reuse preset. |
| `--bg-overlay` `rgba(15,23,42,.5)` / `rgba(2,6,23,.75)` | `--bg-overlay` | `bg-ui-bg-overlay` | Reuse preset. |

#### Text & foreground

| Reference token (light / dark) | Medusa preset token | Medusa utility class | Action |
|---|---|---|---|
| `--text-primary` `#0f172a` / `#f8fafc` | `--fg-base` | `text-ui-fg-base` | Reuse preset. |
| `--text-secondary` `#475569` / `#cbd5e1` | `--fg-muted` | `text-ui-fg-muted` | Reuse preset (`--fg-muted` maps to `#71717a`/`#71717a` — close but not identical; reuse rather than override). |
| `--text-muted` `#64748b` / `#94a3b8` | `--fg-subtle` | `text-ui-fg-subtle` | Reuse preset. |
| `--text-subtle` `#94a3b8` / `#64748b` | `--fg-disabled` | `text-ui-fg-disabled` | Reuse preset. |
| `--text-accent` `#2563eb` / `#60a5fa` | `--fg-interactive` | `text-ui-fg-interactive` | Reuse preset. |

#### Borders

| Reference token (light / dark) | Medusa preset token | Medusa utility class | Action |
|---|---|---|---|
| `--border-default` `#e2e8f0` / `#334155` | `--border-base` | `border-ui-border-base` | Reuse preset. |
| `--border-subtle` `#f1f5f9` / `#1e293b` | (preset has no subtle separator) | — | **Add** to `:root` (or reuse `--border-base` at reduced opacity via Tailwind `border-black/10`). Prefer reusing preset `border-ui-border-base` for consistency. |
| `--border-strong` `#cbd5e1` / `#475569` | `--border-strong` | `border-ui-border-strong` | Reuse preset. |
| `--border-interactive` `#94a3b8` / `#64a5fa` | `--border-interactive` | `border-ui-border-interactive` | Reuse preset. |
| `--border-focus` `#2563eb` / `#3b82f6` | `--border-interactive` (preset uses `--border-interactive` for focus, value `#3b82f6`) | `border-ui-border-interactive` | Reuse preset for focus ring. |

#### Form / input tokens (preset has none — add to `:root`)

These tokens **do not exist in the Medusa preset** and must be added to the `:root` / `.dark` blocks in `globals.css`:

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--input-bg` | `#ffffff` | `#1e293b` | Input background |
| `--input-bg-subtle` | `#f8fafc` | `#334155` | Subtle field bg |
| `--input-border` | `#cbd5e1` | `#334155` | Default input border |
| `--input-border-hover` | `#94a3b8` | `#475569` | Hover border |
| `--input-border-focus` | `#2563eb` | `#3b82f6` | Focus border |
| `--input-text` | `#0f172a` | `#f8fafc` | Input text color |
| `--input-placeholder` | `#94a3b8` | `#64748b` | Placeholder color |
| `--input-ring` | `rgba(37,99,235,.2)` | `rgba(59,130,246,.3)` | Focus ring (matches `--border-focus`) |
| `--input-ring-error` | `rgba(225,29,72,.2)` | `rgba(244,63,94,.3)` | Error focus ring |

> These map directly onto the reference `index.css`. Our storefront's `Input` floating-label rule already relies on a focus state — wiring these tokens gives the reference's smooth border + ring transition without touching component code.

#### Button, badge, pricing, stock, geometry tokens (preset has none — add to `:root`)

| Token | Light | Dark | Maps to reference class |
|---|---|---|---|
| `--btn-primary-bg` | `#1d4ed8` | `#2563eb` | `.btn-primary` |
| `--btn-primary-text` | `#ffffff` | `#ffffff` | `.btn-primary` |
| `--btn-primary-hover` | `#1e40af` | `#3b82f6` | `.btn-primary:hover` |
| `--btn-primary-active` | `#172554` | `#1d4ed8` | `.btn-primary:active` |
| `--btn-secondary-bg` | `#f1f5f9` | `#334155` | `.btn-secondary` |
| `--btn-secondary-text` | `#0f172a` | `#f8fafc` | `.btn-secondary` |
| `--btn-secondary-border` | `#e2e8f0` | `#475569` | `.btn-secondary` |
| `--price-primary` | `#0f172a` | `#f8fafc` | `.price-tag` |
| `--price-sale` | `#e11d48` | `#fb7185` | `.price-sale` |
| `--price-original` | `#94a3b8` | `#94a3b8` | `.price-original` |
| `--badge-sale-bg` | `#ffe4e6` | `rgba(225,29,72,.25)` | `.badge-sale` / `.price-discount-pill` |
| `--badge-sale-text` | `#be123c` | `#fda4af` | `.badge-sale` / `.price-discount-pill` |
| `--badge-new-bg` | `#dbeafe` | `rgba(37,99,235,.25)` | `.badge-new` |
| `--badge-new-text` | `#1d4ed8` | `#93c5fd` | `.badge-new` |
| `--badge-stock-in` | `#059669` | `#34d399` | `.stock-dot-in` / `.badge-success` |
| `--badge-stock-low` | `#d97706` | `#fbbf24` | `.stock-dot-low` / `.badge-warning` |
| `--badge-stock-out` | `#e11d48` | `#f87171` | `.stock-dot-out` / `.badge-danger` |
| `--rating-star` | `#f59e0b` | `#fbbf24` | Rating stars |
| `--radius-sm` | `0.5rem` | — | Shared |
| `--radius-md` | `0.75rem` | — | Shared |
| `--radius-lg` | `1rem` | — | Shared |
| `--radius-xl` | `1.25rem` | — | Shared (add `3xl: 24px`? no — see below) |
| `--radius-2xl` | `1.5rem` | — | Shared |
| `--radius-full` | `9999px` | — | = preset `circle: 9999px` |
| `--focus-ring` | `rgba(37,99,235,.4)` | `rgba(59,130,246,.5)` | Global `:focus-visible` |

> **Border-radius scale:** the reference uses `--radius-sm/md/lg/xl/2xl` (4×/6×/8×/10×/12×/16px) plus full. Our preset `borderRadius` is `none/soft/base/rounded/large/circle`. To support the reference's `rounded-2xl` (8px) / `rounded-3xl` (24px) vocabulary used by `PageBanner`/`rounded-3xl`, extend our `tailConfig.borderRadius` with `"3xl": "1.5rem"` — do **not** rename existing tokens (the local UI kit and Medusa components use `rounded`/`large`). Add `3xl` as a purely additive entry.

#### Accent / theme-color system

The reference's `getThemeClasses()` returns Tailwind class strings for six hues (`blue`, `indigo`, `emerald`, `rose`, `amber`, `slate`) and, on mount, **overrides six CSS variables at runtime** via `theme-provider.tsx`:
`--text-accent`, `--border-focus`, `--btn-primary-bg`, `--focus-ring`, `--input-ring`, `--badge-new-bg`, `--badge-new-text`.

This runtime override is a **component feature** (`theme-provider.tsx`, mounted in `layout.tsx`), **not** a global-style rule. Per scope ("no new features such as darkmode"), we do **not** add the runtime toggle. Instead:

- The **default accent** in our storefront is already blue via the Medusa preset (`--fg-interactive` = `#3b82f6` / `--bg-interactive`).
- To let shared components adopt the reference's accent vocabulary, **add the seven accent tokens above to `:root`** with the reference's **blue** (`--btn-primary-bg: #1d4ed8`) values as the default. Components then consume `var(--btn-primary-bg)` etc. directly. Swapping the default hue later is a **single-point global edit** in the `:root` block (and the matching `.dark` line) — no per-component changes and no new JS module required.
- If per-page accent variation is ever needed, it is achieved by overriding those same `:root` variables in a scoped selector (e.g. `html[data-theme="emerald"] { --btn-primary-bg: #059669; ... }`) — this extends the existing `:root` mechanism, **not** a new theme type.

### Global component surfaces & utility classes

These classes are now defined in `globals.css` (`@layer components` for surfaces/buttons/badges, `@layer utilities` for helpers) referencing Medusa preset vars and local `:root` tokens.

| Reference class | Status in our storefront |
|---|---|
| `.surface-card`, `.surface-card-hover` | Implemented in `@layer components` |
| `.surface-elevated` | Implemented in `@layer components` |
| `.surface-subtle` | Implemented in `@layer components` |
| `.surface-glass` | Implemented in `@layer components` (with `.dark` variant) |
| `.card-base`, `.card-container`, `.card-interactive` | Implemented in `@layer components` |
| `.card-subtle`, `.card-elevated` | Implemented in `@layer components` |
| `.modal-surface`, `.dialog-container` | Implemented in `@layer components` |
| `.drawer-surface`, `.sheet-container` | Implemented in `@layer components` |
| `.popover-surface`, `.dropdown-menu-surface` | Implemented in `@layer components` |
| `.sticky-bar-surface`, `.action-bar-surface` | Implemented in `@layer components` |
| `.sidebar-panel-surface`, `.filter-panel-surface` | **Inline Tailwind utilities** (account sidebar only) — `bg-white border border-ui-border-base rounded-3xl p-3 sm:p-4 shadow-elevation-card-rest` |
| `.product-card-surface`, `.product-image-container` | Implemented in `@layer components` |
| `.checkout-step-surface`, `.order-summary-surface` | **Inline Tailwind utilities** (account dashboard only) — `bg-white border border-ui-border-base rounded-3xl p-6 shadow-elevation-card-rest` |
| `.navbar-surface`, `.header-surface`, `.footer-surface` | Implemented in `@layer components` |
| `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-danger` | Implemented in `@layer components` |
| `.btn-sm`, `.btn-lg`, `.btn-icon`, `.btn-icon-circle` | Implemented in `@layer components` |
| `.badge`, `.badge-sale`, `.badge-new`, `.badge-success`, `.badge-warning`, `.badge-danger` | Implemented in `@layer components` |
| `.stock-dot-*` | Implemented in `@layer components` |
| `.price-tag`, `.price-sale`, `.price-original`, `.price-discount-pill` | Implemented in `@layer components` |
| `.tab-pill-active`, `.tab-pill-inactive`, `.tab-underline-active` | Implemented in `@layer components` |
| `.input-control`, `.form-label`, `.form-helper-text`, `.form-error-text` | Implemented in `@layer components` |
| `.table-container`, `.table-row-surface` | Implemented in `@layer components` |
| `.tooltip-surface`, `.toast-surface` | Implemented in `@layer components` |
| `.scrollbar-thin`, `.scrollbar-none` | Implemented in `@layer utilities` (`.scrollbar-thin` includes `.dark` variant) |
| `.divider`, `.divider-subtle`, `.divider-strong` | Implemented in `@layer utilities` |
| `.icon-box`, `.icon-base` | Implemented in `@layer utilities` / `@layer components` |
| `.badge-neutral` | Implemented in `@layer components` |
| `.bg-card-translucent`, `.bg-card-translucent-strong` | Implemented in `@layer utilities` |
| `.hover-border-card:hover` | Implemented in `@layer utilities` |
| `.bg-canvas` | Implemented in `@layer utilities` |
| `.bg-surface` | Implemented in `@layer utilities` |
| `.bg-surface-elevated` | Implemented in `@layer utilities` |
| `.bg-surface-subtle` | Implemented in `@layer utilities` |
| `.bg-surface-hover:hover` | Implemented in `@layer utilities` |
| `.bg-overlay` | Implemented in `@layer utilities` |
| `.bg-surface-active` | Implemented in `@layer utilities` |
| `.text-theme-secondary` | Implemented in `@layer utilities` |
| `.text-theme-muted` | Implemented in `@layer utilities` |
| `.text-theme-accent` | Implemented in `@layer utilities` |
| `.text-primary` | Implemented in `@layer utilities` |
| `.text-muted` | Implemented in `@layer utilities` |
| `.text-secondary` | Implemented in `@layer utilities` |
| `.border-default` | Implemented in `@layer utilities` |
| `.border-subtle` | Implemented in `@layer utilities` |
| `.border-theme-subtle` | Implemented in `@layer utilities` |
| `.border-theme-strong` | Implemented in `@layer utilities` |
| `.bg-elevated` | Implemented in `@layer utilities` |

**Rule of precedence:** before adding any class above, check whether the **local UI kit** (`modules/common/components/ui/index.tsx`) already satisfies the role:
- `Button` → covers primary/secondary/transparent; gaps are `outline`, `ghost`, `danger`, `.btn-icon-circle`, size variants → add those as **global** classes in `globals.css` so the kit and raw markup share one button language.
- `Badge` → covers green/red/blue/orange/grey/purple; gaps are `sale`, `new`, `success`, `warning`, `danger`, `stock-dot-*` → add as global classes.
- `Text` / `Heading` → already bridge the preset `txt-*` scale; keep using them inside Medusa UI primitives and for page headings use the local `text-*-semi` scale.

### Base-level foundations (in `@layer base` / `:root`)

The reference's `@layer base` and `:root` supply a base reset. Our storefront now includes these in `globals.css`:

| Concern | Status |
|---|---|
| `*, *::before, *::after { box-sizing:border-box }` | Implemented in `@layer base` |
| `color-scheme` on `:root`/`.dark` | Implemented in `:root` / `.dark` blocks |
| `html { font-smoothing, text-rendering, font-feature-settings, scroll-behavior, tap-highlight }` | Implemented in `@layer base` |
| `body { background, color, line-height, min-height }` | Implemented in `@layer base` |
| `::selection { background, color }` | Implemented in `@layer base` |
| Global `h1`–`h6` base (clamp, letter-spacing, weight, line-height) | Implemented in `@layer base` |
| Global `p`, `b`, `strong`, `a`, `code`, `kbd`, `small` base | Implemented in `@layer base` |
| `:focus-visible { outline, outline-offset }` | Implemented in `@layer base` |
| Global `button` reset and disabled state | Implemented in `@layer base` |
| Global `input[type="*"]`, `textarea`, `select` styles | Implemented in `@layer base` |
| Input placeholder, hover, focus, disabled states | Implemented in `@layer base` |
| Checkbox, radio, range slider | Implemented in `@layer base` |
| `label` base styles | Implemented in `@layer base` |
| `svg.lucide`, `.icon-base`, `hr` | Implemented in `@layer base` |

### Missing global-styling features the reference does **not** provide (creative additions for consistency & accessibility)

These go beyond copying the reference — they harden the global style foundation:

1. **Reduced-motion guard.** Neither site has `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` in global CSS. The reference ships `ring`/`accordion`/`fade` animations but no motion-safety. Add this to `:root`/base so motion-sensitive users aren't subjected to the preset's `animate-in` / our `fade-in-*` / `accordion-*` / `ring` spinner.
2. **Screen-reader-only utility (`.visually-hidden` / `.sr-only`).** Neither site defines this globally. Add it to `@layer utilities` — required for icon-only buttons (e.g. the variant `X` close button, mobile-nav toggles) to be accessible without the JS-only `aria-label` hack.
3. **`text-wrap: balance` on `h1`–`h3`.** Neither site uses it. Add via `@layer base` for cleaner responsive heading wrapping (modern browsers).
4. **`scroll-margin-top` for in-page anchor targets.** The reference sets `html { scroll-behavior: smooth }` but provides no scroll margin, so anchor jumps under the sticky header are clipped. Add `:target { scroll-margin-top: 4rem; }` (or on `h1`/`h2`/`[id]`) — a pure global fix that pairs with smooth-scroll.
5. **Standardized reduced-data image placeholder.** Neither site ships a global aspect-ratio placeholder for lazy images. Add a `.image-container` utility with `aspect-w-16 aspect-h-9` (or `aspect-[4/3]`) so product/masonry images reserve space before load — prevents CLS, the reference's single biggest layout-shift source on the home hero carousel.

### Where to edit what

| Want to change... | Edit this file |
|---|---|
| Global layout width / padding | `src/styles/globals.css` → `.content-container` |
| Local typography scale | `src/styles/globals.css` → `@layer components` → `.text-*-regular` / `.text-*-semi` |
| Floating label behavior | `src/styles/globals.css` → `input:focus ~ label` |
| Autofill border/color | `src/styles/globals.css` → `input:-webkit-autofill` |
| Search input decoration | `src/styles/globals.css` → `input[type="search"]` |
| Custom button style | `src/styles/globals.css` → `.contrast-btn` |
| Hide scrollbar | `src/styles/globals.css` → `.no-scrollbar` |
| Custom color (grey scale) | `tailwind.config.js` → `theme.extend.colors` |
| Border radius values | `tailwind.config.js` → `theme.extend.borderRadius` |
| Responsive breakpoints | `tailwind.config.js` → `theme.extend.screens` |
| Font family | `tailwind.config.js` → `theme.extend.fontFamily.sans` |
| Animations (keyframes + names) | `tailwind.config.js` → `theme.extend.keyframes` + `theme.extend.animation` |
| Transition properties | `tailwind.config.js` → `theme.extend.transitionProperty` |
| Dark mode | `tailwind.config.js` → `darkMode: "class"` (toggle `.dark` on `<html>`) |
| Medusa design tokens | `@medusajs/ui-preset` (do NOT edit — override in `tailwind.config.js` if needed) |
| Global component surfaces / buttons / badges / tabs / inputs | `src/styles/globals.css` → `@layer components` |
| Global base reset / headings / form controls / icons | `src/styles/globals.css` → `@layer base` |
| Shorthand utilities (divider, scrollbar, icon-box) | `src/styles/globals.css` → `@layer utilities` |
