"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createManualMetric } from "@/app/actions/analytics"
import { TrendingUp, Loader2, Lightbulb } from "lucide-react"

type ManualMetricDialogEnhancedProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onMetricCreated?: () => void
  prefilledData?: {
    name?: string
    description?: string
    target?: number
    unit?: string
    category?: string
  }
}

export default function ManualMetricDialogEnhanced({ 
  open = false, 
  onOpenChange, 
  onMetricCreated,
  prefilledData 
}: ManualMetricDialogEnhancedProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [currentValue, setCurrentValue] = React.useState(0)
  const [targetValue, setTargetValue] = React.useState(100)
  const [unit, setUnit] = React.useState("")
  const [category, setCategory] = React.useState("")

  // Pre-fill form when dialog opens with AI suggestion data
  React.useEffect(() => {
    if (open && prefilledData) {
      setName(prefilledData.name || "")
      setDescription(prefilledData.description || "")
      setTargetValue(prefilledData.target || 100)
      setUnit(prefilledData.unit || "")
      setCategory(prefilledData.category || "")
    } else if (open && !prefilledData) {
      // Reset form for manual entry
      setName("")
      setDescription("")
      setCurrentValue(0)
      setTargetValue(100)
      setUnit("")
      setCategory("")
    }
  }, [open, prefilledData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("description", description)
      formData.append("currentValue", currentValue.toString())
      formData.append("targetValue", targetValue.toString())
      formData.append("unit", unit)
      formData.append("category", category)
      
      const result = await createManualMetric(formData)
      if (result.success) {
        onOpenChange?.(false)
        onMetricCreated?.()
        // Reset form
        setName("")
        setDescription("")
        setCurrentValue(0)
        setTargetValue(100)
        setUnit("")
        setCategory("")
      } else {
        alert(result.error || "Failed to create metric")
      }
    } catch (error) {
      console.error("Failed to create metric:", error)
      alert("Failed to create metric")
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
            {prefilledData ? "Add AI Suggested Metric" : "Add Custom Metric"}
            {prefilledData && (
              <Lightbulb className="h-4 w-4 text-blue-600" />
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="metric-name">Metric Name</Label>
            <Input
              id="metric-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Discovery Calls, Features Shipped"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="metric-description">Description</Label>
            <Textarea
              id="metric-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this metric track and why is it important?"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="current-value">Current Value</Label>
              <Input
                id="current-value"
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                placeholder="0"
                disabled={isSubmitting}
                min="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target-value">Target Value</Label>
              <Input 
                id="target-value" 
                type="number" 
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                placeholder="100" 
                disabled={isSubmitting}
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calls">Calls</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="dollars">Dollars</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="signups">Sign-ups</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="meetings">Meetings</SelectItem>
                  <SelectItem value="features">Features</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="hours/week">Hours/Week</SelectItem>
                  <SelectItem value="tasks/week">Tasks/Week</SelectItem>
                  <SelectItem value="calls/week">Calls/Week</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mission">Mission</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="impact">Impact</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="alignment">Alignment</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {prefilledData && (
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <p className="text-xs text-blue-700">
                <Lightbulb className="inline h-3 w-3 mr-1" />
                <strong>AI Suggestion:</strong> This metric was recommended based on your mission and focus areas. You can modify any details before adding it.
              </p>
            </div>
          )}

          {!prefilledData && (
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Examples:</strong> "Customer Discovery Calls" (5 calls/week), "Features Shipped" (2 features/month), "Revenue Generated" ($10,000/month)
              </p>
            </div>
          )}

          <Button type="submit" className="w-full text-white bg-[#28A745] hover:bg-[#23923d]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Metric...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Create Metric
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}