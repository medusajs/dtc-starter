import { Metadata } from "next"
import PageBanner from "@modules/common/components/shared/page-banner"

export const metadata: Metadata = {
  title: "Returns Policy",
  description: "Our returns and exchange policy.",
}

export default async function ReturnsPage() {
  return (
    <div className="w-full">
      <PageBanner title="Returns Policy" description="Our returns and exchange policy." />
      <div className="w-full flex justify-center px-8 py-12">
        <div className="max-w-3xl w-full">
          <p className="text-base-regular text-ui-fg-base">
            This is the returns policy page. Content coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
