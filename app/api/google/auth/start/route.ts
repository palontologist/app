import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAuthUrl, defaultCalendarScopes } from '@/lib/google/oauth'

export async function GET() {
  const session = await auth()
  if (!session.userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }

  try {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(new URL('/profile?google_error=missing_env', appUrl))
    }

    const url = getAuthUrl(defaultCalendarScopes)
    return NextResponse.redirect(url)
  } catch (e) {
    console.error('auth/start error', e)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/profile?google_error=auth_start_failed', appUrl))
  }
}

