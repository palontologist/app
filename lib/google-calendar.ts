import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import type { calendar_v3 } from "googleapis";
import { db, googleAccounts } from "@/lib/db";
import { eq } from "drizzle-orm";

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

// Get stored Google account tokens for a user
export async function getStoredTokens(userId: string) {
  const account = await db
    .select()
    .from(googleAccounts)
    .where(eq(googleAccounts.userId, userId))
    .limit(1);

  return account[0] || null;
}

// Store or update Google account tokens
export async function storeTokens(
  userId: string,
  tokens: {
    accessToken?: string | null;
    refreshToken?: string | null;
    expiryDate?: number | null;
    scope?: string | null;
    tokenType?: string | null;
  },
  googleUserInfo?: {
    googleUserId: string;
    email?: string | null;
  }
) {
  const existingAccount = await getStoredTokens(userId);

  if (existingAccount) {
    // Update existing account
    await db
      .update(googleAccounts)
      .set({
        accessToken: tokens.accessToken || existingAccount.accessToken,
        refreshToken: tokens.refreshToken || existingAccount.refreshToken,
        expiryDate: tokens.expiryDate || existingAccount.expiryDate,
        scope: tokens.scope || existingAccount.scope,
        tokenType: tokens.tokenType || existingAccount.tokenType,
        updatedAt: new Date(),
      })
      .where(eq(googleAccounts.userId, userId));
  } else if (googleUserInfo) {
    // Create new account
    await db.insert(googleAccounts).values({
      userId,
      googleUserId: googleUserInfo.googleUserId,
      email: googleUserInfo.email || null,
      accessToken: tokens.accessToken || null,
      refreshToken: tokens.refreshToken || null,
      expiryDate: tokens.expiryDate || null,
      scope: tokens.scope || null,
      tokenType: tokens.tokenType || null,
    });
  } else {
    throw new Error("Cannot create new Google account without user info");
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(userId: string): Promise<string> {
  const account = await getStoredTokens(userId);
  
  if (!account || !account.refreshToken) {
    throw new Error("No refresh token found for user");
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: account.refreshToken,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update stored tokens
    await storeTokens(userId, {
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date,
      tokenType: credentials.token_type,
      scope: credentials.scope,
    });

    return credentials.access_token!;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error("Failed to refresh access token");
  }
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await getStoredTokens(userId);
  
  if (!account) {
    throw new Error("No Google account connected");
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now();
  const expiryBuffer = 5 * 60 * 1000; // 5 minutes
  
  if (account.expiryDate && account.expiryDate < now + expiryBuffer) {
    // Token expired or expiring soon, refresh it
    return await refreshAccessToken(userId);
  }

  if (!account.accessToken) {
    // No access token, try to refresh
    return await refreshAccessToken(userId);
  }

  return account.accessToken;
}

// Create event in Google Calendar
export async function createGoogleCalendarEvent(
  userId: string,
  event: {
    title: string;
    description?: string;
    startDateTime: Date;
    endDateTime: Date;
    location?: string;
    timeZone?: string;
  }
) {
  const accessToken = await getValidAccessToken(userId);
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Use provided timezone or default to UTC
  const timeZone = event.timeZone || "UTC";

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startDateTime.toISOString(),
          timeZone,
        },
        end: {
          dateTime: event.endDateTime.toISOString(),
          timeZone,
        },
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    throw new Error("Failed to create event in Google Calendar");
  }
}

// Update Google Calendar event (e.g. mark as completed via description)
export async function updateGoogleCalendarEvent(
  userId: string,
  googleEventId: string,
  updates: { description?: string; summary?: string }
) {
  const accessToken = await getValidAccessToken(userId);
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId: googleEventId,
      requestBody: updates,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating Google Calendar event:", error);
    throw new Error("Failed to update event in Google Calendar");
  }
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
  source: string;
  googleEventId: string | null;
  googleCalendarId: string;
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
    source: "google",
    googleEventId: googleEvent.id ?? null,
    googleCalendarId: googleEvent.organizer?.email || "primary",
  };
}
