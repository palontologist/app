"use server";

import { auth } from "@clerk/nextjs/server";
import { db, events } from "@/lib/db";
import { fetchCalendarEvents, mapGoogleEventToDbEvent } from "@/lib/google-calendar";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
      // Check for duplicate by title, date, and time combination
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

      // Check for duplicate: same title and date is always a duplicate
      // If both have times, they must also match
      const isDuplicate = existingEvents.some((existing: typeof events.$inferSelect) => {
        // If both have times, check if they match
        if (event.eventTime && existing.eventTime) {
          return existing.eventTime === event.eventTime;
        }
        // If at least one doesn't have time, consider title + date match as duplicate
        // This prevents creating multiple all-day events or mixing timed/all-day events
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
