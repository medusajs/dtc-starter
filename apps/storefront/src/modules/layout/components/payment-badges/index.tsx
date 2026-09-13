import { CreditCard } from "@medusajs/icons"

import PayPal from "@modules/common/icons/paypal"
import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"

const PaymentBadges = () => {
  return (
    <div className="flex items-center gap-x-3">
      <div className="flex items-center justify-center w-8 h-6 bg-ui-fg-on-color rounded">
        <CreditCard className="w-4 h-4 text-ui-fg-base" />
      </div>
      <div className="flex items-center justify-center w-8 h-6 bg-ui-fg-on-color rounded">
        <PayPal />
      </div>
      <div className="flex items-center justify-center w-8 h-6 bg-ui-fg-on-color rounded">
        <Ideal className="w-4 h-4" />
      </div>
      <div className="flex items-center justify-center w-8 h-6 bg-ui-fg-on-color rounded">
        <Bancontact className="w-4 h-4" />
      </div>
    </div>
  )
}

export default PaymentBadges
