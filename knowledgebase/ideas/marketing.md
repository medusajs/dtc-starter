# Marketing & Advertising Implementation Research

## 1. Goal
Implement marketing tracking, attribution, and advertising integrations for the MedusaJS installation at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js` while maintaining Medusa’s architecture patterns and keeping the codebase upgrade-safe.

---

## 2. Current State of Marketing in MedusaJS

### 2.1 No Native Google Ads Support
MedusaJS core has **no built-in Google Ads integration**. The marketing plugin ecosystem is limited to:

| Plugin/Tool | Purpose | Status |
|-------------|---------|--------|
| `@variablevic/google-analytics-medusa` | GA4 Measurement Protocol server-side tracking | Active |
| `medentem/klaviyo-medusa` | Klaviyo email marketing + customer sync | Active |
| `@tsc_tech/medusa-plugin-product-seo` | Product/category SEO metadata | Active |
| `medusa-storefront-analytics` | GTM dataLayer adapter for storefronts | Active |

### 2.2 Medusa Analytics Module
Medusa v2.8.3+ includes an **Analytics Module** (`@medusajs/medusa/analytics`) with:
- Provider interface (`track()`, `identify()`)
- Built-in providers: `analytics-local`, `analytics-posthog`
- **Server-side only** — no automatic frontend wiring
- You must call `track()` from workflows/subscribers manually

### 2.3 Feature Request: GTM DataLayer
There is an active feature request for `@medusajs/gtm-datalayer` that would inject GTM snippets and map Medusa events to GA4 dataLayer events. **Not yet implemented.**

---

## 3. Google Ads Integration Strategy

### 3.1 Recommended Architecture: Hybrid Server + Client

Combine server-side reliability with client-side flexibility:

| Layer | Responsibility |
|-------|---------------|
| **Backend subscriber** | Upload purchase conversions to Google Ads API with enhanced conversions |
| **Backend service** | Wrap Google Ads API client, handle auth, retries, deduplication |
| **Storefront GTM** | Push `view_item`, `add_to_cart`, `begin_checkout` events to dataLayer |
| **Admin dashboard** | Show attribution status, conversion logs |

### 3.2 Backend: Google Ads Conversion Service

Create `apps/backend/src/modules/marketing/`:

**models/marketing-attribution.ts**:
```ts
import { model } from "@medusajs/framework/utils"

const MarketingAttribution = model.define("marketing_attribution", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  session_id: model.text(),
  gclid: model.text().nullable(),
  source: model.text().nullable(), // "google_ads"
  medium: model.text().nullable(), // "cpc"
  campaign_id: model.text().nullable(),
  converted: model.boolean().default(false),
  converted_at: model.date().nullable(),
  metadata: model.json().nullable(),
})

export default MarketingAttribution
```

**service.ts** — extends `MedusaService` for CRUD + Google Ads API wrapper methods.

**index.ts**:
```ts
import { Module } from "@medusajs/framework/utils"
import MarketingModuleService from "./service"

export const MARKETING_MODULE = "marketing"

export default Module(MARKETING_MODULE, {
  service: MarketingModuleService,
})
```

### 3.3 GCLID Capture Flow

1. User clicks Google Ad → lands on site with `gclid` in URL
2. Storefront middleware captures `gclid` into httpOnly cookie (30-day expiry)
3. Cookie passes to backend as cart/customer metadata on creation
4. Backend stores attribution and uses it on order placement

**Storefront middleware** (`apps/storefront/src/middleware.ts`):
```ts
export function middleware(request: NextRequest) {
  const gclid = request.nextUrl.searchParams.get("gclid")
  if (gclid) {
    const response = NextResponse.next()
    response.cookies.set("gclid", gclid, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
    })
    return response
  }
}
```

### 3.4 Order Placed Subscriber

Create `apps/backend/src/subscribers/marketing/google-ads-order-placed.ts`:

```ts
export default async function googleAdsOrderPlacedHandler({ data, container }) {
  const orderService = container.resolve(Modules.ORDER)
  const marketingService = container.resolve(MARKETING_MODULE)

  const order = await orderService.retrieveWithTotals(data.id, {
    relations: ["customer", "items", "items.variant", "shipping_address"],
  })

  const attribution = await marketingService.getAttributionForOrder(order.id)
  if (!attribution?.gclid) return

  await marketingService.uploadGoogleAdsConversion({
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
    conversionActionId: process.env.GOOGLE_ADS_CONVERSION_ACTION_ID,
    orderId: `order_${order.id}`,
    value: order.total / 100,
    currency: order.currency_code,
    gclid: attribution.gclid,
    userData: {
      hashedEmail: await sha256(order.customer.email),
      hashedPhone: await sha256(order.customer.phone),
    },
  })
}

export const config = { event: "order.placed" }
```

### 3.5 Google Ads Service Wrapper

```ts
import { GoogleAdsApi } from "google-ads-api"

export class GoogleAdsService {
  private client: GoogleAdsApi

  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    })
  }

  async uploadConversion(payload: ConversionPayload) {
    const customer = this.client.Customer({
      customer_id: payload.customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    })

    return customer.conversionUploads.uploadClickConversions({
      customer_id: payload.customerId,
      conversions: [{
        conversion_action: `customers/${payload.customerId}/conversionActions/${payload.conversionActionId}`,
        conversion_date_time: new Date().toISOString(),
        conversion_value: payload.value,
        currency_code: payload.currency,
        order_id: payload.orderId,
        gclid: payload.gclid,
        user_identifiers: payload.userData,
      }],
      partial_failure: true,
    })
  }
}
```

---

## 4. Storefront Tracking (GTM / GA4)

### 4.1 GTM DataLayer Utility

Create `apps/storefront/src/lib/marketing/gtm.ts`:

```ts
export interface GA4Item {
  item_id: string
  item_name: string
  price: number
  quantity: number
  item_brand?: string
  item_category?: string
  item_variant?: string
  currency?: string
  index?: number
}

export interface GA4EcommerceEvent {
  event: string
  ecommerce: {
    currency?: string
    value?: number
    transaction_id?: string
    tax?: number
    shipping?: number
    coupon?: string
    items?: GA4Item[]
  }
}

export function pushToDataLayer(eventData: GA4EcommerceEvent) {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(eventData)
}

export function trackViewItem(product, currency = "zar") {
  pushToDataLayer({
    event: "view_item",
    ecommerce: { currency, value: product.price, items: [{ item_id: product.id, item_name: product.title, price: product.price, quantity: 1 }] },
  })
}

export function trackAddToCart(product, quantity = 1, currency = "zar") {
  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: { currency, value: product.price * quantity, items: [{ item_id: product.id, item_name: product.title, price: product.price, quantity }] },
  })
}

export function trackPurchase(order, currency = "zar") {
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: order.id,
      value: order.total / 100,
      currency,
      tax: order.tax_total / 100,
      shipping: order.shipping_total / 100,
      items: order.items.map((item, idx) => ({
        item_id: item.variant_id,
        item_name: item.title,
        price: item.unit_price / 100,
        quantity: item.quantity,
        item_category: item.variant?.product?.categories?.[0]?.name,
        index: idx + 1,
      })),
    },
  })
}
```

### 4.2 GTM Snippet Injection

Inject GTM script in `apps/storefront/src/app/[countryCode]/layout.tsx`:

```tsx
{process.env.NEXT_PUBLIC_GTM_ID && (
  <>
    <script
      id="gtm-script-tag"
      async
      src={`https://www.googletagmanager.com/gtm.js?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
    />
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
        style={{ display: "none" }}
      />
    </noscript>
  </>
)}
```

### 4.3 Event Mapping

| Storefront Event | dataLayer Event | Trigger Point |
|-----------------|-----------------|---------------|
| Product list viewed | `view_item_list` | Home, category, collection pages |
| Product viewed | `view_item` | PDP mount |
| Add to cart | `add_to_cart` | Cart add success |
| Begin checkout | `begin_checkout` | Checkout step 1 |
| Add shipping info | `add_shipping_info` | Shipping step |
| Add payment info | `add_payment_info` | Payment step |
| Purchase | `purchase` | Order confirmation |

---

## 5. Google Shopping / Product Feed

### 5.1 Feed API Route

Create `apps/backend/src/api/store/feeds/google-shopping/route.ts`:

```ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService = req.scope.resolve("product")
  const { data: products } = await productService.listProducts(
    { status: "published" },
    { relations: ["variants", "variants.prices", "categories"] }
  )

  const xml = generateGoogleShoppingFeed(products)
  res.setHeader("Content-Type", "application/xml")
  res.send(xml)
}
```

### 5.2 Feed Generation

Generate RSS 2.0 / XML feed conforming to Google Shopping spec:
- `<title>`, `<link>`, `<description>` per product
- `<g:price>` with currency
- `<g:image>`, `<g:brand>`, `<g:category>`
- `<g:availability>` based on inventory
- `<g:condition>` (new/refurbished/used)
- `<g:gtin>` if available in product metadata

### 5.3 Scheduled Job

Create `apps/backend/src/jobs/regenerate-product-feed.ts`:
```ts
export default async function regenerateProductFeed(container) {
  const feedService = container.resolve("feedService")
  await feedService.generateGoogleShoppingFeed()
}

export const config = {
  name: "regenerate-product-feed",
  schedule: "0 0 * * *", // daily at midnight
}
```

---

## 6. Email Marketing Integration

### 6.1 Subscriber Pattern

Create `apps/backend/src/subscribers/marketing/`:

**customer-registered.ts** — trigger welcome email workflow
**order-placed.ts** — trigger order confirmation + upsell campaigns
**cart-abandoned.ts** — trigger recovery email (requires cart timestamp tracking)

### 6.2 Klaviyo Integration

Use `medentem/klaviyo-medusa` plugin or build custom subscriber:
```ts
export default async function orderPlacedHandler({ data, container }) {
  const klaviyoService = container.resolve("klaviyoService")
  const order = await orderService.retrieveWithTotals(data.id)
  await klaviyoService.trackEvent("Placed Order", {
    customer_email: order.customer.email,
    order_id: order.id,
    value: order.total / 100,
    items: order.items,
  })
}
```

---

## 7. SEO / Product Metadata

### 7.1 Product Metadata Fields

Use Medusa’s built-in `metadata` JSON field on products for SEO:
```ts
{
  meta_title: "Product Name | Store Name",
  meta_description: "SEO description...",
  og_image: "https://...",
  canonical_url: "https://..."
}
```

### 7.2 Admin UI Extension

Add SEO fields to product edit page in admin:
- Widget on product detail page
- Save to `product.metadata` via update workflow

### 7.3 Storefront Metadata Injection

Read metadata in storefront PDP and inject into Next.js `metadata` export:
```ts
export async function generateMetadata({ params }) {
  const product = await sdk.store.product.retrieve(params.id)
  return {
    title: product.metadata?.meta_title || product.title,
    description: product.metadata?.meta_description || product.description,
    openGraph: { images: [product.metadata?.og_image || product.thumbnail] },
  }
}
```

---

## 8. Attribution & Analytics Architecture

### 8.1 Backend Module Structure

```
apps/backend/src/modules/marketing/
  models/
    marketing-attribution.ts
  service.ts
  index.ts
```

### 8.2 Service Methods

- `createAttribution(data)` — store gclid, session, source
- `getAttributionForOrder(orderId)` — retrieve attribution linked to order
- `markConverted(orderId)` — mark attribution as converted
- `uploadGoogleAdsConversion(payload)` — call Google Ads API
- `uploadMetaConversion(payload)` — call Meta Conversions API (future)

### 8.3 Workflow: Track Conversion

```ts
export const trackMarketingConversionWorkflow = createWorkflow(
  "track-marketing-conversion",
  function (input: { orderId: string }) {
    const attribution = useQueryGraphStep({
      entity: "marketing_attribution",
      fields: ["*"],
      filters: { order_id: input.orderId },
    })

    const uploaded = transform({ attribution }, (data) => {
      if (!data.attribution.length?.gclid) return null
      return uploadGoogleAdsConversionStep({ ...data.attribution[0] })
    })

    markConvertedStep({ orderId: input.orderId })

    return new WorkflowResponse({ uploaded })
  }
)
```

---

## 9. Environment Variables

```env
# Google Ads API
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_CONVERSION_ACTION_ID=purchase_conversion_action_id

# GTM / GA4 (storefront)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Klaviyo (if using)
KLAVIYO_API_KEY=your_api_key
KLAVIYO_LIST_ID=your_list_id
```

---

## 10. Privacy & Compliance

### 10.1 Consent Requirements
- **EU/UK**: Require cookie consent before setting `gclid` cookie or firing tracking pixels
- **Enhanced Conversions**: Must accept customer data terms in Google Ads UI
- **GDPR**: Hash personal data before sending to Google Ads/Meta APIs

### 10.2 Data Handling

```ts
async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value.toLowerCase().trim())
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")
}
```

### 10.3 GCLID Storage
- Store in httpOnly cookie with 30-day expiry
- Associate with customer session/order
- Delete after conversion upload or expiry
- Never expose in client-side code

---

## 11. Implementation Phases

### Phase 1: Foundation
1. Create `marketing` module with attribution model
2. Add GCLID capture middleware to storefront
3. Create Google Ads service wrapper
4. Create `track-google-ads-conversion` workflow

### Phase 2: Event Subscribers
1. `order.placed` → upload purchase conversion
2. `customer.created` → upload sign-up conversion
3. `cart.updated` → track add_to_cart / remove_from_cart (optional)

### Phase 3: Storefront Tracking
1. Add GTM snippet to `layout.tsx`
2. Create `lib/marketing/gtm.ts` with event helpers
3. Integrate `trackAddToCart` in cart actions
4. Integrate `trackPurchase` on order confirmation
5. Integrate `trackViewItem` on PDP

### Phase 4: Enhanced Conversions
1. Collect email/phone/address in order flow
2. Hash with SHA-256 before sending
3. Include in `userIdentifiers` array in API call
4. Accept customer data terms in Google Ads

### Phase 5: Product Feed
1. Create `/store/feeds/google-shopping` API route
2. Generate XML feed from Medusa products
3. Add scheduled job for daily regeneration
4. Submit feed URL to Google Merchant Center

### Phase 6: Admin Dashboard
1. Add marketing attribution widget to admin
2. Show conversion status per order
3. Add feed management page

---

## 12. Testing Strategy

### 12.1 Google Ads Test Conversions
1. Enable test mode in Google Ads account
2. Use test conversion action ID
3. Verify conversions appear in Google Ads UI within 24h
4. Check for `partial_failure` errors in API response

### 12.2 Validation Checklist
- [ ] `gclid` captured from ad click and stored in cookie
- [ ] `gclid` passed to cart creation as metadata
- [ ] `gclid` associated with order on placement
- [ ] Conversion uploaded within 5 minutes of order
- [ ] Enhanced conversions hashed correctly
- [ ] Deduplication works (same `order_id` not counted twice)
- [ ] Conversions appear in Google Ads UI
- [ ] GA4 ecommerce events fire in parallel
- [ ] Ad blocker fallback works (client-side backup)

---

## 13. Future Enhancements

1. **Meta Pixel Integration**: Extend same subscriber pattern to Meta Conversions API
2. **TikTok/Pinterest Ads**: Add additional ad platform adapters
3. **Customer List Upload**: Upload customer lists for remarketing audiences
4. **Offline Conversion Import**: Import in-store/phone conversions
5. **Attribution Dashboard**: Build internal dashboard showing ad performance
6. **A/B Testing**: Use conversion data to optimize ad spend

---

## 14. Sources

- Google Ads Conversions API: https://developers.google.com/google-ads/api/docs/conversions/overview
- Enhanced Conversions for Web: https://developers.google.com/google-ads/api/docs/conversions/enhanced-conversions/web
- GTM Server-Side Ads Setup: https://developers.google.com/tag-platform/tag-manager/server-side/ads-setup
- Medusa Analytics Module: https://docs.medusajs.com/resources/infrastructure-modules/analytics
- Medusa GTM Feature Request: https://github.com/medusajs/medusa/discussions/14865
- `medusa-storefront-analytics` package: https://www.npmjs.com/package/medusa-storefront-analytics
- Local project context: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`

---

*Research compiled: 2026-09-08*
*Based on MedusaJS v2.20.1, Google Ads API v18, and current marketing integration patterns*
