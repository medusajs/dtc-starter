"use client"

import { usePathname } from "next/navigation"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const AccountLink = () => {
  const pathname = usePathname()
  const isActive = pathname?.includes("/account")

  return (
    <LocalizedClientLink
      href="/account"
      className={clx(
        "inline-flex items-center justify-center w-8 h-8 rounded-full border border-ui-border-base text-ui-fg-subtle transition-all duration-150 hover:text-ui-fg-base hover:bg-ui-bg-base-hover",
        isActive && "bg-ui-bg-base-hover text-ui-fg-base border-ui-border-strong"
      )}
      data-testid="nav-account-link"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </LocalizedClientLink>
  )
}

export default AccountLink
