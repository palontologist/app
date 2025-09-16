import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAuthUrl, defaultCalendarScopes } from '@/lib/google/oauth'

export async function GET() {
  const session = await auth()
  if (!session.userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }

  const url = getAuthUrl(defaultCalendarScopes)
  return NextResponse.redirect(url)
}

