# Backend: Testing

## Overview

The backend uses **Jest** with `@swc/jest` for transformation. Tests are organized into three suites controlled by the `TEST_TYPE` environment variable. This file documents the test directory layout, the Jest configuration, the setup file, how to run each suite, and the actual state of tests in this project.

## Test Directory Layout

```
apps/backend/
├── jest.config.js              # Jest configuration
├── integration-tests/
│   ├── setup.js                # MikroORM metadata cleanup
│   └── http/
│       └── *.spec.ts           # HTTP integration tests
├── src/
│   ├── modules/
│   │   └── <module>/
│   │       └── __tests__/
│   │           └── *.spec.ts   # Module integration tests
│   └── <other>/
│       └── __tests__/
│           └── *.unit.spec.ts  # Unit tests
```

**Note**: The `src/modules/` directory is empty in this scaffold (only `README.md` exists). The `src/` directory contains `admin/`, `api/`, `jobs/`, `links/`, `migration-scripts/`, `modules/`, `subscribers/`, and `workflows/` — all scaffold placeholders with README files.

## Jest Configuration

`jest.config.js` (27 lines):

```js
const { loadEnv } = require("@medusajs/utils")
loadEnv("test", process.cwd())

module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      { jsc: { parser: { syntax: "typescript", decorators: true } } },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],
}

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"]
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"]
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.unit.spec.[jt]s"]
}
```

Key points:
- `loadEnv("test", process.cwd())` loads `.env.test` (or `.env`) before tests run.
- `@swc/jest` transforms TypeScript and ESM — no `ts-jest` needed.
- `modulePathIgnorePatterns` excludes `dist/` and `.medusa/` from module resolution.
- `setupFiles` runs `integration-tests/setup.js` before every test file.
- `TEST_TYPE` environment variable selects which test suite runs.
- The `testMatch` patterns are set conditionally — only one suite runs at a time.

## Setup File

`integration-tests/setup.js` (3 lines):

```js
const { MikroORM } = require("@mikro-orm/core")
MikroORM.metadataStorage.clear()
```

Purpose: Clears MikroORM's metadata cache between test runs. This prevents entity metadata from one test file leaking into another, which can cause false positives or schema conflicts.

**Why this matters**: MikroORM caches entity metadata globally. Without this cleanup, running multiple test files in the same process can cause the second test to use metadata from the first test, leading to incorrect query results or schema mismatches.

## Test Suites

| Suite | Command | `TEST_TYPE` | Test Match | What It Tests |
|---|---|---|---|---|
| Unit | `pnpm run test:unit` | `unit` | `**/src/**/__tests__/**/*.unit.spec.[jt]s` | Pure functions, utilities, isolated logic |
| Integration: modules | `pnpm run test:integration:modules` | `integration:modules` | `**/src/modules/*/__tests__/**/*.[jt]s` | Module services, workflows, links against a live DB |
| Integration: HTTP | `pnpm run test:integration:http` | `integration:http` | `**/integration-tests/http/*.spec.[jt]s` | API routes end-to-end via HTTP calls |

## Running Tests

### From project root (Turbo):
```bash
pnpm run test              # runs turbo test — but NOTE: neither app has a "test" script
```

**Important**: `turbo test` looks for a `test` script in each package. Neither `apps/backend` nor `apps/storefront` has a `test` script — only `test:unit`, `test:integration:modules`, and `test:integration:http`. Running `pnpm run test` from the root will fail. Use the app-specific commands below instead.

### From `apps/backend/`:
```bash
pnpm run test:unit                        # unit tests
pnpm run test:integration:modules         # module integration tests
pnpm run test:integration:http            # HTTP integration tests
```

### Single test file:
```bash
cd apps/backend
pnpm run test:unit -- src/modules/foo/__tests__/service.unit.spec.ts
```

### Single test by name:
```bash
cd apps/backend
pnpm run test:unit -- -t "returns the cart"
```

## Prerequisites

Integration tests require a **reachable PostgreSQL database**:
- `DATABASE_URL` must be set in `.env` or `.env.test`.
- The database must be migrated (`pnpm exec medusa db:migrate`).
- Redis is not required for tests — the in-memory event bus is used.

## NODE_OPTIONS

The test scripts pass `--experimental-vm-modules` via `NODE_OPTIONS`:

```json
// package.json scripts
"test:unit": "NODE_OPTIONS=--experimental-vm-modules TEST_TYPE=unit jest"
```

This is required for Jest to work with ESM modules in Node.js. On Windows PowerShell, use `$env:NODE_OPTIONS="--experimental-vm-modules"` instead.

## Writing Tests

### Unit Test Pattern

```ts
// src/modules/foo/__tests__/service.unit.spec.ts
import { FooService } from "../service"

describe("FooService", () => {
  let service: FooService

  beforeEach(() => {
    service = new FooService()
  })

  it("should return the cart", () => {
    const result = service.getCart()
    expect(result).toBeDefined()
  })
})
```

Unit tests should not require a database or the Medusa container. They test pure logic.

### Integration Test Pattern (Modules)

```ts
// src/modules/foo/__tests__/service.integration.spec.ts
import { ModuleService } from "../service"
import { Module } from "@medusajs/medusa"

describe("ModuleService", () => {
  let service: ModuleService

  beforeAll(async () => {
    // Requires a running PostgreSQL
  })

  it("should create a record", async () => {
    const result = await service.create({ name: "test" })
    expect(result.id).toBeDefined()
  })
})
```

Module integration tests run against a live database. They can use the Medusa container and real module services.

### HTTP Integration Test Pattern

```ts
// integration-tests/http/example.spec.ts
import request from "supertest"
import { app } from "../../src/api"

describe("GET /store/products", () => {
  it("should return 200", async () => {
    const res = await request(app).get("/store/products")
    expect(res.status).toBe(200)
  })
})
```

HTTP integration tests spin up the Express app and make real HTTP requests.

## Test Conventions

- File naming: `*.unit.spec.ts` for unit tests, `*.spec.ts` for integration tests.
- Test files live in `__tests__/` directories alongside the code they test.
- Module integration tests live under `src/modules/<module>/__tests__/`.
- HTTP integration tests live under `integration-tests/http/`.
- Use `describe` + `it` blocks. Prefer descriptive test names.
- Unit tests should be fast and isolated. Integration tests need a database.

## Current State

This scaffold has **no custom test files**. All three test directories are empty (only the scaffold placeholders exist). The test infrastructure is ready but unused.

### What Exists

- `jest.config.js` — configured with three suites
- `integration-tests/setup.js` — MikroORM metadata cleanup
- `src/modules/__tests__/` — empty (no test files)
- `integration-tests/http/` — empty (no test files)

### What's Missing

- No unit test files (`*.unit.spec.ts`)
- No module integration test files (`*.spec.ts` under `src/modules/`)
- No HTTP integration test files (`*.spec.ts` under `integration-tests/http/`)
- No `.env.test` file (tests use `.env` by default)

## Test Utilities

The project includes `@medusajs/test-utils` v2.20.1, which provides helpers for testing Medusa modules, workflows, and API routes. Common utilities:

- `createMedusaServer()` — spins up a test Medusa server
- `getContainer()` — resolves the DI container in tests
- `jest-retry` — retry failed tests (configured in some Medusa projects)

## Common Test Patterns

### Testing a Workflow

```ts
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ModuleRegistrationName } from "@medusajs/framework/utils"

describe("Product Workflow", () => {
  let container: MedusaContainer

  beforeAll(async () => {
    container = await createMedusaServer()
  })

  it("should create a product", async () => {
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [{ title: "Test Product", status: "published" }],
      },
    })
    expect(result[0].id).toBeDefined()
  })
})
```

### Testing an API Route

```ts
import request from "supertest"
import { app } from "../../src/api"

describe("GET /store/products", () => {
  it("should return 200", async () => {
    const res = await request(app).get("/store/products")
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("products")
  })
})
```

### Testing a Server Action

```ts
import { listProducts } from "../../src/lib/data/products"

describe("listProducts", () => {
  it("should return products", async () => {
    const result = await listProducts({
      pageParam: 0,
      queryParams: { limit: 10 },
      countryCode: "dk",
    })
    expect(result.response.products).toBeDefined()
  })
})
```

## Troubleshooting

### `NODE_OPTIONS=--experimental-vm-modules` required

On Windows PowerShell:
```powershell
$env:NODE_OPTIONS="--experimental-vm-modules"
pnpm run test:unit
```

On macOS/Linux:
```bash
NODE_OPTIONS=--experimental-vm-modules pnpm run test:unit
```

### Database not reachable

Integration tests require a running PostgreSQL. Check:
1. PostgreSQL is running (`pg_ctl status` or `Get-Service -Name postgresql`)
2. `DATABASE_URL` is set correctly in `.env`
3. The database exists (`createdb medusa_swift_canyon` or via psql)
4. Migrations are up to date (`pnpm exec medusa db:migrate`)

### MikroORM metadata leak

If tests fail with unexpected schema errors, ensure `integration-tests/setup.js` is listed in `jest.config.js` `setupFiles`. This clears MikroORM's metadata cache before each test file.

### `Cannot find module` errors

Ensure `pnpm install` has completed successfully. The `modulePathIgnorePatterns` in `jest.config.js` excludes `dist/` and `.medusa/` — make sure your source files are in `src/`, not `dist/`.
