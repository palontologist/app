import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { importAllCalendarEvents, importCalendarEvents } from '@/lib/google/calendar-sync'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { calendarId } = body

    let result
    if (calendarId) {
      // Sync specific calendar
      result = await importCalendarEvents(session.userId, calendarId)
    } else {
      // Sync all calendars
      result = await importAllCalendarEvents(session.userId)
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.eventsImported || 0} events and ${result.tasksImported || 0} tasks`,
      eventsImported: result.eventsImported || 0,
      tasksImported: result.tasksImported || 0,
    })
  } catch (error) {
    console.error('Calendar sync API error:', error)
    return NextResponse.json(
      { error: 'Failed to sync calendar events' },
      { status: 500 }
    )
  }
}