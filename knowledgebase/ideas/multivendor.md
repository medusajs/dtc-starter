# Multivendor Marketplace Implementation Research

## 1. Goal
Add multivendor marketplace capabilities to the MedusaJS installation at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js` while keeping the architecture clean, upgrade-safe, and aligned with Medusa’s official extension patterns.

---

## 2. Reference Implementations

### 2.1 Official Medusa Marketplace Recipe
Medusa’s official docs provide a vendor marketplace recipe (`docs.medusajs.com/resources/recipes/marketplace`) that shows the canonical approach:
- Custom `marketplace` module with `Vendor` + `VendorAdmin` data models
- Module links between Vendor, Product, and Order
- Vendor-scoped API routes under `/vendors/*`
- Custom actor type `vendor` for authentication
- Order splitting via workflow extension

This is the **recommended baseline** because it uses only public Medusa APIs.

### 2.2 MercurJS (Production Reference)
MercurJS is the most complete open-source marketplace layer built on Medusa. Key patterns to study:

**Domain model:**
- `Seller` — vendor entity with handle, status (`pending_approval` / `open` / `suspended` / `terminated`), address, payment details, `is_premium`, scheduled closures
- `Member` — many-to-many user-to-seller relationship with roles
- `Master Product` — shared catalog, sellers get allowlist via `product-seller-link`
- `Offer` — sellable listing tying seller to master product/variant with seller-specific SKU, price, inventory, shipping
- `OrderGroup` — parent wrapper for a cart split across sellers
- `Commission` — rule-based fees matched across product/category/seller dimensions
- `Payout` — automated settlement via Stripe Connect

**Architecture principles:**
- Modules never reference each other directly — only links and workflows
- Dozens of module links wire marketplace into commerce without touching core schemas
- Workflows support compensation (automatic rollback on failure)
- Scheduled jobs + subscribers handle async side effects

---

## 3. Recommended Approach: Native Medusa Implementation

### 3.1 Strategy
Build marketplace features directly in `apps/backend/src/` using Medusa’s module/link/workflow/API-route pattern. Do **not** fork MercurJS. This gives full control, avoids upgrade coupling, and keeps the codebase consistent with the existing DTC starter.

### 3.2 Phase 1: Marketplace Module Foundation

**Create module:**
```
apps/backend/src/modules/marketplace/
  models/
    vendor.ts
    vendor-admin.ts
  service.ts
  index.ts
```

**vendor.ts** — follows official recipe:
```ts
import { model } from "@medusajs/framework/utils"
import VendorAdmin from "./vendor-admin"

const Vendor = model.define("vendor", {
  id: model.id().primaryKey(),
  handle: model.text().unique(),
  name: model.text(),
  logo: model.text().nullable(),
  status: model.text().default("pending_approval"),
  admins: model.hasMany(() => VendorAdmin, { mappedBy: "vendor" }),
  metadata: model.json().nullable(),
})

export default Vendor
```

**vendor-admin.ts**:
```ts
import { model } from "@medusajs/framework/utils"
import Vendor from "./vendor"

const VendorAdmin = model.define("vendor_admin", {
  id: model.id().primaryKey(),
  first_name: model.text().nullable(),
  last_name: model.text().nullable(),
  email: model.text().unique(),
  vendor: model.belongsTo(() => Vendor, { mappedBy: "admins" }),
})

export default VendorAdmin
```

**service.ts** — extend `MedusaService` for auto-generated CRUD:
```ts
import { MedusaService } from "@medusajs/framework/utils"
import Vendor from "./models/vendor"
import VendorAdmin from "./models/vendor-admin"

export default class MarketplaceModuleService extends MedusaService({
  Vendor,
  VendorAdmin,
}) {}
```

**index.ts**:
```ts
import { Module } from "@medusajs/framework/utils"
import MarketplaceModuleService from "./service"

export const MARKETPLACE_MODULE = "marketplace"

export default Module(MARKETPLACE_MODULE, {
  service: MarketplaceModuleService,
})
```

**Register in `medusa-config.ts`**:
```ts
module.exports = defineConfig({
  // ... existing config
  modules: [
    { resolve: "./src/modules/marketplace" },
  ],
})
```

**Generate migrations:**
```bash
pnpm exec medusa db:generate marketplace
pnpm exec medusa db:migrate
```

### 3.3 Phase 2: Module Links

Define links in `apps/backend/src/links/`:

**vendor-product.ts** — allowlist which vendors may sell which products:
```ts
import { defineLink } from "@medusajs/framework/utils"
import MarketplaceModule from "../modules/marketplace"
import ProductModule from "@medusajs/medusa/product"

export default defineLink(
  MarketplaceModule.linkable.vendor,
  { linkable: ProductModule.linkable.product.id, isList: true }
)
```

**vendor-order.ts** — associate orders with vendors:
```ts
import { defineLink } from "@medusajs/framework/utils"
import MarketplaceModule from "../modules/marketplace"
import OrderModule from "@medusajs/medusa/order"

export default defineLink(
  MarketplaceModule.linkable.vendor,
  { linkable: OrderModule.linkable.order.id, isList: true }
)
```

**vendor-user.ts** — link vendor admins to Medusa users:
```ts
import { defineLink } from "@medusajs/framework/utils"
import MarketplaceModule from "../modules/marketplace"
import UserModule from "@medusajs/medusa/user"

export default defineLink(
  MarketplaceModule.linkable.vendorAdmin,
  { linkable: UserModule.linkable.user.id, isList: false }
)
```

Sync links:
```bash
pnpm exec medusa db:sync-links
```

### 3.4 Phase 3: Vendor Workflows

Create workflows in `apps/backend/src/workflows/marketplace/`:

**create-vendor/steps/create-vendor.ts** — create vendor record
**create-vendor/steps/create-vendor-admin.ts** — create vendor admin
**create-vendor/index.ts** — compose workflow using `createVendorStep`, `createVendorAdminStep`, `setAuthAppMetadataStep`, `useQueryGraphStep`

Key pattern from official docs:
```ts
const createVendorWorkflow = createWorkflow(
  "create-vendor",
  function (input: CreateVendorWorkflowInput) {
    const vendor = createVendorStep({ name: input.name, handle: input.handle })
    const vendorAdmin = createVendorAdminStep({ ...input.admin, vendor_id: vendor.id })
    setAuthAppMetadataStep({ authIdentityId: input.authIdentityId, actorType: "vendor", value: vendorAdmin.id })
    const { data } = useQueryGraphStep({ entity: "vendor", fields: ["*", "admins.*"], filters: { id: vendor.id } })
    return new WorkflowResponse({ vendor: data[0] })
  }
)
```

**approve-vendor/steps/approve-vendor.ts** — operator approves vendor
**suspend-vendor/steps/suspend-vendor.ts** — operator suspends vendor

### 3.5 Phase 4: Vendor API Routes

Create `apps/backend/src/api/middlewares.ts`:
```ts
import { defineMiddlewares, authenticate, validateAndTransformBody } from "@medusajs/framework/http"
import { PostVendorCreateSchema } from "./vendors/route"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/vendors",
      method: ["POST"],
      middlewares: [
        authenticate("vendor", ["session", "bearer"], { allowUnregistered: true }),
        validateAndTransformBody(PostVendorCreateSchema),
      ],
    },
    {
      matcher: "/vendors/*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
  ],
})
```

**vendors/route.ts** — create vendor (POST)
**vendors/products/route.ts** — vendor-scoped product CRUD (GET, POST)
**vendors/orders/route.ts** — vendor-scoped order listing (GET)

Storefront/public routes:
**store/sellers/route.ts** — public seller directory (GET)
**store/sellers/[handle]/route.ts** — public seller storefront (GET)

### 3.6 Phase 5: Order Splitting

Extend cart completion to split orders by vendor. Workflow steps:
1. `group-vendor-items.ts` — group cart line items by vendor using `query.graph()`
2. `create-vendor-orders.ts` — create per-vendor child orders using `createOrderWorkflow`
3. `link-orders-to-vendor.ts` — link child orders to vendor via `createRemoteLinkStep`
4. Compensation: cancel created child orders on failure using `cancelOrderWorkflow`

Reference: official Medusa marketplace recipe Step 8.

### 3.7 Phase 6: Commission Module (Optional, Advanced)

```
apps/backend/src/modules/commission/
  models/
    commission-rule.ts
  service.ts
  index.ts
```

- Rule-based rates matched across product, category, seller
- Auto-calculate on order placement via subscriber or workflow hook
- Use BigNumber for financial precision (see MercurJS pattern)

### 3.8 Phase 7: Admin Dashboard Extensions

Use Medusa’s admin extension points in `apps/backend/src/admin/`:
- **Widgets** — marketplace overview cards
- **UI Routes** — `/admin/stores`, `/admin/vendors`, `/admin/commissions`
- **Settings** — marketplace configuration

### 3.9 Phase 8: Vendor Dashboard

Options:
- **A**: Admin extensions with vendor-scoped views (quickest)
- **B**: Separate Vite dashboard app (like MercurJS)
- **C**: Seller pages in Next.js storefront under `/seller/*`

Recommended: start with **A**, evolve to **C** as needs grow.

---

## 4. Critical Implementation Rules

### 4.1 Medusa Conventions (from `building-with-medusa` skill)
- **Workflows required for ALL mutations** — never call module services directly from routes
- **Only GET, POST, DELETE** — never PUT/PATCH
- **Module isolation** — use links, not direct cross-module service calls
- **Query patterns**:
  - `query.graph()` for cross-module retrieval
  - `query.index()` for filtering across linked modules
- **Prices stored as-is** — 49.99 is stored as 49.99, not cents
- **Module names camelCase** — never dashes
- **Zod from `@medusajs/framework/zod`** — use v4 API (`z.email()`, `z.strictObject()`, etc.)

### 4.2 Upgrade Safety
- Use **modules** for custom data models
- Use **module links** instead of foreign keys
- Use **workflow hooks** instead of modifying core workflows
- Use **middleware** for request scoping
- Avoid forking or patching Medusa core

---

## 5. File Structure to Create

### Backend
```
apps/backend/src/modules/marketplace/
  models/vendor.ts
  models/vendor-admin.ts
  service.ts
  index.ts

apps/backend/src/links/
  vendor-product.ts
  vendor-order.ts
  vendor-user.ts

apps/backend/src/workflows/marketplace/
  create-vendor/
    steps/create-vendor.ts
    steps/create-vendor-admin.ts
    index.ts
  approve-vendor/
    steps/approve-vendor.ts
    index.ts
  split-order/
    steps/group-vendor-items.ts
    steps/create-vendor-orders.ts
    index.ts

apps/backend/src/api/
  middlewares.ts
  vendors/route.ts
  vendors/products/route.ts
  vendors/orders/route.ts
  store/sellers/route.ts
  store/sellers/[handle]/route.ts

apps/backend/src/subscribers/marketplace/
  order-completed.ts
```

### Frontend
```
apps/storefront/src/app/[countryCode]/(main)/sellers/page.tsx
apps/storefront/src/app/[countryCode]/(main)/sellers/[handle]/page.tsx
apps/storefront/src/modules/seller/
  components/seller-card.tsx
  components/seller-list.tsx
  templates/seller-storefront.tsx
```

---

## 6. Alternative: `@techlabi/medusa-marketplace-plugin`

### 6.1 What It Is
A community Medusa plugin that transforms a standard Medusa store into a multivendor marketplace. It is published on npm as `@techlabi/medusa-marketplace-plugin` (v0.65.0, Apache 2.0, ~803 monthly downloads). The plugin is backed by a 4-part Medium series and a demo app at `https://github.com/Tech-Labi/medusa2-marketplace-demo`.

### 6.2 How It Is Built
The plugin follows Medusa’s extension architecture:
- **Module links** are the primary separation mechanism. It defines links for `customer-store`, `order-store`, `price-list-store`, `product-store`, `shipping-profile-store`, `stock-location-store`, and `user-store`.
- **Super admin role** is introduced to manage the marketplace and impersonate vendor accounts.
- **Store creation workflow** lets operators create vendor stores, each with isolated entities (customers, orders, products, price lists, shipping profiles, stock locations, user accounts).
- **Admin patch**: the plugin requires a `postinstall` script (`patch-admin.js`) that modifies Medusa admin internals. This is injected into `package.json` and runs after `yarn install` / `pnpm install`.

### 6.3 How to Install

```bash
# 1. Install plugin
yarn add @techlabi/medusa-marketplace-plugin
# or with pnpm:
pnpm add @techlabi/medusa-marketplace-plugin
```

Add to root `package.json`:
```json
{
  "scripts": {
    "postinstall": "node node_modules/@techlabi/medusa-marketplace-plugin/.medusa/server/src/patch-admin.js"
  }
}
```

Add env vars to `apps/backend/.env`:
```env
API_KEY=supersecret
VITE_BACKEND_URL=http://localhost:9000
ALLOW_API_KEYS_FOR_VENDORS=true
```

Register in `apps/backend/medusa-config.ts`:
```ts
module.exports = defineConfig({
  projectConfig: { /* existing config */ },
  plugins: [
    {
      resolve: "@techlabi/medusa-marketplace-plugin",
      options: {},
    },
  ],
  admin: {
    vite: (config) => {
      config.define["__VITE_DISABLE_SIGNUP_WIDGET__"] = JSON.stringify(true)
    },
  },
})
```

Run migrations:
```bash
pnpm exec medusa db:migrate
```

Create super admin:
```bash
curl -X POST http://localhost:9000/stores/super \
  -d '{ "email":"admin@test.com", "password": "supersecret"}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: supersecret'
```

### 6.4 How It Works (Architecture)

The plugin does **not** replace Medusa core. Instead, it uses Medusa’s public extension points:

| Concern | Implementation |
|---------|---------------|
| Vendor identity | Module links between `store` and core entities |
| Data isolation | Each vendor gets a Medusa `Store`; links scope customers, orders, products, inventory, shipping |
| Admin experience | Postinstall patch injects custom admin UI/routes |
| Vendor auth | Custom actor type / admin impersonation |
| Order separation | Orders are linked to stores via `order-store` link |

This means:
- **Upgrade risk is moderate**: the `postinstall` patch touches admin internals and may break on Medusa minor upgrades. The plugin author has been maintaining it across Medusa 2.x releases.
- **Limited marketplace logic**: there is no built-in commission engine, payout automation, or offer/master-product model. It provides store separation, not a full marketplace transaction layer.
- **Admin coupling**: the plugin relies on patching admin internals, which is necessary for its custom admin UI but is inherently fragile compared to official extension points.

### 6.5 When to Use This Plugin

**Good fit:**
- Rapid prototyping or MVP where you need vendor separation quickly
- You are comfortable with community-maintained code and occasional upgrade fixes
- You don’t need advanced marketplace features like commissions, payouts, or offer-based listings

**Not recommended if:**
- You need full marketplace transaction logic (commissions, payouts, order splitting by seller)
- You want zero coupling to Medusa admin internals
- You are building a production marketplace that must survive Medusa major/minor upgrades without manual patch updates

### 6.6 Comparison: Plugin vs Native Implementation

| Aspect | Plugin (`@techlabi`) | Native Implementation |
|--------|----------------------|----------------------|
| **Setup speed** | Fast — install + patch + migrate | Slower — build modules, links, workflows, routes |
| **Upgrade safety** | Moderate — admin patch may break | High — uses only public Medusa APIs |
| **Marketplace depth** | Store separation + super admin + impersonation | Full control: offers, commissions, payouts, order splitting |
| **Maintenance** | Follow plugin releases | You own the code |
| **Admin UI** | Provided via patch | Build with `@medusajs/admin-sdk` |
| **Vendor UX** | Basic store management | Customizable to any depth |
| **Commissions/Payouts** | Not included | Build as needed |

### 6.7 Architectural Assessment

The plugin is **more aligned with Medusa architecture than a custom Express backend** because:
- It uses **module links** rather than foreign keys or separate schemas
- It registers itself via `plugins` in `medusa-config.ts`
- It relies on Medusa’s built-in commerce modules (product, order, customer, inventory, shipping)
- It does not replace the backend with a custom server

However, it is **less aligned than a native custom module implementation** because:
- It requires a **postinstall patch** to Medusa admin internals
- It does not expose a workflow-first mutation pattern for marketplace operations
- It lacks the compensation/rollback patterns that Medusa workflows provide
- It does not implement the offer/master-product model that MercurJS uses for true multivendor listings

### 6.8 Recommended Path

For this project:
1. **If speed matters most**: install `@techlabi/medusa-marketplace-plugin` to get vendor separation immediately, then iterate.
2. **If long-term control matters**: build the native implementation described in Sections 3.1–3.9 of this document. It takes longer but avoids patch fragility and gives full control over commissions, payouts, and order splitting.

You can also **start with the plugin and migrate to native later**:
- Use the plugin’s store/link structure as a reference
- Keep your storefront abstraction clean so vendor-scoped data can be swapped from plugin links to native links
- Reuse the same admin/storefront UI patterns

---

## 7. Comparison: Our Project vs MercurJS

| Aspect | Our `medusa-js` | MercurJS |
|--------|-----------------|----------|
| Backend | Single Medusa app | Medusa + `@mercurjs/core` plugin |
| Multi-vendor | None | Full marketplace layer |
| Modules | None custom | 10+ marketplace modules |
| Links | None | 35+ module links |
| Admin | Standard Medusa Admin | `@mercurjs/admin` (39 pages) |
| Vendor Panel | None | `@mercurjs/vendor` (24 pages) |
| Order Splitting | None | OrderGroup + per-seller orders |
| Product Model | Single-seller | Master product + Offer model |
| Auth | Admin + Customer | Admin + Vendor + Customer |
| Package Manager | pnpm | Bun |
| Frontend Stack | Next.js + Tailwind | React + Vite + Medusa UI |

---

## 8. Implementation Checklist

### 8.1 Native Implementation
- [ ] Create `apps/backend/src/modules/marketplace/` with `Vendor` + `VendorAdmin` models
- [ ] Register module in `medusa-config.ts`
- [ ] Generate and run migrations
- [ ] Define `vendor-product`, `vendor-order`, `vendor-user` links
- [ ] Sync links to database
- [ ] Create `create-vendor` workflow with compensation
- [ ] Create `approve-vendor` and `suspend-vendor` workflows
- [ ] Add `/vendors` API route with `authenticate("vendor")` middleware
- [ ] Add `/vendors/products` and `/vendors/orders` routes
- [ ] Add `/store/sellers` public directory route
- [ ] Implement order splitting workflow (`group-vendor-items` → `create-vendor-orders`)
- [ ] Add commission module (optional)
- [ ] Add admin widgets/pages for marketplace management
- [ ] Extend storefront with seller directory and storefront pages
- [ ] Add payout integration (Stripe Connect) if needed

### 8.2 Plugin Implementation
- [ ] Install `@techlabi/medusa-marketplace-plugin`
- [ ] Add `postinstall` patch script to root `package.json`
- [ ] Add `API_KEY` and `VITE_BACKEND_URL` to `.env`
- [ ] Register plugin in `medusa-config.ts`
- [ ] Run `pnpm exec medusa db:migrate`
- [ ] Create super admin via `/stores/super`
- [ ] Test store creation and entity separation
- [ ] Verify admin impersonation works
- [ ] Evaluate need for custom marketplace extensions

---

## 9. Upgrade & Maintenance Considerations

### 9.1 Native Implementation
- Use **modules** for custom data models — isolated, upgrade-safe
- Use **module links** instead of foreign keys — schemas stay stable
- Use **workflow hooks** instead of modifying core workflows
- Use **middleware** for request scoping instead of modifying handlers
- Avoid forking or patching Medusa core packages

### 9.2 Plugin Implementation
- The plugin requires a **postinstall patch** that modifies Medusa admin internals
- Monitor plugin releases for Medusa version compatibility
- Test thoroughly when upgrading Medusa minor versions
- Keep a backup of `medusa-config.ts` and custom admin overrides
- Consider contributing fixes back to the plugin repo

### 9.3 Medusa Version Tracking
- Current: 2.20.1
- Plugin tracks Medusa 2.x closely
- Medusa releases ~monthly minor versions with breaking changes
- Custom code should target Medusa’s public APIs, not internals

### 9.4 Migration Path if Switching to MercurJS Later
If we outgrow our custom implementation:
1. Export our marketplace data model
2. Create a fresh `bun create mercur-app@latest`
3. Map our custom logic to MercurJS blocks/workflows
4. Port data via migration scripts
5. MercurJS 2.0+ uses code blocks copied into project, making porting easier

---

## 10. Recommended Next Steps

1. **Validate requirements** — confirm multivendor scope (simple vendor separation vs full marketplace with commissions/payouts)
2. **Choose implementation path** — plugin for speed, native for control, or hybrid
3. **If plugin**: install `@techlabi/medusa-marketplace-plugin`, apply patch, run migrations, test store creation
4. **If native**: create marketplace module with `Vendor` + `VendorAdmin` models
5. **Define core links** — vendor-product, vendor-order, vendor-user
6. **Build vendor onboarding workflow** — create store, invite admin, set auth metadata
7. **Add vendor API routes** — scoped product/order management
8. **Implement order splitting** — extend cart completion for multi-vendor carts
9. **Add admin marketplace pages** — vendor management, commission rules
10. **Extend storefront** — seller directory, multi-vendor cart

---

## 11. Sources

- MedusaJS Marketplace Recipe: https://docs.medusajs.com/resources/recipes/marketplace/examples/vendors
- MercurJS Architecture Doc: https://github.com/mercurjs/mercur/blob/main/docs/ARCHITECTURE.md
- MercurJS UI Architecture: https://github.com/mercurjs/mercur/blob/main/docs/UI-ARCHITECTURE.md
- MercurJS Product Description: https://github.com/mercurjs/mercur/blob/main/docs/PRODUCT.md
- MercurJS Links: https://github.com/mercurjs/mercur/tree/main/packages/core/src/links
- `@techlabi/medusa-marketplace-plugin` npm: https://www.npmjs.com/package/@techlabi/medusa-marketplace-plugin
- `@techlabi/medusa-marketplace-plugin` GitHub: https://github.com/Tech-Labi/medusa-marketplace-plugin
- Plugin demo app: https://github.com/Tech-Labi/medusa2-marketplace-demo
- Local project knowledgebase: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js\knowledgebase\context.md`
- MedusaJS marketing plugin landscape: npm, GitHub searches
- Community marketplace plugin: https://github.com/Tech-Labi/medusa-marketplace-plugin

---

*Research compiled: 2026-09-08*
*Based on MedusaJS v2.20.1, MercurJS v2.3.1, @techlabi/medusa-marketplace-plugin v0.65.0, and local project inspection*
