# MedusaJS: Standalone & Multiple Storefronts — Complete Guide

> **Fact-checked against:** Medusa v2.20.1, `dtc-starter` repo, `create-medusa-app` CLI, official docs at `docs.medusajs.com`, and the live `medusa-js` project at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`.

---

## What is a Sales Channel?

A **sales channel** is a Medusa concept representing a channel you sell products through (e.g., "US Web Storefront", "EU Web Storefront", "Mobile App"). It allows you to:

- Control **which products** are visible in each storefront
- Scope **inventory** per channel (via linked stock locations)
- Scope **carts and orders** to a specific channel
- Run **multiple storefronts from a single backend**

---

## The 3 Core Pieces

| Piece | Purpose |
|---|---|
| **Sales Channel** (Admin) | Named channel; you assign products and stock locations to it |
| **Publishable API Key** | Client-side key linked to one or more sales channels; acts as the storefront's identity |
| **Storefront env var** | Each Next.js app sets its own `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, tying it to its sales channel |

---

## How It Works

When a storefront sends a request to Medusa's `/store` API routes, it includes the `x-publishable-api-key` header. Medusa then:

1. Infers the associated **sales channel(s)** from the key
2. Filters products to only those available in that channel
3. Scopes inventory to that channel's stock locations
4. Associates any created orders with that sales channel

If no publishable key is sent, Medusa uses the store's **default sales channel**.

**Important:** Product availability is a filter, not a hard block — by default, customers could still add unavailable products to cart via the API. To enforce channel restrictions in carts, implement the "Enforce Sales Channel Availability in Carts" workflow.

---

## Architecture: One Backend, Multiple Storefronts

```
┌──────────────────────────────────────────────────────────────┐
│                    Medusa Backend (single)                    │
│  PostgreSQL DB ← products, orders, customers, inventory      │
│  Sales Channels ← US, EU, Mobile, B2B                        │
│  Publishable API Keys ← one per storefront                   │
└──────────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │                    │                    │
    ┌────┴────┐         ┌─────┴─────┐       ┌─────┴─────┐
    │ US Store│         │EU Storefront│     │Mobile App │
    │Next.js  │         │Next.js     │     │React Native│
    │:8000    │         │:8001       │     │           │
    │pk_us_xxx│         │pk_eu_xxx   │     │pk_mob_xxx │
    └─────────┘         └────────────┘     └───────────┘
```

Each storefront:
- Has its **own publishable API key** scoped to its sales channel(s)
- Runs as a **completely independent Next.js app**
- Has **zero shared code** with other storefronts
- Can have **completely different UI, branding, and features**
- Can be **deployed and worked on separately**

---

## Architecture: Different Backends, Different Storefronts

You can also run storefronts against **different Medusa backends** entirely:

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  Medusa Backend A    │  │  Medusa Backend B    │  │  Medusa Backend C    │
│  (US brand)          │  │  (EU brand)          │  │  (B2B portal)        │
│  DB_A                │  │  DB_B                │  │  DB_C                │
└──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘
           │                         │                         │
     ┌─────┴─────┐           ┌──────┴──────┐           ┌──────┴──────┐
     │US Storefront│         │EU Storefront│           │B2B Portal   │
     │Next.js :8000│         │Next.js :8001│           │Next.js :8002│
     │pk_brand_a  │         │pk_brand_b  │           │pk_b2b_xxx   │
     └────────────┘           └────────────┘           └─────────────┘
```

This is achieved simply by pointing each storefront's `NEXT_PUBLIC_MEDUSA_BACKEND_URL` at a different backend. No code changes needed.

---

## Step-by-Step Setup

### 1. Set up the Medusa Backend

```bash
npx create-medusa-app@latest --with-nextjs-starter
# Backend runs at http://localhost:9000
# Admin dashboard at http://localhost:9000/app
```

**Important:** The backend **requires PostgreSQL**. SQLite is not supported (dropped in v1.12.0).

For your existing `medusa-js` project at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`, the backend is already set up and running at `http://localhost:9000` with PostgreSQL database `medusa_swift_canyon`.

### 2. Create Sales Channels in Medusa Admin

1. Go to **Settings → Sales Channels** in the Admin dashboard
2. Click **Create**, enter a name (e.g., "US Storefront"), save
3. On the channel's detail page, click **Add** under **Products** to assign products
4. Optionally link **stock locations** for inventory scoping

### 3. Create a Publishable API Key per Storefront

1. Go to **Settings → API Keys**
2. Click **Create**, name it after your storefront
3. Under **Sales Channels**, link it to the correct sales channel(s)
4. Copy the token (starts with `pk_...`)

### 4. Set up each Next.js Storefront

**Option A: Fresh install with backend (monorepo)**
```bash
npx create-medusa-app@latest --with-nextjs-starter
# Creates apps/backend + apps/storefront in one repo
```

**Option B: Add storefront to existing backend monorepo**
```bash
# From your existing Medusa monorepo root:
git clone https://github.com/medusajs/dtc-starter.git --depth=1 dtc-temp
cp -r dtc-temp/apps/storefront apps/storefront
rm -rf dtc-temp
pnpm install
cp apps/storefront/.env.template apps/storefront/.env.local
```

**Option C: Fully standalone storefront (no backend in same repo)**
```bash
git clone https://github.com/medusajs/dtc-starter.git --depth=1
cp -r dtc-starter/apps/storefront ./my-storefront
cd my-storefront
pnpm install
cp .env.template .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxxxxx
NEXT_PUBLIC_DEFAULT_REGION=us
NEXT_PUBLIC_BASE_URL=http://localhost:8000
```

Only **2 variables are required** to connect:
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` — your backend URL (no trailing slash)
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` — the publishable API key from Admin

### 5. Configure CORS on the Backend

In the backend `.env` or `medusa-config.ts`:

```env
# Simple list of origins
STORE_CORS=http://localhost:8000,http://localhost:8001
AUTH_CORS=http://localhost:8000,http://localhost:8001,http://localhost:9000
```

For production with multiple storefronts:
```env
STORE_CORS=https://us.example.com,https://eu.example.com,https://mobile.example.com
AUTH_CORS=https://us.example.com,https://eu.example.com,https://mobile.example.com,https://admin.example.com
```

**Regex patterns** are also supported for flexible matching:
```env
# All localhost ports 8000-8009
STORE_CORS=/http:\/\/localhost:800\d+$/

# All Vercel preview deployments
STORE_CORS=/vercel\.app$/

# All HTTP origins (development only!)
STORE_CORS=/http:\/\/.+/
```

When using regex in `.env`, the value is passed directly to `medusa-config.ts`:
```ts
http: {
  storeCors: process.env.STORE_CORS,
}
```

### 6. Start Developing

```bash
# Terminal 1 — Medusa backend
cd apps/backend
pnpm dev   # → http://localhost:9000

# Terminal 2 — Next.js storefront
cd apps/storefront
pnpm dev   # → http://localhost:8000
```

---

## Project Structure

### Monorepo (with backend)

```
my-project/
  apps/
    backend/          ← single Medusa server (port 9000, needs PostgreSQL)
      medusa-config.ts
      .env
      src/
    storefront/       ← Next.js app (port 8000)
      .env.local      ← its own publishable key + backend URL
      src/
        lib/config.ts ← SDK init
        middleware.ts  ← region resolution
  package.json        ← root workspace config
  pnpm-workspace.yaml ← workspace packages + overrides
  turbo.json          ← task graph
```

### Standalone Storefront (no backend in repo)

```
my-storefront/
  src/
    app/               ← Next.js App Router
    lib/
      config.ts        ← SDK init (only file that knows about backend)
      data/            ← Server actions
      hooks/           ← Client hooks
    modules/           ← Feature modules
  .env.local           ← backend URL + publishable key
  package.json
  next.config.js
```

The storefront is a **vanilla Next.js 15 app** — it has no Medusa-specific build tooling beyond the JS SDK dependency.

---

## How the Storefront Connects to the Backend

The storefront uses the **Medusa JS SDK**, configured once in `src/lib/config.ts`:

```ts
import Medusa from "@medusajs/js-sdk"

let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(input: FetchInput, init?: FetchArgs): Promise<T> => {
  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}
  const newHeaders = { ...localeHeader, ...headers }
  init = { ...init, headers: newHeaders }
  return originalFetch(input, init)
}
```

The SDK **automatically** sends the `x-publishable-api-key` header on every request. You never need to manually set headers.

```ts
// Usage throughout the app — SDK handles auth automatically
const products = await sdk.store.product.list()
const cart = await sdk.store.cart.retrieve(cartId)
```

The **middleware** (`src/middleware.ts`) also uses the backend URL directly to fetch regions:

```ts
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

// Edge middleware fetches regions directly via fetch()
const response = await fetch(`${BACKEND_URL}/store/regions`, {
  headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY! },
  ...
})
```

---

## Safely Removing a Storefront

### From a Monorepo

If you created your project with `--with-nextjs-starter` and want to remove the storefront:

1. **Delete the storefront directory:**
   ```bash
   rm -rf apps/storefront
   ```

2. **Remove from workspace config** — if your `pnpm-workspace.yaml` or `package.json` `workspaces` field explicitly lists `apps/storefront`, remove it. If it uses a glob like `apps/*`, no change needed.

3. **Remove the `storefront:dev` script** from root `package.json` if present.

4. **Remove `MEDUSA_ADMIN_ONBOARDING_NEXTJS_DIRECTORY`** from `apps/backend/.env` if present. This tells Medusa where the storefront lives for admin onboarding links.

5. **Remove `storefrontUrl` from `medusa-config.ts`** if you set it:
   ```ts
   // Remove this block if present:
   admin: {
     storefrontUrl: process.env.MEDUSA_STOREFRONT_URL,
   }
   ```

6. **Update CORS** — remove storefront URLs from `STORE_CORS` and `AUTH_CORS` in `apps/backend/.env`.

7. **Clean up** — remove `.next/`, `tsconfig.tsbuildinfo`, and any storefront artifacts from `.gitignore` if desired.

The backend is completely unaffected. It has no hard dependency on the storefront.

### From a Deployment

If you deployed to Medusa Cloud with a monorepo:
- Remove the storefront from the project settings in the Cloud dashboard
- Or simply stop deploying the storefront directory

If you deployed the storefront separately (Vercel, Netlify):
- Delete the project from your hosting provider
- Remove the storefront URL from `STORE_CORS` and `AUTH_CORS` on the backend
- That's it — no backend changes needed

---

## Safely Adding a Storefront to an Existing Backend

### To an Existing Monorepo

1. **Clone the DTC Starter and extract the storefront:**
   ```bash
   git clone https://github.com/medusajs/dtc-starter.git --depth=1 dtc-temp
   cp -r dtc-temp/apps/storefront apps/storefront
   rm -rf dtc-temp
   ```

2. **Add to workspace** — ensure `pnpm-workspace.yaml` includes `apps/*`:
   ```yaml
   packages:
     - "apps/**"
     - "!apps/backend/.medusa/**"
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Create `.env.local`:**
   ```bash
   cp apps/storefront/.env.template apps/storefront/.env.local
   ```

5. **Set the publishable API key:**
   ```bash
   # Get it from Admin → Settings → API Keys
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxxxxx
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
   NEXT_PUBLIC_DEFAULT_REGION=us
   NEXT_PUBLIC_BASE_URL=http://localhost:8000
   ```

6. **Add storefront URL to backend CORS** in `apps/backend/.env`:
   ```env
   STORE_CORS=http://localhost:8000,http://localhost:8001
   AUTH_CORS=http://localhost:8000,http://localhost:8001,http://localhost:9000
   ```

7. **Restart the backend** to pick up new CORS settings.

8. **Start the storefront:**
   ```bash
   cd apps/storefront
   pnpm dev
   ```

### To a Standalone Backend (Different Repo)

If your backend is in a completely separate repo:

1. Follow the "Standalone Storefront" setup above
2. Set `NEXT_PUBLIC_MEDUSA_BACKEND_URL` to the backend's URL (local or remote)
3. Create a publishable API key on that backend and set it in `.env.local`
4. Add the storefront's URL to the backend's `STORE_CORS` and `AUTH_CORS`
5. No code changes needed — the storefront is fully self-contained

---

## Working on Each Storefront Separately

### Local Development

Each storefront runs independently:

```bash
# Terminal 1 — Backend
cd apps/backend
pnpm dev   # → http://localhost:9000

# Terminal 2 — US Storefront
cd apps/us-storefront
pnpm dev   # → http://localhost:8000

# Terminal 3 — EU Storefront
cd apps/eu-storefront
pnpm dev   # → http://localhost:8001
```

Each storefront has its own `.env.local` with its own publishable API key and backend URL.

### Pointing at Different Backends

To work on a storefront against a different backend (e.g., staging vs production), just change one env var:

```env
# .env.local — point at staging backend
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://staging-backend.example.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_staging_xxxxxxxx
```

```env
# .env.local — point at production backend
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://prod-backend.example.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_prod_xxxxxxxx
```

**No code changes required.** The SDK and middleware both read from env vars.

### Mock Data for Pure UI Work

If you want to build UI without any backend, you can mock the SDK responses. The `dtc-starter` storefront uses the Medusa JS SDK throughout — swap it for mock data during early UI development, then switch back to the real SDK once a backend is available.

---

## Deploying Storefronts

### Vercel

1. Push the storefront to its own GitHub repo
2. Import to Vercel — choose **Next.js** as the framework preset
3. Set environment variables:

| Variable | Value |
|---|---|
| `MEDUSA_BACKEND_URL` | `https://your-medusa-backend.com` |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://your-medusa-backend.com` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_xxxxxxxxxxxx` |
| `NEXT_PUBLIC_DEFAULT_REGION` | `us` |
| `NEXT_PUBLIC_BASE_URL` | your Vercel storefront URL |
| `REVALIDATE_SECRET` | any random secure string |

4. Add storefront URL to backend CORS:
   ```env
   STORE_CORS=https://your-storefront.vercel.app
   AUTH_CORS=https://your-storefront.vercel.app
   ```

5. Push to GitHub → Vercel auto-deploys.

### Medusa Cloud (Monorepo)

Medusa Cloud supports deploying storefronts alongside the backend with zero configuration:
- Medusa automatically injects `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_BASE_URL`
- Medusa automatically configures CORS
- Each environment (production, staging, previews) gets its own storefront deployment
- PR previews are automatically configured

**Note:** Medusa Cloud monorepo deployment requires the storefront to be in `apps/storefront` within the same repo as the backend.

### Other Hosts (Netlify, Railway, Render, etc.)

Same principle as Vercel — set the env vars and add CORS on the backend.

---

## Admin Configuration for Storefront URLs

The Medusa Admin has two optional config values in `medusa-config.ts` that affect storefront links:

```ts
module.exports = defineConfig({
  projectConfig: {
    // ...
  },
  admin: {
    // Used for admin links that point to the storefront (e.g., payment links)
    storefrontUrl: process.env.MEDUSA_STOREFRONT_URL || "http://localhost:8000",
    
    // Used when admin is on a separate domain from the backend
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
})
```

These are **optional** — Medusa defaults to browser origin. Set them when:
- Admin is served from a different domain than the backend
- You want admin-generated storefront links to use a specific URL

---

## Key Environment Variables Reference

### Backend (`apps/backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `JWT_SECRET` | Yes | JWT signing secret |
| `COOKIE_SECRET` | Yes | Cookie signing secret |
| `STORE_CORS` | Yes | Allowed origins for `/store` API |
| `ADMIN_CORS` | Yes | Allowed origins for `/admin` API |
| `AUTH_CORS` | Yes | Allowed origins for `/auth` API |
| `REDIS_URL` | No | Redis for event bus (local dev can use in-memory) |
| `MEDUSA_ADMIN_ONBOARDING_NEXTJS_DIRECTORY` | No | Path to Next.js storefront for admin onboarding |
| `MEDUSA_STOREFRONT_URL` | No | Storefront URL for admin links |
| `MEDUSA_BACKEND_URL` | No | Backend URL when admin is on separate domain |
| `DISABLE_MEDUSA_ADMIN` | No | Set `true` for headless-only deployments |

### Storefront (`apps/storefront/.env.local`)

| Variable | Required | Purpose | Default |
|---|---|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Yes | Backend API URL | `http://localhost:9000` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Yes | Publishable API key | — |
| `NEXT_PUBLIC_DEFAULT_REGION` | No | Default region country code | `us` |
| `NEXT_PUBLIC_BASE_URL` | No | Storefront base URL | `http://localhost:8000` |
| `NEXT_PUBLIC_STRIPE_KEY` | No | Stripe publishable key | — |
| `MEDUSA_BACKEND_URL` | No | Server-side backend URL | same as `NEXT_PUBLIC_*` |
| `REVALIDATE_SECRET` | No | Next.js revalidation secret | — |

**Note:** `NEXT_PUBLIC_*` variables are exposed to the browser. `MEDUSA_BACKEND_URL` (without `NEXT_PUBLIC_` prefix) is server-only and used by server components/actions.

---

## Safely Switching a Storefront to a Different Backend

Because the storefront's backend URL comes **entirely from environment variables**, switching backends is a zero-code operation:

1. Update `.env.local` (local) or hosting env vars (production)
2. Ensure the new backend has a publishable API key set up
3. Ensure the storefront's URL is in the new backend's `STORE_CORS` and `AUTH_CORS`
4. Redeploy/restart

**No files in the storefront codebase reference a specific backend URL.** The only hardcoded value is the fallback `http://localhost:9000` in `src/lib/config.ts`, which is overridden by the env var.

---

## Safely Removing a Backend from a Storefront

If you want to detach a storefront from its backend entirely:

1. Delete or rename `.env.local`
2. The storefront will fail to start — `check-env-variables.js` in `next.config.js` exits with an error if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is missing
3. Remove the `@medusajs/js-sdk` dependency if you're not using Medusa at all
4. Remove Medusa-specific components, server actions, and middleware

The storefront is a standard Next.js app underneath — you can repurpose it for any backend or make it static.

---

## Multiple Storefronts: Best Practices

### One Backend for All

| Scenario | Recommendation |
|---|---|
| Same company, multiple brands/regions | One backend, multiple sales channels, multiple storefronts |
| Shared inventory across brands | One backend, one stock location, multiple sales channels |
| Unified order management | One backend — all orders visible in one Admin |
| Different currencies per region | Use Medusa's Region module — one region per currency/area |
| Storefronts need different designs | Each storefront is a separate Next.js app — full design freedom |

**Benefits:**
- Single database to maintain
- Unified product catalog
- Shared inventory
- One Admin panel for all orders
- Lower infrastructure cost

### Different Backends per Storefront

| Scenario | Recommendation |
|---|---|
| Completely separate businesses | Separate backends, separate databases |
| Different teams owning each brand | Separate backends for team autonomy |
| Data isolation requirements | Separate backends for compliance/legal |
| Different Medusa versions | Separate backends for upgrade independence |
| One storefront, multiple backends (rare) | Point the storefront at different backends by environment |

**Trade-offs:**
- Each backend needs its own PostgreSQL, Redis, hosting
- No shared product catalog — must duplicate or sync data externally
- No unified order view — must aggregate across backends
- Higher infrastructure cost

---

## Important Notes

- **SQLite is NOT supported** by Medusa — PostgreSQL only (v15+ recommended)
- **The storefront has no database** — it's entirely stateless
- **The `nextjs-starter-medusa` repo is deprecated** — use `dtc-starter` instead
- The `dtc-starter` storefront supports: Next.js 15, App Router, Server Components, Server Actions, Tailwind CSS, Stripe checkout, customer accounts, order management
- **The storefront can point at ANY Medusa backend** — local, Cloud, self-hosted, Docker — just change the env vars
- **No coupling between storefront and backend repos** — once extracted, the storefront is a vanilla Next.js app
- **CORS must be configured on the backend** — the storefront's origin must be in `STORE_CORS` and `AUTH_CORS`
- **Admin `storefrontUrl` is optional** — only needed if you want admin links to point to a specific storefront URL
- **`MEDUSA_ADMIN_ONBOARDING_NEXTJS_DIRECTORY`** tells Medusa where the storefront lives for the initial admin onboarding flow — safe to remove if you remove the storefront
- **`DISABLE_MEDUSA_ADMIN=true`** lets you run a headless-only backend with no admin dashboard at all

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Storefront shows blank / 404 | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` missing or wrong | Set correct key in `.env.local` |
| CORS error in browser | Storefront URL not in `STORE_CORS` or `AUTH_CORS` | Add storefront origin to backend CORS env vars |
| `GET /store/customers/me 401` | Anonymous user hitting account page | Expected behavior — not an error |
| `GET /store/locales 404` | Storefront probes a non-existent endpoint | Benign — ignore |
| `redisUrl not found` | Redis not configured | Fine for local dev; set `REDIS_URL` for production |
| Storefront loads but no products | No products assigned to the publishable key's sales channel | Assign products in Admin → Sales Channels |
| Products visible but wrong prices | Wrong region/pricing set up | Check region configuration in Admin |
| Backend URL change causes 500s | Storefront cached old backend URL | Clear `.next/` cache, restart dev server |
| Port 8000 already in use | Another storefront or process running | Use a different port: `pnpm dev -- -p 8001` |

---

## Quick Reference

| Task | Command/Config |
|---|---|
| New monorepo with storefront | `npx create-medusa-app@latest --with-nextjs-starter` |
| Add storefront to existing monorepo | Clone `dtc-starter`, copy `apps/storefront` |
| Extract standalone storefront | Clone `dtc-starter`, copy `apps/storefront` out |
| Backend URL in storefront | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` env var |
| Publishable API key in storefront | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` env var |
| CORS config | `STORE_CORS`, `AUTH_CORS`, `ADMIN_CORS` in backend `.env` |
| Admin storefront link | `admin.storefrontUrl` in `medusa-config.ts` |
| Remove storefront from monorepo | Delete `apps/storefront`, clean workspace config |
| Point storefront at different backend | Change `NEXT_PUBLIC_MEDUSA_BACKEND_URL` env var |
| Multiple storefronts, one backend | One publishable API key + sales channel per storefront |
| Multiple backends, multiple storefronts | Different `NEXT_PUBLIC_MEDUSA_BACKEND_URL` per storefront |

---

## Official Resources

- **Sales Channel Module docs:** https://docs.medusajs.com/resources/commerce-modules/sales-channel
- **Publishable API Keys guide:** https://docs.medusajs.com/resources/storefront-development/publishable-api-keys
- **Manage Sales Channels in Admin:** https://docs.medusajs.com/user-guide/settings/sales-channels
- **Multi-storefront / Omnichannel:** https://docs.medusajs.com/resources/recipes/omnichannel
- **Next.js Starter docs:** https://docs.medusajs.com/resources/nextjs-starter
- **DTC Starter repo:** https://github.com/medusajs/dtc-starter
- **create-medusa-app CLI:** https://docs.medusajs.com/resources/create-medusa-app
- **Deploy to Vercel:** https://docs.medusajs.com/resources/deployment/storefront/vercel
- **CORS configuration:** https://docs.medusajs.com/learn/configurations/medusa-config
- **Medusa Config reference:** https://docs.medusajs.com/resources/references/medusa-config
- **Cloud storefront deployment:** https://docs.medusajs.com/cloud/storefront
- **Multi-tenant use cases:** https://medusajs.com/blog/multi-tenant-rigby
- **JS SDK reference:** https://docs.medusajs.com/resources/js-sdk
