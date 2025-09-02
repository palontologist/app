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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, Plus, CheckCircle, Calendar, Trash2, StickyNote, Edit } from "lucide-react"
import { addGoalNote, getGoalNotes, getGoalContributingTasks, addGoalActivity, getGoalActivities, completeGoalActivity } from "@/app/actions/goals"
import { deleteGoal, markGoalComplete } from "@/app/actions/goals"
import { incrementGoalProgress, generateDashboardSummary } from "@/app/actions/analytics"
import type { Goal } from "@/lib/types"

type EnhancedGoalManagementProps = {
  goal: Goal
  onGoalUpdated?: () => void
}

export default function EnhancedGoalManagement({ goal, onGoalUpdated }: EnhancedGoalManagementProps) {
  const [activities, setActivities] = React.useState<any[]>([])
  const [notes, setNotes] = React.useState<any[]>([])
  const [contributingTasks, setContributingTasks] = React.useState<any[]>([])
  const [openDialog, setOpenDialog] = React.useState(false)
  const [openAddActivity, setOpenAddActivity] = React.useState(false)
  const [openAddNote, setOpenAddNote] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (openDialog) {
      loadGoalData()
    }
  }, [openDialog])

  const loadGoalData = async () => {
    const [activitiesResult, notesResult, tasksResult] = await Promise.all([
      getGoalActivities(goal.id),
      getGoalNotes(),
      getGoalContributingTasks(goal.id),
    ])

    if (activitiesResult.success) setActivities(activitiesResult.activities)
    if (notesResult.success) setNotes(notesResult.notes)
    if (tasksResult.success) setContributingTasks(tasksResult.tasks)
  }

  const handleAddActivity = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const result = await addGoalActivity(goal.id, formData)
      if (result.success) {
        setOpenAddActivity(false)
        loadGoalData()
        onGoalUpdated?.()
      }
    } catch (error) {
      console.error("Failed to add activity:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const result = await addGoalNote()
      if (result.success) {
        setOpenAddNote(false)
        loadGoalData()
      }
    } catch (error) {
      console.error("Failed to add note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteActivity = async (activityId: number) => {
    const result = await completeGoalActivity(activityId)
    if (result.success) {
      loadGoalData()
      onGoalUpdated?.()
    }
  }

  const handleDeleteGoal = async () => {
    console.log("Deleting goal:", goal.id)
    try {
      const result = await deleteGoal(goal.id)
      console.log("Delete goal result:", result)
      if (result.success) {
        setOpenDialog(false)
        onGoalUpdated?.()
      } else {
        console.error("Failed to delete goal:", result.error)
      }
    } catch (error) {
      console.error("Error deleting goal:", error)
    }
  }

  const handleMarkComplete = async () => {
    console.log("Marking goal complete:", goal.id)
    try {
      const result = await markGoalComplete(goal.id)
      console.log("Mark complete result:", result)
      if (result.success) {
        onGoalUpdated?.()
        // Refresh dialog content if dialog is open
        if (openDialog) {
          loadGoalData()
        }
      } else {
        console.error("Failed to mark goal complete:", result.error)
      }
    } catch (error) {
      console.error("Error marking goal complete:", error)
    }
  }

  const handleIncrementProgress = async (delta: number) => {
    const result = await incrementGoalProgress(goal.id, delta)
    if (result.success) {
      onGoalUpdated?.()
      // Update local state optimistically for immediate UI feedback
      if (openDialog) {
        loadGoalData()
      }
      try { await generateDashboardSummary() } catch {}
    }
  }

  const currentVal = goal.current_value ?? 0
  const targetVal = goal.target_value ?? 0
  const progress = targetVal ? (currentVal / targetVal) * 100 : 0
  // For goals without targets, consider complete if currentValue > 0
  // For goals with targets, consider complete if currentValue >= targetValue
  const isCompleted = targetVal ? currentVal >= targetVal : currentVal > 0

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
            {/* Quick action buttons */}
            {!isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkComplete}
                className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                title="Mark Goal Complete"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteGoal}
              className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
              title="Delete Goal"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-[#28A745] border-[#28A745] bg-transparent">
                  <Edit className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#28A745]" />
                    {goal.title}
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="activities" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="activities">Activities</TabsTrigger>
                    <TabsTrigger value="tasks">Contributing Tasks</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                  </TabsList>

                  {/* Activities Tab */}
                  <TabsContent value="activities" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Goal Activities</h3>
                      <Dialog open={openAddActivity} onOpenChange={setOpenAddActivity}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="text-white bg-[#28A745] hover:bg-[#23923d]">
                            <Plus className="mr-1 h-3 w-3" />
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
                                placeholder="e.g., Build user authentication system"
                                required
                                disabled={isLoading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="activity-description">Description</Label>
                              <Textarea
                                id="activity-description"
                                name="description"
                                placeholder="What needs to be done? Include specific requirements..."
                                rows={3}
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

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {activities.length > 0 ? (
                        activities.map((activity) => (
                          <div key={activity.id} className="flex items-start justify-between p-3 rounded border">
                            <div className="flex-1">
                              <div
                                className={`font-medium text-sm ${activity.completed ? "line-through text-green-600" : ""}`}
                              >
                                {activity.title}
                              </div>
                              {activity.description && (
                                <div className="text-xs text-[#6B7280] mt-1">{activity.description}</div>
                              )}
                              <div className="text-xs text-[#6B7280] mt-1">
                                Progress value: +{activity.progress_value}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {activity.completed ? (
                                <Badge className="bg-green-600 text-white text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Done
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteActivity(activity.id)}
                                  className="text-white bg-[#28A745] hover:bg-[#23923d] text-xs h-6"
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-[#6B7280] py-6">
                          No activities yet. Add specific steps to track progress.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Contributing Tasks Tab */}
                  <TabsContent value="tasks" className="space-y-4">
                    <h3 className="font-medium">Tasks That Contributed to This Goal</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {contributingTasks.length > 0 ? (
                        contributingTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start justify-between p-3 rounded border bg-[#28A745]/5"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-xs text-[#6B7280] mt-1">{task.description}</div>
                              )}
                              <div className="text-xs text-[#6B7280] mt-1">
                                Completed: {new Date(task.completed_at).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge className="bg-[#28A745] text-white text-xs">
                              +{task.progress_contribution || 1}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-[#6B7280] py-6">
                          No tasks have contributed to this goal yet. Complete tasks related to "
                          {(goal.title || '').toLowerCase()}" to see them here.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Notes Tab */}
                  <TabsContent value="notes" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Goal Notes</h3>
                      <Dialog open={openAddNote} onOpenChange={setOpenAddNote}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#28A745] border-[#28A745] bg-transparent"
                          >
                            <StickyNote className="mr-1 h-3 w-3" />
                            Add Note
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Goal Note</DialogTitle>
                          </DialogHeader>
                          <form action={handleAddNote} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="note-title">Note Title (Optional)</Label>
                              <Input
                                id="note-title"
                                name="title"
                                placeholder="e.g., Progress update, Blocker identified"
                                disabled={isLoading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="note-content">Note Content</Label>
                              <Textarea
                                id="note-content"
                                name="content"
                                placeholder="What's happening with this goal? Any insights, blockers, or progress updates..."
                                rows={4}
                                required
                                disabled={isLoading}
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full text-white bg-[#28A745] hover:bg-[#23923d]"
                              disabled={isLoading}
                            >
                              {isLoading ? "Adding..." : "Add Note"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {notes.length > 0 ? (
                        notes.map((note) => (
                          <div key={note.id} className="p-3 rounded border bg-yellow-50">
                            {note.title && <div className="font-medium text-sm mb-1">{note.title}</div>}
                            <div className="text-sm text-[#374151] mb-2">{note.content}</div>
                            <div className="text-xs text-[#6B7280]">
                              {new Date(note.created_at).toLocaleDateString()} at{" "}
                              {new Date(note.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-[#6B7280] py-6">
                          No notes yet. Add notes to track insights, blockers, or progress updates.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Insights Tab */}
                  <TabsContent value="insights" className="space-y-4">
                    <h3 className="font-medium">Goal Insights</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded border bg-blue-50">
                          <div className="text-lg font-bold text-blue-700">
                            {activities.filter((a) => a.completed).length}
                          </div>
                          <div className="text-xs text-blue-600">Activities Completed</div>
                        </div>
                        <div className="p-3 rounded border bg-green-50">
                          <div className="text-lg font-bold text-green-700">{contributingTasks.length}</div>
                          <div className="text-xs text-green-600">Tasks Contributed</div>
                        </div>
                      </div>

                      <div className="p-3 rounded border bg-[#28A745]/5">
                        <h4 className="font-medium text-sm mb-2">Progress Breakdown</h4>
                        <div className="text-xs text-[#6B7280] space-y-1">
                          <div>
                            • Current: {currentVal} / {targetVal} {goal.unit || ''}
                          </div>
                          <div>• Progress: {progress.toFixed(1)}%</div>
                          <div>
                            • Remaining: {Math.max((targetVal || 0) - currentVal, 0)} {goal.unit || ''}
                          </div>
                          {goal.deadline && <div>• Deadline: {new Date(goal.deadline).toLocaleDateString()}</div>}
                        </div>
                      </div>

                      {notes.length > 0 && (
                        <div className="p-3 rounded border bg-yellow-50">
                          <h4 className="font-medium text-sm mb-2">Latest Note</h4>
                          <div className="text-xs text-[#374151]">
                            {notes[0].content.substring(0, 100)}
                            {notes[0].content.length > 100 ? "..." : ""}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="destructive" size="sm" onClick={handleDeleteGoal}>
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete Goal
                  </Button>
                  <div className="flex gap-2">
                    {!isCompleted && goal.target_value != null && (
                      <Button size="sm" className="bg-[#28A745] text-white hover:bg-[#23923d]" onClick={handleMarkComplete}>
                        Mark Complete
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <div className="text-sm font-semibold">
              {goal.target_value != null ? (
                `${currentVal.toLocaleString()} / ${goal.target_value.toLocaleString()}`
              ) : (
                isCompleted ? "✓ Complete" : "◯ Pending"
              )}
            </div>
            <div className="text-xs text-[#6B7280]">{goal.unit || "goal"}</div>
          </div>
          {/* Quick increment buttons - only show for numeric goals that aren't complete */}
          {!isCompleted && goal.target_value != null && goal.target_value > 1 && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline" 
                className="h-6 px-2 text-xs text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white"
                onClick={() => handleIncrementProgress(1)}
              >
                +1
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white"
                onClick={() => handleIncrementProgress(5)}
              >
                +5
              </Button>
            </div>
          )}
        </div>
        {goal.target_value != null ? (
          <Progress value={Math.min(progress, 100)} className="h-2" />
        ) : (
          <div className={`h-2 rounded-full ${isCompleted ? 'bg-green-200' : 'bg-gray-200'}`}>
            <div className={`h-full rounded-full transition-all ${isCompleted ? 'w-full bg-green-600' : 'w-0'}`}></div>
          </div>
        )}
        <div className="flex justify-between text-xs text-[#6B7280]">
          <span>
            {goal.target_value != null ? (
              `${progress.toFixed(1)}% complete`
            ) : (
              isCompleted ? "Complete" : "In Progress"
            )}
          </span>
          {goal.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(goal.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-[#6B7280]">
          {activities.length > 0 && (
            <span>
              {activities.filter((a) => a.completed).length}/{activities.length} activities
            </span>
          )}
          {contributingTasks.length > 0 && <span>{contributingTasks.length} tasks contributed</span>}
          {notes.length > 0 && <span>{notes.length} notes</span>}
        </div>
      </CardContent>
    </Card>
  )
}
