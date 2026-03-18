import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAuthUrl, defaultCalendarScopes } from '@/lib/google/oauth'

export async function GET() {
  try {
    const session = await auth()
    if (!session.userId) {
      return NextResponse.redirect(
        new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      )
    }

    console.log('Google auth start: Generating auth URL for user', session.userId)

    // Encode userId as state so the callback can recover it across browsers
    const state = Buffer.from(session.userId).toString('base64url')
    const url = getAuthUrl(defaultCalendarScopes, state)

    console.log('Google auth start: Redirecting to Google OAuth')
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Google auth start error:', error)
    return NextResponse.json(
      { error: 'Failed to start Google authentication', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
