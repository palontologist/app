"use client"

import * as React from "react"
import { Lightbulb, TrendingUp, TrendingDown, Target } from "lucide-react"

type CircularProgressProps = {
  value?: number // 0-100
  size?: number
  strokeWidth?: number
  trackColor?: string
  indicatorColor?: string
  label?: string
  showInsights?: boolean
  tasks?: any[]
  user?: any
}

export default function CircularProgress({
  value = 72,
  size = 140,
  strokeWidth = 10,
  trackColor = "#E5E7EB",
  indicatorColor = "#28A745",
  label,
  showInsights = false,
  tasks = [],
  user,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  // Generate AI insights based on the score and tasks
  const generateInsights = () => {
    if (!showInsights || !tasks.length) return null

    const completedTasks = tasks.filter(t => t.completed).length
    const totalTasks = tasks.length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const highAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) >= 70).length
    const lowAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) < 50).length

    const insights = []

    // Score explanation
    if (clamped >= 80) {
      insights.push({
        icon: TrendingUp,
        text: `Excellent alignment! ${highAlignmentTasks} of your ${totalTasks} tasks are highly mission-aligned.`,
        type: "positive"
      })
    } else if (clamped >= 60) {
      insights.push({
        icon: Target,
        text: `Good progress! Your tasks are ${clamped}% aligned with your mission. ${highAlignmentTasks} tasks show strong alignment.`,
        type: "neutral"
      })
    } else {
      insights.push({
        icon: TrendingDown,
        text: `Room for improvement. Only ${highAlignmentTasks} of ${totalTasks} tasks are highly aligned. Consider reviewing task priorities.`,
        type: "warning"
      })
    }

    // Completion insights
    if (completionRate < 50) {
      insights.push({
        icon: Lightbulb,
        text: `Focus on completing ${Math.ceil(totalTasks * 0.3)} more tasks this week to build momentum.`,
        type: "suggestion"
      })
    }

    // Mission alignment insights
    if (user?.mission && lowAlignmentTasks > 0) {
      insights.push({
        icon: Lightbulb,
        text: `Consider how ${lowAlignmentTasks} low-alignment tasks connect to your mission: "${user.mission.substring(0, 50)}${user.mission.length > 50 ? '...' : ''}"`,
        type: "suggestion"
      })
    }

    return insights.slice(0, 2) // Limit to 2 insights
  }

  // Calculate task statistics for smart suggestions
  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const highAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) >= 70).length
  const lowAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) < 50).length

  const insights = generateInsights()

  return (
    <div className="space-y-6">
      {/* Main Progress Circle */}
      <div style={{ width: size, height: size }} className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={indicatorColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1200ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-4xl font-bold text-[#1A1A1A] mb-1">{`${clamped}%`}</div>
          <div className="text-sm text-[#6B7280] font-medium">Mission Aligned</div>
          <div className="text-xs text-[#9CA3AF] mt-1">Your work's real impact</div>
        </div>
      </div>

      {/* AI Insights Section */}
      {showInsights && insights && insights.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-500 delay-300">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-800">AI Analysis</h4>
          </div>

          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                  insight.type === 'positive'
                    ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                    : insight.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100'
                    : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-start gap-3">
                  <insight.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{insight.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
