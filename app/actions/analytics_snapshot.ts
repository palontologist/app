"use server"

import { auth } from "@clerk/nextjs/server"
import { db, tasks, goals, events } from "@/lib/db"
import { eq, desc } from "drizzle-orm"
import { getUser } from "@/app/actions/user"
import { generatePersonalizedInsights } from "@/lib/ai"

export async function getAnalyticsSnapshot() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }

    const [taskRows, goalRows, eventRows, userResult] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt)),
      db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt)),
      db.select().from(events).where(eq(events.userId, userId)).orderBy(desc(events.eventDate)),
      getUser(),
    ])

  const tasksMapped = taskRows.map((r: typeof tasks.$inferSelect) => ({
      id: r.id,
      user_id: r.userId,
      goal_id: r.goalId ?? null,
      title: r.title,
      description: r.description,
      alignment_score: r.alignmentScore,
      alignment_category: r.alignmentCategory,
      ai_analysis: r.aiAnalysis,
      completed: !!r.completed,
      completed_at: r.completedAt ? new Date(r.completedAt) : null,
      created_at: new Date(r.createdAt),
      updated_at: new Date(r.updatedAt),
    }))
  const goalsMapped = goalRows.map((r: typeof goals.$inferSelect) => ({
      id: r.id,
      user_id: r.userId,
      title: r.title,
      description: r.description,
      target_value: r.targetValue,
      current_value: r.currentValue,
      unit: r.unit,
      category: r.category,
      deadline: r.deadline ? new Date(r.deadline) : null,
      created_at: new Date(r.createdAt),
      updated_at: new Date(r.updatedAt),
    }))
  const eventsMapped = eventRows.map((r: typeof events.$inferSelect) => ({
      id: r.id,
      user_id: r.userId,
      title: r.title,
      event_date: new Date(r.eventDate).toISOString().split('T')[0],
      event_time: r.eventTime,
      event_type: r.eventType,
      description: r.description,
      created_at: new Date(r.createdAt),
    }))

    const mission = (userResult.success && userResult.user?.mission) ? userResult.user.mission : ''
    const insights = await generatePersonalizedInsights(tasksMapped as any, mission || '')

    return { success: true, tasks: tasksMapped, goals: goalsMapped, events: eventsMapped, user: userResult.user || null, insights }
  } catch (error) {
    console.error('Failed to build analytics snapshot:', error)
    return { success: false, error: 'Failed to load analytics' }
  }
}

export async function incrementGoalProgress(goalId: number, delta: number) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Unauthenticated' }
    if (!delta) return { success: false, error: 'Delta must be non-zero' }

    const existing = await db.select().from(goals).where(eq(goals.userId, userId)).where(eq(goals.id, goalId))
    if (!existing.length) return { success: false, error: 'Goal not found' }
    const goal = existing[0]
    const target = goal.targetValue
    const current = goal.currentValue || 0
    let newValue = current + delta
    if (newValue < 0) newValue = 0
    if (target != null && newValue > target) newValue = target

    const updated = await db.update(goals).set({ currentValue: newValue, updatedAt: new Date() }).where(eq(goals.id, goalId)).returning()
    return { success: true, goal: updated[0] }
  } catch (error) {
    console.error('Failed to increment goal progress:', error)
    return { success: false, error: 'Failed to increment goal progress' }
  }
}
