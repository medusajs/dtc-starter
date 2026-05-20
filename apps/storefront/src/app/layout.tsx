import { type ReactNode } from "react"
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en" data-mode="light" data-scroll-behavior="smooth">
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
