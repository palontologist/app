# Required Redirect URIs for Greta App

This document outlines all the redirect URIs that need to be registered in various external services for the Greta application to function properly.

## Clerk Authentication URIs

Clerk is used for user authentication and organization management. With the current Clerk setup using `[[...sign-in]]` and `[[...sign-up]]` catch-all routes, Clerk automatically handles OAuth redirects. You need to register these redirect URIs in your Clerk dashboard:

### Production URIs
Replace `your-domain.com` with your actual production domain:

```
https://your-domain.com/sign-in
https://your-domain.com/sign-up
```

### Development URIs
For local development:

```
http://localhost:3000/sign-in
http://localhost:3001/sign-in
http://localhost:3000/sign-up
http://localhost:3001/sign-up
```

### GitHub Codespaces URIs
For GitHub Codespaces development (replace the codespace URL as needed):

```
https://ideal-broccoli-jp9rgg7qvr7f5p5r-3000.app.github.dev/sign-in
https://ideal-broccoli-jp9rgg7qvr7f5p5r-3001.app.github.dev/sign-in
https://ideal-broccoli-jp9rgg7qvr7f5p5r-3000.app.github.dev/sign-up
https://ideal-broccoli-jp9rgg7qvr7f5p5r-3001.app.github.dev/sign-up
```

**Note**: The `[[...sign-in]]` and `[[...sign-up]]` catch-all routes automatically handle OAuth provider callbacks within these paths.

## Google OAuth URIs

Google OAuth is used for calendar integration. Register these URIs in your Google Cloud Console OAuth consent screen:

### Production URIs
Replace `your-domain.com` with your actual production domain:

```
https://your-domain.com/api/google/auth/callback
```

### Development URIs
For local development:

```
http://localhost:3000/api/google/auth/callback
http://localhost:3001/api/google/auth/callback
```

### GitHub Codespaces URIs
For GitHub Codespaces development:

```
https://ideal-broccoli-jp9rgg7qvr7f5p5r-3000.app.github.dev/api/google/auth/callback
https://ideal-broccoli-jp9rgg7qvr7f5p5r-3001.app.github.dev/api/google/auth/callback
```

## Required Environment Variables

Make sure these environment variables are set:

### Clerk Configuration
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_DEFAULT_ORG_ID=org_... # Optional
```

### Google OAuth Configuration
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/google/auth/callback
```

### Application URL
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com  # or http://localhost:3000 for dev
```

## Authentication Flow Overview

### Clerk Authentication
1. Users access `/sign-in` or `/sign-up` routes (with Clerk UI components)
2. For OAuth providers (Google, GitHub, etc.), Clerk handles the OAuth flow internally
3. The `[[...sign-in]]` and `[[...sign-up]]` catch-all routes handle all OAuth callbacks
4. After successful authentication, users are redirected to:
   - `/dashboard` (for existing users who have completed onboarding)
   - `/onboarding` (for new users)
   - Custom redirect via `redirect_url` query parameter (e.g., `/sign-in?redirect_url=/profile`)

### Google OAuth Flow (for Calendar Integration)
1. Users initiate Google calendar connection from `/profile` page
2. System redirects to `/api/google/auth/start` which generates the Google OAuth URL
3. User is redirected to Google OAuth consent screen
4. User grants calendar permissions
5. Google redirects back to `/api/google/auth/callback`
6. System processes the OAuth tokens, stores them in the database
7. User is redirected back to `/profile` with success/error status

### Important Notes
- Clerk OAuth is separate from Google OAuth - Clerk handles user authentication, Google OAuth handles calendar access
- The app supports both authentication flows independently
- Users must be authenticated via Clerk before they can connect their Google calendar

## Quick Setup Checklist

### Before You Start
- [ ] Create a Clerk account and application
- [ ] Create a Google Cloud project (if using calendar integration)
- [ ] Set up your database (Turso)

### Clerk Configuration
- [ ] Copy your Clerk publishable key to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] Copy your Clerk secret key to `CLERK_SECRET_KEY`
- [ ] In Clerk dashboard → Configure → Domains, add your redirect URLs:
  - [ ] `http://localhost:3000/sign-in` (development)
  - [ ] `http://localhost:3000/sign-up` (development)
  - [ ] `https://your-domain.com/sign-in` (production)
  - [ ] `https://your-domain.com/sign-up` (production)

### Google OAuth Configuration (Optional - for calendar integration)
- [ ] Enable Google Calendar API in Google Cloud Console
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URI: `http://localhost:3000/api/google/auth/callback` (development)
- [ ] Add authorized redirect URI: `https://your-domain.com/api/google/auth/callback` (production)
- [ ] Copy client ID to `GOOGLE_CLIENT_ID`
- [ ] Copy client secret to `GOOGLE_CLIENT_SECRET`
- [ ] Set `GOOGLE_REDIRECT_URI` to match your registered URI

### Environment Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all required environment variables
- [ ] Set `NEXT_PUBLIC_APP_URL` to your application URL

### Testing
- [ ] Run `npm run dev` and test sign-in flow
- [ ] Test sign-up flow for new users
- [ ] Test Google calendar connection (if configured)

## Setup Instructions

### 1. Clerk Dashboard Setup
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to "Configure" → "Domains"
4. Add your redirect URIs listed above under "Allowed redirect URLs"

### 2. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to "APIs & Services" → "OAuth consent screen"
4. Add the Google OAuth redirect URIs listed above to "Authorized redirect URIs"
5. Enable the Calendar API in "APIs & Services" → "Library"

### 3. Environment Variables
Set all the required environment variables in your deployment platform (Vercel, etc.) or local `.env.local` file.

## Troubleshooting

### Common Issues
1. **Redirect URI mismatch**: Ensure the exact URIs are registered in both Clerk and Google
2. **Environment variables missing**: Double-check all required environment variables are set
3. **HTTPS requirement**: Production URLs must use HTTPS
4. **Port variations**: If using different ports in development, register all port variations

### Error Messages
- "Invalid redirect URI": Check that the URI is exactly registered in the service
- "Missing environment variables": Verify all required environment variables are set
- "Google OAuth callback error": Check Google Cloud Console configuration and API enablement

## Notes

- The application supports multiple development environments (localhost, Codespaces)
- All authentication redirects are handled server-side for security
- Calendar integration requires users to grant appropriate Google permissions
- Organization management through Clerk allows team collaboration features