"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import GoalsDialog from "@/components/goals-dialog"
import { Loader2, Target, CheckCircle2, Trash2, RefreshCw, CalendarDays, Plus } from "lucide-react"

type GoalModel = {
  id: number
  title: string
  description: string | null
  category: string | null
  type?: string | null
  current_value: number
  target_value: number | null
  unit: string | null
  alignment_score: number | null
  alignment_category: string | null
  deadline: string | null
  created_at: string
  updated_at: string
}

type GoalsPageProps = {
  initialGoals: GoalModel[]
}

function normalizeGoal(goal: any): GoalModel {
  const toISO = (value: unknown) => {
    if (!value) return null
    const date = new Date(value as string | number | Date)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  }

  return {
    id: Number(goal.id),
    title: goal.title ?? "Untitled Goal",
    description: goal.description ?? null,
    category: goal.category ?? null,
    type: goal.type ?? goal.goalType ?? null,
    current_value: Number(goal.current_value ?? goal.currentValue ?? 0),
    target_value:
      goal.target_value == null && goal.targetValue == null
        ? null
        : Number(goal.target_value ?? goal.targetValue ?? 0),
    unit: goal.unit ?? null,
    alignment_score: goal.alignment_score ?? goal.alignmentScore ?? null,
    alignment_category: goal.alignment_category ?? goal.alignmentCategory ?? null,
    deadline: toISO(goal.deadline),
    created_at: toISO(goal.created_at ?? goal.createdAt) ?? new Date().toISOString(),
    updated_at: toISO(goal.updated_at ?? goal.updatedAt) ?? new Date().toISOString(),
  }
}

export default function GoalsPage({ initialGoals }: GoalsPageProps) {
  const [goals, setGoals] = React.useState<GoalModel[]>(initialGoals)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [pendingGoalId, setPendingGoalId] = React.useState<number | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)
  const [progressDrafts, setProgressDrafts] = React.useState<Record<number, string>>(() => {
    const drafts: Record<number, string> = {}
    initialGoals.forEach((goal) => {
      drafts[goal.id] = goal.current_value.toString()
    })
    return drafts
  })

  const completedCount = React.useMemo(
    () => goals.filter((goal) => {
      if (goal.target_value == null) {
        return goal.current_value > 0
      }
      return goal.current_value >= goal.target_value
    }).length,
    [goals]
  )

  const refreshGoals = React.useCallback(async () => {
    setRefreshing(true)
    try {
      const { getGoals } = await import("@/app/actions/goals")
      const result = await getGoals()
      if (result.success) {
        const normalized = result.goals.map(normalizeGoal)
        setGoals(normalized)
        setProgressDrafts(() => {
          const drafts: Record<number, string> = {}
          normalized.forEach((goal) => {
            drafts[goal.id] = goal.current_value.toString()
          })
          return drafts
        })
      }
    } catch (error) {
      console.error("Failed to refresh goals:", error)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const handleGoalCreated = React.useCallback(async () => {
    setDialogOpen(false)
    await refreshGoals()
  }, [refreshGoals])

  const handleProgressSubmit = React.useCallback(
    async (goalId: number) => {
      const draft = progressDrafts[goalId]
      if (draft == null || draft.trim() === "") return
      const parsed = Number(draft)
      if (Number.isNaN(parsed)) return

      setPendingGoalId(goalId)
      try {
        const { updateGoalProgress } = await import("@/app/actions/goals")
        const result = await updateGoalProgress(goalId, parsed)
        if (result.success && result.goal) {
          const normalized = normalizeGoal(result.goal)
          setGoals((prev) => prev.map((goal) => (goal.id === goalId ? normalized : goal)))
          setProgressDrafts((prev) => ({ ...prev, [goalId]: normalized.current_value.toString() }))
        }
      } catch (error) {
        console.error("Failed to update goal progress:", error)
      } finally {
        setPendingGoalId(null)
      }
    },
    [progressDrafts]
  )

  const handleMarkComplete = React.useCallback(async (goalId: number) => {
    setPendingGoalId(goalId)
    try {
      const { markGoalComplete } = await import("@/app/actions/goals")
      const result = await markGoalComplete(goalId)
      if (result.success && result.goal) {
        const normalized = normalizeGoal(result.goal)
        setGoals((prev) => prev.map((goal) => (goal.id === goalId ? normalized : goal)))
        setProgressDrafts((prev) => ({ ...prev, [goalId]: normalized.current_value.toString() }))
      }
    } catch (error) {
      console.error("Failed to mark goal complete:", error)
    } finally {
      setPendingGoalId(null)
    }
  }, [])

  const handleDeleteGoal = React.useCallback(async (goalId: number) => {
    if (!window.confirm("Remove this goal?")) return
    setPendingGoalId(goalId)
    try {
      const { deleteGoal } = await import("@/app/actions/goals")
      const result = await deleteGoal(goalId)
      if (result.success) {
        setGoals((prev) => prev.filter((goal) => goal.id !== goalId))
        setProgressDrafts((prev) => {
          const { [goalId]: _removed, ...rest } = prev
          return rest
        })
      }
    } catch (error) {
      console.error("Failed to delete goal:", error)
    } finally {
      setPendingGoalId(null)
    }
  }, [])

  const inFlight = pendingGoalId !== null

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="mx-auto max-w-6xl px-6 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-6 w-6 text-[#28A745]" />
              Mission Goals
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track progress toward your north star and keep every goal mission-aligned.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-100"
              onClick={refreshGoals}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
            <Button className="bg-[#28A745] hover:bg-[#23923d] text-white" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-green-200">
            <CardContent className="py-5">
              <p className="text-sm text-gray-600">Goals in flight</p>
              <p className="text-3xl font-semibold text-gray-900">{goals.length}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="py-5">
              <p className="text-sm text-gray-600">Mission wins</p>
              <p className="text-3xl font-semibold text-blue-600">{completedCount}</p>
            </CardContent>
          </Card>
        </div>

        {goals.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-lg font-medium text-gray-700">No goals yet</p>
              <p className="text-sm text-gray-600">Create your first mission-aligned goal to start tracking progress.</p>
              <Button className="bg-[#28A745] hover:bg-[#23923d] text-white" onClick={() => setDialogOpen(true)}>
                Start a Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {goals.map((goal) => {
              const hasTarget = goal.target_value != null && goal.target_value > 0
              const percentage = hasTarget
                ? Math.min(100, Math.round((goal.current_value / (goal.target_value || 1)) * 100))
                : goal.current_value > 0
                ? 100
                : 0
              const alignmentLabel = goal.alignment_category
                ? goal.alignment_category.charAt(0).toUpperCase() + goal.alignment_category.slice(1)
                : "Unknown"

              return (
                <Card key={goal.id} className="shadow-sm">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg text-gray-900">{goal.title}</CardTitle>
                      <div className="flex flex-wrap gap-1">
                        {goal.type && (
                          <Badge variant="secondary" className="text-xs uppercase">{goal.type}</Badge>
                        )}
                        {goal.category && (
                          <Badge variant="outline" className="text-xs uppercase">{goal.category}</Badge>
                        )}
                      </div>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>Alignment: {alignmentLabel}</span>
                      {goal.deadline && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800">Progress</span>
                        <span className="text-gray-600">
                          {goal.current_value.toLocaleString()} / {goal.target_value?.toLocaleString() ?? "?"}{" "}
                          {goal.unit ?? "units"}
                        </span>
                      </div>
                      <Progress value={percentage} className="bg-gray-200" />
                      <span className="text-xs text-gray-500">{percentage}% complete</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min={0}
                          value={progressDrafts[goal.id] ?? ""}
                          onChange={(event) =>
                            setProgressDrafts((prev) => ({ ...prev, [goal.id]: event.target.value }))
                          }
                          className="flex-1"
                          placeholder="Update current value"
                          disabled={inFlight && pendingGoalId === goal.id}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleProgressSubmit(goal.id)}
                          disabled={(inFlight && pendingGoalId === goal.id) || !progressDrafts[goal.id]}
                        >
                          {inFlight && pendingGoalId === goal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Update"
                          )}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleMarkComplete(goal.id)}
                          disabled={inFlight && pendingGoalId === goal.id}
                        >
                          {inFlight && pendingGoalId === goal.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Mark complete
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteGoal(goal.id)}
                          disabled={inFlight && pendingGoalId === goal.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <GoalsDialog open={dialogOpen} onOpenChange={setDialogOpen} onGoalCreated={handleGoalCreated} />
    </div>
  )
}
