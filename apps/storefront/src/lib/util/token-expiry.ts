/** Reads JWT expiry as a cookie-lifetime hint, never as authentication proof. */
export function tokenExpiry(token: string): number | null {
  try {
    const { exp } = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    )
    return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : null
  } catch {
    return null
  }
}
