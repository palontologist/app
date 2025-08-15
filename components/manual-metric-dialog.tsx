"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createManualMetric } from "@/app/actions/analytics"
import { TrendingUp, Loader2 } from "lucide-react"

type ManualMetricDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onMetricCreated?: () => void
}

export default function ManualMetricDialog({ open = false, onOpenChange, onMetricCreated }: ManualMetricDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await createManualMetric(formData)
      if (result.success) {
        onOpenChange?.(false)
        onMetricCreated?.()
      }
    } catch (error) {
      console.error("Failed to create metric:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#28A745]" />
            Add Custom Metric
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="metric-name">Metric Name</Label>
            <Input
              id="metric-name"
              name="name"
              placeholder="e.g., Customers Acquired, Revenue Generated"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="metric-description">Description</Label>
            <Textarea
              id="metric-description"
              name="description"
              placeholder="What does this metric track?"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="current-value">Current Value</Label>
              <Input
                id="current-value"
                name="currentValue"
                type="number"
                placeholder="0"
                defaultValue="0"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target-value">Target Value</Label>
              <Input id="target-value" name="targetValue" type="number" placeholder="100" disabled={isSubmitting} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="unit">Unit</Label>
            <Select name="unit" disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="dollars">Dollars</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="signups">Sign-ups</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="meetings">Meetings</SelectItem>
                <SelectItem value="features">Features</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="percent">Percent</SelectItem>
                <SelectItem value="units">Units</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Examples:</strong> "Customers Acquired" (target: 100), "Monthly Revenue" (target: 10000), "User
              Sign-ups" (target: 500)
            </p>
          </div>

          <Button type="submit" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Metric...
              </>
            ) : (
              "Create Metric"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
