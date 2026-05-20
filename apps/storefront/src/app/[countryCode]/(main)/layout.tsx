import { Metadata } from "next"
import { Suspense, type ReactNode } from "react"
import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

async function CustomerBanner() {
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()

  if (!customer || !cart) return null

  return <CartMismatchBanner customer={customer} cart={cart} />
}

async function ShippingNudge() {
  const cart = await retrieveCart()

  if (!cart) return null

  let shippingOptions: StoreCartShippingOption[] = []
  const { shipping_options } = await listCartOptions()
  shippingOptions = shipping_options

  return (
    <FreeShippingPriceNudge
      variant="popup"
      cart={cart}
      shippingOptions={shippingOptions}
    />
  )
}

export default function PageLayout(props: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <Suspense>
        <CustomerBanner />
      </Suspense>
      <Suspense>
        <ShippingNudge />
      </Suspense>
      {props.children}
      <Footer />
    </>
  )
}
