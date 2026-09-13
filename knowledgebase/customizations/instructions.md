# How to Edit the MedusaJS Site

This document is the single source of truth for making changes to the `medusa-js` project. It covers the project structure, how to make UI changes, bug fixes, add new features, create components, and verify your work.

> **Architecture-first rule:** Never copy-paste components or features from a reference codebase without first adapting them to this storefront's architecture, design tokens, routing conventions, and data layer. If a reference feature depends on a backend schema, module, or API that does not exist here, treat it as out of scope until the user explicitly asks for backend work.
>
> **Priority order:** 1) Designs and global styling first — apply global classes, tokens, and layout improvements to existing components. 2) Static/visual adaptations second — reference patterns that can be implemented with existing components and data, without creating new files or adding new data fetching. 3) New features third — only after the above, and only when the existing architecture cannot express the desired behavior.
>
> **No-duplicates rule:** When editing an existing page or component, reuse the site's current implementation. Do not create a second sorting UI, a second cart flow, or a second checkout step. Apply styling changes or extend the existing feature. Creating a duplicate fragment while leaving the original intact causes divergence, doubles maintenance, and breaks the single source of truth.

## Bug Tracking

All bugs use a `BUG-01` through `BUG-99` identifier system:
- `BUG-01` through `BUG-99` — ordered by priority (critical runtime bugs first, UI polish last)
- Each bug gets a status: **(Fixed)**, **(Not Fixed)**, or **(No Fix Needed)**
- Bug details live in `known-issues.md`
- Fix details live in `frontend-fixes.md`

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Development Environment](#development-environment)
3. [Making Changes](#making-changes)
    - [UI Changes](#ui-changes)
    - [Using Shared Components](#using-shared-components)
    - [Static Features](#static-features)
    - [Theme Tokens](#theme-tokens)
    - [Bug Fixes](#bug-fixes)
    - [Adding New Features](#adding-new-features)
    - [Creating Components](#creating-components)
4. [Backend Changes](#backend-changes)
5. [Config Changes](#config-changes)
6. [Verification](#verification)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Project Structure

```
medusa-js/
├── apps/
│   ├── backend/                  # Medusa backend (@dtc/backend)
│   │   ├── medusa-config.ts      # Backend config: DB URL, CORS, secrets, modules
│   │   ├── integration-tests/    # setup.js (Jest setupFiles) and http/*.spec.ts suites
│   │   └── src/
│   │       ├── admin/            # Admin dashboard extensions (widgets/, i18n/, routes)
│   │       ├── api/              # API routes: api/store/*, api/admin/* (file-based)
│   │       ├── jobs/             # Scheduled jobs
│   │       ├── links/            # Module links between modules
│   │       ├── migration-scripts/# Data migration scripts (e.g. initial-data-seed.ts)
│   │       ├── modules/          # Custom modules (service + models + migrations)
│   │       ├── subscribers/      # Event subscribers
│   │       └── workflows/        # Workflows and workflow steps
│   └── storefront/               # Next.js storefront (@dtc/storefront)
│       ├── .env.local            # Storefront env vars
│       ├── next.config.js        # Next.js config
│       └── src/
│           ├── app/              # Next.js App Router (pages)
│           ├── lib/              # Server actions, data layer, hooks
│           └── modules/          # Feature modules
│               ├── common/       # Shared components (ui, modal, input, icons)
│               ├── account/      # Account pages (profile, addresses, orders)
│               ├── cart/         # Cart page and components
│               ├── checkout/     # Checkout flow
│               ├── layout/       # Site layout, header, footer, language select
│               ├── order/        # Order confirmation and details
│               └── products/     # Product listing, preview, actions
├── knowledgebase/                # Project documentation
│   ├── context.md                # Environment details, install history, scaffold state
│   ├── site-structure/           # Architecture and behavior docs
│   └── customizations/           # Bug tracking, fixes, rules, instructions
└── turbo.json                    # Task graph: build, dev, start, lint, test, seed
```

---

## Development Environment

### Prerequisites

- Node.js v24 LTS (or v20.19.0+, v22.12.0+)
- pnpm 11.x (the project pins `pnpm@11.22.0`)
- PostgreSQL 15+ running on localhost:5432
- Medusa 2.20.1

### Environment Variables

**Backend** (`apps/backend/.env`):
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_SECRET` | JWT signing secret |
| `COOKIE_SECRET` | Cookie signing secret |
| `REDIS_URL` | Redis for event bus (optional for local dev) |
| `STORE_CORS` | Allowed origins for store API |
| `ADMIN_CORS` | Allowed origins for admin API |
| `AUTH_CORS` | Allowed origins for auth API |

**Storefront** (`apps/storefront/.env.local`):
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key (required) |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Backend API URL (`http://localhost:9000`) |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default region code (`dk`) |
| `NEXT_PUBLIC_BASE_URL` | Storefront base URL (`https://localhost:8000`) |

### Running the Dev Servers

```bash
# From project root — starts both backend and storefront
pnpm run dev

# Backend only (http://localhost:9000, admin at /app)
pnpm run backend:dev

# Storefront only (http://localhost:8000)
pnpm run storefront:dev
```

### Package Manager

Always use the detected package manager (pnpm in this project). Never introduce a second lockfile.

```bash
# Install dependencies
pnpm install

# Run a script in a specific app
cd apps/backend && pnpm run lint
cd apps/storefront && pnpm run lint
```

---

## Making Changes

### General Workflow

1. **Read the file first.** Use the Read tool to inspect the current state before editing.
2. **Identify the exact line(s) to change.** Use Grep to find the pattern if needed.
3. **Make the minimal change.** One logical change per Edit call.
4. **Verify the change.** Run `tsc --noEmit` and `pnpm run lint` in the affected app.
5. **Confirm runtime health.** Hit the dev server endpoint to ensure no 500s.
6. **Document the change.** Update `known-issues.md`, `frontend-fixes.md`, and `context.md` if needed.

### When to Edit the Site

Only make changes when:
- There is a confirmed, reproducible bug with a clear root cause.
- The user explicitly asks for a feature or fix.
- A documentation audit reveals the docs disagree with the actual code state (in that case, fix the docs, not the code).

Do NOT make changes when:
- The issue is listed as "Noise" in `known-issues.md` (e.g., `redisUrl not found`, `GET /store/locales 404`, `next lint` deprecation warning).
- The fix would require disabling an `@medusajs/*` ESLint rule. Fix the code instead.
- The change would alter runtime behavior of upstream no-op stubs.
- You are unsure whether the issue is real. Ask first.

---

## UI Changes

### Rules for UI Changes

- Use existing Tailwind utility classes. Do not add new CSS files or inline styles.
- **For one-off component styling (icon buttons, small controls, etc.), prefer inline Tailwind utilities over new global CSS classes.** When a component needs a specific visual treatment not covered by existing global classes, express it directly in the component's `className` using Tailwind utilities (e.g., `w-8 h-8` for a 32px icon button). Do not create new CSS utility classes in `globals.css` for single-component patterns — inline the utilities. All header icon buttons use `inline-flex items-center justify-center w-8 h-8 rounded-full border border-ui-border-base ...` inline — not a `.btn-icon` class.
- Match the existing component pattern: if a component uses `"use client"`, keep it. If it is a server component, keep it server-side.
- Use the existing module alias imports (`@modules/...`, `@lib/...`). Do not add new path aliases.
- Reuse existing UI primitives from `src/modules/common/components/ui/` (Button, Heading, Badge, Text, Input, etc.). Do not introduce new UI libraries.
- For modals, use the existing `Modal` component from `@modules/common/components/modal`. Pass `size="large"` only when the form content genuinely needs more width (e.g., address forms with multiple columns).

### Example — Widening a Modal

```tsx
// Before
<Modal isOpen={state} close={close} data-testid="add-address-modal">

// After
<Modal isOpen={state} close={close} size="large" data-testid="add-address-modal">
```

### Example — Fixing Overflow in a Disclosure.Panel

```tsx
// Before
className="... overflow-visible ..."

// After
className="... overflow-hidden ..."
```

### Example — Fixing Modal Max Height

```tsx
// Before (modal/index.tsx line 62)
className="... max-h-[75vh] ..."

// After
className="... max-h-[90vh] ..."
```

---

## Using Shared Components

The storefront includes shared components in `src/modules/common/components/shared/` that implement common UI patterns. Use these instead of duplicating code across pages.

**Available shared components:**
- `PageBanner` — page header with breadcrumb, title, description, badge, and optional background image
- `CategoryBarCarousel` — horizontal scrollable category button track with drag-to-scroll
- `RecentlyViewedSection` — horizontal scrollable product strip with scroll controls

**How to use:**
```tsx
import { PageBanner } from "@modules/common/components/shared/page-banner"
import { CategoryBarCarousel } from "@modules/common/components/shared/category-bar"
import { RecentlyViewedSection } from "@modules/common/components/shared/recently-viewed"

// PageBanner — use for any page-level hero with breadcrumb
<PageBanner
  title="Explore All Categories"
  description="Browse our structured collections..."
  badge="Department Catalog"
  themeColor="blue"
  onBack={() => router.push('/')}
  backLabel="Home"
  backgroundImage="https://..."
/>

// CategoryBarCarousel — use on any page that needs category filtering
<CategoryBarCarousel
  categories={categories}
  selectedCategory={activeCategory}
  onSelectCategory={(name) => router.push(getCategoryUrl(name))}
  themeColor={themeColor}
  currentTheme={currentTheme}
/>

// RecentlyViewedSection — use wherever recently viewed products should appear
<RecentlyViewedSection
  products={products}
  currentProductId={product.id}
  onSelectProduct={(id) => router.push(getProductUrl(id))}
  title="Recently Viewed Items"
  maxItems={10}
/>
```

**Rules:**
- Always pass `themeColor` to shared components that support it.
- Do not modify shared components to suit a single page. Add a prop with a sensible default instead.
- Shared components are client components. Do not wrap them in server components that need to pass event handlers as props.
- For full API reference, see `customizations/shared-components.md`.

---

## Static Features (No Schema Changes)

Many storefront enhancements can be implemented without touching the backend. These are called "static features."

**What counts as static:**
- New pages (About, FAQ, Contact, policy pages) — no new data requirements
- New UI sections (testimonials, brand grids, feature lists)
- New shared components
- Client-side features (wishlist, recently viewed, quick view modals)
- Theme and styling changes
- Static data files (navigation links, feature flags, SEO configs)

**Where to put static features:**
- New pages: `src/app/[countryCode]/(main)/<page>/page.tsx`
- New components: `src/modules/<feature>/components/` or `src/modules/common/components/`
- Static data: `src/lib/constants.tsx` or `src/data/`
- Global styles: `src/styles/globals.css` and `tailwind.config.js`

**Using existing Medusa data:**
Before adding static mock data, check if the data already exists in Medusa:

| Need | Use This |
|---|---|
| Product listings | `listProducts()` from `@lib/data/products` |
| Categories | `listCategories()` from `@lib/data/products` |
| Collections | `listCollections()` from `@lib/data/products` |
| Regions/countries | `listRegions()` from `@lib/data/cart` |
| Store info | `store` object from SDK |
| Customer data | `retrieveCustomer()` from `@lib/data/customer` |

**Client-side-only features:**
- Use `"use client"` at the top of the component.
- Fetch data via existing server actions (`@lib/data/*`) or the Medusa SDK.
- Store client-side state in `localStorage` or React context. Do not create new backend tables for client-only features.

**When to use static vs backend:**

| Scenario | Approach |
|---|---|
| New UI pattern on 2+ pages | Shared component in `common/components/shared/` |
| New page with no new data | Static page in `app/[countryCode]/(main)/` |
| New section on existing page | Component in the relevant feature module |
| New data not in Medusa | Static array/object in `src/lib/` or `src/data/` |
| New data editable in admin | Backend module + migration — not static |
| New API behavior | Backend workflow + route — not static |

For full details, see `customizations/static.md`.

---

## Theme Tokens

**Rules for theme and styling:**
- Use `@medusajs/ui-preset` tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`) for foreground, background, and border colors.
- For theme accents (blue, indigo, emerald, rose, amber, slate), use the `theme.*` color scale (e.g. `text-theme-blue-600`, `bg-theme-rose-500`).
- For gradients and decorative effects, use utilities from `globals.css` (`bg-gradient-theme-*`, `glow-theme-*`). Do not hardcode gradient class strings in components.
- Use `getThemeClasses()` from `src/lib/theme-utils.ts` when you need a set of coordinated classes for a theme color.
- Do not add new CSS files or inline `<style>` tags. All global styles go in `globals.css` or `tailwind.config.js`.
- Do not modify `@medusajs/ui-preset`. Override tokens in `tailwind.config.js` if needed.
- **Do not edit `globals.css` without explicit user permission.** Reuse the existing global classes and tokens when building new components. If a new component needs styling that cannot be expressed with the current global classes, ask the user before modifying `globals.css`. Any edits to `globals.css` must be marked with `/* BEGIN CUSTOM GLOBAL STYLES */` and `/* END CUSTOM GLOBAL STYLES */` comments.
- **Reuse existing global styles before adding new ones.** Before introducing a new CSS variable, utility class, or component class, check whether the preset or current `globals.css` already provides an equivalent. Do not copy a reference site's stylesheet wholesale. Adapt the reference pattern to this site's existing design tokens and global classes; only add new global styles when there is genuinely no existing way to express the needed style.

---

## Bug Fixes

### Rules for Bug Fixes

- Read the file first. Confirm the bug actually exists in the current code.
- Check if the bug is listed in `known-issues.md`. If not, add it before fixing.
- Make the smallest change that resolves the issue.
- Do not "improve" or refactor surrounding code as part of a bug fix.
- After the fix, run `tsc --noEmit` and `pnpm run lint` in `apps/storefront/`.
- Hit the dev server to confirm the page renders without a 500.
- Update the bug status in `known-issues.md` and `frontend-fixes.md`.

### Common Fix Patterns

| Pattern | Example |
|---|---|
| **Auth gate on account pages** | Add `retrieveCustomer()` + `notFound()` at the top of the page component before any data fetch that requires auth. |
| **Type mismatch in form state** | Match the `error` type to what the server action returns (`string \| null`, not `boolean`). |
| **Modal overflow** | Change `max-h-[75vh]` to `max-h-[90vh]` and/or switch `overflow-visible` to `overflow-hidden`. |
| **Narrow modal on desktop** | Add `size="large"` to the `<Modal>` component. |
| **TypeScript type error** | Add `as SomeType` or fix the initializer to match the expected type. Do not use `any`. |
| **Unused variable** | Prefix with `_` (e.g., `_code`) or remove it. Do not add `@ts-ignore` to silence the lint rule. |

### Example — Auth Gate Fix

```tsx
// Before (orders/page.tsx)
export default async function Orders() {
  const orders = await listOrders()
  // ...
}

// After
export default async function Orders() {
  const customer = await retrieveCustomer()
  if (!customer) {
    notFound()
  }
  const orders = await listOrders()
  // ...
}
```

---

## Adding New Features

### Rules for New Features

- Place new UI components under the appropriate `src/modules/<feature>/components/` directory.
- Place new server actions under `src/lib/data/<feature>.ts`. Keep them small: one action per file or logical group.
- Do not add new pages under `src/app/` without understanding the routing conventions (see `site-structure/storefront-routing.md`).
- Do not add new npm packages to the storefront without checking if an existing dependency already provides the functionality.
- Reuse the existing `Input`, `Button`, `Modal`, `Badge`, `Heading`, `Text` primitives. Do not add new UI component libraries.

### Example — Adding a New Account Page

1. Create the page file under `src/app/[countryCode]/(main)/account/@dashboard/<page>/page.tsx`.
2. Use a server component by default. Add `"use client"` only when you need hooks or event handlers.
3. Fetch data using server actions from `src/lib/data/`.
4. Add navigation link in the account layout if needed.

### Example — Adding a New Server Action

```ts
// src/lib/data/my-feature.ts
"use server"

import { sdk } from "@/lib/config"

export async function myAction(formData: FormData) {
  const value = formData.get("field") as string
  // business logic
  return { success: true }
}
```

### Example — Using a Server Action in a Client Component

```tsx
"use client"

import { useFormState } from "react-dom"
import { myAction } from "@/lib/data/my-feature"

export default function MyForm() {
  const [state, formAction] = useFormState(myAction, { error: null as string | null, success: false })

  return (
    <form action={formAction}>
      <input name="field" />
      <button type="submit">Submit</button>
      {state.error && <p className="text-rose-500">{state.error}</p>}
    </form>
  )
}
```

### Ignored Features (Out of Scope Unless Explicitly Requested)

The following feature categories are **ignored by default** when adapting designs from a reference frontend. Do not implement them unless the user explicitly asks for them:

- **New backend schemas or modules** — any feature requiring a new Medusa module, DML model, migration, or workflow step.
- **New API endpoints** — any feature requiring a new `src/api/store/.../route.ts` or admin API route.
- **New npm dependencies** — do not add packages like `framer-motion`, `swiper`, or chart libraries unless explicitly requested. Check if an existing dependency can provide the behavior first.
- **Admin dashboard customizations** — widgets, UI routes, or admin extensions are out of scope for storefront design adaptation.
- **Data model extensions** — custom product attributes, customer metadata, order fields, etc. require backend changes and are out of scope.
- **Third-party integrations** — analytics, payment providers, shipping carriers, etc. require backend configuration and are out of scope.
- **Authentication/authorization changes** — new auth flows, OAuth providers, MFA, etc. require backend changes.

**Rule:** If a reference feature requires any of the above, document it in the relevant plan file under "Ignored Features" with a note that it is out of scope, and ask the user if they want to proceed with backend work.

---

---

## Creating Components

### Rules for New Components

- Follow the existing naming convention: kebab-case for files, PascalCase for component types.
- Place reusable components under `src/modules/common/components/`.
- Place feature-specific components under `src/modules/<feature>/components/`.
- Client components must start with `"use client"`. Server components must NOT have this directive.
- Use TypeScript interfaces/types for props. Do not use `any`.
- Keep components small and focused. A component should do one thing.
- Do not add JSDoc comments unless explicitly asked.

### Example — New Client Component

```tsx
"use client"

import { useState } from "react"
import { Button } from "@modules/common/components/ui"

type MyComponentProps = {
  label: string
  onAction: () => void
}

const MyComponent = ({ label, onAction }: MyComponentProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <Button onClick={() => setOpen(!open)}>{label}</Button>
      {open && <div>Content</div>}
    </div>
  )
}

export default MyComponent
```

### Example — New Server Component

```tsx
// src/modules/products/components/product-card/index.tsx
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@modules/common/components/ui"

type ProductCardProps = {
  product: HttpTypes.StoreProduct
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="flex flex-col">
      <img src={product.thumbnail} alt={product.title} />
      <Heading className="text-base-semi">{product.title}</Heading>
    </div>
  )
}

export default ProductCard
```

### Example — Component with Existing UI Primitives

```tsx
"use client"

import { clx } from "@modules/common/components/ui"
import Modal from "@modules/common/components/modal"

type ConfirmModalProps = {
  isOpen: boolean
  close: () => void
  title: string
  message: string
  onConfirm: () => void
}

const ConfirmModal = ({ isOpen, close, title, message, onConfirm }: ConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} close={close} size="small">
      <Modal.Title>
        <Heading className="mb-2">{title}</Heading>
      </Modal.Title>
      <Modal.Body>
        <p>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <button onClick={close} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} className="btn-primary">Confirm</button>
      </Modal.Footer>
    </Modal>
  )
}

export default ConfirmModal
```

---

## Backend Changes

### Rules for Backend Changes

- **Do not edit** — backend is 100% upstream stock.
- If a backend change is truly needed:
  - Use `createStep` + `createWorkflow` for business logic
  - File-based routing: `src/api/store/<path>/route.ts`
  - Run `pnpm exec medusa db:generate <module>` after module changes
  - Run `cd apps/backend && pnpm run lint` to verify `@medusajs/eslint-plugin`

### When Backend Changes Are Needed

Backend changes are required when:
- You need a new API endpoint (add a file under `src/api/store/<path>/route.ts`).
- You need new data models or schema changes (add a custom module, run `medusa db:generate <module>`).
- You need to modify business logic (add a workflow step in `src/workflows/`).
- You need to react to events (add a subscriber in `src/subscribers/`).

### Backend Change Checklist

1. Create the module/workflow/step/route file.
2. Run `pnpm exec medusa db:generate <module>` if you changed module DML.
3. Run `pnpm exec medusa db:migrate` to apply the migration.
4. Run `cd apps/backend && pnpm run lint` to verify `@medusajs/eslint-plugin` passes.
5. Run `cd apps/backend && pnpm run test:integration:http` to verify the API endpoint.
6. Do NOT disable any `@medusajs/*` lint rule. Fix the code instead.

---

## Config Changes

### Rules for Config Changes

- **pnpm-workspace.yaml**: Add overrides at the top level. This is the only place pnpm v11 reads them.
- **package.json**: Do NOT add a `pnpm` field — it is ignored on pnpm v11.
- **.gitignore**: Add `*.tsbuildinfo` and `**/tsconfig.tsbuildinfo` to prevent tracking TypeScript build cache.
- **next.config.js**: Add `qualities: [25, 50, 75, 100]` to the `images` config to silence the `next-image-unconfigured-qualities` warning.

### Example — Adding a pnpm Override

```yaml
# pnpm-workspace.yaml
overrides:
  "@types/react": 19.0.5
  "@types/react-dom": 19.0.5
  # Add new overrides here, at the top level
```

### Example — Adding .gitignore Entries

```gitignore
# Next.js
**/.next/
**/out/
**/tsconfig.tsbuildinfo
*.tsbuildinfo
```

### Example — Adding Image Qualities to next.config.js

```js
// next.config.js
const nextConfig = {
  images: {
    unoptimized: true,
    qualities: [25, 50, 75, 100],  // Add this line
    remotePatterns: [ ... ],
  },
}
```

---

## Verification

After any change, verify the following:

### TypeScript

```bash
cd apps/storefront
pnpm exec tsc --noEmit   # Should report 0 errors
```

### Lint

```bash
cd apps/storefront
pnpm run lint            # Errors should not increase
cd apps/backend
pnpm run lint            # Should pass with no @medusajs/* violations
```

### Runtime

```bash
# Start the dev servers
pnpm run dev

# Hit the storefront
curl http://localhost:8000

# Hit the backend
curl http://localhost:9000/health

# Hit the admin
curl http://localhost:9000/app
```

### Tests

```bash
cd apps/backend
pnpm run test:unit                        # Unit tests
pnpm run test:integration:modules         # Module integration tests
pnpm run test:integration:http            # HTTP integration tests
```

### Important

- **Never run `pnpm run build` while the dev server is running.** The production build overwrites `apps/storefront/.next/` which the dev server (Turbopack) is using. The dev server will start returning 500s. Stop the dev server first, run the build, then restart.
- If you need to test the production build, stop the dev server, run `pnpm run build`, then `pnpm run start`.

---

## Common Patterns

### Server Actions (Data Layer)

Server actions live in `apps/storefront/src/lib/data/`. Each file handles one domain:

| File | Purpose |
|---|---|
| `cart.ts` | Cart operations (get, create, update, delete) |
| `customer.ts` | Customer operations (addresses, profile) |
| `checkout.ts` | Checkout flow (shipping, payment) |
| `products.ts` | Product listing, search, filters |
| `orders.ts` | Order listing and details |

Server actions use `"use server"` at the top and are called from client components via `useFormState` or directly in server components.

### Client vs Server Components

- **Server components (default):** No `"use client"` directive. Can directly call server actions, SDK, or database queries. Cannot use hooks or event handlers.
- **Client components:** Must start with `"use client"`. Can use `useState`, `useEffect`, `useFormState`, event handlers, etc. Cannot directly call server actions — must pass them as form actions or call via `fetch`.

### Form Pattern

The codebase uses `useFormState` for forms:

```tsx
"use client"

import { useFormState } from "react-dom"
import { myAction } from "@/lib/data/my-feature"

const initialState = { error: null as string | null, success: false }

export default function MyForm() {
  const [state, formAction] = useFormState(myAction, initialState)

  return (
    <form action={formAction}>
      <input name="field" />
      <button type="submit">Submit</button>
      {state.error && <p className="text-rose-500">{state.error}</p>}
    </form>
  )
}
```

### Account Info Pattern

The `AccountInfo` component is a reusable Disclosure-based editor used by profile-name, profile-email, and profile-billing-address:

```tsx
<AccountInfo
  label="Name"
  currentInfo={currentInfoString}
  isSuccess={successState}
  isError={!!state?.error}
  clearState={clearState}
  data-testid="account-name-editor"
>
  {/* Form fields go here */}
  <Button type="submit">Save changes</Button>
</AccountInfo>
```

Props:
- `label` — section label (e.g., "Name", "Billing address")
- `currentInfo` — string or React node showing current value
- `isSuccess` — show success badge when true
- `isError` — show error badge when true
- `errorMessage` — error text (default: "An error occurred, please try again")
- `clearState` — callback to reset form state
- `children` — form fields and submit button
- `data-testid` — test identifier

---

## Troubleshooting

### Port 9000 already in use

```powershell
Get-NetTCPConnection -LocalPort 9000 -State Listen | Select-Object OwningProcess
Stop-Process -Id <pid> -Force
```

### PostgreSQL DB creation fails with hyphens

PowerShell strips double quotes around identifiers with hyphens. Use underscores or write SQL to a temp file:

```powershell
Set-Content -Path "$env:TEMP\create_db.sql" -Value 'CREATE DATABASE "my_db";'
$env:PGPASSWORD = 'postgres'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -f "$env:TEMP\create_db.sql"
```

### create-medusa-app hangs at the end

Always pass `--no-browser` when running headlessly.

### Storefront 404s with "Missing publishable API key"

Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` in `apps/storefront/.env.local`.

### Production build breaks dev server

Stop the dev server first, run the build, then restart. Never run `pnpm run build` while dev is active.

### TypeScript errors after adding a new component

Make sure you are using the correct import paths (`@modules/...`, `@lib/...`). Run `tsc --noEmit` to see the exact error.

### ESLint errors after a change

Run `pnpm run lint` in the affected app to see the exact errors. Fix the code; do not disable `@medusajs/*` rules.

## Documentation Rules

- Update `known-issues.md` and `frontend-fixes.md` when applying or planning a fix.
- Use `context.md` only for environment metadata and overall scaffold state — do not put bug details there.
- Use relative links between docs (e.g., `known-issues.md`) instead of cross-referencing with full paths.
- Use absolute paths only for source files (e.g., `apps/storefront/src/...`).

## Known Noise (Safe to Ignore)

- `redisUrl not found` / `Local Event Bus installed` — expected for local dev
- `GET /store/customers/me 401` — anonymous session, expected
- `GET /store/locales 404` — harmless scaffold probe
- `next lint` is deprecated — use `pnpm exec next lint` or migrate to `eslint .`
- ~335 `TS2786` errors without overrides — resolved by `pnpm-workspace.yaml` overrides (already applied)

---

## Reference

- **Project root AGENTS.md** — project conventions, commands, off-limits paths
- **context.md** — environment details, install history, scaffold state
- **known-issues.md** — full bug catalog with statuses
- **frontend-fixes.md** — fix details for all bugs
- **rules.md** — editing principles and conventions
- **site-structure/** — architecture and behavior docs
