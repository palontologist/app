"use client"

import * as React from "react"
import { Loader2, Sparkles } from "lucide-react"

const inspirationalQuotes = [
  "Every aligned action moves you closer to your vision.",
  "Focus is the bridge between dreams and reality.",
  "Your mission is your compass in the chaos of daily work.",
  "Small consistent steps create extraordinary outcomes.",
  "Alignment today creates impact tomorrow.",
  "Purpose-driven work creates lasting change.",
  "Your daily choices shape your ultimate destiny.",
  "Mission clarity transforms ordinary tasks into meaningful work.",
]

export default function PageTransition() {
  const [quote] = React.useState(inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)])

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="flex items-center justify-center">
          <div className="relative">
            <Sparkles className="h-8 w-8 text-[#28A745] animate-pulse" />
            <Loader2 className="h-4 w-4 text-[#28A745] animate-spin absolute top-2 left-2" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#28A745] italic">"{quote}"</p>
          <p className="text-xs text-[#6B7280]">Loading your personalized insights...</p>
        </div>
      </div>
    </div>
  )
}
