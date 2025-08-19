"use server"

import { auth } from "@clerk/nextjs/server"
import { db, goals, goalActivities, now, tasks } from "@/lib/db"
import { eq, and, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

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
    target_value: row.targetValue,
    current_value: row.currentValue,
    unit: row.unit,
    category: row.category,
    deadline: safeDate(row.deadline),
    created_at: safeDate(row.createdAt) || new Date(),
    updated_at: safeDate(row.updatedAt) || new Date(),
  }
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
    
    if (!title.trim()) return { success: false, error: "Goal title is required" }

    const timestamp = new Date() // Use Date object instead of now() timestamp
    const inserted = await db.insert(goals).values({
      userId,
      title: title.trim(),
      description: description || null,
      targetValue: targetValue ?? null,
      currentValue: 0,
      unit,
      category,
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

  // Mark activity completed and increment goal.currentValue by activity.progressValue
  const updated = await db.update(goalActivities)
    .set({
      completed: true,
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
