# Google OAuth Troubleshooting Guide

## Overview
This guide will help you debug and fix issues with the Google Calendar integration in your Greta app.

## Step 1: Environment Variables Check

Make sure you have all required environment variables set in Vercel:

### Required Variables:
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - Your callback URL (e.g., `https://greta-v2.vercel.app/api/google/auth/callback`)
- `NEXT_PUBLIC_APP_URL` - Your app URL (e.g., `https://greta-v2.vercel.app`)

### How to Set in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the correct values
4. Redeploy your application

## Step 2: Google Cloud Console Configuration

### 1. OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "OAuth consent screen"
3. Make sure:
   - User type is set to "External" (for testing) or "Internal"
   - Required scopes are added:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/calendar.readonly`

### 2. OAuth 2.0 Client IDs
1. Go to "APIs & Services" → "Credentials"
2. Find your OAuth 2.0 Client ID or create a new one
3. Make sure:
   - Application type is "Web application"
   - Authorized redirect URIs include: `https://greta-v2.vercel.app/api/google/auth/callback`
   - Authorized JavaScript origins include: `https://greta-v2.vercel.app`

## Step 3: Test the Configuration

### Local Testing
1. Create a `.env.local` file with your environment variables
2. Run the test script:
   ```bash
   node test-google-oauth.js
   ```
3. This will verify your OAuth configuration and generate a test auth URL

### Production Testing
1. Make sure all environment variables are set in Vercel
2. Redeploy your application
3. Try accessing the auth URL: `https://greta-v2.vercel.app/api/google/auth/start`
4. Check the browser's network tab and console for errors

## Step 4: Common Issues and Solutions

### Issue: "Missing Google OAuth env vars"
**Solution:**
- Verify all environment variables are set in Vercel
- Make sure variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Issue: "redirect_uri_mismatch"
**Solution:**
- Check that your redirect URI in Vercel matches exactly what you have in Google Cloud Console
- Include the full path: `https://greta-v2.vercel.app/api/google/auth/callback`
- No trailing slashes

### Issue: "access_denied"
**Solution:**
- Make sure the OAuth consent screen is properly configured
- Verify the scopes match between your app and Google Cloud Console
- Try revoking app permissions and re-authorizing

### Issue: "invalid_client"
**Solution:**
- Verify your Google Client ID and Secret are correct
- Make sure you're using the correct client ID for web applications
- Check that the redirect URI is properly registered

### Issue: "invalid_grant"
**Solution:**
- This usually happens after token expiry or if the refresh token is invalid
- Try revoking permissions and re-authorizing the app

## Step 5: Debugging Steps

1. **Check Vercel Function Logs:**
   - Go to your Vercel project
   - Navigate to Functions tab
   - Look for logs from the Google auth routes

2. **Check Browser Network Tab:**
   - Open browser DevTools
   - Go to Network tab
   - Try accessing the auth URL and look for failed requests

3. **Check Browser Console:**
   - Look for any JavaScript errors or console messages

4. **Test with Different Browsers:**
   - Sometimes browser-specific issues can occur

## Step 6: Manual Testing

If automated tests don't work, you can manually test the OAuth flow:

1. Visit: `https://greta-v2.vercel.app/api/google/auth/start`
2. You should be redirected to Google for authentication
3. After authentication, you should be redirected back to your app
4. Check the URL for success (`?google_connected=1`) or error parameters

## Step 7: Getting Help

If you're still having issues:

1. Check the Vercel function logs for detailed error messages
2. Verify your Google Cloud Console configuration step-by-step
3. Make sure your environment variables are correctly set
4. Try the test script to isolate configuration issues

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API Scopes](https://developers.google.com/calendar/auth)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)