"use server"

import { auth } from "@clerk/nextjs/server"
import { db, events } from "@/lib/db"
import { eq, and, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getStoredTokens, createGoogleCalendarEvent, updateGoogleCalendarEvent } from "@/lib/google-calendar"

function mapEvent(row: typeof events.$inferSelect) {
  return {
    id: row.id.toString(),
    title: row.title,
    description: row.description,
    event_date: new Date(row.eventDate).toISOString().slice(0, 10),
    event_time: row.eventTime || "",
    created_at: new Date(row.createdAt).toISOString(),
    event_type: row.eventType,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    completed: !!row.completed,
    completed_at: row.completedAt ? new Date(row.completedAt).toISOString() : null,
    source: row.source || "local",
    google_event_id: row.googleEventId ?? null,
  }
}

export async function getEvents() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated", events: [] }
    const rows = await db.select().from(events).where(eq(events.userId, userId)).orderBy(asc(events.eventDate))
    return { success: true, events: rows.map(mapEvent) }
  } catch (error) {
    console.error("Failed to get events:", error)
    return { success: false, error: "Failed to retrieve events", events: [] }
  }
}

export async function createEvent(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }
    const title = (formData.get("title") as string) || ""
    const eventDateStr = (formData.get("eventDate") as string) || ""
    const eventTime = (formData.get("eventTime") as string) || ""
    const description = (formData.get("description") as string) || ""
    if (!title || !eventDateStr) return { success: false, error: "Title and date are required" }
  const eventDate = new Date(eventDateStr)
    const inserted = await db
      .insert(events)
      .values({
        userId,
        title: title.trim(),
        description: description || null,
        eventDate,
        eventTime: eventTime || null,
        eventType: null,
        metadata: null,
        source: "local",
      })
      .returning()

    // Sync to Google Calendar if user has connected account
    try {
      const account = await getStoredTokens(userId)
      if (account?.refreshToken) {
        const [y, m, d] = [eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()]
        let startDate: Date, endDate: Date
        if (eventTime) {
          const [h, min] = eventTime.split(":").map(Number)
          startDate = new Date(y, m, d, h || 0, min || 0)
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour default
        } else {
          startDate = new Date(y, m, d, 9, 0)
          endDate = new Date(y, m, d, 10, 0)
        }
        const googleEvent = await createGoogleCalendarEvent(userId, {
          title: title.trim(),
          description: description || null,
          startDateTime: startDate,
          endDateTime: endDate,
        })
        if (googleEvent?.id) {
          await db
            .update(events)
            .set({ source: "google", googleEventId: googleEvent.id, googleCalendarId: "primary" })
            .where(and(eq(events.userId, userId), eq(events.id, inserted[0].id)))
        }
      }
    } catch (err) {
      console.warn("Failed to sync event to Google Calendar:", err)
    }

    revalidatePath("/analytics")
    revalidatePath("/dashboard")
    return { success: true, event: mapEvent(inserted[0]) }
  } catch (error) {
    console.error("Failed to create event:", error)
    return { success: false, error: "Failed to create event" }
  }
}

export async function toggleEventCompletion(eventId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }
    const existing = await db
      .select()
      .from(events)
      .where(and(eq(events.userId, userId), eq(events.id, Number(eventId))))
    if (!existing.length) return { success: false, error: "Not found" }
    const event = existing[0]
    const completed = !event.completed
    const completedAt = completed ? new Date() : null

    await db
      .update(events)
      .set({ completed, completedAt })
      .where(and(eq(events.userId, userId), eq(events.id, Number(eventId))))

    // Sync completion to Google Calendar (append to description)
    if (event.googleEventId && completed) {
      try {
        const baseDesc = event.description || ""
        const suffix = baseDesc.includes("✓ Completed") ? "" : "\n\n✓ Completed"
        await updateGoogleCalendarEvent(userId, event.googleEventId, {
          description: baseDesc + suffix,
        })
      } catch (err) {
        console.warn("Failed to sync completion to Google Calendar:", err)
      }
    }

    revalidatePath("/analytics")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle event completion:", error)
    return { success: false, error: "Failed to toggle event completion" }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }
    await db.delete(events).where(and(eq(events.userId, userId), eq(events.id, Number(eventId))))
    revalidatePath("/analytics")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete event:", error)
    return { success: false, error: "Failed to delete event" }
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated" }
    const title = (formData.get("title") as string) || ""
    const eventDateStr = (formData.get("eventDate") as string) || ""
    const eventTime = (formData.get("eventTime") as string) || ""
    const description = (formData.get("description") as string) || ""
    if (!title || !eventDateStr) return { success: false, error: "Title and date are required" }
  const eventDate = new Date(eventDateStr)
    const updated = await db
      .update(events)
      .set({
        title: title.trim(),
        description: description || null,
        eventDate,
        eventTime: eventTime || null,
      })
      .where(and(eq(events.userId, userId), eq(events.id, Number(eventId))))
      .returning()
    if (!updated.length) return { success: false, error: "Event not found" }
    revalidatePath("/analytics")
    revalidatePath("/dashboard")
    return { success: true, event: mapEvent(updated[0]) }
  } catch (error) {
    console.error("Failed to update event:", error)
    return { success: false, error: "Failed to update event" }
  }
}
