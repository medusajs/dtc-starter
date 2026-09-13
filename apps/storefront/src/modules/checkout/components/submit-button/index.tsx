"use client"

import { Button } from "@modules/common/components/ui"
import React from "react"
import { useFormStatus } from "react-dom"

export function SubmitButton({
  children,
  variant = "primary",
  size = "medium",
  className,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "transparent" | null
  size?: "small" | "medium" | "large"
  className?: string
  "data-testid"?: string
}) {
  const { pending } = useFormStatus()
  const [isLoading, setIsLoading] = React.useState(false)
  const loadingStartRef = React.useRef<number | null>(null)
  const timeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const MIN_LOADING_MS = 350

    if (pending) {
      loadingStartRef.current = performance.now()
      setIsLoading(true)
      return
    }

    if (!pending && isLoading && loadingStartRef.current !== null) {
      const elapsed = performance.now() - loadingStartRef.current
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)

      timeoutRef.current = window.setTimeout(() => {
        setIsLoading(false)
        loadingStartRef.current = null
      }, remaining)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [pending, isLoading])

  return (
    <Button
      size={size}
      className={className}
      type="submit"
      isLoading={isLoading}
      variant={variant || "primary"}
      data-testid={dataTestId}
    >
      {children}
    </Button>
  )
}
