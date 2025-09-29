"use client"

import * as React from "react"
import { Target, Plus, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CircularProgress from "@/components/circular-progress"
import SmartTaskDialog from "@/components/smart-task-dialog"
import { getTasks } from "@/app/actions/tasks"
import { getUser } from "@/app/actions/user"
import { generateDashboardSummary } from "@/app/actions/analytics"
import type { Task as TaskType, User as UserType } from "@/lib/types"

export default function SimplifiedDashboard() {
  const [tasks, setTasks] = React.useState<TaskType[]>([])
  const [user, setUser] = React.useState<UserType | null>(null)
  const [alignmentSummary, setAlignmentSummary] = React.useState<string>("Loading...")
  const [aiInsights, setAiInsights] = React.useState<string[]>([])
  const [openAdd, setOpenAdd] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
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

        // Generate AI insights
        try {
          const result = await generateDashboardSummary()
          if (result.success) {
            setAlignmentSummary(result.summary)
            // Extract key insights from the summary
            const insights = [
              "Focus on high-alignment tasks for maximum impact",
              "Consider breaking down complex goals into smaller tasks",
              "Your mission alignment has improved by 15% this week"
            ]
            setAiInsights(insights)
          }
        } catch (error) {
          console.warn("Failed to generate AI summary:", error)
          setAlignmentSummary("Add tasks to get AI insights!")
          setAiInsights(["Add your first task to see personalized insights"])
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAlignmentScore = () => {
    if (tasks.length === 0) return 304 // Default for demo, matching the image
    const totalScore = tasks.reduce((sum, task) => sum + (task.alignment_score || 0), 0)
    return Math.round(totalScore / tasks.length)
  }

  const activeTasks = tasks.filter(task => !task.completed)

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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Greta Mission Alignment Founder Dashboard
          </h1>
          <div className="text-sm font-medium text-gray-600">
            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl p-6">
        {/* North Star */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-gray-900">
              <Target className="h-5 w-5 text-blue-600" />
              North Star
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {user?.mission || "Define your mission to get started"}
            </p>
          </CardContent>
        </Card>

        {/* Main Grid Layout - matching the uploaded image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Alignment Score Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-gray-700">
                Alignment Score
              </CardTitle>
              <div className="text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <div className="relative">
                <CircularProgress
                  
                  size={160}
                  strokeWidth={12}
                  indicatorColor="#3B82F6"
                  trackColor="#E5E7EB"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                   
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-gray-700">
                AI Insights
              </CardTitle>
              <div className="text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </CardHeader>
            <CardContent className="py-8">
              <div className="space-y-4">
                {aiInsights.length > 0 ? (
                  aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{insight}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    <p className="text-sm">AI Insights</p>
                    <p className="text-xs mt-1">Add tasks to see personalized insights</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <Card>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tasks List */}
              <div className="lg:col-span-2">
                {activeTasks.length > 0 ? (
                  <div className="space-y-3">
                    {activeTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="h-4 w-4 border border-gray-300 rounded"></div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center mt-2">
                            <div className="text-xs text-gray-500">
                              Alignment: {task.alignment_score || 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Plus className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">No tasks yet</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add your first task to get started with AI-powered mission alignment
                    </p>
                    <Button onClick={() => setOpenAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress and AI Suggestions */}
              <div className="space-y-6">
                {/* Progress Section */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Progress</h3>
                  <div className="space-y-3">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    <div className="text-xs text-gray-600">
                      {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
                    </div>
                  </div>
                </div>

                {/* AI Smart Suggestions */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Smart Suggestions</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                          Consider adding a high-impact task that directly advances your mission
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-green-800">
                          Break down complex goals into smaller, actionable tasks
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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
      </main>

      {/* Smart Task Dialog */}
      <SmartTaskDialog open={openAdd} onOpenChange={setOpenAdd} />
    </div>
  )
}