"use server"

import { auth } from "@clerk/nextjs/server"
import { db, tasks, valueSettings } from "@/lib/db"
import { eq, and, gte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { DEFAULT_RATES, calculateTaskValue, getDayLabel, getWeekStart, DAY_LABELS } from "@/lib/value"

type Rates = typeof DEFAULT_RATES

function centsToRates(row: typeof valueSettings.$inferSelect): Rates {
  return {
    design:    Math.round((row.designRateCents   ?? 20000) / 100),
    content:   Math.round((row.contentRateCents  ?? 18000) / 100),
    sales:     Math.round((row.salesRateCents    ?? 12000) / 100),
    strategic: Math.round((row.strategicRateCents ?? 13600) / 100),
    other:     Math.round((row.otherRateCents    ?? 10000) / 100),
  }
}

export async function getValueSettings(): Promise<{ success: boolean; rates: Rates }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, rates: DEFAULT_RATES }

    const rows = await db.select().from(valueSettings).where(eq(valueSettings.userId, userId))
    if (!rows.length) return { success: true, rates: DEFAULT_RATES }
    return { success: true, rates: centsToRates(rows[0]) }
  } catch {
    return { success: true, rates: DEFAULT_RATES }
  }
}

export async function updateValueSettings(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }

    const parse = (key: string, def: number) => {
      const v = formData.get(key)
      const n = parseInt(String(v), 10)
      return isNaN(n) ? def : n * 100 // convert dollars to cents
    }

    const values = {
      designRateCents:    parse("design", 200),
      contentRateCents:   parse("content", 180),
      salesRateCents:     parse("sales", 120),
      strategicRateCents: parse("strategic", 136),
      otherRateCents:     parse("other", 100),
      updatedAt: new Date(),
    }

    const existing = await db.select().from(valueSettings).where(eq(valueSettings.userId, userId))
    if (existing.length) {
      await db.update(valueSettings).set(values).where(eq(valueSettings.userId, userId))
    } else {
      await db.insert(valueSettings).values({ userId, ...values, createdAt: new Date() })
    }

    revalidatePath("/dashboard")
    revalidatePath("/profile")
    revalidatePath("/progress")
    return { success: true }
  } catch (error) {
    console.error("Failed to update value settings:", error)
    return { success: false, error: "Failed to save" }
  }
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

    const { rates } = await getValueSettings()
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
      const val = calculateTaskValue(task.alignmentScore, task.alignmentCategory, rates)
      dayMap.set(label, (dayMap.get(label) ?? 0) + val)
      weekTotal += val
    }

    // Effective rate: weekTotal / estimated hours worked (tasks × ~1hr each)
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

    const { rates } = await getValueSettings()

    const pendingTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.completed, false)))

    const total = pendingTasks.reduce((sum, t) =>
      sum + calculateTaskValue(t.alignmentScore, t.alignmentCategory, rates), 0)

    return { success: true, total }
  } catch {
    return { success: false, total: 0 }
  }
}
