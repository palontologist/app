import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log('Manual profile creation for user:', userId)

    // Check if profile exists
    const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    
    if (existing.length > 0) {
      return NextResponse.json({ 
        message: "Profile already exists", 
        profile: existing[0] 
      })
    }

    // Create basic profile
    const inserted = await db.insert(userProfiles).values({
      userId,
      name: "Test User",
      mission: "Test Mission", 
      worldVision: "Test Vision",
      focusAreas: "Test Focus",
      onboarded: true,
      updatedAt: new Date(),
    }).returning()

    console.log('Created profile:', inserted[0])

    return NextResponse.json({
      message: "Profile created successfully",
      profile: inserted[0]
    })
  } catch (error) {
    console.error("Manual profile creation error:", error)
    return NextResponse.json({ 
      error: "Database error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}