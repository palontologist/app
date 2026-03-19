"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  goals,
  goalActivities,
  tasks,
  now,
  opportunities,
  opportunityUnlockRules,
  userFollows,
  userOpportunityUnlocks,
  userProfiles,
} from "@/lib/db";
import { encodeGeohash } from "@/lib/geohash";
import { revalidatePath } from "next/cache";

export type InstantValueSuggestion = {
  key: string;
  title: string;
  reason: string;
  ctaLabel: string;
  href?: string;
};

export async function updateSocialProfile(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const };

  const handleRaw = formData.get("handle");
  const handle = typeof handleRaw === "string" ? handleRaw.trim().toLowerCase() : "";
  const bioRaw = formData.get("bio");
  const bio = typeof bioRaw === "string" ? bioRaw.trim() : "";
  const discoverable = formData.get("discoverable") === "true";
  const locationSharingEnabled = formData.get("locationSharingEnabled") === "true";

  if (handle && !/^[a-z0-9_]{3,24}$/.test(handle)) {
    return { success: false, error: "Handle must be 3-24 chars (a-z, 0-9, underscore)" as const };
  }

  const timestamp = new Date();

  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  if (existing.length === 0) {
    await db.insert(userProfiles).values({
      userId,
      name: null,
      mission: null,
      worldVision: null,
      focusAreas: null,
      handle: handle || null,
      bio: bio || null,
      discoverable,
      locationSharingEnabled,
      updatedAt: timestamp,
      createdAt: timestamp,
      onboarded: true,
    });
  } else {
    await db
      .update(userProfiles)
      .set({
        handle: handle || null,
        bio: bio || null,
        discoverable,
        locationSharingEnabled,
        updatedAt: timestamp,
      })
      .where(eq(userProfiles.userId, userId));
  }

  revalidatePath("/social");
  revalidatePath("/profile");
  return { success: true as const };
}

export async function updateMyLocation(lat: number, lon: number) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const };

  const geohash5 = encodeGeohash(lat, lon, 5);
  if (!geohash5) return { success: false, error: "Invalid location" as const };

  const timestamp = new Date();
  await db
    .update(userProfiles)
    .set({
      locationGeohash5: geohash5,
      locationUpdatedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(userProfiles.userId, userId));

  revalidatePath("/social");
  return { success: true as const, geohash5 };
}

export async function followUser(targetUserId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const };
  if (!targetUserId || targetUserId === userId) return { success: false, error: "Invalid user" as const };

  try {
    await db.insert(userFollows).values({ followerId: userId, followingId: targetUserId });
  } catch {
    // ignore duplicate follows
  }

  revalidatePath("/social");
  return { success: true as const };
}

export async function unfollowUser(targetUserId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const };
  if (!targetUserId || targetUserId === userId) return { success: false, error: "Invalid user" as const };

  await db
    .delete(userFollows)
    .where(and(eq(userFollows.followerId, userId), eq(userFollows.followingId, targetUserId)));

  revalidatePath("/social");
  return { success: true as const };
}

export async function getFollowingIds() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const, followingIds: [] as string[] };

  const rows = await db
    .select({ followingId: userFollows.followingId })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));

  return { success: true as const, followingIds: rows.map((r: any) => r.followingId as string) };
}

export type FollowingFeedItem = {
  id: number;
  userId: string;
  handle: string | null;
  name: string | null;
  title: string;
  completedAt: number;
  kind: "activity" | "task";
};

export async function getFollowingFeed(limit = 30) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const, items: [] as FollowingFeedItem[] };

  const following = await db
    .select({ followingId: userFollows.followingId })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));

  const ids = Array.from(new Set([userId, ...following.map((r: any) => r.followingId as string)]));
  if (ids.length === 0) return { success: true as const, items: [] as FollowingFeedItem[] };

  const rows = await db
    .select({
      id: goalActivities.id,
      userId: goalActivities.userId,
      title: goalActivities.title,
      completedAt: goalActivities.completedAt,
      visibility: goalActivities.visibility,
      handle: userProfiles.handle,
      name: userProfiles.name,
    })
    .from(goalActivities)
    .leftJoin(userProfiles, eq(userProfiles.userId, goalActivities.userId))
    .where(
      and(
        inArray(goalActivities.userId, ids),
        eq(goalActivities.completed, true),
        sql`${goalActivities.completedAt} is not null`,
        sql`(${goalActivities.visibility} != 'private')`
      )
    )
    .orderBy(desc(goalActivities.completedAt))
    .limit(limit);

  // Also include completed tasks (many users use tasks more than goal activities).
  const taskRows = await db
    .select({
      id: tasks.id,
      userId: tasks.userId,
      title: tasks.title,
      completedAt: tasks.completedAt,
      handle: userProfiles.handle,
      name: userProfiles.name,
    })
    .from(tasks)
    .leftJoin(userProfiles, eq(userProfiles.userId, tasks.userId))
    .where(
      and(
        inArray(tasks.userId, ids),
        eq(tasks.completed, true),
        sql`${tasks.completedAt} is not null`
      )
    )
    .orderBy(desc(tasks.completedAt))
    .limit(limit);

  const merged: FollowingFeedItem[] = [
    ...rows
      .filter((r: any) => r.completedAt != null)
      .map((r: any) => ({
        id: r.id as number,
        userId: r.userId as string,
        handle: (r.handle as string | null) ?? null,
        name: (r.name as string | null) ?? null,
        title: r.title as string,
        completedAt: r.completedAt as number,
        kind: "activity" as const,
      })),
    ...taskRows
      .filter((r: any) => r.completedAt != null)
      .map((r: any) => ({
        id: r.id as number,
        userId: r.userId as string,
        handle: (r.handle as string | null) ?? null,
        name: (r.name as string | null) ?? null,
        title: r.title as string,
        completedAt: r.completedAt as number,
        kind: "task" as const,
      })),
  ]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, limit);

  return {
    success: true as const,
    items: merged,
  };
}

export type NearbyAggregateItem = {
  title: string;
  count: number;
  sinceMinutes: number;
};

export async function getNearbyAggregatedFeed(hours = 6) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const, items: [] as NearbyAggregateItem[] };

  const me = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  const geohash5 = me[0]?.locationGeohash5;
  const enabled = Boolean(me[0]?.locationSharingEnabled);
  if (!enabled || !geohash5) return { success: true as const, items: [] as NearbyAggregateItem[] };

  const sinceMs = Date.now() - hours * 60 * 60 * 1000;

  // Aggregate by activity title within same coarse geohash cell
  const rows = await db
    .select({
      title: goalActivities.title,
      count: sql<number>`count(1)`.as("count"),
      maxCompletedAt: sql<number>`max(${goalActivities.completedAt})`.as("maxCompletedAt"),
    })
    .from(goalActivities)
    .leftJoin(userProfiles, eq(userProfiles.userId, goalActivities.userId))
    .where(
      and(
        eq(goalActivities.completed, true),
        eq(goalActivities.completedGeohash5, geohash5),
        sql`${goalActivities.completedAt} >= ${sinceMs}`,
        // only include users who enabled location + are discoverable
        eq(userProfiles.locationSharingEnabled, true),
        eq(userProfiles.discoverable, true),
        // don't count self in nearby aggregate
        sql`${goalActivities.userId} != ${userId}`
      )
    )
    .groupBy(goalActivities.title)
    .orderBy(sql`count(1) desc`)
    .limit(20);

  return {
    success: true as const,
    items: rows.map((r: any) => {
      const maxCompletedAt = Number(r.maxCompletedAt ?? Date.now());
      const sinceMinutes = Math.max(0, Math.round((Date.now() - maxCompletedAt) / 60000));
      return { title: String(r.title), count: Number(r.count ?? 0), sinceMinutes };
    }),
  };
}

export async function getInstantValueSuggestions(): Promise<{ success: true; suggestions: InstantValueSuggestion[] } | { success: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" };

  const suggestions: InstantValueSuggestion[] = [];

  const myGoals = await db
    .select({ id: goals.id, title: goals.title, target: goals.targetValue, current: goals.currentValue })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.archived, false)))
    .orderBy(desc(goals.updatedAt))
    .limit(10);

  if (myGoals.length === 0) {
    suggestions.push({
      key: "create-goal",
      title: "Create one goal for this week",
      reason: "A clear target makes your next actions easier to choose and track.",
      ctaLabel: "Create a goal",
      href: "/goals",
    });
  } else {
    suggestions.push({
      key: "log-activity",
      title: "Log one activity toward your top goal",
      reason: "Small wins compound. Logging keeps you honest and boosts momentum.",
      ctaLabel: "Open goals",
      href: "/goals",
    });
  }

  const following = await db
    .select({ followingId: userFollows.followingId })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));
  if (following.length === 0) {
    suggestions.push({
      key: "find-buddy",
      title: "Connect with people who share your goals",
      reason: "Similarity-based accountability improves consistency and completion rates.",
      ctaLabel: "Find similar profiles",
      href: "/social/buddies",
    });
  }

  if (myGoals.length > 0) {
    suggestions.push({
      key: "shared-goal",
      title: "Start a shared goal challenge",
      reason: "Invite aligned people to join one measurable goal and increase mutual follow-through.",
      ctaLabel: "Open feed",
      href: "/social/feed",
    });
  }

  return { success: true, suggestions: suggestions.slice(0, 3) };
}

export type ActiveProfile = {
  userId: string;
  handle: string | null;
  name: string | null;
  lastCompletedAt: number;
  sharedCategories: number;
  isFollowing: boolean;
};

export async function getActiveProfiles(limit = 12) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const, profiles: [] as ActiveProfile[] };

  const sinceMs = Date.now() - 24 * 60 * 60 * 1000;

  const following = await db
    .select({ followingId: userFollows.followingId })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));
  const followingSet = new Set(following.map((r: any) => String(r.followingId)));

  const myCatsRows = await db
    .select({ category: goals.category })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.archived, false), sql`${goals.category} is not null`));
  const myCats = Array.from(new Set(myCatsRows.map((r: any) => r.category).filter(Boolean))) as string[];

  // Active = completed an activity OR a task recently.
  const activityRows = await db
    .select({
      userId: userProfiles.userId,
      handle: userProfiles.handle,
      name: userProfiles.name,
      lastCompletedAt: sql<number>`max(${goalActivities.completedAt})`.as("lastCompletedAt"),
    })
    .from(goalActivities)
    .innerJoin(userProfiles, eq(userProfiles.userId, goalActivities.userId))
    .where(
      and(
        eq(goalActivities.completed, true),
        sql`${goalActivities.completedAt} is not null`,
        sql`${goalActivities.completedAt} >= ${sinceMs}`,
        eq(userProfiles.discoverable, true),
        sql`${userProfiles.userId} != ${userId}`
      )
    )
    .groupBy(userProfiles.userId);

  const taskRows = await db
    .select({
      userId: userProfiles.userId,
      handle: userProfiles.handle,
      name: userProfiles.name,
      lastCompletedAt: sql<number>`max(${tasks.completedAt})`.as("lastCompletedAt"),
    })
    .from(tasks)
    .innerJoin(userProfiles, eq(userProfiles.userId, tasks.userId))
    .where(
      and(
        eq(tasks.completed, true),
        sql`${tasks.completedAt} is not null`,
        sql`${tasks.completedAt} >= ${sinceMs}`,
        eq(userProfiles.discoverable, true),
        sql`${userProfiles.userId} != ${userId}`
      )
    )
    .groupBy(userProfiles.userId);

  const byUser = new Map<string, { userId: string; handle: string | null; name: string | null; lastCompletedAt: number }>();
  for (const r of [...activityRows, ...taskRows] as any[]) {
    const u = String(r.userId);
    const prev = byUser.get(u);
    const ts = Number(r.lastCompletedAt ?? 0);
    if (!prev || ts > prev.lastCompletedAt) {
      byUser.set(u, {
        userId: u,
        handle: (r.handle as string | null) ?? null,
        name: (r.name as string | null) ?? null,
        lastCompletedAt: ts,
      });
    }
  }

  const rows = [...byUser.values()]
    .sort((a, b) => b.lastCompletedAt - a.lastCompletedAt)
    .slice(0, limit);

  // If we used myCats placeholders, supply args via raw isn't possible with drizzle-orm here; fallback: sharedCategories=0.
  // Keep MVP simple: compute shared categories in JS if categories exist.
  if (myCats.length > 0) {
    const ids = rows.map((r: any) => String(r.userId));
    if (ids.length) {
      const theirCats = await db
        .select({ userId: goals.userId, category: goals.category })
        .from(goals)
        .where(and(inArray(goals.userId, ids), eq(goals.archived, false), sql`${goals.category} is not null`));
      const byUser = new Map<string, Set<string>>();
      for (const r of theirCats as any[]) {
        const uid = String(r.userId);
        const cat = String(r.category);
        if (!byUser.has(uid)) byUser.set(uid, new Set());
        byUser.get(uid)!.add(cat);
      }
      const mySet = new Set(myCats.map(String));
      return {
        success: true as const,
        profiles: rows.map((r: any) => {
          const u = String(r.userId);
          const set = byUser.get(u) ?? new Set<string>();
          let shared = 0;
          for (const c of set) if (mySet.has(c)) shared++;
          return {
            userId: u,
            handle: (r.handle as string | null) ?? null,
            name: (r.name as string | null) ?? null,
            lastCompletedAt: Number(r.lastCompletedAt ?? 0),
            sharedCategories: shared,
            isFollowing: followingSet.has(u),
          };
        }),
      };
    }
  }

  return {
    success: true as const,
    profiles: rows.map((r: any) => {
      const u = String(r.userId);
      return {
        userId: u,
        handle: (r.handle as string | null) ?? null,
        name: (r.name as string | null) ?? null,
        lastCompletedAt: Number(r.lastCompletedAt ?? 0),
        sharedCategories: 0,
        isFollowing: followingSet.has(u),
      };
    }),
  };
}

export type BuddyCandidate = {
  userId: string;
  handle: string | null;
  name: string | null;
  sharedCategories: number;
};

export async function getGoalBuddyMatches(limit = 12) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const, matches: [] as BuddyCandidate[] };

  const myCatsRows = await db
    .select({ category: goals.category })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.archived, false), sql`${goals.category} is not null`));
  const myCats = Array.from(new Set(myCatsRows.map((r: any) => r.category).filter(Boolean))) as string[];
  if (myCats.length === 0) return { success: true as const, matches: [] as BuddyCandidate[] };

  // Find other discoverable users who share goal categories.
  const rows = await db
    .select({
      userId: userProfiles.userId,
      handle: userProfiles.handle,
      name: userProfiles.name,
      shared: sql<number>`count(distinct ${goals.category})`.as("shared"),
    })
    .from(userProfiles)
    .innerJoin(goals, eq(goals.userId, userProfiles.userId))
    .where(
      and(
        eq(userProfiles.discoverable, true),
        eq(goals.archived, false),
        inArray(goals.category, myCats),
        sql`${userProfiles.userId} != ${userId}`
      )
    )
    .groupBy(userProfiles.userId)
    .orderBy(sql`count(distinct ${goals.category}) desc`)
    .limit(limit);

  return {
    success: true as const,
    matches: rows.map((r: any) => ({
      userId: r.userId as string,
      handle: (r.handle as string | null) ?? null,
      name: (r.name as string | null) ?? null,
      sharedCategories: Number(r.shared ?? 0),
    })),
  };
}

export type OpportunityWithProgress = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  url: string | null;
  unlocked: boolean;
  checklist: Array<{ ruleId: number; label: string; progress: number; threshold: number }>;
};

async function computeRuleProgress(userId: string, rule: any): Promise<{ progress: number; threshold: number }> {
  const threshold = Number(rule.threshold ?? 0);
  const windowDays = rule.windowDays == null ? null : Number(rule.windowDays);
  const sinceMs = windowDays == null ? null : Date.now() - windowDays * 24 * 60 * 60 * 1000;

  if (rule.metric === "activity_completions") {
    const whereParts = [
      eq(goalActivities.userId, userId),
      eq(goalActivities.completed, true),
      sql`${goalActivities.completedAt} is not null`,
    ] as any[];
    if (sinceMs != null) whereParts.push(sql`${goalActivities.completedAt} >= ${sinceMs}`);
    if (rule.activityTitle) whereParts.push(eq(goalActivities.title, String(rule.activityTitle)));
    if (rule.goalCategory) {
      // join goals for category filter
      const rows = await db
        .select({ count: sql<number>`count(1)`.as("count") })
        .from(goalActivities)
        .innerJoin(goals, eq(goals.id, goalActivities.goalId))
        .where(and(...whereParts, eq(goals.category, String(rule.goalCategory))));
      return { progress: Number(rows[0]?.count ?? 0), threshold };
    }
    const rows = await db
      .select({ count: sql<number>`count(1)`.as("count") })
      .from(goalActivities)
      .where(and(...whereParts));
    return { progress: Number(rows[0]?.count ?? 0), threshold };
  }

  if (rule.metric === "goal_completions") {
    const whereParts = [eq(goals.userId, userId), eq(goals.archived, false)] as any[];
    if (rule.goalCategory) whereParts.push(eq(goals.category, String(rule.goalCategory)));
    // completion: current >= target (or current > 0 if no target)
    const rows = await db
      .select({
        count: sql<number>`
          count(
            case
              when ${goals.targetValue} is null and coalesce(${goals.currentValue},0) > 0 then 1
              when ${goals.targetValue} is not null and coalesce(${goals.currentValue},0) >= ${goals.targetValue} then 1
              else null
            end
          )
        `.as("count"),
      })
      .from(goals)
      .where(and(...whereParts));
    return { progress: Number(rows[0]?.count ?? 0), threshold };
  }

  if (rule.metric === "streak_days") {
    // Approximate streak: count distinct days with at least one completed activity in last N days (or last 30 if null)
    const days = windowDays ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const rows = await db
      .select({
        days: sql<number>`count(distinct date(datetime(${goalActivities.completedAt}/1000,'unixepoch')))`.as("days"),
      })
      .from(goalActivities)
      .where(
        and(
          eq(goalActivities.userId, userId),
          eq(goalActivities.completed, true),
          sql`${goalActivities.completedAt} is not null`,
          sql`${goalActivities.completedAt} >= ${since}`
        )
      );
    return { progress: Number(rows[0]?.days ?? 0), threshold };
  }

  return { progress: 0, threshold };
}

export async function getOpportunitiesWithUnlocks() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthenticated" as const, opportunities: [] as OpportunityWithProgress[] };

  const opps = await db.select().from(opportunities).where(eq(opportunities.active, true)).orderBy(desc(opportunities.createdAt));
  if (opps.length === 0) return { success: true as const, opportunities: [] as OpportunityWithProgress[] };

  const oppIds = opps.map((o: any) => o.id as number);
  const rules = await db.select().from(opportunityUnlockRules).where(inArray(opportunityUnlockRules.opportunityId, oppIds));
  const unlockedRows = await db
    .select({ opportunityId: userOpportunityUnlocks.opportunityId })
    .from(userOpportunityUnlocks)
    .where(eq(userOpportunityUnlocks.userId, userId));
  const unlockedSet = new Set(unlockedRows.map((r: any) => r.opportunityId as number));

  const out: OpportunityWithProgress[] = [];

  for (const opp of opps as any[]) {
    const oppRules = rules.filter((r: any) => r.opportunityId === opp.id);
    const checklist = [];
    let allMet = oppRules.length > 0;
    for (const rule of oppRules) {
      const { progress, threshold } = await computeRuleProgress(userId, rule);
      const labelParts = [];
      if (rule.metric === "activity_completions") labelParts.push("Complete activities");
      if (rule.metric === "goal_completions") labelParts.push("Complete goals");
      if (rule.metric === "streak_days") labelParts.push("Build streak days");
      if (rule.goalCategory) labelParts.push(`in ${rule.goalCategory}`);
      if (rule.windowDays) labelParts.push(`(last ${rule.windowDays}d)`);
      const label = labelParts.join(" ");

      checklist.push({ ruleId: rule.id as number, label, progress, threshold });
      if (progress < threshold) allMet = false;
    }

    const unlocked = unlockedSet.has(opp.id) || (oppRules.length > 0 && allMet);
    if (unlocked && !unlockedSet.has(opp.id) && oppRules.length > 0) {
      try {
        await db.insert(userOpportunityUnlocks).values({ userId, opportunityId: opp.id });
      } catch {
        // ignore duplicates
      }
    }

    out.push({
      id: opp.id as number,
      type: opp.type as string,
      title: opp.title as string,
      description: (opp.description as string | null) ?? null,
      url: (opp.url as string | null) ?? null,
      unlocked,
      checklist,
    });
  }

  return { success: true as const, opportunities: out };
}

