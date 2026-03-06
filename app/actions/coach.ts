"use server"

import { auth } from "@clerk/nextjs/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { getUser } from "@/app/actions/user"
import { getTasks } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"

const groq_model = groq("llama-3.1-8b-instant")

export async function getCoachResponse(userMessage: string) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated" }

  try {
    const [userResult, tasksResult, goalsResult] = await Promise.all([
      getUser(),
      getTasks(),
      getGoals(),
    ])

    const user = userResult.success ? userResult.user : null
    const tasks = tasksResult.success ? tasksResult.tasks : []
    const goals = goalsResult.success ? goalsResult.goals : []

    const completedTasks = tasks.filter((t: any) => t.completed).length
    const activeTasks = tasks.filter((t: any) => !t.completed).length
    const activeGoals = goals.filter((g: any) => {
      const cur = Number(g.current_value || 0)
      const tar = g.target_value != null ? Number(g.target_value) : null
      return tar == null ? cur === 0 : cur < tar
    }).length

    const systemPrompt = `You are greta, an AI coach for mission-driven founders and freelancers. You help users stay focused on their mission, achieve their goals, and build habits that compound into impact.

User context:
- Name: ${user?.name || "Founder"}
- Mission: ${user?.mission || "Not set yet"}
- World Vision: ${user?.worldVision || "Not set yet"}
- Focus Areas: ${user?.focusAreas || "Not set yet"}
- Active Tasks: ${activeTasks}
- Completed Tasks: ${completedTasks}
- Active Goals: ${activeGoals}
- Total Goals: ${goals.length}

Your coaching style:
- Be encouraging, direct, and mission-focused
- Ask clarifying questions to understand the user's situation
- Offer actionable advice tailored to their mission and goals
- Help them prioritize ruthlessly: focus on high-alignment work
- Keep responses concise (2-4 sentences) unless a detailed breakdown is needed
- Always anchor advice back to their mission`

    const result = await generateText({
      model: groq_model,
      system: systemPrompt,
      prompt: userMessage,
    })

    return { success: true, response: result.text }
  } catch (error) {
    console.error("Coach error:", error)
    return {
      success: false,
      error: "Coach is temporarily unavailable. Please try again.",
    }
  }
}
