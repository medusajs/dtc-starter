"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini, House, ShoppingBag, User, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx, Text } from "@modules/common/components/ui"
import { Fragment } from "react"
import { usePathname } from "next/navigation"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"

const SideMenuItems = {
  Home: { href: "/", icon: House },
  Store: { href: "/store", icon: ShoppingBag },
  Account: { href: "/account", icon: User },
  Cart: { href: "/cart", icon: ShoppingBag },
}

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const pathname = usePathname()

  const isActive = (path: string) => {
    const segments = pathname?.split("/")
    const normalizedPathname = segments?.length && segments.length > 1
      ? "/" + segments.slice(2).join("/")
      : "/"

    if (path === "/" && normalizedPathname === "/") return true
    if (path !== "/" && normalizedPathname?.startsWith(path)) return true
    return false
  }

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              {open && (
                <div
                  className="fixed inset-0 bg-black/50 z-[48] lg:hidden pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className={clx(
                    "lg:hidden w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-150 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive",
                    open
                      ? "border-theme-active text-theme-on-accent bg-theme-lighter dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800"
                      : "border-transparent text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover"
                  )}
                >
                  {open ? <XMark /> : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  )}
                </Popover.Button>
              </div>

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                  <PopoverPanel className="absolute top-full left-0 right-0 mt-2 px-4 sm:px-6 z-[50] lg:hidden pointer-events-auto">
                  <div
                    data-testid="nav-menu-popup"
                    className="bg-white border border-ui-border-base rounded-3xl p-4 space-y-3 max-h-[85vh] overflow-y-auto shadow-2xl shadow-slate-900/10 dark:shadow-black/40"
                  >
                    <div className="flex justify-end" id="xmark">
                      <button data-testid="close-menu-button" onClick={close}>
                        <XMark />
                      </button>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {Object.entries(SideMenuItems).map(([name, { href, icon: Icon }]) => {
                        const active = isActive(href)
                        return (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              className={clx(
                                "w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition",
                                active
                                  ? "bg-theme-lighter text-white font-bold dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800"
                                  : "text-ui-fg-subtle hover:bg-ui-bg-base-hover hover:text-ui-fg-base"
                              )}
                              onClick={close}
                              data-testid={`${name.toLowerCase()}-link`}
                            >
                              <Icon className={clx(
                                "w-4 h-4",
                                active
                                  ? "text-white dark:text-blue-400"
                                  : "text-ui-fg-muted"
                              )} />
                              <span>{name}</span>
                            </LocalizedClientLink>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="flex flex-col gap-y-2 pt-2 border-t border-subtle">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between items-center"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150 text-ui-fg-subtle",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between items-center"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150 text-ui-fg-subtle",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small">
                        © {new Date().getFullYear()} Medusa Store. All rights
                        reserved.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
