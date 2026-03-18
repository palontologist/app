"use client"

import * as React from "react"
import { Plus, ChevronDown, ChevronRight, Check, Loader2, Trash2, Sparkles } from "lucide-react"
import { getGoals, createGoal, deleteGoal } from "@/app/actions/goals"
import { getTasks, toggleTaskCompletion, createTask } from "@/app/actions/tasks"
import { getValueSettings } from "@/app/actions/value-settings"
import { calculateTaskValue, formatDollars } from "@/lib/value"
import { AppShell } from "@/components/app-shell"

interface GoalRow {
  id: number
  title: string | null
  current_value: number | null
  target_value: number | null
  unit: string | null
  category: string | null
  alignment_category: string | null
  deadline: string | null
  created_at: string
}

interface TaskRow {
  id: number
  title: string | null
  goal_id: number | null
  alignment_score: number | null
  alignment_category: string | null
  completed: boolean | null
}

type MatrixQuadrant = "do" | "plan" | "delegate" | "drop"

function getQuadrant(goal: GoalRow): MatrixQuadrant {
  const cat = (goal.alignment_category || "medium").toLowerCase()
  const hasDeadline = !!goal.deadline
  if (cat === "high") return hasDeadline ? "do" : "plan"
  if (cat === "medium") return "plan"
  if (cat === "low") return "delegate"
  return "drop"
}

function GoalProgress({ current, target }: { current: number | null; target: number | null }) {
  if (target == null || target === 0) return null
  const pct = Math.min(100, Math.round(((current ?? 0) / target) * 100))
  const color = pct >= 80 ? "#16a34a" : pct >= 40 ? "#f59e0b" : "#ef4444"
  return (
    <div className="h-1 rounded-full bg-slate-100 overflow-hidden mb-2">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function GoalsScreen() {
  const [goals, setGoals] = React.useState<GoalRow[]>([])
  const [tasks, setTasks] = React.useState<TaskRow[]>([])
  const [rates, setRates] = React.useState<Record<string, number>>({
    design: 200, content: 180, sales: 120, strategic: 136, other: 100,
  })
  const [loading, setLoading] = React.useState(true)
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set())
  const [filter, setFilter] = React.useState<"all" | "active" | "completed">("all")
  const [showAddGoal, setShowAddGoal] = React.useState(false)
  const [addingTask, setAddingTask] = React.useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = React.useState<Record<number, string>>({})
  const [togglingTask, setTogglingTask] = React.useState<number | null>(null)
  const [deletingGoal, setDeletingGoal] = React.useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState<number | null>(null)

  React.useEffect(() => {
    async function load() {
      const [goalsRes, tasksRes, ratesRes] = await Promise.all([
        getGoals(),
        getTasks(),
        getValueSettings(),
      ])
      if (goalsRes.success) setGoals(goalsRes.goals as any)
      if (tasksRes.success) setTasks(tasksRes.tasks as any)
      if (ratesRes.rates) setRates(ratesRes.rates as any)
      setLoading(false)
    }
    load()
  }, [])

  const toggleExpand = (id: number) =>
    setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleToggleTask = async (taskId: number) => {
    setTogglingTask(taskId)
    await toggleTaskCompletion(taskId)
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t)
    )
    setTogglingTask(null)
  }

  const handleDeleteGoal = async (goalId: number) => {
    if (confirmDelete !== goalId) {
      setConfirmDelete(goalId)
      setTimeout(() => setConfirmDelete((c) => (c === goalId ? null : c)), 3000)
      return
    }
    setDeletingGoal(goalId)
    await deleteGoal(goalId)
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
    setConfirmDelete(null)
    setDeletingGoal(null)
  }

  const handleAddTask = async (goalId: number) => {
    const title = newTaskTitle[goalId]?.trim()
    if (!title) return
    const res = await createTask(title, "", undefined, undefined, goalId)
    if (res.success && res.task) {
      setTasks((prev) => [...prev, res.task as any])
      setNewTaskTitle((prev) => ({ ...prev, [goalId]: "" }))
      setAddingTask(null)
    }
  }

  // Priority matrix
  const matrix: Record<MatrixQuadrant, GoalRow[]> = { do: [], plan: [], delegate: [], drop: [] }
  goals.forEach((g) => matrix[getQuadrant(g)].push(g))

  // Potential value per matrix quadrant: sum of pending tasks' estimated value
  const matrixValue = (quadrant: MatrixQuadrant): number => {
    const goalIds = matrix[quadrant].map((g) => g.id)
    return tasks
      .filter((t) => !t.completed && t.goal_id != null && goalIds.includes(t.goal_id))
      .reduce((sum, t) => sum + calculateTaskValue(t.alignment_score, t.alignment_category, rates as any), 0)
  }

  // Filtered goals
  const filteredGoals = goals.filter((g) => {
    const pct = g.target_value ? Math.round(((g.current_value ?? 0) / g.target_value) * 100) : 0
    if (filter === "active") return pct < 100
    if (filter === "completed") return pct >= 100
    return true
  })

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-black/[0.06] px-5 py-3 flex items-center justify-between lg:static lg:bg-transparent lg:border-0 lg:pt-6">
        <span className="text-[17px] font-semibold text-slate-800 tracking-tight">goals</span>
        <button
          onClick={() => setShowAddGoal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-[12px] font-semibold rounded-full px-3.5 py-1.5 flex items-center gap-1 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add goal
        </button>
      </div>

      <div className="px-5 pt-4 pb-6 max-w-lg mx-auto space-y-3">

        {/* ── Filter tabs ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[12px] font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
                filter === f
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-slate-500 border-slate-200 hover:border-green-300"
              }`}
            >
              {f === "all" ? "All goals" : f === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>

        {/* ── Priority matrix ── */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-3.5">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-[12px] font-bold text-slate-800">Your priority matrix</p>
            <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
              <Sparkles className="h-2.5 w-2.5 text-purple-400" /> Greta
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            Goals sorted by mission alignment and urgency — potential value shown per quadrant.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: "do",       label: "Do first",     cls: "bg-green-100 border-green-300",  txt: "text-green-800",  val: "text-green-700"  },
                { key: "plan",     label: "Schedule",     cls: "bg-blue-50 border-blue-200",     txt: "text-blue-800",   val: "text-blue-700"   },
                { key: "delegate", label: "Delegate",     cls: "bg-amber-50 border-amber-200",   txt: "text-amber-800",  val: "text-amber-700"  },
                { key: "drop",     label: "Drop / defer", cls: "bg-slate-100 border-slate-200",  txt: "text-slate-500",  val: "text-slate-500"  },
              ] as const
            ).map(({ key, label, cls, txt, val }) => {
              const qValue = matrixValue(key as MatrixQuadrant)
              return (
                <div key={key} className={`rounded-xl p-3 border ${cls}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={`text-[9px] font-bold tracking-widest uppercase ${txt}`}>{label}</p>
                    {qValue > 0 && (
                      <span className={`text-[9px] font-bold font-mono ${val}`}>{formatDollars(qValue)}</span>
                    )}
                  </div>
                  {matrix[key as MatrixQuadrant].length === 0 ? (
                    <p className="text-[11px] text-slate-400">—</p>
                  ) : (
                    matrix[key as MatrixQuadrant].slice(0, 3).map((g) => (
                      <p key={g.id} className="text-[11.5px] text-slate-700 py-1 border-b border-black/[0.06] last:border-0 last:pb-0 leading-tight">
                        {g.title}
                      </p>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Goal list ── */}
        <div>
          <p className="text-[12px] font-bold text-slate-800 mb-2.5">
            {filter === "completed" ? "Completed" : "Active"} goals ({filteredGoals.length})
          </p>
          <div className="space-y-2">
            {filteredGoals.map((goal) => {
              const goalTasks = tasks.filter((t) => t.goal_id === goal.id)
              const pct = goal.target_value
                ? Math.min(100, Math.round(((goal.current_value ?? 0) / goal.target_value) * 100))
                : 0
              const isExpanded = expanded.has(goal.id)
              const isCompleted = pct >= 100
              const pctColor = isCompleted ? "#16a34a" : pct >= 40 ? "#f59e0b" : "#ef4444"
              const pctTextColor = isCompleted ? "text-green-600" : pct >= 40 ? "text-amber-500" : "text-red-500"

              return (
                <div
                  key={goal.id}
                  className={`bg-white rounded-2xl border border-black/[0.07] p-3.5 cursor-pointer transition-all hover:border-green-200 ${isCompleted ? "opacity-65" : ""}`}
                  onClick={() => toggleExpand(goal.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-[13.5px] font-semibold text-slate-800 leading-snug flex-1 pr-2">{goal.title}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[13px] font-bold font-mono ${pctTextColor}`}>{pct}%</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id) }}
                        disabled={deletingGoal === goal.id}
                        title={confirmDelete === goal.id ? "Click again to confirm delete" : "Delete goal"}
                        className={`p-1 rounded-lg transition-colors ${
                          confirmDelete === goal.id
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "text-slate-300 hover:text-red-400 hover:bg-red-50"
                        }`}
                      >
                        {deletingGoal === goal.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Trash2 className="h-3 w-3" />
                        }
                      </button>
                    </div>
                  </div>
                  <GoalProgress current={goal.current_value} target={goal.target_value} />
                  <div className="flex items-center gap-2 flex-wrap">
                    {goal.target_value != null && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pctTextColor === "text-green-600" ? "bg-green-100 text-green-700" : pctTextColor === "text-amber-500" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                        {goal.current_value ?? 0} / {goal.target_value} {goal.unit || ""}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">Completed</span>
                    )}
                    {goal.deadline && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-medium">
                        Due {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    <span className="ml-auto text-slate-400">
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </span>
                  </div>

                  {/* ── Expanded tasks ── */}
                  {isExpanded && (
                    <div
                      className="mt-3 pt-3 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Tasks inside this goal
                      </p>
                      {goalTasks.length === 0 ? (
                        <p className="text-[12px] text-slate-400 py-1">No tasks yet</p>
                      ) : (
                        <div className="space-y-0">
                          {goalTasks.map((task) => {
                            const taskValue = calculateTaskValue(task.alignment_score, task.alignment_category, rates as any)
                            return (
                              <div key={task.id} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                                <button
                                  onClick={() => handleToggleTask(task.id)}
                                  disabled={togglingTask === task.id}
                                  className={`w-4 h-4 rounded border-[1.5px] shrink-0 flex items-center justify-center transition-colors ${
                                    task.completed
                                      ? "bg-green-600 border-green-600"
                                      : "border-green-300 hover:border-green-500"
                                  }`}
                                >
                                  {(task.completed || togglingTask === task.id) && (
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  )}
                                </button>
                                <span className={`text-[11.5px] flex-1 leading-tight ${task.completed ? "line-through opacity-40 text-slate-500" : "text-slate-600"}`}>
                                  {task.title}
                                </span>
                                <span className={`text-[10px] font-semibold font-mono ${task.completed ? "opacity-40" : "text-amber-500"}`}>
                                  {formatDollars(taskValue)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Add task inline */}
                      {addingTask === goal.id ? (
                        <div className="flex gap-1.5 mt-2">
                          <input
                            autoFocus
                            value={newTaskTitle[goal.id] ?? ""}
                            onChange={(e) => setNewTaskTitle((p) => ({ ...p, [goal.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddTask(goal.id)
                              if (e.key === "Escape") setAddingTask(null)
                            }}
                            placeholder="Task title…"
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-green-400"
                          />
                          <button
                            onClick={() => handleAddTask(goal.id)}
                            className="text-[11px] bg-green-600 text-white rounded-lg px-2.5 py-1 hover:bg-green-700"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingTask(goal.id)}
                          className="w-full mt-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl py-2 text-[12px] text-slate-500 hover:border-green-300 hover:text-green-700 transition-colors"
                        >
                          + Add task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredGoals.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-green-200 p-6 text-center">
                <p className="text-[13px] font-medium text-green-700">No goals yet</p>
                <button
                  onClick={() => setShowAddGoal(true)}
                  className="mt-2 text-[12px] text-green-600 underline"
                >
                  Add your first goal
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-2" />
      </div>

      {/* ── Add Goal modal ── */}
      {showAddGoal && (
        <AddGoalModal
          onClose={() => setShowAddGoal(false)}
          onCreated={(g) => { setGoals((p) => [g as any, ...p]); setShowAddGoal(false) }}
        />
      )}
    </AppShell>
  )
}

function AddGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: any) => void }) {
  const [saving, setSaving] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const res = await createGoal(fd)
    setSaving(false)
    if (res.success && res.goal) onCreated(res.goal)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full max-w-md p-5 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-bold text-slate-800 mb-4">Add goal</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="title" required placeholder="Goal title" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-green-400" />
          <input name="description" placeholder="Description (optional)" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-green-400" />
          <div className="grid grid-cols-2 gap-2">
            <input name="targetValue" type="number" placeholder="Target (e.g. 100)" className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-green-400" />
            <input name="unit" placeholder="Unit (e.g. customers)" className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-green-400" />
          </div>
          <input name="deadline" type="date" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-green-400 text-slate-500" />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-[13px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create goal"}
          </button>
        </form>
      </div>
    </div>
  )
}
