/**
 * TEMPORARY — remove once Medusa v2.20.0 ships a built-in product search index.
 *
 * Product search index definition. Files under `src/search` are imported by
 * Medusa's search index loader before the app boots; `defineSearchIndex` does
 * the registering, so this file only has to declare the index.
 */
import {
  defineSearchIndex,
  QueryContext,
  search,
} from '@medusajs/framework/utils'

/**
 * The `query.graph` fields the documents are built from. Every field written to
 * the index has to be readable from here.
 */
const PRODUCT_GRAPH_FIELDS = [
  'id',
  'title',
  'description',
  'handle',
  'thumbnail',
  'status',
  'created_at',
  'categories.name',
  'tags.value',
  'options.title',
  'options.values.value',
  'variants.calculated_price.calculated_amount',
  'variants.calculated_price.original_amount',
  'variants.calculated_price.currency_code',
]

/**
 * The index holds one price per product, so it needs a single reference
 * currency. Prices are resolved through the Pricing Module for this currency,
 * which is what makes `original_price` differ from `min_price` when a price
 * list applies. A storefront selling in another currency can still filter and
 * sort on these, but must render amounts from the product API, not the index.
 */
const PRICE_CURRENCY_CODE = 'eur'

/**
 * The pricing context `calculated_price` needs. Without it the Pricing Module
 * refuses to calculate: "requires currency_code in the pricing context".
 */
const PRICE_CONTEXT = {
  variants: {
    calculated_price: QueryContext({ currency_code: PRICE_CURRENCY_CODE }),
  },
}

const SEED_BATCH_SIZE = 200

type ProductRow = {
  id: string
  title?: string | null
  description?: string | null
  handle?: string | null
  thumbnail?: string | null
  status?: string | null
  created_at?: string | Date | null
  categories?: ({ name?: string | null } | null)[] | null
  tags?: ({ value?: string | null } | null)[] | null
  options?:
    | ({
        title?: string | null
        values?: ({ value?: string | null } | null)[] | null
      } | null)[]
    | null
  variants?:
    | ({
        calculated_price?: {
          calculated_amount?: number | null
          original_amount?: number | null
          currency_code?: string | null
        } | null
        // `calculated_price` is computed by the Pricing Module rather than
        // declared on the variant type, so the graph's `ProductVariant` shares
        // no properties with the shape above. The index signature keeps
        // TypeScript's weak-type check from rejecting it.
        [key: string]: unknown
      } | null)[]
    | null
}

/**
 * Flattens a product's options into `"<option title>:<value>"` entries, e.g.
 * `["Size:S", "Color:Red"]`. One field keeps the index simple; the storefront
 * splits on the first `:` to group the facet by option name.
 */
function toOptionValues(options: ProductRow['options']): string[] {
  const flattened = (options ?? []).flatMap((option) => {
    const title = option?.title?.trim()

    if (!title) {
      return []
    }

    return (option?.values ?? [])
      .map((optionValue) => optionValue?.value?.trim())
      .filter((value): value is string => Boolean(value))
      .map((value) => `${title}:${value}`)
  })

  // A value shared by several options would otherwise be counted twice.
  return Array.from(new Set(flattened))
}

/**
 * The cheapest variant's pricing, as the index's five price fields. Picking one
 * variant keeps `min_price` and `original_price` a matching pair, so the
 * discount describes a real product rather than mixing two variants' amounts.
 */
function toPricing(variants: ProductRow['variants']): Record<string, unknown> {
  let cheapest:
    | { calculated: number; original: number; currency: string }
    | undefined

  for (const variant of variants ?? []) {
    const price = variant?.calculated_price
    const calculated = price?.calculated_amount

    // A variant with no price for this currency can't be the cheapest.
    if (typeof calculated !== 'number') {
      continue
    }

    const original =
      typeof price?.original_amount === 'number'
        ? price.original_amount
        : calculated

    if (!cheapest || calculated < cheapest.calculated) {
      cheapest = {
        calculated,
        original,
        currency: price?.currency_code?.trim() || PRICE_CURRENCY_CODE,
      }
    }
  }

  if (!cheapest) {
    return {}
  }

  const onSale = cheapest.original > cheapest.calculated

  return {
    currency_code: cheapest.currency,
    min_price: cheapest.calculated,
    original_price: cheapest.original,
    // Written even when false: "not on sale" is a real facet bucket, unlike a
    // missing value.
    on_sale: onSale,
    discount_percentage: onSale
      ? Math.round(
          ((cheapest.original - cheapest.calculated) / cheapest.original) * 100
        )
      : 0,
  }
}

/**
 * A document this index holds. Declared locally rather than imported from
 * `@medusajs/types` so the file cannot bind to a second copy of that package —
 * `defineSearchIndex` already types `consume` and `seed` contextually.
 */
type ProductDocument = {
  id: string
  [field: string]: unknown
}

/**
 * Turns a product row into the document this index holds. Keep in sync with
 * `fields` below — the storefront may only reference what is declared there.
 */
function toDocument(product: ProductRow): ProductDocument {
  const category = (product.categories ?? [])
    .map((productCategory) => productCategory?.name?.trim())
    .filter((name): name is string => Boolean(name))
  // ASSUMPTION: `labels` is fed by product tags — the only free-form keyword
  // list a product carries here. Swap the source if it means something else.
  const labels = (product.tags ?? [])
    .map((tag) => tag?.value?.trim())
    .filter((value): value is string => Boolean(value))
  const optionValues = toOptionValues(product.options)

  return {
    id: product.id,
    // Nulls are fine on these: the storefront reads them and none is faceted.
    title: product.title ?? null,
    description: product.description ?? null,
    handle: product.handle ?? null,
    thumbnail: product.thumbnail ?? null,
    status: product.status ?? null,
    created_at: product.created_at ?? null,
    category,
    labels,
    option_values: optionValues,
    ...toPricing(product.variants),
    // `brand` is intentionally never written: nothing in this project supplies
    // one. The field stays declared so it can be populated without a schema
    // change, but until then it contributes nothing to search or faceting.
  }
}

/**
 * Reads the ids off an event payload. Core emits either a single `{ id }` or a
 * batch of them, so both shapes are normalized here.
 */
function idsFromEvent(data: unknown): string[] {
  const entries = Array.isArray(data) ? data : [data]

  return entries
    .map((entry) => (entry as { id?: string } | undefined)?.id)
    .filter((id): id is string => Boolean(id))
}

export default defineSearchIndex({
  name: "product",
  entity: "product",
  primary_key: "id",
  fields: search.define({
    id: search.keyword().filterable().retrievable(),
    title: search.text().searchable({ weight: 3 }).sortable().retrievable(),
    description: search.text().searchable({ weight: 1 }),
    handle: search.keyword().retrievable(),
    thumbnail: search.keyword().retrievable(),
    status: search.keyword().filterable(),
    created_at: search.date().sortable().retrievable(),
    category: search.keyword().array().filterable().facetable().retrievable(),
    labels: search.keyword().array().filterable().facetable().retrievable(),
    option_values: search
      .keyword()
      .array()
      .searchable({ weight: 2 })
      .filterable()
      .facetable()
      .retrievable(),
    currency_code: search.keyword().retrievable(),
    original_price: search.float().retrievable(),
    min_price: search
      .float()
      .filterable()
      .sortable()
      .facetable({ types: ["stats"] })
      .retrievable(),
    on_sale: search.boolean().filterable().facetable().retrievable(),
    discount_percentage: search.integer().retrievable(),
  }),
  settings: {
    // Typeahead: completed terms must match in full, the last term is a prefix.
    typo_tolerance: { enabled: true },
  },
  events: ['product.created', 'product.updated', 'product.deleted'],
  async consume(event, { container }) {
    const ids = idsFromEvent(event.data)

    if (!ids.length) {
      return []
    }

    if (event.name === 'product.deleted') {
      return [{ action: 'delete', filters: { id: ids } }]
    }

    const { data: products } = await container.query.graph({
      entity: 'product',
      fields: PRODUCT_GRAPH_FIELDS,
      filters: { id: ids },
      context: PRICE_CONTEXT,
    })

    // A product that no longer resolves was deleted between the event and now.
    if (!products.length) {
      return [{ action: 'delete', filters: { id: ids } }]
    }

    return [
      { action: 'upsert', documents: products.map(toDocument) },
    ]
  },
  async *seed({ container, filters }) {
    let skip = 0

    while (true) {
      const { data: products } = await container.query.graph({
        entity: 'product',
        fields: PRODUCT_GRAPH_FIELDS,
        filters: filters ?? {},
        pagination: { skip, take: SEED_BATCH_SIZE, order: { id: 'ASC' } },
        context: PRICE_CONTEXT,
      })

      if (!products.length) {
        return
      }

      yield products.map(toDocument)

      if (products.length < SEED_BATCH_SIZE) {
        return
      }

      skip += SEED_BATCH_SIZE
    }
  },
})
