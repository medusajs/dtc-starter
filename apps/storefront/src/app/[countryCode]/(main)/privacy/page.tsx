import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${STORE_NAME} collects and uses personal data.`,
}

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy policy">
      <PlaceholderNotice />
      <p>
        {STORE_NAME} collects the information you provide at checkout, such as
        your name, email address and shipping address, to process and deliver
        your order.
      </p>
      <p>
        Payment details are handled by our payment provider and are not stored
        by the store. Cookies are used to keep your cart and sign-in session.
      </p>
    </PolicyPage>
  )
}
