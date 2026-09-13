# Rules for Editing the Site

## Principles

1. **Verify before fixing.** Always read the actual file before applying a fix. The 2.20.1 scaffold state changes frequently — a file that was buggy yesterday may already be fixed today.
2. **No blind patches.** If a file already contains the fix, skip it. A byte-for-byte identical "fix" is a no-op and may mask the real issue.
3. **Backend is 100% stock.** Do not modify `apps/backend/` unless you have a confirmed bug with a backend root cause. All known bugs are in the storefront UI layer.
4. **No runtime behavior changes from lint fixes.** Changing no-op stubs (`applyGiftCard`, `removeDiscount`, `removeGiftCard`) to throw errors changes runtime behavior. Leave upstream stubs as-is.
5. **Minimal diffs.** Only change what is necessary. Do not reformat, restructure, or "clean up" unrelated code. A fix should be a single targeted change, not a refactor.
6. **Adapt, don't copy.** When implementing designs or features from a reference frontend, do not blindly copy code. Understand the reference pattern, then implement it using this storefront's architecture, design tokens, component conventions, and data layer. A feature that requires a new backend schema, module, or API endpoint is out of scope unless the user explicitly requests it.
7. **No duplicates.** When editing an existing page or component, reuse the site's current implementation. Do not create a second sorting UI, a second cart flow, or a second checkout step. Apply styling changes or extend the existing feature. Creating a duplicate fragment while leaving the original intact causes divergence, doubles maintenance, and breaks the single source of truth.
8. **Designs and global styling first.** Before touching any component logic or adding features, apply global classes, tokens, and layout improvements to what already exists.
9. **Static adaptations second.** Reference patterns that can be implemented purely with styling or existing Medusa components — no new files, no new data fetching, no new components — come after the design foundation.
10. **New features third.** Anything requiring new components, new pages, or new data fetching only happens after the above layers are complete.

## Bug Tracking

All bugs use a `BUG-01` through `BUG-99` identifier system:
- `BUG-01` through `BUG-99` — ordered by priority (critical runtime bugs first, UI polish last)
- Each bug gets a status: **(Fixed)**, **(Not Fixed)**, or **(No Fix Needed)**
- Bug details live in `known-issues.md`
- Fix details live in `frontend-fixes.md`

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

## Making Changes

### General Workflow

1. **Read the file first.** Use the Read tool to inspect the current state before editing.
2. **Identify the exact line(s) to change.** Use Grep to find the pattern if needed.
3. **Make the minimal change.** One logical change per Edit call.
4. **Verify the change.** Run `tsc --noEmit` and `pnpm run lint` in the affected app.
5. **Confirm runtime health.** Hit the dev server endpoint to ensure no 500s.
6. **Document the change.** Update `known-issues.md` status, `frontend-fixes.md` details, and `context.md` if the change affects the overall scaffold state.

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

## Storefront Code

### File Layout

Storefront code lives under `apps/storefront/src/`:

```
src/
  app/                          # Next.js App Router pages
    [countryCode]/
      (main)/
        account/
          @dashboard/
            orders/
              page.tsx         # Server component (default)
        products/
          [handle]/
              page.tsx
  lib/                          # Data layer, helpers, hooks
    data/                       # Server actions (cart, customer, checkout, products)
    hooks/                      # Client hooks (use-toggle-state, etc.)
  modules/                      # Feature modules (account, cart, checkout, common, layout, order, products)
    common/
      components/
        input/index.tsx         # Reusable input component
        modal/index.tsx         # Reusable modal wrapper
        ui/                     # Local UI primitive kit (Button, Heading, Badge, etc.)
    account/
      components/
        account-info/index.tsx  # Disclosure-based editor wrapper
        profile-name/index.tsx  # Name editor
        profile-email/index.tsx # Email editor (no-op)
        profile-billing-address/index.tsx
        address-card/
          add-address.tsx       # Add address modal trigger
          edit-address-modal.tsx # Edit address modal trigger
```

### Making UI Changes

**Rules for UI changes:**
- Use existing Tailwind utility classes. Do not add new CSS files or inline styles.
- Match the existing component pattern: if a component uses `"use client"`, keep it. If it is a server component, keep it server-side.
- Use the existing module alias imports (`@modules/...`, `@lib/...`). Do not add new path aliases.
- Reuse existing UI primitives from `src/modules/common/components/ui/` (Button, Heading, Badge, Text, Input, etc.). Do not introduce new UI libraries.
- For modals, use the existing `Modal` component from `@modules/common/components/modal`. Pass `size="large"` only when the form content genuinely needs more width (e.g., address forms with multiple columns).
- When changing a prop's behavior in a component, keep the prop in the type signature even if it becomes unused. Do not remove props and cascade changes to every call site unless the prop is being completely removed from the API design. Minimizing the diff is preferred over "cleaning up" unused props.

**Example — widening a modal:**
```tsx
// Before
<Modal isOpen={state} close={close} data-testid="add-address-modal">

// After
<Modal isOpen={state} close={close} size="large" data-testid="add-address-modal">
```

**Example — fixing overflow in a Disclosure.Panel:**
```tsx
// Before
className="... overflow-visible ..."

// After
className="... overflow-hidden ..."
```

### Using Shared Components

**Rules for shared components:**
- Import shared components from `@modules/common/components/shared/` (e.g. `PageBanner`, `CategoryBarCarousel`, `RecentlyViewedSection`).
- Do not modify shared components to suit a single page. If a page needs a variant, add a prop with a sensible default.
- Always pass `themeColor` to shared components that support it. This keeps the UI consistent with the site's theme system.
- Shared components are client components. Do not wrap them in server components that need to pass event handlers as props.

**Example — using PageBanner:**
```tsx
import { PageBanner } from "@modules/common/components/shared/page-banner"

<PageBanner
  title="Explore All Categories"
  description="Browse our structured collections..."
  badge="Department Catalog"
  themeColor="blue"
  onBack={() => router.push('/')}
  backLabel="Home"
/>
```

### Theme Tokens and Global Styles

**Rules for theme and styling:**
- Use `@medusajs/ui-preset` tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`) for foreground, background, and border colors.
- For theme accents (blue, indigo, emerald, rose, amber, slate), use the `theme.*` color scale defined in `tailwind.config.js` (e.g. `text-theme-blue-600`, `bg-theme-rose-500`).
- For gradients and decorative effects, use utilities defined in `globals.css` (`bg-gradient-theme-*`, `glow-theme-*`). Do not hardcode gradient class strings in components.
- Use the existing `getThemeClasses()` helper from `src/lib/theme-utils.ts` when you need a set of coordinated classes for a theme color.
- Do not add new CSS files or inline `<style>` tags. All global styles go in `globals.css` or `tailwind.config.js`.
- Do not modify `@medusajs/ui-preset`. Override tokens in `tailwind.config.js` if needed.
- **Do not edit `globals.css` without explicit user permission.** Reuse the existing global classes and tokens when building new components. If a new component needs styling that cannot be expressed with the current global classes, ask the user before modifying `globals.css`. Any edits to `globals.css` must be marked with `/* BEGIN CUSTOM GLOBAL STYLES */` and `/* END CUSTOM GLOBAL STYLES */` comments.
- **Reuse existing global styles before adding new ones.** Before introducing a new CSS variable, utility class, or component class, check whether the preset or current `globals.css` already provides an equivalent. Do not copy a reference site's stylesheet wholesale. Adapt the reference pattern to this site's existing design tokens and global classes; only add new global styles when there is genuinely no existing way to express the needed style.
  - **For one-off component styling (e.g. icon button sizes), prefer inline Tailwind utilities over new global CSS classes.** When a component needs a specific visual treatment (size, shape, spacing) that existing global classes don't cover, express it directly in the component's `className` using Tailwind utilities (e.g., `w-8 h-8` for a 32px icon button). Do not create new CSS utility classes in `globals.css` for single-component patterns — inline the utilities. Example: an icon button uses `inline-flex items-center justify-center w-8 h-8 rounded-full border border-ui-border-base ...` inline, not a new `.btn-icon` class in globals.css.

### Static Features (No Schema Changes)

**Rules for static features:**
- A static feature is any storefront addition that does not require a new Medusa module, workflow, or API endpoint.
- Static features live entirely in `apps/storefront/src/`.
- Use existing Medusa entities (products, categories, collections) via server actions before creating static mock data.
- Static pages (About, FAQ, Contact, policies) go under `src/app/[countryCode]/(main)/<page>/page.tsx`.
- Static sections (testimonials, brand grids, feature lists) go under `src/modules/<feature>/components/` or `src/modules/common/components/`.
- Client-side-only features (wishlist, recently viewed, quick view) can use `localStorage` or React context. Do not create backend tables for client-only state.
- Do not add new npm packages without checking if an existing dependency already provides the functionality.

**When to use static vs backend:**

| Need | Approach |
|---|---|
| New UI pattern on 2+ pages | Shared component in `common/components/shared/` |
| New page with no new data | Static page in `app/[countryCode]/(main)/` |
| New section on existing page | Component in the relevant feature module |
| New data not in Medusa | Static array/object in `src/lib/` or `src/data/` |
| New data editable in admin | Backend module + migration — not static |
| New API behavior | Backend workflow + route — not static |

For full details, see `customizations/static.md`.

---

## Adding New Features

### Rules for New Features

- Place new UI components under the appropriate `src/modules/<feature>/components/` directory.
- Place new server actions under `src/lib/data/<feature>.ts`. Keep them small: one action per file or logical group.
- Do not add new pages under `src/app/` without understanding the routing conventions (see `site-structure/storefront-routing.md`).
- Do not add new npm packages to the storefront without checking if an existing dependency already provides the functionality.
- Reuse the existing `Input`, `Button`, `Modal`, `Badge`, `Heading`, `Text` primitives. Do not add new UI component libraries.

**Example — adding a new account page:**
1. Create the page file under `src/app/[countryCode]/(main)/account/@dashboard/<page>/page.tsx`.
2. Use a server component by default. Add `"use client"` only when you need hooks or event handlers.
3. Fetch data using server actions from `src/lib/data/`.
4. Add navigation link in the account layout if needed.

**Example — adding a new server action:**
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

**Example — using a server action in a client component:**
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

## Creating Components

### Rules for New Components

- Follow the existing naming convention: kebab-case for files, PascalCase for component types.
- Place reusable components under `src/modules/common/components/`.
- Place feature-specific components under `src/modules/<feature>/components/`.
- Client components must start with `"use client"`. Server components must NOT have this directive.
- Use TypeScript interfaces/types for props. Do not use `any`.
- Keep components small and focused. A component should do one thing.
- Do not add JSDoc comments unless explicitly asked.

**Example — a new client component:**
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

**Example — a new server action:**
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

## Backend Code

**Rules for backend changes:**
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

## Configurations

**Rules for config changes:**
- **pnpm-workspace.yaml**: Add overrides at the top level. This is the only place pnpm v11 reads them.
- **package.json**: Do NOT add a `pnpm` field — it is ignored on pnpm v11.
- **.gitignore**: Add `*.tsbuildinfo` and `**/tsconfig.tsbuildinfo` to prevent tracking TypeScript build cache.
- **next.config.js**: Add `qualities: [25, 50, 75, 100]` to the `images` config to silence the `next-image-unconfigured-qualities` warning.

## Verification Rules

After any fix:
1. Run `tsc --noEmit` in the affected app to confirm 0 new TypeScript errors.
2. Run `pnpm run lint` in the affected app to confirm errors didn't increase.
3. Hit the dev server endpoints to confirm no new 500s.
4. If changes are storefront-only, the backend does not need restarting.
5. **Never run `pnpm run build` while the dev server is running** — stop the dev server first.

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

---

## Reference

- **Project root AGENTS.md** — project conventions, commands, off-limits paths
- **context.md** — environment details, install history, scaffold state
- **known-issues.md** — full bug catalog with statuses
- **frontend-fixes.md** — fix details for all bugs
- **rules.md** — editing principles and conventions
- **site-structure/** — architecture and behavior docs
