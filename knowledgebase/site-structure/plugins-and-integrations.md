# Plugins and Integrations

## Overview

This Medusa installation uses **no external plugins**. All commerce functionality comes from Medusa's built-in **core commerce modules** and **infrastructure modules**. The storefront integrates with **Stripe** for payment processing (provider ids `pp_stripe_stripe` / `pp_stripe-ideal_stripe` / `pp_stripe-bancontact_stripe` available in `constants.tsx`). Stripe is a core payment provider in Medusa 2.20.1 — it is available once enabled in the admin; no plugin install is required.

The storefront's local UI kit (`src/modules/common/components/ui/`) ships by default with the upstream starter; this install did not modify it.

---

## What is a Medusa Plugin?

According to the [official Medusa documentation](https://docs.medusajs.com/learn/fundamentals/plugins), a plugin is a **package of reusable Medusa customizations** that you can install in any Medusa application. Plugins are available starting from **Medusa v2.3.0**.

### What plugins can contain

A plugin can encapsulate any of the following Medusa customizations:

- **Modules** — domain logic (products, carts, orders, etc.)
- **API Routes** — store or admin endpoints
- **Workflows** — multi-step business processes with compensation/rollback
- **Workflow Hooks** — lifecycle hooks for workflows
- **Links** — relationships between modules
- **Subscribers** — event-driven reactions
- **Scheduled Jobs** — background tasks
- **Admin Extensions** — widgets and UI routes in the admin dashboard

### Plugin vs Module

| Aspect | Module | Plugin |
|---|---|---|
| Scope | Single domain or integration | Multiple customizations bundled together |
| Reusability | Project-specific | Cross-project, publishable to npm |
| Contains | One module | Modules, workflows, API routes, subscribers, jobs, admin extensions |
| Use when | Building a single feature or integration | Reusing customizations across projects or sharing with community |

**Rule of thumb**: Use a **module** for a single integration or feature. Wrap it in a **plugin** only if you need to reuse it across projects or bundle it with workflows, API routes, or admin extensions.

### Official Plugin Keywords

If publishing a plugin to npm, these keywords make it discoverable in the Medusa integrations listing:

| Keyword | Description |
|---|---|
| `medusa-v2` | Required for all Medusa v2 plugins |
| `medusa-plugin-integration` | Required for third-party integrations |
| `medusa-plugin-analytics` | Analytics service integration |
| `medusa-plugin-auth` | Authentication service integration |
| `medusa-plugin-cms` | CMS integration |
| `medusa-plugin-notification` | Notification service integration |
| `medusa-plugin-payment` | Payment provider integration |
| `medusa-plugin-search` | Search engine integration |
| `medusa-plugin-shipping` | Shipping carrier integration |
| `medusa-plugin-other` | Other third-party integrations |

---

## Current State: No External Plugins

### medusa-config.ts

```ts
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  }
})
```

No `plugins` array. No `@medusajs/plugin-*` packages installed.

---

## Core Commerce Modules (Built-In via `@medusajs/medusa` 2.20.1)

| Module | Purpose |
|---|---|
| `product` | Products, variants, options, categories |
| `cart` | Shopping cart, line items |
| `order` | Orders, exchanges, returns |
| `customer` | Customer accounts, addresses |
| `inventory` | Stock levels, reservations |
| `fulfillment` | Shipping providers, methods |
| `payment` | Payment providers, sessions |
| `pricing` | Price lists, calculated prices |
| `promotion` | Discounts, promo codes |
| `region` | Regions, countries, currencies |
| `sales_channel` | Sales channels |
| `tax` | Tax providers, rates |
| `currency` | Currencies |
| `store` | Store settings |
| `api_key` | Publishable + secret keys |
| `user` | Admin users, invites |
| `auth` | Auth, OAuth, emailpass |
| `stock_location` | Warehouses |
| `notification` | Notifications |
| `search` | Search indexes |
| `cache` | Caching |
| `event_bus` | Event queue |
| `workflows` | Workflow engine |
| `locking` | Distributed locks |
| `file` | File storage |
| `draft_order` | Draft orders |
| `analytics` | Analytics tracking |

---

## Core Infrastructure Modules (Built-In)

| Module | Notes |
|---|---|
| `caching` | Next.js fetch cache + tags |
| `event_bus` | In-memory by default; falls back when no Redis |
| `workflow_engine` | In-memory by default |
| `locking` | In-memory by default |
| `notification` | Local event bus |
| `search` | MikroORM-based search indexes |

At boot the backend logs:
```
redisUrl not found. A fake redis instance will be used.
Local Event Bus installed. This is not recommended for production.
Locking module: Using "in-memory" as default.
```

This is expected without Redis. For production, set `REDIS_URL=redis://localhost:6379`.

---

## Storefront Integrations

### Stripe

- Packages: `@stripe/react-stripe-js` ^5.3.0, `@stripe/stripe-js` ^8.2.0
- Config: `NEXT_PUBLIC_STRIPE_KEY` in `apps/storefront/.env.local` (empty by default)

Flow:
1. Checkout fetches providers from `/store/payment-providers`
2. `PaymentWrapper` loads Stripe.js if Stripe is selected
3. `StripeWrapper` → `StripePaymentContainer` for card input
4. `sdk.store.payment.initiatePaymentSession()` starts the session
5. `cart.complete()` places the order
6. Stripe return handled by `src/app/api/payment-return/route.ts`

Supported payment provider ids (in `src/lib/constants.tsx`):
| Provider ID | Title |
|---|---|
| `pp_stripe_stripe` | Credit card |
| `pp_medusa-payments_default` | Credit card |
| `pp_stripe-ideal_stripe` | iDeal |
| `pp_stripe-bancontact_stripe` | Bancontact |
| `pp_paypal_paypal` | PayPal |
| `pp_system_default` | Manual Payment |

### Medusa JS SDK

- `@medusajs/js-sdk` v2.20.1
- Instantiated in `src/lib/config.ts`; monkey-patched to inject `x-medusa-locale` on every call.

### Medusa Icons

- `@medusajs/icons` v2.20.1 — used for provider icons etc.

### Medusa UI Preset

- `@medusajs/ui-preset` v2.20.1 — Tailwind preset providing design tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`, etc.)
- Loaded in `tailwind.config.js` via `presets: [require("@medusajs/ui-preset")]`

### S3 / Medusa Cloud

- Optional image storage via `MEDUSA_CLOUD_S3_HOSTNAME` and `MEDUSA_CLOUD_S3_PATHNAME`
- `next.config.js` conditionally adds S3 hostname to `images.remotePatterns` when these vars are set
- No S3 plugin package is installed; the storefront reads the env vars directly and adds them to Next.js image config

### PostgreSQL

- Primary database for the backend
- `DATABASE_URL` in `apps/backend/.env`
- The storefront does **not** connect to Postgres directly; `pg` and `@types/pg` are declared in `apps/storefront/package.json` but are not imported anywhere in the storefront source. They are likely scaffold leftovers or used only in server-only data-layer helpers that do not run in the storefront.

### Redis

- Optional; used for event bus, cache, and locking in production
- `REDIS_URL` in `apps/backend/.env`
- Without Redis, Medusa falls back to in-memory implementations with a startup warning

### Headless UI / Radix UI

- `@headlessui/react` ^2.2.0 — `Dialog`, `Popover`, `Listbox`, `RadioGroup`, `Transition`
- `@radix-ui/react-accordion` ^1.2.3 — `Accordion` for product tabs and option pickers
- `tailwindcss-radix` ^2.8.0 — Tailwind variant plugin for Radix state selectors (`group-data-[state=checked]`, etc.)

### Query String / Utility Libraries

- `qs` ^6.12.1 — query string parsing/stringifying
- `clsx` ^2.1.1 — conditional class merging (re-exported as `clx` in the local UI kit)
- `lodash` ^4.17.21 — general utilities
- `react-country-flag` ^3.1.0 — country flag SVGs for region selector
- `server-only` ^0.0.1 — marks server-only modules to prevent client bundling

### Admin Dashboard

- `@medusajs/admin-sdk` 2.20.1 — Widget/UI route extensions
- `@medusajs/admin-shared` 2.20.1 — Shared types
- `@medusajs/dashboard` 2.20.1 — Dashboard UI
- `@medusajs/ui` 4.2.3 — Admin UI components
- `@tanstack/react-query` 5.64.2 — Admin data fetching
- `react-i18next` 13.5.0 — Admin i18n
- `react-router-dom` 7.18.2 — Admin routing
- `zod` 4.2.0 — Schema validation
- **No custom admin widgets or UI routes** in this install.

---

## Third-Party Service Dependencies

| Service | Purpose | Config |
|---|---|---|
| PostgreSQL | Primary database | `DATABASE_URL` |
| Redis (optional) | Event bus / cache / locking | `REDIS_URL` |
| Stripe (optional) | Payments | `NEXT_PUBLIC_STRIPE_KEY` |
| S3 (optional) | Image storage | `MEDUSA_CLOUD_S3_*` |

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Key | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_SECRET` | JWT signing secret |
| `COOKIE_SECRET` | Cookie signing secret |
| `STORE_CORS` | Allowed origins for store API |
| `ADMIN_CORS` | Allowed origins for admin API |
| `AUTH_CORS` | Allowed origins for auth API |
| `REDIS_URL` | Redis connection for event bus (optional) |
| `MEDUSA_ADMIN_ONBOARDING_TYPE` | Admin onboarding type |
| `AUTH_MFA_ENCRYPTION_KEY` | MFA encryption key |
| `MEDUSA_ADMIN_ONBOARDING_NEXTJS_DIRECTORY` | Path to Next.js storefront |

`apps/backend/.env.template` ships with only 7 keys: `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `DATABASE_URL=` (empty), plus a placeholder `DB_NAME=medusa-backend` (unused). The 3 keys that exist in `.env` but not in the template are `MEDUSA_ADMIN_ONBOARDING_TYPE`, `AUTH_MFA_ENCRYPTION_KEY`, and `MEDUSA_ADMIN_ONBOARDING_NEXTJS_DIRECTORY` (added by the CLI at install time).

### Storefront (`apps/storefront/.env.local`)

There is no `apps/storefront/.env.template` in this install. The live `.env.local` (24 lines) sets:

| Variable | Purpose | Value in this install |
|---|---|---|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key | `pk_119693c7163984b1e7969355d1622c767dda24aecf08f04ace82839c5433e915` |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Backend URL | `http://localhost:9000` |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default region | `dk` |
| `NEXT_PUBLIC_BASE_URL` | Storefront base URL | `https://localhost:8000` (https, not http) |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key (optional) | empty |
| `MEDUSA_CLOUD_S3_HOSTNAME` | Medusa Cloud S3 hostname (optional) | empty |
| `MEDUSA_CLOUD_S3_PATHNAME` | Medusa Cloud S3 path (optional) | empty |
| `NODE_ENV` | Environment | `development` |

---

## Next.js / SEO Configuration

### `next.config.js`

- `reactStrictMode: true`
- `logging.fetches.fullUrl: true` — dev-only fetch logging
- `eslint.ignoreDuringBuilds: true` — lint errors do not fail production builds
- `typescript.ignoreBuildErrors: true` — type errors do not fail production builds
- `images.unoptimized: true` — Next.js image optimization disabled (Medusa serves optimized images)
- `images.qualities: [25, 50, 75, 100]` — explicit quality list for Next.js 16 compatibility
- `images.remotePatterns`:
  - `http://localhost` — local dev backend
  - `https://*.s3.*.amazonaws.com` — AWS S3
  - `https://*.s3.amazonaws.com` — AWS S3 legacy
  - Conditionally adds `MEDUSA_CLOUD_S3_HOSTNAME` + `MEDUSA_CLOUD_S3_PATHNAME` when set
- `check-env-variables.js` is `require`d at the top — uses `ansi-colors` to print a red bold "🚫 Error: Missing required environment variables" header and `process.exit(1)` if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is missing. This is the only required env at startup; the others have working defaults baked into the source.

### `next-sitemap.js`

- `siteUrl: process.env.NEXT_PUBLIC_VERCEL_URL` (used for the sitemap `<loc>` base URL; on Vercel this is set automatically. Local dev without Vercel: empty)
- `generateRobotsTxt: true`
- `exclude: ["/checkout", "/account/*", "/[sitemap]"]`
- `robotsTxtOptions`: `policies: [{ userAgent: "*", allow: "/" }, { userAgent: "*", disallow: ["/checkout", "/account/*"] }]`

### PostCSS

`apps/storefront/postcss.config.js`:
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

## pnpm Workspace Configuration

`pnpm-workspace.yaml` (root):
```yaml
packages:
  - "apps/**"
  - "!apps/backend/.medusa/**"
allowBuilds:
  '@medusajs/telemetry': true
  '@swc/core': true
  esbuild: true
  msgpackr-extract: true
  protobufjs: true
  sharp: true
  unrs-resolver: true
overrides:
  '@types/react': 19.0.5
  '@types/react-dom': 19.0.5
```

The `allowBuilds` entries are required on pnpm v11+ for Medusa native modules to compile. The `overrides` block forces all transitive dependencies to use `@types/react@19.0.5` and `@types/react-dom@19.0.5`, which eliminates ~335 `TS2786` errors on `tsc --noEmit`. There is no `pnpm.overrides` block in the root `package.json`; it was never scaffolded in Medusa 2.20.1.

---

## Official Integrations Reference

Medusa provides first-party integrations for common third-party services. These are implemented as **module providers** and configured via the `modules` array in `medusa-config.ts`, not as plugins.

### Payment Providers

| Provider | Package | Config Location |
|---|---|---|
| Stripe | Built into `@medusajs/medusa` | Enable in admin; `NEXT_PUBLIC_STRIPE_KEY` in storefront |
| PayPal | Built into `@medusajs/medusa` | Enable in admin |
| Manual Payment | Built into `@medusajs/medusa` | Built-in fallback (`pp_system_default`) |

**Safety note**: Payment providers are core modules, not plugins. They do not require `pnpm add` or `plugins` registration. Enable them in the Medusa admin at `/app/settings/payment-providers`.

### Notification Providers

| Provider | Type | Config |
|---|---|---|
| SendGrid | `@medusajs/notification` provider | `modules` config in `medusa-config.ts` |
| Mailchimp | Integration | Module provider |
| Resend | Integration | Module provider |
| Slack | Integration | Module provider |
| Twilio SMS | Integration | Via phone-auth tutorial |

### Search

| Provider | Type | Notes |
|---|---|---|
| Algolia | Integration | Requires `@medusajs/plugin-search` or custom module |
| Meilisearch | Integration | Requires `@medusajs/plugin-search` or custom module |
| Built-in `search` module | Core | MikroORM-based; indexes products only, no storefront UI |

### File Storage

| Provider | Type | Notes |
|---|---|---|
| AWS S3 | `@medusajs/medusa/file` provider | Configured via `modules` array; no plugin install |
| Local | Built-in fallback | Default file provider |

### Analytics

| Provider | Type | Notes |
|---|---|---|
| PostHog | Analytics module provider | Built into `@medusajs/medusa` |
| Segment | Integration | Requires plugin or custom module |

### Auth Providers

| Provider | Type | Notes |
|---|---|---|
| Google | Auth module provider | Built into `@medusajs/medusa` |
| GitHub | Auth module provider | Built into `@medusajs/medusa` |
| Okta | Integration | Requires custom auth provider |

### CMS

| Provider | Type | Notes |
|---|---|---|
| Contentful | Integration | Requires custom module |
| Payload CMS | Integration | Requires custom module |
| Sanity | Integration | Requires custom module |
| Strapi | Integration | Requires custom module |

### Fulfillment

| Provider | Type | Notes |
|---|---|---|
| ShipStation | Integration | Requires custom fulfillment provider |
| Built-in shipping | Core module | Flat rate or calculated shipping |

### Tax

| Provider | Type | Notes |
|---|---|---|
| Avalara | Integration | Requires custom tax provider |
| Built-in tax | Core module | `tp_system` provider used by seed |

### Instrumentation

| Provider | Type | Notes |
|---|---|---|
| Sentry | Integration | Requires plugin or custom module |

### ERP

| Provider | Type | Notes |
|---|---|---|
| Odoo | Integration | Requires custom ERP integration workflow |

---

## How to Safely Add Plugins and Integrations

### Pre-Installation Checklist

1. **Verify compatibility**: Ensure the plugin supports Medusa v2.20.1. Check the plugin's `peerDependencies` for `@medusajs/medusa` version range.
2. **Check for existing core module**: Many "plugins" are actually core module providers (payment, notification, file, auth). Prefer core providers over third-party plugins when available.
3. **Review dependencies**: Run `pnpm why <package>` to check for conflicts with existing dependencies.
4. **Check TypeScript compatibility**: Run `cd apps/storefront && pnpm exec tsc --noEmit` before and after to catch type conflicts.
5. **Backup database**: Run `pg_dump` or use Medusa's backup plugin before adding plugins that ship migrations.
6. **Read migration requirements**: Some plugins require `pnpm exec medusa db:migrate` after registration.

### Safe Installation Procedure

#### 1. Install the package

```bash
cd apps/backend
pnpm add @medusajs/plugin-<name>
# or for integrations:
pnpm add <integration-package-name>
```

#### 2. Register in `medusa-config.ts`

```ts
module.exports = defineConfig({
  projectConfig: { /* existing config */ },
  plugins: [
    {
      resolve: "@medusajs/plugin-<name>",
      options: {
        // plugin-specific options
        apiKey: process.env.PLUGIN_API_KEY,
      },
    },
  ],
})
```

**Important**: If the plugin includes **module providers** (notification, payment, file, auth, fulfillment, tax), you must also register the provider in the `modules` array:

```ts
module.exports = defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/plugin-<name>/providers/<provider-name>",
            id: "<provider-id>",
            options: {
              // provider-specific options
            },
          },
        ],
      },
    },
  ],
})
```

#### 3. Add environment variables

Add any required env vars to `apps/backend/.env` (never commit secrets). Update `.env.template` if the variable is required for all environments.

#### 4. Run migrations (if required)

```bash
cd apps/backend
pnpm exec medusa db:migrate
```

#### 5. Rebuild and restart

```bash
# From repo root
pnpm run build
# Then restart dev servers
pnpm run backend:dev
```

#### 6. Verify

```bash
# Check backend logs for plugin registration messages
# Check that the storefront still loads
# Run pnpm exec tsc --noEmit in apps/storefront
# Run pnpm run lint in apps/backend
```

### Safe Removal Procedure

#### 1. Remove from `medusa-config.ts`

Delete the plugin entry from the `plugins` array. If the plugin registered module providers, remove those from the `modules` array as well.

#### 2. Uninstall the package

```bash
cd apps/backend
pnpm remove @medusajs/plugin-<name>
```

#### 3. Remove environment variables

Delete the plugin's env vars from `apps/backend/.env` and `.env.template`.

#### 4. Roll back database migrations (if applicable)

**Warning**: Medusa does not provide automatic migration rollback. If the plugin created tables or data:

- **Option A**: Restore from a database backup taken before installation
- **Option B**: Manually write and run a down-migration using `pnpm exec medusa db:generate <module>` (if the plugin's module is still referenced)
- **Option C**: If the plugin created no migrations, no DB action is needed

#### 5. Remove frontend references

If you added any storefront code that calls the plugin's API routes or uses its data:

- Delete the storefront server actions in `apps/storefront/src/lib/data/`
- Delete any storefront components that depend on the plugin
- Remove any related `data-testid` attributes from tests

#### 6. Rebuild and verify

```bash
pnpm run build
pnpm run backend:dev
# Verify the backend starts without the plugin
# Verify the storefront loads
```

---

## Connecting Plugins to the Frontend Safely

### The Golden Rule: Never bypass the SDK

The storefront must **always** communicate with the backend through the **Medusa JS SDK** (`@medusajs/js-sdk`). Never use raw `fetch()` or `axios` directly.

#### Why the SDK is mandatory

| Concern | SDK handles it | Raw `fetch()` does not |
|---|---|---|
| Publishable API key header (`x-publishable-api-key`) | ✅ Auto-injected | ❌ Must be added manually |
| Customer auth headers (`Authorization`) | ✅ Auto-injected | ❌ Must be added manually |
| Locale header (`x-medusa-locale`) | ✅ Auto-injected via monkey-patch | ❌ Must be added manually |
| JSON serialization | ✅ Automatic | ❌ Must call `JSON.stringify()` |
| Error normalization | ✅ Throws `Error` with message | ❌ Returns raw `Response` |
| Type safety | ✅ Typed responses | ❌ Untyped |

#### Pattern 1: Built-in endpoints

Use the SDK's built-in methods for core Medusa endpoints:

```ts
// ✅ Correct — typed, auto-auth, auto-publishable-key
const { products } = await sdk.store.product.list({ limit: 10 })

// ❌ Wrong — no auth headers, no type safety
const res = await fetch("http://localhost:9000/store/products")
```

#### Pattern 2: Custom plugin API routes

If a plugin adds custom store API routes (under `src/api/store/`), use `sdk.client.fetch()`:

```ts
// ✅ Correct — uses SDK, gets auth + publishable key
const result = await sdk.client.fetch("/store/plugin-endpoint", {
  method: "POST",
  body: { input: "value" },
})

// ❌ Wrong — bypasses SDK, missing headers
const res = await fetch("http://localhost:9000/store/plugin-endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ input: "value" }),
})
```

#### Pattern 3: Admin API routes from server components

Server components can call admin endpoints via the SDK:

```ts
// ✅ Correct — server-side, SDK handles admin auth
const { orders } = await sdk.admin.order.list({ limit: 10 })
```

**Never expose admin SDK calls to the client.** Keep all `sdk.admin.*` calls inside `"use server"` files or async server components.

#### Pattern 4: Server actions as a safe wrapper

The safest pattern for exposing plugin functionality to the storefront is a **server action** in `src/lib/data/`:

```ts
// apps/storefront/src/lib/data/plugin-feature.ts
"use server"

import { sdk } from "@lib/config"

export async function getPluginData() {
  const data = await sdk.client.fetch("/store/plugin-endpoint")
  return data
}
```

Then consume it from a client component:

```tsx
"use client"
import { useQuery } from "@tanstack/react-query"
import { getPluginData } from "@/lib/data/plugin-feature"

function PluginComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["plugin-data"],
    queryFn: getPluginData,
  })

  if (isLoading) return <div>Loading...</div>
  return <div>{data?.message}</div>
}
```

**Why this is safe**:
- The server action runs only on the server — no secrets exposed to the client
- The SDK handles all auth headers automatically
- React Query handles caching, revalidation, and error states
- If the plugin is removed, deleting the server action and component removes all traces

### Frontend Connection Checklist for Plugins

When adding a plugin that exposes storefront-facing functionality:

- [ ] **API routes**: Plugin must expose `/store/*` endpoints (never `/admin/*` from the storefront)
- [ ] **SDK only**: All storefront code uses `sdk.client.fetch()` or `sdk.store.*` — no raw `fetch()`
- [ ] **Server actions**: Custom plugin calls are wrapped in `"use server"` files under `src/lib/data/`
- [ ] **No client-side secrets**: API keys, tokens, and plugin options stay in backend env vars
- [ ] **Type safety**: Add TypeScript types for plugin responses in `src/types/`
- [ ] **Error handling**: Use `try/catch` in server actions; surface errors via `useActionState` or `useQuery` error states
- [ ] **Cache tags**: If the plugin modifies data, include `revalidateTag()` calls in server actions
- [ ] **Graceful degradation**: Storefront should render something (even a disabled state) if the plugin's API is unreachable

---

## Safe Plugin Evaluation Criteria

Before installing any plugin, evaluate it against these criteria:

| Criterion | Why it matters | How to check |
|---|---|---|
| **Medusa v2 compatibility** | v1 plugins will not work | Check `peerDependencies` for `@medusajs/medusa` v2.x |
| **Active maintenance** | Unmaintained plugins break on updates | Check last publish date, open issues, PR response time |
| **TypeScript support** | Type mismatches break `tsc --noEmit` | Run `pnpm exec tsc --noEmit` after install |
| **Migration safety** | Plugins may ship DB migrations | Check `migrations/` directory in the plugin package |
| **Provider vs plugin** | Some integrations are core providers | Check if the feature is already in `@medusajs/medusa` |
| **Frontend exposure** | Plugins may require storefront changes | Check if the plugin ships storefront code or just backend |
| **Lockfile impact** | Some plugins force dependency updates | Run `pnpm install --lockfile-only` and review diff |
| **Test coverage** | Untested plugins risk production stability | Check for `__tests__` in the plugin repo |

---

## Common Safe Plugins for Production

These plugins are widely used in the Medusa community and follow Medusa's plugin conventions:

### Infrastructure

| Plugin | Purpose | Safety Profile |
|---|---|---|
| `@medusajs/plugin-search` | Algolia/Meilisearch search | Core-team maintained; ships migrations |
| `@medusajs/plugin-email-sendgrid` | SendGrid email notifications | Core-team maintained |
| `@medusajs/plugin-mailer` | Generic email sending | Core-team maintained |
| `@medusajs/plugin-google-analytics` | GA4 analytics | Core-team maintained |
| `@medusajs/plugin-sentry` | Error tracking | Core-team maintained |

### Integrations

| Plugin | Purpose | Safety Profile |
|---|---|---|
| `@medusajs/plugin-stripe` | Stripe payment provider | Core-team maintained; already built into Medusa |
| `@medusajs/plugin-paypal` | PayPal payment provider | Core-team maintained |
| `medusa-shippo` | Shippo shipping rates | Community; active |
| `medusa-afterpay` | Afterpay/Clearpay | Community; active |
| `medusa-backup` | Database backup utility | Community fork; includes rollback |

### Local Development

| Plugin | Purpose | Safety Profile |
|---|---|---|
| `@medusajs/plugin-redis` | Redis event bus/cache/locking | Core-team maintained; safe for local dev |

---

## Testing Plugins Before Production

### 1. Local development with `medusa develop`

```bash
cd apps/backend
pnpm run dev
```

The dev server reloads on config changes. Add the plugin, verify it loads, then remove it. Repeat until stable.

### 2. Use `medusa plugin:develop` for custom plugins

If developing your own plugin:

```bash
# In the plugin project
npx medusa plugin:publish

# In the Medusa app
npx medusa plugin:add @your-org/plugin-name
```

This uses `yalc` under the hood for local linking without publishing to npm.

### 3. Database safety

- Always run `pnpm exec medusa db:migrate` inside `apps/backend`
- If a plugin ships migrations, inspect them in `apps/backend/.medusa/` before running
- Keep a database backup: `pg_dump -U postgres medusa_swift_canyon > backup.sql`

### 4. Type safety

```bash
cd apps/storefront
pnpm exec tsc --noEmit
```

Run this before and after installing a plugin. If new type errors appear, the plugin may have conflicting type dependencies.

### 5. Lint

```bash
cd apps/backend
pnpm run lint
```

Plugins should not cause `@medusajs/*` ESLint rule failures. If they do, the plugin is likely using deprecated patterns.

---

## Rollback Strategies

### Immediate rollback (plugin breaks startup)

1. Stop the backend: `Ctrl+C`
2. Remove the plugin entry from `medusa-config.ts`
3. Run `pnpm remove <plugin-package>` in `apps/backend`
4. Restart: `pnpm run backend:dev`

### Database rollback (plugin shipped migrations)

1. Restore from backup:
   ```bash
   psql -U postgres medusa_swift_canyon < backup.sql
   ```
2. Or manually revert migrations if you know which ones the plugin created

### Storefront rollback (plugin exposed API routes)

1. Delete server actions in `apps/storefront/src/lib/data/` that call the plugin's routes
2. Delete any storefront components that depend on the plugin
3. Remove `data-testid` attributes from tests
4. Rebuild: `pnpm run build`

### Workflow rollback (plugin registered workflows)

Medusa v2 workflows use the saga pattern with **opt-in compensation**. If a plugin's workflow fails:

- Compensation runs only if the step author implemented it
- If the in-memory workflow engine is used (no Redis), compensation never runs on crash
- **Safe cleanup**: Only delete unambiguous orphans (e.g., reservations with no parent order or canceled order)
- **Never** delete `workflow_execution` rows or module link rows without human review

---

## How Plugins Connect to the Frontend: The Full Stack

### Backend side

```
Plugin (npm package)
  ├── src/modules/          → Domain logic, services, models
  ├── src/api/              → Store/admin API routes
  ├── src/workflows/        → Business processes
  ├── src/subscribers/      → Event handlers
  ├── src/jobs/             → Scheduled tasks
  └── src/admin/            → Admin widgets/routes
```

When registered in `medusa-config.ts`:
- Modules are auto-registered (no `modules` array entry needed)
- API routes are mounted at `/store/*` and `/admin/*`
- Subscribers listen for events (`order.placed`, `customer.updated`, etc.)
- Admin extensions appear in the Medusa admin dashboard

### Frontend side

```
Storefront (Next.js)
  ├── src/lib/data/         → Server actions ("use server")
  │   └── plugin-name.ts    → Calls sdk.client.fetch("/store/plugin-endpoint")
  ├── src/modules/          → Client components
  │   └── plugin-feature/   → Consumes server actions via useQuery/useMutation
  └── src/app/api/          → Next.js API routes (if needed for webhooks)
```

**Data flow**:
1. Client component calls a server action (`"use server"`) or uses React Query
2. Server action calls `sdk.client.fetch("/store/plugin-endpoint")`
3. SDK automatically adds `x-publishable-api-key` and locale headers
4. Backend plugin API route handles the request, runs workflows, returns JSON
5. Response flows back through the server action to the client

### Safety boundaries

| Layer | Safe? | Reason |
|---|---|---|
| Client component → server action | ✅ | Server action runs on server only |
| Server action → `sdk.client.fetch()` | ✅ | SDK handles auth headers |
| Server action → `sdk.store.*` / `sdk.admin.*` | ✅ | Typed, built-in methods |
| Client component → raw `fetch()` | ❌ | No auth headers, exposes secrets |
| Client component → `sdk` instance | ❌ | SDK is server-only; importing it client-side breaks |
| Admin API route from storefront | ❌ | Requires admin auth token; never expose to client |

---

## Common Plugin Use Cases

### Analytics

- `@medusajs/plugin-google-analytics` — GA4 event tracking
- `@medusajs/plugin-posthog` — PostHog analytics
- Segment — via custom analytics module provider

### Notifications

- `@medusajs/plugin-email-sendgrid` — SendGrid email
- `@medusajs/plugin-mailer` — Generic SMTP mailer
- Twilio SMS — via notification module provider
- Slack — via notification module provider

### Search

- `@medusajs/plugin-search` — Algolia/Meilisearch
- Built-in `search` module — MikroORM-based, indexes products only

### Payment

- Stripe — built into core, enable in admin
- PayPal — built into core, enable in admin
- Additional providers — via payment module provider plugins

### Shipping

- ShipStation — via fulfillment module provider
- Custom carriers — via custom fulfillment provider

### CMS

- Contentful — via custom module
- Sanity — via custom module
- Strapi — via custom module

### File Storage

- AWS S3 — built into core file provider, no plugin needed
- Custom file providers — via file module provider

### Auth

- Google — built into core auth provider
- GitHub — built into core auth provider
- Okta — via custom auth provider

### ERP

- Odoo — via ERP integration recipe
- Custom ERP — via workflows + subscribers

---

## Adding a Plugin Later

```bash
cd apps/backend
pnpm add @medusajs/plugin-<name>
```

```ts
// medusa-config.ts
module.exports = defineConfig({
  projectConfig: { /* … */ },
  plugins: [
    {
      resolve: "@medusajs/plugin-<name>",
      options: { /* plugin-specific */ },
    },
  ],
})
```

Then `pnpm exec medusa db:migrate` if the plugin ships migrations.

---

## Module Providers vs Plugins

Some integrations that look like plugins are actually **module providers** configured in the `modules` array:

```ts
module.exports = defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/plugin-sendgrid/providers/sendgrid",
            id: "sendgrid",
            options: {
              apiKey: process.env.SENDGRID_API_KEY,
              from: "orders@example.com",
            },
          },
        ],
      },
    },
  ],
})
```

**Key difference**:
- **Plugin**: Registered in `plugins` array. Auto-registers its modules.
- **Module provider**: Registered in `modules` array under the relevant core module's `providers` list.

When removing a module provider:
1. Remove it from the `providers` array in `modules` config
2. Uninstall the package with `pnpm remove`
3. Remove env vars

---

## Best Practices

1. **Prefer core providers over plugins** — if Medusa ships a built-in provider (Stripe, SendGrid, S3), use it instead of a third-party plugin.
2. **Never use raw `fetch()` from the storefront** — always go through the SDK or a server action.
3. **Keep plugin options in env vars** — never hardcode API keys or secrets in `medusa-config.ts`.
4. **Test in dev before production** — add the plugin locally, verify all flows, then deploy.
5. **Backup before migrations** — any plugin that ships migrations needs a DB backup first.
6. **Pin plugin versions** — use exact versions in `package.json` to avoid unexpected updates.
7. **Monitor plugin logs** — check backend logs for plugin initialization errors after restart.
8. **Remove in reverse order** — unregister from config first, then uninstall the package, then clean up env vars and frontend code.
