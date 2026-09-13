# API Routes Reference

## Overview
The backend uses **file-based routing** for REST API endpoints. Routes are organized under `apps/backend/src/api/` with two main prefixes: `/store` for customer-facing APIs and `/admin` for merchant APIs.

**Convention**:
- Route files are named `route.ts`
- HTTP methods are exported as named functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`
- Path parameters use `[param]` directory names

## Directory Structure

```
apps/backend/src/api/
├── store/
│   └── custom/
│       └── route.ts   # GET /store/custom  → 200 (scaffold)
├── admin/
│   └── custom/
│       └── route.ts   # GET /admin/custom  → 200 (scaffold)
└── README.md
```

No `middlewares.ts` is present at this point — global API middlewares can be added there.

## Existing Routes (scaffold)

### Store Route: `/store/custom`
```ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.sendStatus(200);
}
```
- **Method**: GET
- **Response**: 200 OK
- **Purpose**: Placeholder

### Admin Route: `/admin/custom`
```ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.sendStatus(200);
}
```
- **Method**: GET
- **Response**: 200 OK
- **Purpose**: Placeholder

## Routing Conventions

### File-Based
- `src/api/store/products/[productId]/route.ts` → `/store/products/:productId`
- `src/api/orders/[id]/route.ts` → `/orders/:id`
- File must be named `route.ts`

### HTTP Methods
```ts
export async function GET(req: MedusaRequest, res: MedusaResponse) { }
export async function POST(req: MedusaRequest, res: MedusaResponse) { }
export async function PUT(req: MedusaRequest, res: MedusaResponse) { }
export async function PATCH(req: MedusaRequest, res: MedusaResponse) { }
export async function DELETE(req: MedusaRequest, res: MedusaResponse) { }
export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) { }
export async function HEAD(req: MedusaRequest, res: MedusaResponse) { }
```

### Path Parameters
Use bracket notation: `src/api/store/products/[productId]/route.ts`. Read from `req.params.productId`.

### Query Parameters
Read from `req.query`.

### Request Body
Parsed automatically; read from `req.body`.

### Medusa Container
Access via `req.scope.resolve(...)`:
```ts
const productService = req.scope.resolve(Modules.PRODUCT)
const query = req.scope.resolve("query")
```

## Middleware (optional)
Add `src/api/middlewares.ts` to register global middlewares:
```ts
import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    { matcher: "/store/*", middlewares: [/* ... */] }
  ]
})
```

## Core API Routes (provided by Medusa)

### Store API (customer-facing)
| Path | Methods | Purpose |
|---|---|---|
| `/store/products` | GET | List products |
| `/store/products/:id` | GET | Get product |
| `/store/products/:id/variants` | GET | Get product variants |
| `/store/carts` | POST | Create cart |
| `/store/carts/:id` | GET, POST | Get/update cart |
| `/store/carts/:id/complete` | POST | Complete checkout |
| `/store/carts/:id/transfer` | POST | Transfer guest cart to customer |
| `/store/customers` | POST | Register customer |
| `/store/customers/me` | GET, POST, DELETE | Customer profile |
| `/store/customers/me/addresses` | GET, POST | Customer addresses |
| `/store/customers/me/orders` | GET | Customer orders |
| `/store/regions` | GET | List regions |
| `/store/collections` | GET | List collections |
| `/store/product-categories` | GET | List categories |
| `/store/payment-providers` | GET | List payment providers for region |
| `/store/payment-collections` | POST | Create payment collection |
| `/store/shipping-options` | GET | List shipping options for cart |
| `/store/orders/:id` | GET | Get order |
| `/store/auth` | POST | Authenticate |
| `/store/auth/:provider` | POST | OAuth auth |

### Admin API (merchant-facing)
| Path | Methods | Purpose |
|---|---|---|
| `/admin/products` | GET, POST | List/create products |
| `/admin/products/:id` | GET, POST, DELETE | Get/update/delete product |
| `/admin/orders` | GET | List orders |
| `/admin/orders/:id` | GET, POST | Get/update order |
| `/admin/customers` | GET, POST | List/create customers |
| `/admin/regions` | GET, POST | List/create regions |
| `/admin/collections` | GET, POST | List/create collections |
| `/admin/product-categories` | GET, POST | List/create categories |
| `/admin/inventory` | GET | List inventory |
| `/admin/users` | GET, POST | List/create users |
| `/admin/api-keys` | GET, POST | List/create API keys |
| `/admin/draft-orders` | GET, POST | Draft orders |
| `/admin/exchanges` | GET, POST | Exchanges |
| `/admin/returns` | GET, POST | Returns |
| `/admin/fulfillments` | GET, POST | Fulfillments |
| `/admin/promotions` | GET, POST | Promotions |
| `/admin/gift-cards` | GET, POST | Gift cards |
| `/admin/store` | GET, POST | Store settings |
| `/admin/stock-locations` | GET, POST | Stock locations |
| `/admin/feature-flags` | GET | Feature flags |
| `/admin/users/me` | GET | Current admin user |

### Auth API
| Path | Methods | Purpose |
|---|---|---|
| `/auth/admin/emailpass` | POST | Admin login (`{ email, password }`) |
| `/auth/admin/emailpass/register` | POST | Admin register |
| `/auth/admin/emailpass/update` | POST | Update password |
| `/auth/session` | POST/DELETE | Manage session |
| `/auth/user/providers` | GET | List user providers |
| `/cloud/auth` | GET | Cloud auth callback |
| `/auth/store/emailpass` | POST | Customer login |
| `/auth/store/emailpass/register` | POST | Customer register |

## Creating Custom API Routes

### Store route example
```ts
// src/api/store/brands/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { data } = await query.graph({
    entity: "brand",
    fields: ["id", "name", "handle"],
  })
  res.json({ brands: data })
}
```

### Admin route example
```ts
// src/api/admin/brands/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve("brandService")
  const brands = await brandService.listBrands()
  res.json({ brands })
}
```

## Authentication

### Storefront
Pass `Authorization: Bearer <customer_token>` for authenticated calls. The publishable API key is also required for store routes via `x-publishable-api-key`.

### Admin
Pass `Authorization: Bearer <admin_token>`. Obtain a token via the admin login endpoint:
```bash
curl -X POST http://localhost:9000/auth/admin/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"<admin_email>","password":"<admin_password>"}'
```

For this install, use the admin credentials from `context.md`:
```powershell
$body = '{"email":"<admin_email>","password":"<admin_password>"}'
Invoke-RestMethod -Method Post -Uri http://localhost:9000/auth/admin/emailpass -ContentType "application/json" -Body $body
```

## Error Handling
Use `MedusaError` from `@medusajs/framework/utils`:
- `NOT_FOUND` (404), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `INVALID_DATA` (400), `CONFLICT` (409), `INTERNAL_SERVER_ERROR` (500)

## Validation
Use `zod`:
```ts
import { z } from "zod"

const CreateBrand = z.object({
  name: z.string(),
  handle: z.string(),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validated = CreateBrand.parse(req.body)
  // ...
}
```

## CORS Configuration
Set in `apps/backend/.env`:
```
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,http://localhost:8000,https://docs.medusajs.com
```

## Best Practices
1. Business logic in workflows, not route handlers.
2. Use module services for data access, never raw SQL.
3. Validate input with Zod.
4. Use `MedusaError` for consistent responses.
5. Access the container via `req.scope.resolve()`, not direct imports.
6. Keep routes thin — delegate to workflows and services.
7. Use path params for resource identification, query strings for filters.