export const CART_UPDATED_EVENT = "medusa:cart-updated"

/** Lets client-loaded cart UI refresh after a mutation on statically rendered pages. */
export const notifyCartUpdated = () => {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}
