"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { usePathname, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import * as React from "react"

// Initialise once on the client
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false, // we do it manually below for Next.js App Router
    capture_pageleave: true,
    persistence: "localStorage",
  })
}

// ── Page-view tracker (must be inside Suspense in Next.js App Router) ──────────
function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  React.useEffect(() => {
    if (!pathname) return
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "")
    ph.capture("$pageview", { $current_url: url })
  }, [pathname, searchParams, ph])

  return null
}

// ── Auto-identify logged-in Clerk users in PostHog ────────────────────────────
function UserIdentifier() {
  const { user, isLoaded } = useUser()
  const ph = usePostHog()

  React.useEffect(() => {
    if (!isLoaded) return
    if (user) {
      ph.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        createdAt: user.createdAt,
      })
    } else {
      ph.reset()
    }
  }, [user, isLoaded, ph])

  return null
}

// ── Main provider ─────────────────────────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <React.Suspense fallback={null}>
        <PageViewTracker />
      </React.Suspense>
      <UserIdentifier />
      {children}
    </PHProvider>
  )
}
