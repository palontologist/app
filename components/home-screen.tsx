"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, ListTodo, Activity, CalendarPlus, ArrowRight, Star, Loader2, Sparkles, RefreshCw } from "lucide-react"
import { getTasks, toggleTaskCompletion } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"
import { getUser } from "@/app/actions/user"
import { getCachedDashboardSummary } from "@/app/actions/analytics"
import { getValueSettings } from "@/app/actions/value-settings"
import { getAISuggestedTask, type AISuggestion } from "@/app/actions/ai-task-suggestion"
import { calculateTaskValue, formatDollars, getWeekStart } from "@/lib/value"
import { AppShell } from "@/components/app-shell"
import SmartTaskDialog from "@/components/smart-task-dialog"
import GoalsDialog from "@/components/goals-dialog"

interface TaskRow {
  id: number
  title: string | null
  alignment_score: number | null
  alignment_category: string | null
  completed: boolean | null
  completed_at: Date | null
  goal_id: number | null
  created_at: Date
}

function calcAlignmentScore(tasks: TaskRow[]): number {
  const relevant = tasks.filter((t) => t.alignment_score != null).slice(0, 20)
  if (!relevant.length) return 50
  return Math.round(relevant.reduce((s, t) => s + (t.alignment_score ?? 50), 0) / relevant.length)
}

function getThisWeekValue(tasks: TaskRow[], rates: Record<string, number>): number {
  const weekStart = getWeekStart()
  return tasks
    .filter((t) => t.completed && t.completed_at && new Date(t.completed_at) >= weekStart)
    .reduce((sum, t) => sum + calculateTaskValue(t.alignment_score, t.alignment_category, rates as any), 0)
}

export default function HomeScreen() {
  const router = useRouter()

  const [tasks, setTasks] = React.useState<TaskRow[]>([])
  const [user, setUser] = React.useState<any>(null)
  const [insight, setInsight] = React.useState("")
  const [rates, setRates] = React.useState<Record<string, number>>({ design: 200, content: 180, sales: 120, strategic: 136, other: 100 })
  const [loading, setLoading] = React.useState(true)

  // Skip queue — IDs the user has skipped this session
  const [skippedIds, setSkippedIds] = React.useState<number[]>([])

  // AI-suggested task state
  const [aiSuggestion, setAiSuggestion] = React.useState<AISuggestion | null>(null)
  const [loadingAI, setLoadingAI] = React.useState(false)
  const [aiError, setAiError] = React.useState(false)

  const [taskStarting, setTaskStarting] = React.useState<number | null>(null)
  const [openAdd, setOpenAdd] = React.useState(false)
  const [openGoals, setOpenGoals] = React.useState(false)
  const [coachInput, setCoachInput] = React.useState("")

  // ── Load data ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    async function load() {
      const [tasksRes, userRes, insightRes, ratesRes] = await Promise.all([
        getTasks(),
        getUser(),
        getCachedDashboardSummary(),
        getValueSettings(),
      ])
      if (tasksRes.success) setTasks(tasksRes.tasks as any)
      if (userRes.success && userRes.user) setUser(userRes.user)
      if (insightRes) setInsight(typeof insightRes === "string" ? insightRes : (insightRes as any)?.content ?? "")
      if (ratesRes.rates) setRates(ratesRes.rates as any)
      setLoading(false)
    }
    load()
  }, [])

  // Fetch AI suggestion once initial data has loaded
  React.useEffect(() => {
    if (loading) return
    const pending = tasks.filter((t) => !t.completed)
    if (!pending.length) return
    setLoadingAI(true)
    getAISuggestedTask([]).then((res) => {
      if (res.success && res.suggestion) setAiSuggestion(res.suggestion)
      else setAiError(true)
      setLoadingAI(false)
    })
    // Only run on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const fetchAISuggestion = React.useCallback(() => {
    setLoadingAI(true)
    setAiError(false)
    setAiSuggestion(null)
    getAISuggestedTask(skippedIds).then((res) => {
      if (res.success && res.suggestion) setAiSuggestion(res.suggestion)
      else setAiError(true)
      setLoadingAI(false)
    })
  }, [skippedIds])

  // ── Derived ────────────────────────────────────────────────────────────────
  const completedTasks = tasks.filter((t) => t.completed)
  const pendingTasks = tasks.filter((t) => !t.completed && !skippedIds.includes(t.id))

  // Resolve the suggested task object (AI picks the ID, we look it up)
  const suggestedTask = React.useMemo(() => {
    if (aiSuggestion) {
      const found = pendingTasks.find((t) => t.id === aiSuggestion.taskId)
      if (found) return found
    }
    // Fallback: highest alignment score
    return [...pendingTasks].sort((a, b) => (b.alignment_score ?? 0) - (a.alignment_score ?? 0))[0] ?? null
  }, [aiSuggestion, pendingTasks])

  const suggestedValue = React.useMemo(() => {
    if (aiSuggestion?.estimatedValueDollars) return aiSuggestion.estimatedValueDollars
    if (!suggestedTask) return 0
    return calculateTaskValue(suggestedTask.alignment_score, suggestedTask.alignment_category, rates as any)
  }, [aiSuggestion, suggestedTask, rates])

  const alignmentScore = calcAlignmentScore(tasks)
  const weekValue = getThisWeekValue(tasks, rates)
  const highImpactCount = pendingTasks.filter((t) => t.alignment_category === "high").length

  const circ = 188.5
  const offset = circ - (circ * alignmentScore) / 100
  const trend = alignmentScore >= 60 ? "↑ improving" : alignmentScore >= 40 ? "→ steady" : "↓ needs focus"

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleMarkDone = async (taskId: number) => {
    setTaskStarting(taskId)
    await toggleTaskCompletion(taskId)
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: true, completed_at: new Date() } : t))
    setAiSuggestion(null)
    setTaskStarting(null)
    fetchAISuggestion()
  }

  const handleSkip = React.useCallback(() => {
    if (!suggestedTask) return
    const newSkipped = [...skippedIds, suggestedTask.id]
    setSkippedIds(newSkipped)
    setAiSuggestion(null)
    setLoadingAI(true)
    setAiError(false)
    getAISuggestedTask(newSkipped).then((res) => {
      if (res.success && res.suggestion) setAiSuggestion(res.suggestion)
      else setAiError(true)
      setLoadingAI(false)
    })
  }, [suggestedTask, skippedIds])

  const handleCoachSend = () => {
    if (!coachInput.trim()) return
    router.push(`/coach?q=${encodeURIComponent(coachInput.trim())}`)
  }

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
    <AppShell alignmentScore={alignmentScore}>
      <div className="px-5 py-4 max-w-lg mx-auto space-y-3">

        {/* ── North Star card ── */}
        <div
          className="relative rounded-2xl p-[18px] overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f2027 0%, #1a3a2e 100%)" }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-green-600/15 pointer-events-none" />
          <div className="absolute -bottom-10 right-5 w-20 h-20 rounded-full bg-green-600/8 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Star className="w-2.5 h-2.5 text-green-300 fill-green-300" />
              <span className="text-[10px] font-bold text-green-300 tracking-widest uppercase">North Star</span>
            </div>
            <p className="text-[16px] font-medium text-white leading-snug max-w-[220px]">
              {user?.mission || "Set your mission in profile →"}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[13px] font-semibold text-green-300 bg-green-600/25 border border-green-600/40 rounded-full px-3 py-1">
                {alignmentScore}% today
              </span>
              <span className={`text-[11px] ${alignmentScore >= 60 ? "text-green-300" : alignmentScore >= 40 ? "text-amber-300" : "text-red-300"}`}>
                {trend}
              </span>
            </div>
          </div>
        </div>

        {/* ── Alignment ring ── */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-4 flex items-center gap-4">
          <div className="relative w-[74px] h-[74px] shrink-0">
            <svg width="74" height="74" viewBox="0 0 74 74" className="-rotate-90">
              <circle cx="37" cy="37" r="30" fill="none" stroke="#f1f5f9" strokeWidth="7" />
              <circle
                cx="37" cy="37" r="30" fill="none"
                stroke="#16a34a" strokeWidth="7"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-slate-800 leading-none">{alignmentScore}</span>
              <span className="text-[9px] text-slate-500">%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-slate-800 mb-1">Mission Alignment</p>
            <p className="text-[11.5px] text-slate-500 leading-relaxed">
              {alignmentScore >= 70
                ? "Strong focus — keep prioritising high-impact work."
                : alignmentScore >= 50
                ? "Good momentum — push towards mission-critical tasks."
                : "Shift focus to your highest-alignment goals today."}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-green-100 text-green-700 rounded-full px-2 py-0.5 mt-1.5">
              {trend}
            </span>
          </div>
        </div>

        {/* ── Greta insight ── */}
        {insight && (
          <div className="bg-gradient-to-br from-green-50 to-green-100/60 border border-green-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
              <span className="text-[10px] font-bold text-green-700 tracking-widest uppercase">Greta insight</span>
            </div>
            <p className="text-[12.5px] text-green-900 leading-relaxed line-clamp-3">{insight}</p>
          </div>
        )}

        {/* ── AI-suggested top task ── */}
        {pendingTasks.length > 0 ? (
          <div className="bg-white rounded-2xl border-[1.5px] border-green-500 p-4">
            {/* Header with AI badge */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-green-700 bg-green-100 rounded-full px-2.5 py-1 tracking-wide uppercase">
                  Top task now
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-purple-400" />
                  Greta
                </span>
              </div>
              {!loadingAI && (
                <button
                  onClick={fetchAISuggestion}
                  title="Refresh suggestion"
                  className="text-slate-400 hover:text-green-600 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {loadingAI ? (
              <div className="py-4 flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                <span className="text-[12.5px]">Greta is thinking…</span>
              </div>
            ) : suggestedTask ? (
              <>
                <p className="text-[15px] font-semibold text-slate-800 leading-snug mb-2">{suggestedTask.title}</p>

                {/* AI reasoning */}
                {aiSuggestion?.reason && (
                  <p className="text-[11.5px] text-slate-500 leading-relaxed mb-2.5 italic">
                    &ldquo;{aiSuggestion.reason}&rdquo;
                  </p>
                )}

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-[10.5px] font-medium bg-green-100 text-green-800 rounded-full px-2.5 py-0.5">
                    {suggestedTask.alignment_score ?? 50}% aligned
                  </span>
                  <span className="text-[10.5px] font-medium bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5">
                    {aiSuggestion?.priorityLabel || (suggestedTask.alignment_category === "high" ? "Urgent · High impact" : "High priority")}
                  </span>
                </div>

                {/* Estimated value box */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3">
                  <p className="text-[10px] font-bold text-amber-800 tracking-wide uppercase mb-0.5">Estimated value</p>
                  <p className="text-[22px] font-bold text-amber-700 font-mono leading-none">{formatDollars(suggestedValue)}</p>
                  <p className="text-[10.5px] text-amber-600 mt-0.5">
                    {aiSuggestion?.valueReason || `Based on your rate · ${suggestedTask.alignment_category || "medium"} category · mission weight`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarkDone(suggestedTask.id)}
                    disabled={taskStarting === suggestedTask.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {taskStarting === suggestedTask.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Mark done →"}
                  </button>
                  <button
                    onClick={handleSkip}
                    className="bg-slate-50 text-slate-500 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : (
              <div className="py-2">
                <p className="text-[13px] text-slate-500">
                  {aiError ? "Could not load suggestion — showing next best task." : "No tasks available."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-green-300 p-5 text-center">
            <p className="text-[13px] font-medium text-green-700">All tasks done! 🎉</p>
            <button onClick={() => setOpenAdd(true)} className="mt-2 text-[12px] text-green-600 underline">
              Add a new task
            </button>
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: completedTasks.length.toString(), lbl: "Tasks done" },
            { num: weekValue > 0 ? formatDollars(weekValue) : "$0", lbl: "This week" },
            { num: highImpactCount.toString(), lbl: "High impact" },
          ].map(({ num, lbl }) => (
            <div key={lbl} className="bg-white rounded-2xl border border-black/[0.07] p-3 text-center">
              <p className="text-[20px] font-bold text-slate-800 font-mono leading-none">{num}</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">{lbl}</p>
            </div>
          ))}
        </div>

        {/* ── Ask Greta panel ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] font-bold text-slate-800 tracking-wide">Ask Greta</span>
            <span className="text-[11px] text-green-600 font-medium">Powered by Groq</span>
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
            <div className="px-3.5 py-3 bg-green-50 border-b border-black/[0.06]">
              <p className="text-[12.5px] text-green-900 leading-relaxed">
                {user?.name ? `Hi ${user.name.split(" ")[0]}` : "Hi"} —{" "}
                you&apos;re <strong>{alignmentScore}% aligned</strong> today.{" "}
                {alignmentScore >= 70
                  ? "You're on track — want me to plan your next 2 hours?"
                  : "Want me to help improve your work methods and prioritise better?"}
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap px-3 py-2.5 border-b border-black/[0.06]">
              {["Plan my day", "Improve my methods", "Am I on track?", "What's blocking me?"].map((chip) => (
                <Link
                  key={chip}
                  href={`/coach?q=${encodeURIComponent(chip)}`}
                  className="text-[11px] border border-slate-200 rounded-full px-2.5 py-1 text-slate-500 hover:border-green-400 hover:text-green-700 transition-colors bg-slate-50 whitespace-nowrap"
                >
                  {chip}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <input
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCoachSend()}
                placeholder="Ask your coach…"
                className="flex-1 border border-slate-200 rounded-full px-3.5 py-1.5 text-[12.5px] text-slate-800 bg-slate-50 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100"
              />
              <button
                onClick={handleCoachSend}
                className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-2" />
      </div>

      {/* ── FAB ── */}
      <FabMenu onAddTask={() => setOpenAdd(true)} onAddGoal={() => setOpenGoals(true)} />
      <SmartTaskDialog open={openAdd} onOpenChange={setOpenAdd} />
      <GoalsDialog open={openGoals} onOpenChange={setOpenGoals} />
    </AppShell>
  )
}

function FabMenu({ onAddTask, onAddGoal }: { onAddTask: () => void; onAddGoal: () => void }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="fixed bottom-24 right-5 z-40 lg:bottom-8">
      <div className="relative">
        {open && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-2">
            {[
              { label: "Add Task", Icon: ListTodo, fn: onAddTask },
              { label: "Add Goal", Icon: Activity, fn: onAddGoal },
            ].map(({ label, Icon, fn }) => (
              <button
                key={label}
                onClick={() => { setOpen(false); fn() }}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] text-slate-700 shadow-sm hover:border-green-400 hover:text-green-700 transition-colors whitespace-nowrap"
              >
                <Icon className="h-3.5 w-3.5 text-green-600" />
                {label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center justify-center transition-colors"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
