"use server"

import { auth } from "@clerk/nextjs/server"
import { db, goals, goalActivities, now, tasks, userProfiles } from "@/lib/db"
import { eq, and, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { analyzeGoalAlignment, analyzeGoalPriority } from "@/lib/ai"

// Map DB row -> client shape (keeping camelCase variants if needed)
function mapGoal(row: typeof goals.$inferSelect) {
  // Safely create Date objects with defensive checks
  const safeDate = (value: any) => {
    if (!value) return null;
    try {
      const date = new Date(value);
      // Check if date is valid
      if (isNaN(date.getTime())) return null;
      return date;
    } catch (e) {
      console.warn("Invalid date value:", value);
      return null;
    }
  };

  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    description: row.description,
    type: row.goalType || 'personal',
    target_value: row.targetValue,
    current_value: row.currentValue,
    unit: row.unit,
    category: row.category,
    alignment_score: row.alignmentScore,
    alignment_category: row.alignmentCategory,
    mission_pillar: row.missionPillar,
    impact_statement: row.impactStatement,
    ai_suggestions: row.aiSuggestions,
    priority_quadrant: row.priorityQuadrant,
    priority_reason: row.priorityReason,
    deadline: safeDate(row.deadline),
    created_at: safeDate(row.createdAt) || new Date(),
    updated_at: safeDate(row.updatedAt) || new Date(),
  }
}

function computePriorityQuadrant(input: {
  alignmentCategory?: string | null
  alignmentScore?: number | null
  deadlineMs?: number | null
  progressPct?: number | null
}): { quadrant: "do" | "plan" | "delegate" | "drop"; reason: string } {
  const nowMs = Date.now()
  const cat = String(input.alignmentCategory || "medium").toLowerCase()
  const score = input.alignmentScore ?? null
  const deadlineMs = input.deadlineMs ?? null
  const daysToDeadline = deadlineMs ? Math.round((deadlineMs - nowMs) / (1000 * 60 * 60 * 24)) : null
  const progressPct = input.progressPct ?? null

  if (cat === "distraction") {
    return { quadrant: "drop", reason: "Low mission alignment — consider removing or deferring." }
  }
  if (cat === "low") {
    return { quadrant: "delegate", reason: "Lower alignment — delegate if possible." }
  }

  const urgent = daysToDeadline != null && daysToDeadline <= 7
  const nearFinish = progressPct != null && progressPct >= 80
  const high = cat === "high" || (score != null && score >= 80)

  if (urgent || (high && deadlineMs != null) || (nearFinish && deadlineMs != null)) {
    return {
      quadrant: "do",
      reason: urgent
        ? "Deadline soon — do first."
        : high
          ? "High alignment + deadline — do first."
          : "Near completion + deadline — finish it now.",
    }
  }

  if (high) return { quadrant: "plan", reason: "High alignment — schedule consistent time blocks." }
  return { quadrant: "plan", reason: "Medium alignment — schedule and refine." }
}

export async function autoPrioritizeGoals() {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: "Unauthenticated" }

  // Defer heavy lifting to existing AI alignment inputs:
  // If a goal doesn't have alignmentCategory yet, analyze it.
  // Then compute a quadrant using a more flexible heuristic:
  // - "do" if (high alignment) OR (deadline soon) OR (high progress + deadline)
  // - "delegate" if low/distraction
  // - otherwise "plan"

  const profileRows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
  const profile = profileRows[0]

  const rows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.archived, false)))
    .orderBy(desc(goals.updatedAt))

  const updated: any[] = []
  const decisions: Array<{
    id: number
    alignmentScore: number
    alignmentCategory: string
    quadrant: "do" | "plan" | "delegate" | "drop"
    reason: string
  }> = []

  // Context for better ranking: recent tasks + activities
  let recentTaskTitles: string[] = []
  let recentActivityTitles: string[] = []
  try {
    const t = await db
      .select({ title: tasks.title })
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.updatedAt))
      .limit(12)
    recentTaskTitles = t.map((r) => String(r.title || "")).filter(Boolean)
  } catch {}
  try {
    const a = await db
      .select({ title: goalActivities.title })
      .from(goalActivities)
      .where(eq(goalActivities.userId, userId))
      .orderBy(desc(goalActivities.updatedAt))
      .limit(12)
    recentActivityTitles = a.map((r) => String(r.title || "")).filter(Boolean)
  } catch {}

  for (const g of rows as any[]) {
    let alignmentCategory = (g.alignmentCategory as string | null) ?? null
    let alignmentScore = (g.alignmentScore as number | null) ?? null

    if (!alignmentCategory || alignmentCategory === "medium") {
      try {
        const analysis = await analyzeGoalAlignment(
          String(g.title || "").trim(),
          String(g.description || ""),
          String(profile?.mission || ""),
          String(profile?.worldVision || ""),
          profile?.missionPillars ? JSON.parse(profile.missionPillars) : undefined
        )
        alignmentScore = analysis.alignment_score ?? alignmentScore ?? 50
        alignmentCategory = analysis.alignment_category ?? alignmentCategory ?? "medium"
      } catch (e) {
        // best-effort
      }
    }

    const target = g.targetValue != null ? Number(g.targetValue) : null
    const current = g.currentValue != null ? Number(g.currentValue) : 0
    const progressPct = target && target > 0 ? Math.round((current / target) * 100) : null

    // AI assigns matrix quadrant using mission + recent behavior context.
    let quadrant: "do" | "plan" | "delegate" | "drop" = "plan"
    let reason = "Scheduled for steady progress."
    try {
      const ai = await analyzeGoalPriority({
        goalTitle: String(g.title || "").trim(),
        goalDescription: String(g.description || ""),
        goalCategory: g.category ?? null,
        goalType: g.goalType ?? null,
        alignmentScore: alignmentScore ?? 50,
        alignmentCategory: alignmentCategory ?? "medium",
        targetValue: target,
        currentValue: current,
        unit: g.unit ?? null,
        deadlineIso: g.deadline ? new Date(Number(g.deadline)).toISOString() : null,
        mission: String(profile?.mission || ""),
        worldVision: String(profile?.worldVision || ""),
        focusAreas: String(profile?.focusAreas || ""),
        recentTaskTitles,
        recentActivityTitles,
      })
      quadrant = ai.priority_quadrant
      reason = ai.priority_reason
    } catch (e) {
      // Fallback to heuristic if the model output is messy/unavailable
      const fallback = computePriorityQuadrant({
        alignmentCategory,
        alignmentScore,
        deadlineMs: g.deadline ? Number(g.deadline) : null,
        progressPct,
      })
      quadrant = fallback.quadrant
      reason = fallback.reason
    }
    decisions.push({
      id: Number(g.id),
      alignmentScore: Number(alignmentScore ?? 50),
      alignmentCategory: String(alignmentCategory ?? "medium"),
      quadrant,
      reason,
    })
  }

  // If AI put everything into "plan", force at least one "do" and one "delegate"
  // so the matrix is informative even without explicit deadlines.
  const hasDo = decisions.some((d) => d.quadrant === "do")
  const hasDelegate = decisions.some((d) => d.quadrant === "delegate")
  const hasNonPlan = decisions.some((d) => d.quadrant !== "plan")

  if (decisions.length >= 2 && !hasNonPlan) {
    // Pick highest alignment as "do"
    const sorted = [...decisions].sort((a, b) => (b.alignmentScore ?? 50) - (a.alignmentScore ?? 50))
    sorted[0].quadrant = "do"
    sorted[0].reason = "Highest leverage for your mission — do first."
    // Pick lowest alignment as "delegate" (unless it's the same)
    const low = sorted[sorted.length - 1]
    if (low.id !== sorted[0].id) {
      low.quadrant = "delegate"
      low.reason = "Lower leverage — delegate/automate if possible."
    }
  } else {
    if (decisions.length >= 2 && !hasDo) {
      const top = [...decisions].sort((a, b) => (b.alignmentScore ?? 50) - (a.alignmentScore ?? 50))[0]
      top.quadrant = "do"
      top.reason = top.reason || "Highest leverage — do first."
    }
    if (decisions.length >= 3 && !hasDelegate) {
      const bottom = [...decisions].sort((a, b) => (a.alignmentScore ?? 50) - (b.alignmentScore ?? 50))[0]
      if (bottom.quadrant === "plan") {
        bottom.quadrant = "delegate"
        bottom.reason = "Lower leverage — delegate/automate if possible."
      }
    }
  }

  // Apply updates
  for (const d of decisions) {
    const timestamp = new Date()
    const upd = await db.update(goals).set({
      alignmentScore: d.alignmentScore,
      alignmentCategory: d.alignmentCategory,
      priorityQuadrant: d.quadrant,
      priorityReason: d.reason,
      priorityUpdatedAt: timestamp,
      updatedAt: timestamp,
    }).where(and(eq(goals.userId, userId), eq(goals.id, d.id))).returning()

    if (upd[0]) updated.push(mapGoal(upd[0] as any))
  }

  revalidatePath("/goals")
  return { success: true as const, goals: updated }
}

export async function getGoals() {
  try {
  const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated", goals: [] }
    const rows = await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt))
    return { success: true, goals: rows.map(mapGoal) }
  } catch (error) {
    console.error("Failed to get goals:", error)
    return { success: false, error: "Failed to load goals", goals: [] }
  }
}

export async function createGoal(formData: FormData) {
  try {
  const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }

    // Safely get and validate form values
    const titleValue = formData.get("title")
    const title = typeof titleValue === 'string' ? titleValue : ''
    
    const descriptionValue = formData.get("description")
    const description = typeof descriptionValue === 'string' ? descriptionValue : ''
    
    const targetValueRaw = formData.get("targetValue")
    const targetValue = typeof targetValueRaw === 'string' ? parseInt(targetValueRaw, 10) || null : null
    
    const unitValue = formData.get("unit") 
    const unit = typeof unitValue === 'string' ? unitValue : null
    
    const categoryValue = formData.get("category")
    const category = typeof categoryValue === 'string' ? categoryValue : "personal"
    const goalTypeValue = formData.get("goalType")
    const goalType = typeof goalTypeValue === 'string' ? goalTypeValue : 'personal'
    
    const deadlineRaw = formData.get("deadline")

    // Safely handle deadline date
    let deadline: Date | null = null;
    if (typeof deadlineRaw === 'string' && deadlineRaw) {
      try {
        deadline = new Date(deadlineRaw);
        // Validate date is valid
        if (isNaN(deadline.getTime())) {
          deadline = null;
        }
      } catch (e) {
        console.warn("Invalid deadline date:", deadlineRaw);
        deadline = null;
      }
    }

    // Get new fields
    const missionPillarValue = formData.get("missionPillar")
    const missionPillar = typeof missionPillarValue === 'string' ? missionPillarValue : null

    const impactStatementValue = formData.get("impactStatement")
    const impactStatement = typeof impactStatementValue === 'string' ? impactStatementValue : null

    if (!title.trim()) return { success: false, error: "Goal title is required" }

    // Get user profile for AI analysis
    const userProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))

    // Perform AI alignment analysis
    let aiAnalysis = null
    let alignmentScore = 50
    let alignmentCategory = "medium"
    let aiSuggestions = null

    try {
      const analysis = await analyzeGoalAlignment(
        title.trim(),
        description || "",
        userProfile[0]?.mission || "",
        userProfile[0]?.worldVision || "",
        userProfile[0]?.missionPillars ? JSON.parse(userProfile[0].missionPillars) : undefined
      )

      aiAnalysis = analysis.analysis
      alignmentScore = analysis.alignment_score || 50
      alignmentCategory = analysis.alignment_category || "medium"
      aiSuggestions = analysis.suggestions
    } catch (error) {
      console.error("AI analysis failed:", error)
      aiAnalysis = "Unable to analyze alignment at this time."
    }

    const timestamp = new Date() // Use Date object instead of now() timestamp
    let quadrant: "do" | "plan" | "delegate" | "drop" = "plan"
    let reason = "Scheduled for steady progress."
    try {
      const ai = await analyzeGoalPriority({
        goalTitle: title.trim(),
        goalDescription: description || "",
        goalCategory: category ?? null,
        goalType: goalType ?? null,
        targetValue: targetValue ?? null,
        currentValue: 0,
        unit: unit ?? null,
        deadlineIso: deadline ? deadline.toISOString() : null,
        mission: userProfile[0]?.mission || "",
        worldVision: userProfile[0]?.worldVision || "",
        focusAreas: userProfile[0]?.focusAreas || "",
      })
      quadrant = ai.priority_quadrant
      reason = ai.priority_reason
    } catch {
      const fallback = computePriorityQuadrant({
        alignmentCategory,
        alignmentScore,
        deadlineMs: deadline ? deadline.getTime() : null,
        progressPct: null,
      })
      quadrant = fallback.quadrant
      reason = fallback.reason
    }
    const inserted = await db.insert(goals).values({
      userId,
      title: title.trim(),
      description: description || null,
      targetValue: targetValue ?? null,
      currentValue: 0,
      unit,
      category,
      goalType,
      alignmentScore: alignmentScore,
      alignmentCategory: alignmentCategory,
      missionPillar: missionPillar,
      impactStatement: impactStatement,
      aiSuggestions: aiSuggestions,
      priorityQuadrant: quadrant,
      priorityReason: reason,
      priorityUpdatedAt: timestamp,
      deadline: deadline, // Use Date object directly
      updatedAt: timestamp,
    }).returning()

    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, goal: mapGoal(inserted[0]) }
  } catch (error) {
    console.error("Failed to create goal:", error)
    return { success: false, error: "Failed to create goal" }
  }
}

export async function deleteGoal(goalId: number) {
  try {
  const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }
    await db.delete(goals).where(and(eq(goals.userId, userId), eq(goals.id, goalId)))
    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete goal:", error)
    return { success: false, error: "Failed to delete goal" }
  }
}

export async function updateGoalProgress(goalId: number, newValue: number) {
  try {
  const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }
    const timestamp = new Date() // Use Date object instead of now()
  const updated = await db.update(goals).set({ 
      currentValue: newValue, 
      updatedAt: timestamp 
    }).where(and(eq(goals.userId, userId), eq(goals.id, goalId))).returning()
    
    if (!updated.length) return { success: false, error: "Goal not found" }
    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, goal: mapGoal(updated[0]) }
  } catch (error) {
    console.error("Failed to update goal:", error)
    return { success: false, error: "Failed to update goal" }
  }
}

export async function updateGoal(goalId: number, formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }

    const titleValue = formData.get("title")
    const title = typeof titleValue === "string" ? titleValue.trim() : ""
    if (!title) return { success: false, error: "Goal title is required" }

    const descriptionValue = formData.get("description")
    const description = typeof descriptionValue === "string" ? descriptionValue : ""

    const targetValueRaw = formData.get("targetValue")
    const targetValue = typeof targetValueRaw === "string" && targetValueRaw !== ""
      ? (parseInt(targetValueRaw, 10) || null)
      : null

    const unitValue = formData.get("unit")
    const unit = typeof unitValue === "string" && unitValue.trim() ? unitValue.trim() : null

    const categoryValue = formData.get("category")
    const category = typeof categoryValue === "string" && categoryValue.trim() ? categoryValue.trim() : null

    const goalTypeValue = formData.get("goalType")
    const goalType = typeof goalTypeValue === "string" && goalTypeValue.trim() ? goalTypeValue.trim() : null

    const deadlineRaw = formData.get("deadline")
    let deadline: Date | null = null
    if (typeof deadlineRaw === "string" && deadlineRaw) {
      const d = new Date(deadlineRaw)
      deadline = isNaN(d.getTime()) ? null : d
    }

    const existing = await db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.id, goalId)))
    if (!existing.length) return { success: false, error: "Goal not found" }

    // Re-run AI alignment so priority matrix stays automatic.
    const profileRows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    const profile = profileRows[0]

    let alignmentScore = existing[0].alignmentScore ?? 50
    let alignmentCategory = existing[0].alignmentCategory ?? "medium"
    let aiSuggestions = existing[0].aiSuggestions ?? null

    try {
      const analysis = await analyzeGoalAlignment(
        title,
        description || "",
        profile?.mission || "",
        profile?.worldVision || "",
        profile?.missionPillars ? JSON.parse(profile.missionPillars) : undefined
      )
      alignmentScore = analysis.alignment_score || 50
      alignmentCategory = analysis.alignment_category || "medium"
      aiSuggestions = analysis.suggestions ?? aiSuggestions
    } catch (e) {
      // best-effort
    }

    let quadrant: "do" | "plan" | "delegate" | "drop" = "plan"
    let reason = "Scheduled for steady progress."
    try {
      const ai = await analyzeGoalPriority({
        goalTitle: title,
        goalDescription: description || "",
        goalCategory: category ?? null,
        goalType: goalType ?? null,
        targetValue,
        currentValue: existing[0].currentValue ?? 0,
        unit,
        deadlineIso: deadline ? deadline.toISOString() : (existing[0].deadline ? new Date(Number(existing[0].deadline)).toISOString() : null),
        mission: profile?.mission || "",
        worldVision: profile?.worldVision || "",
        focusAreas: profile?.focusAreas || "",
      })
      quadrant = ai.priority_quadrant
      reason = ai.priority_reason
    } catch {
      const fallback = computePriorityQuadrant({
        alignmentCategory,
        alignmentScore,
        deadlineMs: deadline ? deadline.getTime() : (existing[0].deadline ? Number(existing[0].deadline) : null),
        progressPct: null,
      })
      quadrant = fallback.quadrant
      reason = fallback.reason
    }

    const timestamp = new Date()
    const updated = await db.update(goals).set({
      title,
      description: description || null,
      targetValue,
      unit,
      category,
      goalType,
      deadline,
      alignmentScore,
      alignmentCategory,
      aiSuggestions,
      priorityQuadrant: quadrant,
      priorityReason: reason,
      priorityUpdatedAt: timestamp,
      updatedAt: timestamp,
    }).where(and(eq(goals.userId, userId), eq(goals.id, goalId))).returning()

    if (!updated.length) return { success: false, error: "Failed to update goal" }
    revalidatePath("/goals")
    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, goal: mapGoal(updated[0]) }
  } catch (error) {
    console.error("Failed to update goal:", error)
    return { success: false, error: "Failed to update goal" }
  }
}

// Mark a goal complete by setting currentValue to targetValue (if targetValue present)
export async function markGoalComplete(goalId: number) {
  try {
    console.log("markGoalComplete called for goalId:", goalId)
    const { userId } = await auth()
    if (!userId) {
      console.log("markGoalComplete: User not authenticated")
      return { success: false, error: "Unauthenticated" }
    }
    
    // Load existing goal to know its target value
    const existing = await db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.id, goalId)))
    if (!existing.length) {
      console.log("markGoalComplete: Goal not found for goalId:", goalId)
      return { success: false, error: "Goal not found" }
    }
    
    const goal = existing[0]
    console.log("markGoalComplete: Found goal:", { id: goal.id, title: goal.title, currentValue: goal.currentValue, targetValue: goal.targetValue })
    
    const timestamp = new Date()
    let newCurrentValue: number
    
    if (goal.targetValue == null) {
      // For goals without a target, mark as complete by setting currentValue to 1
      // This handles qualitative goals or binary completion goals
      console.log("markGoalComplete: Goal has no target value, setting to 1 to mark complete")
      newCurrentValue = 1
    } else {
      // For goals with targets, set currentValue to targetValue
      console.log("markGoalComplete: Updating goal to currentValue =", goal.targetValue)
      newCurrentValue = goal.targetValue
    }
    
    const updated = await db.update(goals).set({ 
      currentValue: newCurrentValue, 
      updatedAt: timestamp 
    }).where(and(eq(goals.userId, userId), eq(goals.id, goalId))).returning()
    
    console.log("markGoalComplete: Updated goal:", updated[0])
    
    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, goal: mapGoal(updated[0]) }
  } catch (error) {
    console.error("Failed to mark goal complete:", error)
    return { success: false, error: "Failed to mark goal complete" }
  }
}

// Activities (simplified)
function mapActivity(row: typeof goalActivities.$inferSelect) {
  return {
    id: row.id,
    goal_id: row.goalId,
    user_id: row.userId,
    title: row.title,
    progress_value: row.progressValue,
    completed: !!row.completed,
    created_at: new Date(row.createdAt),
    updated_at: new Date(row.updatedAt),
  }
}

export async function addGoalActivity(goalId: number, formData: FormData) {
  try {
  const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }
    
    // Safely parse form values
    const titleValue = formData.get("title")
    const title = typeof titleValue === 'string' ? titleValue : ""
    
    const progressValueRaw = formData.get("progressValue")
    const progressValue = typeof progressValueRaw === 'string' ? 
      parseInt(progressValueRaw, 10) || 0 : 0
      
    if (!title.trim()) return { success: false, error: "Activity title is required" }
    
    const timestamp = new Date() // Use Date object
    const inserted = await db.insert(goalActivities).values({
      goalId,
      userId,
      title: title.trim(),
      progressValue,
      completed: false,
      updatedAt: timestamp,
    }).returning()
  // Note: we no longer increment the goal on creation. Progress is applied when the activity is completed.
    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, activity: mapActivity(inserted[0]) }
  } catch (error) {
    console.error("Failed to add goal activity:", error)
    return { success: false, error: "Failed to add activity" }
  }
}

export async function getGoalActivities(goalId: number) {
  try {
  const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated", activities: [] }
    const rows = await db
      .select()
      .from(goalActivities)
      .where(and(eq(goalActivities.userId, userId), eq(goalActivities.goalId, goalId)))
      .orderBy(desc(goalActivities.createdAt))
    return { success: true, activities: rows.map(mapActivity) }
  } catch (error) {
    console.error("Failed to get goal activities:", error)
    return { success: false, error: "Failed to load activities", activities: [] }
  }
}

// Fetch all goal activities for the current user (for History page)
export async function getAllGoalActivities() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated", activities: [] }
    const rows = await db
      .select()
      .from(goalActivities)
      .where(eq(goalActivities.userId, userId))
      .orderBy(desc(goalActivities.createdAt))
    return { success: true, activities: rows.map(mapActivity) }
  } catch (error) {
    console.error("Failed to get all goal activities:", error)
    return { success: false, error: "Failed to load activities", activities: [] }
  }
}

export async function completeGoalActivity(activityId: number) {
  try {
  const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }
    const timestamp = new Date() // Use Date object
  // Load existing activity to check progressValue and whether it was already completed
  const existing = await db.select().from(goalActivities).where(and(eq(goalActivities.userId, userId), eq(goalActivities.id, activityId)))
  if (!existing.length) return { success: false, error: "Activity not found" }
  const activity = existing[0]
  if (activity.completed) {
    // Already completed - nothing to do
    return { success: true, activity: mapActivity(activity) }
  }

  // Snapshot coarse location for feeds (privacy-safe)
  let completedGeohash5: string | null = null
  try {
    const p = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    if (p[0]?.locationSharingEnabled && p[0]?.locationGeohash5) {
      completedGeohash5 = String(p[0].locationGeohash5)
    }
  } catch (e) {
    // best-effort only
    console.warn("Failed to load profile location for feed snapshot:", e)
  }

  // Mark activity completed and increment goal.currentValue by activity.progressValue
  const updated = await db.update(goalActivities)
    .set({
      completed: true,
      completedAt: timestamp,
      completedGeohash5,
      updatedAt: timestamp,
    })
    .where(and(eq(goalActivities.userId, userId), eq(goalActivities.id, activityId)))
    .returning()

  if (!updated.length) return { success: false, error: "Failed to update activity" }

  // Safely increment goal.currentValue by the activity's progressValue
  try {
    const pv = activity.progressValue || 0
    if (pv > 0) {
      await db.update(goals).set({
        currentValue: sql`coalesce(${goals.currentValue},0) + ${pv}`,
        updatedAt: timestamp,
      }).where(and(eq(goals.userId, userId), eq(goals.id, activity.goalId)))
    }
  } catch (e) {
    console.warn('Failed to increment goal for activity completion:', e)
  }

  // Best-effort: recalc priority matrix (keeps it up-to-date without a manual button)
  try {
    await autoPrioritizeGoals()
  } catch (e) {
    console.warn("Failed to auto-prioritize goals after activity completion:", e)
  }

  revalidatePath("/dashboard")
  revalidatePath("/impact")
  return { success: true, activity: mapActivity(updated[0]) }
  } catch (error) {
    console.error("Failed to complete activity:", error)
    return { success: false, error: "Failed to complete activity" }
  }
}

// Notes & contributing tasks features can be reimplemented later using a separate notes table.
export async function addGoalNote() {
  return { success: false, error: "Notes not yet implemented with DB" }
}
export async function getGoalNotes() {
  return { success: true, notes: [] }
}
export async function getGoalContributingTasks(goalId?: number) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated", tasks: [] }
    if (!goalId) return { success: true, tasks: [] }

    const rows = await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.goalId, goalId))).orderBy(desc(tasks.createdAt)) as Array<typeof tasks.$inferSelect>
    const mapped = rows.map((row: typeof tasks.$inferSelect) => ({
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
      progress_contribution: 1,
    }))
    return { success: true, tasks: mapped }
  } catch (error) {
    console.error("Failed to get contributing tasks:", error)
    return { success: false, error: "Failed to load tasks", tasks: [] }
  }
}
