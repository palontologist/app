import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    
    return NextResponse.json({
      userId,
      profileCount: profiles.length,
      profile: profiles[0] || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Debug route error:", error)
    return NextResponse.json({ 
      error: "Database error", 
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}