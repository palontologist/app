"use server"

import { auth } from "@clerk/nextjs/server"
import { db, tasks } from "@/lib/db"
import { and, eq, gte } from "drizzle-orm"
import { DAY_LABELS, getDayLabel, getWeekStart } from "@/lib/value"

// Value settings removed: task value is now AI-estimated per task and stored in tasks.estimated_value_cents.
export async function getValueSettings(): Promise<{ success: boolean; rates: Record<string, number> }> {
  return { success: true, rates: { ai: 1 } }
}

export async function updateValueSettings() {
  return { success: false, error: "Value settings removed" }
}

export async function getGeneratedValueByDay(): Promise<{
  success: boolean
  data: { day: string; value: number }[]
  weekTotal: number
  effectiveRate: number
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, data: [], weekTotal: 0, effectiveRate: 0 }

    const weekStart = getWeekStart()

    const completedTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.completed, true), gte(tasks.completedAt, weekStart)))

    const dayMap = new Map<string, number>()
    for (const day of DAY_LABELS) dayMap.set(day, 0)

    let weekTotal = 0
    for (const task of completedTasks) {
      if (!task.completedAt) continue
      const label = getDayLabel(new Date(task.completedAt))
      const val = Math.round((task.estimatedValueCents ?? 0) / 100)
      dayMap.set(label, (dayMap.get(label) ?? 0) + val)
      weekTotal += val
    }

    // Effective rate: avg value per completed task this week
    const effectiveRate = completedTasks.length > 0
      ? Math.round(weekTotal / completedTasks.length)
      : 0

    const data = DAY_LABELS.map((day) => ({ day, value: dayMap.get(day) ?? 0 }))

    return { success: true, data, weekTotal, effectiveRate }
  } catch (error) {
    console.error("getGeneratedValueByDay error:", error)
    return { success: false, data: [], weekTotal: 0, effectiveRate: 0 }
  }
}

export async function getPotentialValue(): Promise<{ success: boolean; total: number }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, total: 0 }

    const pendingTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.completed, false)))

    const total = pendingTasks.reduce((sum, t) => sum + Math.round((t.estimatedValueCents ?? 0) / 100), 0)

    return { success: true, total }
  } catch {
    return { success: false, total: 0 }
  }
}
