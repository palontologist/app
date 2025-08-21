import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import type { Task } from "@/lib/types"

export async function analyzeTaskAlignment(
  taskTitle: string,
  taskDescription: string,
  userMission: string,
  worldVision: string,
) {
  try {
    const prompt = `
You are an AI assistant that analyzes task alignment. Respond ONLY with valid JSON, no other text.

Task: "${taskTitle}"
Description: "${taskDescription}"
Mission: "${userMission}"
Vision: "${worldVision}"

Analyze alignment and respond with this exact JSON structure:
{
  "alignment_score": [number 0-100],
  "alignment_category": "[high|medium|low|distraction]",
  "analysis": "[brief explanation]",
  "suggestions": "[actionable suggestion]"
}
`

    const { text } = await generateText({
      model: groq("deepseek-r1-distill-llama-70b"),
      prompt,
      temperature: 0.2,
    })

    // Extract reasoning and JSON separately
    const reasoningMatch = text.match(/<Thinking>([\s\S]*?)<\/Thinking>/i)
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : null

    // Clean the response to get just the JSON
    const cleanedText = text
      .replace(/<Thinking>[\s\S]*?<\/Thinking>/gi, "") // Remove reasoning tokens
      .trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^[^{]*/, "") // Remove any text before the first \{
      .replace(/[^}]*$/, "") // Remove any text after the last \}

    try {
      const result = JSON.parse(cleanedText)
      // Add reasoning to the result if available
      if (reasoning) {
        result.ai_reasoning = reasoning
      }
      return result
    } catch (parseError) {
      console.error("JSON parse error, raw response:", text)
      throw parseError
    }
  } catch (error) {
    console.error("AI analysis failed:", error)
    return {
      alignment_score: 50,
      alignment_category: "medium",
      analysis: "Unable to analyze task alignment at this time.",
      suggestions: "Consider how this task directly contributes to your mission.",
    }
  }
}

export async function generatePersonalizedInsights(tasks: Task[], userMission: string) {
  try {
    const completedTasks = tasks.filter((t) => t.completed)
    const highAlignmentTasks = tasks.filter((t) => (t.alignment_score || 0) >= 80)
    const distractionTasks = tasks.filter((t) => t.alignment_category === "distraction")
    const pendingTasks = tasks.filter((t) => !t.completed)

    const avgAlignment =
      tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.alignment_score || 0), 0) / tasks.length) : 0

    // Create specific, actionable insights based on actual task data
    const specificInsights = {
      overall_alignment_score: avgAlignment,
      high_impact_activities: highAlignmentTasks.slice(0, 3).map((t) => t.title),
      main_distractions: distractionTasks.slice(0, 3).map((t) => t.title),
      pending_high_value: pendingTasks
        .filter((t) => (t.alignment_score || 0) >= 80)
        .slice(0, 2)
        .map((t) => t.title),
      completion_rate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      specific_recommendations: [] as string[],
      celebration: "",
      focus_area: "",
      // New: structured focus areas split by horizon
      focus_by_horizon: {
        short_term: [] as string[],
        long_term: [] as string[],
      },
    }

    // Generate specific recommendations based on patterns
    if (distractionTasks.length > 0) {
      specificInsights.specific_recommendations.push(`Consider delegating or eliminating: ${distractionTasks[0].title}`)
    }

    if (pendingTasks.filter((t) => (t.alignment_score || 0) >= 80).length > 0) {
      const topPending = pendingTasks.filter((t) => (t.alignment_score || 0) >= 80)[0]
      specificInsights.specific_recommendations.push(`Prioritize completing: ${topPending.title}`)
    }

    if (highAlignmentTasks.length > 0) {
      specificInsights.celebration = `Excellent work on "${highAlignmentTasks[0].title}" - this directly advances your mission!`
    } else {
      specificInsights.celebration = "Ready to start your mission-aligned journey!"
    }

    // Heuristic horizon split: short-term = tasks that contain verbs like "email, call, draft, fix"; long-term = tasks with nouns like "strategy, roadmap, hiring"
    const shortTermKeywords = ["email", "call", "draft", "write", "fix", "ship", "deploy", "reach", "follow up", "demo", "update"]
    const longTermKeywords = ["strategy", "roadmap", "hiring", "branding", "fundraising", "research", "architecture", "planning"]
    for (const t of pendingTasks.slice(0, 10)) {
      const title = (t.title || '').toLowerCase()
      if (shortTermKeywords.some(k => title.includes(k))) specificInsights.focus_by_horizon.short_term.push(t.title)
      else if (longTermKeywords.some(k => title.includes(k))) specificInsights.focus_by_horizon.long_term.push(t.title)
    }

    // Try AI enhancement if we have enough data
    if (tasks.length > 2) {
      try {
        const taskList = tasks
          .map((t) => `"${t.title}" (${t.alignment_score}% aligned, ${t.completed ? "completed" : "pending"})`)
          .join(", ")

        const prompt = `
Analyze this founder's tasks and mission and provide highly personalized insights. Respond with valid JSON only.

Mission: "${userMission}"
Tasks: ${taskList}
High-impact completed: ${highAlignmentTasks.map((t) => t.title).join(", ")}
Distractions: ${distractionTasks.map((t) => t.title).join(", ")}

The insights must:
- Directly reference the mission and the user's actual tasks
- Include one short-term focus and one long-term focus tied to the mission
- Provide 2-3 concrete next actions (verbs + objects)

Respond with this JSON structure:
{
  "key_insights": ["specific insight about their mission & tasks"],
  "recommendations": ["do X by Y because Z", "delegate A to free time for B"],
  "focus_area": "single theme (e.g., customer acquisition)",
  "short_term": ["next 48h actions"],
  "long_term": ["1-4 week initiatives"]
}
`

        const { text } = await generateText({
          model: groq("deepseek-r1-distill-llama-70b"),
          prompt,
          temperature: 0.3,
        })

        const reasoningMatch = text.match(/<Thinking>([\s\S]*?)<\/Thinking>/i)
        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : null

        const cleanedText = text
          .replace(/<Thinking>[\s\S]*?<\/Thinking>/gi, "")
          .trim()
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .replace(/^[^{]*/, "")
          .replace(/[^}]*$/, "")

        const aiInsights = JSON.parse(cleanedText)

        return {
          ...specificInsights,
          key_insights: aiInsights.key_insights || [
            `Focus on completing: ${specificInsights.pending_high_value[0] || "high-alignment tasks"}`,
          ],
          recommendations: aiInsights.recommendations || specificInsights.specific_recommendations,
          focus_area: aiInsights.focus_area || "Complete your highest-alignment pending tasks",
          focus_by_horizon: {
            short_term: aiInsights.short_term || specificInsights.focus_by_horizon.short_term,
            long_term: aiInsights.long_term || specificInsights.focus_by_horizon.long_term,
          },
          ai_reasoning: reasoning,
        }
      } catch (aiError) {
        console.error("AI insights failed, using specific analysis:", aiError)
      }
    }

    // Fallback with specific task-based insights
    return {
      ...specificInsights,
      key_insights:
        specificInsights.specific_recommendations.length > 0
          ? specificInsights.specific_recommendations
          : ["Add more tasks to get personalized insights"],
      recommendations:
        specificInsights.pending_high_value.length > 0
          ? [`Focus on: ${specificInsights.pending_high_value[0]}`]
          : ["Add high-alignment tasks to your list"],
      focus_area:
        specificInsights.pending_high_value.length > 0
          ? `Complete: ${specificInsights.pending_high_value[0]}`
          : "Add tasks aligned with your mission",
    }
  } catch (error) {
    console.error("Insights generation failed:", error)
    return {
      overall_alignment_score: 0,
      high_impact_activities: [],
      main_distractions: [],
      pending_high_value: [],
      completion_rate: 0,
      key_insights: ["Add tasks to get personalized insights"],
      recommendations: ["Start by adding your first task"],
      celebration: "Welcome to your alignment journey!",
      focus_area: "Begin by defining your daily tasks",
    }
  }
}

export async function generateDashboardAlignmentSummary(
  tasks: Task[],
  goals: any[],
  userMission: string,
  userFocusAreas: string | null,
  userOnboarded: boolean
) {
  try {
    if (tasks.length === 0 && goals.length === 0) {
      return userOnboarded 
        ? "You've onboarded but haven't added any tasks or goals yet. Your alignment score is 0% because there's nothing to measure."
        : "Complete onboarding and add your first task to see AI alignment analysis."
    }

    const completedTasks = tasks.filter((t) => t.completed)
    const highAlignmentTasks = tasks.filter((t) => (t.alignment_score || 0) >= 80)
    const distractionTasks = tasks.filter((t) => t.alignment_category === "distraction")
    const avgAlignment = tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.alignment_score || 0), 0) / tasks.length) : 0
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
    
    const goalsOnTrack = goals.filter(g => (g.current_value || 0) >= (g.target_value || 1) * 0.5).length
    const goalsStagnant = goals.filter(g => (g.current_value || 0) === 0).length

    // Generate brutally honest AI summary
    if (tasks.length > 1 || goals.length > 0) {
      try {
        const taskSummary = tasks.slice(0, 5).map((t) => 
          `"${t.title}" (${t.alignment_score || 0}% aligned, ${t.completed ? "done" : "pending"})`
        ).join(", ")
        
        const goalSummary = goals.slice(0, 3).map((g) => 
          `"${g.title}" (${g.current_value || 0}/${g.target_value || 1} ${g.unit || "items"})`
        ).join(", ")

        const prompt = `
You are a brutally honest AI coach analyzing a founder's task and goal alignment. Be direct, specific, and actionable.

Context:
- User mission: "${userMission}"
- Focus areas: "${userFocusAreas || "Not specified"}"
- Onboarded: ${userOnboarded ? "Yes" : "No"}
- Tasks: ${taskSummary || "None"}
- Goals: ${goalSummary || "None"}
- Task completion rate: ${completionRate}%
- Average alignment: ${avgAlignment}%
- Goals on track: ${goalsOnTrack}/${goals.length}

Write a 1-2 sentence brutally honest assessment that:
1. States the current alignment score bluntly
2. Identifies the biggest problem (low completion, poor alignment, or lack of goals)
3. Gives one specific action to improve
4. References their onboarding context if relevant

Be direct but constructive. No sugar-coating, no vague statements. Focus on actionable reality.

Example tone: "Your 45% alignment score reflects scattered priorities - only 2 of 8 tasks actually advance your mission. Complete the 3 high-impact pending tasks before adding more distractions."

Respond with just the assessment text, no JSON or formatting.
`

        const { text } = await generateText({
          model: groq("deepseek-r1-distill-llama-70b"),
          prompt,
          temperature: 0.1,
        })

        // Clean up the response more thoroughly
        const cleanedText = text
          .replace(/<Thinking>[\s\S]*?<\/Thinking>/gi, "") // Remove thinking tags
          .replace(/<think>[\s\S]*?<\/think>/gi, "") // Remove lowercase thinking tags
          .trim()
          .replace(/^["']|["']$/g, "") // Remove quotes
          .replace(/\n/g, " ") // Single line
          .replace(/\s+/g, " ") // Normalize whitespace
          .substring(0, 200) // Keep it concise

        return cleanedText || getFallbackSummary(avgAlignment, completionRate, tasks.length, goals.length, distractionTasks.length)
      } catch (aiError) {
        console.error("AI summary failed:", aiError)
        return getFallbackSummary(avgAlignment, completionRate, tasks.length, goals.length, distractionTasks.length)
      }
    }

    return getFallbackSummary(avgAlignment, completionRate, tasks.length, goals.length, distractionTasks.length)
  } catch (error) {
    console.error("Dashboard alignment summary failed:", error)
    return "Unable to analyze alignment - add tasks and goals to get AI insights."
  }
}

function getFallbackSummary(avgAlignment: number, completionRate: number, taskCount: number, goalCount: number, distractionCount: number): string {
  if (taskCount === 0) {
    return "0% alignment score - you have no tasks to analyze. Add your first mission-aligned task to start tracking progress."
  }
  
  if (avgAlignment < 50) {
    return `${avgAlignment}% alignment score indicates most tasks don't advance your mission. Focus on fewer, higher-impact activities.`
  }
  
  if (completionRate < 30) {
    return `${avgAlignment}% alignment but only ${completionRate}% completion rate. You're choosing the right tasks but not finishing them.`
  }
  
  if (distractionCount > taskCount / 2) {
    return `${avgAlignment}% alignment score dragged down by ${distractionCount} distraction tasks. Eliminate or delegate the busywork.`
  }
  
  if (goalCount === 0) {
    return `${avgAlignment}% task alignment but no goals set. Your daily work needs bigger objectives to drive toward.`
  }
  
  if (avgAlignment >= 80 && completionRate >= 70) {
    return `Strong ${avgAlignment}% alignment with ${completionRate}% completion rate. Maintain this focus and consider scaling up your impact.`
  }
  
  return `${avgAlignment}% alignment with ${completionRate}% completion. Balance task quality with consistent execution.`
}

export async function generateWeeklyInsights(tasks: Task[], userMission: string, worldVision: string) {
  try {
    const completedTasks = tasks.filter((t) => t.completed)
    const highAlignmentTasks = tasks.filter((t) => (t.alignment_score || 0) >= 80)
    const distractionTasks = tasks.filter((t) => t.alignment_category === "distraction")

    const avgAlignment =
      tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.alignment_score || 0), 0) / tasks.length) : 0

    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

    // Generate AI-powered weekly insights
    if (tasks.length > 0) {
      try {
        const taskSummary = tasks
          .map((t) => `"${t.title}" (${t.alignment_score}% aligned, ${t.completed ? "completed" : "pending"})`)
          .join(", ")

        const prompt = `
Generate weekly insights for a founder based on their task completion and alignment. Respond with valid JSON only.

Mission: "${userMission}"
Vision: "${worldVision}"
Tasks this week: ${taskSummary}
Completion rate: ${completionRate}%
Average alignment: ${avgAlignment}%

Provide insights in this JSON structure:
{
  "weekly_summary": "brief summary of the week's progress",
  "key_wins": ["specific accomplishment", "another win"],
  "alignment_trends": "observation about mission alignment",
  "areas_for_improvement": ["specific area to improve", "another area"],
  "next_week_focus": "specific recommendation for next week",
  "motivational_message": "encouraging message based on their progress"
}
`

        const { text } = await generateText({
          model: groq("deepseek-r1-distill-llama-70b"),
          prompt,
          temperature: 0.3,
        })

        const reasoningMatch = text.match(/<Thinking>([\s\S]*?)<\/Thinking>/i)
        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : null

        const cleanedText = text
          .replace(/<Thinking>[\s\S]*?<\/Thinking>/gi, "")
          .trim()
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .replace(/^[^{]*/, "")
          .replace(/[^}]*$/, "")

        const aiInsights = JSON.parse(cleanedText)

        return {
          ...aiInsights,
          completion_rate: completionRate,
          average_alignment: avgAlignment,
          total_tasks: tasks.length,
          completed_tasks: completedTasks.length,
          high_alignment_tasks: highAlignmentTasks.length,
          distraction_tasks: distractionTasks.length,
          ai_reasoning: reasoning,
        }
      } catch (aiError) {
        console.error("AI weekly insights failed:", aiError)
      }
    }

    // Fallback insights based on task data
    return {
      weekly_summary: `Completed ${completedTasks.length} of ${tasks.length} tasks with ${avgAlignment}% average alignment`,
      key_wins: highAlignmentTasks.slice(0, 2).map((t) => t.title),
      alignment_trends:
        avgAlignment >= 70 ? "Strong alignment with your mission this week" : "Room to improve mission alignment",
      areas_for_improvement:
        distractionTasks.length > 0
          ? [`Reduce time on: ${distractionTasks[0].title}`]
          : ["Focus on higher-impact activities"],
      next_week_focus:
        highAlignmentTasks.length > 0
          ? `Continue momentum on ${highAlignmentTasks[0].title}`
          : "Identify high-alignment tasks for your mission",
      motivational_message:
        completionRate >= 70
          ? "Great progress this week! Keep up the momentum."
          : "Every step forward counts. Focus on your highest-impact tasks.",
      completion_rate: completionRate,
      average_alignment: avgAlignment,
      total_tasks: tasks.length,
      completed_tasks: completedTasks.length,
      high_alignment_tasks: highAlignmentTasks.length,
      distraction_tasks: distractionTasks.length,
    }
  } catch (error) {
    console.error("Weekly insights generation failed:", error)
    return {
      weekly_summary: "Unable to generate insights at this time",
      key_wins: [],
      alignment_trends: "Add more tasks to see alignment trends",
      areas_for_improvement: ["Start tracking your daily tasks"],
      next_week_focus: "Begin by adding tasks aligned with your mission",
      motivational_message: "Welcome to your productivity journey!",
      completion_rate: 0,
      average_alignment: 0,
      total_tasks: 0,
      completed_tasks: 0,
      high_alignment_tasks: 0,
      distraction_tasks: 0,
    }
  }
}
