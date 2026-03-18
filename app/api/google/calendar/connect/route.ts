import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.redirect(`${appUrl}/sign-in?redirect_url=/dashboard`);
    }

    // Encode userId as state so the callback can recover it
    // even when the Clerk session cookie isn't readable after cross-origin redirect
    const state = Buffer.from(userId).toString("base64url");
    const authUrl = generateAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error in /api/google/calendar/connect:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/dashboard?error=oauth_setup_failed`);
  }
}
