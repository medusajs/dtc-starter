import { sdk } from "@lib/config"
import { activateCart } from "@lib/util/server-cart"
import { getRequestOrigin } from "@lib/util/site"
import { NextResponse } from "next/server"

const NO_STORE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }

/** UCP checkout `continue_url`: hands an agent-built cart to the buyer for payment. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ countryCode: string; cartId: string }> }
) {
  const { countryCode, cartId } = await params

  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "id,completed_at,metadata",
    })
    if (cart.completed_at || cart.metadata?.ucp_canceled === true) {
      throw new Error("Cart is no longer open")
    }
  } catch {
    return new NextResponse("This cart link has expired", {
      status: 410,
      headers: NO_STORE,
    })
  }

  await activateCart(cartId)

  return NextResponse.redirect(
    `${getRequestOrigin(request)}/${countryCode}/checkout`,
    { status: 303, headers: NO_STORE }
  )
}
