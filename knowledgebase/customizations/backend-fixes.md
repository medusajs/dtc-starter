# Backend Fixes

## Overview

This document catalogs every change made to the **backend** (`apps/backend`) that diverges from the upstream `medusajs/dtc-starter` baseline. The audit was conducted on 2026-09-06 and updated on 2026-09-12 against the fresh `create-medusa-app@2.21.0` install.

**TL;DR: No backend changes were made.** The backend runs unmodified from the upstream baseline.

## What Was Audited

The following backend areas were inspected during the audit. Each was compared with upstream `medusajs/dtc-starter` and confirmed identical to the upstream baseline as of Medusa 2.21.0:

### `apps/backend/src/`
| Area | Files audited | Status |
|---|---|---|
| API routes | `api/store/custom/route.ts`, `api/admin/custom/route.ts` | Unchanged from upstream |
| Workflows | `workflows/README.md` (placeholder) | Unchanged from upstream |
| Modules | `modules/README.md` (placeholder) | Unchanged from upstream |
| Module links | `links/README.md` (placeholder) | Unchanged from upstream |
| Subscribers | `subscribers/README.md` (placeholder) | Unchanged from upstream |
| Jobs | `jobs/README.md` (placeholder) | Unchanged from upstream |
| Migration scripts | `migration-scripts/initial-data-seed.ts` | Unchanged from upstream |
| Admin extensions | `admin/README.md` (placeholder), `admin/vite-env.d.ts`, `admin/tsconfig.json`, `admin/i18n/README.md`, `admin/i18n/index.ts`, `admin/README.md` | Unchanged from upstream |

### `apps/backend/`
| File | Status |
|---|---|
| `medusa-config.ts` | Unchanged from upstream (minimal default config) |
| `.env` (10 keys) | Unchanged from upstream (created by `create-medusa-app`) |
| `integration-tests/setup.js` | Unchanged from upstream (Jest setup) |
| `package.json` | Unchanged from upstream (no custom dependencies) |
| `tsconfig.json` | Unchanged from upstream |

### `apps/backend/.medusa/`
**Not committed.** The `.medusa/` directory contains the Medusa build output and database migrations that are generated/regenerated at install and run time. Per AGENTS.md, `apps/backend/.medusa/` is off-limits (not edited or committed). It is not currently in `.gitignore` — see the off-limits section of AGENTS.md for context.

## Backend Customizations Audit

The original context documentation mentioned two reported bugs:
1. **"Profile edit shows 'updated successfully' instead of inputs"** — This was described as a CSS class issue on a HeadlessUI `Disclosure.Panel`. However, after inspection, the backend is 100% stock and has no involvement in this issue. It is a pure storefront UI concern in `apps/storefront/src/modules/account/components/account-info/index.tsx`.
2. **"Add Address modal is not desktop-friendly"** — Also a pure storefront UI issue (missing `size="large"` prop on `<Modal>`). No backend involvement.

Neither bug was caused by incorrect data on the backend, missing API endpoints, or business-logic errors. The backend `/store/customers/me` and `/store/customers/addresses` endpoints work correctly; the storefront just wasn't always sending or rendering the data properly.

## Verification

To confirm the backend is still 100% upstream stock:

```powershell
# In the project root
cd <project-root>

# Compare any single backend file with upstream
$url = "https://raw.githubusercontent.com/medusajs/dtc-starter/main/apps/backend/medusa-config.ts"
Invoke-WebRequest -Uri $url -UseBasicParsing | Select-Object -ExpandProperty Content
# Then diff against your local file
Get-Content "apps/backend/medusa-config.ts"
```

For a complete diff, clone the upstream repo into a sibling directory and use your favorite diff tool:

```powershell
git clone https://github.com/medusajs/dtc-starter.git ..\dtc-starter-upstream
# Then compare apps/backend between the two
```

## What Future Backend Fixes Would Look Like

If a future bug is reported that requires backend changes, document them in this file using this structure:

1. **Files modified** table (path, line, change summary).
2. **One section per fix** with: Symptom, Root Cause, Fix (with before/after code), Why It Works, Side Effects.
3. **Verification** (lint, dev server, manual test plan).
4. **Upstream Comparison** (link to the upstream file/line so the patch can be upstreamed).
5. **Future Cleanup** (PR plan, test additions).

Common backend-fix categories to watch for:
- **Module DML changes** — requires `<pm> exec medusa db:generate <module>` and a new migration file in `apps/backend/src/modules/<module>/migrations/`. Never edit existing migrations.
- **API route additions** — add a file under `apps/backend/src/api/store/<path>/route.ts` or `api/admin/<path>/route.ts`. Export `GET`/`POST`/etc. handler functions. Business logic goes in a workflow, not in the handler.
- **Workflow changes** — add steps in `apps/backend/src/workflows/`. Use `createStep` + `createWorkflow`. Add compensating steps for any non-idempotent operation.
- **Subscriber additions** — add to `apps/backend/src/subscribers/`. Listen to events from the event bus; do not call DB directly, go through a service.
- **Module link additions** — add to `apps/backend/src/links/`. Run `<pm> exec medusa db:sync-links` after adding.

When making backend changes, always:
- Run `cd apps/backend && pnpm run lint` to verify `@medusajs/eslint-plugin` is satisfied.
- Run the relevant test task (`test:unit` / `test:integration:modules` / `test:integration:http`).
- Never disable a `@medusajs/*` lint rule to make lint pass (per `AGENTS.md`).
- Edit `.env.template` (not `.env`) when adding new environment variables.

## Related Documents

- `frontend-fixes.md` — the audit of storefront fixes (BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-08, BUG-09, BUG-10, BUG-11, BUG-12, BUG-13, BUG-14, BUG-15, BUG-16, BUG-17 applied; BUG-07 no fix needed; MONITOR-01 monitoring required)
- `../site-structure/backend.md` — the baseline backend layout (no diffs from upstream).
- `../site-structure/data-layer.md` — how the storefront talks to the backend (server actions + SDK + caching).
- `../site-structure/api-routes.md` — the file-based routing convention.
- `instructions.md` — how to edit the site (components, features, fixes, verification)
- `../../../AGENTS.md` (project root) — the full backend conventions including lint, package manager, and off-limits paths.
