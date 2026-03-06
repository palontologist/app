# Google Calendar API Setup Guide

This guide will help you set up and troubleshoot the Google Calendar integration in your application.

## Quick Start

### Prerequisites
- A Google Cloud Platform account
- Your application deployed or running locally

### Required Environment Variables

You need to configure these environment variables:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/auth/callback  # For local dev
# OR
GOOGLE_REDIRECT_URI=https://your-domain.com/api/google/auth/callback  # For production
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For local dev
# OR
NEXT_PUBLIC_APP_URL=https://your-domain.com  # For production
```

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in required fields:
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. Add required scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.readonly`
6. For testing, add test users (your email addresses)
7. Click "Save and Continue"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose **Web application** as the application type
4. Configure:
   - Name: Your app name (e.g., "My App - Web Client")
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://your-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/google/auth/callback` (for local development)
     - `https://your-domain.com/api/google/auth/callback` (for production)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

### 4. Configure Environment Variables

#### For Local Development

Create a `.env.local` file in your project root:

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### For Production (Vercel, Netlify, etc.)

1. Go to your hosting platform's dashboard
2. Navigate to your project's environment variables settings
3. Add each variable with the production values
4. **Important**: Update `GOOGLE_REDIRECT_URI` to use your production domain
5. Redeploy your application

### 5. Test the Integration

1. **Check Configuration**:
   - Visit: `http://localhost:3000/api/google/health` (or your production URL)
   - This endpoint will tell you if your OAuth is properly configured

2. **Start OAuth Flow**:
   - Visit: `http://localhost:3000/api/google/auth/start`
   - You should be redirected to Google for authentication
   - After authentication, you'll be redirected back to your app

3. **Verify Connection**:
   - Check your profile page for Google Calendar connection status
   - Look for success message or error details

## Troubleshooting

### Error: "Missing Google OAuth environment variables"

**Problem**: The application can't find one or more required environment variables.

**Solution**:
1. Check that all four variables are set: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`
2. Verify there are no typos in variable names (they're case-sensitive)
3. For local development, make sure you have a `.env.local` file
4. For production, redeploy after adding environment variables

**Test**: Visit `/api/google/health` to see which variables are missing

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution**:
1. Check your `GOOGLE_REDIRECT_URI` environment variable
2. Go to Google Cloud Console → Credentials
3. Edit your OAuth client
4. Make sure the exact URI is listed in "Authorized redirect URIs"
5. Common issues:
   - Trailing slash (don't include it)
   - HTTP vs HTTPS mismatch
   - Different port number
   - Missing `/api/google/auth/callback` path

### Error: "access_denied"

**Problem**: User denied access, or the app is not approved.

**Solution**:
1. Make sure the OAuth consent screen is properly configured
2. If in testing mode, add your email as a test user
3. Check that all required scopes are added to the consent screen
4. Try revoking permissions and re-authorizing:
   - Go to [Google Account Permissions](https://myaccount.google.com/permissions)
   - Remove your app
   - Try connecting again

### Error: "invalid_client"

**Problem**: The client ID or secret is incorrect.

**Solution**:
1. Verify you copied the entire Client ID (should end with `.apps.googleusercontent.com`)
2. Verify you copied the entire Client Secret
3. Make sure you're using credentials from a "Web application" client, not other types
4. Check for extra spaces or line breaks in the environment variables

### Error: "Compilation stops at /api/google/auth/callback"

**Problem**: Missing environment variables during build/compilation.

**Solution**:
1. This happens when Next.js tries to compile the route but environment variables aren't set
2. Set the environment variables before running `npm run dev` or `npm run build`
3. For CI/CD, make sure environment variables are available during the build step
4. Check the health endpoint to confirm configuration

### Error: "No tokens received from Google"

**Problem**: The token exchange failed.

**Solution**:
1. This usually means the authorization code was invalid or expired
2. Try the authentication flow again
3. Check that your redirect URI matches exactly
4. Look at the server logs for more details

## Checking Your Configuration

Use the health check endpoint to verify your setup:

```bash
# Local
curl http://localhost:3000/api/google/health

# Production
curl https://your-domain.com/api/google/health
```

Response examples:

**✅ Properly Configured**:
```json
{
  "configured": true,
  "userAuthenticated": true,
  "message": "Google OAuth is properly configured",
  "redirectUri": "https://your-domain.com/api/google/auth/callback"
}
```

**❌ Missing Variables**:
```json
{
  "configured": false,
  "error": "Missing required Google OAuth environment variables",
  "missingVariables": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  "userAuthenticated": true,
  "message": "Please configure the following environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
}
```

## Common Setup Mistakes

1. **Wrong Client Type**: Using credentials from "Desktop app" or "iOS app" instead of "Web application"
2. **Redirect URI Mismatch**: The URI in environment variables doesn't exactly match Google Cloud Console
3. **Missing Scopes**: Not adding all required scopes to the OAuth consent screen
4. **Environment Variables Not Loaded**: Forgetting to restart the dev server after changing `.env.local`
5. **Publishing Status**: In production, the app might need to be verified if not in testing mode

## Development vs Production

### Development Setup
- Use `http://localhost:3000`
- Add as an authorized origin and redirect URI
- Test with your own Google account
- Errors appear in console logs

### Production Setup
- Use your production domain (`https://your-domain.com`)
- Add production URLs to Google Cloud Console
- Environment variables must be set in hosting platform
- Errors appear in server logs (check Vercel/Netlify logs)
- May need to verify the app for public use

## Security Notes

1. **Never commit secrets**: Don't commit `.env.local` or expose your Client Secret
2. **Use HTTPS in production**: Always use HTTPS for redirect URIs in production
3. **Scope principle of least privilege**: Only request the calendar scopes you need
4. **Rotate secrets regularly**: Update your Client Secret periodically
5. **Monitor OAuth usage**: Check Google Cloud Console for unusual activity

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)

## Still Having Issues?

1. Check the health endpoint: `/api/google/health`
2. Review server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Check Google Cloud Console for any warnings or restrictions
5. Try with a fresh OAuth client (create new credentials)
6. Review the troubleshooting guide above

For more help, see `google-oauth-troubleshooting.md` in the project root.
