"use client"

import { Inter } from "next/font/google"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as React from "react"

const inter = Inter({ subsets: ["latin"] })

export default function AddTaskScreen() {
  const [taskName, setTaskName] = React.useState("")
  const [alignment, setAlignment] = React.useState<"direct" | "indirect" | "distraction">("direct")

  return (
    <main className={`${inter.className} mx-auto max-w-2xl px-4 pb-12 pt-6`}>
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-semibold">Add Task</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Action</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="task">Task Name</Label>
            <Input
              id="task"
              placeholder="e.g., Finalize pitch deck"
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
                  <Label htmlFor="direct" className="cursor-pointer">
                    Directly Contributes
                  </Label>
                  <p className="text-xs text-muted-foreground">High alignment with your core mission.</p>
                </div>
                <RadioGroupItem id="direct" value="direct" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label htmlFor="indirect" className="cursor-pointer">
                    Necessary but Indirect
                  </Label>
                  <p className="text-xs text-muted-foreground">Supports progress, not the core itself.</p>
                </div>
                <RadioGroupItem id="indirect" value="indirect" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label htmlFor="distraction" className="cursor-pointer">
                    Potential Distraction
                  </Label>
                  <p className="text-xs text-muted-foreground">May not contribute meaningfully.</p>
                </div>
                <RadioGroupItem id="distraction" value="distraction" />
              </div>
            </RadioGroup>
          </div>

          <Button className="w-full text-white bg-[#28A745] hover:bg-[#23923d]">Add Task</Button>
        </CardContent>
      </Card>
    </main>
  )
}
