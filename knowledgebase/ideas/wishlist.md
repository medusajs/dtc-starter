# Wishlist Feature Implementation Research

## 1. Goal
Add wishlist capabilities to the existing MedusaJS installation at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`, allowing customers to save products for later, manage their wishlist, and optionally share it. The implementation should follow Medusa’s module/link/workflow architecture and integrate cleanly with the existing Next.js storefront.

---

## 2. Why Medusa Doesn’t Have a Built-In Wishlist
Medusa deliberately keeps its core commerce modules narrow. A wishlist is a business decision, not a universal commerce primitive — some stores want account-only lists, others want guest wishlists with merge-on-login, and others want shareable lists. Building it as a custom module gives you full control over these behaviors instead of fighting a plugin’s assumptions.

---

## 3. Implementation Options

### Option A: Official Medusa Wishlist Plugin Guide (Recommended)
Medusa’s official docs provide a complete step-by-step guide for building a wishlist **plugin**: https://docs.medusajs.com/resources/plugins/guides/wishlist

This is the most authoritative source and aligns with Medusa’s v2 architecture. It covers:
- Wishlist module with `Wishlist` and `WishlistItem` data models
- Module links to Customer and ProductVariant
- Workflows for create, add item, remove item
- Store API routes under `/store/customers/me/wishlists`
- Validation middleware
- Full OpenAPI spec

**Pros**: Official, maintainable, follows Medusa conventions exactly
**Cons**: Requires building the storefront UI yourself

### Option B: Community Plugin `@godscodes/medusa-wishlist-plugin`
GitHub: https://github.com/godscodes/medusajs-wishlist-plugin

A ready-to-install plugin that implements the official guide’s pattern. It provides:
- `WishlistModule` with `Wishlist` and `WishlistItem` models
- Links to Customer, SalesChannel, ProductVariant
- Workflows: `createWishlistWorkflow`, `createWishlistItemWorkflow`
- API routes: `POST /store/customers/me/wishlists`, `GET /store/customers/me/wishlists`, `POST /store/customers/me/wishlists/items`, `DELETE /store/customers/me/wishlists/items/:id`
- Admin UI section showing wishlists in the product page

Can be installed as a plugin **or** copied directly into an existing Medusa app.

**Installation**:
```bash
pnpm add @godscodes/medusa-wishlist-plugin
```

```ts
// medusa-config.ts
module.exports = defineConfig({
  plugins: [
    { resolve: "@godscodes/medusa-wishlist-plugin", options: {} }
  ]
})
```

**Pros**: Ready-made, tested, follows official guide
**Cons**: Community-maintained, no vendor-specific features, no guest wishlist merge logic out of box

### Option C: Build Custom Wishlist Module Inline
Instead of a plugin, create the wishlist module directly in the existing `apps/backend/src/modules/wishlist/` directory. This is the best approach if:
- You want full control over the data model
- You need guest wishlist support with cookie-based persistence
- You want to avoid external dependencies
- You plan to extend it later (e.g., wishlist sharing, price-drop alerts)

---

## 4. Recommended Architecture: Custom Module Inline

Given our project constraints (existing Next.js storefront, pnpm workspace, no plugin infrastructure yet), building the wishlist as a **custom module inline** is the cleanest approach. It follows the same patterns we’ll use for multivendor later.

### 4.1 Backend Data Model

```
apps/backend/src/modules/wishlist/
  models/
    wishlist.ts
    wishlist-item.ts
  service.ts
  index.ts
```

**Wishlist model**:
```ts
const Wishlist = model.define("wishlist", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),  // null for guest wishlists
  guest_id: model.text().nullable(),     // anonymous cookie identifier
  sales_channel_id: model.text(),        // required for store-scoping
  metadata: model.json().nullable(),     // for sharing tokens, preferences
})
```

**WishlistItem model**:
```ts
const WishlistItem = model.define("wishlist_item", {
  id: model.id().primaryKey(),
  wishlist_id: model.text(),
  product_variant_id: model.text(),      // link to variant, not product
  metadata: model.json().nullable(),
})
```

**Relationships** (via DML):
- `Wishlist` has many `WishlistItem`s
- `Wishlist` belongs to `Customer` (nullable)
- `Wishlist` belongs to `SalesChannel`
- `WishlistItem` belongs to `ProductVariant`

### 4.2 Module Links

Create `apps/backend/src/links/`:

**wishlist-customer-link.ts**:
```ts
export default defineLink(
  WishlistModule.linkable.wishlist,
  { linkable: CustomerModule.linkable.customer.id }
)
```

**wishlist-product-variant-link.ts**:
```ts
export default defineLink(
  WishlistModule.linkable.wishlist,
  { linkable: ProductModule.linkable.product_variant.id, isList: true }
)
```

**wishlist-sales-channel-link.ts**:
```ts
export default defineLink(
  WishlistModule.linkable.wishlist,
  { linkable: SalesChannelModule.linkable.sales_channel.id }
)
```

Run `pnpm exec medusa db:generate wishlist` then `pnpm exec medusa db:migrate` and `pnpm exec medusa db:sync-links`.

### 4.3 Service

Extend `MedusaService` to get CRUD methods automatically:
```ts
class WishlistModuleService extends MedusaService({
  Wishlist,
  WishlistItem,
}) {}
```

This generates: `createWishlists`, `retrieveWishlist`, `updateWishlists`, `deleteWishlists`, `listWishlists`, and same for `WishlistItem`.

### 4.4 Workflows

Create `apps/backend/src/workflows/wishlist/`:

**create-wishlist.ts**:
- Steps: validate customer doesn’t already have wishlist → create wishlist
- Returns created wishlist

**add-wishlist-item.ts**:
- Steps: retrieve wishlist → validate sales channel → validate variant not already in wishlist → create item → refetch wishlist with items
- Returns updated wishlist

**remove-wishlist-item.ts**:
- Steps: retrieve item → delete item → refetch wishlist
- Returns updated wishlist

**merge-guest-wishlist.ts** (advanced):
- Steps: find guest wishlist by cookie → find customer wishlist → merge items (deduplicate) → delete guest wishlist → return merged wishlist
- Triggered on customer login/registration

### 4.5 API Routes

Create `apps/backend/src/api/store/customers/me/wishlists/`:

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/store/customers/me/wishlists` | Create wishlist for authenticated customer |
| `GET` | `/store/customers/me/wishlists` | Retrieve customer’s wishlist with items |
| `POST` | `/store/customers/me/wishlists/items` | Add variant to wishlist |
| `DELETE` | `/store/customers/me/wishlists/items/:id` | Remove item from wishlist |

**Guest routes** (optional, cookie-based):
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/store/wishlists/guest` | Create guest wishlist, sets cookie |
| `GET` | `/store/wishlists/guest` | Retrieve guest wishlist from cookie |
| `POST` | `/store/wishlists/guest/items` | Add item to guest wishlist |
| `DELETE` | `/store/wishlists/guest/items/:id` | Remove item from guest wishlist |
| `POST` | `/store/wishlists/merge` | Merge guest wishlist into customer wishlist on login |

**Validation middleware** (`apps/backend/src/api/middlewares.ts`):
- `validateWishlistBody` — ensures `variant_id` is present
- `requireWishlistAccess` — ensures customer owns the wishlist
- `guestWishlistCookie` — reads/sets `wishlist_token` cookie for guest access

### 4.6 Storefront Integration

The existing storefront uses:
- Server Components for data fetching
- Server Actions (`"use server"`) in `src/lib/data/*.ts`
- `@tanstack/react-query` for client-side caching
- `sdk.client.fetch()` for API calls

**Files to create**:

**`apps/storefront/src/lib/data/wishlist.ts`**:
```ts
"use server"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"

export const getWishlist = async () => { ... }
export const createWishlist = async () => { ... }
export const addToWishlist = async ({ variantId }: { variantId: string }) => { ... }
export const removeFromWishlist = async (itemId: string) => { ... }
export const isVariantInWishlist = async (variantId: string) => { ... }
```

**`apps/storefront/src/app/[countryCode]/(main)/wishlist/page.tsx`**:
- Server component that fetches wishlist items
- Reuses existing product card components
- Remove button per item

**`apps/storefront/src/modules/wishlist/`**:
- `components/wishlist-icon.tsx` — heart icon with filled/outlined state
- `components/wishlist-popover.tsx` — quick view dropdown in header
- `templates/wishlist-page-template.tsx` — full wishlist page

**Product page integration** (`apps/storefront/src/modules/products/templates/product-detail/`):
- Add wishlist toggle button near “Add to Cart”
- Use `useMutation` + `queryClient.invalidateQueries({ queryKey: ["wishlist"] })` for optimistic updates
- Check `isVariantInWishlist` on mount to set initial heart state

**Header integration** (`apps/storefront/src/modules/layout/components/nav/`):
- Add wishlist icon to nav with item count badge
- Link to `/wishlist` page

---

## 5. Guest Wishlist Strategy

This is the hardest part of wishlist implementation. The recommended approach is **cookie-based guest wishlist with merge on login**.

### 5.1 Flow
1. **Guest adds item**: Backend creates a `Wishlist` with `guest_id` (random UUID stored in `wishlist_token` cookie). Item is linked to this guest wishlist.
2. **Guest continues browsing**: Cookie persists across sessions. Items accumulate in the guest wishlist.
3. **Guest logs in**: Storefront calls `POST /store/wishlists/merge` with the guest cookie token. Backend:
   - Finds customer’s existing wishlist
   - Finds guest wishlist by `guest_id`
   - Merges items (deduplicate by `product_variant_id`)
   - Reassigns merged items to customer wishlist
   - Deletes guest wishlist
   - Returns updated customer wishlist
4. **Post-login**: All subsequent wishlist operations use the authenticated customer routes.

### 5.2 Cookie Management
```ts
// apps/storefront/src/lib/data/cookies.ts (extend existing)
export const getWishlistToken = async () => {
  const cookies = await nextCookies()
  return cookies.get("wishlist_token")?.value ?? null
}

export const setWishlistToken = async (token: string) => {
  const cookieStore = await cookies()
  cookieStore.set("wishlist_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  })
}
```

---

## 6. Storefront UI Patterns

### 6.1 Wishlist Icon Button
Place on product cards and PDP. Use the existing icon pattern from `src/modules/common/icons/`.

```tsx
// components/wishlist-icon.tsx
"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addToWishlist, removeFromWishlist, isVariantInWishlist } from "@lib/data/wishlist"
import { Heart } from "@medusajs/icons"

export const WishlistIcon = ({ variantId }: { variantId: string }) => {
  const [filled, setFilled] = useState(false)
  const queryClient = useQueryClient()
  
  useEffect(() => {
    isVariantInWishlist(variantId).then(setFilled)
  }, [variantId])

  const toggle = useMutation({
    mutationFn: async () => {
      if (filled) {
        const wishlist = await getWishlist()
        const item = wishlist?.items?.find(i => i.product_variant_id === variantId)
        if (item) await removeFromWishlist(item.id)
      } else {
        await addToWishlist({ variantId })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] })
      setFilled(!filled)
    }
  })

  return <Heart className={filled ? "fill-current" : ""} onClick={() => toggle.mutate()} />
}
```

### 6.2 Wishlist Page
Standard Next.js App Router page:
- Server component fetches wishlist via `getWishlist()`
- Reuses product card components from `src/modules/products/`
- Shows variant title, image, price, stock status
- Remove button per item
- “Move to Cart” button per item (optional)
- Empty state with link to shop

### 6.3 Header Popover (Optional)
A dropdown showing last 3-4 wishlist items with quick remove. Mirrors the existing cart pattern in `src/modules/cart/`.

---

## 7. Database Schema

### 7.1 wishlist table
| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | text | no | Primary key |
| `created_at` | timestamp | no | Created at |
| `updated_at` | timestamp | no | Updated at |
| `deleted_at` | timestamp | yes | Soft delete |
| `customer_id` | text | yes | FK to customer (null for guest) |
| `guest_id` | text | yes | Anonymous identifier |
| `sales_channel_id` | text | no | FK to sales_channel |
| `metadata` | jsonb | yes | Sharing tokens, preferences |

### 7.2 wishlist_item table
| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | text | no | Primary key |
| `created_at` | timestamp | no | Created at |
| `updated_at` | timestamp | no | Updated at |
| `deleted_at` | timestamp | yes | Soft delete |
| `wishlist_id` | text | no | FK to wishlist |
| `product_variant_id` | text | no | FK to product_variant |
| `metadata` | jsonb | yes | Price-at-save, notes, etc. |

### 7.3 Link tables (auto-generated by `db:sync-links`)
- `wishlist_customer` — wishlist ↔ customer
- `wishlist_product_variant` — wishlist ↔ product variants
- `wishlist_sales_channel` — wishlist ↔ sales channel

---

## 8. API Contract

### 8.1 Create Wishlist
```http
POST /store/customers/me/wishlists
Authorization: Bearer <customer_token>
X-Publishable-Api-Key: <key>

Response 200:
{
  "wishlist": {
    "id": "wish_123",
    "customer_id": "cus_123",
    "sales_channel_id": "sc_123",
    "items": [],
    "created_at": "2026-09-07T..."
  }
}
```

### 8.2 Get Wishlist
```http
GET /store/customers/me/wishlists
Authorization: Bearer <customer_token>

Response 200:
{
  "wishlist": {
    "id": "wish_123",
    "items": [
      {
        "id": "wi_456",
        "product_variant_id": "variant_789",
        "product_variant": {
          "id": "variant_789",
          "title": "Red / M",
          "sku": "TSHIRT-RED-M",
          "product": {
            "id": "prod_123",
            "title": "T-Shirt",
            "thumbnail": "...",
            "images": []
          }
        }
      }
    ]
  }
}
```

### 8.3 Add Item
```http
POST /store/customers/me/wishlists/items
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "variant_id": "variant_789"
}

Response 200:
{
  "wishlist": { /* updated wishlist */ }
}
```

### 8.4 Remove Item
```http
DELETE /store/customers/me/wishlists/items/wi_456
Authorization: Bearer <customer_token>

Response 200:
{
  "wishlist": { /* updated wishlist */ }
}
```

### 8.5 Check if Variant in Wishlist
```http
GET /store/customers/me/wishlists/check?variant_id=variant_789
Authorization: Bearer <customer_token>

Response 200:
{
  "in_wishlist": true
}
```

---

## 9. Storefront Integration Points

### 9.1 Existing Files to Modify
| File | Change |
|------|--------|
| `apps/storefront/src/lib/data/cookies.ts` | Add `getWishlistToken` / `setWishlistToken` |
| `apps/storefront/src/lib/data/products.ts` | No changes needed; wishlist is separate |
| `apps/storefront/src/modules/layout/components/nav/index.tsx` | Add wishlist icon + count badge |
| `apps/storefront/src/app/[countryCode]/(main)/layout.tsx` | Optionally prefetch wishlist count |

### 9.2 New Files to Create
| File | Purpose |
|------|---------|
| `apps/storefront/src/lib/data/wishlist.ts` | Server actions for wishlist CRUD |
| `apps/storefront/src/app/[countryCode]/(main)/wishlist/page.tsx` | Wishlist listing page |
| `apps/storefront/src/modules/wishlist/components/wishlist-icon.tsx` | Heart toggle on PDP/cards |
| `apps/storefront/src/modules/wishlist/components/wishlist-popover.tsx` | Header dropdown (optional) |
| `apps/storefront/src/modules/wishlist/templates/wishlist-page-template.tsx` | Page template |

---

## 10. Alternative: Use Community Plugin

If speed matters more than control, use `@godscodes/medusa-wishlist-plugin`:

```bash
pnpm add @godscodes/medusa-wishlist-plugin
```

```ts
// apps/backend/medusa-config.ts
module.exports = defineConfig({
  // ... existing config
  plugins: [
    { resolve: "@godscodes/medusa-wishlist-plugin", options: {} }
  ]
})
```

Then in the storefront, follow the integration guide:
- Add `lib/data/wishlist.ts` with server actions
- Add `wishlist/page.tsx`
- Add `WishlistIcon` to product components
- Add `useWishlist` hook with React Query

**Caveat**: This plugin is designed for the older Medusa v1 pattern in some docs, but the GitHub repo shows a v2-compatible version. Verify compatibility with Medusa 2.20.1 before committing.

---

## 11. Future Enhancements

Once the core wishlist is live:

1. **Shareable wishlists**: Add a `share_token` column to `wishlist`, expose public `GET /store/wishlists/:share_token` route
2. **Price drop alerts**: Scheduled job comparing current variant prices to prices stored in `wishlist_item.metadata` at save time
3. **Back-in-stock alerts**: Similar scheduled job checking inventory levels
4. **Wishlist to cart**: Bulk “Add all to cart” button on wishlist page
5. **Multiple wishlists**: Rename `Wishlist` to `Wishlist` and add `Wishlist.name` + `Wishlist.is_default` so customers can have “Birthday”, “Home”, etc.
6. **Admin visibility**: Show wishlist counts on product pages in the admin dashboard

---

## 12. Recommended Implementation Order

1. **Backend module + links** — create `Wishlist` and `WishlistItem` models, define links, run migrations
2. **Workflows** — create-wishlist, add-item, remove-item
3. **API routes** — expose store routes under `/store/customers/me/wishlists`
4. **Guest cookie flow** — add guest routes + merge-on-login workflow
5. **Storefront server actions** — `lib/data/wishlist.ts`
6. **Wishlist page** — `/wishlist` route with item list
7. **Product page integration** — heart icon on PDP and product cards
8. **Header integration** — wishlist icon with count in nav
9. **Testing** — guest flow, logged-in flow, merge-on-login, edge cases

---

## 13. Sources

- Medusa Official Wishlist Guide: https://docs.medusajs.com/resources/plugins/guides/wishlist
- Medusa Wishlist Plugin Source: https://github.com/medusajs/medusa/tree/develop/packages/medusa-plugin-wishlist
- Community Plugin: https://github.com/godscodes/medusajs-wishlist-plugin
- Next.js Starter Integration: https://github.com/godscodes/medusajs-wishlist-plugin/blob/main/INTEGRATION.md
- Askantech Wishlist Implementation Guide: https://www.askantech.com/medusa-js-wishlist-feature-implementation/
- Local project structure: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`

---

*Research compiled: 2026-09-07*
*Based on MedusaJS v2.20.1, official docs, and community implementations*
