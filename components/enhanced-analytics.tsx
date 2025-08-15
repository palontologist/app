"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles, TrendingUp, Target, Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { getTasks } from "@/app/actions/tasks"
import { generateWeeklyInsights } from "@/lib/ai"
import { getGoals } from "@/app/actions/goals"
import { getUser } from "@/app/actions/user"
import { getAlignmentChartData } from "@/app/actions/analytics"
import type { Task, Goal, User } from "@/lib/types"

const chartConfig = {
  aligned: { label: "Aligned", color: "hsl(var(--chart-1))" },
  distraction: { label: "Distraction", color: "hsl(var(--chart-2))" },
} as const

export default function EnhancedAnalytics() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [goals, setGoals] = React.useState<Goal[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [insights, setInsights] = React.useState<any>(null)
  const [chartData, setChartData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksResult, goalsResult, userResult, chartDataResult] = await Promise.all([
        getTasks(),
        getGoals(),
        getUser(),
        getAlignmentChartData(),
      ])

      if (tasksResult.success) {
        setTasks(tasksResult.tasks)

        if (goalsResult.success && userResult.success) {
          setGoals(goalsResult.goals)
          setUser(userResult.user)

          // Generate AI insights only if we have tasks
          if (tasksResult.tasks.length > 0) {
            try {
              const aiInsights = await generateWeeklyInsights(
                tasksResult.tasks,
                goalsResult.goals,
                userResult.user?.mission || "",
              )
              setInsights(aiInsights)
            } catch (insightError) {
              console.error("Failed to generate insights:", insightError)
              setInsights(null)
            }
          }
        }
      }

      setChartData(chartDataResult)
    } catch (error) {
      console.error("Failed to load analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#28A745]" />
            Groq-Powered Analytics
          </h1>
          <p className="text-sm text-[#6B7280]">Advanced AI insights on your focus and alignment</p>
        </div>
      </header>

      {/* AI Insights Summary */}
      {insights && (
        <Card className="mb-6 border-l-4 border-l-[#28A745]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-[#28A745]" />
              Weekly Groq Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Overall Alignment Score</span>
              <span className="text-2xl font-bold text-[#28A745]">{insights.overall_alignment_score}%</span>
            </div>

            <div className="rounded-lg bg-[#28A745]/5 p-3">
              <h3 className="text-sm font-medium text-[#28A745] mb-2">🎉 Celebration</h3>
              <p className="text-sm text-[#374151]">{insights.celebration}</p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <h3 className="text-sm font-medium text-blue-700 mb-2">🎯 Focus Area</h3>
              <p className="text-sm text-[#374151]">{insights.focus_area}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alignment Chart - Only show days with data */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alignment Over the Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.some((d) => d.hasData) ? (
            <>
              <ChartContainer
                config={chartConfig}
                className="h-64 w-full"
                style={
                  {
                    ["--chart-1"]: "134 61% 41%", // ~#28A745 in HSL
                    ["--chart-2"]: "220 9% 85%", // gray
                  } as React.CSSProperties
                }
              >
                <ResponsiveContainer>
                  <BarChart data={chartData.filter((d) => d.hasData)} stackOffset="none">
                    <CartesianGrid vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip>
                      <ChartTooltipContent />
                    </ChartTooltip>
                    <Bar dataKey="aligned" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="distraction" stackId="a" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <p className="mt-3 text-xs text-[#6B7280]">
                Groq AI-analyzed alignment patterns based on your actual task completion and mission relevance
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="mb-4 h-12 w-12 text-[#D1D5DB]" />
              <h3 className="mb-2 font-medium">No task data yet</h3>
              <p className="text-sm text-[#6B7280]">Complete some tasks to see your alignment patterns over time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {insights && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-[#28A745]" />
              Groq AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.key_insights?.map((insight: string, index: number) => (
              <div key={index} className="rounded-md border bg-white p-3">
                <p className="text-sm text-[#374151]">{insight}</p>
              </div>
            ))}

            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium text-[#374151]">Action Items:</h3>
              {insights.recommendations?.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#28A745] mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-[#6B7280]">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-[#28A745]" />
            Task Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#28A745]">{tasks.filter((t) => t.completed).length}</div>
              <div className="text-xs text-[#6B7280]">Completed Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#28A745]">
                {tasks.length > 0
                  ? Math.round(tasks.reduce((sum, t) => sum + (t.alignment_score || 0), 0) / tasks.length)
                  : 0}
                %
              </div>
              <div className="text-xs text-[#6B7280]">Avg Alignment</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
