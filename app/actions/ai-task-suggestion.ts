"use server"

import { auth } from "@clerk/nextjs/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { z } from "zod"
import { getUser } from "@/app/actions/user"
import { getTasks } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"
import { getValueSettings } from "@/app/actions/value-settings"
import { DEFAULT_RATES } from "@/lib/value"

const SuggestionSchema = z.object({
  taskId: z.coerce.number(),
  reason: z.string().describe("One sentence: why this task is the best next move"),
  estimatedValueDollars: z.coerce.number().describe("Estimated dollar value of completing this task"),
  valueReason: z.string().describe("Short phrase explaining the value"),
  priorityLabel: z.string().describe("e.g. 'Urgent · High impact'"),
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

    const { text } = await generateText({
      model: groq("moonshotai/kimi-k2-instruct-0905"),
      system: systemPrompt,
      prompt,
      temperature: 0.2,
    })

    const cleanedText = text
      .replace(/<Thinking>[\s\S]*?<\/Thinking>/gi, "")
      .trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^[^{]*/, "")
      .replace(/[^}]*$/, "")

    let parsed = SuggestionSchema.safeParse(JSON.parse(cleanedText))
    if (!parsed.success) {
      // Fallback path for common model drift:
      // - task id returned as "ID 123" text
      // - fields slightly renamed
      // - missing numeric estimate
      const obj = JSON.parse(cleanedText) as any
      const fallbackTaskId =
        Number(obj?.taskId) ||
        Number(obj?.id) ||
        Number(String(obj?.task || "").match(/\d+/)?.[0]) ||
        null

      const fallback = {
        taskId: fallbackTaskId ?? taskList[0].id,
        reason: String(obj?.reason ?? obj?.why ?? "This task best matches your current goals and alignment."),
        estimatedValueDollars: Number(obj?.estimatedValueDollars ?? obj?.value ?? 100),
        valueReason: String(obj?.valueReason ?? obj?.value_reason ?? "Estimated from your value settings and alignment."),
        priorityLabel: String(obj?.priorityLabel ?? obj?.priority ?? "High impact"),
      }
      parsed = SuggestionSchema.safeParse(fallback)
      if (!parsed.success) {
        // Final deterministic fallback: highest alignment task
        const fallbackTask = [...taskList].sort((a, b) => b.alignmentScore - a.alignmentScore)[0]
        return {
          success: true,
          suggestion: {
            taskId: fallbackTask.id,
            reason: "This task has the strongest alignment score and should be completed next.",
            estimatedValueDollars: 120,
            valueReason: "Estimated from your configured rates and alignment.",
            priorityLabel: "High alignment",
          },
        }
      }
    }
    const result = { object: parsed.data }

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
