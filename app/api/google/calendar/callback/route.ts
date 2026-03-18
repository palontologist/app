import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeCodeForTokens, storeTokens } from "@/lib/google-calendar";
import { syncGoogleCalendarOnce } from "@/app/actions/google-calendar";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const stateParam = searchParams.get("state");

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(`${appUrl}/dashboard?error=oauth_denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/dashboard?error=missing_code`);
    }

    // Resolve userId: prefer live Clerk session, fall back to state param
    // (state is base64url-encoded userId set by the /connect or /auth/start routes)
    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      userId = clerkId;
    } catch {
      // Clerk auth failed (common in cross-browser OAuth redirects)
    }

    if (!userId && stateParam) {
      try {
        userId = Buffer.from(stateParam, "base64url").toString("utf-8");
        console.log("Calendar callback: recovered userId from state param");
      } catch {
        console.error("Calendar callback: failed to decode state param");
      }
    }

    if (!userId) {
      return NextResponse.redirect(`${appUrl}/sign-in?redirect_url=/dashboard`);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.accessToken) {
      return NextResponse.redirect(`${appUrl}/dashboard?error=token_exchange_failed`);
    }

    // Get Google user info
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ access_token: tokens.accessToken });
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Persist tokens
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

    // Sync calendar events
    const result = await syncGoogleCalendarOnce(tokens.accessToken);

    return NextResponse.redirect(
      `${appUrl}/dashboard?success=calendar_synced&synced=${result.syncedCount}&skipped=${result.skippedCount}`
    );
  } catch (error) {
    console.error("Error in /api/google/calendar/callback:", error);
    const errorMessage = error instanceof Error ? error.message : "sync_failed";
    return NextResponse.redirect(`${appUrl}/dashboard?error=${encodeURIComponent(errorMessage)}`);
  }
}
