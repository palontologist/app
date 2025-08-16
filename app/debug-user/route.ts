"use server"

import { auth } from "@clerk/nextjs/server"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

// This is a debug endpoint to check the current user's profile data
export async function GET() {
  try {
    const session = await auth()
    const userId = session.userId
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    // Get the raw profile data directly from DB
    const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    
    // Return the raw profile data for inspection
    return NextResponse.json({
      userId,
      profileFound: rows.length > 0,
      profile: rows[0] || null,
      // Include additional debug info
      debug: {
        mission: rows[0]?.mission,
        missionType: rows[0]?.mission ? typeof rows[0].mission : null,
        worldVision: rows[0]?.worldVision,
        worldVisionType: rows[0]?.worldVision ? typeof rows[0].worldVision : null
      }
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ error: "Failed to get profile data" }, { status: 500 })
  }
}