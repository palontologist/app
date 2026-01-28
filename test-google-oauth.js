// Simple test script to verify Google OAuth configuration
// Run with: node test-google-oauth.js

require('dotenv').config({ path: '.env.local' })

const { createOAuthClient } = require('./lib/google/oauth')

console.log('Testing Google OAuth configuration...')

try {
  const client = createOAuthClient()
  console.log('✅ OAuth client created successfully')

  // Test auth URL generation
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
  })

  console.log('✅ Auth URL generated successfully')
  console.log('Auth URL:', authUrl)

  console.log('\n🔍 Environment Variables Check:')
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing')
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing')
  console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL ? '✅ Set' : '❌ Missing')

} catch (error) {
  console.error('❌ OAuth configuration error:', error.message)
}