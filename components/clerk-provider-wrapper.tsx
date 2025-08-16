"use client"

import React from "react"
import { ClerkProvider } from "@clerk/nextjs"

type Props = {
  children: React.ReactNode
  publishableKey?: string | null
}

export default function ClerkProviderWrapper({ children, publishableKey }: Props) {
  // If publishableKey is missing, avoid rendering ClerkProvider to prevent
  // the client-side library from throwing. Instead, render children and log
  // a warning so that deployments don't fail during static export.
  if (!publishableKey) {
    if (typeof window !== "undefined") {
      // client-side warning
      // eslint-disable-next-line no-console
      console.warn(
        "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Clerk UI will not be initialized."
      )
    }
    return <>{children}</>
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
}
