"use server";

import { auth } from "@clerk/nextjs/server";
import { db, events, goals, tasks, goalActivities } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";
import { getUser } from "@/app/actions/user";
import { getGoals } from "@/app/actions/goals";
import { getTasks } from "@/app/actions/tasks";
import { getEvents } from "@/app/actions/events";
import { generateCalendarSuggestions } from "@/lib/ai";
import { createGoogleCalendarEvent, getStoredTokens } from "@/lib/google-calendar";
import { revalidatePath } from "next/cache";

// Get AI-powered calendar event suggestions
export async function getAICalendarSuggestions() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Fetch user data - use allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      getUser(),
      getGoals(),
      getTasks(),
      getEvents(),
    ]);

    const [userResult, goalsResult, tasksResult, eventsResult] = results.map(r => 
      r.status === "fulfilled" ? r.value : { success: false }
    );

    if (!userResult.success || !userResult.user) {
      throw new Error("User not found");
    }

    const user = userResult.user;
    const userGoals = goalsResult.success ? goalsResult.goals : [];
    const userTasks = tasksResult.success ? tasksResult.tasks : [];
    const userEvents = eventsResult.success ? eventsResult.events : [];

    // Fetch goal activities
    const activities = await db
      .select()
      .from(goalActivities)
      .where(eq(goalActivities.userId, userId));

    // Generate AI suggestions
    const suggestions = await generateCalendarSuggestions(userId, {
      goals: userGoals.map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        deadline: g.deadline ? new Date(g.deadline) : null,
        currentValue: g.current_value || 0,
        targetValue: g.target_value,
      })),
      activities: activities.map((a: any) => ({
        id: a.id,
        title: a.title,
        goalId: a.goalId,
        completed: a.completed || false,
      })),
      tasks: userTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        alignmentCategory: t.alignment_category,
        completed: t.completed || false,
      })),
      events: userEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        eventDate: new Date(e.event_date),
        eventTime: e.event_time,
      })),
      userMission: user.mission || "",
      worldVision: user.worldVision || "",
    });

    return {
      success: true,
      suggestions: suggestions.suggestions || [],
      strategy: suggestions.overallStrategy || "",
      reasoning: suggestions.ai_reasoning,
    };
  } catch (error) {
    console.error("Error getting AI calendar suggestions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate suggestions",
      suggestions: [],
      strategy: "",
    };
  }
}

// Create calendar event from AI suggestion (both in app and Google Calendar)
export async function createEventFromSuggestion(suggestion: {
  title: string;
  description: string;
  suggestedDate: string;
  suggestedTime: string;
  durationMinutes: number;
  relatedGoalId?: number;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Parse date and time
    const [year, month, day] = suggestion.suggestedDate.split("-").map(Number);
    const [hour, minute] = suggestion.suggestedTime.split(":").map(Number);
    
    const startDate = new Date(year, month - 1, day, hour, minute);
    const endDate = new Date(startDate.getTime() + suggestion.durationMinutes * 60 * 1000);

    // Format time for display
    const eventTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Create event in local database
    const metadata = JSON.stringify({
      aiGenerated: true,
      relatedGoalId: suggestion.relatedGoalId,
      durationMinutes: suggestion.durationMinutes,
    });

    const newEvent = await db.insert(events).values({
      userId,
      title: suggestion.title,
      eventDate: startDate,
      eventTime,
      description: suggestion.description,
      metadata,
      syncSource: "manual", // Will be updated to "google" if Google sync succeeds
    }).returning();

    // Try to create in Google Calendar if user has connected account
    try {
      const account = await getStoredTokens(userId);
      
      if (account && account.refreshToken) {
        const googleEvent = await createGoogleCalendarEvent(userId, {
          title: suggestion.title,
          description: suggestion.description,
          startDateTime: startDate,
          endDateTime: endDate,
        });

        // Update event to mark as synced to Google
        if (googleEvent && googleEvent.id) {
          const updatedMetadata = JSON.stringify({
            ...JSON.parse(metadata),
            googleEventId: googleEvent.id,
            googleCalendarId: "primary",
          });

          await db
            .update(events)
            .set({
              syncSource: "google",
              metadata: updatedMetadata,
            })
            .where(eq(events.id, newEvent[0].id));
        }
      }
    } catch (googleError) {
      console.error("Failed to sync to Google Calendar:", googleError);
      // Continue - event is still created locally
    }

    revalidatePath("/dashboard");
    revalidatePath("/");

    return {
      success: true,
      event: newEvent[0],
      message: "Event created successfully",
    };
  } catch (error) {
    console.error("Error creating event from suggestion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    };
  }
}

// Batch create multiple events from suggestions
export async function createEventsFromSuggestions(suggestions: Array<{
  title: string;
  description: string;
  suggestedDate: string;
  suggestedTime: string;
  durationMinutes: number;
  relatedGoalId?: number;
}>) {
  const results = await Promise.allSettled(
    suggestions.map(suggestion => createEventFromSuggestion(suggestion))
  );

  const successful = results.filter(r => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - successful;

  return {
    success: true,
    created: successful,
    failed,
    message: `Created ${successful} event(s)${failed > 0 ? `, ${failed} failed` : ""}`,
  };
}
