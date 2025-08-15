"use server"

import { mockData, getNextGoalId, type Goal } from "@/lib/types"
import { revalidatePath } from "next/cache"

const mockGoalActivities: any[] = []
const mockGoalNotes: any[] = []
let nextActivityId = 1
let nextNoteId = 1

export async function getGoals() {
  try {
    const goals = mockData.goals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return { success: true, goals }
  } catch (error) {
    console.error("Failed to get goals:", error)
    return { success: false, error: "Failed to load goals", goals: [] }
  }
}

export async function updateGoalProgress(goalId: number, newValue: number) {
  try {
    const goal = mockData.goals.find((g) => g.id === goalId)
    if (!goal) {
      return { success: false, error: "Goal not found" }
    }

    goal.current_value = newValue
    goal.updated_at = new Date()

    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, goal }
  } catch (error) {
    console.error("Failed to update goal:", error)
    return { success: false, error: "Failed to update goal" }
  }
}

export async function createGoal(formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = (formData.get("description") as string) || ""
    const targetValue = Number.parseInt(formData.get("targetValue") as string) || 0
    const unit = (formData.get("unit") as string) || ""
    const category = (formData.get("category") as string) || "personal"
    const deadline = (formData.get("deadline") as string) || null

    if (!title.trim()) {
      return { success: false, error: "Goal title is required" }
    }

    const newGoal: Goal = {
      id: getNextGoalId(),
      user_id: 1,
      title,
      description,
      target_value: targetValue,
      current_value: 0,
      unit,
      category,
      deadline: deadline ? new Date(deadline) : null,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockData.goals.push(newGoal)

    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, goal: newGoal }
  } catch (error) {
    console.error("Failed to create goal:", error)
    return { success: false, error: "Failed to create goal" }
  }
}

export async function deleteGoal(goalId: number) {
  try {
    const index = mockData.goals.findIndex((g) => g.id === goalId)
    if (index === -1) {
      return { success: false, error: "Goal not found" }
    }

    mockData.goals.splice(index, 1)

    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete goal:", error)
    return { success: false, error: "Failed to delete goal" }
  }
}

export async function addGoalActivity(goalId: number, formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = (formData.get("description") as string) || ""
    const progressValue = Number.parseInt(formData.get("progressValue") as string) || 1

    if (!title.trim()) {
      return { success: false, error: "Activity title is required" }
    }

    const newActivity = {
      id: nextActivityId++,
      goal_id: goalId,
      title,
      description,
      progress_value: progressValue,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockGoalActivities.push(newActivity)

    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, activity: newActivity }
  } catch (error) {
    console.error("Failed to add goal activity:", error)
    return { success: false, error: "Failed to add activity" }
  }
}

export async function getGoalActivities(goalId: number) {
  try {
    const activities = mockGoalActivities
      .filter((a) => a.goal_id === goalId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { success: true, activities }
  } catch (error) {
    console.error("Failed to get goal activities:", error)
    return { success: false, error: "Failed to load activities", activities: [] }
  }
}

export async function completeGoalActivity(activityId: number) {
  try {
    const activity = mockGoalActivities.find((a) => a.id === activityId)
    if (!activity) {
      return { success: false, error: "Activity not found" }
    }

    activity.completed = true
    activity.updated_at = new Date()

    // Update goal progress
    const goal = mockData.goals.find((g) => g.id === activity.goal_id)
    if (goal) {
      goal.current_value += activity.progress_value
      goal.updated_at = new Date()
    }

    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, activity }
  } catch (error) {
    console.error("Failed to complete activity:", error)
    return { success: false, error: "Failed to complete activity" }
  }
}

export async function addGoalNote(goalId: number, formData: FormData) {
  try {
    const title = (formData.get("title") as string) || ""
    const content = formData.get("content") as string

    if (!content.trim()) {
      return { success: false, error: "Note content is required" }
    }

    const newNote = {
      id: nextNoteId++,
      goal_id: goalId,
      title,
      content,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockGoalNotes.push(newNote)

    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, note: newNote }
  } catch (error) {
    console.error("Failed to add goal note:", error)
    return { success: false, error: "Failed to add note" }
  }
}

export async function getGoalNotes(goalId: number) {
  try {
    const notes = mockGoalNotes
      .filter((n) => n.goal_id === goalId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { success: true, notes }
  } catch (error) {
    console.error("Failed to get goal notes:", error)
    return { success: false, error: "Failed to load notes", notes: [] }
  }
}

export async function getGoalContributingTasks(goalId: number) {
  try {
    // Find tasks that are completed and related to the goal
    const goal = mockData.goals.find((g) => g.id === goalId)
    if (!goal) {
      return { success: false, error: "Goal not found", tasks: [] }
    }

    // Mock logic: find completed tasks that contain goal keywords
    const goalKeywords = goal.title.toLowerCase().split(" ")
    const contributingTasks = mockData.tasks
      .filter(
        (task) =>
          task.completed &&
          goalKeywords.some(
            (keyword) => task.title.toLowerCase().includes(keyword) || task.description.toLowerCase().includes(keyword),
          ),
      )
      .map((task) => ({
        ...task,
        progress_contribution: 1,
        completed_at: task.updated_at,
      }))

    return { success: true, tasks: contributingTasks }
  } catch (error) {
    console.error("Failed to get contributing tasks:", error)
    return { success: false, error: "Failed to load contributing tasks", tasks: [] }
  }
}
