import {
  activateCart,
  createCartWithItems,
  findMissingVariantIds,
  MAX_LINE_ITEM_QUANTITY,
  resolveRegion,
} from "@lib/util/server-cart"
import { getRequestOrigin } from "@lib/util/site"
import { NextResponse } from "next/server"

const ITEM_PATTERN = /^([A-Za-z0-9._-]+|~[A-Za-z0-9_-]+):([1-9][0-9]*)$/
const NO_STORE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }

const decodeItemId = (token: string) =>
  token.startsWith("~")
    ? Buffer.from(token.slice(1), "base64url").toString("utf8")
    : token

const parseItems = (raw: string) => {
  const items: { variant_id: string; quantity: number }[] = []
  for (const pair of decodeURIComponent(raw).split(",")) {
    const match = pair.match(ITEM_PATTERN)
    if (!match) {
      return null
    }
    const quantity = Number(match[2])
    if (quantity > MAX_LINE_ITEM_QUANTITY) {
      return null
    }
    items.push({ variant_id: decodeItemId(match[1]), quantity })
  }
  return items.length ? items : null
}

const textResponse = (body: string, status: number) =>
  new NextResponse(body, { status, headers: NO_STORE })

/** UCP cart permalink: /buy/{variant_id}:{quantity},... builds a cart and opens checkout. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ items: string }> }
) {
  const items = parseItems((await params).items)
  if (!items) {
    return textResponse("Malformed permalink. Use /buy/{variant_id}:{quantity},...", 400)
  }

  const country = new URL(request.url).searchParams.get("context/address_country")
  const resolved = await resolveRegion(country ?? undefined)
  if (!resolved) {
    return textResponse("This store does not ship to the requested country", 400)
  }

  const missing = await findMissingVariantIds(items.map((item) => item.variant_id))
  if (missing.length) {
    return textResponse(`Unknown items: ${missing.join(", ")}`, 404)
  }

  let cartId: string
  try {
    cartId = await createCartWithItems(resolved.region.id, items)
  } catch {
    return textResponse("One or more items in this link can't be purchased", 400)
  }

  await activateCart(cartId)

  return NextResponse.redirect(
    `${getRequestOrigin(request)}/${resolved.countryCode}/checkout`,
    { status: 303, headers: NO_STORE }
  )
}
