import { Metadata } from "next"
import PageBanner from "@modules/common/components/shared/page-banner"

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions for using our store.",
}

export default async function TermsPage() {
  return (
    <div className="w-full">
      <PageBanner title="Terms and Conditions" description="Terms and conditions for using our store." />
      <div className="w-full flex justify-center px-8 py-12">
        <div className="max-w-3xl w-full">
          <p className="text-base-regular text-ui-fg-base">
            This is the terms and conditions page. Content coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
