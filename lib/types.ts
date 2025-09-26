// Simplified types for mock data (no database-specific fields)
export type User = {
  id: number
  name: string | null
  email: string | null
  mission: string | null
  world_vision: string | null
  focus_areas: string | null
  created_at: Date
  updated_at: Date
}

export type Task = {
  id: number
  user_id: number
  title: string | null
  description: string | null
  alignment_score: number | null
  alignment_category: string | null
  ai_analysis: string | null
  mission_pillar: string | null
  impact_statement: string | null
  ai_suggestions: string | null
  weekly_reflection_notes: string | null
  completed: boolean | null
  completed_at: Date | null
  created_at: Date
  updated_at: Date
}

export type Goal = {
  id: number
  user_id: number
  title: string | null
  description: string | null
  target_value: number | null
  current_value: number | null
  unit: string | null
  category: string | null
  alignment_score: number | null
  alignment_category: string | null
  mission_pillar: string | null
  impact_statement: string | null
  ai_suggestions: string | null
  deadline: Date | null
  created_at: Date
  updated_at: Date
}

export type WorkSession = {
  id: number
  user_id: number
  task_id: number | null
  duration_minutes: number | null
  alignment_category: string | null
  session_date: Date | null
  notes: string | null
  created_at: Date
}

// Enum types for better type safety
export type AlignmentCategory = "high" | "medium" | "low" | "distraction"
export type GoalCategory = "personal" | "professional" | "health" | "financial" | "learning" | "other"

// Mock data storage (in-memory)
export const mockData = {
  users: [
    {
      id: 1,
      name: "Demo User",
      email: "demo@example.com",
      mission: "Build tools that help founders achieve their mission",
      world_vision: "A world where every founder can focus on what matters most",
      focus_areas: "Productivity, Goal Achievement, Mission Alignment",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ] as User[],

  tasks: [
    {
      id: 1,
      user_id: 1,
      title: "Review user feedback",
      description: "Analyze feedback from beta users",
      alignment_score: 85,
      alignment_category: "high" as AlignmentCategory,
      ai_analysis: "This task directly supports product improvement",
      completed: true,
      completed_at: new Date(Date.now() - 86400000), // 1 day ago
      created_at: new Date(Date.now() - 172800000), // 2 days ago
      updated_at: new Date(Date.now() - 86400000),
    },
    {
      id: 2,
      user_id: 1,
      title: "Plan marketing strategy",
      description: "Develop Q1 marketing approach",
      alignment_score: 75,
      alignment_category: "medium" as AlignmentCategory,
      ai_analysis: "Important for growth but not core product work",
      completed: false,
      completed_at: null,
      created_at: new Date(Date.now() - 86400000),
      updated_at: new Date(Date.now() - 86400000),
    },
  ] as Task[],

  goals: [
    {
      id: 1,
      user_id: 1,
      title: "Launch MVP",
      description: "Get the minimum viable product to market",
      target_value: 1,
      current_value: 0.8,
      unit: "product",
      category: "professional",
      deadline: new Date(Date.now() + 2592000000), // 30 days from now
      created_at: new Date(Date.now() - 604800000), // 1 week ago
      updated_at: new Date(),
    },
    {
      id: 2,
      user_id: 1,
      title: "Onboard 100 users",
      description: "Reach 100 active users on the platform",
      target_value: 100,
      current_value: 23,
      unit: "users",
      category: "professional",
      deadline: new Date(Date.now() + 7776000000), // 90 days from now
      created_at: new Date(Date.now() - 604800000),
      updated_at: new Date(),
    },
  ] as Goal[],

  workSessions: [
    {
      id: 1,
      user_id: 1,
      task_id: 1,
      duration_minutes: 120,
      alignment_category: "high" as AlignmentCategory,
      session_date: new Date(),
      notes: "Productive session reviewing user feedback",
      created_at: new Date(),
    },
    {
      id: 2,
      user_id: 1,
      task_id: 2,
      duration_minutes: 90,
      alignment_category: "medium" as AlignmentCategory,
      session_date: new Date(Date.now() - 86400000),
      notes: "Brainstormed marketing ideas",
      created_at: new Date(Date.now() - 86400000),
    },
  ] as WorkSession[],
}

// Helper functions for generating IDs
let nextTaskId = 3
let nextGoalId = 3
let nextWorkSessionId = 3

export function getNextTaskId() {
  return nextTaskId++
}

export function getNextGoalId() {
  return nextGoalId++
}

export function getNextWorkSessionId() {
  return nextWorkSessionId++
}
