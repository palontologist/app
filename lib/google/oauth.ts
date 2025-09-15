import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env

export function createOAuthClient(): OAuth2Client {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Missing Google OAuth env vars')
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
}

export function getAuthUrl(scopes?: string[]): string {
  const client = createOAuthClient()
  const finalScopes = scopes && scopes.length > 0 ? scopes : [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.readonly',
  ]
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: finalScopes,
  })
}

export const defaultCalendarScopes = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
]

