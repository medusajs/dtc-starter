import { convertToLocale } from "@lib/util/money"
import { formatDayRange, StorePolicies } from "@lib/util/store-policies"

export const formatShippingRate = (rate: number, currencyCode: string) =>
  rate === 0 ? "Free" : convertToLocale({ amount: rate, currency_code: currencyCode })

export const PolicyPage = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="content-container py-12 max-w-3xl" data-testid="policy-page">
    <h1 className="text-2xl-semi mb-8">{title}</h1>
    <div className="flex flex-col gap-6 text-base-regular text-ui-fg-base">
      {children}
    </div>
  </div>
)

export const PoliciesUnavailable = () => (
  <p className="text-ui-fg-subtle">
    Policy details for this region haven&apos;t been published yet.
  </p>
)

export const ShippingSummary = ({
  policies,
  currencyCode,
}: {
  policies: StorePolicies
  currencyCode: string
}) => (
  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
    <dt className="text-ui-fg-subtle">Shipping rate</dt>
    <dd>{formatShippingRate(policies.shippingRate, currencyCode)}</dd>
    <dt className="text-ui-fg-subtle">Processing time</dt>
    <dd>{formatDayRange(policies.handlingDays)} business days</dd>
    <dt className="text-ui-fg-subtle">Delivery time</dt>
    <dd>{formatDayRange(policies.transitDays)} business days after dispatch</dd>
  </dl>
)

export const PlaceholderNotice = () => (
  <p className="text-ui-fg-subtle" data-testid="policy-placeholder">
    This is placeholder content from the Medusa starter. Replace it with your
    store&apos;s own text before launch.
  </p>
)
