"use client"

import * as React from "react"
import Link from "next/link"
import { Target, Plus, Lightbulb, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CircularProgress from "@/components/circular-progress"
import SmartTaskDialog from "@/components/smart-task-dialog"
import { getTasks } from "@/app/actions/tasks"
import { getUser } from "@/app/actions/user"
import { generateDashboardSummary } from "@/app/actions/analytics"
import type { Task as TaskType, User as UserType } from "@/lib/types"

type SuggestionCard = {
  id: string
  title: string
  description: string
  action: string
  color: "blue" | "green" | "purple" | "indigo" | "orange"
  icon: "target" | "lightbulb" | "trendingUp" | "zap"
}

const suggestionPalettes: Record<SuggestionCard["color"], { card: string; icon: string; button: string }> = {
  blue: {
    card: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    icon: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  green: {
    card: "bg-green-50 border-green-200 hover:bg-green-100",
    icon: "text-green-600",
    button: "bg-green-600 hover:bg-green-700",
  },
  purple: {
    card: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    icon: "text-purple-600",
    button: "bg-purple-600 hover:bg-purple-700",
  },
  indigo: {
    card: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    icon: "text-indigo-600",
    button: "bg-indigo-600 hover:bg-indigo-700",
  },
  orange: {
    card: "bg-orange-50 border-orange-200 hover:bg-orange-100",
    icon: "text-orange-600",
    button: "bg-orange-500 hover:bg-orange-600",
  },
}

const suggestionIcons: Record<SuggestionCard["icon"], React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  target: Target,
  lightbulb: Lightbulb,
  trendingUp: TrendingUp,
  zap: Zap,
}

// Personalized Suggestions Component
function PersonalizedSuggestions({ tasks, user, onCreateTask }: { tasks: TaskType[], user: UserType | null, onCreateTask: () => void }) {
  const [suggestions, setSuggestions] = React.useState<SuggestionCard[]>([])
  const [creatingTask, setCreatingTask] = React.useState<string | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false)
  const [lastError, setLastError] = React.useState<string | null>(null)

  const missionSnippet = React.useMemo(() => {
    if (!user?.mission) return null
    const trimmed = user.mission.trim()
    return trimmed ? `"${trimmed.slice(0, 80)}${trimmed.length > 80 ? "..." : ""}"` : null
  }, [user?.mission])

  const focusSnippet = React.useMemo(() => {
    if (!user?.focusAreas) return null
    const firstArea = user.focusAreas.split(",")[0]?.trim()
    return firstArea || null
  }, [user?.focusAreas])

  const fallbackSuggestions = React.useMemo((): SuggestionCard[] => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.completed).length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const highAlignment = tasks.filter((t) => (t.alignment_score || 0) >= 70)
    const lowAlignment = tasks.filter((t) => (t.alignment_score || 0) < 40)

    const generated: SuggestionCard[] = []

    if (totalTasks === 0) {
      generated.push({
        id: "kickoff",
        title: focusSnippet
          ? `Capture a ${focusSnippet.toLowerCase()} milestone`
          : "Create your first mission-aligned task",
        description: missionSnippet
          ? `Kick things off with a concrete action that pushes ${missionSnippet} forward.`
          : "Kick things off with a concrete action that pushes your mission forward.",
        action: "Start",
        color: "purple",
        icon: "target",
      })
    } else {
      if (highAlignment.length === 0) {
        generated.push({
          id: "add-high-alignment",
          title: "Add one mission-critical task",
          description: missionSnippet
            ? `You don't have any highly aligned tasks yet. Define one move that directly advances ${missionSnippet}.`
            : "You don't have any highly aligned tasks yet. Define one move that directly advances your mission.",
          action: "Create",
          color: "indigo",
          icon: "target",
        })
      }

      if (lowAlignment.length > highAlignment.length) {
        generated.push({
          id: "reduce-distractions",
          title: "Trim distraction tasks",
          description: `Reframe or drop ${lowAlignment.length} low-alignment tasks so you can focus on what moves the needle.`,
          action: "Review list",
          color: "orange",
          icon: "lightbulb",
        })
      }

      if (completionRate < 50 && totalTasks > 3) {
        generated.push({
          id: "finish-high-impact",
          title: "Complete two high-impact tasks today",
          description: "Finish what's already on your plate to rebuild momentum before adding more work.",
          action: "Focus",
          color: "green",
          icon: "trendingUp",
        })
      }
    }

    if (generated.length === 0) {
      generated.push({
        id: "prioritize",
        title: missionSnippet ? "Plot your next mission-aligned move" : "Review and prioritize tasks",
        description: missionSnippet
          ? `Take ten minutes to curate the work that best supports ${missionSnippet}.`
          : "Take ten minutes to curate the work that best supports your mission.",
        action: "Review",
        color: "blue",
        icon: "lightbulb",
      })
    }

    return generated.slice(0, 3)
  }, [tasks, missionSnippet, focusSnippet])

  const tasksSignature = React.useMemo(
    () => tasks.map((task) => `${task.id}-${task.completed}-${task.alignment_score ?? 0}`).join("|"),
    [tasks]
  )

  const fetchSuggestions = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoadingSuggestions(true)
      setLastError(null)
      try {
        const { generateSmartSuggestions } = await import("@/app/actions/analytics")
        const result = await generateSmartSuggestions()
        if (signal?.aborted) return

        if (result.success && result.suggestions.length > 0) {
          setSuggestions(result.suggestions)
        } else {
          setSuggestions(fallbackSuggestions)
          if (result.error) {
            setLastError(result.error)
          }
        }
      } catch (error) {
        if (signal?.aborted) return
        console.error("Failed to load smart suggestions:", error)
        setSuggestions(fallbackSuggestions)
        setLastError("Smart suggestions are temporarily unavailable.")
      } finally {
        if (!signal?.aborted) {
          setLoadingSuggestions(false)
        }
      }
    },
    [fallbackSuggestions]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    fetchSuggestions(controller.signal)
    return () => {
      controller.abort()
      setLoadingSuggestions(false)
    }
  }, [fetchSuggestions, tasksSignature])

  const handleSuggestionAction = async (suggestion: SuggestionCard) => {
    setCreatingTask(suggestion.id)

    try {
      const { createTask } = await import("@/app/actions/tasks")
      const result = await createTask(
        suggestion.title,
        suggestion.description,
        undefined,
        "medium",
        undefined
      )

      if (result?.success) {
        onCreateTask()
        await fetchSuggestions()
      }
    } catch (error) {
      console.error("Failed to create task from suggestion:", error)
    } finally {
      setCreatingTask(null)
    }
  }

  const cardsToRender = suggestions.length > 0 ? suggestions : fallbackSuggestions

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Smart Suggestions</h3>
        {loadingSuggestions && (
          <span className="text-xs text-blue-600 animate-pulse">Refreshing...</span>
        )}
      </div>
      <div className="space-y-3">
        {loadingSuggestions && cardsToRender.length === 0 && (
          <div className="space-y-3">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
                <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 w-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {cardsToRender.map((suggestion) => {
          const palette = suggestionPalettes[suggestion.color]
          const Icon = suggestionIcons[suggestion.icon] || Lightbulb

          return (
            <div
              key={suggestion.id}
              className={`p-4 border rounded-lg transition-all duration-300 hover:shadow-md group cursor-pointer ${palette.card}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${palette.icon}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 mb-1">{suggestion.title}</p>
                  <p className="text-xs text-gray-700 mb-2">{suggestion.description}</p>
                  <button
                    onClick={() => handleSuggestionAction(suggestion)}
                    disabled={creatingTask === suggestion.id}
                    className={`px-3 py-1 text-white text-xs rounded-full transition-transform duration-200 hover:scale-105 disabled:opacity-50 ${palette.button}`}
                  >
                    {creatingTask === suggestion.id ? "Creating..." : suggestion.action}
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {lastError && (
          <p className="text-xs text-gray-500">{lastError}</p>
        )}
      </div>
    </div>
  )
}

// Personalized Analysis Component
function PersonalizedAnalysis({ tasks, user, alignmentScore }: { tasks: TaskType[], user: UserType | null, alignmentScore: number }) {
  const generateAnalysis = () => {
    if (!tasks.length || !user) {
      return "Add your first task to get personalized AI analysis of your mission alignment."
    }

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.completed).length
    const activeTasks = totalTasks - completedTasks

    const highAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) >= 70).length
    const mediumAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) >= 40 && (t.alignment_score || 0) < 70).length
    const lowAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) < 40).length

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    let analysis = ""

    // Score interpretation
    if (alignmentScore >= 80) {
      analysis += `Your ${alignmentScore}% alignment score shows excellent focus on mission-critical work. `
    } else if (alignmentScore >= 60) {
      analysis += `Your ${alignmentScore}% alignment score indicates good progress, but there's room for improvement. `
    } else {
      analysis += `Your ${alignmentScore}% alignment score suggests you need to realign your tasks with your mission. `
    }

    // Task distribution analysis
    if (highAlignmentTasks > 0) {
      analysis += `${highAlignmentTasks} of your ${totalTasks} tasks are highly aligned with your mission. `
    }

    if (lowAlignmentTasks > 0) {
      analysis += `${lowAlignmentTasks} tasks are significantly misaligned and may be distracting from your core purpose. `
    }

    // Mission-specific insights
    if (user.mission) {
      const missionWords = user.mission.toLowerCase().split(' ')
      const founderKeywords = ['founder', 'startup', 'company', 'business', 'product']
      const isFounder = founderKeywords.some(keyword => missionWords.includes(keyword))

      if (isFounder) {
        if (highAlignmentTasks < totalTasks * 0.5) {
          analysis += "As a founder, focus on tasks that directly impact product-market fit and customer validation. "
        }
        if (tasks.filter(t => t.title && t.title.toLowerCase().includes('customer') || t.title && t.title.toLowerCase().includes('user')).length === 0) {
          analysis += "Consider adding customer discovery tasks to validate your assumptions. "
        }
      }
    }

    // Completion insights
    if (completionRate < 50) {
      analysis += `Your ${Math.round(completionRate)}% completion rate suggests you may be taking on too many tasks. Focus on finishing 2-3 high-impact items this week. `
    }

    // Actionable recommendations
    if (alignmentScore < 70) {
      analysis += "Prioritize tasks that directly contribute to your mission statement and consider deprioritizing low-alignment activities."
    } else if (alignmentScore >= 80) {
      analysis += "Continue focusing on high-alignment tasks while maintaining your current momentum."
    }

    return analysis
  }

  const analysis = generateAnalysis()

  return (
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none">
        <p className="text-sm text-gray-700 leading-relaxed">{analysis}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">{tasks.filter(t => (t.alignment_score || 0) >= 70).length}</div>
          <div className="text-xs text-gray-600">High Alignment</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">{tasks.filter(t => t.completed).length}</div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
      </div>
    </div>
  )
}

export default function SimplifiedDashboard() {
  const [tasks, setTasks] = React.useState<TaskType[]>([])
  const [user, setUser] = React.useState<UserType | null>(null)
  const [alignmentSummary, setAlignmentSummary] = React.useState<string>("Loading...")
  const [aiInsights, setAiInsights] = React.useState<string[]>([])
  const [openAdd, setOpenAdd] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [taskCreated, setTaskCreated] = React.useState(false)
  const [completingTasks, setCompletingTasks] = React.useState<Set<number>>(new Set())
  const [taskOperations, setTaskOperations] = React.useState<Set<number>>(new Set())
  const [taskTab, setTaskTab] = React.useState<"active" | "completed">("active")

  const completedTasks = React.useMemo(() => tasks.filter((task) => task.completed), [tasks])
  const activeTasks = React.useMemo(() => tasks.filter((task) => !task.completed), [tasks])
  const missionAlignmentScore = React.useMemo(() => {
    if (tasks.length === 0) return 0
    const totalScore = tasks.reduce((sum, task) => sum + (task.alignment_score || 0), 0)
    const average = Math.round(totalScore / tasks.length)
    return Math.max(0, Math.min(100, average))
  }, [tasks])
  const completionRate = React.useMemo(() => {
    if (tasks.length === 0) return 0
    return Math.round((completedTasks.length / tasks.length) * 100)
  }, [tasks, completedTasks])
  const highAlignmentCount = React.useMemo(
    () => tasks.filter((task) => (task.alignment_score || 0) >= 70).length,
    [tasks]
  )
  const recentCompletedTasks = React.useMemo(() => {
    return completedTasks
      .slice()
      .sort((a, b) => {
        const aTime = a.completed_at ? new Date(a.completed_at).getTime() : new Date(a.updated_at).getTime()
        const bTime = b.completed_at ? new Date(b.completed_at).getTime() : new Date(b.updated_at).getTime()
        return bTime - aTime
      })
      .slice(0, 6)
  }, [completedTasks])

  const tasksToRender = React.useMemo(() => {
    if (taskTab === "active") {
      return activeTasks.slice(0, 8)
    }
    return recentCompletedTasks
  }, [taskTab, activeTasks, recentCompletedTasks])

  const showActiveTasks = taskTab === "active"

  const loadData = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      // Load tasks and user data in parallel for better performance
      const [tasksResult, userResult] = await Promise.all([getTasks(), getUser()])

      if (tasksResult.success) {
        setTasks(tasksResult.tasks)
      }

      if (userResult.success && userResult.user) {
        const mappedUser = {
          ...userResult.user,
          id: 1,
          email: userResult.user.userId,
          world_vision: userResult.user.worldVision,
          focus_areas: userResult.user.focusAreas,
          created_at: userResult.user.createdAt,
          updated_at: userResult.user.updatedAt,
          mission: userResult.user.mission ? String(userResult.user.mission) : null
        }
        setUser(mappedUser as UserType)

        // Generate AI insights asynchronously (non-blocking)
        generateDashboardSummary().then(result => {
          if (result.success) {
            setAlignmentSummary(result.summary)
            const insights = [
              "Focus on high-alignment tasks for maximum impact",
              "Consider breaking down complex goals into smaller tasks",
              "Your mission alignment has improved by 15% this week"
            ]
            setAiInsights(insights)
          }
        }).catch(error => {
          console.warn("Failed to generate AI summary:", error)
          setAlignmentSummary("Add tasks to get AI insights!")
          setAiInsights(["Add your first task to see personalized insights"])
        })
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTaskCreated = React.useCallback(() => {
    setTaskCreated(true)
    setTimeout(() => setTaskCreated(false), 2000)
    // Use optimistic updates instead of full reload for better performance
    loadData(true)
  }, [loadData])

  const handleTaskToggle = React.useCallback(async (taskId: number) => {
    const taskToToggle = tasks.find(task => task.id === taskId)
    if (!taskToToggle) {
      return
    }

    const previousTasks = tasks.map(task => ({ ...task }))
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )

    setTaskOperations(prev => new Set(prev).add(taskId))
    setCompletingTasks(prev => new Set(prev).add(taskId))
    setTasks(updatedTasks)

    try {
      const { toggleTaskCompletion } = await import("@/app/actions/tasks")
      const result = await toggleTaskCompletion(taskId)

      if (!result.success) {
        setTasks(previousTasks)
      }
    } catch (error) {
      console.error('Failed to toggle task:', error)
      setTasks(previousTasks)
    } finally {
      setTaskOperations(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
      setCompletingTasks(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }, [tasks])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Success Animation Overlay */}
      {taskCreated && (
        <div className="fixed inset-0 bg-green-500/10 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white rounded-lg p-6 shadow-xl border border-green-200 animate-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300 delay-200">
                <svg className="w-6 h-6 text-green-600 animate-in bounce-in duration-500 delay-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="animate-in slide-in-from-right-4 duration-500 delay-300">
                <h3 className="font-medium text-green-900">Task Created Successfully!</h3>
                <p className="text-sm text-green-700">AI analysis completed and data refreshed.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 transition-all duration-300">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Greta Mission Alignment Founder Dashboard
          </h1>
          <div className="flex items-center gap-4">
            {isRefreshing && (
              <div className="flex items-center gap-2 text-sm text-blue-600 animate-in fade-in duration-300">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="animate-pulse">Refreshing data...</span>
              </div>
            )}
            <div className="text-sm font-medium text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-6">
        {/* North Star */}
        <Card className="mb-6 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-medium text-gray-900">
                <Target className="h-5 w-5 text-blue-600" />
                North Star
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
                  <Link href="/profile">Manage Profile</Link>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <Link href="/goals">View Goals</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  {user?.mission || "Define your mission to get started"}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Alignment insights</span>
                  <span>
                    {tasks.length > 0
                      ? `${completedTasks.length} of ${tasks.length} tasks completed with ${highAlignmentCount} high-alignment win${highAlignmentCount === 1 ? "" : "s"}.`
                      : "Add your first task to start measuring mission progress."}
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col items-center gap-6 sm:w-auto sm:flex-row sm:justify-end">
                <div className="flex items-center gap-4 text-center sm:flex-col sm:text-left">
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold text-gray-900">Overall alignment</p>
                    <p className="text-3xl font-bold text-blue-600">{missionAlignmentScore}%</p>
                  </div>
                  <div className="text-sm text-gray-600 hidden sm:block">
                    <p className="font-semibold text-gray-900">Completion rate</p>
                    <p>{completionRate}% of {tasks.length} tasks</p>
                  </div>
                </div>
               
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Layout - Two Column Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Tasks */}
          <div className="xl:col-span-2 space-y-6">
            {/* Tasks Section */}
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base font-medium text-gray-700">
                  Tasks
                </CardTitle>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 px-3 text-sm font-medium transition-colors ${
                      showActiveTasks
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setTaskTab("active")}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 px-3 text-sm font-medium transition-colors ${
                      !showActiveTasks
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setTaskTab("completed")}
                  >
                    Completed
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tasks List */}
                  <div>
                    {(() => {
                      if (showActiveTasks) {
                        if (tasks.length === 0) {
                          return (
                            <div className="text-center py-12 transition-all duration-300">
                              <div className="text-gray-400 mb-4 transition-transform duration-300 hover:scale-110">
                                <Plus className="h-12 w-12 mx-auto" />
                              </div>
                              <h3 className="font-medium text-gray-900 mb-2">No tasks yet</h3>
                              <p className="text-sm text-gray-600 mb-4">
                                Add your first task to get started with AI-powered mission alignment
                              </p>
                              <Button
                                onClick={() => setOpenAdd(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Task
                              </Button>
                            </div>
                          )
                        }

                        if (tasksToRender.length === 0) {
                          return (
                            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                              <p className="font-medium text-gray-900 mb-1">All tasks are complete</p>
                              <p className="text-sm text-gray-600">Review your wins in the completed tab.</p>
                            </div>
                          )
                        }
                      } else {
                        if (completedTasks.length === 0) {
                          return (
                            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                              <p className="font-medium text-gray-900 mb-1">No completed tasks yet</p>
                              <p className="text-sm text-gray-600">Complete a task to see it logged here.</p>
                            </div>
                          )
                        }
                      }

                      return (
                        <div className="space-y-3">
                          {tasksToRender.map((task, index) => {
                            const isCompleting = completingTasks.has(task.id)
                            const isOperating = taskOperations.has(task.id)
                            const isDone = !!task.completed

                            return (
                              <div
                                key={task.id}
                                className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-300 hover:shadow-sm group animate-in slide-in-from-left-2 ${
                                  isDone
                                    ? 'bg-green-50 border-green-200 opacity-75'
                                    : 'border-gray-200 hover:bg-gray-50 hover:border-blue-300 hover:scale-[1.01]'
                                } ${isOperating ? 'animate-pulse' : ''}`}
                                style={{
                                  animationDelay: `${index * 50}ms`
                                }}
                              >
                                <button
                                  onClick={() => handleTaskToggle(task.id)}
                                  disabled={isCompleting}
                                  className={`relative h-4 w-4 rounded border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                    isDone
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-gray-300 hover:border-blue-400'
                                  } ${isCompleting ? 'animate-spin' : ''}`}
                                >
                                  {isCompleting ? (
                                    <div className="absolute inset-0 rounded border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                  ) : isDone ? (
                                    <svg className="absolute inset-0 w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : null}
                                </button>
                                <div className="flex-1">
                                  <h3 className={`font-medium transition-colors duration-200 ${
                                    isDone
                                      ? 'text-green-800 line-through'
                                      : 'text-gray-900 group-hover:text-blue-900'
                                  }`}>
                                    {task.title}
                                  </h3>
                                  {task.description && (
                                    <p className={`text-sm mt-1 transition-colors duration-200 line-clamp-2 ${
                                      isDone
                                        ? 'text-green-700'
                                        : 'text-gray-600 group-hover:text-gray-700'
                                    }`}>
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                    <span className="transition-colors duration-200 group-hover:text-gray-600">
                                      Alignment: {task.alignment_score || 0}%
                                    </span>
                                    {isDone && (
                                      <span className="text-green-600">
                                        Completed on{' '}
                                        {(task.completed_at ? new Date(task.completed_at) : new Date(task.updated_at)).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Progress and Smart Suggestions */}
                  <div className="space-y-6">
                    {/* Progress Section */}
                    <div className="animate-in slide-in-from-bottom-2 duration-500 delay-300">
                      <h3 className="font-medium text-gray-900 mb-3">Progress</h3>
                      <div className="space-y-4">
                        <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-800">Completion rate</span>
                            <span className="text-gray-500">{completedTasks.length} / {tasks.length}</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
                              style={{ width: `${Math.min(100, completionRate)}%` }}
                            ></div>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">{completionRate}% of this week's work is done.</p>
                        </div>

                        <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-800">Mission achievement</span>
                            <span className="text-gray-500">{missionAlignmentScore}% aligned</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all duration-700 ease-out"
                              style={{ width: `${missionAlignmentScore}%` }}
                            ></div>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            {highAlignmentCount > 0
                              ? `${highAlignmentCount} task${highAlignmentCount === 1 ? "" : "s"} are fueling the mission.`
                              : "Add a mission-critical task to build momentum."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Personalized Smart Suggestions */}
                    <PersonalizedSuggestions
                      tasks={tasks}
                      user={user}
                      onCreateTask={handleTaskCreated}
                    />

                    {/* Add Task Button */}
                    <Button
                      onClick={() => setOpenAdd(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Analysis */}
          <div className="space-y-6">
            {/* AI Analysis Card */}
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium text-gray-700">
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                <PersonalizedAnalysis
                  tasks={tasks}
                  user={user}
                  alignmentScore={missionAlignmentScore}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Smart Task Dialog */}
      <SmartTaskDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  )
}