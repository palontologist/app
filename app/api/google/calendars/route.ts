import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, googleAccounts } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { google } from 'googleapis'
import { createOAuthClient } from '@/lib/google/oauth'

export async function GET() {
  const session = await auth()
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db.select().from(googleAccounts).where(eq(googleAccounts.userId, session.userId))
  if (rows.length === 0 || !rows[0].refreshToken) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 400 })
  }

  const row = rows[0]
  const client = createOAuthClient()
  client.setCredentials({
    refresh_token: row.refreshToken,
    access_token: row.accessToken || undefined,
    expiry_date: (row.expiryDate as number | null) || undefined,
  })

  const calendar = google.calendar({ version: 'v3', auth: client })
  const { data } = await calendar.calendarList.list({ maxResults: 50 })
  return NextResponse.json(data.items || [])
}

