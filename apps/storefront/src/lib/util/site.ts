import "server-only"
import { headers } from "next/headers"

export const STORE_NAME = "Medusa Store"

export const DEFAULT_COUNTRY_CODE = (
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "dk"
).toLowerCase()

const configuredUrl = () => process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")

const originFromHeaders = (get: (name: string) => string | null) => {
  const host = (get("x-forwarded-host") ?? get("host"))?.split(",")[0].trim()
  if (!host) {
    return undefined
  }
  const proto = get("x-forwarded-proto")?.split(",")[0].trim() || "https"
  return `${proto}://${host}`
}

export const getRequestOrigin = (request: Request): string =>
  configuredUrl() ||
  originFromHeaders((name) => request.headers.get(name)) ||
  new URL(request.url).origin

/** Origin for absolute URLs in server components (canonical, JSON-LD, OpenGraph). */
export const getSiteOrigin = async (): Promise<string> => {
  const configured = configuredUrl()
  if (configured) {
    return configured
  }
  const requestHeaders = await headers()
  return originFromHeaders((name) => requestHeaders.get(name)) || "http://localhost:8000"
}

export const listCountryCodes = (
  regions: { countries?: { iso_2?: string | null }[] | null }[]
): string[] =>
  regions.flatMap((region) =>
    (region.countries ?? [])
      .map((country) => country.iso_2?.toLowerCase())
      .filter((code): code is string => Boolean(code))
  )

export const getDefaultCountryCode = (
  regions: { countries?: { iso_2?: string | null }[] | null }[]
) => {
  const codes = listCountryCodes(regions)
  return codes.includes(DEFAULT_COUNTRY_CODE) ? DEFAULT_COUNTRY_CODE : codes[0]
}
