import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { listCategories } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import CategoryBarCarousel from "@modules/common/components/shared/category-bar"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const [region, { collections }, categories] = await Promise.all([
    getRegion(countryCode),
    listCollections({
      fields: "id, handle, title",
    }),
    listCategories({
      fields: "id, name, handle, description",
    }),
  ])

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <CategoryBarCarousel
        categories={categories}
        countryCode={countryCode}
      />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
