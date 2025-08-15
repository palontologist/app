"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateManualMetric } from "@/app/actions/analytics"
import { updateGoalProgress } from "@/app/actions/goals"
import { Edit, Loader2 } from "lucide-react"

type MetricUpdateDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  metric?: {
    id: number
    title?: string
    current: number
    target: number
    unit: string
    category: string
  }
  onMetricUpdated?: () => void
}

export default function MetricUpdateDialog({
  open = false,
  onOpenChange,
  metric,
  onMetricUpdated,
}: MetricUpdateDialogProps) {
  const [newValue, setNewValue] = React.useState(metric?.current || 0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (metric) {
      setNewValue(metric.current)
    }
  }, [metric])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!metric) return

    setIsSubmitting(true)
    try {
      let result
      if (metric.category === "goals") {
        result = await updateGoalProgress(metric.id, newValue)
      } else {
        result = await updateManualMetric(metric.id, newValue)
      }

      if (result.success) {
        onOpenChange?.(false)
        onMetricUpdated?.()
      }
    } catch (error) {
      console.error("Failed to update metric:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!metric) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-4 w-4 text-[#28A745]" />
            Update {metric.title || "Metric"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-value">New Value</Label>
            <Input
              id="new-value"
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(Number(e.target.value))}
              disabled={isSubmitting}
              min="0"
            />
            <p className="text-xs text-[#6B7280]">
              Current: {metric.current} {metric.unit} → Target: {metric.target} {metric.unit}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 text-white bg-[#28A745] hover:bg-[#23923d]" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
