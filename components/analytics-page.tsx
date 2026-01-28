"use client"

import type React from "react"
import { useEffect, useState } from "react"

import Link from "next/link"
import { ArrowLeft, TrendingUp, Target, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { getHistoricalAlignmentData } from "@/app/actions/analytics"
import { Button } from "@/components/ui/button"

const chartConfig = {
  aligned: { label: "Aligned", color: "hsl(var(--chart-1))" },
  distraction: { label: "Distraction", color: "hsl(var(--chart-2))" },
} as const

export default function AnalyticsPage() {
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')

  useEffect(() => {
    loadData()
  }, [timeRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getHistoricalAlignmentData(parseInt(timeRange))
      if (result.success) {
        setHistoricalData(result.data)
      }
    } catch (error) {
      console.error("Failed to load historical data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Transform data for charts
  const chartData = historicalData.slice(-parseInt(timeRange)).map((item, index) => ({
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    date: item.date,
    alignment: item.overallAlignmentScore,
    completed: item.completedTasksCount,
    total: item.totalTasksCount,
    highAlignment: item.highAlignmentTasks,
    distractions: item.distractionTasks,
    completionRate: item.totalTasksCount > 0 ? Math.round((item.completedTasksCount / item.totalTasksCount) * 100) : 0,
  }))

  const averageAlignment = chartData.length > 0
    ? Math.round(chartData.reduce((sum, item) => sum + item.alignment, 0) / chartData.length)
    : 0

  const totalCompletedTasks = chartData.reduce((sum, item) => sum + item.completed, 0)
  const totalTasks = chartData.reduce((sum, item) => sum + item.total, 0)
  const overallCompletionRate = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold">Mission Alignment Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={timeRange === '7' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7')}
          >
            7 days
          </Button>
          <Button
            size="sm"
            variant={timeRange === '30' ? 'default' : 'outline'}
            onClick={() => setTimeRange('30')}
          >
            30 days
          </Button>
          <Button
            size="sm"
            variant={timeRange === '90' ? 'default' : 'outline'}
            onClick={() => setTimeRange('90')}
          >
            90 days
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-[#28A745]">{averageAlignment}%</div>
            <div className="text-xs text-[#6B7280]">Avg Alignment</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{overallCompletionRate}%</div>
            <div className="text-xs text-[#6B7280]">Completion Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{totalCompletedTasks}</div>
            <div className="text-xs text-[#6B7280]">Tasks Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {chartData.reduce((sum, item) => sum + item.distractions, 0)}
            </div>
            <div className="text-xs text-[#6B7280]">Distractions</div>
          </CardContent>
        </Card>
      </div>

      {/* Alignment Trend Chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#28A745]" />
            Alignment Score Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-sm text-[#6B7280]">Loading historical data...</div>
            </div>
          ) : (
            <ChartContainer
              config={{
                alignment: { label: "Alignment Score", color: "#28A745" },
              }}
              className="h-64 w-full"
            >
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ stroke: "#28A745", strokeWidth: 2 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-medium">{data.date}</p>
                            <p className="text-sm text-[#28A745]">
                              Alignment: {data.alignment}%
                            </p>
                            <p className="text-sm text-blue-600">
                              Completion: {data.completionRate}%
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="alignment"
                    stroke="#28A745"
                    strokeWidth={3}
                    dot={{ fill: "#28A745", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
          <p className="mt-3 text-xs text-[#6B7280]">
            Your mission alignment score over time. Higher scores indicate better alignment with your mission.
          </p>
        </CardContent>
      </Card>

      {/* Task Completion Chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            Task Completion & Alignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-sm text-[#6B7280]">Loading data...</div>
            </div>
          ) : (
            <ChartContainer
              config={{
                completionRate: { label: "Completion Rate", color: "#3B82F6" },
                highAlignment: { label: "High Alignment Tasks", color: "#10B981" },
              }}
              className="h-64 w-full"
            >
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-medium">{data.date}</p>
                            <p className="text-sm text-blue-600">
                              Completion: {data.completionRate}%
                            </p>
                            <p className="text-sm text-green-600">
                              High Alignment: {data.highAlignment}
                            </p>
                            <p className="text-sm text-red-600">
                              Distractions: {data.distractions}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="completionRate"
                    fill="#3B82F6"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
          <p className="mt-3 text-xs text-[#6B7280]">
            Task completion rate and alignment breakdown over time.
          </p>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="border-l-4 border-l-[#28A745]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#28A745]" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Strong Progress</p>
                <p className="text-xs text-green-700">
                  Your average alignment score of {averageAlignment}% shows you're consistently focusing on mission-aligned activities.
                </p>
              </div>
            </div>
          </div>

          {overallCompletionRate >= 70 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Excellent Execution</p>
                  <p className="text-xs text-blue-700">
                    {overallCompletionRate}% completion rate indicates strong follow-through on your commitments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {chartData.reduce((sum, item) => sum + item.distractions, 0) > totalTasks * 0.2 && (
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Distraction Alert</p>
                  <p className="text-xs text-orange-700">
                    Consider reviewing and reducing time spent on low-alignment activities.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SuggestionItem({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border bg-white p-3">{children}</div>
}
