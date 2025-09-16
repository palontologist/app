import { google } from 'googleapis'
import { createOAuthClient } from './oauth'
import { db, googleAccounts, events, tasks } from '@/lib/db'
import { eq } from 'drizzle-orm'

export interface GoogleCalendarEvent {
  id?: string
  summary?: string
  description?: string
  start?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  status?: string
  created?: string
  updated?: string
}

export interface SyncResult {
  success: boolean
  eventsImported?: number
  tasksImported?: number
  error?: string
}

/**
 * Get authenticated Google Calendar client for a user
 */
async function getCalendarClient(userId: string) {
  const rows = await db.select().from(googleAccounts).where(eq(googleAccounts.userId, userId))
  if (rows.length === 0 || !rows[0].refreshToken) {
    throw new Error('Google not connected')
  }

  const row = rows[0]
  const client = createOAuthClient()
  client.setCredentials({
    refresh_token: row.refreshToken,
    access_token: row.accessToken || undefined,
    expiry_date: (row.expiryDate as number | null) || undefined,
  })

  return google.calendar({ version: 'v3', auth: client })
}

/**
 * Convert Google Calendar event to app event format
 */
function mapGoogleEventToAppEvent(googleEvent: GoogleCalendarEvent, userId: string, calendarId: string) {
  const startDate = googleEvent.start?.dateTime || googleEvent.start?.date
  const eventDate = startDate ? new Date(startDate) : new Date()
  
  // Extract time from dateTime if it exists
  let eventTime: string | null = null
  if (googleEvent.start?.dateTime) {
    const timeMatch = googleEvent.start.dateTime.match(/T(\d{2}:\d{2})/)
    eventTime = timeMatch ? timeMatch[1] : null
  }

  return {
    userId,
    title: googleEvent.summary || 'Untitled Event',
    description: googleEvent.description || null,
    eventDate,
    eventTime,
    eventType: 'google_calendar',
    metadata: JSON.stringify({ 
      googleData: googleEvent,
      originalStart: googleEvent.start,
      originalEnd: googleEvent.end 
    }),
    googleEventId: googleEvent.id || null,
    googleCalendarId: calendarId,
    lastSyncedAt: Date.now(),
  }
}

/**
 * Convert Google Calendar event to app task format (for events that look like tasks)
 */
function mapGoogleEventToAppTask(googleEvent: GoogleCalendarEvent, userId: string, calendarId: string) {
  return {
    userId,
    title: googleEvent.summary || 'Untitled Task',
    description: googleEvent.description || null,
    alignmentCategory: null,
    completed: googleEvent.status === 'confirmed' ? false : true, // Basic mapping
    googleEventId: googleEvent.id || null,
    googleCalendarId: calendarId,
    lastSyncedAt: Date.now(),
  }
}

/**
 * Check if a Google Calendar event should be treated as a task
 * Basic heuristic: events with keywords like "TODO", "Task", or very short duration
 */
function isEventLikeTask(googleEvent: GoogleCalendarEvent): boolean {
  const summary = (googleEvent.summary || '').toLowerCase()
  const taskKeywords = ['todo', 'task', 'do:', 'action:', 'reminder:', '[ ]', '[x]']
  
  // Check for task keywords in title
  if (taskKeywords.some(keyword => summary.includes(keyword))) {
    return true
  }
  
  // Check for very short events (likely tasks)
  if (googleEvent.start?.dateTime && googleEvent.end?.dateTime) {
    const start = new Date(googleEvent.start.dateTime)
    const end = new Date(googleEvent.end.dateTime)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    if (durationMinutes <= 30) { // Events 30 minutes or less might be tasks
      return true
    }
  }
  
  return false
}

/**
 * Import events from a specific Google Calendar
 */
export async function importCalendarEvents(
  userId: string, 
  calendarId: string = 'primary',
  maxResults: number = 100
): Promise<SyncResult> {
  try {
    const calendar = await getCalendarClient(userId)
    
    // Get events from the last 30 days to next 365 days
    const timeMin = new Date()
    timeMin.setDate(timeMin.getDate() - 30)
    
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + 365)
    
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const googleEvents = response.data.items || []
    let eventsImported = 0
    let tasksImported = 0

    for (const googleEvent of googleEvents) {
      if (!googleEvent.id) continue

      // Check if we already have this event
      const existingEvent = await db.select()
        .from(events)
        .where(eq(events.googleEventId, googleEvent.id))
        .limit(1)

      const existingTask = await db.select()
        .from(tasks)
        .where(eq(tasks.googleEventId, googleEvent.id))
        .limit(1)

      // Skip if already synced
      if (existingEvent.length > 0 || existingTask.length > 0) {
        continue
      }

      // Decide whether to import as event or task
      if (isEventLikeTask(googleEvent)) {
        // Import as task
        const taskData = mapGoogleEventToAppTask(googleEvent, userId, calendarId)
        await db.insert(tasks).values(taskData)
        tasksImported++
      } else {
        // Import as event
        const eventData = mapGoogleEventToAppEvent(googleEvent, userId, calendarId)
        await db.insert(events).values(eventData)
        eventsImported++
      }
    }

    return {
      success: true,
      eventsImported,
      tasksImported,
    }
  } catch (error) {
    console.error('Calendar sync error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Import events from all user's calendars
 */
export async function importAllCalendarEvents(userId: string): Promise<SyncResult> {
  try {
    const calendar = await getCalendarClient(userId)
    
    // Get all calendars
    const calendarListResponse = await calendar.calendarList.list({
      maxResults: 50,
    })

    const calendars = calendarListResponse.data.items || []
    let totalEventsImported = 0
    let totalTasksImported = 0

    for (const cal of calendars) {
      if (!cal.id) continue
      
      // Skip calendars that are hidden or not selected
      if (cal.hidden || cal.selected === false) continue

      try {
        const result = await importCalendarEvents(userId, cal.id)
        if (result.success) {
          totalEventsImported += result.eventsImported || 0
          totalTasksImported += result.tasksImported || 0
        }
      } catch (error) {
        console.warn(`Failed to sync calendar ${cal.id}:`, error)
        // Continue with other calendars
      }
    }

    return {
      success: true,
      eventsImported: totalEventsImported,
      tasksImported: totalTasksImported,
    }
  } catch (error) {
    console.error('All calendars sync error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}