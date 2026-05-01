"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { SignOutButton } from "@clerk/nextjs"
import { Check, Loader2, Plus, Star, Edit2 } from "lucide-react"
import { getUser, updateUser } from "@/app/actions/user"
import { getTasks } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"
import { isGoogleCalendarConnected } from "@/app/actions/google-calendar"
import { AppShell } from "@/components/app-shell"

const PERSONAL_VALUES = [
  { icon: "🔍", name: "Transparency", desc: "Clear methodology, no mysterious numbers" },
  { icon: "✊", name: "Authenticity", desc: "Track what actually matters to your mission" },
  { icon: "🎯", name: "Ownership", desc: "You control your metrics and targets" },
  { icon: "📈", name: "Progress", desc: "Consistent improvement over perfection" },
]

export default function ProfileScreen() {
  const { user: clerkUser } = useUser()
  const [profile, setProfile] = React.useState<any>(null)
  const [tasks, setTasks] = React.useState<any[]>([])
  const [goals, setGoals] = React.useState<any[]>([])
  const [calConnected, setCalConnected] = React.useState<boolean | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Edit states
  const [editingMission, setEditingMission] = React.useState(false)
  const [missionForm, setMissionForm] = React.useState({ 
    name: "", 
    mission: "", 
    worldVision: "", 
    focusAreas: "",
    targetHourlyRate: "",
    meetingHoursPerMonth: "",
    emailHoursPerMonth: ""
  })
  const [savingMission, setSavingMission] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      const [userRes, tasksRes, goalsRes, calRes] = await Promise.all([
        getUser(),
        getTasks(),
        getGoals(),
        isGoogleCalendarConnected(),
      ])
      if (userRes.success && userRes.user) {
        setProfile(userRes.user)
        setMissionForm({
          name: userRes.user.name || "",
          mission: userRes.user.mission || "",
          worldVision: userRes.user.worldVision || "",
          focusAreas: userRes.user.focusAreas || "",
          targetHourlyRate: userRes.user.targetHourlyRate?.toString() || "",
          meetingHoursPerMonth: userRes.user.meetingHoursPerMonth?.toString() || "10",
          emailHoursPerMonth: userRes.user.emailHoursPerMonth?.toString() || "5",
        })
      }
      if (tasksRes.success) setTasks(tasksRes.tasks)
      if (goalsRes.success) setGoals(goalsRes.goals)
      setCalConnected(calRes)
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveMission = async () => {
    setSavingMission(true)
    const fd = new FormData()
    Object.entries(missionForm).forEach(([k, v]) => fd.append(k, v))
    const res = await updateUser(fd)
    if (res.success && res.user) setProfile(res.user)
    setSavingMission(false)
    setEditingMission(false)
  }

  const initials = React.useMemo(() => {
    const name = profile?.name || clerkUser?.fullName || ""
    return name.split(" ").slice(0, 2).map((p: string) => p[0]?.toUpperCase() ?? "").join("") || "?"
  }, [profile, clerkUser])

  const completedTasks = tasks.filter((t) => t.completed)
  const activeGoals = goals.filter((g) => {
    if (!g.target_value) return true
    return (g.current_value ?? 0) < g.target_value
  })
  const alignmentScore = tasks.length > 0
    ? Math.round(tasks.slice(0, 20).reduce((s: number, t: any) => s + (t.alignment_score ?? 50), 0) / Math.min(tasks.length, 20))
    : 50
  const focusAreasArr = profile?.focusAreas ? profile.focusAreas.split(",").map((s: string) => s.trim()).filter(Boolean) : []

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
        <span className="text-[17px] font-semibold text-slate-800 tracking-tight">profile</span>
        <button
          onClick={() => setEditingMission(true)}
          className="text-[12px] text-green-600 font-medium hover:underline"
        >
          Edit
        </button>
      </div>

      <div className="px-5 pt-2 pb-8 max-w-lg mx-auto space-y-3">

        {/* ── Avatar hero ── */}
        <div className="text-center pt-3 pb-2">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-2.5 text-[22px] font-bold text-white">
            {initials}
          </div>
          <p className="text-[18px] font-bold text-slate-800">{profile?.name || clerkUser?.fullName || "Founder"}</p>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {clerkUser?.primaryEmailAddress?.emailAddress || ""}
          </p>
          <div className="flex items-center justify-center gap-5 mt-3">
            {[
              { val: `${alignmentScore}%`, lbl: "Alignment" },
              { val: String(completedTasks.length), lbl: "Tasks done" },
              { val: String(activeGoals.length), lbl: "Active goals" },
            ].map(({ val, lbl }, i, arr) => (
              <React.Fragment key={lbl}>
                <div className="text-center">
                  <p className="text-[17px] font-bold text-slate-800">{val}</p>
                  <p className="text-[10px] text-slate-400">{lbl}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-slate-200" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Personal mission ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-slate-800">Personal mission</span>
            <button onClick={() => setEditingMission(true)} className="text-[11px] text-green-600 font-medium flex items-center gap-1">
              <Edit2 className="h-3 w-3" /> Edit
            </button>
          </div>
          {editingMission ? (
            <div className="bg-white rounded-2xl border border-green-300 p-4 space-y-2.5">
              {[
                { key: "name", label: "Name", placeholder: "Your name" },
                { key: "mission", label: "Mission", placeholder: "What do you stand for?" },
                { key: "worldVision", label: "World vision", placeholder: "What world do you want to see?" },
                { key: "focusAreas", label: "Focus areas", placeholder: "e.g. Customer acquisition, Product" },
                { key: "targetHourlyRate", label: "Target Rate ($/hr)", placeholder: "e.g. 100", type: "number" },
                { key: "meetingHoursPerMonth", label: "Meeting hrs/month", placeholder: "e.g. 10", type: "number" },
                { key: "emailHoursPerMonth", label: "Email hrs/month", placeholder: "e.g. 5", type: "number" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
                  <input
                    type={type || "text"}
                    value={(missionForm as any)[key]}
                    onChange={(e) => setMissionForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full mt-0.5 border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-green-400"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveMission}
                  disabled={savingMission}
                  className="flex-1 bg-green-600 text-white rounded-xl py-2 text-[13px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  {savingMission ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                </button>
                <button onClick={() => setEditingMission(false)} className="flex-1 bg-slate-100 text-slate-600 rounded-xl py-2 text-[13px] hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="relative rounded-2xl p-4 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0f2027 0%, #1a3a2e 100%)" }}
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-green-600/15 pointer-events-none" />
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-2.5 h-2.5 text-green-300 fill-green-300" />
                <span className="text-[10px] font-bold text-green-300 tracking-widest uppercase">North Star</span>
              </div>
              <p className="text-[14px] font-medium text-white leading-snug mb-3">
                {profile?.mission || "Set your personal mission →"}
              </p>
              {profile?.worldVision && (
                <div>
                  <p className="text-[10px] font-semibold text-green-300 uppercase tracking-wide mb-1">World vision</p>
                  <p className="text-[12.5px] text-green-100/80 leading-relaxed">{profile.worldVision}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Your values ── */}
        <div>
          <p className="text-[12px] font-bold text-slate-800 mb-2">Your values</p>
          <div className="grid grid-cols-2 gap-2">
            {PERSONAL_VALUES.map(({ icon, name, desc }) => (
              <div key={name} className="bg-white rounded-xl border border-black/[0.07] p-3">
                <div className="text-[16px] mb-1">{icon}</div>
                <p className="text-[12px] font-semibold text-slate-800">{name}</p>
                <p className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Focus areas ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-slate-800">Focus areas</span>
            <button onClick={() => setEditingMission(true)} className="text-[11px] text-green-600 font-medium">Edit</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {focusAreasArr.length > 0
              ? focusAreasArr.map((area: string) => (
                  <span key={area} className="bg-green-600 text-white text-[12px] font-medium px-3 py-1 rounded-full">
                    {area}
                  </span>
                ))
              : <span className="text-[12px] text-slate-400">No focus areas set</span>
            }
            <button
              onClick={() => setEditingMission(true)}
              className="bg-green-100 text-green-700 text-[12px] font-medium px-3 py-1 rounded-full flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add area
            </button>
          </div>
        </div>

        {/* ── Rate Settings ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-slate-800">Rate Settings</span>
            <button onClick={() => setEditingMission(true)} className="text-[11px] text-green-600 font-medium">Edit</button>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-slate-600">Target Rate</span>
              <span className="text-[14px] font-bold text-green-600">${profile?.targetHourlyRate || 75}/hr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-slate-600">Meeting Hours/Month</span>
              <span className="text-[13px] font-medium text-slate-700">{profile?.meetingHoursPerMonth || 10} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-slate-600">Email Hours/Month</span>
              <span className="text-[13px] font-medium text-slate-700">{profile?.emailHoursPerMonth || 5} hrs</span>
            </div>
            {profile?.targetHourlyRate && (
              <>
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-600">Billable Hours/Month</span>
                    <span className="text-[13px] font-medium text-slate-700">20 hrs</span>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">Effective Rate</span>
                    {(() => {
                      const targetRate = profile?.targetHourlyRate || 75
                      const meetingHrs = profile?.meetingHoursPerMonth || 10
                      const emailHrs = profile?.emailHoursPerMonth || 5
                      const billableHrs = 20
                      const totalHrs = billableHrs + meetingHrs + emailHrs
                      const effectiveRate = Math.round((targetRate * billableHrs) / totalHrs)
                      const isGood = effectiveRate >= targetRate * 0.8
                      return (
                        <span className={`text-[16px] font-bold ${isGood ? 'text-green-600' : 'text-orange-600'}`}>
                          ${effectiveRate}/hr
                        </span>
                      )
                    })()}
                  </div>
                  <p className="text-[10px] text-green-600/70">
                    After {profile?.meetingHoursPerMonth || 10} meeting + {profile?.emailHoursPerMonth || 5} email hours
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Working style ── */}
        <div>
          <p className="text-[12px] font-bold text-slate-800 mb-2">Working style</p>
          <div className="bg-white rounded-2xl border border-black/[0.07] divide-y divide-slate-100">
            {[
              { label: "Peak hours", sub: "When you do your best work", val: "9am–12pm" },
              { label: "Role type", sub: "How Greta weighs your tasks", val: "Founder / Builder" },
              { label: "Priority style", sub: "Eisenhower matrix personalisation", val: "Impact-first" },
            ].map(({ label, sub, val }) => (
              <div key={label} className="flex items-center justify-between px-3.5 py-3">
                <div>
                  <p className="text-[12.5px] font-medium text-slate-800">{label}</p>
                  <p className="text-[11px] text-slate-400">{sub}</p>
                </div>
                <span className="text-[12px] font-semibold text-green-600">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Google Calendar ── */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-slate-800">Google Calendar</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {calConnected ? "Connected — events synced" : "Sync events for better task planning"}
            </p>
          </div>
          {calConnected ? (
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
              <Check className="h-3.5 w-3.5 text-green-600" />
              <span className="text-[12px] font-semibold text-green-700">Connected</span>
            </div>
          ) : (
            <a
              href="/api/google/auth/start"
              className="bg-green-600 hover:bg-green-700 text-white text-[12px] font-semibold rounded-xl px-3.5 py-1.5 transition-colors"
            >
              Connect
            </a>
          )}
        </div>

        {/* ── Sign out ── */}
        <div className="pb-2">
          <SignOutButton>
            <button className="w-full bg-white border border-slate-200 rounded-2xl py-3 text-[13px] text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </AppShell>
  )
}
