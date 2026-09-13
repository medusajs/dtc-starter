import { Metadata } from "next"
import PageBanner from "@modules/common/components/shared/page-banner"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we handle your data.",
}

export default async function PrivacyPage() {
  return (
    <div className="w-full">
      <PageBanner title="Privacy Policy" description="How we handle your data." />
      <div className="w-full flex justify-center px-8 py-12">
        <div className="max-w-3xl w-full">
          <p className="text-base-regular text-ui-fg-base">
            This is the privacy policy page. Content coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
