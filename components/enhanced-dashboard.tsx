"use client"

import * as React from "react"
import Link from "next/link"
import { Target, BarChart3, Plus, Lightbulb, Globe, Sparkles, User, Calendar, ListTodo, Activity, CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CircularProgress from "@/components/circular-progress"
import SmartTaskDialog from "@/components/smart-task-dialog"
import GoalsDialog from "@/components/goals-dialog"
import EnhancedGoalManagement from "@/components/enhanced-goal-management"
import TaskWithTimer from "@/components/task-with-timer"
import WeeklyReflection from "@/components/weekly-reflection"
import MissionAlignmentReport from "@/components/mission-alignment-report"
import { getTasks, toggleTaskCompletion, deleteTask } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"
import { getUser } from "@/app/actions/user"
import { generateDashboardSummary, getCachedDashboardSummary } from "@/app/actions/analytics"
import { generateDailyAlignmentReport } from "@/lib/ai"
import type { Task as TaskType, Goal as GoalType, User as UserType } from "@/lib/types"
import { createEvent, getEvents } from "@/app/actions/events"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [dailyReport, setDailyReport] = React.useState<any>(null)
  const [openAdd, setOpenAdd] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [openGoals, setOpenGoals] = React.useState(false)
  const [events, setEvents] = React.useState<any[]>([])
  const [openEvent, setOpenEvent] = React.useState(false)
  const [fabOpen, setFabOpen] = React.useState(false)
  const fabRef = React.useRef<HTMLDivElement | null>(null)
  const [tasksView, setTasksView] = React.useState<"active" | "completed">("active")
  const [goalsView, setGoalsView] = React.useState<"active" | "completed">("active")

  React.useEffect(() => {
    loadData()
  }, [])

  // Close FAB dropdown on outside click
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!fabOpen) return
      const target = e.target as Node
      if (fabRef.current && !fabRef.current.contains(target)) {
        setFabOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [fabOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksResult, goalsResult, userResult, eventsResult] = await Promise.all([getTasks(), getGoals(), getUser(), getEvents()])

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
        
        // Generate AI alignment summary and daily report after all data is loaded
        const finalTasks = tasksResult.success ? tasksResult.tasks : []
        const finalGoals = goalsResult.success ? goalsResult.goals : []
        const finalUser = userResult.success && userResult.user ? userResult.user : null

        if (finalUser) {
          try {
            const result = await generateDashboardSummary()
            if (result.success) {
              setAlignmentSummary(result.summary)
            } else {
              setAlignmentSummary(result.summary || "Add tasks and goals to get AI insights on your mission alignment!")
            }

            // Generate daily alignment report
            const report = await generateDailyAlignmentReport(
              finalTasks,
              finalGoals,
              finalUser.mission || "",
              finalUser.focusAreas || null,
              finalUser.onboarded || false
            )
            setDailyReport(report)
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

      if (eventsResult && eventsResult.success) {
        setEvents(eventsResult.events)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
    
    // Try cache first, then compute if missing
    const cached = await getCachedDashboardSummary()
    if (cached && cached.success && cached.summary) {
      setAlignmentSummary(cached.summary)
    } else {
      generateAlignmentSummary()
    }
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
      // Regenerate and persist fresh summary after task change
      const fresh = await generateDashboardSummary()
      if (fresh.success) setAlignmentSummary(fresh.summary)
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

  const isGoalCompleted = (g: GoalType) => {
    const currentVal = Number(g.current_value || 0)
    const targetVal = g.target_value == null ? null : Number(g.target_value)
    if (targetVal == null) return currentVal > 0
    return currentVal >= targetVal
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

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split("T")[0]
    return events.filter((event) => event.event_date >= today).slice(0, 3)
  }

  const handleCreateEvent = async (formData: FormData) => {
    const result = await createEvent(formData)
    if (result && result.success) {
      setOpenEvent(false)
      if (result.event) {
        setEvents((prev) => [result.event, ...prev])
      } else {
        loadData()
      }
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
            href="/analytics"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Open Analytics"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
          <Link
            href="/history"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Open History"
          >
            History
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

      {/* Enhanced Mission Alignment Score */}
      <Card className="mb-6 border-l-4 border-l-[#28A745]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#28A745]" />
              <span className="text-sm font-medium text-[#6B7280]">Greta Mission Alignment Score</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#6B7280]">Today</div>
              <div className="text-lg font-bold text-[#1A1A1A]">
                {dailyReport?.overall_alignment_score || calculateAlignmentScore()}%
              </div>
            </div>
          </div>

          <CircularProgress
            value={dailyReport?.overall_alignment_score || calculateAlignmentScore()}
            label="AI Analyzed"
            indicatorColor="#28A745"
          />

          <div className="mt-3 space-y-2">
            <p className="text-xs text-[#6B7280] font-medium">
              {alignmentSummary}
            </p>

            {dailyReport && (
              <div className="bg-[#28A745]/5 rounded-lg p-3 border border-[#28A745]/20">
                <div className="text-xs font-medium text-[#28A745] mb-2">🎯 Daily Insights</div>
                <div className="space-y-1 text-xs text-[#6B7280]">
                  {dailyReport.key_insights.slice(0, 2).map((insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-1">
                      <span className="text-[#28A745] mt-0.5">•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mb-3 flex justify-end gap-2">
        <MissionAlignmentReport reportType="weekly" />
        <WeeklyReflection />
        <Button asChild size="sm" variant="outline" className="text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white">
          <Link href="/analytics">Analytics</Link>
        </Button>
      </div>

      {/* Enhanced Goal Progress with Management */}
      <Card className="mb-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Personal Goals</CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={goalsView} onValueChange={(v) => setGoalsView(v as any)}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenGoals(true)}
              className="text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const filtered = goals.filter((g) => goalsView === "active" ? !isGoalCompleted(g) : isGoalCompleted(g))
            if (filtered.length === 0) {
              return (
                <div className="text-center py-6">
                  <Target className="mx-auto h-8 w-8 text-[#D1D5DB] mb-2" />
                  <p className="text-sm text-[#6B7280] mb-3">No {goalsView} goals</p>
                  {goalsView === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => setOpenGoals(true)}
                      className="text-white bg-[#28A745] hover:bg-[#23923d]"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Set Your First Goal
                    </Button>
                  )}
                </div>
              )
            }
            return (
              <div className="space-y-4">
                {filtered.slice(0, 3).map((goal) => (
                  <EnhancedGoalManagement key={goal.id} goal={goal} onGoalUpdated={loadData} />
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      <GoalsDialog open={openGoals} onOpenChange={setOpenGoals} onGoalCreated={loadData} />

      {/* Smart Task List */}
      <section aria-labelledby="today-tasks-heading">
        <h2 id="today-tasks-heading" className="mb-3 text-sm font-medium text-[#374151]">
          Smart Tasks ({tasks.length})
        </h2>
        <div className="mb-3">
          <Tabs value={tasksView} onValueChange={(v) => setTasksView(v as any)}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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
            {tasks
              .filter((t) => tasksView === 'active' ? !t.completed : !!t.completed)
              .map((task) => (
              <TaskWithTimer key={task.id} task={task} onTaskUpdated={loadData} />
            ))}
          </div>
        )}
      </section>

      {/* Impact Metrics & Ideas Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Key Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Impact Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Goals Progress</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {goals.filter(g => (g.current_value || 0) >= (g.target_value || 1) * 0.8).length}/{goals.length}
                  </div>
                  <div className="text-xs text-blue-700">On Track</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Tasks Completed Today</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {tasks.filter(t => t.completed && new Date(t.completed_at || 0).toDateString() === new Date().toDateString()).length}
                  </div>
                  <div className="text-xs text-green-700">Today</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">High Alignment</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-600">
                    {tasks.filter(t => (t.alignment_score || 0) >= 80).length}
                  </div>
                  <div className="text-xs text-orange-700">Tasks</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Ideas & Brainstorm */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              Ideas & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* AI Daily Insights */}
              {dailyReport && dailyReport.key_insights.slice(0, 2).map((insight: string, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-purple-800">{insight}</p>
                  </div>
                </div>
              ))}

              {/* Mission-aligned suggestions */}
              {dailyReport && dailyReport.recommendations && dailyReport.recommendations.slice(0, 2).map((rec: string, i: number) => (
                <div key={`rec-${i}`} className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <Target className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">{rec}</p>
                  </div>
                </div>
              ))}

              {/* Quick brainstorming prompt */}
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-600 mb-2">💡 Quick Brainstorm</p>
                <p className="text-xs text-gray-700">
                  What one task could move you 1% closer to your mission today?
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events on Dashboard */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-[#28A745]" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getUpcomingEvents().length > 0 ? (
            <div className="space-y-3">
              {getUpcomingEvents().map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    {event.description && <p className="text-xs text-[#6B7280] mt-1">{event.description}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#6B7280]">{new Date(event.event_date).toLocaleDateString()}</div>
                    {event.event_time && <div className="text-xs text-[#6B7280]">{event.event_time}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-[#6B7280]">No upcoming events</p>
              <Dialog open={openEvent} onOpenChange={setOpenEvent}>
                <DialogTrigger asChild>
                  <Button size="sm" className="mt-3 text-white bg-[#28A745] hover:bg-[#23923d]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Calendar Event</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await handleCreateEvent(fd) }} className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="event-title">Event Title</Label>
                      <Input id="event-title" name="title" placeholder="Team meeting" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="event-date">Date</Label>
                      <Input id="event-date" name="eventDate" type="date" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="event-time">Time</Label>
                      <Input id="event-time" name="eventTime" type="time" defaultValue="09:00" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="event-description">Description (Optional)</Label>
                      <Input id="event-description" name="description" placeholder="Meeting details..." />
                    </div>
                    <Button type="submit" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]">Add Event</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart FAB Dropdown (click to open, stable on hover) */}
      <div className="fixed bottom-24 right-6 z-20 sm:bottom-8" ref={fabRef}>
        <div className="relative">
          <Button
            aria-label="Add"
            aria-expanded={fabOpen}
            onClick={() => setFabOpen((v) => !v)}
            className="h-14 w-14 rounded-full bg-[#28A745] p-0 text-white shadow-lg hover:bg-[#23923d]"
          >
            <Plus className="h-6 w-6" />
          </Button>
          {fabOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setFabOpen(false); setOpenAdd(true) }}
                className="flex items-center gap-2 bg-white"
              >
                <ListTodo className="h-3 w-3 text-[#28A745]" /> Add Task
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setFabOpen(false); setOpenGoals(true) }}
                className="flex items-center gap-2 bg-white"
              >
                <Activity className="h-3 w-3 text-[#28A745]" /> Add Activity
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setFabOpen(false); setOpenEvent(true) }}
                className="flex items-center gap-2 bg-white"
              >
                <CalendarPlus className="h-3 w-3 text-[#28A745]" /> Add Event
              </Button>
            </div>
          )}
        </div>
      </div>

      <SmartTaskDialog open={openAdd} onOpenChange={setOpenAdd} />

      {/* Hidden Add Event dialog also accessible from events card when none */}
      <Dialog open={openEvent} onOpenChange={setOpenEvent}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await handleCreateEvent(fd) }} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="event-title-2">Event Title</Label>
              <Input id="event-title-2" name="title" placeholder="Team meeting" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-date-2">Date</Label>
              <Input id="event-date-2" name="eventDate" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-time-2">Time</Label>
              <Input id="event-time-2" name="eventTime" type="time" defaultValue="09:00" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-description-2">Description (Optional)</Label>
              <Input id="event-description-2" name="description" placeholder="Meeting details..." />
            </div>
            <Button type="submit" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]">Add Event</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
