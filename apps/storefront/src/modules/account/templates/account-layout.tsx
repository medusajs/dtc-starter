import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"
import PageBanner from "@modules/common/components/shared/page-banner"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div data-testid="account-page">
      <PageBanner
        title={customer ? `Hello ${customer.first_name}` : "Account"}
        description={
          customer
            ? `Signed in as ${customer.email}`
            : "Please login or sign up to continue"
        }
        backLabel="Home"
        themeColor="blue"
      />
      <div className="content-container bg-white flex flex-col">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] py-12 gap-6">
            {customer && (
              <div>
                <div className="bg-white border border-ui-border-base rounded-3xl p-3 sm:p-4 shadow-elevation-card-rest">
                  <AccountNav customer={customer} />
                </div>
              </div>
            )}
            <div className="flex-1">{children}</div>
          </div>
          <div className="flex flex-col small:flex-row items-end justify-between small:border-t border-gray-200 py-12 gap-8">
            <div>
              <h3 className="text-xl-semi mb-4">Got questions?</h3>
              <span className="txt-medium">
                You can find frequently asked questions and answers on our
                customer service page.
              </span>
            </div>
            <div>
              <UnderlineLink href="/customer-service">
                Customer Service
              </UnderlineLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
