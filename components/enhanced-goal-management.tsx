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
import {
  addGoalNote,
  getGoalNotes,
  getGoalContributingTasks,
  addGoalActivity,
  getGoalActivities,
  completeGoalActivity,
} from "@/app/actions/goals"
import { deleteGoal } from "@/app/actions/goals"
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
      getGoalNotes(goal.id),
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
      const result = await addGoalNote(goal.id, formData)
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
    const result = await deleteGoal(goal.id)
    if (result.success) {
      setOpenDialog(false)
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
                          {goal.title.toLowerCase()}" to see them here.
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
                            • Current: {goal.current_value} / {goal.target_value} {goal.unit}
                          </div>
                          <div>• Progress: {progress.toFixed(1)}%</div>
                          <div>
                            • Remaining: {(goal.target_value || 0) - goal.current_value} {goal.unit}
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
                  <Button variant="outline" onClick={() => setOpenDialog(false)}>
                    Close
                  </Button>
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
