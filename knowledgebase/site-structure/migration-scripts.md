# Backend: Migration Scripts and Seed Patterns

## Overview

Migration scripts live in `apps/backend/src/migration-scripts/`. They run automatically during `pnpm exec medusa db:migrate` — Medusa discovers them by filename convention and executes them after module migrations. The scaffold ships with one script: `initial-data-seed.ts`.

This file documents the three Medusa patterns used in the seed script that are not covered elsewhere: **workflow execution**, **graph queries**, and **imperative linking**. It also covers the actual seed implementation in detail, error handling considerations, and idempotency.

---

## File Location

```
apps/backend/src/migration-scripts/
  initial-data-seed.ts   ← runs during db:migrate
```

## Script Signature

```ts
export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  // ...
}
```

Medusa calls the default export with the DI container. The function name must match the filename (kebab-case → snake_case).

---

## Pattern 1: Workflow Execution

The seed uses **core workflows** from `@medusajs/medusa/core-flows` to create entities:

```ts
import { createSalesChannelsWorkflow } from "@medusajs/medusa/core-flows"

const { result: [salesChannel] } = await createSalesChannelsWorkflow(container).run({
  input: {
    salesChannelsData: [{ name: "Default Sales Channel", description: "Created by Medusa" }],
  },
})
```

Key points:
- Workflows are imported from `@medusajs/medusa/core-flows` (not from modules directly).
- `.run({ input: { ... } })` returns `{ result }` — an array of created entities.
- The container is passed as the first argument to the workflow constructor.
- Workflows handle validation, transaction management, and event emission automatically.
- Workflows return `{ result: [...] }` — always an array, even for single entities. Destructure with `[entity]` to get the first result.

Workflows used in the seed:
- `createSalesChannelsWorkflow`
- `createStoresWorkflow`
- `createApiKeysWorkflow`
- `linkSalesChannelsToApiKeyWorkflow`
- `linkSalesChannelsToStockLocationWorkflow`
- `createRegionsWorkflow`
- `createTaxRegionsWorkflow`
- `createStockLocationsWorkflow`
- `createShippingProfilesWorkflow`
- `createShippingOptionsWorkflow`
- `createProductCategoriesWorkflow`
- `createProductOptionsWorkflow`
- `createProductsWorkflow`
- `createInventoryLevelsWorkflow`

### Workflow Input Shapes

Each workflow expects a specific input shape. The seed uses these:

| Workflow | Input key | Shape |
|---|---|---|
| `createSalesChannelsWorkflow` | `salesChannelsData` | `Array<{ name, description? }>` |
| `createStoresWorkflow` | `stores` | `Array<{ name, supported_currencies, default_sales_channel_id }>` |
| `createApiKeysWorkflow` | `api_keys` | `Array<{ title, type, created_by? }>` |
| `linkSalesChannelsToApiKeyWorkflow` | `id`, `add` | `string`, `string[]` |
| `linkSalesChannelsToStockLocationWorkflow` | `id`, `add` | `string`, `string[]` |
| `createRegionsWorkflow` | `regions` | `Array<{ name, currency_code, countries, payment_providers? }>` |
| `createTaxRegionsWorkflow` | input | `Array<{ country_code, provider_id }>` (direct array, not wrapped) |
| `createStockLocationsWorkflow` | `locations` | `Array<{ name, address: { city, country_code, address_1? } }>` |
| `createShippingOptionsWorkflow` | input | `Array<ShippingOptionData>` (direct array) |
| `createProductCategoriesWorkflow` | `product_categories` | `Array<{ name, is_active? }>` |
| `createProductOptionsWorkflow` | `product_options` | `Array<{ title, values: string[] }>` |
| `createProductsWorkflow` | `products` | `Array<ProductData>` (direct array) |
| `createInventoryLevelsWorkflow` | `inventory_levels` | `Array<{ location_id, stocked_quantity, inventory_item_id }>` |

Note: `createTaxRegionsWorkflow` and `createShippingOptionsWorkflow` and `createProductsWorkflow` take the array directly as `input`, not wrapped in a key. This is inconsistent with other workflows — check the core-flows types when writing new scripts.

---

## Pattern 2: Graph Queries

For reading data in scripts, the seed uses the **Query engine** via `query.graph()`:

```ts
const query = container.resolve(ContainerRegistrationKeys.QUERY)

const { data: profiles } = await query.graph({
  entity: "shipping_profile",
  fields: ["id"],
})
```

Key points:
- `ContainerRegistrationKeys.QUERY` is the import path for the query engine.
- `query.graph({ entity, fields })` returns `{ data }` — an array of entities with only the requested fields.
- This is the Medusa 2.x equivalent of the old `manager.findOne` / `manager.find` pattern.
- Use it for reading; use workflows for writing.
- The `fields` array controls which columns are returned. Request only what you need to keep the query fast.
- The `entity` name is the plural snake_case form used by MikroORM (e.g., `shipping_profile`, `inventory_item`, `product`).

Graph queries used in the seed:
- `query.graph({ entity: "shipping_profile", fields: ["id"] })` — finds the default shipping profile created by core migrations
- `query.graph({ entity: "inventory_item", fields: ["id"] })` — finds all inventory items to seed levels

---

## Pattern 3: Imperative Linking

The seed uses `link.create()` directly from the container to link entities:

```ts
const link = container.resolve(ContainerRegistrationKeys.LINK)

await link.create({
  [Modules.STOCK_LOCATION]: {
    stock_location_id: stockLocation.id,
  },
  [Modules.FULFILLMENT]: {
    fulfillment_provider_id: "manual_manual",
  },
})
```

Key points:
- `ContainerRegistrationKeys.LINK` resolves the link service.
- `link.create({ [Module]: { ... } })` creates a many-to-many link between modules.
- The module keys use `ModuleRegistrationName` constants (`Modules.STOCK_LOCATION`, `Modules.FULFILLMENT`, etc.).
- The value objects use the actual foreign key names (`stock_location_id`, `fulfillment_provider_id`, `fulfillment_set_id`), not a generic `id`.
- This is used when no workflow exists for the specific linking operation.

Links created in the seed:
1. Stock location → fulfillment provider (`manual_manual`)
2. Stock location → fulfillment set (`fulfillment_set_id`)
3. Sales channel → publishable API key (via `linkSalesChannelsToApiKeyWorkflow`)
4. Sales channel → stock location (via `linkSalesChannelsToStockLocationWorkflow`)

---

## Pattern 4: Direct Module Service Calls

The seed also calls a module service directly for `createFulfillmentSets`:

```ts
const fulfillmentModuleService = container.resolve(
  ModuleRegistrationName.FULFILLMENT
)

const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
  name: "European Warehouse delivery",
  type: "shipping",
  service_zones: [ /* ... */ ],
})
```

Key points:
- `ModuleRegistrationName.FULFILLMENT` resolves the fulfillment module service.
- The service methods are the same as those exposed via the API routes.
- Use this when no workflow exists for the operation.
- The returned object includes nested `service_zones` array with `id` fields that are used in subsequent workflow calls.

---

## Logger

The seed resolves the logger from the container:

```ts
const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
logger.info("Seeding store data...")
```

Key points:
- `ContainerRegistrationKeys.LOGGER` is the import path for the logger.
- `logger.info()`, `logger.error()`, `logger.warn()` are available.
- The seed uses `logger.info()` for progress markers between major sections.

---

## Auto-Execution Behavior

`pnpm exec medusa db:migrate` does three things in order:
1. Runs pending module migrations (auto-generated by `db:generate`).
2. Syncs module links schema (`db:sync-links`).
3. Executes all migration scripts in `src/migration-scripts/` — sorted by filename.

If a script has already run, it is skipped (Medusa tracks executed scripts in the `migration_script` table). To re-run, use `medusa db:migrate:undo` or delete the record from the `migration_script` table.

### Migration Script Tracking

Medusa tracks executed scripts in the `migration_script` table:

| Column | Purpose |
|---|---|
| `name` | Script filename (e.g., `initial-data-seed`) |
| `executed_at` | Timestamp of last execution |

To re-run a script:
```bash
# Option 1: Use the CLI
pnpm exec medusa db:migrate:undo

# Option 2: Direct SQL (dangerous — only if you know what you're doing)
DELETE FROM migration_script WHERE name = 'initial-data-seed';
```

---

## Writing a New Migration Script

1. Create a new file in `src/migration-scripts/` — filename determines execution order (alphabetical).
2. Export a default async function named after the file (kebab-case → snake_case).
3. Accept `{ container }` as the argument.
4. Use workflows for writes, `query.graph()` for reads, `link.create()` for linking, module services for operations without workflows.
5. Use `logger.info()` for progress messages.
6. Run `pnpm exec medusa db:migrate` to execute.

### Script Template

```ts
import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function my_custom_seed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Running my custom seed...")

  try {
    // Read existing data
    const { data: existing } = await query.graph({
      entity: "product",
      fields: ["id", "handle"],
    })

    // Check idempotency
    if (existing.some((p) => p.handle === "my-product")) {
      logger.info("Product already exists, skipping...")
      return
    }

    // Create via workflow
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [ /* ... */ ],
      },
    })

    logger.info("Finished my custom seed.")
  } catch (error) {
    logger.error("Failed to run my custom seed:", error)
    throw error
  }
}
```

---

## Seed Data Summary

The `initial-data-seed.ts` script creates (in order):

| Step | Entity | Details |
|---|---|---|
| 1 | Sales Channel | `Default Sales Channel` (1) |
| 2 | Publishable API Key | `Default Publishable API Key`, linked to default channel (1) |
| 3 | Store | `Default Store`, currencies EUR (default) + USD (1) |
| 4 | Region | `Europe`, EUR, countries: gb, de, dk, se, fr, es, it (7) |
| 5 | Tax Regions | 7 (one per country) using `tp_system` provider |
| 6 | Stock Location | `European Warehouse` (Copenhagen, DK) (1) |
| 7 | Fulfillment Set | `European Warehouse delivery` + service zone `Europe` (1) |
| 8 | Shipping Options | `Standard Shipping` (2-3 days) and `Express Shipping` (24h), both `flat` pricing in EUR/USD/region (2) |
| 9 | Product Categories | `Shirts`, `Sweatshirts`, `Pants`, `Merch` (4) |
| 10 | Product Options | Size: S/M/L/XL · Color: Black/White |
| 11 | Products | Medusa T-Shirt, Medusa Sweatshirt, Medusa Sweatpants, Medusa Shorts (4) |
| 12 | Variants | T-Shirt has 8 (Size × Color), others have 4 (Size only) — total 20 |
| 13 | Pricing | All variants 10 EUR / 15 USD |
| 14 | Inventory | 1,000,000 units per variant at European Warehouse |
| 15 | Images | S3-hosted thumbnails + back/front images from medusa-public-images bucket |

### Detailed Product Data

**T-Shirt** (`handle: "t-shirt"`, `weight: 400g`, `status: published`):
- Categories: Shirts
- Options: Size + Color
- Variants: 8 (S/M/L/XL × Black/White)
- SKU pattern: `SHIRT-{SIZE}-{COLOR}` (e.g., `SHIRT-S-BLACK`)
- Prices: 10 EUR / 15 USD
- Images: 4 (front/back for black and white)

**Sweatshirt** (`handle: "sweatshirt"`, `weight: 400g`, `status: published`):
- Categories: Sweatshirts
- Options: Size only
- Variants: 4 (S/M/L/XL)
- SKU pattern: `SWEATSHIRT-{SIZE}` (e.g., `SWEATSHIRT-S`)
- Prices: 10 EUR / 15 USD
- Images: 2 (front/back)

**Sweatpants** (`handle: "sweatpants"`, `weight: 400g`, `status: published`):
- Categories: Pants
- Options: Size only
- Variants: 4 (S/M/L/XL)
- SKU pattern: `SWEATPANTS-{SIZE}` (e.g., `SWEATPANTS-S`)
- Prices: 10 EUR / 15 USD
- Images: 2 (front/back)

**Shorts** (`handle: "shorts"`, `weight: 400g`, `status: published`):
- Categories: Merch
- Options: Size only
- Variants: 4 (S/M/L/XL)
- SKU pattern: `SHORTS-{SIZE}` (e.g., `SHORTS-S`)
- Prices: 10 EUR / 15 USD
- Images: 2 (front/back)

### Shipping Options

| Name | Type | Label | Description | Price |
|---|---|---|---|---|
| Standard Shipping | `standard` | Standard | Ship in 2-3 days | 10 EUR / 10 USD / 10 region |
| Express Shipping | `express` | Express | Ship in 24 hours | 10 EUR / 10 USD / 10 region |

Both have rules: `enabled_in_store = true`, `is_return = false`.

---

## Current Seed Implementation Details

### No Error Handling

The seed script has **no try/catch**. If any step fails, the entire seed fails and `db:migrate` rolls back. This is acceptable for the scaffold because:
1. The seed runs inside a transaction
2. All steps are sequential and depend on previous steps
3. A partial seed would leave the database in an inconsistent state

For custom scripts, wrap in try/catch and use `logger.error()`:

```ts
try {
  // seed logic
} catch (error) {
  logger.error("Seed failed:", error)
  throw error
}
```

### No Idempotency Checks

The seed does **not** check if data already exists before creating it. It relies entirely on Medusa's migration script tracking to skip re-execution. If you manually delete the `migration_script` record and re-run, the seed will create duplicate data.

For custom scripts, add idempotency checks:

```ts
const { data: existing } = await query.graph({
  entity: "product",
  fields: ["handle"],
})

if (existing.some((p) => p.handle === "my-product")) {
  logger.info("Product already exists, skipping...")
  return
}
```

### Execution Order

The seed is named `initial-data-seed.ts`, which alphabetically sorts first among any custom scripts. It runs after all core module migrations but before any custom migration scripts you add later.

### Workflow vs Direct Service

The seed uses a mix of:
- **Workflows** for most entity creation (preferred)
- **Direct module service** for `createFulfillmentSets` (no workflow exists)
- **Link workflows** for many-to-many relationships (preferred)
- **Direct link.create()** for stock location → fulfillment provider (no workflow exists)

---

## Common Patterns for Custom Modules

When writing a migration script for a custom module:

1. Use `createXWorkflow` if a core workflow exists for the entity type.
2. Use `query.graph()` to read existing data before creating new entities.
3. Use `link.create()` to establish relationships between modules.
4. Use direct module services only when no workflow exists.
5. Wrap the entire script in a try/catch and use `logger.error()` for failures.
6. Keep scripts idempotent where possible — check if data already exists before creating.
7. Use `logger.info()` for progress messages so the seed output is readable.
8. Use non-null assertions (`!`) carefully — the seed uses them after workflow calls that are guaranteed to return at least one result.

---

## Debugging Migration Scripts

If a migration script fails:

1. Check the backend logs — the seed logs progress with `logger.info()`.
2. Check the `migration_script` table to see which scripts have run.
3. Fix the script, then either:
   - Run `pnpm exec medusa db:migrate:undo` to undo the last migration (and re-run)
   - Or delete the `migration_script` record for your script and re-run
4. For partial seeds, you may need to manually clean up created data before re-running.

### Undoing Migrations

```bash
# Undo the last migration
pnpm exec medusa db:migrate:undo

# Undo all migrations (dangerous!)
pnpm exec medusa db:migrate:undo --all
```

**Warning**: `db:migrate:undo` only undoes the last migration batch. If your seed created data that subsequent migrations depend on, undoing may leave the database in an inconsistent state.

---

## Seed Script Checklist

When creating a custom migration script:

- [ ] File named with a prefix that sorts after `initial-data-seed` (e.g., `z-custom-seed.ts` runs after `initial-data-seed.ts`)
- [ ] Default export named after the file (kebab-case → snake_case)
- [ ] Accepts `{ container: MedusaContainer }`
- [ ] Uses `try/catch` with `logger.error()`
- [ ] Uses workflows for writes
- [ ] Uses `query.graph()` for reads
- [ ] Uses `link.create()` or link workflows for relationships
- [ ] Checks for existing data before creating (idempotency)
- [ ] Uses `logger.info()` for progress markers
- [ ] Runs successfully with `pnpm exec medusa db:migrate`
