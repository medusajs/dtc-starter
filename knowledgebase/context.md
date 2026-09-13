# Knowledge Base: MedusaJS Ecommerce Setup (medusa-js)

## Table of Contents
1. [What Is MedusaJS](#what-is-medusajs)
2. [This Installation (medusa-js)](#this-installation-medusa-js)
3. [Fresh Installation Steps](#fresh-installation-steps)
4. [Common Issues and Fixes](#common-issues-and-fixes)
5. [Environment and Configuration Reference](#environment-and-configuration-reference)
6. [Useful Commands](#useful-commands)
7. [Official Documentation Links](#official-documentation-links)
8. [Site Structure](#site-structure)

---

## What Is MedusaJS

MedusaJS is an open-source digital commerce platform built on Node.js with a built-in framework for customization. It is designed as an alternative to platforms like Shopify, but with full code access and extensibility.

### Key Concepts
- **Commerce Modules**: Core functionalities such as product, cart, checkout, order, inventory, pricing, promotion, region, tax, currency, customer, payment, fulfillment, and API key management.
- **Framework**: Build custom API routes, workflows, data models (DML), module links, subscribers, scheduled jobs, and plugins.
- **Admin Dashboard**: Customizable React-based admin UI with widgets and UI routes.
- **Storefront**: Optional customer-facing storefront (Next.js starter included).
- **Medusa Cloud**: Managed hosting option, but local self-hosted setup is fully supported.

### Architecture
- Backend server: Node.js + Express
- Database: PostgreSQL (required)
- Admin: Vite-based React app served from the backend at `/app`
- Storefront: Next.js (optional, runs separately)
- Event bus: Local in-memory by default, Redis recommended for production

---

## This Installation (medusa-js)

### Environment Details
- **OS**: Windows 10/11 (PowerShell 5.1)
- **Node.js**: v24.18.0
- **Package Manager**: pnpm 11.22.0
- **PostgreSQL**: 18.6 (running on localhost:5432)
- **Database Name**: `medusa_swift_canyon`
- **Postgres Superuser**: `postgres` / password `postgres`
- **Project Name**: `medusa-js`
- **Project Root**: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`
- **Monorepo Structure** (Turborepo workspace):
  - `apps/backend` — Medusa backend (`@dtc/backend`)
  - `apps/storefront` — Next.js storefront (`@dtc/storefront`)
- **Medusa Version**: 2.21.0
- **Next.js Version**: 15.5.21
- **React Version**: 19.0.5

### Running Services
- **Backend API**: http://localhost:9000
- **Admin Dashboard**: http://localhost:9000/app
- **Storefront**: http://localhost:8000

### Admin Credentials
- Email: `admin@test.com`
- Password: `supersecret`

### Publishable API Key
- Token: `pk_119693c7163984b1e7969355d1622c767dda24aecf08f04ace82839c5433e915`
- Title: Default Publishable API Key
- Set in: `apps/storefront/.env.local` as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

### Important Files
- `apps/backend/medusa-config.ts` — Backend config (database URL, CORS, secrets)
- `apps/backend/.env` — Backend environment variables
- `apps/storefront/.env.local` — Storefront environment variables
- `pnpm-workspace.yaml` — pnpm workspace config with `allowBuilds` and `overrides` entries
- `turbo.json` — Turbo task graph for dev/build/test/lint

### Customizations

**Backend is 100% upstream stock.** The `apps/backend/` directory has not been modified since install.

**Storefront has 17 local patches** applied on 2026-09-05 through 2026-09-12:
- **BUG-01 (Fixed):** The upstream `Orders` page calls `listOrders()` without first checking auth; the call throws on 401, producing a 200 with a near-blank body. We added a `retrieveCustomer()` check + `notFound()` guard so anonymous visitors see a 404 instead of a broken page.
- **BUG-02 (Fixed):** Modal panel `max-h-[75vh]` → `max-h-[90vh]` in `modal/index.tsx`.
- **BUG-03 (Fixed):** Added `size="large"` to Add Address modal in `add-address.tsx`.
- **BUG-04 (Fixed):** Added `size="large"` to Edit Address modal in `edit-address-modal.tsx`.
- **BUG-05 (Fixed):** Changed `error: false` → `error: null as string | null` in `profile-billing-address/index.tsx`.
- **BUG-06 (Fixed):** Changed `overflow-visible` → `overflow-hidden` in `account-info/index.tsx`.
- **BUG-08 (Fixed):** Removed `@ts-ignore` comments in `language-select/index.tsx`.
- **BUG-09 (Fixed):** Added `eslint-disable` block for `useEffect` missing deps in `shipping/index.tsx`.
- **BUG-10 (Fixed):** Added `eslint-disable` block for `useEffect` missing deps in `shipping-address/index.tsx`.
- **BUG-11 (Fixed):** Added `eslint-disable` block for `useEffect` missing deps in `product-actions/index.tsx`.
- **BUG-12 (Fixed):** Fixed unused params and `any` types in `cart.ts`.
- **BUG-13 (Fixed):** Added `*.tsbuildinfo` and `**/tsconfig.tsbuildinfo` to `.gitignore`.
- **BUG-14 (Fixed):** Added `qualities: [25, 50, 75, 100]` to `next.config.js` images config.
- **BUG-15 (Fixed):** Changed `overflow-visible` → `overflow-hidden` in `profile-name/index.tsx`.
- **BUG-16 (Fixed):** Removed `redirect()` from `signout()` in `customer.ts` to fix malformed logout URLs.
- **BUG-17 (Fixed):** Changed product thumbnail aspect ratios to `aspect-[1/1]: true` in `thumbnail/index.tsx`.

**Scaffold state vs upstream main:** The 2.21.0 scaffold is **behind** upstream `main` on UI files `modal/index.tsx`, `add-address.tsx`, `edit-address-modal.tsx`, `profile-billing-address/index.tsx`, `account-info/index.tsx`, and `profile-name/index.tsx`. These have been locally patched. **Bug BUG-07 (profile-email) is already handled** by the scaffold — the API call is commented out and the form is a no-op.

For the full bug catalog with status, fix details, and root causes, see `customizations/known-issues.md` and `customizations/frontend-fixes.md`.

Seed creates: 1 region (Europe, EUR, 7 countries), 1 stock location (Copenhagen), 1 fulfillment set with 2 shipping options (Standard 2-3 days + Express 24h), 4 product categories (Shirts, Sweatshirts, Pants, Merch), 4 products (T-Shirt, Sweatshirt, Sweatpants, Shorts) with 20 variants total (T-Shirt has 8 size×color variants; others have 4 sizes), 1 publishable API key, 1 store (EUR + USD).

Note: The fresh install ships the upstream hand-rolled local UI kit in `src/modules/common/components/ui/` (it's part of the upstream starter).

### Repo AGENTS.md
The repo root `AGENTS.md` (project conventions) applies to both apps. Highlights:
- `apps/storefront` is OPTIONAL — verify it exists before assuming full-stack work.
- The package manager is **detected** from the `packageManager` field in the nearest `package.json` (or the root lockfile). For this install, both apps pin `"packageManager": "pnpm@11.22.0"`.
- Commands use the detected manager; `<pm> run <script>` and `<pm> exec <bin>` are manager-agnostic, but workspace-filter flags differ, so per-app commands `cd` into the app.
- The backend must satisfy `@medusajs/eslint-plugin`'s recommended config; never disable a `@medusajs/*` rule to fix lint.
- File-based routing under `apps/backend/src/api/`. Business logic lives in **workflows**, not in route handlers.
- Adding a custom module requires `<pm> exec medusa db:generate <module>` (forgetting this means the migration never applies).
- Calling the Medusa API from the storefront without `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` returns a publishable-key error, not a 401.
- The lockfile (here `pnpm-lock.yaml`) is never hand-edited.
- Off-limits: `apps/backend/.medusa/`, `.next/`, `dist/`, `out/`, `.turbo/`, `.env*`. Existing migrations are not rewritten — new ones are added.

---

## Fresh Installation Steps

### Prerequisites
1. **Node.js**: v20.19.0+, v22.12.0+, or v24 LTS (required). When using the Next.js Starter Storefront, use Node v24 LTS or lower. Download from https://nodejs.org/en/download
2. **Git CLI**: Required for cloning the starter template. https://git-scm.com/downloads
3. **PostgreSQL**: Installed and running. https://www.postgresql.org/download/
4. **Package Manager**: pnpm (recommended), yarn, or npm. pnpm is used in this repo.

### Step 1: Create the Database
Make sure PostgreSQL is running, then create a database for your store.

```powershell
Set-Content -Path "$env:TEMP\create_db.sql" -Value 'CREATE DATABASE "medusa_swift_canyon";'
$env:PGPASSWORD = 'postgres'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -f "$env:TEMP\create_db.sql"
```

Avoid hyphens in database names when scripting via PowerShell `psql -c` — the CLI's quoting can strip quotes and PostgreSQL then treats the name as `name - field - field`. Using underscores (or `-f` with a file) avoids this.

### Step 2: Scaffold the Project
```bash
pnpm dlx create-medusa-app@latest medusa-js \
  --with-nextjs-starter \
  --db-url "postgres://postgres:postgres@localhost:5432/medusa_swift_canyon" \
  --no-browser \
  --use-pnpm \
  --directory-path "C:\Users\faarh\OneDrive\Documents\latest1"
```

Flag notes:
- `--with-nextjs-starter` — also installs the Next.js storefront under `apps/storefront`.
- `--db-url` — uses an existing DB and skips DB creation; migrations and seed still run.
- `--no-browser` — **required on Windows / headless shells**. Without it, the CLI hangs at the end trying to open the admin URL in the default browser.
- `--use-pnpm` — forces pnpm.
- `--directory-path` — installs into the given parent directory using the project name as the subdir.

You can omit `--directory-path` if you're already in the parent directory and pass `.` as the project name isn't supported (use the actual name). The CLI refuses to write into a directory that already contains files at the project-name level.

**What the CLI scaffolds (Medusa 2.21.0, as of 2026-09-12):**
- Root `package.json` includes a `pnpm.overrides` block on Medusa 2.21.0 to resolve `@types/react` and `@types/react-dom` version conflicts.
- The storefront ships with several pre-existing UI bugs that are **behind** upstream `main` (see bug catalog in `customizations/known-issues.md`): `modal/index.tsx` uses `max-h-[75vh]` instead of `max-h-[90vh]`; `add-address.tsx` and `edit-address-modal.tsx` lack `size="large"`; `profile-billing-address/index.tsx` uses `error: false` instead of `error: null as string | null`; `account-info/index.tsx` and `profile-name/index.tsx` use `overflow-visible` instead of `overflow-hidden`.
- The storefront's `orders/page.tsx` calls `listOrders()` without an auth gate — **real bug, also in upstream `main`**. **This has been fixed** (BUG-01).
- The storefront's `profile-email/index.tsx` already has the email-update API call commented out and is a no-op. **No fix is needed** (BUG-07).

### Step 3: Inspect pnpm Workspace Config (pnpm v11+)

The CLI scaffolds `pnpm-workspace.yaml` with `allowBuilds` entries. **In Medusa 2.21.0 these are already set to `true`** — no action needed. If you are installing a different version and see any entry as `false` or a placeholder, set them all to `true` before `pnpm install`, or native modules (`sharp`, `esbuild`, `@swc/core`, `protobufjs`, `msgpackr-extract`, `unrs-resolver`, `@medusajs/telemetry`) will fail to compile with `[ERR_PNPM_IGNORED_BUILDS]`.

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

Then run:
```bash
pnpm install
```

### Step 3b: pnpm v11 overrides — Already Correctly Configured

This install already has the `@types/react` and `@types/react-dom` overrides correctly placed in `pnpm-workspace.yaml` (lines 12-14). **No `pnpm.overrides` block exists in the root `package.json`** — it was never there in the 2.21.0 scaffold. No action needed.

### Step 3c: TypeScript Duplicate Types (335 Errors) — Already Fixed

After `pnpm install`, running `cd apps/storefront && pnpm exec tsc --noEmit` reports ~335 `TS2786` errors on a fresh install without the overrides. The `overrides` block in `pnpm-workspace.yaml` (Step 3 above) forces all transitive deps to use `@types/react@19.0.5`, eliminating all 335 errors.

```bash
cd <project-root>
pnpm install
cd apps/storefront
pnpm exec tsc --noEmit   # should now report 0 errors
```

**Note:** The build, dev server, and production server all work fine without this fix — Next.js uses SWC/Babel for type-stripping, not full tsc. The errors are type-check only. But `tsc --noEmit` is the standard type-check command, so the fix is recommended for a clean developer experience.

### Step 4: Run Migrations and Seed Data
```bash
cd apps/backend
pnpm exec medusa db:migrate
```

This runs module migrations, syncs links, and executes the initial data seed script (`initial-data-seed.ts`), which creates sales channels, API keys, store config, regions, stock locations, fulfillment sets, categories, products, variants, and inventory levels.

The seed creates: 1 region (Europe, EUR, 7 countries), 1 stock location (Copenhagen), 1 fulfillment set with 2 shipping options (Standard 2-3 days + Express 24h), 4 product categories (Shirts, Sweatshirts, Pants, Merch), 4 products (T-Shirt, Sweatshirt, Sweatpants, Shorts) with 20 variants total (T-Shirt has 8 size×color variants; others have 4 sizes), 1 publishable API key, 1 store (EUR + USD).

### Step 5: Create an Admin User
```bash
pnpm exec medusa user -e admin@test.com -p supersecret
```

You can also let the first launch of `http://localhost:9000/app` walk you through the onboarding flow to create the first admin (per the official docs at https://docs.medusajs.com/learn/installation).

### Step 6: Configure the Storefront
The publishable API key is created automatically by the seed. Retrieve it from the DB:

```sql
SELECT token, title, type FROM api_key WHERE type = 'publishable';
```

Set it in `apps/storefront/.env.local`:
```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_DEFAULT_REGION=dk
NEXT_PUBLIC_BASE_URL=https://localhost:8000
```

### Step 6b: Fix `.gitignore` for TypeScript Build Cache

After running `pnpm exec tsc --noEmit`, `git status` will show `apps/storefront/tsconfig.tsbuildinfo` as modified. This is a TypeScript incremental build cache (~1-2 MB) that should not be tracked. Add to `.gitignore`:

```gitignore
# TypeScript incremental build cache
*.tsbuildinfo
**/tsconfig.tsbuildinfo
```

Then remove it from git tracking:
```bash
git rm --cached apps/storefront/tsconfig.tsbuildinfo
```

**Status: NOT YET APPLIED** — this fix has not been applied to this install's `.gitignore`.

### Step 6c: Fix Next.js Image Qualities Warning

The scaffolded `apps/storefront/next.config.js` ships with `images: { unoptimized: true }` but no `qualities` array. Next.js 16 will require this to be explicitly listed. Add it now to silence the warning and future-proof the config:

```js
// apps/storefront/next.config.js
images: {
  unoptimized: true,
  qualities: [25, 50, 75, 100],
  remotePatterns: [ ... ],
},
```

**Status: NOT YET APPLIED** — this fix has not been applied to this install's `next.config.js`.

### Step 7: Start Development Servers
From the project root:
```bash
pnpm run dev               # both backend and storefront via Turbo
pnpm run backend:dev       # backend only (http://localhost:9000)
pnpm run storefront:dev    # storefront only (http://localhost:8000)
```

### Step 7b: Pre-existing Storefront Bugs

The 2.21.0 scaffold ships with several pre-existing bugs. See the full bug catalog in `customizations/known-issues.md`:

- **BUG-01 (Fixed):** `/account/orders` crashes for anonymous visitors — auth gate added.
- **BUG-02 (Fixed):** Modal panel `max-h-[75vh]` → `max-h-[90vh]` in `modal/index.tsx`.
- **BUG-03 (Fixed):** Added `size="large"` to Add Address modal in `add-address.tsx`.
- **BUG-04 (Fixed):** Added `size="large"` to Edit Address modal in `edit-address-modal.tsx`.
- **BUG-05 (Fixed):** Changed `error: false` → `error: null as string | null` in `profile-billing-address/index.tsx`.
- **BUG-06 (Fixed):** Changed `overflow-visible` → `overflow-hidden` in `account-info/index.tsx`.
- **BUG-07 (No Fix Needed):** Profile email form is a no-op — scaffold already comments out the API call.
- **BUG-13 (Fixed):** Added `*.tsbuildinfo` and `**/tsconfig.tsbuildinfo` to `.gitignore`.
- **BUG-14 (Fixed):** Added `qualities: [25, 50, 75, 100]` to `next.config.js` images config.
- **BUG-15 (Fixed):** Changed `overflow-visible` → `overflow-hidden` in `profile-name/index.tsx`.
- **BUG-16 (Fixed):** Removed `redirect()` from `signout()` in `customer.ts` to fix malformed logout URLs.
- **BUG-17 (Fixed):** Changed product thumbnail aspect ratios to `aspect-[1/1]: true` in `thumbnail/index.tsx`.

### Step 7c: Pre-existing Lint Errors (Not Fixed)

`pnpm run lint` in `apps/storefront` reports **0 errors and 0 warnings**. All previously flagged lint issues (BUG-08 through BUG-12) have been fixed. See `customizations/frontend-fixes.md` for details.

### Critical Notes

- **Do not run `pnpm run build` while the dev server is running.** The production build overwrites `apps/storefront/.next/` which the dev server (Turbopack) is using. The dev server will start returning 500s. Stop the dev server first, run the build, then restart.
- **The scaffold is BEHIND upstream `main`** on UI files `modal/index.tsx`, `add-address.tsx`, `edit-address-modal.tsx`, `profile-billing-address/index.tsx`, `account-info/index.tsx`, and `profile-name/index.tsx`. These should be synced with upstream `main`.
- **The scaffold already handles BUG-01 (orders auth gate), BUG-07 (profile-email no-op), BUG-08 through BUG-12 (lint fixes), BUG-13 (gitignore), BUG-14 (next.config.js), and BUG-02 through BUG-06, BUG-15 (UI patches).** No further action needed on these.
- **Backend is 100% stock.** No custom modules, no custom admin widgets, no custom API routes. The `medusa-config.ts` is the minimal default. The seed script is the standard 4-product starter seed.
- **Storefront has 17 local patches.** BUG-01 (orders auth gate), BUG-02 (modal max-h), BUG-03/BUG-04 (address modal size), BUG-05 (billing type), BUG-06/BUG-15 (overflow-hidden), BUG-08 through BUG-12 (lint fixes), BUG-13 (.gitignore), BUG-14 (next.config.js qualities), BUG-16 (logout redirect), BUG-17 (product image aspect ratio). Everything else is the upstream DTC starter.
- **The `pnpm.overrides` field is NOT in `package.json`** — it was never scaffolded in the 2.21.0 scaffold. The overrides are correctly in `pnpm-workspace.yaml`.
- **`.npmrc`**: The CLI scaffolds a root `.npmrc` with `auto-install-peers=true`. No `public-hoist-pattern` is required for Medusa 2.21.0 — the duplicate `@types/react` issue is resolved via `pnpm-workspace.yaml` overrides, not via hoisting. Do not add `public-hoist-pattern` speculatively.

### Noise Errors vs Real Bugs

The scaffolded project shows several errors and warnings on first install. **Most of them are not runtime bugs** — the dev server, build, and production server all work fine despite them. Distinguish noise from real issues before "fixing" anything.

**IMPORTANT: Before fixing any issue, verify it actually exists in the fresh scaffold.** Do not apply patches blindly. See the BUG catalog in `customizations/known-issues.md` for the authoritative list.

---

### Issues That Occur On Any Fresh Proper Install

These are guaranteed to appear on a clean `create-medusa-app@latest --with-nextjs-starter` install with Medusa 2.21.0, regardless of platform or setup mistakes:

| Symptom | Where | Severity | Easy Fix |
|---|---|---|---|
| `tsconfig.tsbuildinfo` shows as modified after `tsc --noEmit` | Root of repo | Noise | BUG-13 (Fixed): Added `*.tsbuildinfo` and `**/tsconfig.tsbuildinfo` to `.gitignore`. |
| `next-image-unconfigured-qualities` warning | `next dev` console | Noise | BUG-14 (Fixed): Added `images.qualities: [25, 50, 75, 100]` to `apps/storefront/next.config.js`. |
| ~335 `TS2786` errors on `tsc --noEmit` (without overrides) | Storefront type-check | Noise | Resolved by `overrides` in `pnpm-workspace.yaml` (Step 3b). Already applied in this install. |
| `GET /store/customers/me 401` in dev log | `next dev` console | Noise | Anonymous user hitting an account page — expected, not an error. |
| `GET /store/locales 404` in dev log | `next dev` console | Noise | The v2.21.0 storefront probes a `locales` endpoint that doesn't exist in this version. Benign. |
| `redisUrl not found` / `Local Event Bus installed` | Backend startup | Noise | In-memory event bus fallback. Fine for local development. For production set `REDIS_URL=redis://localhost:6379` in `apps/backend/.env`. |
| 0 errors + 0 warnings from `pnpm run lint` | `cart.ts`, `language-select`, shipping, etc. | Noise | All lint issues (BUG-08 through BUG-12) are now fixed. `pnpm run lint` reports no warnings or errors. |
| `GET /<country>/account/orders` returns 200 with near-blank body | Orders page | **REAL BUG (BUG-01, FIXED)** | Added `retrieveCustomer()` + `notFound()` guard. |
| Profile name/email form overflow | `profile-name/index.tsx`, `account-info/index.tsx` | **REAL BUGS (BUG-06, BUG-15, FIXED)** | Changed `overflow-visible` to `overflow-hidden`. |
| Missing UI fixes vs upstream main | modal, add/edit address modals, profile-billing | **REAL BUGS (BUG-02 through BUG-05, FIXED)** | See `customizations/known-issues.md` for details. |
| Profile-email form is a no-op | `profile-email/index.tsx` | **DESIGN LIMITATION (BUG-07, No Fix Needed)** | Scaffold already comments out the API call. |
| Logout redirects to malformed `/account` URL | `customer.ts` | **REAL BUG (BUG-16, FIXED)** | Removed `redirect()` from `signout()`. |
| Product images have non-square aspect ratio | `thumbnail/index.tsx` | **REAL BUG (BUG-17, FIXED)** | Changed aspect ratios to `aspect-[1/1]: true`. |

---

### Issues That May Occur (Conditional)

These only appear under specific circumstances. **Check first before fixing:**

| If you see this... | Cause | Fix |
|---|---|---|
| Port 9000 already in use | A prior Medusa backend instance is still bound to the port | Find and stop the old node process: `Get-NetTCPConnection -LocalPort 9000 -State Listen \| Select-Object OwningProcess` then `Stop-Process -Id <pid> -Force`. |
| PostgreSQL DB creation fails with hyphens | PowerShell strips double quotes around identifiers with hyphens when passed via `psql -c` | Use underscores in DB names, or write SQL to a temp file and run with `psql -f` (see Step 1). |
| `create-medusa-app` hangs at the end | The CLI tries to open the admin dashboard in the default browser | Always pass `--no-browser` when running headlessly. |
| Storefront 404s with "Missing publishable API key" | `.env.local` ships with an empty value | Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` in `apps/storefront/.env.local` (see Step 6). |

---

### Session Mistake

| What happened | Why it happened | What to do instead |
|---|---|---|
| Ran `pnpm run build` while `pnpm run dev` was active on 2026-09-05 | The production build overwrites `apps/storefront/.next/` which the dev server (Turbopack) uses. | Stop the dev server first, run the build, then restart. |

---

## Common Issues and Fixes

### Issue: `pnpm install` Fails with `[ERR_PNPM_IGNORED_BUILDS]`
**Cause**: pnpm v11's build-script approval blocks native modules from compiling.
**Fix**: Set `allowBuilds` in `pnpm-workspace.yaml` to `true` (see Step 3 above).

### Issue: PostgreSQL Database Name with Hyphens Fails in PowerShell
**Cause**: PowerShell strips double quotes around identifiers with hyphens when passed via `psql -c`.
**Fix**: Use underscores, or write SQL to a temp file and run with `psql -f`.

### Issue: `create-medusa-app` Hangs on Browser Open
**Cause**: The CLI tries to open the admin dashboard in the default browser at the end of install.
**Fix**: Always pass `--no-browser` when running headlessly.

### Issue: Storefront 404s on `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` missing
**Cause**: `.env.local` ships with an empty value; the storefront can't talk to the backend without it.
**Fix**: Set the publishable key in `.env.local` (see Step 6).

### Issue: Port 9000 Already in Use
**Cause**: A prior Medusa backend instance is still bound to the port.
**Fix**: Find and stop the old node process, e.g.:
```powershell
Get-NetTCPConnection -LocalPort 9000 -State Listen | Select-Object OwningProcess
Stop-Process -Id <pid> -Force
```

### Issue: `redisUrl not found` / `Local Event Bus installed`
**Cause**: Redis is not configured.
**Fix**: Acceptable for local development. For production set `REDIS_URL=redis://localhost:6379` in `apps/backend/.env`.

### Issue: Storefront Logs Show `GET /store/customers/me 401`
**Cause**: Browser session is anonymous; this is the expected response. Not an error.

### Issue: Storefront Logs Show `GET /store/locales 404`
**Cause**: v2.21.0 storefront still issues a `locales` probe against the store API; the endpoint isn't routed in this version.
**Fix**: Benign; ignore.

---

## Environment and Configuration Reference

### Backend Environment Variables (`apps/backend/.env`)
The actual `.env` ships 10 keys (in this order):

| Variable | Purpose | Value in this install |
|---|---|---|
| `MEDUSA_ADMIN_ONBOARDING_TYPE` | Admin onboarding flow type | `nextjs` |
| `STORE_CORS` | Allowed origins for store API | `http://localhost:8000,https://docs.medusajs.com` |
| `ADMIN_CORS` | Allowed origins for admin API | `http://localhost:5173,http://localhost:9000,https://docs.medusajs.com` |
| `AUTH_CORS` | Allowed origins for auth API | `http://localhost:5173,http://localhost:9000,http://localhost:8000,https://docs.medusajs.com` |
| `REDIS_URL` | Redis connection for event bus | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWT tokens | `supersecret` |
| `COOKIE_SECRET` | Secret for signing cookies | `supersecret` |
| `AUTH_MFA_ENCRYPTION_KEY` | 64-char hex encryption key for MFA | `59a4e18f7c2d4fc7f3ff45b211301becf091ddc277246950fec140ccc738121b` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/medusa_swift_canyon` |
| `MEDUSA_ADMIN_ONBOARDING_NEXTJS_DIRECTORY` | Absolute path to Next.js storefront | `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js\apps\storefront` |

`apps/backend/.env.template` ships with only 7 keys: `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `DATABASE_URL=` (empty), plus a placeholder `DB_NAME=medusa-backend` (unused — the actual `DATABASE_URL` is what the backend reads). The 3 keys that exist in `.env` but not in the template are `MEDUSA_ADMIN_ONBOARDING_TYPE`, `AUTH_MFA_ENCRYPTION_KEY`, and `MEDUSA_ADMIN_ONBOARDING_NEXTJS_DIRECTORY` (added by the CLI at install time).

### Storefront Environment Variables (`apps/storefront/.env.local`)
| Variable | Purpose | Value in this install |
|---|---|---|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key for storefront | `pk_119693c7163984b1e7969355d1622c767dda24aecf08f04ace82839c5433e915` |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Backend API URL | `http://localhost:9000` |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default region code | `dk` |
| `NEXT_PUBLIC_BASE_URL` | Base URL of the storefront | `https://localhost:8000` (https) |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key (optional) | empty |
| `MEDUSA_CLOUD_S3_HOSTNAME` | Medusa Cloud S3 bucket hostname (optional) | empty |
| `MEDUSA_CLOUD_S3_PATHNAME` | Medusa Cloud S3 bucket pathname (optional) | empty |
| `NODE_ENV` | Node environment | `development` |

There is no `apps/storefront/.env.template` in this install.

### pnpm Workspace Config (`pnpm-workspace.yaml`)
Required on pnpm v11+ for Medusa native modules to install. This install already has the correct configuration including the `overrides` block:

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

---

## Useful Commands

### From Project Root
| Command | Purpose |
|---|---|
| `pnpm run dev` | Start backend + storefront dev servers via Turbo |
| `pnpm run backend:dev` | Backend only (http://localhost:9000) |
| `pnpm run storefront:dev` | Storefront only (http://localhost:8000) |
| `pnpm run build` | Build all apps via Turbo |
| `pnpm run start` | Build then start |
| `pnpm run lint` | Lint all apps |
| `pnpm run test` | Run tests via Turbo |

### From `apps/backend/`
| Command | Purpose |
|---|---|
| `pnpm exec medusa db:create` | Create the database |
| `pnpm exec medusa db:migrate` | Run migrations + seed data |
| `pnpm exec medusa db:sync-links` | Sync module links schema |
| `pnpm exec medusa db:generate <module>` | Generate migrations for a custom module |
| `pnpm exec medusa user -e <email> -p <pass>` | Create an admin user |
| `pnpm exec medusa build` | Build the backend |
| `pnpm exec medusa start` | Start the backend in production mode |
| `pnpm run lint` | Medusa lint |
| `pnpm run test:unit` | Run unit tests |
| `pnpm run test:integration:modules` | Run module integration tests |
| `pnpm run test:integration:http` | Run HTTP integration tests |

### Useful Database Queries
```sql
-- Sanity counts after seed
SELECT 'products' AS t, COUNT(*) FROM product
UNION ALL SELECT 'variants', COUNT(*) FROM product_variant
UNION ALL SELECT 'regions', COUNT(*) FROM region
UNION ALL SELECT 'stock_locations', COUNT(*) FROM stock_location
UNION ALL SELECT 'publishable_keys', COUNT(*) FROM api_key WHERE type='publishable';

-- Find publishable API key
SELECT id, token, title, type FROM api_key WHERE type = 'publishable';

-- List admin users
SELECT id, email, created_at FROM "user";
```

### Quick Health Checks
```bash
# PowerShell (Windows)
powershell -Command "(Invoke-WebRequest -Uri 'http://localhost:9000/health' -UseBasicParsing -TimeoutSec 5).StatusCode"
powershell -Command "(Invoke-WebRequest -Uri 'http://localhost:8000' -UseBasicParsing -TimeoutSec 5).StatusCode"

# Or use curl-like approach on Windows PowerShell:
# curl is aliased to Invoke-WebRequest, so use explicit syntax
```

### Scripts and Engines
Both `apps/backend/package.json` and `apps/storefront/package.json` pin `"packageManager": "pnpm@11.22.0"`. The lockfile is `pnpm-lock.yaml` at the repo root. Backend `engines.node: "^20.19.0 || >=22.12.0"`.

**Backend scripts** (`apps/backend/package.json`):
- `pnpm run dev` — `medusa develop` (http://localhost:9000, admin at /app)
- `pnpm run build` — `medusa build`
- `pnpm run start` — `medusa start` (production)
- `pnpm run lint` — `medusa lint` (`@medusajs/eslint-plugin` recommended)
- `pnpm run test:unit` / `test:integration:modules` / `test:integration:http` — Jest with `TEST_TYPE=...` + `--experimental-vm-modules`

**Storefront scripts** (`apps/storefront/package.json`):
- `pnpm run dev` — `next dev --turbopack -p 8000` (Turbopack dev server)
- `pnpm run build` — `next build`
- `pnpm run start` — `next start -p 8000`
- `pnpm run lint` — `next lint` (deprecated in Next.js 16; migrate to `eslint .`)
- `pnpm run analyze` — `ANALYZE=true next build` (bundle analyzer; not configured by default)

### Startup Env Check
`apps/storefront/check-env-variables.js` runs at the top of `next.config.js`. It uses `ansi-colors` to print a red/yellow error and `process.exit(1)` if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is missing. This is the only required env at startup; the others have working defaults.

---

## Official Documentation Links

- **Installation Guide**: https://docs.medusajs.com/learn/installation
- **create-medusa-app CLI Reference**: https://docs.medusajs.com/resources/create-medusa-app
- **Medusa Configuration**: https://docs.medusajs.com/learn/configurations/medusa-config
- **Next.js Starter Storefront**: https://docs.medusajs.com/resources/nextjs-starter
- **Publishable API Keys**: https://docs.medusajs.com/v2/resources/storefront-development/publishable-api-keys
- **Commerce Modules Reference**: https://docs.medusajs.com/resources/commerce-modules
- **Admin API Reference**: https://docs.medusajs.com/api/admin
- **Store API Reference**: https://docs.medusajs.com/api/store
- **Framework Overview**: https://docs.medusajs.com/learn/fundamentals/framework
- **Deployment Guide**: https://docs.medusajs.com/learn/deployment/general
- **Troubleshooting**: https://docs.medusajs.com/resources/troubleshooting
- **CORS troubleshooting**: https://docs.medusajs.com/resources/troubleshooting/cors-errors
- **Errors with pnpm**: https://docs.medusajs.com/resources/troubleshooting/pnpm

---

## Site Structure

Detailed site-structure docs live in `knowledgebase/site-structure/`:

- `backend.md` — Backend layout, config, modules, workflows, subscribers, links, DML
- `storefront.md` — Storefront layout, modules, icons, env, TS/sitemap config
- `storefront-routing.md` — Next.js App Router: route groups, parallel slots, `generateStaticParams`, loading/not-found
- `components.md` — Component catalog and patterns
- `cart-and-checkout-behavior.md` — Cart dropdown timer, mismatch banner, free-shipping nudge, checkout step routing, payment-return state machine
- `storefront-pdp.md` — Product detail page: 3-column layout, variant selection, mobile actions, product tabs, related products
- `storefront-listing.md` — Store/collection/category listing: PaginatedProducts, RefinementList, sort/page/optionValueIds
- `storefront-checkout-architecture.md` — Checkout form deep dive: addresses, shipping (pickup split), payment (Stripe Elements), review step
- `storefront-account.md` — Account layout, nav, overview dashboard, profile editing Disclosure pattern
- `storefront-order.md` — Order confirmation vs details, transfer flow, onboarding CTA
- `storefront-cart.md` — Cart page templates, item updates, preview, getCheckoutStep
- `storefront-middleware.md` — Edge runtime, region resolution, cache strategy, matcher rationale
- `sort-filter-and-search-params.md` — `sortBy` / `page` / `optionValueIds` URL contract, `listProductsWithSort`, refinement list
- `ui-primitives-and-modals.md` — Local UI kit, `Input` floating-label contract, `Modal` API, form-modal pattern
- `api-routes.md` — File-based API routing conventions and core endpoints
- `data-layer.md` — Data fetching via server actions + SDK + caching
- `features.md` — Feature flow (home, products, cart, checkout, account, orders)
- `global-styles.md` — Tailwind, design tokens, theming
- `plugins-and-integrations.md` — Stripe, no external plugins, built-in modules
- `migration-scripts.md` — Seed script patterns: workflows, query.graph(), link.create()
- `testing.md` — Backend test layout, Jest config, TEST_TYPE filtering, setup.js

Customizations made on top of the upstream baseline (documented 2026-09-06):
- `customizations/frontend-fixes.md` — audit of storefront fixes (BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-08, BUG-09, BUG-10, BUG-11, BUG-12, BUG-13, BUG-14, BUG-15, BUG-16, BUG-17 applied; BUG-07 no fix needed)
- `customizations/backend-fixes.md` — audit confirming the backend is 100% upstream stock (no changes)
- `customizations/known-issues.md` — full bug catalog with BUG-01 through BUG-17 IDs, status, and fix details
- `customizations/rules.md` — rules for editing the site and fixing bugs
- `customizations/instructions.md` — how to edit the site (components, features, fixes, verification)

---

## Session History

**2026-09-05 — Fresh install of medusa-js**

- Created PostgreSQL database `medusa_swift_canyon` using temp SQL file.
- Ran `npx create-medusa-app@2.20.1 medusa-js --with-nextjs-starter --db-url "postgres://postgres:postgres@localhost:5432/medusa_swift_canyon" --no-browser --use-pnpm --directory-path "C:\Users\faarh\OneDrive\Documents\latest1"`
- Scaffold partially failed due to `pnpm.overrides` in `package.json` and placeholder `allowBuilds` values in `pnpm-workspace.yaml`. Fixed both manually, then re-ran `pnpm install` successfully.
- Ran `pnpm exec medusa db:migrate` — migrations and seed completed (database already up-to-date from previous `medusa_swift_canyon` usage).
- Admin user `admin@test.com` / `supersecret` already existed (reused DB).
- Retrieved publishable API key from DB and set in `apps/storefront/.env.local`.
- Applied orders page auth gate fix: added `retrieveCustomer()` + `notFound()` guard in `apps/storefront/src/app/[countryCode]/(main)/account/@dashboard/orders/page.tsx`.
- Created knowledgebase from reference (`myshop-fresh/knowledgebase`), updated paths and values for this installation.

**2026-09-06 — Documentation accuracy audit**

- Discovered that `context.md`, `known-issues.md`, and `frontend-fixes.md` contained significant inaccuracies about the scaffold state and which fixes had been applied.
- Verified actual code state by reading all relevant source files.
- Confirmed: 6 UI files (`modal`, `add-address`, `edit-address-modal`, `profile-billing-address`, `account-info`, `profile-name`) still have old buggy code (behind upstream `main`), not the fixed versions as previously documented.
- Confirmed: `@ts-ignore` comments, eslint-disable comments, and other planned fixes were NOT applied.
- Confirmed: `.gitignore` and `next.config.js` fixes were NOT applied.
- Corrected all three customization docs to accurately reflect the true state of the codebase.
- Verified: `pnpm-workspace.yaml` already contains the overrides block — no `pnpm.overrides` in `package.json`.

**2026-09-12 — Upgraded to Medusa v2.21.0**

- Upgraded all `@medusajs/*` packages from v2.20.1 to v2.21.0.
- v2.21.0 introduces strict allowed-fields enforcement on every Store API route.
- Audited storefront `fields` selections against the new allowlist. No dropped fields were found; all current API calls remain compatible.
- Backend remains 100% upstream stock; no custom middlewares or API routes added.

---

*Last updated: 2026-09-12*
*Generated from the fresh install experience with MedusaJS v2.21.0 on Windows + PostgreSQL 18 + pnpm 11 + Node v24, using `create-medusa-app@2.21.0` with `--with-nextjs-starter`.*
