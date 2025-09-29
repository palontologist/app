"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTask } from "@/app/actions/tasks"
import { Loader2, Sparkles } from "lucide-react"

type SmartTaskDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onTaskCreated?: () => void
}

export default function SmartTaskDialog({ open = false, onOpenChange, onTaskCreated }: SmartTaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await createTask(formData)
      if (result.success) {
        // Add a small delay for better UX before closing
        setTimeout(() => {
          onOpenChange?.(false)
          onTaskCreated?.() // Call the callback to refresh data and show success animation
        }, 500)
      }
    } catch (error) {
      console.error("Failed to create task:", error)
      setIsSubmitting(false) // Reset loading state on error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-in slide-in-from-bottom-4 duration-300 ease-out">
        <DialogHeader className="animate-in fade-in duration-500 delay-100">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#28A745] animate-pulse" />
            Add Smart Task
          </DialogTitle>
          <DialogDescription>
            AI will analyze alignment with your mission using Groq's advanced language model.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 animate-in fade-in duration-500 delay-200">
          <div className="grid gap-2 animate-in slide-in-from-left-2 duration-300 delay-300">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Ship investor update"
              required
              disabled={isSubmitting}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>
          <div className="grid gap-2 animate-in slide-in-from-left-2 duration-300 delay-400">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Additional context about this task..."
              rows={3}
              disabled={isSubmitting}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>
          <div className="grid gap-2 animate-in slide-in-from-left-2 duration-300 delay-500">
            <Label htmlFor="missionPillar">Mission Pillar (Optional)</Label>
            <Input
              id="missionPillar"
              name="missionPillar"
              placeholder="e.g., Customer Acquisition, Product Development"
              disabled={isSubmitting}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>
          <div className="grid gap-2 animate-in slide-in-from-left-2 duration-300 delay-600">
            <Label htmlFor="impactStatement">Impact Statement (Optional)</Label>
            <Textarea
              id="impactStatement"
              name="impactStatement"
              placeholder="This task will help by..."
              rows={2}
              disabled={isSubmitting}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>
          <div className="rounded-lg bg-[#28A745]/5 p-3 border border-[#28A745]/20 animate-in slide-in-from-bottom-2 duration-300 delay-700">
            <p className="text-xs text-[#28A745] font-medium mb-1">🚀 Groq-Powered Analysis</p>
            <p className="text-xs text-[#6B7280]">
              Advanced AI will evaluate this task's alignment with your mission and provide personalized insights.
            </p>
          </div>
          <Button
            type="submit"
            className="w-full text-white bg-[#28A745] hover:bg-[#23923d] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-in slide-in-from-bottom-2 duration-300 delay-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              "Create Task"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
