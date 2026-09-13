# Store and Products

## Overview

This document covers how the storefront displays products across all listing pages, how product cards render, how sorting/filtering/pagination work, and how the archive pattern is reused across store, category, and collection pages.

## Product Card Components

### ProductPreview

**Location**: `src/modules/products/components/product-preview/index.tsx`  
**Type**: Server component (no `"use client"`)  
**Purpose**: The single product card used everywhere in the storefront.

#### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `product` | `HttpTypes.StoreProduct` | Yes | — | Full product object from the Medusa API |
| `region` | `HttpTypes.StoreRegion` | Yes | — | Region context for pricing |
| `isFeatured` | `boolean` | No | `false` | When `true`, uses taller thumbnail aspect ratio |

#### Render Flow

1. Calls `getProductPrice({ product })` to derive the cheapest variant's price.
2. Wraps everything in `<LocalizedClientLink href={`/products/${product.handle}`}>`.
3. Renders `<Thumbnail>` with `thumbnail`, `images`, `size="full"`, and `isFeatured`.
4. Renders title in `<Text className="text-ui-fg-subtle">` with `data-testid="product-title"`.
5. Renders price inline if `cheapestPrice` exists, using `<PreviewPrice>`.

```tsx
// modules/products/components/product-preview/index.tsx
const { cheapestPrice } = getProductPrice({ product })

return (
  <LocalizedClientLink href={`/products/${product.handle}`} className="group">
    <div data-testid="product-wrapper">
      <Thumbnail
        thumbnail={product.thumbnail}
        images={product.images}
        size="full"
        isFeatured={isFeatured}
      />
      <div className="flex txt-compact-medium mt-4 justify-between">
        <Text className="text-ui-fg-subtle" data-testid="product-title">
          {product.title}
        </Text>
        <div className="flex items-center gap-x-2">
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
        </div>
      </div>
    </div>
  </LocalizedClientLink>
)
```

#### Test IDs

| Element | `data-testid` |
|---|---|
| Product wrapper | `product-wrapper` |
| Product title | `product-title` |

### Thumbnail

**Location**: `src/modules/products/components/thumbnail/index.tsx`  
**Type**: Server component

#### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `thumbnail` | `string \| null` | No | — | Primary thumbnail URL |
| `images` | `{ url?: string }[] \| null` | No | — | Additional product images |
| `size` | `"small" \| "medium" \| "large" \| "full" \| "square"` | No | `"full"` | Thumbnail size preset |
| `isFeatured` | `boolean` | No | `false` | Taller aspect ratio for featured rails |
| `className` | `string` | No | — | Additional wrapper classes |
| `data-testid` | `string` | No | — | Test identifier |

#### Aspect Ratio Logic

- `isFeatured=true` → `aspect-[11/14]`
- `isFeatured=false && size !== "square"` → `aspect-[9/16]`
- `size === "square"` → `aspect-[1/1]`

#### Width Classes

| Size | Width |
|---|---|
| `small` | `w-[180px]` |
| `medium` | `w-[290px]` |
| `large` | `w-[440px]` |
| `full` | `w-full` |
| `square` | `w-full` |

Uses `Next/Image` with `fill` for actual images. Falls back to `<PlaceholderImage>` icon if no image URL.

### PreviewPrice

**Location**: `src/modules/products/components/product-preview/price.tsx`  
**Type**: Server component

#### Props

| Prop | Type | Description |
|---|---|---|
| `price` | `VariantPrice` | The priced variant from `getProductPrice()` |

#### Behavior

- If `price.price_type === "sale"`: shows original price with `line-through` + sale price highlighted in `text-ui-fg-interactive`.
- Otherwise: shows `price.calculated_price` in `text-ui-fg-muted`.

## Store Listing Templates

### StoreTemplate

**Location**: `src/modules/store/templates/index.tsx`

#### Props

| Prop | Type | Description |
|---|---|---|
| `sortBy` | `SortOptions` | Current sort value |
| `page` | `string` | Page number from URL |
| `countryCode` | `string` | Two-letter ISO country code |
| `optionValueIds` | `OptionValueIds` | Selected option value IDs |

#### Layout

```tsx
<div className="content-container flex flex-col small:flex-row small:items-start">
  <RefinementList sortBy={sort} />
  <div className="w-full">
    <h1 data-testid="store-page-title">All products</h1>
    <Suspense fallback={<SkeletonProductGrid />}>
      <PaginatedProducts ... />
    </Suspense>
  </div>
</div>
```

- Sidebar: `min-w-[250px]` with `ml-[1.675rem]` offset on `small:` screens.
- Content: `w-full` fills the remaining space.
- Both use `small:flex-row` (≥1024px).

### CategoryTemplate

**Location**: `src/modules/categories/templates/index.tsx`

#### Props

| Prop | Type | Description |
|---|---|---|
| `category` | `HttpTypes.StoreProductCategory` | Resolved category object |
| `sortBy` | `SortOptions` | Current sort value |
| `page` | `string` | Page number from URL |
| `countryCode` | `string` | Two-letter ISO country code |
| `optionValueIds` | `OptionValueIds` | Selected option value IDs |

#### Behavior

- Calls `notFound()` if `!category || !countryCode`.
- Recursively builds a `parents` array via `getParents()` to display breadcrumb-style parent category links.
- Renders parent category links using `<LocalizedClientLink href={`/categories/${parent.handle}`}>` separated by `/`.
- Renders the current category name in `<h1 data-testid="category-page-title">`.
- Renders `category.description` if present.
- Renders `category.category_children` as a list of `<InteractiveLink>` items.
- Renders `<RefinementList sortBy={sort} hideOptionsPicker />` — options picker is **hidden** on category pages.
- Wraps `<PaginatedProducts categoryId={category.id} ... />` in `<Suspense>` with skeleton fallback sized to `category.products?.length ?? 8`.

### CollectionTemplate

**Location**: `src/modules/collections/templates/index.tsx`

#### Props

| Prop | Type | Description |
|---|---|---|
| `sortBy` | `SortOptions` | Current sort value |
| `collection` | `HttpTypes.StoreCollection` | Resolved collection object |
| `page` | `string` | Page number from URL |
| `countryCode` | `string` | Two-letter ISO country code |
| `optionValueIds` | `OptionValueIds` | Selected option value IDs |

#### Behavior

- Very similar to `CategoryTemplate` but simpler.
- Renders `<RefinementList sortBy={sort} hideOptionsPicker />` (no options picker).
- Renders `<h1>{collection.title}</h1>`.
- Suspends with skeleton fallback using `collection.products?.length`.
- Renders `<PaginatedProducts collectionId={collection.id} ... />`.

## PaginatedProducts (Async Server)

**Location**: `src/modules/store/templates/paginated-products.tsx`

This is a **Server Component** that handles the actual product data fetching and pagination.

#### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `sortBy` | `SortOptions` | No | Sort order |
| `page` | `number` | Yes | Page number (1-indexed) |
| `collectionId` | `string` | No | Filter by collection ID |
| `categoryId` | `string` | No | Filter by category ID |
| `productsIds` | `string[]` | No | Explicit list of product IDs |
| `countryCode` | `string` | Yes | Two-letter ISO country code |
| `optionValueIds` | `OptionValueIds` | No | Selected option value IDs |

#### Query Params Built

```ts
const queryParams: PaginatedProductsParams = {
  limit: 12,
}
if (collectionId) queryParams["collection_id"] = [collectionId]
if (categoryId)   queryParams["category_id"]   = [categoryId]
if (productsIds)  queryParams["id"]            = productsIds
if (sortBy === "created_at") queryParams["order"] = "created_at"
```

#### Grid

```tsx
<ul
  className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
  data-testid="products-list"
>
```

#### Pagination

Rendered only when `totalPages > 1`. `totalPages = Math.ceil(count / PRODUCT_LIMIT)` where `PRODUCT_LIMIT = 12`.

## Data Layer

### `listProducts`

**Location**: `src/lib/data/products.ts`

Server action. Fetches products from the Medusa Store API with pagination.

#### Signature

```ts
export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
})
```

#### Behavior

1. Requires either `countryCode` or `regionId`.
2. Computes `limit` (default 12) and `offset = (pageParam - 1) * limit`.
3. Resolves region via `getRegion(countryCode)` or `retrieveRegion(regionId)`.
4. Calls `sdk.client.fetch("/store/products", { query: { limit, offset, region_id, fields: "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,+metadata,+tags,", ...queryParams } })`.
5. Uses `getCacheOptions("products")` and `getAuthHeaders()`.
6. Returns `{ response: { products, count }, nextPage, queryParams }` where `nextPage = count > offset + limit ? pageParam + 1 : null`.

#### Default Fields

The `fields` query param controls which fields are returned:
```
*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,+metadata,+tags,
```

- `*variants.calculated_price` — variant prices (required for price display)
- `+variants.inventory_quantity` — inventory levels
- `*variants.images` — variant-specific images
- `*variants.options` — variant option values
- `+metadata` — product metadata
- `+tags` — product tags

### `listProductsWithSort`

**Location**: `src/lib/data/products.ts`

Server action. Over-fetches 100 products, sorts in-memory, and paginates client-side.

#### Signature

```ts
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
})
```

#### Behavior

1. Always fetches **100 products** (overrides `queryParams.limit` to 100).
2. Applies `option_value_id` filter if `optionValueIds` is provided.
3. Calls `sortProducts(products, sortBy)` **in-memory**.
4. Paginates client-side: `pageParam = (page - 1) * limit`, then `sortedProducts.slice(pageParam, pageParam + limit)`.
5. Returns `{ response: { products: paginatedProducts, count: filteredCount }, nextPage, queryParams }`.
6. **Critical detail:** `count` here is `filteredCount` (i.e., `products.length` after fetching 100), NOT the total from the API. This means pagination stops at 100 results max.

### `sortProducts`

**Location**: `src/lib/util/sort-products.ts`

In-memory sort function used exclusively by `listProductsWithSort`.

#### Signature

```ts
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[]
```

#### Behavior

- For `price_asc` / `price_desc`:
  - Precomputes `_minPrice` on each product: `Math.min(...variants.map(v => v.calculated_price.calculated_amount || 0))`.
  - If no variants → `_minPrice = Infinity`.
  - Sorts ascending if `price_asc`, descending if `price_desc`.
- For `created_at`:
  - Sorts by `new Date(b.created_at).getTime() - new Date(a.created_at).getTime()` (newest first).
- Returns the mutated (sorted) array.

> Note: The comment in the source says "until the store API supports sorting by price" — this is a workaround because the Medusa store API does not natively sort by `calculated_price`.

## Categories Data Layer

### `listCategories`

**Location**: `src/lib/data/categories.ts`

```ts
export const listCategories = async (query?: Record<string, unknown>)
```

- Calls `sdk.client.fetch("/store/product-categories", { query: { fields: "*category_children, *products, *parent_category, *parent_category.parent_category", limit: query?.limit || 100, ...query } })`.
- Uses `getCacheOptions("categories")`.
- Returns `product_categories[]`.

Default fields fetch the full category tree including children, products, and parent chain.

### `getCategoryByHandle`

**Location**: `src/lib/data/categories.ts`

```ts
export const getCategoryByHandle = async (categoryHandle: string[])
```

- Joins the handle array with `/`: `handle = categoryHandle.join("/")`.
- Calls `sdk.client.fetch("/store/product-categories", { query: { fields: "*category_children, *products", handle } })`.
- Returns `product_categories[0]` (the first matching category).

Supports nested category paths like `["clothing", "t-shirts"]`.

## Collections Data Layer

**Location**: `src/lib/data/collections.ts`

### `listCollections`

```ts
export const listCollections = async (queryParams: Record<string, string> = {})
```

- Defaults `limit` to `"100"` and `offset` to `"0"`.
- Calls `sdk.client.fetch("/store/collections", { query: queryParams })`.
- Returns `{ collections, count: collections.length }` (count is derived from the fetched array, NOT from the API response count field).

### `retrieveCollection`

```ts
export const retrieveCollection = async (id: string)
```

- Calls `sdk.client.fetch("/store/collections/${id}")`.
- Returns `collection`.

### `getCollectionByHandle`

```ts
export const getCollectionByHandle = async (handle: string)
```

- Calls `sdk.client.fetch("/store/collections", { query: { handle, fields: "*products" } })`.
- Returns `collections[0] || null`.

## Refinement Components

### RefinementList

**Location**: `src/modules/store/components/refinement-list/index.tsx`

Client component that manages URL state for sorting and filtering.

#### Props

| Prop | Type | Description |
|---|---|---|
| `sortBy` | `SortOptions` | Current sort value |
| `search` | `boolean` | Show search input (not used in current templates — dead prop) |
| `hideOptionsPicker` | `boolean` | Hide the option value filter |
| `data-testid` | `string` | Test identifier |

#### Query Param Management

Uses `useSearchParams` + `router.push` via `updateQueryParams`:
- `setQueryParams(name, value)` — sets a single param, deletes `page`.
- `setOptionValueIds(valueIds)` — deletes `optionValueIds` and appends new values.
- All updates construct a new `URLSearchParams`, delete `page`, and call `router.push` only when the resulting URL differs from the current one, which triggers a server re-render.

#### Layout

```tsx
<div className="flex flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
  <SortProducts ... />
  {!hideOptionsPicker && <OptionsPicker ... />}
</div>
```

### SortProducts

**Location**: `src/modules/store/components/refinement-list/sort-products/index.tsx`

- Renders a `<FilterRadioGroup>` with radio buttons for sort options: `created_at` (default), `price_asc`, `price_desc`.
- Calls `setQueryParams("sortBy", value)` on change.

### OptionsPicker

**Location**: `src/modules/store/components/refinement-list/options-picker/index.tsx`

- Renders option value filters (e.g., Size: S/M/L/XL, Color: Black/White).
- Fetches available options from the `/store/product-options` API endpoint (`is_exclusive: false, fields: "*values"`).
- Calls `setOptionValueIds` on selection.

### Pagination

**Location**: `src/modules/store/components/pagination/index.tsx`

- Renders page number buttons. Current page is highlighted and disabled.
- On click, creates a new `URLSearchParams`, sets `page` to the clicked number, and calls `router.push` with the updated query string.
- `page` prop is 1-indexed.
- Smart ellipsis logic:
  - `totalPages <= 7`: shows all pages.
  - `page <= 4`: shows pages 1–5 + ellipsis + last page.
  - `page >= totalPages - 3`: shows page 1 + ellipsis + last 4 pages.
  - Otherwise: shows page 1 + ellipsis + (page-1, page, page+1) + ellipsis + last page.

## Product Option Filters

**Location**: `src/lib/util/product-option-filters.ts`

```ts
export const OPTION_VALUE_QUERY_KEY = "optionValueIds"
export type OptionValueIds = string[]

export const parseOptionValueIds = (
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): OptionValueIds => {
  if (typeof (searchParams as URLSearchParams).getAll === "function") {
    const values = (searchParams as URLSearchParams).getAll(OPTION_VALUE_QUERY_KEY)
    return Array.from(new Set(values.filter(Boolean)))
  }

  const paramValue = (
    searchParams as Record<string, string | string[] | undefined>
  )[OPTION_VALUE_QUERY_KEY]

  if (Array.isArray(paramValue)) {
    return Array.from(new Set(paramValue.filter(Boolean)))
  }

  if (typeof paramValue === "string" && paramValue.length > 0) {
    return paramValue.split(",").filter(Boolean)
  }

  return []
}
```

Both `<RefinementList>` (writer) and `parseOptionValueIds` (reader) use the same constant, so the URL contract is consistent.

## Featured Products and Product Rails

### FeaturedProducts (Module)

**Location**: `src/modules/home/components/featured-products/index.tsx`

Server component that takes `{ collections: HttpTypes.StoreCollection[]; region: HttpTypes.StoreRegion }` and maps each collection to a `<ProductRail>`.

### ProductRail

**Location**: `src/modules/home/components/featured-products/product-rail/index.tsx`

Server component that renders a horizontal scroll of products for a single collection.

#### Behavior

1. Calls **`listProducts()`** (NOT `listProductsWithSort`) with `queryParams: { collection_id: collection.id, fields: "*variants.calculated_price" }`.
2. Renders a section with:
   - Collection title (`<Text className="txt-xlarge">{collection.title}</Text>`)
   - A `<InteractiveLink href={`/collections/${collection.handle}`}>View all</InteractiveLink>`
   - A `<ul>` grid (`grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-24 small:gap-y-36`) mapping products to `<ProductPreview product={product} region={region} isFeatured />`.
3. **No pagination**, **no sort controls**, **no options picker**.

### Homepage

**Location**: `src/app/[countryCode]/(main)/page.tsx`

- Fetches all collections with `fields: "id, handle, title"` (no products prefetched).
- Fetches region.
- Renders `<Hero />`, `<CategoryBarCarousel />`, then `<FeaturedProducts collections={collections} region={region} />`.

## Related Products (PDP)

**Location**: `src/modules/products/components/related-products/index.tsx`

Server component rendered below the main product content on the product detail page.

#### Props

| Prop | Type | Description |
|---|---|---|
| `product` | `HttpTypes.StoreProduct` | Current product |
| `countryCode` | `string` | Two-letter ISO country code |

#### Logic

1. Gets region via `getRegion(countryCode)`.
2. Builds `queryParams`:
   - `region_id: region.id`
   - `collection_id: [product.collection_id]` if the product has a collection
   - `tag_id: product.tags.map(t => t.id).filter(Boolean)` if the product has tags
   - `is_giftcard: false`
3. Calls `listProducts({ queryParams, countryCode })` (NOT `listProductsWithSort`).
4. Filters out the current product: `response.products.filter(p => p.id !== product.id)`.
5. Returns `null` if no related products.
6. Renders a `<div>` with heading "Related products" + subtext + a grid of `<ProductPreview>` cards.

#### Test IDs

| Element | `data-testid` |
|---|---|
| Related products container | `related-products-container` |

## Archive Pattern Summary

The archive pattern is used on three pages: **store**, **category**, and **collection**. Each follows this structure:

```
Page (Server Component)
  ├── CategoryBarCarousel (Client Component, from common)
  └── Template (Server Component)
       ├── RefinementList (Client Component sidebar)
       │    ├── SortProducts (Client Component)
       │    └── OptionsPicker (Client Component, hidden on category/collection)
       └── Suspense
            └── PaginatedProducts (Server Component)
                 ├── listProductsWithSort (fetches 100, sorts client-side, paginates)
                 ├── <ul> grid of <ProductPreview /> (Server Components)
                 └── Pagination (Client Component, URL-driven)
```

### Key Shared Patterns

- **URL-driven state**: `sortBy`, `page`, `optionValueIds` are all URL search params.
- **`listProductsWithSort`** is the canonical data-fetching function for all archive grids — it fetches 100, sorts in-memory, and slices for pagination.
- **`ProductPreview`** is the single product card used everywhere (store, category, collection, related products, product rail). The only difference is the `isFeatured` flag which changes thumbnail aspect ratio.
- **`ProductRail`** is a "mini-archive" for a single collection on the homepage, using `listProducts` (no sort, no pagination).
- **Region is always resolved from `countryCode`** via `getRegion()` before any product fetch.
- **Suspense boundaries** wrap `PaginatedProducts` and `RelatedProducts` with skeleton fallbacks.
- **`data-testid`** attributes are used consistently for testing.

## Product Detail Page (PDP)

**Route**: `src/app/[countryCode]/(main)/products/[handle]/page.tsx`

The PDP is the most complex product page. It uses a **3-column sticky layout** on desktop, variant-driven image swapping, a mobile-only fixed bottom bar with a full-screen option picker dialog, and a related-products section at the bottom.

### Page Component (Server)

`app/[countryCode]/(main)/products/[handle]/page.tsx`:

1. `generateStaticParams()` pre-builds every `{countryCode, handle}` combination at build time. It calls `listProducts({ countryCode: country, queryParams: { limit: 100, fields: "handle" } })` for every country to discover handles.
2. `generateMetadata()` fetches the product by handle and sets SEO metadata.
3. The default export:
   - Awaits `params` and `searchParams` (Next.js 15 async params).
   - Reads `searchParams.v_id` (selected variant ID).
   - Calls `listProducts({ countryCode: params.countryCode, queryParams: { handle: params.handle } })` to get the priced product.
   - Calls `getImagesForVariant(pricedProduct, selectedVariantId)` to filter images.
   - Renders `<ProductTemplate>` with `product`, `region`, `countryCode`, `images`.

`v_id` is the only query param the PDP cares about. It is written by `ProductActions` and read here to swap the gallery images.

### `getImagesForVariant` Logic

```ts
function getImagesForVariant(product, selectedVariantId?) {
  if (!selectedVariantId || !product.variants) return product.images

  const variant = product.variants.find(v => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) return product.images

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}
```

- If no variant is selected (or the variant has no images), all product images are shown.
- If a variant has images, only those images are shown.
- Returns `null` if the filter yields no images — the page component passes `images ?? []`.

### ProductTemplate Layout (Server)

`modules/products/templates/index.tsx` — a **3-column flex layout** on `small:` breakpoint (1024px):

```
┌──────────────────────────────────────────────────────────────────┐
│ content-container flex flex-col small:flex-row small:items-start │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│  │ ProductInfo  │  │   ImageGallery   │  │ ProductTabs         │ │
│  │ (sticky     │  │   (scrolls      │  │ (sticky top-48     │ │
│  │  top-48,   │  │    naturally)   │  │  max-w-[300px])     │ │
│  │  max-w-300)│  │                  │  │                     │ │
│  └─────────────┘  └──────────────────┘  └─────────────────────┘ │
│                                                                  │
│  RelatedProducts (full width below)                              │
└──────────────────────────────────────────────────────────────────┘
```

- **Left column** (`max-w-[300px] sticky top-48`): `ProductInfo` + `ProductTabs`. Stays visible while the user scrolls the gallery.
- **Center column** (`w-full`): `ImageGallery`. Natural scroll height.
- **Right column** (`max-w-[300px] sticky top-48`): `ProductOnboardingCta` + `ProductActionsWrapper` inside a `<Suspense>`.

Both side columns are `sticky top-48` (96px top offset, matching the header height). The `small:flex-row` breakpoint is `1024px` (defined in `tailwind.config.js` as `small`).

### ProductActionsWrapper (Server → Client Bridge)

`modules/products/templates/product-actions-wrapper/index.tsx`:

This is the only server component in the PDP's interactive area. Its job is to:
1. Fetch the product with real-time pricing via `listProducts({ queryParams: { id: [id] }, regionId })` (server-side data fetch).
2. Pass the fetched `product` and `region` to the client `ProductActions`.
3. Wrap `ProductActions` in a `<Suspense>` boundary in `ProductTemplate` with a disabled skeleton fallback.

This pattern keeps the product data fetch out of the client bundle while still allowing the client component to manage variant selection state.

### ProductActions (Client)

`modules/products/components/product-actions/index.tsx` — 199 lines. Owns all variant selection state:

#### State
- `options: Record<string, string | undefined>` — currently selected option values, keyed by option ID.
- `isAdding: boolean` — loading state during `addToCart`.

#### Preselect single-variant products
If `product.variants.length === 1`, a `useEffect` auto-populates `options` from that variant's options on mount.

#### Variant matching
`selectedVariant` is derived via `useMemo` by finding the variant whose options match `options` exactly. The helper `optionsAsKeymap` converts each variant's `options` array into a `Record<option_id, value>`, then `isEqual` compares that keymap to the current `options` state.

`isValidVariant` is derived via `useMemo` by checking if ANY variant matches the current `options` state. If no combination of selected options corresponds to an existing variant, the "Add to cart" button shows "Out of stock".

#### URL sync
A `useEffect` watches `selectedVariant` and `isValidVariant`. When the selected variant changes:
1. If `v_id` in URL already matches → no-op.
2. If a valid variant is selected → `params.set("v_id", value)` then `router.replace(pathname + "?" + params.toString())`.
3. If no valid variant → `params.delete("v_id")`.

This is the mechanism that triggers `getImagesForVariant` on the server on the next navigation/render.

#### Stock check
`inStock` is derived from the selected variant:
- `manage_inventory === false` → always in stock.
- `allow_backorder === true` → in stock.
- `manage_inventory === true` and `inventory_quantity > 0` → in stock.
- Otherwise → out of stock.

#### Add to cart
`handleAddToCart` calls `addToCart({ variantId, quantity: 1, countryCode })` from `@lib/data/cart`.

#### Button states

| Condition | Button text |
|---|---|
| No variant selected | "Select variant" |
| Out of stock or invalid | "Out of stock" |
| Adding | isLoading spinner |
| Ready | "Add to cart" |

### OptionSelect (Client)

`modules/products/components/product-actions/option-select.tsx` — renders a single option group (e.g., "Size" or "Color"). Uses custom `<button>` elements with `clx` styling. Calls `updateOption(optionId, value)` on selection.

### MobileActions (Client)

`modules/products/components/product-actions/mobile-actions.tsx` — 203 lines. Shows a **fixed bottom bar** on mobile (`lg:hidden`) only when the desktop `ProductActions` is out of view.

#### Intersection observer pattern
`ProductActions` passes `show={!inView}` where `inView` comes from `useIntersection(actionsRef, "0px")`. When the desktop actions scroll out of view, `show` becomes `true` and the mobile bar appears.

#### Mobile bottom bar
- Fixed `inset-x-0 bottom-0 z-50`.
- Shows thumbnail, title, price, and an "Add to cart" / "Select variant" button.
- Clicking the button opens a `@headlessui/react` Dialog (`useToggleState`).

#### Mobile Dialog
The dialog renders the same `OptionSelect` components as desktop, plus the `Add to cart` button. This gives mobile users a full-screen option picker without the sticky-column layout.

### ProductTabs (Client)

`modules/products/components/product-tabs/index.tsx` — uses Radix `Accordion` (type `"multiple"`, all open by default). Two panels:
- **Product information** — renders structured metadata: Material, Country of origin, Type, Weight, Dimensions.
- **Shipping & returns** — static text about shipping policy.

### RelatedProducts (Server)

`modules/products/components/related-products/index.tsx` — async server component. Fetches products by:
1. Same `collection_id` as the current product.
2. Same `tag_id` as the current product.
3. Excludes the current product by ID.
4. Region-scoped via `regionId`.

Renders a `ProductRail` grid (same pattern as the home page). Wrapped in `<Suspense>` with `<SkeletonRelatedProducts />`.

### ImageGallery (Client)

`modules/products/components/image-gallery/index.tsx` — renders the product images. Receives `images` as a prop (already filtered by `getImagesForVariant`). Shows the first image as the main thumbnail and the rest as a scrollable row below.

### ProductInfo (Server)

`modules/products/templates/product-info/index.tsx` — renders the product title, subtitle, and basic metadata. Server component, no client state.

### PDP Key Patterns

#### Server/Client Split

The PDP uses the **server-as-possible** pattern:
- `page.tsx` is a server component that fetches the product and region.
- `ProductTemplate` is a server component that composes the layout.
- `ProductInfo` is a server component.
- `RelatedProducts` is a server component.
- `ProductActionsWrapper` is a server component that fetches variants and wraps the client component.
- `ProductActions`, `ImageGallery`, `ProductTabs`, `MobileActions`, `OptionSelect` are client components.

#### Variant Selection Flow

```
User clicks option button
  → setOptionValue(optionId, value)
    → options state updates
      → selectedVariant recalculated (useMemo)
        → isValidVariant recalculated (useMemo)
          → useEffect fires: router.replace("?v_id=<id>")
            → Next.js re-renders page.tsx with new searchParams
              → getImagesForVariant returns variant-specific images
                → ImageGallery re-renders with new images
                  → Add to cart button enables
```

#### `v_id` Query Param Contract

| Param | Source | Consumer | Purpose |
|---|---|---|---|
| `v_id` | `ProductActions` writes via `router.replace` | `page.tsx` reads via `searchParams.v_id` | Drives `getImagesForVariant` image filtering |

`v_id` is not a "real" route param — it's a client-side URL state that causes the server to re-render with different images. This is the same pattern used by `sortBy`, `page`, and `optionValueIds` in the listing pages.

#### Sticky Layout Constraints

Both side columns use `sticky top-48` (96px top offset, matching the header height). The `small:flex-row` breakpoint is `1024px`.

### PDP Data-Test IDs

| Element | `data-testid` |
|---|---|
| Product container | `product-container` |
| Add to cart button | `add-product-button` |
| Option select group | `product-options` |
| Related products container | `related-products-container` |

## Data-Test IDs

| Element | `data-testid` |
|---|---|
| Store/category container | `category-container` |
| Store page title | `store-page-title` |
| Products list | `products-list` |
| Pagination | `product-pagination` |
| Sort by container | `sort-by-container` |
| Sort by link | `sort-by-link` |
| Category page title | `category-page-title` |
| Related products container | `related-products-container` |
| Product wrapper | `product-wrapper` |
| Product title | `product-title` |

## Cache Strategy

- **Force-cache** for regions (1 hour TTL).
- **Force-cache with tags** for products, carts, customers, orders, collections, categories.
- Tags are scoped by `_medusa_cache_id` cookie.
- After mutations, `revalidateTag(getCacheTag("carts"))` etc. invalidates the cache.

## Common Gotchas

- **Sort happens client-side** because the Medusa Store API does not sort by `calculated_price`. `listProductsWithSort` over-fetches up to 100 products; if a store has more than 100 products, only the first 100 (alphabetical/insertion order) are sortable.
- **Page resets on any change** — encoded in the unconditional `params.delete("page")` in `<RefinementList>`. Removing this line would mean a user on page 5 changing the sort would land on an empty page 5.
- **`parseOptionValueIds` accepts two shapes** — `URLSearchParams` (which `.getAll()` works on) **or** a plain record. The `getAll` duck-type is fragile but works because `URLSearchParams.getAll` is the function form and records don't have it.
- **`<RefinementList>` has a `search?: boolean` prop that's never used** — it's declared and not implemented. If you add a search-specific refinement list, wire this prop (or replace it with a dedicated `<SearchRefinementList>`).
- **No `search` page** — there is no `/search` route, no search input in the nav, no Algolia/Meilisearch provider. `@types/react-instantsearch-dom` is declared in devDependencies but the `react-instantsearch` runtime is not installed. `@medusajs/search` is a Medusa built-in module that indexes products in the backend but has no storefront UI by default.
- **The `category_id` and `collection_id` filters are passed as single-element arrays** (`[categoryId]` / `[collectionId]`) because the Medusa Store API expects repeatable query params, even though only one ID is ever passed in this codebase.
- **`ProductPreview` is a Server Component** — it cannot use hooks or browser APIs. If you need interactive behavior (e.g. quick-view modal), wrap it in a client wrapper.
- **`listProductsWithSort` count is filteredCount, not total** — the `count` returned is the number of products fetched (capped at 100), not the total matching products in the database. This means pagination stops at 100 results max for any sorted/filtered query.
