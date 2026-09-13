import { Metadata } from "next"
import PageBanner from "@modules/common/components/shared/page-banner"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with our team.",
}

export default async function ContactPage() {
  return (
    <div className="w-full">
      <PageBanner title="Contact Us" description="Get in touch with our team." />
      <div className="w-full flex justify-center px-8 py-12">
        <div className="max-w-3xl w-full">
          <p className="text-base-regular text-ui-fg-base">
            This is the contact page. Content coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
