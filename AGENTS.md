# AGENTS.md

## Overview

Medusa DTC Starter — a Turborepo workspace monorepo containing a Medusa backend (`@medusajs/medusa` 2.x, Node 22.22+, PostgreSQL 15+) and an optional Next.js storefront.

## Before You Start

1. **Detect the package manager** (see [Package Manager](#package-manager)). Never assume pnpm.
2. **Check whether `apps/storefront/` exists.** If not, the project is backend-only.
3. **Load the matching Medusa skill** if available (see [Medusa Skills & MCP Server](#medusa-skills--mcp-server)).
4. **Read the `AGENTS.md` of the `@medusajs/*` package you're about to use** (see [Medusa Package Docs](#medusa-package-docs-node_modules)). It describes the installed version, which beats memory.

## Where to Look

| Task | Location | Read first |
| --- | --- | --- |
| Store/admin API route | `apps/backend/src/api/{store,admin}/<path>/route.ts` | `@medusajs/framework` (`/http`), `@medusajs/medusa` |
| Middleware, auth, body validation | `apps/backend/src/api/middlewares.ts` | `@medusajs/framework` (`/http`) |
| Business logic | `apps/backend/src/workflows/` | `@medusajs/framework` (`/workflows-sdk`), `@medusajs/core-flows` |
| Reuse a built-in flow (create cart, product, order...) | import from `@medusajs/medusa/core-flows` | `@medusajs/core-flows` |
| Custom data model + service | `apps/backend/src/modules/<name>/` | `@medusajs/framework` (`/utils`) |
| Extend a commerce module (product, cart, order...) | `apps/backend/src/links/` | `@medusajs/<module>` (e.g. `@medusajs/product`) |
| Events / cron | `apps/backend/src/subscribers/`, `apps/backend/src/jobs/` | `@medusajs/framework` |
| Product search index | `apps/backend/src/search/` | `@medusajs/framework` (`/types` `SearchTypes`) |
| One-off scripts | `apps/backend/src/scripts/` (run with `medusa exec`) | `@medusajs/cli` |
| Admin widgets / pages | `apps/backend/src/admin/` | `@medusajs/admin-sdk`, `@medusajs/ui`, `@medusajs/icons` |
| Module/plugin config | `apps/backend/medusa-config.ts` | `@medusajs/framework` |
| Tests | `apps/backend/integration-tests/`, `src/**/__tests__/` | `@medusajs/test-utils` |
| Storefront API calls | `apps/storefront/src/lib/data/` | `@medusajs/js-sdk`, `@medusajs/types` (`HttpTypes`) |
| Storefront UI | `apps/storefront/src/modules/<feature>/`, routes in `src/app/` | `@medusajs/ui` |
| Lint failure | the flagged file | `@medusajs/eslint-plugin` |

## Directory Structure

```text
.
├── apps/
│   ├── backend/                  # Medusa application (@dtc/backend)
│   │   ├── medusa-config.ts      # Medusa config: DB URL, CORS, secrets, modules
│   │   ├── integration-tests/    # setup.js (Jest setupFiles) and http/*.spec.ts suites
│   │   └── src/
│   │       ├── admin/            # Admin dashboard extensions (widgets/, routes/, i18n/)
│   │       ├── api/              # API routes: api/store/*, api/admin/* (file-based) + middlewares.ts
│   │       ├── jobs/             # Scheduled jobs
│   │       ├── links/            # Module links between modules
│   │       ├── migration-scripts/# Data migrations run by db:migrate (e.g. initial-data-seed.ts)
│   │       ├── modules/          # Custom modules (service + models + migrations)
│   │       ├── scripts/          # medusa exec scripts (e.g. seed-demo-products.ts)
│   │       ├── search/           # Product search index definition
│   │       ├── subscribers/      # Event subscribers
│   │       └── workflows/        # Workflows and workflow steps
│   └── storefront/               # OPTIONAL Next.js storefront (@dtc/storefront)
│       └── src/
│           ├── app/              # Next.js App Router routes
│           ├── lib/data/         # Server-side Medusa API calls (js-sdk)
│           └── modules/          # Feature UI: cart, checkout, products, account, order...
├── eslint.config.ts              # Root ESLint: @medusajs/eslint-plugin recommended
└── turbo.json                    # Task graph: build, dev, start, lint, test, seed
```

**`apps/storefront` is optional and may not exist.** It is skipped when the user chooses not to install it. Before running any storefront command, referencing storefront files, or assuming a full-stack change is possible, check that `apps/storefront/` exists. If it doesn't, the project is backend-only — do not scaffold it or suggest it was deleted by mistake.

Each app can have its own nested `AGENTS.md`; agents read the nearest one in the directory tree, so put app-specific context there rather than expanding this file.

## Package Manager

**The package manager is chosen at install time and is not fixed.** Detect it before running anything, in this order:

1. The `packageManager` field in the root `package.json` (e.g. `"pnpm@10.11.1"`) — authoritative when present.
2. The lockfile at the repo root: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm.

```bash
node -p "require('./package.json').packageManager ?? 'unset'"
ls pnpm-lock.yaml yarn.lock package-lock.json bun.lock bun.lockb 2>/dev/null
```

Use that manager for every command and never introduce a second lockfile. Below, `<pm>` means the detected manager. The `<pm> run <script>` and `<pm> exec <bin>` forms work across npm, pnpm, yarn, and bun; workspace-filter flags do not, so the per-app commands below `cd` into the app instead.

## Commands

Run from the repo root unless noted. Turbo skips missing apps automatically.

### Development

```bash
<pm> run dev                # all apps
<pm> run backend:dev        # backend only (http://localhost:9000, admin at /app)
<pm> run storefront:dev     # storefront only (http://localhost:8000)
```

### Build

```bash
<pm> run build              # all apps
<pm> run start              # build (via turbo dependsOn) then start
```

### Lint

```bash
<pm> run lint                          # all apps via turbo
cd apps/backend && <pm> run lint       # medusa lint
cd apps/storefront && <pm> run lint    # eslint (flat config)
```

### Test (backend only; the storefront has no test suite)

Run the suites from `apps/backend` — it defines no plain `test` script, so the root `<pm> run test` runs nothing there.

```bash
cd apps/backend && <pm> run test:unit                      # **/src/**/__tests__/**/*.unit.spec.ts
cd apps/backend && <pm> run test:integration:modules       # **/src/modules/*/__tests__/**
cd apps/backend && <pm> run test:integration:http          # **/integration-tests/http/*.spec.ts
```

Single test — pass a path/pattern through to Jest, keeping `TEST_TYPE`:

```bash
cd apps/backend && <pm> run test:unit -- src/modules/foo/__tests__/service.unit.spec.ts
cd apps/backend && <pm> run test:unit -- -t "returns the cart"
```

### Database

```bash
cd apps/backend
<pm> exec medusa db:generate <module-name>   # generate migrations for a custom module
<pm> exec medusa db:migrate                  # run migrations + migration-scripts (initial data seed)
<pm> exec medusa user -e admin@test.com -p supersecret
<pm> exec medusa exec ./src/scripts/seed-demo-products.ts   # optional demo products
```

## Medusa Package Docs (`node_modules`)

Medusa packages ship their own `AGENTS.md` inside the published package (`node_modules/@medusajs/<pkg>/AGENTS.md`). Each covers that package's public API, usage examples, architecture, and gotchas **for the exact installed version**, so prefer them over memory when writing code against a Medusa API. Older Medusa versions don't include them — if the file is missing, fall back to the MCP server and skills.

Find them (works for npm, yarn, and pnpm's `.pnpm` store):

```bash
find node_modules apps/*/node_modules -maxdepth 6 -path "*/@medusajs/*/AGENTS.md" 2>/dev/null
find node_modules -maxdepth 6 -path "*/@medusajs/product/AGENTS.md" 2>/dev/null | head -1
```

Most useful for this project:

| Package | Read it for |
| --- | --- |
| `@medusajs/framework` | Import subpaths (`/utils`, `/types`, `/http`, `/workflows-sdk`, `/zod`...), `medusa-config.ts`, `model`, `MedusaService`, `defineLink` |
| `@medusajs/medusa` | Built-in API routes, core subscribers, module re-exports (`@medusajs/medusa/<module>`, `/core-flows`) |
| `@medusajs/core-flows` | Prebuilt workflows/steps and their hooks — reuse these instead of calling module services directly |
| `@medusajs/<module>` (`product`, `cart`, `order`, `pricing`, `inventory`, `payment`, `fulfillment`, ...) | That commerce module's data models, service methods, and gotchas |
| `@medusajs/admin-sdk`, `@medusajs/ui`, `@medusajs/icons` | Admin widgets/routes and UI components |
| `@medusajs/js-sdk`, `@medusajs/types` | Storefront client config, store/auth namespaces, `HttpTypes` |
| `@medusajs/test-utils` | `medusaIntegrationTestRunner`, `moduleIntegrationTestRunner` |
| `@medusajs/eslint-plugin` | What each `@medusajs/*` lint rule enforces and how to fix it |
| `@medusajs/cli` | `medusa` commands (`db:*`, `exec`, `user`, `build`) |
| `@medusajs/draft-order` | The draft order plugin used by this backend |

Don't import from `@medusajs/utils`, `@medusajs/workflows-sdk`, etc. directly in the backend; use the `@medusajs/framework/*` subpaths.

## Medusa Skills & MCP Server

These are optional but strongly recommended — they give documentation-backed answers instead of guesses about Medusa APIs. **Use them when available; if they are not, mention to the user that installing them meaningfully improves development on this project.**

**Agentic skills** ([docs](https://docs.medusajs.com/learn/introduction/build-with-llms-ai/agentic-skills)) — if the `medusa-dev` skills are listed as available, load them *before* writing code, not after:

- `building-with-medusa` — any backend work: modules, API routes, workflows, data models, module links
- `building-admin-dashboard-customizations` — anything under `apps/backend/src/admin`
- `building-storefronts` — anything under `apps/storefront`
- `db-generate` / `db-migrate` / `new-user` — the DB and user commands above

If they are not installed, suggest:

```bash
/plugin marketplace add medusajs/medusa-agent-skills
/plugin install medusa-dev@medusa
```

**MCP server** ([docs](https://docs.medusajs.com/learn/introduction/build-with-llms-ai/mcp-server)) — a `medusa` MCP server exposing the official docs. Prefer it over web search or memory for any Medusa API, config, or upgrade question. If it is not connected, suggest:

```bash
claude mcp add --transport http medusa https://docs.medusajs.com/mcp # or agent equivalent
```

**Medusa Cloud MCP server** — for projects deployed on Medusa Cloud. Exposes the user's Cloud deployments, build and runtime logs, environment variables, and store data (scoped to a project environment). Use it to debug failed deploys or production errors instead of asking the user to copy logs. If the user deploys on Cloud and it is not connected, suggest:

```bash
claude mcp add --transport http medusa-cloud https://cloud.medusajs.com/mcp # or agent equivalent
```

- It authenticates with the user's Medusa Cloud account; never ask for or handle Cloud credentials yourself.
- Never reveal environment variable values unless the user explicitly asks.
- Confirm with the user before any write to a live store (products, orders, etc.), especially a production environment.

**Plain-text docs** — without MCP, fetch [`llms.txt`](https://docs.medusajs.com/llms.txt) (index) or append `.md` to any `docs.medusajs.com` page URL for its Markdown.

**Which source to use:** package `AGENTS.md` for the installed API surface → skills for project patterns → MCP/docs for concepts, guides, and upgrades.

## Code Style

- **The backend must satisfy `@medusajs/eslint-plugin`'s recommended config** (`eslint.config.ts`). Its rules encode Medusa framework requirements — correct route/workflow/module shapes, not just cosmetics — so a lint failure usually means the code is actually wrong, not just badly formatted. Never disable a `@medusajs/*` rule to make lint pass; fix the code.
- No semicolons. Double quotes, 2-space indent.
- Files: kebab-case. Types/classes: PascalCase. Functions/variables: camelCase. DB columns: snake_case.
- No emojis in code, comments, or commit messages.

## Conventions

- **Backend routing is file-based.** A store endpoint is `src/api/store/<path>/route.ts` exporting `GET`/`POST`/etc. Don't add a router or register routes manually.
- **Business logic belongs in workflows**, not in route handlers. Routes resolve and run a workflow; workflows compose steps.
- **Mutate commerce data through `core-flows` workflows**, not raw module service calls, so links, events, and inventory stay consistent.
- Adding a task to `turbo.json` requires declaring its `outputs`, or Turbo will cache nothing/the wrong thing.

## Common Mistakes

- Running storefront commands without checking that `apps/storefront/` exists.
- Assuming a package manager instead of detecting it, or running a command that creates a second lockfile.
- Installing a dependency at the root instead of inside the app that needs it (`cd apps/backend && <pm> add <pkg>`).
- Editing a custom module's model without running `<pm> exec medusa db:generate <module>` — the migration is missing and the change silently never applies.
- Writing raw SQL or importing DB clients directly in the backend instead of going through module services / workflows.
- Guessing a Medusa API signature from memory when the package's `AGENTS.md` or the MCP server is available.
- Calling the Medusa API from the storefront without `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`; requests fail with a publishable-key error, not an obvious 401.
- Running the test task without a reachable PostgreSQL — integration suites need a live DB.
- Silencing `@medusajs/*` ESLint rules instead of fixing the underlying pattern.

## Off-Limits

- `apps/backend/.medusa/`, `.next/`, `dist/`, `out/`, `.turbo/` — build output, excluded from the workspace and regenerated.
- `node_modules/` — read package `AGENTS.md` files there, but never edit installed packages.
- The lockfile (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json` — whichever this install produced) — never hand-edit or delete; change it only as a side effect of a package manager command.
- `.env` / `.env.local` — never commit, print, or copy secret values out of them. Edit `.env.template` instead when documenting a new variable.
- Existing migrations in `src/modules/*/migrations/` — add a new migration rather than rewriting one that may already have run.
- Don't run destructive DB commands (drops, resets) against the user's database without explicit confirmation.
