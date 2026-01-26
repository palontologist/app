import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth();

    if (!userId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${appUrl}/sign-in?redirect_url=/dashboard`
      );
    }

    // Generate Google OAuth URL
    const authUrl = generateAuthUrl();

    // Redirect user to Google authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error in /api/google/calendar/connect:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/dashboard?error=oauth_setup_failed`
    );
  }
}
