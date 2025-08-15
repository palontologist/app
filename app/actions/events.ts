"use server"

import { revalidatePath } from "next/cache"

// Mock data storage for events
const mockEvents: any[] = [
  {
    id: "1",
    title: "Team Standup",
    description: "Daily team sync meeting",
    event_date: "2024-01-15",
    event_time: "09:00",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Product Review",
    description: "Review quarterly product roadmap",
    event_date: "2024-01-18",
    event_time: "14:00",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Client Presentation",
    description: "Present project updates to client",
    event_date: "2024-01-20",
    event_time: "10:30",
    created_at: new Date().toISOString(),
  },
]

export async function getEvents() {
  try {
    // Sort events by date
    const sortedEvents = mockEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

    return {
      success: true,
      events: sortedEvents,
    }
  } catch (error) {
    console.error("Failed to get events:", error)
    return {
      success: false,
      error: "Failed to retrieve events",
      events: [],
    }
  }
}

export async function createEvent(formData: FormData) {
  try {
    const title = formData.get("title") as string
    const eventDate = formData.get("eventDate") as string
    const eventTime = formData.get("eventTime") as string
    const description = formData.get("description") as string

    if (!title || !eventDate) {
      return {
        success: false,
        error: "Title and date are required",
      }
    }

    const newEvent = {
      id: (mockEvents.length + 1).toString(),
      title,
      description: description || "",
      event_date: eventDate,
      event_time: eventTime || "",
      created_at: new Date().toISOString(),
    }

    mockEvents.push(newEvent)

    revalidatePath("/analytics")
    revalidatePath("/dashboard")

    return {
      success: true,
      event: newEvent,
    }
  } catch (error) {
    console.error("Failed to create event:", error)
    return {
      success: false,
      error: "Failed to create event",
    }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const eventIndex = mockEvents.findIndex((event) => event.id === eventId)

    if (eventIndex === -1) {
      return {
        success: false,
        error: "Event not found",
      }
    }

    mockEvents.splice(eventIndex, 1)

    revalidatePath("/analytics")
    revalidatePath("/dashboard")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Failed to delete event:", error)
    return {
      success: false,
      error: "Failed to delete event",
    }
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  try {
    const eventIndex = mockEvents.findIndex((event) => event.id === eventId)

    if (eventIndex === -1) {
      return {
        success: false,
        error: "Event not found",
      }
    }

    const title = formData.get("title") as string
    const eventDate = formData.get("eventDate") as string
    const eventTime = formData.get("eventTime") as string
    const description = formData.get("description") as string

    if (!title || !eventDate) {
      return {
        success: false,
        error: "Title and date are required",
      }
    }

    mockEvents[eventIndex] = {
      ...mockEvents[eventIndex],
      title,
      description: description || "",
      event_date: eventDate,
      event_time: eventTime || "",
    }

    revalidatePath("/analytics")
    revalidatePath("/dashboard")

    return {
      success: true,
      event: mockEvents[eventIndex],
    }
  } catch (error) {
    console.error("Failed to update event:", error)
    return {
      success: false,
      error: "Failed to update event",
    }
  }
}
