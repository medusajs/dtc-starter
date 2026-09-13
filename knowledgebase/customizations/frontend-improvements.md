# Frontend Improvements

This file tracks improvements, enhancements, and non-bug-fix changes made to the storefront. For bug fixes, see `frontend-fixes.md`.

## Improvement Log

### IMP-01 — Middleware resilience during backend startup

**Date:** 2026-09-11

**File:** `apps/storefront/src/middleware.ts`

**What changed:** Wrapped the backend region fetch in `getRegionMap()` with a `try-catch`. If the backend is still starting up and returns `fetch failed`, the middleware now logs the error and returns an empty region map instead of throwing.

**Why:** During `pnpm run dev`, the storefront can compile before the backend is fully ready. The old behavior threw an unhandled exception from middleware, which produced `⨯ Error [TypeError]: fetch failed` in the dev log and could break page rendering. The new behavior degrades gracefully: the site still loads, and regions populate on the next request once the backend is available.

**Impact:** Startup order is no longer a hard dependency. The site remains usable during backend restarts. Region data is cached for 1 hour, so transient backend unavailability won’t cause repeated failures.

**Rollback:** Remove the `try-catch` wrapper and restore the original fetch block if you want strict failure behavior again.

---

### IMP-02 — Layout no longer blocks page rendering with server-side data fetches

**Date:** 2026-09-12

**File:** `apps/storefront/src/app/[countryCode]/(main)/layout.tsx`

**What changed:** Moved `retrieveCustomer()`, `retrieveCart()`, and `listCartOptions()` out of the server layout and into a new client component (`LayoutDataLayer`). The layout now renders immediately; the cart/customer banners hydrate asynchronously after the page is visible.

**Why:** The layout is the common ancestor of every storefront page. When it awaits backend calls, every page — including the homepage — waits for those round-trips before sending any HTML. For anonymous visitors or users without a cart, this adds 1–3 unnecessary HTTP requests to the critical path.

**Impact:** Pages render immediately. Cart mismatch banners and the free-shipping nudge appear shortly after hydration. No SEO impact because the moved data is not content-critical.

---

### IMP-03 — Homepage data fetching is parallelized

**Date:** 2026-09-12

**File:** `apps/storefront/src/app/[countryCode]/(main)/page.tsx`

**What changed:** Replaced sequential `await` chains for `getRegion`, `listCollections`, and `listCategories` with `Promise.all()`.

**Why:** The homepage was waiting for regions, then collections, then categories one after another. These calls are independent, so running them concurrently reduces wall-clock time to the slowest single request instead of the sum of all three.

**Impact:** Homepage load time drops by roughly 2x in high-latency environments.

---

### IMP-04 — Reduced category query payload

**Date:** 2026-09-12

**File:** `apps/storefront/src/lib/data/categories.ts`

**What changed:** `listCategories` default `fields` selection was `*category_children, *products, *parent_category, *parent_category.parent_category` with `limit: 100`. The homepage and category listing page now pass a reduced fields set: `id, name, handle, description`.

**Why:** The wildcard `*products` expansion pulls every product in every category into the response. On a seeded store with many variants this is a large, slow query. The category bar and category listing pages only need basic category metadata.

**Impact:** Category queries return significantly smaller payloads. Pages that render the category bar load faster.

---

### IMP-05 — Middleware matcher tightened and locale cache added

**Date:** 2026-09-12

**File:** `apps/storefront/src/middleware.ts`, `apps/storefront/src/lib/data/locale-actions.ts`

**What changed:**
1. Middleware matcher now excludes `/_next/*` paths entirely (previously only `_next/static` and `_next/image` were excluded). Added an early `pathname.startsWith("/_next")` return so the middleware skips internal Next.js requests (data, HMR, webpack).
2. `getLocale()` now caches the cookie value for 5 seconds. Previously every SDK fetch re-read the locale cookie asynchronously, adding overhead to every API call in a page load.

**Why:** In dev with Turbopack, HMR reloads the middleware module frequently. The in-memory region cache is lost on each reload, causing `/store/regions` to be re-fetched. Tightening the matcher reduces the number of requests that even reach the region-resolution logic. Caching `getLocale()` eliminates repeated async cookie reads within the same page render.

**Impact:** Fewer middleware invocations on internal paths. Reduced per-request overhead on API calls that need the locale header.

---

### Relationship to IMP-01

**IMP-01** added a `try-catch` around the `/store/regions` fetch in `getRegionMap()` so the middleware degrades gracefully when the backend is still starting up. It does **not** address page-load speed. The fixes above (IMP-05 and IMP-02) are the ones that directly improve perceived performance.

---

*Add new improvements above this line.*
