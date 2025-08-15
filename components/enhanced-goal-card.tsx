"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Target, Plus, CheckCircle, Calendar, Trash2, List } from "lucide-react"
import { addGoalActivity, getGoalActivities } from "@/app/actions/goals"
import { deleteGoal } from "@/app/actions/goals"
import type { Goal } from "@/lib/types"

type EnhancedGoalCardProps = {
  goal: Goal & { activities?: any[] }
  onGoalUpdated?: () => void
}

export default function EnhancedGoalCard({ goal, onGoalUpdated }: EnhancedGoalCardProps) {
  const [activities, setActivities] = React.useState<any[]>([])
  const [openActivities, setOpenActivities] = React.useState(false)
  const [openAddActivity, setOpenAddActivity] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (openActivities) {
      loadActivities()
    }
  }, [openActivities])

  const loadActivities = async () => {
    const result = await getGoalActivities(goal.id)
    if (result.success) {
      setActivities(result.activities)
    }
  }

  const handleAddActivity = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const result = await addGoalActivity(goal.id, formData)
      if (result.success) {
        setOpenAddActivity(false)
        loadActivities()
        onGoalUpdated?.()
      }
    } catch (error) {
      console.error("Failed to add activity:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGoal = async () => {
    const result = await deleteGoal(goal.id)
    if (result.success) {
      onGoalUpdated?.()
    }
  }

  const progress = goal.target_value ? (goal.current_value / goal.target_value) * 100 : 0
  const isCompleted = goal.current_value >= (goal.target_value || 1)

  return (
    <Card className={`border-l-4 ${isCompleted ? "border-l-green-600 bg-green-50" : "border-l-[#28A745]"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`flex items-center gap-2 text-base ${isCompleted ? "text-green-700" : ""}`}>
              {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
              <Target className="h-4 w-4 text-[#28A745]" />
              {goal.title}
            </CardTitle>
            <p className="text-xs text-[#6B7280] mt-1">{goal.description}</p>
          </div>
          <div className="flex items-center gap-1">
            <Dialog open={openActivities} onOpenChange={setOpenActivities}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <List className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Goal Activities</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-2 rounded border">
                          <div>
                            <div className="font-medium text-sm">{activity.title}</div>
                            {activity.description && (
                              <div className="text-xs text-[#6B7280]">{activity.description}</div>
                            )}
                          </div>
                          <Badge variant={activity.completed ? "default" : "secondary"} className="text-xs">
                            {activity.completed ? "Done" : "Pending"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-[#6B7280] py-4">
                        No activities yet. Add specific steps to track progress.
                      </div>
                    )}
                  </div>

                  <Dialog open={openAddActivity} onOpenChange={setOpenAddActivity}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Activity
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Goal Activity</DialogTitle>
                      </DialogHeader>
                      <form action={handleAddActivity} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="activity-title">Activity Title</Label>
                          <Input
                            id="activity-title"
                            name="title"
                            placeholder="e.g., Create user onboarding flow"
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="activity-description">Description (Optional)</Label>
                          <Textarea
                            id="activity-description"
                            name="description"
                            placeholder="What needs to be done?"
                            rows={2}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="activity-value">Progress Value</Label>
                          <Input
                            id="activity-value"
                            name="progressValue"
                            type="number"
                            placeholder="1"
                            defaultValue="1"
                            min="1"
                            disabled={isLoading}
                          />
                          <p className="text-xs text-[#6B7280]">
                            How much this activity contributes to the goal when completed
                          </p>
                        </div>
                        <Button
                          type="submit"
                          className="w-full text-white bg-[#28A745] hover:bg-[#23923d]"
                          disabled={isLoading}
                        >
                          {isLoading ? "Adding..." : "Add Activity"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="ghost" onClick={handleDeleteGoal} className="h-6 w-6 p-0 text-red-600">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <div className="text-sm font-semibold">
              {goal.current_value.toLocaleString()} / {goal.target_value?.toLocaleString()}
            </div>
            <div className="text-xs text-[#6B7280]">{goal.unit}</div>
          </div>
        </div>
        <Progress value={Math.min(progress, 100)} className="h-2" />
        <div className="flex justify-between text-xs text-[#6B7280]">
          <span>{progress.toFixed(1)}% complete</span>
          {goal.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(goal.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {activities.length > 0 && (
          <div className="text-xs text-[#6B7280]">
            {activities.filter((a) => a.completed).length} of {activities.length} activities completed
          </div>
        )}
      </CardContent>
    </Card>
  )
}
