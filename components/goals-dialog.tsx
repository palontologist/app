"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createGoal } from "@/app/actions/goals"
import { Target, Loader2 } from "lucide-react"

type GoalsDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onGoalCreated?: () => void
}

export default function GoalsDialog({ open = false, onOpenChange, onGoalCreated }: GoalsDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await createGoal(formData)
      if (result.success) {
        onOpenChange?.(false)
        onGoalCreated?.()
      }
    } catch (error) {
      console.error("Failed to create goal:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#28A745]" />
            Create Goal
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="goal-title">Goal Title</Label>
            <Input id="goal-title" name="title" placeholder="e.g., Launch MVP" required disabled={isSubmitting} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-description">Description</Label>
            <Textarea
              id="goal-description"
              name="description"
              placeholder="What does success look like?"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="target-value">Target Number</Label>
              <Input id="target-value" name="targetValue" type="number" placeholder="100" disabled={isSubmitting} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Select name="unit" disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="people">People</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="dollars">Dollars</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="features">Features</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goalType">Goal Type</Label>
            <Select name="goalType" disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select name="category" disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="impact">Impact & Growth</SelectItem>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="personal">Personal Development</SelectItem>
                <SelectItem value="team">Team & Hiring</SelectItem>
                <SelectItem value="product">Product Development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deadline">Target Date (Optional)</Label>
            <Input id="deadline" name="deadline" type="date" disabled={isSubmitting} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="missionPillar">Mission Pillar (Optional)</Label>
            <Input
              id="missionPillar"
              name="missionPillar"
              placeholder="e.g., Customer Acquisition, Product Development, Team Building"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="impactStatement">Impact Statement (Optional)</Label>
            <Textarea
              id="impactStatement"
              name="impactStatement"
              placeholder="This goal will help by..."
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Goal...
              </>
            ) : (
              "Create Goal"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
