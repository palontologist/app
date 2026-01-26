import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { syncGoogleCalendarOnce } from "@/app/actions/google-calendar";

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

    // Fetch and sync calendar events immediately (don't store token)
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
