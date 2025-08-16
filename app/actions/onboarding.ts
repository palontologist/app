"use server"

import { auth } from "@clerk/nextjs/server"
import { db, userProfiles, goals, tasks, events, now } from "@/lib/db"
import { eq, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

function parseFocusAreas(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10)
}

export type CompleteOnboardingResult = {
  success: boolean
  redirect?: string
  error?: string
}

export async function completeOnboarding(formData: FormData): Promise<CompleteOnboardingResult> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Not authenticated" }

    console.log('Starting onboarding for user:', userId)

    const name = (formData.get("name") as string) || null
    const mission = (formData.get("mission") as string) || null
    const worldVision = (formData.get("worldVision") as string) || null
    const focusAreasRaw = (formData.get("focusAreas") as string) || null
    const focusAreas = parseFocusAreas(focusAreasRaw)

    console.log('Onboarding data:', { name, mission, worldVision, focusAreas })

    await db.transaction(async (tx) => {
      // Upsert user profile
      const existing = await tx.select().from(userProfiles).where(eq(userProfiles.userId, userId))
      console.log('Existing profile:', existing.length > 0 ? 'found' : 'not found')
      
      if (existing.length === 0) {
        console.log('Creating new profile...')
        await tx.insert(userProfiles).values({
          userId,
          name,
          mission,
          worldVision,
          focusAreas: focusAreas.join(", "),
          onboarded: true,
          updatedAt: new Date(),
        })
      } else {
        console.log('Updating existing profile...')
        await tx
          .update(userProfiles)
          .set({
            name,
            mission,
            worldVision,
            focusAreas: focusAreas.join(", "),
            onboarded: true,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, userId))
      }

      // Ensure mission goal exists
      if (mission) {
        const missionGoal = await tx
          .select({ id: goals.id })
          .from(goals)
          .where(and(eq(goals.userId, userId), sql`lower(${goals.title}) = lower(${mission})`))
          .limit(1)
        if (missionGoal.length === 0) {
          await tx.insert(goals).values({
            userId,
            title: mission,
            description: "North Star Mission",
            category: "professional",
            currentValue: 0,
            targetValue: null,
            unit: null,
            deadline: null,
            updatedAt: new Date(),
          })
        }
      }

      // Create goals for focus areas if missing
      for (const area of focusAreas) {
        const exists = await tx
          .select({ id: goals.id })
          .from(goals)
          .where(and(eq(goals.userId, userId), sql`lower(${goals.title}) = lower(${area})`))
          .limit(1)
        if (exists.length === 0) {
          await tx.insert(goals).values({
            userId,
            title: area,
            description: `Goal derived from focus area: ${area}`,
            category: "other",
            currentValue: 0,
            targetValue: null,
            unit: null,
            deadline: null,
            updatedAt: new Date(),
          })
        }
      }

      // Seed starter tasks (1 per focus area)
      for (const area of focusAreas) {
        const goalRow = await tx
          .select({ id: goals.id })
            .from(goals)
          .where(and(eq(goals.userId, userId), sql`lower(${goals.title}) = lower(${area})`))
          .limit(1)
        if (!goalRow.length) continue
        const starterTitle = `First step for: ${area}`
        const duplicate = await tx
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.userId, userId), sql`lower(${tasks.title}) = lower(${starterTitle})`))
          .limit(1)
        if (duplicate.length === 0) {
          await tx.insert(tasks).values({
            userId,
            goalId: goalRow[0].id,
            title: starterTitle,
            description: `Identify and execute the first concrete action toward ${area}.`,
            alignmentCategory: "high",
            completed: false,
            aiAnalysis: null,
            updatedAt: new Date(),
          })
        }
      }

      // Log onboarding event
      await tx.insert(events).values({
        userId,
        title: "User onboarded",
        eventDate: new Date(),
        eventType: "onboarding",
        metadata: JSON.stringify({ focusAreas, hasMission: !!mission }),
      })
    })

    // Verify profile was created/updated
    const finalProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    console.log('Final profile after transaction:', finalProfile[0])

    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, redirect: "/dashboard" }
  } catch (error) {
    console.error("completeOnboarding error", error)
    return { success: false, error: "Failed to complete onboarding" }
  }
}
