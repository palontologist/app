"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      if (result && result.success) {
        setTimeout(() => {
          setIsSubmitting(false)
          onOpenChange?.(false)
          onTaskCreated?.()
        }, 150)
        return
      }
      setIsSubmitting(false)
    } catch (error) {
      console.error("Failed to create task:", error)
      setIsSubmitting(false)
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
            Capture the essentials of your next step and keep momentum toward your mission.
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
          <Button
            type="submit"
            className="w-full text-white bg-[#28A745] hover:bg-[#23923d] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-in slide-in-from-bottom-2 duration-300 delay-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating task...
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
