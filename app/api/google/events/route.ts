import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createOAuthClient } from '@/lib/google/oauth'
import { google } from 'googleapis'
import type { calendar_v3 } from 'googleapis'

interface GoogleEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  allDay: boolean
  calendarId: string
  htmlLink: string
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const calendarId = url.searchParams.get('calendarId') || 'primary'
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Fetch Google account from database
    const googleAccount = await db.query.googleAccounts.findFirst({
      where: (table, { eq }) => eq(table.userId, userId),
    })

    if (!googleAccount) {
      return Response.json(
        { error: 'Google account not connected' },
        { status: 404 }
      )
    }

    // Create OAuth client
    const oauthClient = createOAuthClient()
    oauthClient.setCredentials({
      access_token: googleAccount.accessToken,
      refresh_token: googleAccount.refreshToken,
      expiry_date: googleAccount.expiryDate,
    })

    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauthClient })

    // Prepare query parameters
    const queryParams: calendar_v3.Params$Resource$Events$List = {
      calendarId,
      maxResults: 100,
      orderBy: 'startTime',
      singleEvents: true,
    }

    if (startDate) {
      queryParams.timeMin = new Date(startDate).toISOString()
    }
    if (endDate) {
      queryParams.timeMax = new Date(endDate).toISOString()
    }

    // Fetch events from Google Calendar
    const response = await calendar.events.list(queryParams)

    // Transform events to our format
    const events: GoogleEvent[] = (response.data.items || [])
      .filter((event): event is calendar_v3.Schema$Event => !!event.id)
      .map((event) => {
        const startTime = event.start?.dateTime || event.start?.date || ''
        const endTime = event.end?.dateTime || event.end?.date || ''
        const allDay = !event.start?.dateTime && !!event.start?.date

        return {
          id: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description,
          startTime,
          endTime,
          allDay,
          calendarId: calendarId || 'primary',
          htmlLink: event.htmlLink || '',
        }
      })

    return Response.json({ events, count: events.length })
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        return Response.json(
          { error: 'Google authentication expired. Please reconnect your Google account.' },
          { status: 401 }
        )
      }
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json(
      { error: 'Failed to fetch Google Calendar events' },
      { status: 500 }
    )
  }
}
