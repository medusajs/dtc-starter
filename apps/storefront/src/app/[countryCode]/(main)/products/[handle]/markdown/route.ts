import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { renderProductMarkdown } from "@lib/util/product-markdown"
import { getRequestOrigin } from "@lib/util/site"

const HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
  Vary: "Accept",
}

/** Served for `<product-url>.md` and `Accept: text/markdown` via rewrites in next.config.js. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ countryCode: string; handle: string }> }
) {
  const { countryCode, handle } = await params
  const region = await getRegion(countryCode)
  const product = region
    ? await listProducts({ countryCode, queryParams: { handle } })
        .then(({ response }) => response.products[0])
        .catch(() => undefined)
    : undefined

  if (!region || !product) {
    return new Response("# Product not found\n", { status: 404, headers: HEADERS })
  }

  return new Response(
    renderProductMarkdown({
      product,
      region,
      origin: getRequestOrigin(request),
      countryCode,
    }),
    { headers: HEADERS }
  )
}
