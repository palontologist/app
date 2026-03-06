import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env

export function createOAuthClient(): OAuth2Client {
  const missing = []
  if (!GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID')
  if (!GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET')
  if (!GOOGLE_REDIRECT_URI) missing.push('GOOGLE_REDIRECT_URI')

  if (missing.length > 0) {
    const errorMsg = `Missing Google OAuth environment variables: ${missing.join(', ')}. Please set these in your environment configuration (e.g., .env.local for development or your hosting platform's environment variables).`
    console.error('❌ Google OAuth Configuration Error:', errorMsg)
    throw new Error(errorMsg)
  }

  console.log('✅ Google OAuth client created successfully')
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

  console.log('Google OAuth: Generating auth URL with scopes:', finalScopes.join(' '))
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: finalScopes,
  })

  console.log('Google OAuth: Generated auth URL')
  return authUrl
}

export const defaultCalendarScopes = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
]

