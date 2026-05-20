import { Suspense, type ReactNode } from "react"
import { retrieveCustomer } from "@lib/data/customer"
// TODO: Re-add Toaster component when needed
import AccountLayout from "@modules/account/templates/account-layout"

async function AccountContent({
  dashboard,
  login,
}: {
  dashboard?: ReactNode
  login?: ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
      {/* TODO: Re-add Toaster component when needed */}
    </AccountLayout>
  )
}

export default function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: ReactNode
  login?: ReactNode
}) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AccountContent dashboard={dashboard} login={login} />
    </Suspense>
  )
}
