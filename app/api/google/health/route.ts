import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session.userId) {
      return NextResponse.json({
        configured: false,
        error: 'User not authenticated',
        userAuthenticated: false,
      }, { status: 401 })
    }

    // Check if required environment variables are set
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env
    const missing = []
    
    if (!GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID')
    if (!GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET')
    if (!GOOGLE_REDIRECT_URI) missing.push('GOOGLE_REDIRECT_URI')

    if (missing.length > 0) {
      return NextResponse.json({
        configured: false,
        error: 'Missing required Google OAuth environment variables',
        missingVariables: missing,
        userAuthenticated: true,
        message: `Please configure the following environment variables: ${missing.join(', ')}`,
      }, { status: 500 })
    }

    return NextResponse.json({
      configured: true,
      userAuthenticated: true,
      message: 'Google OAuth is properly configured',
      redirectUri: GOOGLE_REDIRECT_URI,
    })
  } catch (error) {
    console.error('Google OAuth health check error:', error)
    return NextResponse.json({
      configured: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
