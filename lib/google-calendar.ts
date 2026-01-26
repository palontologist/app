import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import type { calendar_v3 } from "googleapis";

// Initialize OAuth2 client with environment variables
export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate authorization URL with calendar scopes
export function generateAuthUrl(): string {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // Force consent to ensure we get a refresh token
  });

  return authUrl;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    };
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    throw new Error("Failed to exchange authorization code for tokens");
  }
}

// Fetch calendar events from Google Calendar API
export async function fetchCalendarEvents(accessToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    // Get events for the next 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw new Error("Failed to fetch calendar events from Google");
  }
}

// Convert Google Calendar event to our event format
export function mapGoogleEventToDbEvent(
  googleEvent: calendar_v3.Schema$Event,
  userId: string
): {
  userId: string;
  title: string;
  eventDate: Date;
  eventTime: string | null;
  eventType: string | null;
  description: string | null;
  metadata: string;
  syncSource: string;
} {
  // Extract date and time from Google event
  const start = googleEvent.start?.dateTime || googleEvent.start?.date;
  const eventDate = new Date(start);

  // Extract time if it's a timed event (dateTime) vs all-day event (date)
  let eventTime: string | null = null;
  if (googleEvent.start?.dateTime) {
    eventTime = eventDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Store Google event metadata for reference
  const metadata = JSON.stringify({
    googleEventId: googleEvent.id,
    googleCalendarId: googleEvent.organizer?.email || "primary",
    location: googleEvent.location,
    htmlLink: googleEvent.htmlLink,
    attendees: googleEvent.attendees?.map((a: any) => a.email),
  });

  return {
    userId,
    title: googleEvent.summary || "Untitled Event",
    eventDate,
    eventTime,
    eventType: googleEvent.eventType || null,
    description: googleEvent.description || null,
    metadata,
    syncSource: "google",
  };
}
