"use server"

import { auth } from "@clerk/nextjs/server"
import { db, tasks, goals, events, dashboardInsights, alignmentHistory } from "@/lib/db"
import { eq, desc, and, sql } from "drizzle-orm"
import { getUser } from "@/app/actions/user"
import { generatePersonalizedInsights } from "@/lib/ai"
// Backward-compatible export for impact pages expecting this function
export async function getRealisticMetrics() {
  // Provide a minimal structure compatible with callers expecting { success, metrics }
  try {
    // Reuse goals/tasks to derive a few simple default metrics
    const snap = await getAnalyticsSnapshot()
    if (!snap || !('success' in snap) || !snap.success) return { success: true, metrics: {} }

    // naive defaults so UI renders without error
    const completedTasks = (snap.tasks || []).filter((t: any) => t.completed).length
    const totalTasks = (snap.tasks || []).length || 1
    const weeklyCompletionRate = Math.round((completedTasks / totalTasks) * 100)
    const impactHours = 0
    const metrics: any = {
      weekly_completion_rate: {
        id: null,
        title: "Weekly Completion Rate",
        current: weeklyCompletionRate,
        target: 100,
        unit: "%",
        description: "Completed tasks over total tasks this week",
        calculation: "completed / total * 100",
        category: "derived",
        editable: false,
        deletable: false,
      },
      impact_work_hours: {
        id: null,
        title: "Impact Work Hours",
        current: impactHours,
        target: 10,
        unit: "hours",
        description: "Logged impact-focused work sessions",
        calculation: "sum(session minutes) / 60",
        category: "derived",
        editable: false,
        deletable: false,
      },
    }
    return { success: true, metrics }
  } catch {
    return { success: true, metrics: {} }
  }
}

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
  // Filter out North Star goal from analytics set
  const missionTitle = (userResult.success && userResult.user?.mission) ? String(userResult.user.mission) : null
  const filteredGoalRows = goalRows.filter((r: typeof goals.$inferSelect) => {
    if (!missionTitle) return true
    const title = (r.title || '').toLowerCase().trim()
    const mission = missionTitle.toLowerCase().trim()
    const desc = (r.description || '').toLowerCase()
    if (title === mission) return false
    if (desc.includes('north star')) return false
    return true
  })
  const goalsMapped = filteredGoalRows.map((r: typeof goals.$inferSelect) => ({
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

// Provide 7-day alignment chart data similar to mock shown in the design
export async function getAlignmentChartData() {
  try {
    const { userId } = await auth()
    if (!userId) return []

    // Load last 14 days to be safe and then slice to 7
    const since = new Date()
    since.setDate(since.getDate() - 14)

    const taskRows = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt))

    // Bucket by day label
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const today = new Date()
    const days: { label: string; dateKey: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const label = dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1]
      const dateKey = d.toISOString().slice(0, 10)
      days.push({ label, dateKey })
    }

    const byDate: Record<string, { aligned: number; distraction: number; total: number }> = {}
    for (const d of days) byDate[d.dateKey] = { aligned: 0, distraction: 0, total: 0 }

    for (const r of taskRows) {
      const doneAt = r.completed ? r.completedAt ?? r.updatedAt ?? r.createdAt : null
      if (!doneAt) continue
      const dateKey = new Date(doneAt).toISOString().slice(0, 10)
      if (!(dateKey in byDate)) continue
      const cat = (r.alignmentCategory || '').toLowerCase()
      if (cat === 'distraction') byDate[dateKey].distraction += 1
      else if (cat === 'high' || cat === 'medium' || cat === 'low') byDate[dateKey].aligned += 1
      else byDate[dateKey].aligned += 0 // ignore unrated
      byDate[dateKey].total += 1
    }

    const data = days.map(({ label, dateKey }) => {
      const stats = byDate[dateKey]
      const hasData = stats.total > 0
      const alignedPct = hasData ? Math.round((stats.aligned / stats.total) * 100) : 0
      const distractionPct = hasData ? Math.max(0, 100 - alignedPct) : 0
      return { day: label, aligned: alignedPct, distraction: distractionPct, hasData }
    })

    return data
  } catch (error) {
    console.error('Failed to compute alignment chart data:', error)
    // Fallback to empty dataset with hasData=false
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return dayLabels.map((label) => ({ day: label, aligned: 0, distraction: 0, hasData: false }))
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

export async function generateDashboardSummary() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, summary: "Please sign in to get personalized insights." }

    const [userResult, tasksResult, goalsResult] = await Promise.all([
      getUser(),
      db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt)),
      db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt))
    ])

    if (!userResult.success || !userResult.user) {
      return { success: false, summary: "Unable to generate insights without user profile." }
    }

    const user = userResult.user
    const tasksMapped = tasksResult.map((r: typeof tasks.$inferSelect) => ({
      id: r.id,
      title: r.title,
      alignment_score: r.alignmentScore || 0,
      alignment_category: r.alignmentCategory || 'unrated',
      completed: !!r.completed,
    }))

    const goalsMapped = goalsResult.map((r: typeof goals.$inferSelect) => ({
      id: r.id,
      title: r.title,
      current_value: r.currentValue || 0,
      target_value: r.targetValue || 0,
    }))

    // Generate AI insights
    const { generateDashboardAlignmentSummary } = await import("@/lib/ai")
    let summary: string
    try {
      summary = await generateDashboardAlignmentSummary(
        tasksMapped,
        goalsMapped,
        user.mission || "",
        user.focusAreas || "",
        user.onboarded || false
      )
      console.log("Generated AI summary:", summary)
    } catch (aiError) {
      console.error("AI summary generation failed:", aiError)
      const avgScore = tasksMapped.length > 0 ? Math.round(tasksMapped.reduce((sum: number, t: any) => sum + t.alignment_score, 0) / tasksMapped.length) : 0
      summary = `${avgScore}% alignment score. ${tasksMapped.length === 0 ? "Add tasks to get AI insights." : "Focus on completing high-alignment tasks."}`
    }

    // Persist to cache
    try {
      const now = new Date()
      // Upsert pattern for libsql via insert OR update on conflict by PK
      // Some libsql setups support 'insert ... on conflict do update'; fallback to try/catch
      try {
        await db.insert(dashboardInsights).values({ userId, content: summary, updatedAt: now as any })
      } catch {
        await db.update(dashboardInsights).set({ content: summary, updatedAt: now as any }).where(eq(dashboardInsights.userId, userId))
      }
    } catch (cacheErr) {
      console.warn('Failed to persist dashboard insight cache:', cacheErr)
    }

    return { success: true, summary }
  } catch (error) {
    console.error("Failed to generate dashboard summary:", error)
    return { 
      success: false, 
      summary: "Unable to analyze alignment at this time. Add tasks and goals to get AI insights." 
    }
  }
}
export async function getCachedDashboardSummary() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, summary: null }
    const rows = await db.select().from(dashboardInsights).where(eq(dashboardInsights.userId, userId))
    if (!rows.length) return { success: true, summary: null }
    return { success: true, summary: rows[0].content as string }
  } catch (error) {
    console.warn('Failed to read dashboard insight cache:', error)
    return { success: false, summary: null }
  }
}

// Combined: preserve manual metric management and historical alignment data functions
// Manual metrics management for impact tracking (from HEAD)
export async function createManualMetric(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Unauthenticated' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const currentValue = parseInt(formData.get('currentValue') as string) || 0
    const targetValue = parseInt(formData.get('targetValue') as string) || 0
    const unit = formData.get('unit') as string

    if (!title?.trim()) return { success: false, error: 'Title is required' }

    const inserted = await db.insert(goals).values({
      userId,
      title: title.trim(),
      description: description || null,
      category: 'manual_metric',
      goalType: 'personal',
      currentValue,
      targetValue,
      unit: unit || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    return { success: true, metric: inserted[0] }
  } catch (error) {
    console.error('Failed to create manual metric:', error)
    return { success: false, error: 'Failed to create metric' }
  }
}

export async function updateManualMetric(metricId: number, newValue: number) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Unauthenticated' }

    const updated = await db.update(goals)
      .set({ 
        currentValue: newValue, 
        updatedAt: new Date()
      })
      .where(eq(goals.id, metricId))
      .returning()

    if (!updated.length) return { success: false, error: 'Metric not found' }

    return { success: true, metric: updated[0] }
  } catch (error) {
    console.error('Failed to update manual metric:', error)
    return { success: false, error: 'Failed to update metric' }
  }
}

// Historical alignment data functions (from origin/main)
export async function saveHistoricalAlignmentData() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Unauthenticated' }

    const today = new Date().toISOString().split('T')[0]

    // Get current tasks and goals
    const tasksResult = await db.select().from(tasks).where(eq(tasks.userId, userId)) as Array<typeof tasks.$inferSelect>
    const goalsResult = await db.select().from(goals).where(eq(goals.userId, userId)) as Array<typeof goals.$inferSelect>

    const completedTasks = tasksResult.filter(t => t.completed)
    const highAlignmentTasks = tasksResult.filter(t => (t.alignmentScore || 0) >= 80)
    const distractionTasks = tasksResult.filter(t => t.alignmentCategory === 'distraction')

    const completedGoals = goalsResult.filter(g => {
      const current = g.currentValue || 0
      const target = g.targetValue || 1
      return current >= target
    })

    const overallAlignmentScore = tasksResult.length > 0
      ? Math.round(tasksResult.reduce((sum, t) => sum + (t.alignmentScore || 0), 0) / tasksResult.length)
      : 0

    // Check if we already have data for today
    const existing = await db.select().from(alignmentHistory)
      .where(and(eq(alignmentHistory.userId, userId), eq(alignmentHistory.date, today)))

    if (existing.length > 0) {
      // Update existing record
      await db.update(alignmentHistory).set({
        overallAlignmentScore,
        completedTasksCount: completedTasks.length,
        totalTasksCount: tasksResult.length,
        highAlignmentTasks: highAlignmentTasks.length,
        distractionTasks: distractionTasks.length,
        completedGoalsCount: completedGoals.length,
        totalGoalsCount: goalsResult.length,
      }).where(and(eq(alignmentHistory.userId, userId), eq(alignmentHistory.date, today)))
    } else {
      // Create new record
      await db.insert(alignmentHistory).values({
        userId,
        date: today,
        overallAlignmentScore,
        completedTasksCount: completedTasks.length,
        totalTasksCount: tasksResult.length,
        highAlignmentTasks: highAlignmentTasks.length,
        distractionTasks: distractionTasks.length,
        completedGoalsCount: completedGoals.length,
        totalGoalsCount: goalsResult.length,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to save historical alignment data:', error)
    return { success: false, error: 'Failed to save data' }
  }
}

export async function getHistoricalAlignmentData(days: number = 30) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Unauthenticated' }

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const rows = await db.select().from(alignmentHistory)
      .where(and(
        eq(alignmentHistory.userId, userId),
        sql`${alignmentHistory.date} >= ${startDate.toISOString().split('T')[0]}`
      ))
      .orderBy(alignmentHistory.date) as Array<typeof alignmentHistory.$inferSelect>

    // Fill in missing days with zero values
    const dataMap = new Map(rows.map(row => [row.date, row]))
    const filledData = []

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      if (dataMap.has(dateStr)) {
        filledData.push(dataMap.get(dateStr))
      } else {
        filledData.push({
          date: dateStr,
          overallAlignmentScore: 0,
          completedTasksCount: 0,
          totalTasksCount: 0,
          highAlignmentTasks: 0,
          distractionTasks: 0,
          completedGoalsCount: 0,
          totalGoalsCount: 0,
        })
      }
    }

    return { success: true, data: filledData }
  } catch (error) {
    console.error('Failed to get historical alignment data:', error)
    return { success: false, error: 'Failed to load data', data: [] }
  }
}
