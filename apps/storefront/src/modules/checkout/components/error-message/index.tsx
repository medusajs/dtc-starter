"use client"

import { useFormStatus } from "react-dom"

const ErrorMessage = ({ error, 'data-testid': dataTestid }: { error?: string | null, 'data-testid'?: string }) => {
  const { pending } = useFormStatus()
  // Clear stale content during a retry so identical failures produce a new alert update.
  const visibleError = pending ? null : error

  return (
    <div role="alert" aria-atomic="true" aria-busy={pending || undefined} className={visibleError ? "pt-2 text-rose-500 text-small-regular" : undefined} data-testid={dataTestid}>
      <span>{visibleError}</span>
    </div>
  )
}

export default ErrorMessage
