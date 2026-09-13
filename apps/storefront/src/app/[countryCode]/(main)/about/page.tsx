import { Metadata } from "next"
import PageBanner from "@modules/common/components/shared/page-banner"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about our store.",
}

export default async function AboutPage() {
  return (
    <div className="w-full">
      <PageBanner title="About Us" description="Learn more about our store." />
      <div className="w-full flex justify-center px-8 py-12">
        <div className="max-w-3xl w-full">
          <p className="text-base-regular text-ui-fg-base">
            This is the about page. Content coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
