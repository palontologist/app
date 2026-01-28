import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getGoals } from "@/app/actions/goals"
import GoalsPage from "@/components/goals-page"

function serializeGoal(goal: any) {
  const toISO = (value: unknown) => {
    if (!value) return null
    const date = new Date(value as string | number | Date)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  }

  return {
    id: Number(goal.id),
    title: goal.title ?? "Untitled Goal",
    description: goal.description ?? null,
    category: goal.category ?? null,
    type: goal.type ?? goal.goalType ?? null,
    current_value: Number(goal.current_value ?? goal.currentValue ?? 0),
    target_value:
      goal.target_value == null && goal.targetValue == null
        ? null
        : Number(goal.target_value ?? goal.targetValue ?? 0),
    unit: goal.unit ?? null,
    alignment_score: goal.alignment_score ?? goal.alignmentScore ?? null,
    alignment_category: goal.alignment_category ?? goal.alignmentCategory ?? null,
    deadline: toISO(goal.deadline),
    created_at: toISO(goal.created_at ?? goal.createdAt) ?? new Date().toISOString(),
    updated_at: toISO(goal.updated_at ?? goal.updatedAt) ?? new Date().toISOString(),
  }
}

export default async function GoalsRoute() {
  const session = await auth()
  if (!session.userId) {
    redirect("/sign-in")
  }

  const goalsResult = await getGoals()
  const goals = goalsResult.success && Array.isArray(goalsResult.goals)
    ? goalsResult.goals.map(serializeGoal)
    : []

  return <GoalsPage initialGoals={goals} />
}
