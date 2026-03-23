"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { usePathname, useSearchParams } from "next/navigation"
import * as React from "react"

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
const isPostHogEnabled = Boolean(posthogKey)
let hasWarnedMissingPostHogKey = false

// Initialise once on the client
if (typeof window !== "undefined") {
  if (isPostHogEnabled) {
    posthog.init(posthogKey as string, {
      api_host: posthogHost,
      capture_pageview: false, // we do it manually below for Next.js App Router
      capture_pageleave: true,
      persistence: "localStorage",
    })
  } else if (!hasWarnedMissingPostHogKey) {
    hasWarnedMissingPostHogKey = true
    // eslint-disable-next-line no-console
    console.warn("Missing NEXT_PUBLIC_POSTHOG_KEY. PostHog analytics is disabled.")
  }
}

// ── Page-view tracker (must be inside Suspense in Next.js App Router) ──────────
function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  React.useEffect(() => {
    if (!isPostHogEnabled) return
    if (!pathname) return
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "")
    ph.capture("$pageview", { $current_url: url })
  }, [pathname, searchParams, ph])

  return null
}

// ── Main provider ─────────────────────────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!isPostHogEnabled) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <React.Suspense fallback={null}>
        <PageViewTracker />
      </React.Suspense>
      {children}
    </PHProvider>
  )
}
