"use server"

import { auth } from "@clerk/nextjs/server"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// This endpoint forces an update to the user's mission and worldVision
// to fix any issues with the North Star display
export async function GET(request: Request) {
  try {
    const session = await auth()
    const userId = session.userId
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    // Get the current mission from the URL parameters
    const url = new URL(request.url)
    const mission = url.searchParams.get('mission') || "Empower founders to ship mission aligned work every day."
    const worldVision = url.searchParams.get('worldVision') || "A world built on empowerment, innovation, and creativity."
    
    // Update the profile
    const timestamp = new Date()
    const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    
    if (existing.length === 0) {
      await db.insert(userProfiles).values({
        userId,
        name: "User",
        mission,
        worldVision,
        focusAreas: null,
        onboarded: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    } else {
      await db
        .update(userProfiles)
        .set({ 
          mission, 
          worldVision,
          updatedAt: timestamp 
        })
        .where(eq(userProfiles.userId, userId))
    }
    
    // Get the updated profile
    const updatedRows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    
    // Revalidate the dashboard path to refresh the cache
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      message: "Profile updated. You can now go back to the dashboard.",
      before: existing[0] || null,
      after: updatedRows[0] || null,
      dashboardUrl: "/dashboard"
    })
  } catch (error) {
    console.error("Force update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}