export type ProductOptionRow = {
  title?: string | null;
  values?: ({ value?: string | null } | null)[] | null;
} | null;

/**
 * Flattens a product's options into `"<option title>:<value>"` entries, e.g.
 * `["Size:S", "Color:Red"]`. One field keeps the index simple; the storefront
 * splits on the first `:` to group the facet by option name.
 */
export function toOptionValues(
  options: ProductOptionRow[] | null | undefined,
): string[] {
  const flattened = (options ?? []).flatMap((option) => {
    const title = option?.title?.trim();

    if (!title) {
      return [];
    }

    return (option?.values ?? [])
      .map((optionValue) => optionValue?.value?.trim())
      .filter((value): value is string => Boolean(value))
      .map((value) => `${title}:${value}`);
  });

  // A value shared by several options would otherwise be counted twice.
  return Array.from(new Set(flattened));
}
