"use client"

import * as React from "react"
import Link from "next/link"
import { Target, BarChart3, Plus, Lightbulb, Globe, Sparkles, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CircularProgress from "@/components/circular-progress"
import SmartTaskDialog from "@/components/smart-task-dialog"
import GoalsDialog from "@/components/goals-dialog"
import EnhancedGoalManagement from "@/components/enhanced-goal-management"
import TaskWithTimer from "@/components/task-with-timer"
import { getTasks, toggleTaskCompletion, deleteTask } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"
import { getUser } from "@/app/actions/user"
import { generateDashboardSummary } from "@/app/actions/analytics"
import type { Task as TaskType, Goal as GoalType, User as UserType } from "@/lib/types"

interface ApiGoalType {
  id: number
  user_id: string
  title: string
  description: string | null
  target_value: number | null
  current_value: number | null
  unit: string | null
  category: string | null
  deadline: Date | null
  created_at: Date
  updated_at: Date
}

export default function EnhancedDashboard() {
  const [tasks, setTasks] = React.useState<TaskType[]>([])
  const [goals, setGoals] = React.useState<GoalType[]>([])
  const [user, setUser] = React.useState<UserType | null>(null)
  const [alignmentSummary, setAlignmentSummary] = React.useState<string>("Loading alignment analysis...")
  const [openAdd, setOpenAdd] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [openGoals, setOpenGoals] = React.useState(false)

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksResult, goalsResult, userResult] = await Promise.all([getTasks(), getGoals(), getUser()])

      if (tasksResult.success) {
        console.log("Tasks loaded:", tasksResult.tasks)
        setTasks(tasksResult.tasks)
      }
      
      if (goalsResult.success) {
        // Filter out the mission / North Star goal from the regular goals list.
        const missionTitle = userResult && userResult.success && userResult.user ? userResult.user.mission : null
        
        // Debug logging for mission
        console.log("Dashboard - User result:", userResult);
        console.log("Dashboard - Mission title:", missionTitle);
        console.log("Dashboard - Mission title type:", typeof missionTitle);
        
        const filtered = (goalsResult.goals || []).filter((g: any) => {
          if (!g) return false
          // If the goal matches the user's mission text or is explicitly marked as North Star, exclude it
          if (missionTitle && g.title && g.title.toLowerCase().trim() === missionTitle.toLowerCase().trim()) return false
          if (g.description && typeof g.description === "string" && g.description.toLowerCase().includes("north star")) return false
          return true
        })
        setGoals(filtered)
        
        // Generate AI alignment summary after all data is loaded
        const finalTasks = tasksResult.success ? tasksResult.tasks : []
        const finalUser = userResult.success && userResult.user ? userResult.user : null
        
        if (finalUser) {
          try {
            const result = await generateDashboardSummary()
            if (result.success) {
              setAlignmentSummary(result.summary)
            } else {
              setAlignmentSummary(result.summary || "Add tasks and goals to get AI insights on your mission alignment!")
            }
          } catch (error) {
            console.warn("Failed to generate AI summary:", error)
            setAlignmentSummary("Add tasks and goals to get AI insights on your mission alignment!")
          }
        } else {
          setAlignmentSummary("Complete onboarding to see AI analysis of your task alignment.")
        }
      }
      
      if (userResult.success && userResult.user) {
        console.log("Dashboard - Setting user:", userResult.user);
        console.log("Dashboard - User mission:", userResult.user.mission);
        console.log("Dashboard - User mission type:", typeof userResult.user.mission);
        console.log("Dashboard - Raw mission value:", JSON.stringify(userResult.user.mission));
        console.log("Dashboard - Mission display in JSX:", 
          userResult.user.mission ? 
          `Will show: "${userResult.user.mission}"` : 
          "Will show: \"Define your mission to get started\"");
        
        const mappedUser = {
          ...userResult.user,
          // Ensure these are properly set for UI display
          id: 1, // Set a default ID since our UI expects it
          email: userResult.user.userId,
          world_vision: userResult.user.worldVision,
          focus_areas: userResult.user.focusAreas,
          created_at: userResult.user.createdAt,
          updated_at: userResult.user.updatedAt,
          // Explicitly ensure mission is a string
          mission: userResult.user.mission ? String(userResult.user.mission) : null
        };
        
        setUser(mappedUser as UserType)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
    
    // Generate AI summary after loading is complete
    generateAlignmentSummary()
  }

  const generateAlignmentSummary = async () => {
    try {
      if (user && (tasks.length > 0 || goals.length > 0)) {
        const result = await generateDashboardSummary()
        if (result.success) {
          setAlignmentSummary(result.summary)
        } else {
          setAlignmentSummary(result.summary || "Add your first task or goal to see AI alignment analysis.")
        }
      } else if (user) {
        setAlignmentSummary("Add your first task or goal to see AI alignment analysis.")
      } else {
        setAlignmentSummary("Complete onboarding to see AI analysis of your task alignment.")
      }
    } catch (error) {
      console.error("Failed to generate alignment summary:", error)
      setAlignmentSummary("Unable to analyze alignment - add tasks and goals to get AI insights.")
    }
  }

  const handleToggleTask = async (taskId: number) => {
    const result = await toggleTaskCompletion(taskId)
    if (result.success && result.task) {
      // Map response to match expected Task type
      const updatedTask = {
        ...result.task,
        user_id: Number(result.task.user_id)
      };
      
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask as TaskType : t)))
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    const result = await deleteTask(taskId)
    if (result.success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    }
  }

  const calculateAlignmentScore = () => {
    if (tasks.length === 0) return 0
    const totalScore = tasks.reduce((sum, task) => sum + (task.alignment_score || 0), 0)
    return Math.round(totalScore / tasks.length)
  }

  const getAlignmentColor = (category: string) => {
    switch (category) {
      case "high":
        return "#28A745"
      case "medium":
        return "#FFC107"
      case "low":
        return "#FD7E14"
      case "distraction":
        return "#DC3545"
      default:
        return "#6C757D"
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:pt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:pt-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="font-semibold tracking-tight text-xl">greta</div>
        <nav className="flex items-center gap-3">
          <Link
            href="/profile"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="View Profile"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            href="/impact"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Open Impact"
          >
            <Globe className="h-4 w-4" />
          </Link>
          <Link
            href="/brainstorm"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Open Brainstorm"
          >
            <Lightbulb className="h-4 w-4" />
          </Link>
          <Link
            href="/analytics"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Open Analytics"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      {/* North Star */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="h-4 w-4 text-[#28A745]" />
            North Star
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#111827]">
            {user?.mission || "Define your mission to get started"}
          </p>
        </CardContent>
      </Card>

      {/* AI-Powered Alignment Score */}
      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Sparkles className="h-3 w-3" />
              Greta Alignment Score
            </div>
            <div className="mt-1 text-2xl font-semibold text-[#1A1A1A]">Today</div>
            <p className="mt-1 text-xs text-[#6B7280]">
              {alignmentSummary}
            </p>
          </div>
          <CircularProgress value={calculateAlignmentScore()} label="AI Analyzed" indicatorColor="#28A745" />
        </CardContent>
      </Card>

      {/* Enhanced Goal Progress with Management */}
      <Card className="mb-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Personal Goals</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenGoals(true)}
            className="text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-6">
              <Target className="mx-auto h-8 w-8 text-[#D1D5DB] mb-2" />
              <p className="text-sm text-[#6B7280] mb-3">Set personal goals to track your progress</p>
              <Button
                size="sm"
                onClick={() => setOpenGoals(true)}
                className="text-white bg-[#28A745] hover:bg-[#23923d]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Set Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => (
                <EnhancedGoalManagement key={goal.id} goal={goal} onGoalUpdated={loadData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <GoalsDialog open={openGoals} onOpenChange={setOpenGoals} onGoalCreated={loadData} />

      {/* Smart Task List */}
      <section aria-labelledby="today-tasks-heading">
        <h2 id="today-tasks-heading" className="mb-3 text-sm font-medium text-[#374151]">
          Smart Tasks ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-4 h-12 w-12 text-[#D1D5DB]" />
              <h3 className="mb-2 font-medium">No tasks yet</h3>
              <p className="mb-4 text-sm text-[#6B7280]">
                Add your first task and let AI analyze its alignment with your mission.
              </p>
              <Button onClick={() => setOpenAdd(true)} className="text-white bg-[#28A745] hover:bg-[#23923d]">
                <Plus className="mr-2 h-4 w-4" />
                Add Smart Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskWithTimer key={task.id} task={task} onTaskUpdated={loadData} />
            ))}
          </div>
        )}
      </section>

      {/* Smart FAB */}
      <Button
        onClick={() => setOpenAdd(true)}
        aria-label="Add Smart Task"
        className="fixed bottom-24 right-6 z-20 h-14 w-14 rounded-full bg-[#28A745] p-0 text-white shadow-lg hover:bg-[#23923d] sm:bottom-8"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <SmartTaskDialog open={openAdd} onOpenChange={setOpenAdd} />
    </div>
  )
}
