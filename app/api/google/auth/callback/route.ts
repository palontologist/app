import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, googleAccounts } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createOAuthClient } from '@/lib/google/oauth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session.userId) {
      console.log('Google auth callback: No user session')
      return NextResponse.redirect(new URL('/sign-in?redirect_url=/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    console.log('Google auth callback: Processing for user', session.userId)
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const state = url.searchParams.get('state')

    if (error) {
      console.error('Google auth callback: OAuth error:', error)
      return NextResponse.redirect(new URL(`/dashboard?google_error=${encodeURIComponent(error)}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }
    if (!code) {
      console.error('Google auth callback: No code received')
      return NextResponse.redirect(new URL('/dashboard?google_error=missing_code', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    console.log('Google auth callback: Exchanging code for tokens')
    const client = createOAuthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    console.log('Google auth callback: Tokens received')

    const accessToken = tokens.access_token || null
    const refreshToken = (tokens.refresh_token as string) || null

    if (!refreshToken) {
      console.warn('Google auth callback: No refresh token (may be a re-auth)')
    }

    // Store tokens
    const existing = await db.select().from(googleAccounts).where(eq(googleAccounts.userId, session.userId))
    const record = {
      userId: session.userId,
      accessToken,
      refreshToken: refreshToken || existing[0]?.refreshToken || '',
      expiryDate: tokens.expiry_date || null,
      scope: (tokens.scope as string) || null,
      tokenType: (tokens.token_type as string) || null,
      updatedAt: Date.now(),
    }

    if (existing.length > 0) {
      console.log('Google auth callback: Updating existing record')
      await db.update(googleAccounts).set(record).where(eq(googleAccounts.userId, session.userId))
    } else {
      console.log('Google auth callback: Creating new record')
      await db.insert(googleAccounts).values({ ...record, createdAt: Date.now() })
    }

    console.log('Google auth callback: Success!')
    return NextResponse.redirect(new URL('/dashboard?google_connected=1', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  } catch (e) {
    console.error('Google auth callback error:', e)
    return NextResponse.redirect(new URL('/dashboard?google_error=callback_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }
}

