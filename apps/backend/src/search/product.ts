import type { SearchTypes } from "@medusajs/framework/types";
import {
  defineSearchIndex,
  graphConsume,
  graphSeed,
  search,
} from "@medusajs/framework/utils";

import { ProductOptionRow, toOptionValues } from "./helpers/option-values";
import { loadPricing, priceFields, toProductPricing } from "./helpers/pricing";
import { resolveProductIds } from "./helpers/resolve-product-ids";

const PRODUCT_GRAPH_FIELDS = [
  "id",
  "title",
  "description",
  "handle",
  "thumbnail",
  "status",
  "created_at",
  "sales_channels.id",
  "categories.name",
  "tags.value",
  "options.title",
  "options.values.value",
];

type ProductRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  handle?: string | null;
  thumbnail?: string | null;
  status?: string | null;
  created_at?: string | Date | null;
  deleted_at?: string | Date | null;
  sales_channels?: ({ id?: string | null } | null)[] | null;
  categories?: ({ name?: string | null } | null)[] | null;
  tags?: ({ value?: string | null } | null)[] | null;
  options?: ProductOptionRow[] | null;
};

const productFields = search.define({
  id: search.keyword().filterable().retrievable(),
  // Read by `/store/search` to scope the index; never returned to hits.
  status: search.keyword().filterable().retrievable(false),
  sales_channel_ids: search.keyword().array().filterable().retrievable(false),
  title: search.text().searchable({ weight: 3 }).sortable().retrievable(),
  description: search.text().searchable({ weight: 1 }),
  handle: search.keyword().retrievable(),
  // Returned on hits only: never filtered, sorted or faceted on.
  thumbnail: search.keyword().retrievable(),
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
  ...priceFields,
});

type ProductDocument = SearchTypes.InferSearchDocumentType<
  typeof productFields
>;

function toDocument(
  product: ProductRow,
  pricing: Parameters<typeof toProductPricing>[0],
): ProductDocument {
  const category = (product.categories ?? [])
    .map((productCategory) => productCategory?.name?.trim())
    .filter((name): name is string => Boolean(name));
  const labels = (product.tags ?? [])
    .map((tag) => tag?.value?.trim())
    .filter((value): value is string => Boolean(value));
  const salesChannelIds = (product.sales_channels ?? [])
    .map((salesChannel) => salesChannel?.id?.trim())
    .filter((id): id is string => Boolean(id));

  return {
    id: product.id,
    status: product.status ?? null,
    sales_channel_ids: salesChannelIds,
    title: product.title ?? null,
    description: product.description ?? null,
    handle: product.handle ?? null,
    thumbnail: product.thumbnail ?? null,
    created_at: product.created_at ?? null,
    category,
    labels,
    option_values: toOptionValues(product.options),
    ...toProductPricing(pricing),
  };
}

/**
 * Only published products are indexed. A row that returns no document leaves
 * the index: the helpers turn it into a delete on `consume` and on the
 * catch-up pass.
 */
const source = {
  fields: PRODUCT_GRAPH_FIELDS,
  transform: async (
    rows: ProductRow[],
    context: SearchTypes.SearchIngestionContext,
  ) => {
    const published = rows.filter((row) => row.status === "published");
    const pricing = await loadPricing(
      published.map((row) => row.id),
      context,
    );

    return published.map((row) => toDocument(row, pricing.get(row.id)));
  },
};

/**
 * Everything a document is built from, so a change to any of it re-indexes the
 * products it touches. Only `product.deleted` removes documents: a deleted
 * variant, option, tag or category means the product has to be re-read.
 *
 * TODO: price lists emit no events (create, update, delete, batch prices).
 * TODO: price lists crossing their start or end date change prices silently.
 * TODO: linkProductsToSalesChannelWorkflow emits nothing.
 * TODO: batchLinkProductsToCategoryWorkflow emits nothing.
 * TODO: upsertVariantPricesWorkflow emits nothing when called directly.
 */
const PRODUCT_EVENTS = [
  "product.created",
  "product.updated",
  "product.deleted",
  "product-variant.created",
  "product-variant.updated",
  "product-variant.deleted",
  "product-option.created",
  "product-option.updated",
  "product-option.deleted",
  "product-option-value.updated",
  "product-option-value.deleted",
  "product-tag.updated",
  "product-tag.deleted",
  "product-category.updated",
  "product-category.deleted",
  "sales-channel.deleted",
];

export default defineSearchIndex({
  name: "product",
  entity: "product",
  primary_key: "id",
  fields: productFields,
  settings: {
    typo_tolerance: { enabled: true },
  },
  events: PRODUCT_EVENTS,
  consume: graphConsume<typeof productFields, ProductRow>({
    ...source,
    resolve_ids: resolveProductIds,
    is_delete: (event) => event.name === "product.deleted",
  }),
  seed: graphSeed<typeof productFields, ProductRow>(source),
});
