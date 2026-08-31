/**
 * TEMPORARY — remove once Medusa v2.20.0 ships a built-in product search index.
 *
 * Product search index definition. Files under `src/search` are imported by
 * Medusa's search index loader before the app boots; `defineSearchIndex` does
 * the registering, so this file only has to declare the index.
 */
import { defineSearchIndex, search } from '@medusajs/framework/utils'

/**
 * The `query.graph` fields the documents are built from. Every field written to
 * the index has to be readable from here.
 */
const PRODUCT_GRAPH_FIELDS = [
  'id',
  'title',
  'subtitle',
  'description',
  'handle',
  'thumbnail',
  'status',
  'created_at',
  'collection.title',
  'categories.name',
  'tags.value',
  'options.title',
  'options.values.value',
]

const SEED_BATCH_SIZE = 200

type ProductRow = {
  id: string
  title?: string | null
  subtitle?: string | null
  description?: string | null
  handle?: string | null
  thumbnail?: string | null
  status?: string | null
  created_at?: string | Date | null
  collection?: { title?: string | null } | null
  categories?: ({ name?: string | null } | null)[] | null
  tags?: ({ value?: string | null } | null)[] | null
  options?:
    | ({
        title?: string | null
        values?: ({ value?: string | null } | null)[] | null
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
  const collectionTitle = product.collection?.title?.trim()
  const categoryNames = (product.categories ?? [])
    .map((category) => category?.name?.trim())
    .filter((name): name is string => Boolean(name))
  const tags = (product.tags ?? [])
    .map((tag) => tag?.value?.trim())
    .filter((value): value is string => Boolean(value))
  const optionValues = toOptionValues(product.options)

  return {
    id: product.id,
    // Nulls are fine on these: the storefront reads them and none is faceted.
    title: product.title ?? null,
    subtitle: product.subtitle ?? null,
    description: product.description ?? null,
    handle: product.handle ?? null,
    thumbnail: product.thumbnail ?? null,
    status: product.status ?? null,
    created_at: product.created_at ?? null,
    // The facetable fields are left out entirely when there is nothing to
    // index, rather than written as `null` or `[]`. Whether an engine counts a
    // missing value as its own facet bucket is provider-specific — Postgres'
    // `native` engine skips it, others surface it as a blank filter row — and
    // an absent key gives none of them anything to bucket. `upsert` replaces
    // the whole document, so a product that loses its collection loses the key.
    ...(collectionTitle ? { collection_title: collectionTitle } : {}),
    ...(categoryNames.length ? { category_names: categoryNames } : {}),
    ...(tags.length ? { tags } : {}),
    ...(optionValues.length ? { option_values: optionValues } : {}),
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
    // Searchable (not just filterable) so free-text queries match a brand or
    // option value directly — e.g. searching "tesco" or "vanilla" — the same
    // index just contributes more searchable fields, rather than needing a
    // separate index per field.
    brand: search
      .keyword()
      .searchable({ weight: 2 })
      .filterable()
      .facetable()
      .retrievable(),
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
