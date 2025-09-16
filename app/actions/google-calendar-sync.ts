"use server"

import { auth } from "@clerk/nextjs/server"
import { importAllCalendarEvents, importCalendarEvents } from "@/lib/google/calendar-sync"
import { revalidatePath } from "next/cache"

export async function syncGoogleCalendar(calendarId?: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthenticated" }
    }

    let result
    if (calendarId) {
      result = await importCalendarEvents(userId, calendarId)
    } else {
      result = await importAllCalendarEvents(userId)
    }

    if (result.success) {
      // Revalidate relevant pages to show new data
      revalidatePath("/dashboard")
      revalidatePath("/events") 
      revalidatePath("/tasks")
      revalidatePath("/analytics")
    }

    return {
      success: result.success,
      eventsImported: result.eventsImported || 0,
      tasksImported: result.tasksImported || 0,
      error: result.error,
    }
  } catch (error) {
    console.error("Calendar sync action error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync calendar",
    }
  }
}