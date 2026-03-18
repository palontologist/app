"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { getTasks } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"
import { getGeneratedValueByDay } from "@/app/actions/value-settings"
import { getCachedDashboardSummary } from "@/app/actions/analytics"
import { AppShell } from "@/components/app-shell"
import { formatDollars, DAY_LABELS } from "@/lib/value"

interface DayBar { day: string; value: number }

function AlignmentBars({ tasks }: { tasks: any[] }) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })

  const maxTasks = Math.max(1, ...days.map((d) =>
    tasks.filter((t) => {
      const created = new Date(t.created_at)
      return created.toDateString() === d.toDateString()
    }).length
  ))

  const todayStr = today.toDateString()

  return (
    <div className="flex items-end gap-1.5 h-20 pb-0">
      {days.map((d, i) => {
        const label = ["M", "T", "W", "T", "F", "S", "S"][d.getDay() === 0 ? 6 : d.getDay() - 1]
        const dayTasks = tasks.filter((t) => new Date(t.created_at).toDateString() === d.toDateString())
        const highAlign = dayTasks.filter((t) => t.alignment_category === "high").length
        const pct = dayTasks.length > 0 ? highAlign / dayTasks.length : 0
        const heightPx = Math.max(4, Math.round(60 * (dayTasks.length / maxTasks + pct) / 2))
        const isToday = d.toDateString() === todayStr

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-md transition-all duration-500 ${isToday ? "bg-green-600" : "bg-green-100"}`}
              style={{ height: `${heightPx}px` }}
            />
            <span className={`text-[9px] ${isToday ? "text-green-600 font-bold" : "text-slate-400"}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function ValueBars({ data, maxVal }: { data: DayBar[]; maxVal: number }) {
  const todayLabel = DAY_LABELS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  return (
    <div className="space-y-2">
      {data.map(({ day, value }) => {
        const width = maxVal > 0 ? Math.round((value / maxVal) * 100) : 0
        return (
          <div key={day} className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-400 w-7 shrink-0">{day}</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${width}%`,
                  background: day === todayLabel ? "#16a34a" : "linear-gradient(90deg, #16a34a, #22c55e)"
                }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 font-mono w-10 text-right">
              {value > 0 ? formatDollars(value) : "—"}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function ProgressScreen() {
  const [tasks, setTasks] = React.useState<any[]>([])
  const [goals, setGoals] = React.useState<any[]>([])
  const [valueData, setValueData] = React.useState<{
    data: DayBar[]; weekTotal: number; effectiveRate: number
  }>({ data: [], weekTotal: 0, effectiveRate: 0 })
  const [insight, setInsight] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      const [tasksRes, goalsRes, valRes, insightRes] = await Promise.all([
        getTasks(),
        getGoals(),
        getGeneratedValueByDay(),
        getCachedDashboardSummary(),
      ])
      if (tasksRes.success) setTasks(tasksRes.tasks)
      if (goalsRes.success) setGoals(goalsRes.goals)
      if (valRes.success) setValueData({ data: valRes.data, weekTotal: valRes.weekTotal, effectiveRate: valRes.effectiveRate })
      if (insightRes) setInsight(typeof insightRes === "string" ? insightRes : (insightRes as any)?.content ?? "")
      setLoading(false)
    }
    load()
  }, [])

  const completedTasks = tasks.filter((t) => t.completed)
  const activeTasks = tasks.filter((t) => !t.completed)
  const highImpactTasks = tasks.filter((t) => t.alignment_category === "high")
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  const onTrackGoals = goals.filter((g) => {
    if (!g.target_value) return false
    const pct = ((g.current_value ?? 0) / g.target_value) * 100
    return pct >= 40
  }).length

  const alignmentScore = tasks.length > 0
    ? Math.round(tasks.slice(0, 20).reduce((s: number, t: any) => s + (t.alignment_score ?? 50), 0) / Math.min(tasks.length, 20))
    : 50

  const overallProgress = Math.round((completionRate * 0.4) + (alignmentScore * 0.4) + (Math.min(onTrackGoals * 10, 20)))

  const maxValue = Math.max(1, ...valueData.data.map((d) => d.value))

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
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-black/[0.06] px-5 py-3 flex items-center justify-between lg:static lg:bg-transparent lg:border-0 lg:pt-6">
        <span className="text-[17px] font-semibold text-slate-800 tracking-tight">progress</span>
        <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">This week</span>
      </div>

      <div className="px-5 pt-4 pb-6 max-w-lg mx-auto space-y-3">

        {/* ── Overall score ── */}
        <div className="text-center pb-2">
          <p className="text-[24px] font-bold text-slate-800">{overallProgress}% overall</p>
          <p className="text-[12px] text-slate-500 mt-1">
            Task completion ({completionRate}%) + Alignment ({alignmentScore}%) + Goals
          </p>
        </div>

        {/* ── Alignment bars ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-slate-800">Alignment this week</span>
            <span className="text-[11px] text-green-600 font-medium">7-day view</span>
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.07] p-4">
            <AlignmentBars tasks={tasks} />
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span>Avg {alignmentScore}%</span>
              <span>Tasks {tasks.length}</span>
              <span>Done {completedTasks.length}</span>
            </div>
          </div>
        </div>

        {/* ── Value generated per day ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-slate-800">Value generated</span>
            <span className="text-[11px] text-green-600 font-medium">per day</span>
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.07] p-4">
            {valueData.weekTotal > 0 ? (
              <>
                <ValueBars data={valueData.data} maxVal={maxValue} />
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[11px] text-slate-400">Week total</p>
                    <p className="text-[18px] font-bold text-slate-800 font-mono">{formatDollars(valueData.weekTotal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Avg per task</p>
                    <p className="text-[18px] font-bold text-green-600 font-mono">{formatDollars(valueData.effectiveRate)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-[13px] font-medium text-slate-500">No completed tasks this week yet.</p>
                <p className="text-[12px] text-slate-400 mt-1">Complete tasks to see value generated here.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Greta insight card ── */}
        {insight && (
          <div className="bg-gradient-to-br from-green-50 to-green-100/60 border border-green-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
              <span className="text-[10px] font-bold text-green-700 tracking-widest uppercase">This week&apos;s focus</span>
            </div>
            <p className="text-[12.5px] text-green-900 leading-relaxed line-clamp-4">{insight}</p>
          </div>
        )}

        {/* ── Focus areas ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-slate-800">Focus areas</span>
            <span className="text-[11px] text-green-600 font-medium">AI analysis</span>
          </div>
          <div className="space-y-2">
            {completedTasks.length > 0 && (
              <div className="bg-white rounded-xl border border-black/[0.07] p-3 flex items-start gap-2.5">
                <span className="text-[14px]">🚀</span>
                <div>
                  <p className="text-[12px] font-semibold text-slate-800 mb-0.5">Keep doing</p>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">
                    {completedTasks.slice(0, 3).map((t) => t.title?.split(" ").slice(0, 3).join(" ")).join(" · ") || "Mission-aligned work"}
                  </p>
                </div>
              </div>
            )}
            {activeTasks.filter((t) => t.alignment_category === "distraction" || t.alignment_category === "low").length > 0 && (
              <div className="bg-white rounded-xl border border-black/[0.07] p-3 flex items-start gap-2.5">
                <span className="text-[14px]">⚡</span>
                <div>
                  <p className="text-[12px] font-semibold text-slate-800 mb-0.5">Reduce time on</p>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">
                    Low-alignment tasks · Admin work
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Goals snapshot ── */}
        <div>
          <p className="text-[12px] font-bold text-slate-800 mb-2.5">Goals snapshot</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: `${onTrackGoals}/${goals.length}`, lbl: "On track" },
              { num: `${completionRate}%`, lbl: "Completion rate" },
              { num: String(highImpactTasks.length), lbl: "High impact" },
            ].map(({ num, lbl }) => (
              <div key={lbl} className="bg-white rounded-2xl border border-black/[0.07] p-3 text-center">
                <p className="text-[18px] font-bold text-slate-800 font-mono leading-none">{num}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-2" />
      </div>
    </AppShell>
  )
}
