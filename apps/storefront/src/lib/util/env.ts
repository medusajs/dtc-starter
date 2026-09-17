export const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"
}

// The store's public name. Shown in the nav, the footer, the side menu, the
// checkout header, page titles and the account pages.
//
// Optional: an unset value falls back to the starter's own name, so a fresh
// clone is a working storefront rather than one with a blank wordmark. Next.js
// inlines NEXT_PUBLIC_* at build time, so changing it needs a rebuild.
export const getStoreName = () => {
  return process.env.NEXT_PUBLIC_STORE_NAME || "Medusa Store"
}
