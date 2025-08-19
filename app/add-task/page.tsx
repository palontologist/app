import { Inter } from "next/font/google"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as React from "react"
import { getGoals } from '@/app/actions/goals'
import AddTaskFormClient from './_add_task_form'

const inter = Inter({ subsets: ["latin"] })

export default async function AddTaskScreen() {
  const goalsRes = await getGoals()
  const goals = goalsRes.success ? goalsRes.goals : []

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

      <AddTaskFormClient goals={goals} />
    </main>
  )
}
