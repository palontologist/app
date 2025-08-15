"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addWorkSession } from "@/app/actions/work-sessions"
import { getTasks } from "@/app/actions/tasks"
import { Clock, Loader2 } from "lucide-react"
import type { Task } from "@/lib/types"

type WorkSessionDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSessionAdded?: () => void
}

export default function WorkSessionDialog({ open = false, onOpenChange, onSessionAdded }: WorkSessionDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [tasks, setTasks] = React.useState<Task[]>([])

  React.useEffect(() => {
    if (open) {
      loadTasks()
    }
  }, [open])

  const loadTasks = async () => {
    const result = await getTasks()
    if (result.success) {
      setTasks(result.tasks)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await addWorkSession(formData)
      if (result.success) {
        onOpenChange?.(false)
        onSessionAdded?.()
      }
    } catch (error) {
      console.error("Failed to add work session:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#28A745]" />
            Log Work Session
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              name="durationMinutes"
              type="number"
              placeholder="60"
              min="1"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#6B7280]">How many minutes did you work?</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task">Related Task (Optional)</Label>
            <Select name="taskId" disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific task</SelectItem>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id.toString()}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="alignment">Alignment Level</Label>
            <Select name="alignmentCategory" defaultValue="medium" disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High - Directly advances mission</SelectItem>
                <SelectItem value="medium">Medium - Supports mission</SelectItem>
                <SelectItem value="low">Low - Necessary but indirect</SelectItem>
                <SelectItem value="distraction">Distraction - Not mission-aligned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="session-notes">Notes (Optional)</Label>
            <Textarea
              id="session-notes"
              name="notes"
              placeholder="What did you accomplish? Any insights?"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="rounded-lg bg-[#28A745]/5 p-3 border border-[#28A745]/20">
            <p className="text-xs text-[#28A745] font-medium mb-1">⏱️ Time Tracking</p>
            <p className="text-xs text-[#6B7280]">
              High and medium alignment work will count toward your "Mission-Aligned Hours" metric.
            </p>
          </div>

          <Button type="submit" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging Session...
              </>
            ) : (
              "Log Work Session"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
