import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AccountLink from "@modules/layout/components/account-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-2 small:top-3.5 z-50 w-full max-w-7xl mx-auto px-4 small:px-6 large:px-8 pointer-events-none mb-2 small:mb-4 group">
      <header className="relative bg-white border border-ui-border-base rounded-3xl lg:rounded-full shadow-elevation-card-rest pointer-events-auto transition-all duration-200">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-12 small:h-14 text-small-regular">
          <div className="flex-1 basis-0 flex items-center">
            <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="text-sm small:text-lg font-extrabold hover:text-ui-fg-base uppercase tracking-tight"
              data-testid="nav-store-link"
            >
              Medusa Store
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6">
              <AccountLink />
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
