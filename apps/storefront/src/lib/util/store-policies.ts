import { HttpTypes } from "@medusajs/types"

export type StorePolicies = {
  returnWindowDays: number
  freeReturns: boolean
  shippingRate: number
  handlingDays: { min: number; max: number }
  transitDays: { min: number; max: number }
}

const toNumber = (value: unknown) => {
  const number =
    typeof value === "string" && value.trim() === "" ? NaN : Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

/**
 * Reads the store policy keys set on a region's metadata in Medusa Admin.
 * Returns null when any value is missing or invalid, so callers omit policy
 * data instead of publishing guesses.
 */
export const getRegionPolicies = (
  region: Pick<HttpTypes.StoreRegion, "metadata"> | null | undefined
): StorePolicies | null => {
  const metadata = region?.metadata ?? {}
  const values = {
    returnWindowDays: toNumber(metadata.return_window_days),
    shippingRate: toNumber(metadata.shipping_rate),
    handlingMin: toNumber(metadata.handling_days_min),
    handlingMax: toNumber(metadata.handling_days_max),
    transitMin: toNumber(metadata.transit_days_min),
    transitMax: toNumber(metadata.transit_days_max),
  }
  if (Object.values(values).some((value) => value === null)) {
    return null
  }

  return {
    returnWindowDays: values.returnWindowDays!,
    freeReturns:
      metadata.free_returns === true || metadata.free_returns === "true",
    shippingRate: values.shippingRate!,
    handlingDays: { min: values.handlingMin!, max: values.handlingMax! },
    transitDays: { min: values.transitMin!, max: values.transitMax! },
  }
}

const businessDays = (range: { min: number; max: number }) => ({
  "@type": "QuantitativeValue",
  minValue: range.min,
  maxValue: range.max,
  unitCode: "DAY",
})

export const buildShippingDetails = (
  policies: StorePolicies,
  countryCode: string,
  currencyCode: string
) => ({
  "@type": "OfferShippingDetails",
  shippingRate: {
    "@type": "MonetaryAmount",
    value: policies.shippingRate,
    currency: currencyCode.toUpperCase(),
  },
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: countryCode.toUpperCase(),
  },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: businessDays(policies.handlingDays),
    transitTime: businessDays(policies.transitDays),
  },
})

export const buildReturnPolicy = (
  policies: StorePolicies,
  countryCode: string
) => ({
  "@type": "MerchantReturnPolicy",
  applicableCountry: countryCode.toUpperCase(),
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: policies.returnWindowDays,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: policies.freeReturns
    ? "https://schema.org/FreeReturn"
    : "https://schema.org/ReturnFeesCustomerResponsibility",
})

export const buildRegionsReturnPolicies = (regions: HttpTypes.StoreRegion[]) =>
  regions.flatMap((region) => {
    const policies = getRegionPolicies(region)
    if (!policies) {
      return []
    }
    return (region.countries ?? [])
      .filter((country) => country.iso_2)
      .map((country) => buildReturnPolicy(policies, country.iso_2!))
  })

export const formatDayRange = ({ min, max }: { min: number; max: number }) =>
  min === max ? `${min}` : `${min}-${max}`
