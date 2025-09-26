"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Play, Pause, Clock, Trash2, StickyNote, TrendingUp, CheckCircle } from "lucide-react"
import { startTaskTimer, stopTaskTimer, getActiveTimer, addTaskNote, getTaskNotes } from "@/app/actions/tasks"
import { toggleTaskCompletion, deleteTask } from "@/app/actions/tasks"
import AIReasoningToggle from "@/components/ai-reasoning-toggle"
import type { Task } from "@/lib/types"

type TaskWithTimerProps = {
  task: Task
  onTaskUpdated?: () => void
}

export default function TaskWithTimer({ task, onTaskUpdated }: TaskWithTimerProps) {
  const [isRunning, setIsRunning] = React.useState(false)
  const [elapsedTime, setElapsedTime] = React.useState(0)
  const [startTime, setStartTime] = React.useState<Date | null>(null)
  const [totalTimeSpent, setTotalTimeSpent] = React.useState(0)
  const [notes, setNotes] = React.useState<any[]>([])
  const [openNotes, setOpenNotes] = React.useState(false)
  const [openAddNote, setOpenAddNote] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, startTime])

  React.useEffect(() => {
    checkActiveTimer()
    loadTaskData()
  }, [task.id])

  const checkActiveTimer = async () => {
    try {
      const result = await getActiveTimer(task.id)
      if (result && result.success && result.timer) {
        setIsRunning(true)
        setStartTime(new Date(result.timer.start_time))
      }
    } catch (error) {
      console.error("Failed to check active timer:", error)
    }
  }

  const loadTaskData = async () => {
    try {
      const notesResult = await getTaskNotes(task.id)
      if (notesResult && notesResult.success) {
        setNotes(notesResult.notes)
        // Calculate total time from notes
        const timeNotes = notesResult.notes.filter((n: any) => n.time_logged > 0)
        const total = timeNotes.reduce((sum: number, note: any) => sum + note.time_logged, 0)
        setTotalTimeSpent(total)
      }
    } catch (error) {
      console.error("Failed to load task data:", error)
    }
  }

  const handleStart = async () => {
    try {
      const result = await startTaskTimer(task.id)
      if (result && result.success) {
        setIsRunning(true)
        setStartTime(new Date())
        setElapsedTime(0)
      }
    } catch (error) {
      console.error("Failed to start timer:", error)
    }
  }

  const handlePause = async () => {
    if (startTime) {
      try {
        const minutes = Math.floor(elapsedTime / 60)
        const result = await stopTaskTimer(task.id, minutes)
        if (result && result.success) {
          setIsRunning(false)
          setStartTime(null)
          setElapsedTime(0)
          setTotalTimeSpent((prev) => prev + minutes)
          onTaskUpdated?.()
        }
      } catch (error) {
        console.error("Failed to pause timer:", error)
      }
    }
  }

  const handleComplete = async () => {
    try {
      if (startTime) {
        const minutes = Math.floor(elapsedTime / 60)
        const result = await stopTaskTimer(task.id, minutes, true)
        if (result && result.success) {
          setIsRunning(false)
          setStartTime(null)
          setElapsedTime(0)
          setTotalTimeSpent((prev) => prev + minutes)
          onTaskUpdated?.()
        }
      } else {
        // Just toggle completion without timer
        const result = await toggleTaskCompletion(task.id)
        if (result && result.success) {
          onTaskUpdated?.()
        }
      }
    } catch (error) {
      console.error("Failed to complete task:", error)
    }
  }

  const handleAddNote = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const result = await addTaskNote(task.id, formData)
      if (result.success) {
        setOpenAddNote(false)
        loadTaskData()
      }
    } catch (error) {
      console.error("Failed to add note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTask = async () => {
    try {
      const result = await deleteTask(task.id)
      if (result && result.success) {
        onTaskUpdated?.()
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const getAlignmentColor = (category: string) => {
    switch (category) {
      case "high":
        return "#28A745"
      case "medium":
        return "#FFC107"
      case "low":
        return "#FD7E14"
      case "distraction":
        return "#DC3545"
      default:
        return "#6C757D"
    }
  }

  const parseAIAnalysis = (analysisData: string | null) => {
    if (!analysisData) return null

    try {
      return JSON.parse(analysisData)
    } catch (error) {
      // If it's not valid JSON, treat it as plain text analysis
      return {
        analysis: analysisData,
        suggestions: null,
        ai_reasoning: null,
      }
    }
  }

  const aiAnalysis = parseAIAnalysis(task.ai_analysis)

  return (
    <Card className={`${isRunning ? "border-[#28A745] bg-[#28A745]/5" : ""} ${task.completed ? "bg-gray-50" : ""}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Task Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={handleComplete}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-sm font-medium cursor-pointer ${
                    task.completed ? "line-through text-[#9CA3AF]" : "text-[#111827]"
                  }`}
                >
                  {task.title}
                </label>

                {/* Mission Pillar Badge */}
                {task.mission_pillar && (
                  <Badge variant="outline" className="text-xs mt-1 mr-2 bg-[#28A745]/10 text-[#28A745] border-[#28A745]/30">
                    📍 {task.mission_pillar}
                  </Badge>
                )}

                {task.description && <p className="text-xs text-[#6B7280] mt-1">{task.description}</p>}

                {/* Impact Statement */}
                {task.impact_statement && (
                  <div className="mt-2 p-2 rounded-md bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-1">
                      <TrendingUp className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 font-medium">{task.impact_statement}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${getAlignmentColor(task.alignment_category || "medium")}20`,
                  color: getAlignmentColor(task.alignment_category || "medium"),
                }}
              >
                {task.alignment_score}%
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteTask}
                className="h-6 w-6 p-0 text-[#6B7280] hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Timer Section */}
          {!task.completed && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-[#28A745]" />
                <div>
                  {isRunning ? (
                    <div className="font-mono text-lg font-bold text-[#28A745]">{formatTime(elapsedTime)}</div>
                  ) : (
                    <div className="text-sm text-[#6B7280]">
                      {totalTimeSpent > 0 ? `${totalTimeSpent}m logged` : "No time logged"}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isRunning ? (
                  <Button size="sm" onClick={handleStart} className="text-white bg-[#28A745] hover:bg-[#23923d]">
                    <Play className="mr-1 h-3 w-3" />
                    Start
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePause}
                      className="text-[#28A745] border-[#28A745] bg-transparent"
                    >
                      <Pause className="mr-1 h-3 w-3" />
                      Pause
                    </Button>
                    <Button size="sm" onClick={handleComplete} className="text-white bg-[#28A745] hover:bg-[#23923d]">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Complete
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="flex items-center justify-between">
            <Dialog open={openNotes} onOpenChange={setOpenNotes}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-[#6B7280] hover:text-[#28A745]">
                  <StickyNote className="mr-1 h-3 w-3" />
                  {notes.length > 0 ? `${notes.length} notes` : "Add note"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Task Notes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {notes.length > 0 ? (
                      notes.map((note) => (
                        <div key={note.id} className="p-2 rounded border bg-yellow-50">
                          <div className="text-sm text-[#374151]">{note.content}</div>
                          <div className="text-xs text-[#6B7280] mt-1 flex items-center justify-between">
                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            {note.time_logged > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {note.time_logged}m logged
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-[#6B7280] py-4">
                        No notes yet. Add notes to track progress and insights.
                      </div>
                    )}
                  </div>

                  <Dialog open={openAddNote} onOpenChange={setOpenAddNote}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]">
                        <StickyNote className="mr-2 h-4 w-4" />
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Task Note</DialogTitle>
                      </DialogHeader>
                      <form action={handleAddNote} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="note-content">Note</Label>
                          <Textarea
                            id="note-content"
                            name="content"
                            placeholder="Progress update, blocker, insight, or any thoughts about this task..."
                            rows={3}
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
              </DialogContent>
            </Dialog>

            {totalTimeSpent > 0 && (
              <div className="text-xs text-[#6B7280] flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Total: {totalTimeSpent}m
              </div>
            )}
          </div>

          {/* AI Analysis */}
          {aiAnalysis && (
            <div className="rounded-md bg-[#28A745]/5 p-3 border border-[#28A745]/20">
              <p className="text-xs text-[#28A745] font-medium mb-1">🚀 AI Insight</p>
              <p className="text-xs text-[#6B7280]">{aiAnalysis.analysis}</p>
              {aiAnalysis.suggestions && (
                <p className="text-xs text-[#6B7280] mt-1">
                  <strong>Suggestion:</strong> {aiAnalysis.suggestions}
                </p>
              )}
              {aiAnalysis.ai_reasoning && (
                <AIReasoningToggle reasoning={aiAnalysis.ai_reasoning} title="View AI Reasoning" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
