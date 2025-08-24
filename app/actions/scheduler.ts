"use server"

import { auth } from "@clerk/nextjs/server"
import { db, tasks as tasksTable, goals as goalsTable } from "@/lib/db"
import { eq, desc } from "drizzle-orm"
import { getUser } from "@/app/actions/user"
import { inferSuggestions } from "@/lib/metta/scheduler"

export async function getScheduleSuggestions() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, suggestions: [], error: "Unauthenticated" }

    const [taskRows, goalRows, userResult] = await Promise.all([
      db.select().from(tasksTable).where(eq(tasksTable.userId, userId)).orderBy(desc(tasksTable.createdAt)),
      db.select().from(goalsTable).where(eq(goalsTable.userId, userId)).orderBy(desc(goalsTable.createdAt)),
      getUser(),
    ])

    const tasks = taskRows.map((r: typeof tasksTable.$inferSelect) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      alignment_score: r.alignmentScore,
      alignment_category: r.alignmentCategory,
      completed: !!r.completed,
      goal_id: r.goalId ?? null,
      created_at: new Date(r.createdAt),
      updated_at: new Date(r.updatedAt),
    }))

    const goals = goalRows.map((r: typeof goalsTable.$inferSelect) => ({
      id: r.id,
      title: r.title || "",
      current_value: r.currentValue ?? 0,
      target_value: r.targetValue ?? 0,
      deadline: r.deadline ? new Date(r.deadline) : null,
    }))

    const user = userResult.success && userResult.user
      ? { userId, mission: userResult.user.mission || null, focusAreas: userResult.user.focusAreas || null, chronotype: "neutral" as const }
      : { userId, mission: null, focusAreas: null, chronotype: "neutral" as const }

    const suggestions = inferSuggestions({ user, tasks, goals, now: new Date() })

    // Attach task titles for convenience in UI
    const suggestionsWithTitles = suggestions.map((s) => {
      const t = tasks.find((x) => x.id === s.taskId)
      return { ...s, title: t?.title || `Task ${s.taskId}` }
    })

    return { success: true, suggestions: suggestionsWithTitles }
  } catch (error) {
    console.error("Failed to compute schedule suggestions:", error)
    return { success: false, suggestions: [], error: "Failed to compute schedule" }
  }
}

