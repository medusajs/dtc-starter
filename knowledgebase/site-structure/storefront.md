# Storefront Structure

## Overview
- **Framework**: Next.js 15.5.21 with App Router (Turbopack dev)
- **React**: 19.0.5
- **Package Manager**: pnpm 11.22.0
- **Location**: `apps/storefront/`
- **Package name**: `@dtc/storefront` v1.0.3
- **Type**: Stock `@medusajs/nextjs-starter` (upstream)

Both `@medusajs/ui-preset` (Tailwind design tokens) AND a **hand-rolled local UI kit** in `src/modules/common/components/ui/` ship in this codebase. The starter includes `Text`, `Heading`, `Button`, `Container`, `Badge`, `IconBadge`, `IconButton`, `Label`, `Input`, `Table` (compound), `RadioGroup` (compound), `Checkbox`, `clx` — all `forwardRef` components using `clsx` and the Medusa tokens. The kit was **not** removed in this install (unlike the customized `medusajstore/myshop` install that explicitly removed it).

## Directory Layout

```
apps/storefront/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout
│   │   ├── [countryCode]/
│   │   │   ├── layout.tsx              # Region-aware root layout
│   │   │   ├── (main)/                 # Main storefront chrome (Nav + Footer)
│   │   │   │   ├── page.tsx            # Home
│   │   │   │   ├── store/page.tsx      # Product listing
│   │   │   │   ├── products/[handle]/page.tsx
│   │   │   │   ├── collections/[handle]/page.tsx
│   │   │   │   ├── categories/[...category]/page.tsx
│   │   │   │   ├── cart/{page,loading,not-found}.tsx
│   │   │   │   ├── account/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   ├── @dashboard/{page,profile,orders,addresses}.tsx
│   │   │   │   │   ├── @dashboard/orders/details/[id]/page.tsx
│   │   │   │   │   └── @login/page.tsx
│   │   │   │   ├── order/[id]/confirmed/{page,loading}.tsx
│   │   │   │   ├── order/[id]/transfer/[token]/{page,accept/page,decline/page}.tsx
│   │   │   │   ├── verify-account/page.tsx
│   │   │   │   └── not-found.tsx
│   │   │   └── (checkout)/checkout/page.tsx
│   │   └── api/
│   │       └── payment-return/route.ts # Stripe return handler
│   ├── modules/
│   │   ├── common/        # Shared icons, components, templates
│   │   ├── layout/        # Nav, Footer, cart chrome
│   │   ├── account/       # Account dashboard
│   │   ├── cart/          # Cart
│   │   ├── categories/    # Category pages
│   │   ├── checkout/      # Checkout flow
│   │   ├── collections/   # Collection pages
│   │   ├── home/          # Hero + FeaturedProducts
│   │   ├── order/         # Order confirmation
│   │   ├── products/      # Product listing + PDP
│   │   ├── shipping/      # Shipping options
│   │   ├── skeletons/     # Loading skeletons
│   │   └── store/         # Store listing
│   ├── lib/
│   │   ├── config.ts              # Medusa JS SDK setup
│   │   ├── constants.tsx          # Payment info, currency helpers
│   │   ├── context/               # React contexts
│   │   ├── data/                  # Server actions (cart, customer, products, …)
│   │   ├── hooks/                 # Custom hooks
│   │   └── util/                  # Utility functions
│   ├── types/
│   │   ├── global.ts
│   │   └── icon.ts
│   ├── styles/globals.css         # Global styles (Tailwind v3 imports)
│   └── middleware.ts              # Region detection + cache-id cookie
├── public/
├── .env.local
├── .env.template
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── next-sitemap.js
└── package.json
```

## Routing

See [storefront-routing.md](./storefront-routing.md) for the full routing reference: localized URL prefix, middleware, route groups, parallel routes, routes inventory, loading states, not-found pages, server vs client component map, and `generateStaticParams` usage.

## Global Styles

### globals.css
- **Location**: `src/styles/globals.css`
- Tailwind v3 directives (`@import "tailwindcss/base"; components; utilities`)
- Defines utility classes: `.content-container` (`max-w-[1440px] mx-auto px-6`), `.contrast-btn`
- Typography component classes: `text-xsmall-regular` … `text-3xl-semi`
- Autofill overrides, `.no-scrollbar`, floating-label input support

### tailwind.config.js
```js
module.exports = {
  presets: [require("@medusajs/ui-preset")],
  darkMode: "class",
  content: [
    "src/app/**",
    "src/pages/**",
    "src/components/**",
    "src/modules/**"
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",   // includes margin so transition-w-{N} works
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      colors: { grey: { 0:"#ffffff", 10:"#f6f6f6", … 90 } },
      borderRadius: { none:"0", soft:"2px", base:"4px", rounded:"8px", large:"16px", circle:"9999px" },
      maxWidth: { "8xl": "100rem" },
      screens: { "2xsmall":"320px", xsmall:"512px", small:"1024px", medium:"1280px", large:"1440px", xlarge:"1680px", "2xlarge":"1920px" },
      fontFamily: { sans: ["Inter", …] },
    },
  },
  plugins: [require("tailwindcss-radix")],
}
```

### Design Tokens (from `@medusajs/ui-preset`)
Available as Tailwind utilities:
- Text: `text-ui-fg-base`, `text-ui-fg-subtle`, `text-ui-fg-interactive`, `text-ui-fg-on-color`, `text-ui-fg-disabled`, `text-ui-fg-error`, `text-ui-fg-on-inverted`
- Background: `bg-ui-bg-base`, `bg-ui-bg-subtle`, `bg-ui-bg-component`, `bg-ui-bg-overlay`, `bg-ui-bg-field`, `bg-ui-bg-highlight`, `bg-ui-bg-interactive`, `bg-ui-bg-hover`, `bg-ui-bg-pressed`
- Border: `border-ui-border-base`, `border-ui-border-strong`, `border-ui-border-transparent`, `border-ui-border-interactive`, `border-ui-border-error`, `border-ui-border-danger`, `border-ui-border-menu-top`, `border-ui-border-menu-bot`
- Buttons: `bg-ui-button-neutral`, `bg-ui-button-pressed`, `bg-ui-button-hover`, `bg-ui-button-danger`, `bg-ui-button-inverted`
- Tags: `bg-ui-tag-{green,red,blue,orange,purple,neutral}-{bg,border,text,icon}`, `bg-ui-tag-*-bg-hover`
- Dark mode toggled by `.dark` class on `<html>` (no toggle UI is implemented in the storefront)

## Key Pages

| Route | File | Purpose |
|---|---|---|
| `/` | `(main)/page.tsx` | Home — Hero + FeaturedProducts |
| `/store` | `(main)/store/page.tsx` | Product listing with sorting/filtering |
| `/products/[handle]` | `(main)/products/[handle]/page.tsx` | Product detail |
| `/collections/[handle]` | `(main)/collections/[handle]/page.tsx` | Collection page |
| `/categories/[...category]` | `(main)/categories/[...category]/page.tsx` | Category page |
| `/cart` | `(main)/cart/page.tsx` | Cart page |
| `/account` | `(main)/account/page.tsx` | Account dashboard (parallel routes) |
| `/account/profile` | `@dashboard/profile/page.tsx` | Profile |
| `/account/orders` | `@dashboard/orders/page.tsx` | Orders |
| `/account/orders/details/[id]` | `@dashboard/orders/details/[id]/page.tsx` | Order detail |
| `/account/addresses` | `@dashboard/addresses/page.tsx` | Addresses |
| `/order/[id]/confirmed` | `order/[id]/confirmed/page.tsx` | Order confirmation |
| `/order/[id]/transfer/[token]` | `order/[id]/transfer/[token]/page.tsx` | Transfer request |
| `/order/[id]/transfer/[token]/accept` | …/accept/page.tsx | Accept transfer |
| `/order/[id]/transfer/[token]/decline` | …/decline/page.tsx | Decline transfer |
| `/verify-account` | `(main)/verify-account/page.tsx` | Email verification |
| `/checkout` | `(checkout)/checkout/page.tsx` | Checkout |
| `/api/payment-return` | `app/api/payment-return/route.ts` | Stripe payment return (Next.js API route) |

## Server vs Client Components
- **Server Components** by default. Pages fetch via `@lib/data/*` server actions.
- **Client Components** (`"use client"`): cart-dropdown, country-select, language-select, side-menu, modal-context, checkout addresses/payment/shipping/review.

## Path Aliases
```json
{
  "@lib/*": ["lib/*"],
  "@modules/*": ["modules/*"],
  "@pages/*": ["pages/*"]   // unused
}
```

## Environment Variables (`apps/storefront/.env.local`)

There is no `apps/storefront/.env.template` in this install. The live `.env.local` (24 lines) sets:

| Variable | Purpose | Value in this install |
|---|---|---|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key | *(see `context.md`)* |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Backend URL | `http://localhost:9000` |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default region | `dk` |
| `NEXT_PUBLIC_BASE_URL` | Storefront base URL | `https://localhost:8000` *(https, not http)* |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key (optional) | empty |
| `MEDUSA_CLOUD_S3_HOSTNAME` | Medusa Cloud S3 hostname (optional) | empty |
| `MEDUSA_CLOUD_S3_PATHNAME` | Medusa Cloud S3 path (optional) | empty |
| `NODE_ENV` | Environment | `development` |

## Key Dependencies

**Runtime** (`apps/storefront/package.json`):
| Package | Version | Purpose |
|---|---|---|
| `next` | 15.5.21 | App Router |
| `react` / `react-dom` | 19.0.5 | UI runtime |
| `@medusajs/js-sdk` | 2.20.1 | Backend client |
| `@medusajs/icons` | 2.20.1 | SVG icon set |
| `@medusajs/ui-preset` | 2.20.1 | Tailwind preset (design tokens) |
| `@headlessui/react` | ^2.2.0 | Headless UI primitives |
| `@radix-ui/react-accordion` | ^1.2.3 | Accordion (product tabs) |
| `tailwindcss-radix` | ^2.8.0 | Radix variant plugin |
| `pg` | ^8.11.3 | (Server-only) PostgreSQL client |
| `lodash` | ^4.17.21 | Utilities |
| `qs` | ^6.12.1 | Query string parsing |
| `react-country-flag` | ^3.1.0 | Country flag icons |
| `server-only` | ^0.0.1 | Server-only module guard |
| `clsx` | ^2.1.1 | Class merging |
| `@stripe/react-stripe-js` | ^5.3.0 | Stripe React bindings |
| `@stripe/stripe-js` | ^8.2.0 | Stripe JS SDK |

**Dev** (`apps/storefront/package.json` devDependencies, notable): `typescript ^5.3.2`, `tailwindcss ^3.0.23`, `autoprefixer ^10.4.2`, `postcss ^8.4.8`, `prettier ^2.8.8`, `eslint ^9.13.0` + `eslint-config-next 15.5.21`, `babel-loader` + `@babel/core` (for the Stripe/older-browser transforms), `@types/react-instantsearch-dom` (declared but not used in the current code), `ansi-colors` (used by `check-env-variables.js`). `packageManager: "pnpm@11.22.0"`.

**Scripts**:
- `pnpm run dev` — `next dev --turbopack -p 8000`
- `pnpm run build` — `next build`
- `pnpm run start` — `next start -p 8000`
- `pnpm run lint` — `next lint`
- `pnpm run analyze` — `ANALYZE=true next build` (bundle analyzer; no `next-bundle-analyzer` package declared — needs to be installed before use)

## TypeScript Config (`apps/storefront/tsconfig.json`)
- `target: "es5"`, `strict: true`, `module: "esnext"`, `moduleResolution: "node"`, `jsx: "preserve"`, `isolatedModules: true`, `incremental: true`, `noEmit: true`, `resolveJsonModule: true`, `esModuleInterop: true`, `forceConsistentCasingInFileNames: true`, `allowJs: true`, `skipLibCheck: true`
- `baseUrl: "./src"`, paths: `@lib/*` → `lib/*`, `@modules/*` → `modules/*`, `@pages/*` → `pages/*` (declared but no `src/pages/` directory exists in this install)
- `plugins: [{ "name": "next" }]`

## Startup Env Check
`apps/storefront/check-env-variables.js` is `require`d at the top of `next.config.js`. It uses `ansi-colors` to print a red bold "🚫 Error: Missing required environment variables" header (note: the source contains an emoji — it is the only emoji in the storefront codebase) and `process.exit(1)` if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is missing. This is the only required env at startup; the others have working defaults baked into the source.

## Sitemap (`next-sitemap.js`)
- `siteUrl: process.env.NEXT_PUBLIC_VERCEL_URL` (used for the sitemap `<loc>` base URL; on Vercel this is set automatically. Local dev without Vercel: empty)
- `generateRobotsTxt: true`
- `exclude: ["/checkout", "/account/*", "/[sitemap]"]`
- `robotsTxtOptions`: `policies: [{ userAgent: "*", allow: "/" }, { userAgent: "*", disallow: ["/checkout", "/account/*"] }]`

## Local UI Kit

**Location**: `src/modules/common/components/ui/index.tsx`

Built with `clsx` + Tailwind. **This file IS present in this fresh install.** All primitives use `forwardRef` and set `displayName`. Compound components use `Object.assign`. Consumer `className` is appended last via `clx(base, conditional && "...", className)`. `Button` sets `disabled || isLoading` on the underlying button and renders the literal text `"Loading..."` while `isLoading` is true (no spinner).

### Exports
- `clx` — re-export of `clsx`
- `Text` — polymorphic `p | span | div`; default `txt-medium`
- `Heading` — `h1 | h2 | h3` with size + `font-semibold` (`h1`→`text-3xl`, `h2`→`text-2xl`, `h3`→`text-xl`)
- `Button` — variants `primary | secondary | transparent`; sizes `small | medium | large`; `isLoading` (renders "Loading…")
- `Container` — `bg-white rounded-lg p-4`
- `Badge` — colors `green | red | blue | orange | grey | purple`
- `IconBadge`, `IconButton`
- `Label`, `Input` (optional `label` prop)
- `Table` compound (`Table.Header / .Body / .Row / .Head / .HeaderCell / .Cell`)
- `RadioGroup` compound (`RadioGroup.Item`)
- `Checkbox`

```tsx
import { Text, Heading, Button, clx } from "@modules/common/components/ui"
<Heading as="h2" level="h2">Section Title</Heading>
<Button variant="primary" size="large" isLoading={false}>Click me</Button>
<Text as="span" className="text-ui-fg-base">Inline text</Text>
```

## Other UI Primitives

| Component | Location | Purpose |
|---|---|---|
| `LocalizedClientLink` | `modules/common/components/localized-client-link/` | Wraps `next/link` with active `countryCode` prefix |
| `Modal` | `modules/common/components/modal/` | Backed by `@headlessui/react` |
| `FilterRadioGroup` | `modules/common/components/filter-radio-group/` | Product filter UI |
| `NativeSelect` | `modules/common/components/native-select/` | Select dropdown |
| `InteractiveLink` | `modules/common/components/interactive-link/` | Interactive anchor |
| `Divider` | `modules/common/components/divider/` | Visual separator |
| `DeleteButton` | `modules/common/components/delete-button/` | Delete action button |
| `CartTotals` | `modules/common/components/cart-totals/` | Cart summary |
| `LineItemOptions/Price/UnitPrice` | `modules/common/components/` | Cart line items |
| `Input` | `modules/common/components/input/` | Floating-label input |

```tsx
import LocalizedClientLink from "@modules/common/components/localized-client-link"
<LocalizedClientLink href="/products/some-product">View Product</LocalizedClientLink>
```

## Drift from the Earlier `medusajstore/myshop` Install
Both installs are upstream stock from `create-medusa-app@latest --with-nextjs-starter`. They share:
- The local UI kit in `src/modules/common/components/ui/`
- `@medusajs/ui-preset` Tailwind tokens
- The Next.js 15 + React 19 storefront scaffold

Differences:
- **Earlier install had removed the local UI kit** and removed `Toaster`. This install keeps both.
- **Database names differ** between installs.
- **Publishable key / admin user / ports** differ (see `context.md`).
- **Earlier storefront had additional i18n entries** in `src/admin/i18n/index.ts`; this one is the empty default.

If you previously worked on `medusajstore/myshop` and switched to this site, expect to use `@medusajs/ui` and `@medusajs/ui-preset` tokens directly, not the local `Text`/`Heading`/`Button` primitives.