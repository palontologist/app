import { sql } from "drizzle-orm";
import { customType, sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

const float32Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`;
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer));
  },
  toDriver(value: number[]) {
    return sql`vector32(${JSON.stringify(value)})`;
  },
});

// User profile table to store onboarding data keyed by Clerk user id
export const userProfiles = sqliteTable(
  "user_profiles",
  {
    userId: text("user_id").primaryKey(), // Clerk user id
    name: text("name"),
    mission: text("mission"),
    worldVision: text("world_vision"),
    focusAreas: text("focus_areas"),
    // Social layer (public profile + discovery)
    handle: text("handle"), // unique-ish username, nullable until set
    bio: text("bio"),
    discoverable: integer("discoverable", { mode: "boolean" }).default(true),
    // Privacy-friendly location (store coarse geohash, not raw coordinates by default)
    locationSharingEnabled: integer("location_sharing_enabled", { mode: "boolean" }).default(false),
    locationGeohash5: text("location_geohash5"), // 5-char geohash (~4.9km x 4.9km)
    locationUpdatedAt: integer("location_updated_at", { mode: "timestamp_ms" }),
    onboarded: integer("onboarded", { mode: "boolean" }).default(false),
    currentWorkspaceType: text("current_workspace_type").default("personal"), // "personal" | "startup"
    defaultOrganizationId: text("default_organization_id"), // Clerk org ID for startup workspace
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    handleUnique: uniqueIndex("user_profiles_handle_unique").on(table.handle),
  })
);

// Social graph: following relationships
export const userFollows = sqliteTable(
  "user_follows",
  {
    followerId: text("follower_id").notNull(), // Clerk user id
    followingId: text("following_id").notNull(), // Clerk user id
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    pairUnique: uniqueIndex("user_follows_follower_following_unique").on(table.followerId, table.followingId),
  })
);

// Workspaces table to track team workspaces
export const workspaces = sqliteTable("workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: text("organization_id").notNull().unique(), // Clerk organization ID
  name: text("name").notNull(),
  description: text("description"),
  mission: text("mission"),
  createdBy: text("created_by").notNull(), // Clerk user ID of creator
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Cofounder/team member tracking
export const cofounders = sqliteTable("cofounders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id").notNull(),
  userId: text("user_id"), // Clerk user ID (null if not yet joined)
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").default("member"), // "admin" | "member" | "viewer"
  status: text("status").default("invited"), // "invited" | "active" | "inactive"
  invitationId: text("invitation_id"), // Clerk invitation ID
  invitedBy: text("invited_by").notNull(), // Clerk user ID of inviter
  joinedAt: integer("joined_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Helper to get current timestamp for manual updates
export const now = () => Date.now();

// Goals table
export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  workspaceType: text("workspace_type").default("personal"), // "personal" | "startup"
  organizationId: text("organization_id"), // Clerk org ID for startup goals
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  goalType: text("goal_type"),
  // AI + impact fields (used in app/actions/goals.ts)
  alignmentScore: integer("alignment_score"),
  alignmentCategory: text("alignment_category"),
  missionPillar: text("mission_pillar"),
  impactStatement: text("impact_statement"),
  aiSuggestions: text("ai_suggestions"), // JSON string or free text
  // AI priority matrix (Do / Schedule / Delegate / Drop)
  priorityQuadrant: text("priority_quadrant"), // "do" | "plan" | "delegate" | "drop"
  priorityReason: text("priority_reason"),
  priorityUpdatedAt: integer("priority_updated_at", { mode: "timestamp_ms" }),
  currentValue: integer("current_value").default(0),
  targetValue: integer("target_value"),
  unit: text("unit"),
  deadline: integer("deadline", { mode: "timestamp_ms" }),
  archived: integer("archived", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Tasks table
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  goalId: integer("goal_id"), // FK relationship (enforced logically)
  workspaceType: text("workspace_type").default("personal"), // "personal" | "startup"
  organizationId: text("organization_id"), // Clerk org ID for startup tasks
  title: text("title").notNull(),
  description: text("description"),
  alignmentScore: integer("alignment_score"),
  alignmentCategory: text("alignment_category"), // high|medium|low|distraction
  completed: integer("completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  aiAnalysis: text("ai_analysis"),
  estimatedValueCents: integer("estimated_value_cents").default(0), // Greta-calculated value in cents
  valueCategory: text("value_category"), // 'design'|'content'|'sales'|'strategic'|'other'
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Events table
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  eventDate: integer("event_date", { mode: "timestamp_ms" }).notNull(),
  eventTime: text("event_time"),
  eventType: text("event_type"),
  description: text("description"),
  metadata: text("metadata"), // JSON string
  source: text("source").default("local"), // "local" | "google"
  googleEventId: text("google_event_id"), // Google Calendar event ID
  googleCalendarId: text("google_calendar_id"), // Which Google Calendar it came from
  completed: integer("completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Work sessions table
export const workSessions = sqliteTable("work_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  taskId: integer("task_id"),
  alignmentCategory: text("alignment_category"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Goal activities table
export const goalActivities = sqliteTable("goal_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  goalId: integer("goal_id").notNull(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  progressValue: integer("progress_value").default(0),
  completed: integer("completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  // Feed fields (snapshot at completion time)
  visibility: text("visibility").default("followers"), // "private" | "followers" | "public"
  completedGeohash5: text("completed_geohash5"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Opportunities users can unlock (networking, jobs, groups, events)
export const opportunities = sqliteTable("opportunities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // "group" | "job" | "event" | "mentor" | "other"
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  // Optional: tie to a coarse region so we can show "nearby opportunities"
  geohash5: text("geohash5"),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Unlock rules for opportunities (simple, rules-based MVP)
export const opportunityUnlockRules = sqliteTable("opportunity_unlock_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opportunityId: integer("opportunity_id").notNull(),
  metric: text("metric").notNull(), // "activity_completions" | "goal_completions" | "streak_days"
  threshold: integer("threshold").notNull(),
  windowDays: integer("window_days"), // null = lifetime
  // Optional filters (keep flexible as text)
  goalCategory: text("goal_category"),
  activityTitle: text("activity_title"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Materialized unlocks per user (computed when checking or when rules are met)
export const userOpportunityUnlocks = sqliteTable(
  "user_opportunity_unlocks",
  {
    userId: text("user_id").notNull(),
    opportunityId: integer("opportunity_id").notNull(),
    unlockedAt: integer("unlocked_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    pairUnique: uniqueIndex("user_opportunity_unlocks_user_opportunity_unique").on(table.userId, table.opportunityId),
  })
);

// NOTE: Add unique index for (userId, lower(title)) on goals via migration for idempotent inserts.

// Dashboard insights cache table
export const dashboardInsights = sqliteTable("dashboard_insights", {
  userId: text("user_id").primaryKey(),
  content: text("content"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

// Google accounts and tokens table (one Google account per app user)
export const googleAccounts = sqliteTable(
  "google_accounts",
  {
    userId: text("user_id").primaryKey(), // Clerk user id
    googleUserId: text("google_user_id").notNull(),
    email: text("email"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token").notNull(),
    expiryDate: integer("expiry_date"), // ms epoch
    scope: text("scope"),
    tokenType: text("token_type"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    googleUserUnique: uniqueIndex("google_accounts_google_user_id_unique").on(
      table.googleUserId
    ),
  })
);

// Historical alignment tracking
export const alignmentHistory = sqliteTable("alignment_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  overallAlignmentScore: integer("overall_alignment_score").notNull(),
  completedTasksCount: integer("completed_tasks_count").default(0),
  totalTasksCount: integer("total_tasks_count").default(0),
  highAlignmentTasks: integer("high_alignment_tasks").default(0),
  distractionTasks: integer("distraction_tasks").default(0),
  completedGoalsCount: integer("completed_goals_count").default(0),
  totalGoalsCount: integer("total_goals_count").default(0),
  aiInsightsSummary: text("ai_insights_summary"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Clients/Projects table
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  workspaceId: integer("workspace_id"), // For team/startup workspace
  name: text("name").notNull(),
  email: text("email"),
  hourlyRate: integer("hourly_rate"), // in cents
  targetHourlyRate: integer("target_hourly_rate"), // in cents
  retainerAmount: integer("retainer_amount"), // in cents
  paymentStatus: text("payment_status").default("active"), // "active" | "paused" | "inactive"
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Time entries (derived from calendar events or manual entry)
export const timeEntries = sqliteTable("time_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  eventId: integer("event_id"), // FK to events table
  clientId: integer("client_id"), // FK to clients table
  projectTag: text("project_tag"), // e.g., "Website redesign", "Onboarding flow"
  activityType: text("activity_type"), // "product" | "sales" | "ops" | "fundraising" | "support" | "other"
  durationMinutes: integer("duration_minutes").notNull(),
  billable: integer("billable", { mode: "boolean" }).default(true),
  invoiced: integer("invoiced", { mode: "boolean" }).default(false),
  entryDate: integer("entry_date", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Payments received
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  clientId: integer("client_id"), // FK to clients table
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("USD"),
  paymentDate: integer("payment_date", { mode: "timestamp_ms" }).notNull(),
  paymentMethod: text("payment_method"), // "stripe" | "paypal" | "bank_transfer" | "cash" | "other"
  invoiceId: text("invoice_id"),
  description: text("description"),
  metadata: text("metadata"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Equity/Founder Bets tracking
export const equityBets = sqliteTable("equity_bets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  workspaceId: integer("workspace_id"), // For startup workspace
  companyName: text("company_name").notNull(),
  equityPercentage: integer("equity_percentage"), // stored as basis points (100 = 1%)
  estimatedValuation: integer("estimated_valuation"), // in cents
  status: text("status").default("active"), // "active" | "exited" | "failed" | "paused"
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Invoice line items suggestions
export const invoiceLineItems = sqliteTable("invoice_line_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  clientId: integer("client_id"), // FK to clients table
  invoiceId: text("invoice_id"),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes"),
  rate: integer("rate"), // in cents, hourly rate used
  amount: integer("amount").notNull(), // in cents
  status: text("status").default("draft"), // "draft" | "invoiced" | "paid"
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Value settings: per-category rates used by Greta to calculate task value
export const valueSettings = sqliteTable("value_settings", {
  userId: text("user_id").primaryKey(),
  designRateCents: integer("design_rate_cents").default(20000),    // $200/task
  contentRateCents: integer("content_rate_cents").default(18000),  // $180/task
  salesRateCents: integer("sales_rate_cents").default(12000),      // $120/task
  strategicRateCents: integer("strategic_rate_cents").default(13600), // $136/task (~2hr @ $68)
  otherRateCents: integer("other_rate_cents").default(10000),      // $100/task
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Revenue impact tracking (MRR, ARR, etc.)
export const revenueImpact = sqliteTable("revenue_impact", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  clientId: integer("client_id"), // FK to clients table
  date: text("date").notNull(), // YYYY-MM-DD
  mrr: integer("mrr"), // Monthly Recurring Revenue in cents
  arr: integer("arr"), // Annual Recurring Revenue in cents
  totalRevenue: integer("total_revenue"), // in cents
  hoursTracked: integer("hours_tracked"),
  effectiveHourlyRate: integer("effective_hourly_rate"), // in cents
  metadata: text("metadata"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});
