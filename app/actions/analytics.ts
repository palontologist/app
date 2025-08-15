"use server"

import { mockData } from "@/lib/types"

export async function getAlignmentChartData() {
  try {
    // Generate last 7 days with mock data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        day: date.toLocaleDateString("en", { weekday: "short" }),
        date: date.toISOString().split("T")[0],
        aligned: Math.floor(Math.random() * 60) + 40, // Random 40-100
        distraction: Math.floor(Math.random() * 30) + 10, // Random 10-40
        hasData: true,
      }
    })

    return last7Days
  } catch (error) {
    console.error("Failed to get alignment chart data:", error)
    return []
  }
}

export async function getRealisticMetrics() {
  try {
    // Calculate metrics from mock data
    const completedTasks = mockData.tasks.filter((t) => t.completed).length
    const totalTasks = mockData.tasks.length
    const alignedMinutes = mockData.workSessions
      .filter((s) => s.alignment_category === "high" || s.alignment_category === "medium")
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    const alignedHours = Math.round((alignedMinutes / 60) * 100) / 100

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weeklyCompletions = mockData.tasks.filter(
      (t) => t.completed && new Date(t.completed_at || 0) > weekAgo,
    ).length

    const metrics = {
      // Mock founder onboarding metric
      founders_onboarded: {
        current: 23,
        target: 100,
        unit: "founders",
        description: "Founders onboarded to your platform",
        calculation: "23 founders currently using your platform",
        category: "impact",
        manual_entry: false,
      },

      // Real mission-aligned work hours from mock data
      mission_aligned_hours: {
        current: alignedHours,
        target: 1000,
        unit: "hours",
        description: "Hours spent on high/medium alignment work",
        calculation: `${alignedHours} hours from logged work sessions`,
        category: "productivity",
        manual_entry: false,
      },

      // Real task completion rate from mock data
      task_completion_rate: {
        current: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        target: 85,
        unit: "percent",
        description: "Percentage of tasks you complete",
        calculation: `${completedTasks} completed ÷ ${totalTasks} total tasks`,
        category: "productivity",
        manual_entry: false,
      },

      // Real weekly productivity from mock data
      weekly_productivity: {
        current: weeklyCompletions,
        target: 15,
        unit: "tasks",
        description: "Tasks completed this week",
        calculation: `${weeklyCompletions} tasks completed in the last 7 days`,
        category: "productivity",
        manual_entry: false,
      },

      // Mock revenue metric
      monthly_revenue: {
        current: 12500,
        target: 50000,
        unit: "USD",
        description: "Monthly recurring revenue",
        calculation: "Based on current subscription tiers",
        category: "business",
        manual_entry: true,
      },
    }

    // Add goals as trackable metrics
    mockData.goals.forEach((goal) => {
      const goalKey = `goal_${goal.id}`
      metrics[goalKey] = {
        current: goal.current_value || 0,
        target: goal.target_value || 100,
        unit: goal.unit || "units",
        description: goal.description || goal.title || "Personal goal",
        calculation: "Personal goal - update manually",
        category: "goals",
        manual_entry: true,
        id: goal.id,
        title: goal.title,
        deadline: goal.deadline,
      }
    })

    return metrics
  } catch (error) {
    console.error("Failed to get realistic metrics:", error)
    return {
      founders_onboarded: {
        current: 0,
        target: 100,
        unit: "founders",
        description: "Add tasks and work sessions to see metrics",
        calculation: "No data available yet",
        category: "impact",
        manual_entry: false,
      },
    }
  }
}

export async function updateManualMetric(metricId: number, newValue: number) {
  try {
    // For goals, update the goal directly
    const goal = mockData.goals.find((g) => g.id === metricId)
    if (goal) {
      goal.current_value = newValue
      goal.updated_at = new Date()
      return { success: true, metric: goal }
    }

    // For other metrics, this would update a manual metrics store
    // For now, just return success
    return { success: true, metric: { id: metricId, current_value: newValue } }
  } catch (error) {
    console.error("Failed to update manual metric:", error)
    return { success: false, error: "Failed to update metric" }
  }
}

export async function createManualMetric(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = (formData.get("description") as string) || ""
    const currentValue = Number.parseInt(formData.get("currentValue") as string) || 0
    const targetValue = Number.parseInt(formData.get("targetValue") as string) || 100
    const unit = (formData.get("unit") as string) || "units"

    if (!name.trim()) {
      return { success: false, error: "Metric name is required" }
    }

    // In a real app, this would create a manual metric
    // For now, just return success with mock data
    const metric = {
      id: Date.now(), // Simple ID generation
      metric_name: name,
      current_value: currentValue,
      target_value: targetValue,
      unit,
      description,
    }

    return { success: true, metric }
  } catch (error) {
    console.error("Failed to create manual metric:", error)
    return { success: false, error: "Failed to create metric" }
  }
}
