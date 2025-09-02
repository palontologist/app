import { sql } from "drizzle-orm";
import { customType, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
export const userProfiles = sqliteTable("user_profiles", {
  userId: text("user_id").primaryKey(), // Clerk user id
  name: text("name"),
  mission: text("mission"),
  worldVision: text("world_vision"),
  focusAreas: text("focus_areas"),
  onboarded: integer("onboarded", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Helper to get current timestamp for manual updates
export const now = () => Date.now();

// Goals table
export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  goalType: text("goal_type"),
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
  title: text("title").notNull(),
  description: text("description"),
  alignmentScore: integer("alignment_score"),
  alignmentCategory: text("alignment_category"), // high|medium|low|distraction
  completed: integer("completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  aiAnalysis: text("ai_analysis"),
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
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// NOTE: Add unique index for (userId, lower(title)) on goals via migration for idempotent inserts.

// Dashboard insights cache table
export const dashboardInsights = sqliteTable("dashboard_insights", {
  userId: text("user_id").primaryKey(),
  content: text("content"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});