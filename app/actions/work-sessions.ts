"use server"

import { mockData, getNextWorkSessionId, type WorkSession, type AlignmentCategory } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function addWorkSession(formData: FormData) {
  try {
    const taskId = formData.get("taskId") ? Number(formData.get("taskId")) : null
    const durationMinutes = Number(formData.get("durationMinutes"))
    const alignmentCategory = (formData.get("alignmentCategory") as AlignmentCategory) || "medium"
    const notes = (formData.get("notes") as string) || ""

    if (!durationMinutes || durationMinutes <= 0) {
      return { success: false, error: "Duration is required" }
    }

    const newSession: WorkSession = {
      id: getNextWorkSessionId(),
      user_id: 1,
      task_id: taskId,
      duration_minutes: durationMinutes,
      alignment_category: alignmentCategory,
      session_date: new Date(),
      notes: notes || null,
      created_at: new Date(),
    }

    mockData.workSessions.push(newSession)

    revalidatePath("/impact")
    revalidatePath("/dashboard")
    return { success: true, session: newSession }
  } catch (error) {
    console.error("Failed to add work session:", error)
    return { success: false, error: "Failed to add work session" }
  }
}

export async function getWorkSessions() {
  try {
    const sessions = mockData.workSessions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((session) => {
        const task = mockData.tasks.find((t) => t.id === session.task_id)
        return {
          ...session,
          task_title: task?.title || null,
        }
      })

    return { success: true, sessions }
  } catch (error) {
    console.error("Failed to get work sessions:", error)
    return { success: false, error: "Failed to load work sessions", sessions: [] }
  }
}

export async function getTotalAlignedHours() {
  try {
    const totalMinutes = mockData.workSessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0)

    const alignedMinutes = mockData.workSessions
      .filter((session) => session.alignment_category === "high" || session.alignment_category === "medium")
      .reduce((sum, session) => sum + (session.duration_minutes || 0), 0)

    return {
      success: true,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      alignedHours: Math.round((alignedMinutes / 60) * 100) / 100,
    }
  } catch (error) {
    console.error("Failed to get total aligned hours:", error)
    return { success: false, totalHours: 0, alignedHours: 0 }
  }
}
