import { Metadata } from "next"
import { Suspense } from "react"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 16 and Medusa.",
}

async function HomeContent({ params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) return null

  return (
    <>
      <Hero />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}

export default function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <HomeContent params={props.params} />
    </Suspense>
  )
}
