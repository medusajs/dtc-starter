"use server"

import { getRegionPolicies, StorePolicies } from "@lib/util/store-policies"
import { listRegions } from "./regions"

export const getStorePolicies = async (countryCode: string) => {
  const regions = await listRegions()
  const current = regions.find((region) =>
    region.countries?.some((country) => country.iso_2 === countryCode.toLowerCase())
  )

  return {
    current: getRegionPolicies(current),
    currencyCode: current?.currency_code ?? "",
    regions: regions.flatMap((region) => {
      const policies = getRegionPolicies(region)
      return policies ? [{ id: region.id, name: region.name, policies }] : []
    }) as { id: string; name: string; policies: StorePolicies }[],
  }
}
