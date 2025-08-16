"use server"

import { auth } from "@clerk/nextjs/server"
import { db, tasks, workSessions, now } from "@/lib/db"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

function mapTask(row: typeof tasks.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
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

export async function createTask(formDataOrTitle: FormData | string, descriptionArg?: string, _userId?: number, alignmentCategoryArg?: string) {
  try {
    // Handle both FormData and direct string input
    let title: string = '';
    let description: string | null = null;
    let alignmentCategory: string | null = null;
    
    if (formDataOrTitle instanceof FormData) {
      // Extract values from FormData
      const titleValue = formDataOrTitle.get('title');
      title = typeof titleValue === 'string' ? titleValue : '';
      
      const descValue = formDataOrTitle.get('description');
      description = typeof descValue === 'string' ? descValue : null;
      
      const alignmentValue = formDataOrTitle.get('alignmentCategory');
      alignmentCategory = typeof alignmentValue === 'string' ? alignmentValue : 'medium';
    } else {
      // Direct string parameters
      title = String(formDataOrTitle || '');
      description = descriptionArg || null;
      alignmentCategory = alignmentCategoryArg || 'medium';
    }
    
    const { userId } = await auth()
    if (!userId) return { success: false, task: null, error: "Unauthenticated" }
    // Ensure title is a string before using trim()
    if (!title || !String(title).trim()) return { success: false, task: null, error: "Title required" }
    const inserted = await db.insert(tasks).values({
      userId,
      title: String(title).trim(),
      description: description || null,
      alignmentScore: Math.floor(Math.random() * 40) + 60,
      alignmentCategory: alignmentCategory || "medium",
      aiAnalysis: "AI analysis placeholder",
      completed: false,
      updatedAt: new Date(),
    }).returning()
    revalidatePath("/dashboard")
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
    revalidatePath("/dashboard")
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

export async function getActiveTimer(_userId: number) {
  const { userId } = await auth()
  if (!userId) return null
  if (activeTimer && activeTimer.userId === userId) {
    return { ...activeTimer }
  }
  return null
}

export async function startTaskTimer(_userId: number, taskId: number) {
  const { userId } = await auth()
  if (!userId) return null
  activeTimer = { userId, taskId, startTime: Date.now() }
  return activeTimer
}

export async function stopTaskTimer(_userId: number, taskId: number) {
  const { userId } = await auth()
  if (!userId || !activeTimer || activeTimer.userId !== userId || activeTimer.taskId !== taskId) return null
  const duration = Math.round((Date.now() - activeTimer.startTime) / 60000)
  if (duration > 0) {
    await db.insert(workSessions).values({
      userId,
      taskId,
      durationMinutes: duration,
      alignmentCategory: null,
      startedAt: new Date(activeTimer.startTime),
    })
  }
  const stopped = activeTimer
  activeTimer = null
  revalidatePath("/dashboard")
  return stopped
}
