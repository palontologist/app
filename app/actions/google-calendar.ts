"use server";

import { auth } from "@clerk/nextjs/server";
import { db, events } from "@/lib/db";
import { fetchCalendarEvents, mapGoogleEventToDbEvent, getStoredTokens } from "@/lib/google-calendar";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;
    const account = await getStoredTokens(userId);
    return !!(account?.refreshToken);
  } catch {
    return false;
  }
}

export async function syncGoogleCalendarOnce(accessToken: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Fetch events from Google Calendar
    const googleEvents = await fetchCalendarEvents(accessToken);

    if (!googleEvents || googleEvents.length === 0) {
      return {
        success: true,
        message: "No upcoming events found in your Google Calendar",
        syncedCount: 0,
      };
    }

    // Convert Google events to our format
    const mappedEvents = googleEvents.map((googleEvent: any) =>
      mapGoogleEventToDbEvent(googleEvent, userId)
    );

    // Check for duplicates and insert new events
    let syncedCount = 0;
    let skippedCount = 0;

    for (const event of mappedEvents) {
      // Prefer duplicate check by googleEventId if available
      if (event.googleEventId) {
        const byGoogleId = await db
          .select()
          .from(events)
          .where(
            and(eq(events.userId, userId), eq(events.googleEventId, event.googleEventId))
          );
        if (byGoogleId.length > 0) {
          skippedCount++;
          continue;
        }
      }

      // Fallback: check by title, date, and time
      const existingEvents = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.userId, userId),
            eq(events.title, event.title),
            eq(events.eventDate, event.eventDate)
          )
        );

      const isDuplicate = existingEvents.some((existing: typeof events.$inferSelect) => {
        if (event.eventTime && existing.eventTime) {
          return existing.eventTime === event.eventTime;
        }
        return true;
      });

      if (!isDuplicate) {
        await db.insert(events).values(event);
        syncedCount++;
      } else {
        skippedCount++;
      }
    }

    // Revalidate paths to update UI
    revalidatePath("/dashboard");
    revalidatePath("/");

    return {
      success: true,
      message: `Successfully synced ${syncedCount} event(s). Skipped ${skippedCount} duplicate(s).`,
      syncedCount,
      skippedCount,
      totalEvents: googleEvents.length,
    };
  } catch (error) {
    console.error("Error syncing Google Calendar:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to sync Google Calendar events"
    );
  }
}
