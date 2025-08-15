"use server"

import { mockData } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function getUser() {
  try {
    const user = mockData.users[0] // Demo user
    if (!user) {
      return { success: false, error: "User not found", user: null }
    }

    return { success: true, user }
  } catch (error) {
    console.error("Failed to get user:", error)
    return { success: false, error: "Failed to load user", user: null }
  }
}

export async function updateUser(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const mission = formData.get("mission") as string
    const worldVision = formData.get("worldVision") as string
    const focusAreas = formData.get("focusAreas") as string

    const user = mockData.users[0]
    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Update user data
    user.name = name
    user.mission = mission
    user.world_vision = worldVision
    user.focus_areas = focusAreas
    user.updated_at = new Date()

    revalidatePath("/dashboard")
    revalidatePath("/impact")
    return { success: true, user }
  } catch (error) {
    console.error("Failed to update user:", error)
    return { success: false, error: "Failed to update user" }
  }
}
