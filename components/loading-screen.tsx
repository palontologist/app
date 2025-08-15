"use client"

import * as React from "react"
import { Loader2, Sparkles, Target, TrendingUp } from "lucide-react"

const motivationalQuotes = [
  "Every aligned action moves you closer to your vision.",
  "Focus is the bridge between dreams and reality.",
  "Your mission is your compass in the chaos of daily work.",
  "Small consistent steps create extraordinary outcomes.",
  "Alignment today creates impact tomorrow.",
  "Purpose-driven work creates lasting change.",
  "Your daily choices shape your ultimate destiny.",
  "Mission clarity transforms ordinary tasks into meaningful work.",
  "Progress, not perfection, is the goal.",
  "Consistency beats intensity in the long run.",
  "Your future self will thank you for today's aligned actions.",
  "Every task is an opportunity to advance your mission.",
]

const loadingMessages = [
  "Analyzing your alignment patterns...",
  "Calculating your impact metrics...",
  "Generating personalized insights...",
  "Loading your mission dashboard...",
  "Preparing your focus report...",
  "Updating your progress data...",
]

type LoadingScreenProps = {
  message?: string
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const [quote] = React.useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)])
  const [loadingMessage] = React.useState(
    message || loadingMessages[Math.floor(Math.random() * loadingMessages.length)],
  )

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        {/* Animated Icons */}
        <div className="flex items-center justify-center space-x-2">
          <div className="relative">
            <Target className="h-8 w-8 text-[#28A745] animate-pulse" />
            <Loader2 className="h-4 w-4 text-[#28A745] animate-spin absolute top-2 left-2" />
          </div>
          <Sparkles className="h-6 w-6 text-[#28A745] animate-bounce" />
          <TrendingUp className="h-6 w-6 text-[#28A745] animate-pulse" />
        </div>

        {/* Loading Message */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#28A745]">{loadingMessage}</p>
          <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-[#28A745] rounded-full animate-pulse" style={{ width: "60%" }}></div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#374151] italic">"{quote}"</p>
          <p className="text-xs text-[#6B7280]">Stay focused on what matters most</p>
        </div>
      </div>
    </div>
  )
}
