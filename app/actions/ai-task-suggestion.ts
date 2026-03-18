"use server"

import { auth } from "@clerk/nextjs/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"
import { getUser } from "@/app/actions/user"
import { getTasks } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"
import { getValueSettings } from "@/app/actions/value-settings"
import { DEFAULT_RATES } from "@/lib/value"

const SuggestionSchema = z.object({
  taskId: z.number(),
  reason: z.string().max(120).describe("One sentence: why this task is the best next move"),
  estimatedValueDollars: z.number().describe("Estimated dollar value of completing this task"),
  valueReason: z.string().max(80).describe("Short phrase explaining the value: e.g. 'Based on your rate · sales category · mission weight'"),
  priorityLabel: z.string().max(30).describe("e.g. 'Urgent · High impact'"),
})

export type AISuggestion = z.infer<typeof SuggestionSchema>

export async function getAISuggestedTask(
  skippedIds: number[] = []
): Promise<{ success: boolean; suggestion: AISuggestion | null; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, suggestion: null, error: "Unauthenticated" }

    const [userRes, tasksRes, goalsRes, ratesRes] = await Promise.all([
      getUser(),
      getTasks(),
      getGoals(),
      getValueSettings(),
    ])

    const user = userRes.success ? userRes.user : null
    const allTasks = (tasksRes.success ? tasksRes.tasks : []) as any[]
    const goals = (goalsRes.success ? goalsRes.goals : []) as any[]
    const rates = (ratesRes.rates ?? DEFAULT_RATES) as any

    // Only consider incomplete, non-skipped tasks
    const pending = allTasks.filter(
      (t: any) => !t.completed && !skippedIds.includes(t.id)
    )
    if (!pending.length) return { success: false, suggestion: null, error: "No pending tasks" }

    // Build task list for AI context (cap at 15 to keep prompt small)
    const taskList = pending.slice(0, 15).map((t: any) => ({
      id: t.id,
      title: t.title,
      alignmentScore: t.alignment_score ?? 50,
      alignmentCategory: t.alignment_category ?? "medium",
      goalId: t.goal_id,
    }))

    // Build goal titles for context
    const goalTitles = goals
      .filter((g: any) => !(g.target_value && (g.current_value ?? 0) >= g.target_value))
      .map((g: any) => `${g.title} (${Math.round(((g.current_value ?? 0) / (g.target_value || 1)) * 100)}% done)`)
      .slice(0, 5)
      .join(", ")

    const systemPrompt = `You are Greta, an AI work-methods coach for founders. 
Your job is to select the single best next task for the user to improve their work impact, mission alignment, and value generated.

User context:
- Name: ${user?.name ?? "Founder"}
- Mission: ${user?.mission ?? "Not set"}
- Focus areas: ${user?.focusAreas ?? "Not set"}
- Active goals: ${goalTitles || "None"}
- Value rates: design $${rates.design}/task, content $${rates.content}/task, sales $${rates.sales}/task, strategic $${rates.strategic}/task

Pick the task that maximises: mission alignment × urgency × value generated.
Return valid JSON matching the schema exactly. estimatedValueDollars should be calculated from rates × alignment.`

    const prompt = `Pending tasks:
${taskList.map((t) => `ID ${t.id}: "${t.title}" | alignment: ${t.alignmentScore}% (${t.alignmentCategory})`).join("\n")}

Pick the single best next task to complete.`

    const result = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: SuggestionSchema,
      system: systemPrompt,
      prompt,
    })

    // Validate the taskId exists in our list
    const validIds = taskList.map((t) => t.id)
    if (!validIds.includes(result.object.taskId)) {
      // Fall back to highest alignment
      const fallback = [...taskList].sort((a, b) => b.alignmentScore - a.alignmentScore)[0]
      result.object.taskId = fallback.id
    }

    return { success: true, suggestion: result.object }
  } catch (error) {
    console.error("AI task suggestion error:", error)
    return { success: false, suggestion: null, error: "AI unavailable" }
  }
}
