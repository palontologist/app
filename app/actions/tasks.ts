"use server"

import { mockData, getNextTaskId, type Task, type AlignmentCategory } from "@/lib/types"
import { revalidatePath } from "next/cache"

const mockTaskNotes: any[] = []
let nextNoteId = 1

export async function getTasks() {
  try {
    const tasks = mockData.tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return { success: true, tasks }
  } catch (error) {
    console.error("Failed to get tasks:", error)
    return { success: false, tasks: [] }
  }
}

export async function createTask(title: string, description?: string, userId?: number, alignmentCategory?: string) {
  try {
    const newTask: Task = {
      id: getNextTaskId(),
      user_id: userId || 1,
      title,
      description: description || null,
      alignment_score: Math.floor(Math.random() * 40) + 60, // Random score 60-100
      alignment_category: (alignmentCategory as AlignmentCategory) || "medium",
      ai_analysis: "AI analysis would appear here in a real implementation",
      completed: false,
      completed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockData.tasks.push(newTask)
    revalidatePath("/dashboard")
    return { success: true, task: newTask }
  } catch (error) {
    console.error("Failed to create task:", error)
    return { success: false, task: null }
  }
}

export async function toggleTaskCompletion(taskId: number) {
  try {
    const task = mockData.tasks.find((t) => t.id === taskId)
    if (!task) {
      return { success: false, task: null }
    }

    task.completed = !task.completed
    task.completed_at = task.completed ? new Date() : null
    task.updated_at = new Date()

    revalidatePath("/dashboard")
    return { success: true, task }
  } catch (error) {
    console.error("Failed to toggle task completion:", error)
    return { success: false, task: null }
  }
}

export async function deleteTask(taskId: number) {
  try {
    const index = mockData.tasks.findIndex((t) => t.id === taskId)
    if (index === -1) {
      return { success: false }
    }

    mockData.tasks.splice(index, 1)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete task:", error)
    return { success: false }
  }
}

export async function addTaskNote(taskId: number, formData: FormData) {
  try {
    const content = formData.get("content") as string
    const timeLogged = Number.parseInt(formData.get("timeLogged") as string) || 0

    if (!content.trim()) {
      return { success: false, error: "Note content is required" }
    }

    const newNote = {
      id: nextNoteId++,
      task_id: taskId,
      content,
      time_logged: timeLogged,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockTaskNotes.push(newNote)

    revalidatePath("/dashboard")
    return { success: true, note: newNote }
  } catch (error) {
    console.error("Failed to add task note:", error)
    return { success: false, error: "Failed to add note" }
  }
}

export async function getTaskNotes(taskId: number) {
  try {
    const notes = mockTaskNotes
      .filter((n) => n.task_id === taskId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { success: true, notes }
  } catch (error) {
    console.error("Failed to get task notes:", error)
    return { success: false, error: "Failed to load notes", notes: [] }
  }
}

// Timer functionality (simplified for mock data)
let activeTimer: { userId: number; taskId: number; startTime: Date } | null = null

export async function getActiveTimer(userId: number) {
  try {
    if (activeTimer && activeTimer.userId === userId) {
      const task = mockData.tasks.find((t) => t.id === activeTimer.taskId)
      return {
        ...activeTimer,
        task_title: task?.title || "Unknown Task",
      }
    }
    return null
  } catch (error) {
    console.error("Failed to get active timer:", error)
    return null
  }
}

export async function startTaskTimer(userId: number, taskId: number) {
  try {
    // Stop any existing timer
    activeTimer = null

    // Start new timer
    activeTimer = {
      userId,
      taskId,
      startTime: new Date(),
    }

    return activeTimer
  } catch (error) {
    console.error("Failed to start timer:", error)
    throw error
  }
}

export async function stopTaskTimer(userId: number, taskId: number) {
  try {
    if (!activeTimer || activeTimer.userId !== userId || activeTimer.taskId !== taskId) {
      return null
    }

    const duration = Math.round((new Date().getTime() - activeTimer.startTime.getTime()) / (1000 * 60))

    if (duration > 0) {
      const task = mockData.tasks.find((t) => t.id === taskId)

      // Add work session
      mockData.workSessions.push({
        id: mockData.workSessions.length + 1,
        user_id: userId,
        task_id: taskId,
        duration_minutes: duration,
        alignment_category: (task?.alignment_category as AlignmentCategory) || "medium",
        session_date: new Date(),
        notes: null,
        created_at: new Date(),
      })
    }

    const stoppedTimer = activeTimer
    activeTimer = null

    revalidatePath("/dashboard")
    return stoppedTimer
  } catch (error) {
    console.error("Failed to stop timer:", error)
    throw error
  }
}
