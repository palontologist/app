"use server"

import { auth } from "@clerk/nextjs/server"
import { db, userProfiles, now } from "@/lib/db"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Shape returned to client (camelCase)
function mapProfile(row: typeof userProfiles.$inferSelect | undefined) {
  if (!row) return null
  
  // Make sure mission and worldVision are properly cast to strings if they exist
  const mission = row.mission ? String(row.mission) : null;
  const worldVision = row.worldVision ? String(row.worldVision) : null;
  
  return {
    userId: row.userId,
    name: row.name,
    mission,
    worldVision,
    focusAreas: row.focusAreas,
    onboarded: Boolean(row.onboarded),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

export async function getUser() {
  try {
    const session = await auth()
    const userId = session.userId
    
    if (!userId) {
      return { success: false, error: "Unauthenticated", user: null }
    }
    
    const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    
    if (rows.length > 0) {
      const mappedProfile = mapProfile(rows[0])
      return { success: true, user: mappedProfile }
    } else {
      return { success: true, user: null }
    }
  } catch (error) {
    console.error("Failed to get user:", error)
    return { success: false, error: "Failed to load user", user: null }
  }
}

export async function updateUser(formData: FormData) {
  try {
    const session = await auth()
    const userId = session.userId
    if (!userId) return { success: false, error: "Unauthenticated" }

    const name = (formData.get("name") as string) || null
    const mission = (formData.get("mission") as string) || null
    const worldVision = (formData.get("worldVision") as string) || null
    const focusAreas = (formData.get("focusAreas") as string) || null

    const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    const timestamp = new Date()
    if (existing.length === 0) {
      await db.insert(userProfiles).values({
        userId,
        name,
        mission,
        worldVision,
        focusAreas,
        onboarded: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    } else {
      await db
        .update(userProfiles)
        .set({ name, mission, worldVision, focusAreas, onboarded: true, updatedAt: timestamp })
        .where(eq(userProfiles.userId, userId))
    }

    const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, user: mapProfile(rows[0]) }
  } catch (error) {
    console.error("Failed to update user:", error)
    return { success: false, error: "Failed to update user" }
  }
}
