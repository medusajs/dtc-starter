import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listCategories } from "@lib/data/categories"
import PageBanner from "@modules/common/components/shared/page-banner"
import CategoryBarCarousel from "@modules/common/components/shared/category-bar"

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all product categories.",
}

export default async function CategoriesPage() {
  const productCategories = await listCategories()

  if (!productCategories || productCategories.length === 0) {
    notFound()
  }

  return (
    <div className="w-full">
      <PageBanner title="Categories" description="Browse all product categories." />
      <CategoryBarCarousel categories={productCategories} />
      <div className="w-full flex justify-center px-8 py-12">
        <div className="max-w-3xl w-full">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productCategories.map((category) => (
              <li key={category.id}>
                <a
                  href={`/categories/${category.handle}`}
                  className="block p-4 border border-ui-border-base rounded-2xl hover:bg-ui-bg-base-hover transition"
                >
                  <h2 className="text-base-semi text-ui-fg-base">{category.name}</h2>
                  {category.description && (
                    <p className="text-base-regular text-ui-fg-subtle mt-1">
                      {category.description}
                    </p>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
