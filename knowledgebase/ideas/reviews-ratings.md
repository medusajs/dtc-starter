# Reviews & Ratings Implementation Research

## 1. Goal
Add a product reviews and ratings system to the MedusaJS installation at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`. The implementation should follow Medusa’s module/link/workflow architecture, support moderation, verified-purchase detection, and integrate with the Next.js storefront.

---

## 2. Why Build a Custom Reviews Module

MedusaJS has **no built-in review or rating system**. While third-party review platforms (Yotpo, Stamped, Judge.me) exist, a custom module gives you:
- Full control over data model and moderation workflow
- No external SaaS dependency or per-order fees
- Native integration with Medusa’s customer, product, and order modules
- Ability to add custom fields (photos, helpful votes, seller response)
- Server-side aggregation for SEO-rich snippets

---

## 3. Data Model

### 3.1 Review Entity

Create `apps/backend/src/modules/review/`:

**models/review.ts**:
```ts
import { model } from "@medusajs/framework/utils"

const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text().indexed(),
  customer_id: model.text().nullable().indexed(),
  rating: model.number().integer(),
  title: model.text().nullable(),
  content: model.text().nullable(),
  status: model.text().default("pending"),
  is_verified_purchase: model.boolean().default(false),
  helpful_count: model.number().integer().default(0),
  metadata: model.json().nullable(),
})

export default Review
```

**Fields explained:**
- `product_id` — links to a Medusa `Product` via module link (not FK)
- `customer_id` — links to Medusa `Customer`; nullable for guest reviews
- `rating` — 1–5 integer
- `status` — `pending` | `approved` | `rejected` | `spam`
- `is_verified_purchase` — set by workflow based on order history
- `helpful_count` — simple upvote counter
- `metadata` — flexible object for photos, vendor responses, etc.

### 3.2 ReviewImage Entity (Optional)

For photo reviews:
```ts
const ReviewImage = model.define("review_image", {
  id: model.id().primaryKey(),
  review_id: model.text().indexed(),
  url: model.text(),
  alt: model.text().nullable(),
  sort_order: model.number().integer().default(0),
})
```

---

## 4. Module Structure

```
apps/backend/src/modules/review/
  models/
    review.ts
    review-image.ts
  service.ts
  index.ts
```

**service.ts**:
```ts
import { MedusaService } from "@medusajs/framework/utils"
import Review from "./models/review"
import ReviewImage from "./models/review-image"

export default class ReviewModuleService extends MedusaService({
  Review,
  ReviewImage,
}) {}
```

**index.ts**:
```ts
import { Module } from "@medusajs/framework/utils"
import ReviewModuleService from "./service"

export const REVIEW_MODULE = "review"

export default Module(REVIEW_MODULE, {
  service: ReviewModuleService,
})
```

**Register in `medusa-config.ts`**:
```ts
module.exports = defineConfig({
  // ... existing config
  modules: [
    { resolve: "./src/modules/review" },
  ],
})
```

**Generate migrations**:
```bash
pnpm exec medusa db:generate review
pnpm exec medusa db:migrate
```

---

## 5. Module Links

### 5.1 Link Review to Product

`apps/backend/src/links/review-product.ts`:
```ts
import { defineLink } from "@medusajs/framework/utils"
import ReviewModule from "../modules/review"
import ProductModule from "@medusajs/medusa/product"

export default defineLink(
  { linkable: ReviewModule.linkable.review, isList: false },
  { linkable: ProductModule.linkable.product.id, isList: true }
)
```

### 5.2 Link Review to Customer

`apps/backend/src/links/review-customer.ts`:
```ts
import { defineLink } from "@medusajs/framework/utils"
import ReviewModule from "../modules/review"
import CustomerModule from "@medusajs/medusa/customer"

export default defineLink(
  { linkable: ReviewModule.linkable.review, isList: false },
  { linkable: CustomerModule.linkable.customer.id, isList: true }
)
```

**Sync links**:
```bash
pnpm exec medusa db:sync-links
```

---

## 6. Workflows

All mutations go through workflows. Create `apps/backend/src/workflows/review/`.

### 6.1 Create Review

**steps/create-review.ts**:
```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import ReviewModuleService from "../../modules/review/service"

export const createReviewStep = createStep(
  "create-review",
  async (input: { product_id: string; customer_id?: string; rating: number; title?: string; content?: string }) => {
    const reviewService = ReviewModuleService as ReviewModuleService
    const review = await reviewService.createReviews({
      product_id: input.product_id,
      customer_id: input.customer_id,
      rating: input.rating,
      title: input.title,
      content: input.content,
      status: "pending",
    })

    return new StepResponse(review, review.id)
  }
)
```

**index.ts**:
```ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createReviewStep } from "./steps/create-review"

export const createReviewWorkflow = createWorkflow(
  "create-review",
  (input: { product_id: string; customer_id?: string; rating: number; title?: string; content?: string }) => {
    const review = createReviewStep(input)
    return new WorkflowResponse({ review })
  }
)
```

### 6.2 Approve Review

**steps/approve-review.ts**:
```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import ReviewModuleService from "../../modules/review/service"

export const approveReviewStep = createStep(
  "approve-review",
  async (input: { review_id: string }) => {
    const reviewService = ReviewModuleService as ReviewModuleService
    const review = await reviewService.updateReviews(input.review_id, { status: "approved" })
    return new StepResponse(review, review.id)
  }
)
```

### 6.3 Delete Review

**steps/delete-review.ts**:
```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import ReviewModuleService from "../../modules/review/service"

export const deleteReviewStep = createStep(
  "delete-review",
  async (input: { review_id: string }) => {
    const reviewService = ReviewModuleService as ReviewModuleService
    await reviewService.deleteReviews(input.review_id)
    return new StepResponse(undefined, input.review_id)
  }
)
```

---

## 7. Verified Purchase Detection

### 7.1 Approach
When a customer submits a review, check if they have a completed order containing the product.

**Subscriber: `apps/backend/src/subscribers/review/check-verified-purchase.ts`**:
```ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ReviewModuleService } from "../modules/review/service"

export default async function checkVerifiedPurchase({ event, container }: SubscriberArgs) {
  const reviewService = container.resolve(ReviewModuleService)
  const review = event.data

  if (!review.customer_id) return

  const orderService = container.resolve("order")
  const { data: orders } = await orderService.listOrders(
    { customer_id: review.customer_id, status: "completed" },
    { relations: ["items"] }
  )

  const hasPurchased = orders.some(order =>
    order.items?.some(item => item.product_id === review.product_id)
  )

  if (hasPurchased) {
    await reviewService.updateReviews(review.id, { is_verified_purchase: true })
  }
}
```

**Register in `medusa-config.ts`**:
```ts
module.exports = defineConfig({
  // ... existing config
  subscribers: [
    "src/subscribers/review/check-verified-purchase",
  ],
})
```

### 7.2 Alternative: Set at Submission Time
Pass `is_verified_purchase` as a computed field in the `create-review` workflow by querying the customer’s order history before creating the review.

---

## 8. Store API Routes

File-based routing under `apps/backend/src/api/`.

### 8.1 Middleware

`apps/backend/src/api/middlewares.ts` (if not already present):
```ts
import { defineMiddlewares, authenticate } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/reviews/*",
      middlewares: [authenticate("customer", ["session", "bearer"], { allowUnregistered: true })],
    },
  ],
})
```

### 8.2 List Reviews for a Product

`apps/backend/src/api/store/products/[id]/reviews/route.ts`:
```ts
import { defineRoute } from "@medusajs/framework/http"
import { ReviewModuleService } from "../../../../../../modules/review/service"

export const GET = defineRoute(({ params }) => {
  const reviewService = ReviewModuleService as ReviewModuleService
  const reviews = reviewService.listReviews({
    product_id: params.id,
    status: "approved",
  })

  return new Response(JSON.stringify({ reviews }))
})
```

### 8.3 Create Review

`apps/backend/src/api/store/reviews/route.ts`:
```ts
import { defineRoute } from "@medusajs/framework/http"
import ReviewModuleService from "../../../../modules/review/service"
import { createReviewWorkflow } from "../../../../workflows/review"

export const POST = defineRoute(({ params, body, user }) => {
  const reviewService = ReviewModuleService as ReviewModuleService
  const workflow = createReviewWorkflow(user.container)

  const { result } = workflow.run({
    product_id: body.product_id,
    customer_id: user.customerId,
    rating: body.rating,
    title: body.title,
    content: body.content,
  })

  return new Response(JSON.stringify({ review: result.review }))
})
```

---

## 9. Admin API Routes

### 9.1 List All Reviews (with filters)

`apps/backend/src/api/admin/reviews/route.ts`:
```ts
import { defineRoute } from "@medusajs/framework/http"
import { ReviewModuleService } from "../../../../modules/review/service"

export const GET = defineRoute(({ params, query }) => {
  const reviewService = ReviewModuleService as ReviewModuleService
  const reviews = reviewService.listReviews({
    status: query.status,
    product_id: query.product_id,
    customer_id: query.customer_id,
  })

  return new Response(JSON.stringify({ reviews }))
})
```

### 9.2 Approve/Reject Review

`apps/backend/src/api/admin/reviews/[id]/approve/route.ts`:
```ts
import { defineRoute } from "@medusajs/framework/http"
import { approveReviewWorkflow } from "../../../../workflows/review"

export const POST = defineRoute(({ params, user }) => {
  const workflow = approveReviewWorkflow(user.container)
  const { result } = workflow.run({ review_id: params.id, status: body.status })

  return new Response(JSON.stringify({ review: result.review }))
})
```

### 9.3 Delete Review

`apps/backend/src/api/admin/reviews/[id]/route.ts`:
```ts
import { defineRoute } from "@medusajs/framework/http"
import { deleteReviewWorkflow } from "../../../../workflows/review"

export const DELETE = defineRoute(({ params, user }) => {
  const workflow = deleteReviewWorkflow(user.container)
  workflow.run({ review_id: params.id })

  return new Response(JSON.stringify({ success: true }))
})
```

---

## 10. Aggregation Subscriber

Keep product rating aggregates in the `Product` module’s `metadata` or a dedicated `review_aggregate` table.

**Subscriber: `apps/backend/src/subscribers/review/update-aggregate.ts`**:
```ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function updateReviewAggregate({ event, container }: SubscriberArgs) {
  const review = event.data
  const productId = review.product_id

  const reviewService = container.resolve("reviewModuleService")
  const productService = container.resolve("product")

  const { data: reviews } = await reviewService.listReviews({
    product_id: productId,
    status: "approved",
  })

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const count = reviews.length

  await productService.updateProducts(productId, {
    metadata: { ...review.metadata, rating_average: average, rating_count: count },
  })
}
```

Register in `medusa-config.ts`:
```ts
subscribers: [
  "src/subscribers/review/update-aggregate",
],
```

Trigger on `review.created`, `review.updated`, `review.deleted`.

---

## 11. Anti-Spam Measures

### 11.1 Rate Limiting
Use Medusa’s built-in rate limiter or Express middleware on review routes. Limit to N reviews per customer per product per time window.

### 11.2 Profanity Filter
Option A: Call an external API (e.g., Perspective API) in the `create-review` workflow step.
Option B: Maintain a local blocklist in `metadata` and check against it.

### 11.3 Duplicate Detection
Check for existing reviews from the same customer on the same product before creating.

### 11.4 Moderation Queue
Default status is `pending`. Only `approved` reviews are visible on the storefront. Admins can bulk-approve via admin UI.

---

## 12. Storefront Integration

### 12.1 Product Detail Page
Fetch approved reviews alongside product data:
```ts
const reviews = await sdk.store.reviews.list(productId)
```

Display:
- Average rating star display
- Review count
- Individual review cards with customer name, date, rating, content
- Verified purchase badge
- Helpful vote button (calls `POST /store/reviews/:id/helpful`)

### 12.2 Review Submission Form
- Visible only to logged-in customers who have purchased the product
- Form fields: star rating (1–5), title, content
- On submit, call `POST /store/reviews` with `createReviewWorkflow`
- Show “pending moderation” confirmation

### 12.3 SEO Rich Snippets
Use aggregated ratings from product metadata to emit JSON-LD:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "23"
  }
}
</script>
```

---

## 13. Admin Dashboard Integration

Use Medusa’s admin extension points in `apps/backend/src/admin/`:

### 13.1 Widgets
Add a “Recent Reviews” widget to the product detail page showing pending reviews.

### 13.2 UI Routes
Create `/admin/reviews` page with:
- Table of all reviews with filters (status, product, customer, date)
- Bulk approve/reject actions
- Delete button
- Direct links to associated product and customer

### 13.3 Inline Moderation
Add a review section to the product edit page allowing admins to approve/reject without leaving the product context.

---

## 14. Advanced Features

### 14.1 Vendor/Marketplace Reviews
If multivendor is implemented (see `multivendor.md`), reviews can be scoped to sellers instead of (or in addition to) products:
- Link `Review` to `Vendor` via module link
- Show seller ratings on storefront
- Commission calculations may factor review scores

### 14.2 Review Responses
Add a `review_response` model allowing sellers or admins to reply to reviews. Display responses nested under the original review.

### 14.3 Photo/Video Reviews
Extend `ReviewImage` model to support video URLs. Add media upload endpoint to store API.

### 14.4 Sort & Filter
Storefront filters: by rating, by verified purchase, by date, by helpfulness.

---

## 15. Implementation Checklist

- [ ] Create `apps/backend/src/modules/review/` with `Review` + `ReviewImage` models
- [ ] Register module in `medusa-config.ts`
- [ ] Generate and run migrations (`pnpm exec medusa db:generate review`)
- [ ] Define `review-product` and `review-customer` links
- [ ] Sync links (`pnpm exec medusa db:sync-links`)
- [ ] Create `create-review`, `approve-review`, `delete-review` workflows
- [ ] Build verified-purchase detection subscriber
- [ ] Build review aggregation subscriber
- [ ] Add store API routes (`/store/products/[id]/reviews`, `/store/reviews`)
- [ ] Add admin API routes (`/admin/reviews`, `/admin/reviews/[id]/approve`, `/admin/reviews/[id]`)
- [ ] Add anti-spam middleware/profanity check
- [ ] Add admin UI widgets and review management page
- [ ] Extend storefront PDP with reviews section
- [ ] Add review submission form with auth gate
- [ ] Add SEO JSON-LD for rich snippets
- [ ] Test moderation workflow end-to-end

---

## 16. Sources

- MedusaJS Custom Modules Guide: https://docs.medusajs.com/learn/fundamentals/modules
- MedusaJS Module Links: https://docs.medusajs.com/learn/fundamentals/module-links
- MedusaJS Workflows: https://docs.medusajs.com/learn/fundamentals/workflows
- MedusaJS API Routes: https://docs.medusajs.com/learn/fundamentals/api-routes
- MedusaJS Admin Extensions: https://docs.medusajs.com/learn/fundamentals/admin-extensions
- Local project: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js\knowledgebase\skills\medusa\medusa-dev\building-with-medusa\SKILL.md`
- Local project: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js\AGENTS.md`

---

*Research compiled: 2026-09-08*
*Based on MedusaJS v2.20.1*
