"use server"

import { auth } from "@clerk/nextjs/server"
import { db, tasks, workSessions, now, goals, userProfiles } from "@/lib/db"
import { eq, and, desc, sql, ilike } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { analyzeTaskAlignment } from "@/lib/ai"
import { saveHistoricalAlignmentData } from "@/app/actions/analytics"

function mapTask(row: typeof tasks.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
  goal_id: row.goalId ?? null,
    title: row.title,
    description: row.description,
    alignment_score: row.alignmentScore,
    alignment_category: row.alignmentCategory,
    ai_analysis: row.aiAnalysis,
    completed: !!row.completed,
    completed_at: row.completedAt ? new Date(row.completedAt) : null,
    created_at: new Date(row.createdAt),
    updated_at: new Date(row.updatedAt),
  }
}

export async function getTasks() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, tasks: [], error: "Unauthenticated" }
    const rows = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt))
    return { success: true, tasks: rows.map(mapTask) }
  } catch (error) {
    console.error("Failed to get tasks:", error)
    return { success: false, tasks: [] }
  }
}

export async function createTask(formDataOrTitle: FormData | string, descriptionArg?: string, _userId?: number, alignmentCategoryArg?: string, goalIdArg?: number) {
  try {
    // Handle both FormData and direct string input
    let title: string = '';
    let description: string | null = null;
    let alignmentCategory: string | null = null;
    let goalId: number | null = null;
    let missionPillar: string | null = null;
    let impactStatement: string | null = null;
    
    if (formDataOrTitle instanceof FormData) {
      // Extract values from FormData
      const titleValue = formDataOrTitle.get('title');
      title = typeof titleValue === 'string' ? titleValue : '';

      const descValue = formDataOrTitle.get('description');
      description = typeof descValue === 'string' ? descValue : null;

      const alignmentValue = formDataOrTitle.get('alignmentCategory');
      alignmentCategory = typeof alignmentValue === 'string' ? alignmentValue : 'medium';
      const goalValue = formDataOrTitle.get('goalId');
      if (typeof goalValue === 'string' && goalValue) {
        const parsed = parseInt(goalValue, 10)
        goalId = Number.isNaN(parsed) ? null : parsed
      }

      const pillarValue = formDataOrTitle.get('missionPillar');
      missionPillar = typeof pillarValue === 'string' ? pillarValue : null;

      const impactValue = formDataOrTitle.get('impactStatement');
      impactStatement = typeof impactValue === 'string' ? impactValue : null;
    } else {
      // Direct string parameters
      title = String(formDataOrTitle || '');
      description = descriptionArg || null;
      alignmentCategory = alignmentCategoryArg || 'medium';
      goalId = typeof goalIdArg === 'number' ? goalIdArg : null;
    }
    
    const { userId } = await auth()
    if (!userId) return { success: false, task: null, error: "Unauthenticated" }
    // Ensure title is a string before using trim()
    if (!title || !String(title).trim()) return { success: false, task: null, error: "Title required" }

    // If no explicit goalId provided, attempt to auto-link by heuristic: find a goal whose title appears in the task title (case-insensitive)
    if (!goalId) {
      try {
        const userGoals: { id: number; title: string | null }[] = await db
          .select({ id: goals.id, title: goals.title })
          .from(goals)
          .where(eq(goals.userId, userId))
        const taskTitleLower = title.toLowerCase()
        // Simple containment match, prefer longest matching goal title
        const matches: { id: number; title: string | null }[] = userGoals.filter(
          (g: { id: number; title: string | null }) => g.title && taskTitleLower.includes(g.title.toLowerCase()),
        )
        if (matches.length) {
          matches.sort(
            (a: { id: number; title: string | null }, b: { id: number; title: string | null }) =>
              (b.title?.length || 0) - (a.title?.length || 0),
          )
          goalId = matches[0].id
        }
      } catch (e) {
        console.warn('Auto goal-link heuristic failed:', e)
      }
    }
    // Get user profile for AI analysis
    const userProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))

    // Perform AI alignment analysis
    let aiAnalysis = null
    let alignmentScore = 50
    let aiSuggestions = null

    // Use user-provided values as fallbacks, but let AI override with better suggestions
    let finalMissionPillar = missionPillar
    let finalImpactStatement = impactStatement

    try {
      const analysis = await analyzeTaskAlignment(
        String(title).trim(),
        description || "",
        userProfile[0]?.mission || "",
        userProfile[0]?.worldVision || "",
        userProfile[0]?.missionPillars ? JSON.parse(userProfile[0].missionPillars) : undefined
      )

      aiAnalysis = analysis.analysis
      alignmentScore = analysis.alignment_score || 50
      alignmentCategory = analysis.alignment_category || "medium"
      aiSuggestions = analysis.suggestions

      // Only use AI suggestions if user didn't provide values
      if (!finalMissionPillar && analysis.mission_pillar) {
        finalMissionPillar = analysis.mission_pillar
      }
      if (!finalImpactStatement && analysis.impact_statement) {
        finalImpactStatement = analysis.impact_statement
      }
    } catch (error) {
      console.error("AI analysis failed:", error)
      aiAnalysis = "Unable to analyze alignment at this time."
    }

    const inserted = await db.insert(tasks).values({
      userId,
      title: String(title).trim(),
      description: description || null,
      goalId: goalId,
      alignmentScore: alignmentScore,
      alignmentCategory: alignmentCategory,
      aiAnalysis: aiAnalysis,
      missionPillar: finalMissionPillar,
      impactStatement: finalImpactStatement,
      aiSuggestions: aiSuggestions,
      completed: false,
      updatedAt: new Date(),
    }).returning()
    revalidatePath("/dashboard")

    // Save historical alignment data when task is created
    try {
      await saveHistoricalAlignmentData()
    } catch (error) {
      console.warn("Failed to save historical data:", error)
    }

    return { success: true, task: mapTask(inserted[0]) }
  } catch (error) {
    console.error("Failed to create task:", error)
    return { success: false, task: null }
  }
}

export async function toggleTaskCompletion(taskId: number) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, task: null, error: "Unauthenticated" }
    const existing = await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
    if (!existing.length) return { success: false, task: null, error: "Not found" }
    const task = existing[0]
    const completed = !task.completed
  const timestamp = new Date()
    const updated = await db
      .update(tasks)
      .set({
        completed,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
      .returning()
    // If this task is linked to a goal, update the goal's currentValue accordingly.
    try {
      const updatedTask = updated[0]
      if (updatedTask.goalId) {
        // When marking complete -> increment by 1, when un-completing -> decrement by 1 (but not below 0)
        if (completed) {
          await db.update(goals).set({
            currentValue: sql`coalesce(${goals.currentValue}, 0) + 1`,
            updatedAt: timestamp,
          }).where(and(eq(goals.userId, userId), eq(goals.id, updatedTask.goalId)))
        } else {
          // decrement but ensure non-negative
          await db.update(goals).set({
            currentValue: sql`max(coalesce(${goals.currentValue}, 0) - 1, 0)`,
            updatedAt: timestamp,
          }).where(and(eq(goals.userId, userId), eq(goals.id, updatedTask.goalId)))
        }
      }
    } catch (e) {
      console.warn("Failed to update associated goal progress:", e)
    }

    revalidatePath("/dashboard")
    revalidatePath("/impact")

    // Save historical alignment data when task is completed
    if (completed) {
      try {
        await saveHistoricalAlignmentData()
      } catch (error) {
        console.warn("Failed to save historical data:", error)
      }
    }

    return { success: true, task: mapTask(updated[0]) }
  } catch (error) {
    console.error("Failed to toggle task completion:", error)
    return { success: false, task: null }
  }
}

export async function deleteTask(taskId: number) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }
    await db.delete(tasks).where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete task:", error)
    return { success: false }
  }
}

// Notes placeholders (no notes table yet)
export async function addTaskNote() {
  return { success: false, error: "Notes not implemented" }
}
export async function getTaskNotes() {
  return { success: true, notes: [] }
}

// Timer functionality using in-memory fallback. For persistence you'd add a timer table.
let activeTimer: { userId: string; taskId: number; startTime: number } | null = null

// Updated timer APIs to match client usage and return consistent payloads
export async function getActiveTimer(_taskId?: number) {
  const { userId } = await auth()
  if (!userId) return { success: false }
  if (activeTimer && activeTimer.userId === userId) {
    return { success: true, timer: { ...activeTimer } }
  }
  return { success: true, timer: null }
}

export async function startTaskTimer(taskId: number) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated" }
  activeTimer = { userId, taskId, startTime: Date.now() }
  return { success: true, timer: { ...activeTimer } }
}

export async function stopTaskTimer(taskId: number, minutesOverride?: number, _complete?: boolean) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated" }
  if (!activeTimer || activeTimer.userId !== userId || activeTimer.taskId !== taskId) {
    return { success: false, error: "No active timer" }
  }
  const duration = typeof minutesOverride === "number" && minutesOverride >= 0
    ? Math.round(minutesOverride)
    : Math.round((Date.now() - activeTimer.startTime) / 60000)
  if (duration > 0) {
    await db.insert(workSessions).values({
      userId,
      taskId,
      durationMinutes: duration,
      alignmentCategory: null,
      startedAt: new Date(activeTimer.startTime),
    })
  }
  const stopped = { ...activeTimer }
  activeTimer = null
  revalidatePath("/dashboard")
  return { success: true, timer: stopped, durationMinutes: duration }
}
