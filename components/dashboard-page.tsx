"use client"

import * as React from "react"
import Link from "next/link"
import { Target, BarChart3, Plus, Lightbulb, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import CircularProgress from "@/components/circular-progress"
import AddTaskDialog from "@/components/add-task-dialog"

type Task = {
  id: string
  name: string
  alignment: "high" | "low" | "distraction"
  done?: boolean
}

const initialTasks: Task[] = [
  { id: "t1", name: "Outline next sprint goals", alignment: "high" },
  { id: "t2", name: "Investor outreach follow-up", alignment: "low" },
  { id: "t3", name: "Refactor onboarding flow", alignment: "high" },
  { id: "t4", name: "Random Slack catch-up", alignment: "distraction" },
  { id: "t5", name: "Bookkeeping review", alignment: "low" },
]

export default function DashboardPage() {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks)
  const [openAdd, setOpenAdd] = React.useState(false)
  const [northStar, setNorthStar] = React.useState("")

  React.useEffect(() => {
    const savedMission = localStorage.getItem("greta-mission")
    if (savedMission) {
      setNorthStar(savedMission)
    } else {
      setNorthStar("Empower 10,000 founders to ship mission-aligned work every day.")
    }
  }, [])

  function toggleDone(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:pt-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="font-semibold tracking-tight text-xl">greta</div>
        <nav className="flex items-center gap-3">
          <Link
            href="/impact"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Open Impact"
          >
            <Globe className="h-4 w-4" />
          </Link>
          <Link
            href="/brainstorm"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Open Brainstorm"
          >
            <Lightbulb className="h-4 w-4" />
          </Link>
          <Link
            href="/analytics"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Open Analytics"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      {/* North Star */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="h-4 w-4 text-[#28A745]" />
            North Star
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#111827]">{northStar}</p>
        </CardContent>
      </Card>

      {/* Alignment Score */}
      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <div className="text-sm text-[#6B7280]">Daily Alignment Score</div>
            <div className="mt-1 text-2xl font-semibold text-[#1A1A1A]">Today</div>
            <p className="mt-1 text-xs text-[#6B7280]">{"Based on completed tasks and their alignment impact."}</p>
          </div>
          <CircularProgress value={76} label="Aligned Today" indicatorColor="#28A745" />
        </CardContent>
      </Card>

      {/* Task List */}
      <section aria-labelledby="today-tasks-heading">
        <h2 id="today-tasks-heading" className="mb-3 text-sm font-medium text-[#374151]">
          Today&apos;s Tasks
        </h2>
        <ul className="grid gap-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={Boolean(task.done)}
                  onCheckedChange={() => toggleDone(task.id)}
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-sm ${task.done ? "line-through text-[#9CA3AF]" : "text-[#111827]"}`}
                >
                  {task.name}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <AlignmentDot alignment={task.alignment} />
                <span className="text-xs text-[#6B7280] capitalize">{labelFor(task.alignment)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* FAB */}
      <Button
        onClick={() => setOpenAdd(true)}
        aria-label="Add Task"
        className="fixed bottom-24 right-6 z-20 h-14 w-14 rounded-full bg-[#28A745] p-0 text-white shadow-lg hover:bg-[#23923d] sm:bottom-8"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddTaskDialog open={openAdd} onOpenChange={setOpenAdd} />
    </div>
  )
}

function labelFor(a: Task["alignment"]) {
  if (a === "high") return "High Alignment"
  if (a === "low") return "Low Alignment"
  return "Distraction"
}

function AlignmentDot({ alignment }: { alignment: Task["alignment"] }) {
  // Single accent color strategy:
  // - High: accent green
  // - Low: neutral gray
  // - Distraction: darker gray
  const color = alignment === "high" ? "#28A745" : alignment === "low" ? "#D1D5DB" : "#6B7280"
  return (
    <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
  )
}
