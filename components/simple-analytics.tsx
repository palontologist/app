"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Plus, Target, TrendingUp, Clock, Quote, Compass, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { getTasks } from "@/app/actions/tasks"
import { getUser } from "@/app/actions/user"
import { getGoals } from "@/app/actions/goals"
import { createEvent, getEvents } from "@/app/actions/events"
import { generatePersonalizedInsights } from "@/lib/ai"
import AIReasoningToggle from "@/components/ai-reasoning-toggle"
import type { Task, User, Goal } from "@/lib/types"

const motivationalQuotes = [
  "Every aligned action moves you closer to your vision.",
  "Focus is the bridge between dreams and reality.",
  "Your mission is your compass in the chaos of daily work.",
  "Small consistent steps create extraordinary outcomes.",
  "Alignment today creates impact tomorrow.",
]

export default function SimpleAnalytics() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [events, setEvents] = React.useState<any[]>([])
  const [goals, setGoals] = React.useState<Goal[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [insights, setInsights] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [openEvent, setOpenEvent] = React.useState(false)
  const [quote] = React.useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)])

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksResult, userResult, eventsResult, goalsResult] = await Promise.all([
        getTasks(),
        getUser(),
        getEvents(),
        getGoals(),
      ])

      if (tasksResult.success) {
        setTasks(tasksResult.tasks)

        if (userResult.success && userResult.user) {
          setUser(userResult.user)

          // Generate simplified insights
          const personalizedInsights = await generatePersonalizedInsights(
            tasksResult.tasks,
            userResult.user.mission || "",
          )
          setInsights(personalizedInsights)
        }
      }

      if (eventsResult.success) {
        setEvents(eventsResult.events)
      }

      if (goalsResult.success) {
        setGoals(goalsResult.goals)
      }
    } catch (error) {
      console.error("Failed to load analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (formData: FormData) => {
    const result = await createEvent(formData)
    if (result.success) {
      setOpenEvent(false)
      loadData() // Refresh events
    }
  }

  const getTodayDate = () => {
    const today = new Date()
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split("T")[0]
    return events.filter((event) => event.event_date >= today).slice(0, 3)
  }

  const calculateMissionProgress = () => {
    const completedTasks = tasks.filter((t) => t.completed).length
    const highAlignmentTasks = tasks.filter((t) => t.alignment_category === "high" && t.completed).length
    const completedGoals = goals.filter((g) => g.current_value >= (g.target_value || 1)).length

    // Calculate overall mission progress (0-100%)
    const taskProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 40 : 0 // 40% weight
    const alignmentProgress = tasks.length > 0 ? (highAlignmentTasks / tasks.length) * 40 : 0 // 40% weight
    const goalProgress = goals.length > 0 ? (completedGoals / goals.length) * 20 : 0 // 20% weight

    return Math.round(taskProgress + alignmentProgress + goalProgress)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const missionProgress = calculateMissionProgress()

  return (
    <div className="mx-auto max-w-2xl px-3 pb-16 pt-4 sm:px-4 sm:pt-6">
      <header className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-sm hover:bg-accent hover:text-accent-foreground sm:h-9 sm:w-auto sm:px-3"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Back</span>
          </Link>
          <div>
            <h1 className="text-base font-semibold sm:text-lg">Your Focus Report</h1>
            <p className="text-xs text-[#6B7280] sm:text-sm">{getTodayDate()}</p>
          </div>
        </div>
        <Dialog open={openEvent} onOpenChange={setOpenEvent}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-white bg-[#28A745] hover:bg-[#23923d]">
              <Plus className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Add Event</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Calendar Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              await handleCreateEvent(formData)
            }} className="grid gap-4">
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
                <Textarea id="event-description" name="description" placeholder="Meeting details..." rows={2} />
              </div>
              <Button type="submit" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]">
                Add Event
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Mission Progress Overview */}
      <Card className="mb-4 border-l-4 border-l-[#28A745] sm:mb-6">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Compass className="h-4 w-4 text-[#28A745] sm:h-5 sm:w-5" />
            Mission Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-lg font-bold text-[#28A745]">{missionProgress}%</span>
          </div>
          <Progress value={missionProgress} className="h-2" />

          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:gap-4 sm:text-sm">
            <div>
              <div className="font-semibold text-[#28A745]">{tasks.filter((t) => t.completed).length}</div>
              <div className="text-[#6B7280]">Tasks Done</div>
            </div>
            <div>
              <div className="font-semibold text-[#28A745]">
                {tasks.filter((t) => t.alignment_category === "high" && t.completed).length}
              </div>
              <div className="text-[#6B7280]">High Impact</div>
            </div>
            <div>
              <div className="font-semibold text-[#28A745]">
                {goals.filter((g) => g.current_value >= (g.target_value || 1)).length}
              </div>
              <div className="text-[#6B7280]">Goals Hit</div>
            </div>
          </div>

          <div className="text-xs text-[#6B7280] bg-blue-50 p-2 rounded border border-blue-200 sm:text-sm sm:p-3">
            <strong>How calculated:</strong> Task completion (40%) + High-alignment work (40%) + Goal achievement (20%)
          </div>
        </CardContent>
      </Card>

      {/* Motivational Quote */}
      <Card className="mb-4 bg-gradient-to-r from-[#28A745]/5 to-[#28A745]/10 border-[#28A745]/20 sm:mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Quote className="h-4 w-4 text-[#28A745] flex-shrink-0 sm:h-5 sm:w-5" />
            <p className="text-xs font-medium text-[#374151] italic sm:text-sm">"{quote}"</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 sm:gap-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 text-center sm:p-4">
            <div className="text-xl font-bold text-[#28A745] sm:text-2xl">
              {insights?.overall_alignment_score || 0}%
            </div>
            <div className="text-xs text-[#6B7280]">Alignment Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center sm:p-4">
            <div className="text-xl font-bold text-[#28A745] sm:text-2xl">{insights?.completion_rate || 0}%</div>
            <div className="text-xs text-[#6B7280]">Completion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals Progress */}
      {goals.length > 0 && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Target className="h-4 w-4 text-[#28A745] sm:h-5 sm:w-5" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {goals.slice(0, 3).map((goal) => {
              const progress = goal.target_value ? (goal.current_value / goal.target_value) * 100 : 0
              const isCompleted = goal.current_value >= (goal.target_value || 1)

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                      <span className={`text-sm font-medium ${isCompleted ? "line-through text-green-600" : ""}`}>
                        {goal.title}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {goal.current_value} / {goal.target_value}
                      </div>
                      <div className="text-xs text-[#6B7280]">{goal.unit}</div>
                    </div>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-[#6B7280]">
                    <span>{progress.toFixed(1)}% complete</span>
                    {goal.deadline && <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {insights && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Target className="h-4 w-4 text-[#28A745] sm:h-5 sm:w-5" />
              Your Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* High Impact Activities */}
            {insights.high_impact_activities?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[#374151] mb-2">🚀 Keep Doing</h3>
                <div className="space-y-1">
                  {insights.high_impact_activities.map((activity: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-[#28A745]/5">
                      <div className="w-2 h-2 rounded-full bg-[#28A745]"></div>
                      <span className="text-sm text-[#374151]">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Distractions */}
            {insights.main_distractions?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[#374151] mb-2">⚠️ Reduce Time On</h3>
                <div className="space-y-1">
                  {insights.main_distractions.map((distraction: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-red-50">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span className="text-sm text-[#374151]">{distraction}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Focus Recommendation */}
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-700 mb-1">💡 This Week's Focus</h3>
              <p className="text-sm text-[#374151]">{insights.focus_recommendation || insights.focus_area}</p>
            </div>

            {/* AI Insights with Reasoning */}
            {insights.key_insights && (
              <div>
                <h3 className="text-sm font-medium text-[#374151] mb-2">🧠 AI Insights</h3>
                <div className="space-y-2">
                  {insights.key_insights.map((insight: string, index: number) => (
                    <div key={index} className="p-2 rounded bg-gray-50 border-l-2 border-[#28A745]/30">
                      <p className="text-sm text-[#374151]">{insight}</p>
                    </div>
                  ))}
                </div>
                <AIReasoningToggle reasoning={insights.ai_reasoning} title="View AI Reasoning" />
              </div>
            )}

            {/* Celebration */}
            {insights.celebration && (
              <div className="rounded-lg bg-[#28A745]/5 p-3 border border-[#28A745]/20">
                <h3 className="text-sm font-medium text-[#28A745] mb-1">🎉 Celebration</h3>
                <p className="text-sm text-[#374151]">{insights.celebration}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Calendar className="h-4 w-4 text-[#28A745] sm:h-5 sm:w-5" />
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
            <div className="text-center py-6 sm:py-8">
              <Clock className="mx-auto h-10 w-10 text-[#D1D5DB] mb-3 sm:h-12 sm:w-12 sm:mb-4" />
              <h3 className="mb-2 font-medium text-sm sm:text-base">No upcoming events</h3>
              <p className="text-xs text-[#6B7280] mb-3 sm:text-sm sm:mb-4">
                Add events to stay organized and focused.
              </p>
              <Button
                onClick={() => setOpenEvent(true)}
                size="sm"
                className="text-white bg-[#28A745] hover:bg-[#23923d]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Performance */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 text-[#28A745] sm:h-5 sm:w-5" />
            Task Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center sm:gap-4">
            <div>
              <div className="text-base font-bold text-[#28A745] sm:text-lg">{tasks.length}</div>
              <div className="text-xs text-[#6B7280]">Total Tasks</div>
            </div>
            <div>
              <div className="text-base font-bold text-[#28A745] sm:text-lg">
                {tasks.filter((t) => t.completed).length}
              </div>
              <div className="text-xs text-[#6B7280]">Completed</div>
            </div>
            <div>
              <div className="text-base font-bold text-[#28A745] sm:text-lg">
                {tasks.filter((t) => (t.alignment_score || 0) >= 80).length}
              </div>
              <div className="text-xs text-[#6B7280]">High Impact</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
