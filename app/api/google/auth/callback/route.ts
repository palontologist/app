import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, googleAccounts } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createOAuthClient } from '@/lib/google/oauth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session.userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/profile?google_error=${encodeURIComponent(error)}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }
  if (!code) {
    return NextResponse.redirect(new URL('/profile?google_error=missing_code', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }

  try {
    const client = createOAuthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    const idToken = tokens.id_token
    if (!idToken) {
      return NextResponse.redirect(new URL('/profile?google_error=missing_id_token', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    const googleUserId = payload?.sub
    const email = payload?.email || null

    if (!googleUserId) {
      return NextResponse.redirect(new URL('/profile?google_error=missing_google_user', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    // Upsert into google_accounts
    const existing = await db.select().from(googleAccounts).where(eq(googleAccounts.userId, session.userId))
    const record = {
      userId: session.userId,
      googleUserId,
      email,
      accessToken: tokens.access_token || null,
      refreshToken: (tokens.refresh_token as string) || (existing[0]?.refreshToken as string) || '',
      expiryDate: tokens.expiry_date || null,
      scope: (tokens.scope as string) || null,
      tokenType: (tokens.token_type as string) || null,
      updatedAt: Date.now(),
    }
    if (!record.refreshToken) {
      return NextResponse.redirect(new URL('/profile?google_error=no_refresh_token', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    if (existing.length > 0) {
      await db.update(googleAccounts).set(record).where(eq(googleAccounts.userId, session.userId))
    } else {
      await db.insert(googleAccounts).values({ ...record, createdAt: Date.now() })
    }

    return NextResponse.redirect(new URL('/profile?google_connected=1', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  } catch (e) {
    console.error('Google OAuth callback error', e)
    return NextResponse.redirect(new URL('/profile?google_error=callback_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }
}

