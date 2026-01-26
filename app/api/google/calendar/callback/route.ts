import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeCodeForTokens, storeTokens } from "@/lib/google-calendar";
import { syncGoogleCalendarOnce } from "@/app/actions/google-calendar";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();

    if (!userId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${appUrl}/sign-in?redirect_url=/dashboard`
      );
    }

    // Extract authorization code from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Handle OAuth errors (e.g., user denied access)
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=oauth_denied`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=missing_code`
      );
    }

    // Exchange code for access token
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.accessToken) {
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=token_exchange_failed`
      );
    }

    // Get Google user info to store with tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ access_token: tokens.accessToken });
    
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Store tokens persistently for future use
    await storeTokens(
      userId,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: tokens.expiryDate,
        scope: tokens.scope,
        tokenType: tokens.tokenType,
      },
      {
        googleUserId: userInfo.data.id!,
        email: userInfo.data.email,
      }
    );

    // Fetch and sync calendar events
    const result = await syncGoogleCalendarOnce(tokens.accessToken);

    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      `${appUrl}/dashboard?success=calendar_synced&synced=${result.syncedCount}&skipped=${result.skippedCount}`
    );
  } catch (error) {
    console.error("Error in /api/google/calendar/callback:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const errorMessage = error instanceof Error ? error.message : "sync_failed";
    return NextResponse.redirect(
      `${appUrl}/dashboard?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
