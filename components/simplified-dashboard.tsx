"use client"

import * as React from "react"
import { Target, Plus, Lightbulb, TrendingUp, TrendingDown, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CircularProgress from "@/components/circular-progress"
import SmartTaskDialog from "@/components/smart-task-dialog"
import { getTasks } from "@/app/actions/tasks"
import { getUser } from "@/app/actions/user"
import { generateDashboardSummary } from "@/app/actions/analytics"
import type { Task as TaskType, User as UserType } from "@/lib/types"

// Personalized Suggestions Component
function PersonalizedSuggestions({ tasks, user, onCreateTask }: { tasks: TaskType[], user: UserType | null, onCreateTask: () => void }) {
  const [creatingTask, setCreatingTask] = React.useState<string | null>(null)

  const generatePersonalizedSuggestions = () => {
    if (!tasks.length || !user) return []

    const completedTasks = tasks.filter(t => t.completed).length
    const totalTasks = tasks.length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const highAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) >= 70).length
    const mediumAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) >= 40 && (t.alignment_score || 0) < 70).length
    const lowAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) < 40).length

    const suggestions = []

    // Mission-specific suggestions based on user's profile
    if (user.mission?.toLowerCase().includes('founder') || user.mission?.toLowerCase().includes('startup')) {
      if (lowAlignmentTasks > highAlignmentTasks) {
        suggestions.push({
          id: 'founder-product',
          title: 'Build product-market fit validation',
          description: 'Create a task to validate your product with real users and measure engagement metrics.',
          icon: TrendingUp,
          color: 'purple',
          action: 'Start'
        })
      }

      if (tasks.filter(t => t.title && t.title.toLowerCase().includes('customer') || t.title && t.title.toLowerCase().includes('user')).length === 0) {
        suggestions.push({
          id: 'founder-customers',
          title: 'Talk to 5 potential customers today',
          description: 'Direct customer discovery to understand pain points and validate your solution approach.',
          icon: Target,
          color: 'blue',
          action: 'Start'
        })
      }
    }

    // Task volume and completion suggestions
    if (completionRate < 50 && totalTasks > 3) {
      suggestions.push({
        id: 'focus-completion',
        title: 'Complete 2 high-impact tasks today',
        description: 'Focus on finishing existing tasks rather than adding new ones to build momentum.',
        icon: Zap,
        color: 'green',
        action: 'Focus'
      })
    }

    // Alignment improvement suggestions
    if (highAlignmentTasks === 0 && totalTasks > 0) {
      suggestions.push({
        id: 'mission-alignment',
        title: 'Add mission-critical task',
        description: `Create a task that directly advances: "${user.mission?.substring(0, 30)}${user.mission && user.mission.length > 30 ? '...' : ''}"`,
        icon: Target,
        color: 'indigo',
        action: 'Create'
      })
    }

    // Default suggestions if none generated
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'default-1',
        title: 'Review and prioritize tasks',
        description: 'Take 10 minutes to review your task list and ensure they align with your core mission.',
        icon: Lightbulb,
        color: 'blue',
        action: 'Review'
      })
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  const handleSuggestionAction = async (suggestion: any) => {
    setCreatingTask(suggestion.id)

    try {
      // Import createTask action
      const { createTask } = await import('@/app/actions/tasks')
      
      // Create task with optimized payload
      const result = await createTask(
        suggestion.title,
        suggestion.description,
        undefined, // userId (will be determined server-side)
        'medium', // default alignment category
        undefined // goalId
      )

      if (result.success) {
        // Show immediate feedback
        setTimeout(() => {
          onCreateTask()
        }, 100)
      }
    } catch (error) {
      console.error('Failed to create task from suggestion:', error)
    } finally {
      setCreatingTask(null)
    }
  }

  const suggestions = generatePersonalizedSuggestions()

  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">Smart Suggestions</h3>
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-4 bg-${suggestion.color}-50 border border-${suggestion.color}-200 rounded-lg hover:bg-${suggestion.color}-100 transition-all duration-300 hover:shadow-md group cursor-pointer`}
          >
            <div className="flex items-start gap-3">
              <suggestion.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 text-${suggestion.color}-600 group-hover:scale-110 transition-transform duration-200`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 mb-1">{suggestion.title}</p>
                <p className="text-xs text-gray-700 mb-2">{suggestion.description}</p>
                <button
                  onClick={() => handleSuggestionAction(suggestion)}
                  disabled={creatingTask === suggestion.id}
                  className={`px-3 py-1 bg-${suggestion.color}-600 text-white text-xs rounded-full hover:bg-${suggestion.color}-700 transition-colors duration-200 hover:scale-105 disabled:opacity-50`}
                >
                  {creatingTask === suggestion.id ? 'Creating...' : suggestion.action}
                </button>
              </div>
            </div>
          </div>
        ))}
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

  React.useEffect(() => {
    loadData()
  }, [])

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
        };
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
      const { toggleTaskCompletion } = await import('@/app/actions/tasks')
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

  const calculateAlignmentScore = () => {
    if (tasks.length === 0) return 304 // Default for demo, matching the image
    const totalScore = tasks.reduce((sum, task) => sum + (task.alignment_score || 0), 0)
    return Math.round(totalScore / tasks.length)
  }

  const orderedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed))
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
        <Card className="mb-6 transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-gray-900">
              <Target className="h-5 w-5 text-blue-600" />
              North Star
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 transition-all duration-300">
              {user?.mission || "Define your mission to get started"}
            </p>
          </CardContent>
        </Card>

        {/* Mission Alignment Score */}
        <Card className="mb-6 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-900">
              Mission Alignment Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <CircularProgress
              value={calculateAlignmentScore()}
              size={160}
              strokeWidth={12}
              indicatorColor="#3B82F6"
              trackColor="#E5E7EB"
              showInsights={false}
              tasks={tasks}
              user={user}
            />
          </CardContent>
        </Card>

        {/* Main Layout - Two Column Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Tasks */}
          <div className="xl:col-span-2 space-y-6">
            {/* Tasks Section */}
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base font-medium text-gray-700">
                  Tasks
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tasks List */}
                  <div>
                    {tasks.length > 0 ? (
                      <div className="space-y-3">
                        {orderedTasks
                          .slice(0, 8)
                          .map((task, index) => {
                            const isCompleting = completingTasks.has(task.id)
                            const isOperating = taskOperations.has(task.id)

                            return (
                              <div
                                key={task.id}
                                className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-300 hover:shadow-sm group ${
                                  task.completed
                                    ? 'bg-green-50 border-green-200 opacity-75'
                                    : 'border-gray-200 hover:bg-gray-50 hover:border-blue-300 hover:scale-[1.01]'
                                } ${isOperating ? 'animate-pulse' : ''}`}
                                style={{
                                  animationDelay: `${index * 50}ms`,
                                  animation: isOperating ? 'pulse 1s infinite' : 'slideInFromLeft 0.4s ease-out forwards'
                                }}
                              >
                                <button
                                  onClick={() => handleTaskToggle(task.id)}
                                  disabled={isCompleting}
                                  className={`relative h-4 w-4 rounded border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                    task.completed
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-gray-300 hover:border-blue-400'
                                  } ${isCompleting ? 'animate-spin' : ''}`}
                                >
                                  {isCompleting ? (
                                    <div className="absolute inset-0 rounded border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                  ) : task.completed ? (
                                    <svg className="absolute inset-0 w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : null}
                                </button>
                                <div className="flex-1">
                                  <h3 className={`font-medium transition-colors duration-200 ${
                                    task.completed
                                      ? 'text-green-800 line-through'
                                      : 'text-gray-900 group-hover:text-blue-900'
                                  }`}>
                                    {task.title}
                                  </h3>
                                  {task.description && (
                                    <p className={`text-sm mt-1 transition-colors duration-200 line-clamp-2 ${
                                      task.completed
                                        ? 'text-green-700'
                                        : 'text-gray-600 group-hover:text-gray-700'
                                    }`}>
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center mt-2">
                                    <div className="text-xs text-gray-500 transition-colors duration-200 group-hover:text-gray-600">
                                      Alignment: {task.alignment_score || 0}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {/* Progress and Smart Suggestions */}
                  <div className="space-y-6">
                    {/* Progress Section */}
                    <div className="animate-in slide-in-from-bottom-2 duration-500 delay-300">
                      <h3 className="font-medium text-gray-900 mb-3">Progress</h3>
                      <div className="space-y-3">
                        <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${Math.min(100, (tasks.filter(t => t.completed).length / Math.max(tasks.length, 1)) * 100)}%`,
                              animation: 'progressFill 1.2s ease-out forwards'
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 animate-in fade-in duration-300 delay-500">
                          {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
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
                  alignmentScore={calculateAlignmentScore()}
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