"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Globe, Users, TrendingUp, Heart, Target, Calendar, Plus, Edit, Clock, Trash2, Lightbulb, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getRealisticMetrics, deleteMetric, editMetricTarget, generateAIMetricSuggestions } from "@/app/actions/analytics"
import ManualMetricDialog from "@/components/manual-metric-dialog"
import MetricUpdateDialog from "@/components/metric-update-dialog"
import LoadingScreen from "@/components/loading-screen"
import FounderTrackingDialog from "@/components/founder-tracking-dialog"
import WorkSessionDialog from "@/components/work-session-dialog"
import { getFounders } from "@/app/actions/founders"
import { getWorkSessions } from "@/app/actions/work-sessions"

export default function ImpactPageEnhanced() {
  const [worldVision, setWorldVision] = React.useState("")
  const [mission, setMission] = React.useState("")
  const [metrics, setMetrics] = React.useState<any>({})
  const [loading, setLoading] = React.useState(true)
  const [openManualMetric, setOpenManualMetric] = React.useState(false)
  const [openUpdateMetric, setOpenUpdateMetric] = React.useState(false)
  const [selectedMetric, setSelectedMetric] = React.useState<any>(null)
  const [openFounderDialog, setOpenFounderDialog] = React.useState(false)
  const [openWorkSession, setOpenWorkSession] = React.useState(false)
  const [openAISuggestions, setOpenAISuggestions] = React.useState(false)
  const [openEditTarget, setOpenEditTarget] = React.useState(false)
  const [editingMetric, setEditingMetric] = React.useState<any>(null)
  const [founders, setFounders] = React.useState<any[]>([])
  const [workSessions, setWorkSessions] = React.useState<any[]>([])
  const [aiSuggestions, setAISuggestions] = React.useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false)

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const savedVision = localStorage.getItem("greta-world-vision")
      const savedMission = localStorage.getItem("greta-mission")

      setWorldVision(
        savedVision ||
          "A world where every person has the tools and confidence to build something meaningful that aligns with their deepest values and creates positive change.",
      )
      setMission(savedMission || "Empower 10,000 founders to ship mission-aligned work every day.")

      // Load all data
      const [metricsResult, foundersResult, sessionsResult] = await Promise.all([
        getRealisticMetrics(),
        getFounders(),
        getWorkSessions(),
      ])

      // Defensive: ensure metricsResult has expected shape
      if (!metricsResult || typeof metricsResult !== "object" || !("metrics" in metricsResult)) {
        console.warn("getRealisticMetrics returned unexpected result:", metricsResult)
        setMetrics({})
      } else if (!metricsResult.success) {
        // still set default metrics object to avoid UI crashes
        setMetrics(metricsResult.metrics || {})
      } else {
        setMetrics(metricsResult.metrics || {})
      }

      if (foundersResult && foundersResult.success) setFounders(foundersResult.founders || [])
      else if (foundersResult && !foundersResult.success) setFounders([])

      if (sessionsResult && sessionsResult.success) setWorkSessions(sessionsResult.sessions || [])
      else if (sessionsResult && !sessionsResult.success) setWorkSessions([])
    } catch (error) {
      console.error("Failed to load impact data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMetric = (metricKey: string, metric: any) => {
    setSelectedMetric({
      id: metric.id,
      title: metric.title || getMetricDisplayName(metricKey),
      current: metric.current,
      target: metric.target,
      unit: metric.unit,
      category: metric.category,
    })
    setOpenUpdateMetric(true)
  }

  const handleEditTarget = (metricKey: string, metric: any) => {
    setEditingMetric({
      key: metricKey,
      id: metric.id,
      title: metric.title || getMetricDisplayName(metricKey),
      current: metric.current,
      target: metric.target,
      unit: metric.unit,
    })
    setOpenEditTarget(true)
  }

  const handleDeleteMetric = async (metricKey: string, metricId?: number) => {
    if (confirm("Are you sure you want to delete this metric?")) {
      const result = await deleteMetric(metricKey, metricId)
      if (result.success) {
        loadData()
      } else {
        alert(result.error || "Failed to delete metric")
      }
    }
  }

  const handleTargetUpdate = async (newTarget: number) => {
    if (!editingMetric) return
    
    const result = await editMetricTarget(editingMetric.key, newTarget, editingMetric.id)
    if (result.success) {
      setOpenEditTarget(false)
      setEditingMetric(null)
      loadData()
    } else {
      alert(result.error || "Failed to update target")
    }
  }

  const loadAISuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const result = await generateAIMetricSuggestions()
      if (result.success) {
        setAISuggestions(result.suggestions)
        setOpenAISuggestions(true)
      } else {
        alert("Failed to generate AI suggestions")
      }
    } catch (error) {
      console.error("Failed to load AI suggestions:", error)
      alert("Failed to generate AI suggestions")
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const getMetricDisplayName = (key: string) => {
    const names: { [key: string]: string } = {
      daily_mission_focus: "Daily Mission Focus",
      task_completion_velocity: "Task Completion Velocity",
      alignment_consistency: "Alignment Consistency",
      weekly_impact_hours: "Weekly Impact Hours",
      weekly_completion_rate: "Weekly Completion Rate",
      impact_work_hours: "Impact Work Hours",
    }
    return names[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getMetricDescription = (key: string, metric: any) => {
    if (metric.category === "goals") return `Personal Goal: ${metric.description}`
    if (metric.category === "custom") return `Custom Metric: ${metric.description}`
    return metric.description
  }

  const canEdit = (metric: any) => metric.editable !== false
  const canDelete = (metric: any) => metric.deletable !== false

  if (loading) {
    return <LoadingScreen message="Loading your enhanced impact metrics..." />
  }

  return (
    <div className="mx-auto max-w-4xl px-3 pb-16 pt-4 sm:px-4 sm:pt-6">
      {/* Mobile-Optimized Header */}
      <header className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
          <Link
            href="/dashboard"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-sm hover:bg-accent hover:text-accent-foreground sm:h-9 sm:w-auto sm:px-3"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold sm:text-lg">Enhanced Impact Journey</h1>
            <p className="text-xs text-[#6B7280] sm:text-sm">Smart metrics tailored to your mission</p>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenFounderDialog(true)}
              className="flex-1 text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white sm:flex-none"
            >
              <Users className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Add Founder</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenWorkSession(true)}
              className="flex-1 text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white sm:flex-none"
            >
              <Clock className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Log Work</span>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadAISuggestions}
              disabled={loadingSuggestions}
              className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white sm:flex-none"
            >
              <Lightbulb className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">AI Suggest</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setOpenManualMetric(true)}
              className="flex-1 text-white bg-[#28A745] hover:bg-[#23923d] sm:flex-none"
            >
              <Plus className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Add Metric</span>
            </Button>
          </div>
        </div>
      </header>

      {/* World Vision */}
      <Card className="mb-4 border-l-4 border-l-[#28A745] sm:mb-6">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Globe className="h-4 w-4 text-[#28A745] sm:h-5 sm:w-5" />
            The World You're Building
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-[#374151] leading-relaxed sm:text-base">{worldVision}</p>
        </CardContent>
      </Card>

      {/* Mission Connection */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Target className="h-4 w-4 text-[#28A745] sm:h-5 sm:w-5" />
            How Your Mission Contributes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
            <p className="text-sm text-[#374151] mb-2 sm:mb-3">{mission}</p>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <Heart className="h-3 w-3" />
              <span>Track smart metrics that reflect your real progress toward this mission</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Metrics Display */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 text-[#28A745] sm:h-5 sm:w-5" />
            Your Enhanced Progress Metrics
            <Badge variant="secondary" className="text-xs">
              AI-Powered & Editable
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {Object.entries(metrics).map(([key, metric]: [string, any]) => {
            const percentage = Math.min((metric.current / metric.target) * 100, 100)
            const remaining = metric.target - metric.current

            return (
              <div key={key} className="space-y-2 sm:space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{metric.title || getMetricDisplayName(key)}</h3>
                      
                      {/* Metric badges */}
                      {metric.ai_generated && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                          AI
                        </Badge>
                      )}
                      {metric.category === "goals" && (
                        <Badge variant="outline" className="text-xs text-purple-600 border-purple-600">
                          Goal
                        </Badge>
                      )}
                      
                      {/* Action buttons */}
                      {canEdit(metric) && metric.manual_entry && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateMetric(key, metric)}
                          className="h-5 w-5 p-0 text-[#6B7280] hover:text-[#28A745] sm:h-6 sm:w-6"
                          title="Update value"
                        >
                          <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      )}
                      
                      {canEdit(metric) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTarget(key, metric)}
                          className="h-5 w-5 p-0 text-[#6B7280] hover:text-blue-600 sm:h-6 sm:w-6"
                          title="Edit target"
                        >
                          <Settings className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      )}
                      
                      {canDelete(metric) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMetric(key, metric.id)}
                          className="h-5 w-5 p-0 text-[#6B7280] hover:text-red-600 sm:h-6 sm:w-6"
                          title="Delete metric"
                        >
                          <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] line-clamp-2">{getMetricDescription(key, metric)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-sm">
                      {metric.current.toLocaleString()} / {metric.target.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#6B7280]">{metric.unit}</div>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex justify-between text-xs text-[#6B7280]">
                  <span>{percentage.toFixed(1)}% complete</span>
                  <span>{remaining.toLocaleString()} to go</span>
                </div>

                {/* Enhanced calculation display */}
                <details className="sm:block">
                  <summary className="text-xs text-blue-700 cursor-pointer sm:hidden">
                    <strong>How calculated</strong>
                  </summary>
                  <div className="rounded-lg bg-blue-50 p-2 border border-blue-200 mt-1 sm:mt-0">
                    <p className="text-xs text-blue-700">
                      <strong className="hidden sm:inline">How calculated:</strong> {metric.calculation}
                    </p>
                  </div>
                </details>

                {metric.deadline && (
                  <div className="text-xs text-[#6B7280]">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    Deadline: {new Date(metric.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            )
          })}

          {Object.keys(metrics).length === 0 && (
            <div className="text-center py-6 sm:py-8">
              <TrendingUp className="mx-auto h-10 w-10 text-[#D1D5DB] mb-3 sm:h-12 sm:w-12 sm:mb-4" />
              <h3 className="mb-2 font-medium text-sm sm:text-base">No metrics yet</h3>
              <p className="text-xs text-[#6B7280] mb-3 sm:text-sm sm:mb-4">
                Add tasks or create custom metrics to track your progress!
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={loadAISuggestions} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white">
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Get AI Suggestions
                </Button>
                <Button onClick={() => setOpenManualMetric(true)} className="text-white bg-[#28A745] hover:bg-[#23923d]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Metric
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Values in Action */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Users className="h-4 w-4 text-[#28A745] sm:h-5 sm:w-5" />
            Your Values in Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <ValueCard
              title="AI-Powered Insights"
              description="Get personalized metric suggestions based on your mission and onboarding responses"
              examples={["Smart recommendations", "Mission-aligned metrics", "Actionable insights"]}
            />
            <ValueCard
              title="Full Control"
              description="Edit, delete, and customize any metric to match your evolving needs"
              examples={["Edit targets", "Delete metrics", "Custom tracking"]}
            />
            <ValueCard
              title="Transparency"
              description="All metrics show clear calculations - no mysterious multipliers or arbitrary numbers"
              examples={["Clear methodology", "Realistic targets", "Manual entry options"]}
            />
            <ValueCard
              title="Authentic Progress"
              description="Track what actually matters to your mission, not vanity metrics"
              examples={["Task completion rates", "Alignment focus", "Personal goals"]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ManualMetricDialog open={openManualMetric} onOpenChange={setOpenManualMetric} onMetricCreated={loadData} />

      <MetricUpdateDialog
        open={openUpdateMetric}
        onOpenChange={setOpenUpdateMetric}
        metric={selectedMetric}
        onMetricUpdated={loadData}
      />

      <FounderTrackingDialog open={openFounderDialog} onOpenChange={setOpenFounderDialog} onFounderAdded={loadData} />

      <WorkSessionDialog open={openWorkSession} onOpenChange={setOpenWorkSession} onSessionAdded={loadData} />

      {/* AI Suggestions Dialog */}
      <Dialog open={openAISuggestions} onOpenChange={setOpenAISuggestions}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              AI Metric Suggestions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{suggestion.name}</h4>
                    <p className="text-xs text-[#6B7280] mb-2">{suggestion.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">{suggestion.category}</Badge>
                      <span>Target: {suggestion.target} {suggestion.unit}</span>
                    </div>
                    {suggestion.reasoning && (
                      <p className="text-xs text-blue-700 mt-2 italic">{suggestion.reasoning}</p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      // Auto-fill the manual metric dialog with this suggestion
                      setOpenAISuggestions(false)
                      setOpenManualMetric(true)
                    }}
                    className="text-white bg-[#28A745] hover:bg-[#23923d]"
                  >
                    Add This
                  </Button>
                </div>
              </div>
            ))}
            {aiSuggestions.length === 0 && (
              <div className="text-center py-6 text-[#6B7280]">
                <Lightbulb className="mx-auto h-8 w-8 mb-2 text-[#D1D5DB]" />
                <p>No suggestions available. Complete onboarding to get personalized recommendations.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Target Dialog */}
      <Dialog open={openEditTarget} onOpenChange={setOpenEditTarget}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              Edit Target: {editingMetric?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-target">New Target Value</Label>
              <Input
                id="new-target"
                type="number"
                defaultValue={editingMetric?.target}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTargetUpdate(Number(e.currentTarget.value))
                  }
                }}
                min="1"
              />
              <p className="text-xs text-[#6B7280]">
                Current: {editingMetric?.current} {editingMetric?.unit}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEditTarget(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const input = document.getElementById("new-target") as HTMLInputElement
                  if (input) {
                    handleTargetUpdate(Number(input.value))
                  }
                }}
                className="flex-1 text-white bg-blue-600 hover:bg-blue-700"
              >
                Update Target
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ValueCard({
  title,
  description,
  examples,
}: {
  title: string
  description: string
  examples: string[]
}) {
  return (
    <div className="rounded-lg border p-3 sm:p-4">
      <h3 className="font-medium text-sm mb-2">{title}</h3>
      <p className="text-xs text-[#6B7280] mb-2 sm:mb-3 leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-1">
        {examples.map((example, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {example}
          </Badge>
        ))}
      </div>
    </div>
  )
}