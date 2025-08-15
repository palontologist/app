"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type AddTaskDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function AddTaskDialog({ open = false, onOpenChange }: AddTaskDialogProps) {
  const [taskName, setTaskName] = React.useState("")
  const [alignment, setAlignment] = React.useState<"direct" | "indirect" | "distraction">("direct")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>Capture an action and rate its alignment.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="task-name">Task Name</Label>
            <Input
              id="task-name"
              placeholder="e.g., Ship investor update"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-medium">How does this align with your North Star?</div>
            <RadioGroup
              value={alignment}
              onValueChange={(v) => setAlignment(v as typeof alignment)}
              className="grid gap-3"
            >
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label htmlFor="opt-direct" className="cursor-pointer">
                    Directly Contributes
                  </Label>
                  <p className="text-xs text-muted-foreground">High alignment with your core mission.</p>
                </div>
                <RadioGroupItem id="opt-direct" value="direct" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label htmlFor="opt-indirect" className="cursor-pointer">
                    Necessary but Indirect
                  </Label>
                  <p className="text-xs text-muted-foreground">Supports progress, not the core itself.</p>
                </div>
                <RadioGroupItem id="opt-indirect" value="indirect" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label htmlFor="opt-distraction" className="cursor-pointer">
                    Potential Distraction
                  </Label>
                  <p className="text-xs text-muted-foreground">May not contribute meaningfully.</p>
                </div>
                <RadioGroupItem id="opt-distraction" value="distraction" />
              </div>
              <div className="rounded-lg bg-[#28A745]/5 p-3 border border-[#28A745]/20">
                <p className="text-xs text-[#28A745] font-medium mb-1">💡 Remember</p>
                <p className="text-xs text-[#6B7280]">
                  Every aligned action moves you closer to the world you want to create
                </p>
              </div>
            </RadioGroup>
          </div>

          <Button
            className="w-full text-white bg-[#28A745] hover:bg-[#23923d]"
            onClick={() => {
              // In a real app, save to server.
              onOpenChange?.(false)
            }}
          >
            Add Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
