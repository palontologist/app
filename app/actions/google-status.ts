"use server"

import { auth } from "@clerk/nextjs/server"
import { db, googleAccounts } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function getGoogleConnectionStatus() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthenticated" }
    }

    const rows = await db.select().from(googleAccounts).where(eq(googleAccounts.userId, userId))
    
    if (rows.length === 0) {
      return { 
        success: true, 
        connected: false, 
        email: null 
      }
    }

    const account = rows[0]
    return {
      success: true,
      connected: !!account.refreshToken,
      email: account.email,
      scope: account.scope,
      lastUpdated: account.updatedAt,
    }
  } catch (error) {
    console.error("Failed to get Google connection status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check connection status",
    }
  }
}