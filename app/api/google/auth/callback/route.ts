import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, googleAccounts } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createOAuthClient } from '@/lib/google/oauth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session.userId) {
      console.log('Google auth callback: No user session found, redirecting to sign-in')
      return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    console.log('Google auth callback: Processing for user', session.userId)
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      console.error('Google auth callback: OAuth error received:', error)
      return NextResponse.redirect(new URL(`/profile?google_error=${encodeURIComponent(error)}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }
    if (!code) {
      console.error('Google auth callback: No authorization code received')
      return NextResponse.redirect(new URL('/profile?google_error=missing_code', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    try {
      console.log('Google auth callback: Creating OAuth client')
      const client = createOAuthClient()
      console.log('Google auth callback: Exchanging code for tokens')
      const { tokens } = await client.getToken(code)
      client.setCredentials(tokens)

      console.log('Google auth callback: Tokens received, checking for ID token')
      const idToken = tokens.id_token
      if (!idToken) {
        console.error('Google auth callback: Missing ID token in OAuth response')
        return NextResponse.redirect(new URL('/profile?google_error=missing_id_token', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
      }

      console.log('Google auth callback: Verifying ID token')
      const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
      const payload = ticket.getPayload()
      const googleUserId = payload?.sub
      const email = payload?.email || null

      if (!googleUserId) {
        console.error('Google auth callback: Missing Google user ID in token payload')
        return NextResponse.redirect(new URL('/profile?google_error=missing_google_user', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
      }

      // Upsert into google_accounts
      console.log('Google auth callback: Storing tokens for user', session.userId)
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
        console.error('Google auth callback: No refresh token received')
        return NextResponse.redirect(new URL('/profile?google_error=no_refresh_token', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
      }

      if (existing.length > 0) {
        console.log('Google auth callback: Updating existing Google account record')
        await db.update(googleAccounts).set(record).where(eq(googleAccounts.userId, session.userId))
      } else {
        console.log('Google auth callback: Creating new Google account record')
        await db.insert(googleAccounts).values({ ...record, createdAt: Date.now() })
      }

      console.log('Google auth callback: Successfully connected Google account')
      return NextResponse.redirect(new URL('/profile?google_connected=1', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    } catch (e) {
      console.error('Google OAuth callback error:', e)
      return NextResponse.redirect(new URL('/profile?google_error=callback_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }
  } catch (e) {
    console.error('Google OAuth callback outer error:', e)
    return NextResponse.redirect(new URL('/profile?google_error=callback_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }
}

