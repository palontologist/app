"use client"

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'

export default function AddTaskFormClient({ goals }: { goals: any[] }) {
  const [taskName, setTaskName] = React.useState('')
  const [alignment, setAlignment] = React.useState<'direct' | 'indirect' | 'distraction'>('direct')
  const [goalId, setGoalId] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('title', taskName)
      fd.append('alignmentCategory', alignment)
      if (goalId) fd.append('goalId', goalId)

      const res = await fetch('/add-task/submit', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Failed')
      } else {
        // navigate back to dashboard
        window.location.href = '/dashboard'
      }
    } catch (e: any) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Action</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="task">Task Name</Label>
            <Input id="task" placeholder="e.g., Finalize pitch deck" value={taskName} onChange={(e) => setTaskName(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal">Link to Goal (optional)</Label>
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className="rounded-md border p-2">
              <option value="">-- No Goal --</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-medium">How does this align with your North Star?</div>
            <RadioGroup value={alignment} onValueChange={(v) => setAlignment(v as any)} className="grid gap-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label htmlFor="direct" className="cursor-pointer">Directly Contributes</Label>
                  <p className="text-xs text-muted-foreground">High alignment with your core mission.</p>
                </div>
                <RadioGroupItem id="direct" value="direct" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label htmlFor="indirect" className="cursor-pointer">Necessary but Indirect</Label>
                  <p className="text-xs text-muted-foreground">Supports progress, not the core itself.</p>
                </div>
                <RadioGroupItem id="indirect" value="indirect" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label htmlFor="distraction" className="cursor-pointer">Potential Distraction</Label>
                  <p className="text-xs text-muted-foreground">May not contribute meaningfully.</p>
                </div>
                <RadioGroupItem id="distraction" value="distraction" />
              </div>
            </RadioGroup>
          </div>

          {error && <div className="text-red-600">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Adding...' : 'Add Task'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
