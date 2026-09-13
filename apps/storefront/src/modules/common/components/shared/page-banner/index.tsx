"use client"

import { useRouter } from "next/navigation"

type PageBannerProps = {
  title: string
  description?: string
  badge?: string
  onBack?: () => void
  actions?: React.ReactNode
  backLabel?: string
  themeColor?: "blue" | "indigo" | "emerald" | "rose" | "amber" | "slate"
}

const lightBannerBg = {
  blue: "bg-gradient-to-br from-blue-200/90 via-blue-100/75 to-blue-50/85 border-blue-300/80",
  indigo: "bg-gradient-to-br from-indigo-200/90 via-indigo-100/75 to-indigo-50/85 border-indigo-300/80",
  emerald: "bg-gradient-to-br from-emerald-200/90 via-emerald-100/75 to-emerald-50/85 border-emerald-300/80",
  rose: "bg-gradient-to-br from-rose-200/90 via-rose-100/75 to-rose-50/85 border-rose-300/80",
  amber: "bg-gradient-to-br from-amber-200/90 via-amber-100/75 to-amber-50/85 border-amber-300/80",
  slate: "bg-gradient-to-br from-slate-200/90 via-slate-100/80 to-slate-50/90 border-slate-300/90",
}

const PageBanner = ({
  title,
  description,
  badge,
  onBack,
  actions,
  backLabel = "Home",
  themeColor = "blue",
}: PageBannerProps) => {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push("/")
    }
  }

  const bannerBg = lightBannerBg[themeColor] || lightBannerBg.blue

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 text-xs text-ui-fg-subtle px-1 select-none">
        <button
          onClick={handleBack}
          className="hover:text-ui-fg-base transition flex items-center gap-1 cursor-pointer font-semibold bg-transparent border-none p-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>
        <span>/</span>
        <span className="text-ui-fg-base font-extrabold">{title}</span>
      </div>

      <div className={`relative w-full py-6 sm:py-8 px-4 sm:px-8 ${bannerBg} rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden`}>
        <div className="max-w-3xl mx-auto relative z-10 text-center space-y-4">
          {badge && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-ui-bg-base border border-ui-border-base shadow-xs text-ui-fg-base select-text">
              <span>{badge}</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-ui-fg-base select-text">
            {title}
          </h1>

          {description && (
            <p className="text-xs sm:text-sm text-ui-fg-subtle font-medium max-w-2xl mx-auto leading-relaxed select-text">
              {description}
            </p>
          )}

          {actions && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 select-none">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageBanner
