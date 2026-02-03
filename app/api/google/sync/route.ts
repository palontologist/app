import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { events } from '@/db/schema'
import { createOAuthClient } from '@/lib/google/oauth'
import { google } from 'googleapis'
import type { calendar_v3 } from 'googleapis'
import { eq, and, notInArray } from 'drizzle-orm'

interface SyncResult {
  synced: number
  updated: number
  deleted: number
  errors: string[]
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const calendarId = body.calendarId || 'primary'
    const startDate = body.startDate ? new Date(body.startDate) : new Date()
    const endDate = body.endDate ? new Date(body.endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days ahead
    const deletePreviousSynced = body.deletePreviousSynced ?? true

    // Fetch Google account
    const googleAccount = await db.query.googleAccounts.findFirst({
      where: (table, { eq }) => eq(table.userId, userId),
    })

    if (!googleAccount) {
      return Response.json(
        { error: 'Google account not connected' },
        { status: 404 }
      )
    }

    // Setup OAuth client
    const oauthClient = createOAuthClient()
    oauthClient.setCredentials({
      access_token: googleAccount.accessToken,
      refresh_token: googleAccount.refreshToken,
      expiry_date: googleAccount.expiryDate,
    })

    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauthClient })

    // Fetch Google Calendar events
    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 250,
      orderBy: 'startTime',
      singleEvents: true,
    })

    const result: SyncResult = {
      synced: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    }

    // Process each event
    const syncedEventIds: string[] = []

    for (const event of response.data.items || []) {
      try {
        if (!event.id || !event.start) {
          continue
        }

        syncedEventIds.push(event.id)

        // Parse event dates
        const startTime = event.start.dateTime || event.start.date
        const endTime = event.end?.dateTime || event.end?.date
        const isAllDay = !event.start.dateTime && !!event.start.date

        if (!startTime) {
          result.errors.push(`Event ${event.id} has no start time`)
          continue
        }

        const eventDateMs = new Date(startTime).getTime()

        // Check if event already exists
        const existingEvent = await db.query.events.findFirst({
          where: (table, { eq, and }) =>
            and(
              eq(table.userId, userId),
              eq(table.googleEventId, event.id)
            ),
        })

        const eventData = {
          userId,
          title: event.summary || 'Untitled Event',
          eventDate: eventDateMs,
          eventTime: isAllDay ? undefined : new Date(startTime).toLocaleTimeString(),
          eventType: 'google_calendar',
          description: event.description,
          source: 'google' as const,
          googleEventId: event.id,
          googleCalendarId: calendarId,
        }

        if (existingEvent) {
          // Update existing event
          await db
            .update(events)
            .set({
              ...eventData,
            })
            .where(
              and(
                eq(events.userId, userId),
                eq(events.googleEventId, event.id)
              )
            )

          result.updated++
        } else {
          // Insert new event
          await db.insert(events).values(eventData)
          result.synced++
        }
      } catch (error) {
        result.errors.push(
          `Failed to sync event ${event.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    }

    // Optionally delete previously synced events that are no longer in Google Calendar
    if (deletePreviousSynced && syncedEventIds.length > 0) {
      const eventsToDelete = await db.query.events.findMany({
        where: (table, { eq, and, notInArray }) =>
          and(
            eq(table.userId, userId),
            eq(table.source, 'google'),
            eq(table.googleCalendarId, calendarId),
            notInArray(table.googleEventId, syncedEventIds)
          ),
      })

      for (const event of eventsToDelete) {
        await db.delete(events).where(eq(events.id, event.id))
        result.deleted++
      }
    }

    return Response.json({
      success: true,
      result,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error syncing Google Calendar:', error)

    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        return Response.json(
          {
            error: 'Google authentication expired. Please reconnect your Google account.',
          },
          { status: 401 }
        )
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(
      { error: 'Failed to sync Google Calendar events' },
      { status: 500 }
    )
  }
}
