/**
 * Bulk-seeds products with the relations the admin product export actually reads
 * (collection, type, categories, tags, images, options + values, variants,
 * variant options, variant images, prices, sales channels)
 */
import { MedusaContainer } from "@medusajs/framework";
import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  MedusaErrorTypes,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createProductTagsWorkflow,
  createProductTypesWorkflow,
} from "@medusajs/medusa/core-flows";

const int = (name: string, fallback: number) => {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const list = (name: string, fallback: string[]) =>
  process.env[name]
    ?.split(",")
    .map((v) => v.trim())
    .filter(Boolean) ?? fallback;

const IMAGE_BASE =
  "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png";

export default async function seedBulkProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const total = int("SEED_PRODUCTS", 300);
  const batchSize = int("SEED_BATCH", 25);
  const sizes = list("SEED_SIZES", ["XS", "S", "M", "L"]);
  const colors = list("SEED_COLORS", ["Black", "White", "Navy"]);

  const [{ data: channels }, { data: profiles }, { data: regions }] =
    await Promise.all([
      query.graph({ entity: "sales_channel", fields: ["id"] }),
      query.graph({ entity: "shipping_profile", fields: ["id"] }),
      query.graph({ entity: "region", fields: ["id", "currency_code"] }),
    ]);

  if (!channels.length || !profiles.length) {
    throw new MedusaError(
      MedusaErrorTypes.NOT_FOUND,
      "No sales channel / shipping profile found. Run the initial seed first.",
    );
  }

  const salesChannelId = channels[0].id;
  const shippingProfileId = profiles[0].id;
  // One price per region currency, plus usd so there is a currency with no region
  // (that is a separate column in the export CSV).
  const currencies = [
    ...new Set([...regions.map((r) => r.currency_code), "usd"]),
  ];

  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: { $like: "bulk-%" } },
  });
  const offset = existing.length;
  logger.info(
    `Seeding ${total} products (offset ${offset}), ` +
      `${sizes.length * colors.length} variants each, ${currencies.length} prices each ` +
      `→ ${total * sizes.length * colors.length} variants, ` +
      `${total * sizes.length * colors.length * currencies.length} prices`,
  );

  const categoryNames = ["Bulk Tops", "Bulk Bottoms", "Bulk Outerwear"];
  const collectionNames = ["Bulk SS", "Bulk FW"];
  const tagValues = ["bulk", "perf", "export-test", "seeded"];
  const typeValues = ["Bulk Apparel"];

  const categories = await ensure(
    query,
    "product_category",
    "name",
    categoryNames,
    (missing) =>
      createProductCategoriesWorkflow(container)
        .run({
          input: {
            product_categories: missing.map((name) => ({
              name,
              is_active: true,
            })),
          },
        })
        .then((r) => r.result),
  );

  const collections = await ensure(
    query,
    "product_collection",
    "title",
    collectionNames,
    (missing) =>
      createCollectionsWorkflow(container)
        .run({ input: { collections: missing.map((title) => ({ title })) } })
        .then((r) => r.result),
  );

  const tags = await ensure(
    query,
    "product_tag",
    "value",
    tagValues,
    (missing) =>
      createProductTagsWorkflow(container)
        .run({ input: { product_tags: missing.map((value) => ({ value })) } })
        .then((r) => r.result),
  );

  const types = await ensure(
    query,
    "product_type",
    "value",
    typeValues,
    (missing) =>
      createProductTypesWorkflow(container)
        .run({ input: { product_types: missing.map((value) => ({ value })) } })
        .then((r) => r.result),
  );

  const startedAt = Date.now();
  for (let start = 0; start < total; start += batchSize) {
    const count = Math.min(batchSize, total - start);
    const products = Array.from({ length: count }, (_, k) => {
      const i = offset + start + k;
      return {
        title: `Bulk Product ${i}`,
        subtitle: `Subtitle ${i}`,
        handle: `bulk-${i}`,
        description: `Seeded product #${i} used to profile the product export workflow.`,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfileId,
        sales_channels: [{ id: salesChannelId }],
        collection_id: collections[i % collections.length].id,
        type_id: types[i % types.length].id,
        category_ids: [categories[i % categories.length].id],
        tag_ids: tags.slice(0, 2 + (i % (tags.length - 1))).map((t) => t.id),
        weight: 400,
        length: 20,
        height: 10,
        width: 15,
        origin_country: "pt",
        material: "cotton",
        metadata: { seeded: true, batch: String(start / batchSize) },
        images: [
          { url: `${IMAGE_BASE}?p=${i}-1` },
          { url: `${IMAGE_BASE}?p=${i}-2` },
        ],
        options: [
          { title: "Size", values: sizes },
          { title: "Color", values: colors },
        ],
        variants: sizes.flatMap((size) =>
          colors.map((color) => ({
            title: `${size} / ${color}`,
            sku: `BULK-${i}-${size}-${color}`.toUpperCase(),
            manage_inventory: false,
            options: { Size: size, Color: color },
            prices: currencies.map((currency_code, ci) => ({
              amount: 1000 + i + ci,
              currency_code,
            })),
          })),
        ),
      };
    });

    await createProductsWorkflow(container).run({ input: { products } });
    logger.info(
      `  ${Math.min(start + count, total)}/${total} products ` +
        `(${((Date.now() - startedAt) / 1000).toFixed(1)}s)`,
    );
  }

  logger.info(
    `Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s. ` +
      `Trigger the export from the admin, or: ` +
      `curl -X POST localhost:9000/admin/products/export -H "Authorization: Bearer <jwt>"`,
  );
}

/**
 * Look up entities by a unique-ish field, create only the missing ones, return
 * all of them. Keeps the script re-runnable without duplicating taxonomy.
 */
async function ensure(
  query: { graph: any },
  entity: string,
  field: string,
  values: string[],
  create: (missing: string[]) => Promise<{ id: string }[]>,
): Promise<{ id: string }[]> {
  const { data: found } = await query.graph({
    entity,
    fields: ["id", field],
    filters: { [field]: values },
  });
  const missing = values.filter(
    (v) => !found.some((f: Record<string, unknown>) => f[field] === v),
  );
  const created = missing.length ? await create(missing) : [];
  return [...found, ...created];
}
