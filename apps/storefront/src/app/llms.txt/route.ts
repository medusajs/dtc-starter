import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { UCP_MCP_PATH, UCP_REST_BASE_PATH } from "@lib/ucp/ucp"
import {
  getDefaultCountryCode,
  getRequestOrigin,
  listCountryCodes,
  STORE_NAME,
} from "@lib/util/site"

export async function GET(request: Request) {
  const origin = getRequestOrigin(request)

  const [regions, categories, { collections }] = await Promise.all([
    listRegions(),
    listCategories({ fields: "name,handle,parent_category_id", limit: 50 }),
    listCollections({ fields: "title,handle", limit: "50" }),
  ])

  const countries = listCountryCodes(regions)
  const base = `${origin}/${getDefaultCountryCode(regions)}`
  const currencies = Array.from(
    new Set(regions.map((r) => r.currency_code?.toUpperCase()).filter(Boolean))
  )

  const links = [
    ...categories
      .filter((c) => !c.parent_category_id)
      .map((c) => `- [${c.name}](${base}/categories/${c.handle})`),
    ...collections.map((c) => `- [${c.title}](${base}/collections/${c.handle})`),
  ]

  const body = `# ${STORE_NAME}

> Online store. Ships to ${countries.length} countries. Prices in ${currencies.join(", ")}.

URLs are prefixed with a two-letter country code that sets currency and pricing, for example \`${base}\`. Available country codes: ${countries.join(", ")}.

## Shop
- [All products](${base}/store)
${links.join("\n")}
- Search: ${base}/search?q={query}

## Buying
- Product pages contain an add-to-cart form that posts \`variant_id\` and \`quantity\` to ${base}/cart/add.
- Preselect a variant with \`?v_id={variant_id}\` on a product URL.
- Append \`.md\` to a product URL (or send \`Accept: text/markdown\`) for a Markdown version with variant IDs, prices and stock.
- Checkout link: ${origin}/buy/{variant_id}:{quantity},{variant_id}:{quantity}
- [Cart](${base}/cart)

## Policies
- [Shipping information](${base}/shipping)
- [Return policy](${base}/returns)
- [Terms of service](${base}/terms)
- [Privacy policy](${base}/privacy)
- [Contact](${base}/contact)

## For agents
- [Sitemap](${origin}/sitemap.xml)
- [UCP profile](${origin}/.well-known/ucp)
- UCP MCP endpoint: ${origin}${UCP_MCP_PATH}
- UCP REST endpoint: ${origin}${UCP_REST_BASE_PATH}
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
