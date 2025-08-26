import { KnowledgeBase, clause, t, type Clause, type Substitution } from "@/lib/metta/engine"

export type SimpleTask = {
  id: number
  title: string
  description?: string | null
  alignment_score?: number | null
  alignment_category?: string | null
  completed?: boolean | null
  goal_id?: number | null
  created_at?: Date
  updated_at?: Date
}

export type SimpleGoal = {
  id: number
  title: string
  current_value?: number | null
  target_value?: number | null
  deadline?: Date | null
}

export type UserContext = {
  userId: string
  mission?: string | null
  focusAreas?: string | null
  chronotype?: "morning" | "evening" | "neutral"
}

export type SchedulerInput = {
  user: UserContext
  tasks: SimpleTask[]
  goals: SimpleGoal[]
  now?: Date
}

export type ScheduledSuggestion = {
  taskId: number
  reason: string
  score: number
  tags: string[]
}

function normalizeCategory(cat?: string | null): string {
  const c = (cat || "").toLowerCase()
  if (["high", "medium", "low", "distraction"].includes(c)) return c
  return "medium"
}

export function buildKnowledgeBase(input: SchedulerInput): KnowledgeBase {
  const kb = new KnowledgeBase()
  const now = input.now || new Date()
  const todayDow = now.getDay() // 0=Sun
  const hour = now.getHours()

  // Facts: user context
  kb.addFact("user", t.s(input.user.userId))
  if (input.user.mission) kb.addFact("mission", t.s(input.user.userId), t.str(input.user.mission))
  if (input.user.focusAreas) kb.addFact("focus-area", t.s(input.user.userId), t.str(input.user.focusAreas))
  kb.addFact("hour", t.n(hour))
  kb.addFact("dow", t.n(todayDow))

  // Facts: goals
  for (const g of input.goals) {
    kb.addFact("goal", t.n(g.id), t.str(g.title))
    if (typeof g.current_value === "number") kb.addFact("goal-progress", t.n(g.id), t.n(g.current_value || 0))
    if (typeof g.target_value === "number") kb.addFact("goal-target", t.n(g.id), t.n(g.target_value || 0))
    if (g.deadline) kb.addFact("goal-deadline", t.n(g.id), t.str(g.deadline.toISOString()))
  }

  // Facts: tasks
  for (const tsk of input.tasks) {
    if (!tsk.title) continue
    kb.addFact("task", t.n(tsk.id), t.str(tsk.title))
    kb.addFact("task-cat", t.n(tsk.id), t.s(normalizeCategory(tsk.alignment_category)))
    kb.addFact("task-align", t.n(tsk.id), t.n(tsk.alignment_score || 0))
    kb.addFact("task-status", t.n(tsk.id), t.s(tsk.completed ? "done" : "pending"))
    if (tsk.goal_id) kb.addFact("task-goal", t.n(tsk.id), t.n(tsk.goal_id))
  }

  // Rules: time-of-day energy windows
  // morning-focus if hour in 6..11
  kb.addRule({
    head: clause("context", t.s("morning-focus")),
    body: [clause("hour", t.v("?h")), clause("between", t.v("?h"), t.n(6), t.n(11))],
    description: "Morning focus window",
  })
  // deep-work noon..15
  kb.addRule({
    head: clause("context", t.s("midday-deep")),
    body: [clause("hour", t.v("?h")), clause("between", t.v("?h"), t.n(12), t.n(15))],
    description: "Midday deep-work window",
  })
  // admin late afternoon 16..19
  kb.addRule({
    head: clause("context", t.s("admin-window")),
    body: [clause("hour", t.v("?h")), clause("between", t.v("?h"), t.n(16), t.n(19))],
    description: "Admin/meetings window",
  })

  // Primitive predicate between(H, A, B) via facts coverage (materialize simple domain)
  for (let h = 0; h <= 23; h++) kb.addFact("hour-domain", t.n(h))
  for (let a = 0; a <= 23; a++) for (let b = a; b <= 23; b++) kb.addFact("range", t.n(a), t.n(b))
  kb.addRule({ head: clause("between", t.v("?h"), t.v("?a"), t.v("?b")), body: [
    clause("hour-domain", t.v("?h")), clause("range", t.v("?a"), t.v("?b")), clause("ge", t.v("?h"), t.v("?a")), clause("le", t.v("?h"), t.v("?b"))
  ]})
  // numeric comparisons via extensional facts for 0..200
  for (let i = 0; i <= 200; i++) {
    kb.addFact("num", t.n(i))
    for (let j = i; j <= 200; j++) {
      kb.addFact("le", t.n(i), t.n(j))
    }
    for (let j = 0; j <= i; j++) {
      kb.addFact("ge", t.n(i), t.n(j))
    }
  }

  // Preference rules:
  // prioritize(?task) if task is pending and high alignment
  kb.addRule({
    head: clause("prioritize", t.v("?t")),
    body: [
      clause("task-status", t.v("?t"), t.s("pending")),
      clause("task-align", t.v("?t"), t.v("?score")),
      clause("ge", t.v("?score"), t.n(80)),
    ],
    description: "Pending and highly aligned",
  })

  // avoid(?task) if task is distraction
  kb.addRule({
    head: clause("avoid", t.v("?t")),
    body: [clause("task-cat", t.v("?t"), t.s("distraction"))],
    description: "Avoid distraction tasks",
  })

  // goal-critical(?task) if linked to goal with low progress (<50% of target when target exists)
  kb.addRule({
    head: clause("goal-critical", t.v("?t")),
    body: [
      clause("task-goal", t.v("?t"), t.v("?g")),
      clause("goal-target", t.v("?g"), t.v("?target")),
      clause("goal-progress", t.v("?g"), t.v("?cur")),
      clause("num", t.v("?target")),
      clause("num", t.v("?cur")),
      clause("lt-half", t.v("?cur"), t.v("?target")),
    ],
    description: "Tasks linked to lagging goals",
  })
  // materialize lt-half(cur, target) for 0..200
  for (let target = 1; target <= 200; target++) {
    for (let cur = 0; cur < Math.floor(target * 0.5 + 0.0001); cur++) {
      kb.addFact("lt-half", t.n(cur), t.n(target))
    }
  }

  // context-aware boost: morning-focus prefers high alignment
  kb.addRule({
    head: clause("boost", t.v("?t"), t.n(10), t.s("morning-focus")),
    body: [clause("context", t.s("morning-focus")), clause("prioritize", t.v("?t"))],
    description: "Morning boost for high-alignment tasks",
  })
  // midday deep boost for goal-critical
  kb.addRule({
    head: clause("boost", t.v("?t"), t.n(12), t.s("midday-deep")),
    body: [clause("context", t.s("midday-deep")), clause("goal-critical", t.v("?t"))],
    description: "Midday boost for goal-critical tasks",
  })
  // admin window de-boost for high alignment (save energy)
  kb.addRule({
    head: clause("penalty", t.v("?t"), t.n(8), t.s("admin-window")),
    body: [clause("context", t.s("admin-window")), clause("prioritize", t.v("?t"))],
    description: "Admin window penalty for deep work",
  })

  return kb
}

export function inferSuggestions(input: SchedulerInput): ScheduledSuggestion[] {
  const kb = buildKnowledgeBase(input)

  // Gather candidate tasks: pending and not distractions
  const pendingSubs = kb.query(clause("task-status", t.v("?t"), t.s("pending")))
  const avoidSubs = new Set(
    kb.query(clause("avoid", t.v("?t"))).map((s) => s["?t"] && (s["?t"] as any).value).filter(Boolean)
  )

  const scores: Record<number, { score: number; tags: string[]; reasons: string[] }> = {}

  function getIdFromSubst(sub: Substitution, key: string): number | null {
    const term = sub[key]
    if (!term || term.kind !== "num") return null
    return term.value
  }

  // Base score from alignment
  for (const s of pendingSubs) {
    const id = getIdFromSubst(s, "?t")
    if (id == null) continue
    if (avoidSubs.has(id)) continue
    const alignS = kb.query(clause("task-align", t.n(id), t.v("?sc")))
    const base = alignS.length && alignS[0]["?sc"] && (alignS[0]["?sc"] as any).value ? (alignS[0]["?sc"] as any).value : 0
    scores[id] = { score: base, tags: [], reasons: ["alignment"] }
  }

  // Apply boosts
  const boostSubs = kb.query(clause("boost", t.v("?t"), t.v("?delta"), t.v("?tag")))
  for (const s of boostSubs) {
    const id = getIdFromSubst(s, "?t")
    const delta = s["?delta"]?.kind === "num" ? s["?delta"].value : 0
    const tag = s["?tag"]?.kind === "sym" ? s["?tag"].value : "boost"
    if (id == null) continue
    if (!scores[id]) continue
    scores[id].score += delta
    scores[id].tags.push(tag)
    scores[id].reasons.push(`+${delta} ${tag}`)
  }

  // Apply penalties
  const penaltySubs = kb.query(clause("penalty", t.v("?t"), t.v("?delta"), t.v("?tag")))
  for (const s of penaltySubs) {
    const id = getIdFromSubst(s, "?t")
    const delta = s["?delta"]?.kind === "num" ? s["?delta"].value : 0
    const tag = s["?tag"]?.kind === "sym" ? s["?tag"].value : "penalty"
    if (id == null) continue
    if (!scores[id]) continue
    scores[id].score -= delta
    scores[id].tags.push(tag)
    scores[id].reasons.push(`-${delta} ${tag}`)
  }

  // Goal-critical tag
  const criticalSubs = kb.query(clause("goal-critical", t.v("?t")))
  for (const s of criticalSubs) {
    const id = getIdFromSubst(s, "?t")
    if (id == null) continue
    if (!scores[id]) continue
    scores[id].tags.push("goal-critical")
    scores[id].reasons.push("goal-critical")
    scores[id].score += 5
  }

  const suggestions: ScheduledSuggestion[] = Object.entries(scores)
    .map(([idStr, d]) => ({
      taskId: Number(idStr),
      score: Math.round(d.score),
      tags: Array.from(new Set(d.tags)),
      reason: d.reasons.join(", ")
    }))
    .sort((a, b) => b.score - a.score)

  return suggestions
}

