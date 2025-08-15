"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, Target, Lightbulb } from "lucide-react"

type GroqInsightsProps = {
  insights: {
    overall_alignment_score: number
    key_insights: string[]
    recommendations: string[]
    celebration: string
    focus_area: string
  } | null
  loading?: boolean
}

export default function GroqInsightsCard({ insights, loading = false }: GroqInsightsProps) {
  if (loading) {
    return (
      <Card className="border-l-4 border-l-[#28A745]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-[#28A745] animate-pulse" />
            Groq AI is analyzing...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights) return null

  return (
    <Card className="border-l-4 border-l-[#28A745]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-[#28A745]" />
          Weekly Groq Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#28A745]/10 to-[#28A745]/5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#28A745]" />
            <span className="text-sm font-medium">Overall Alignment Score</span>
          </div>
          <Badge className="bg-[#28A745] text-white text-lg px-3 py-1">{insights.overall_alignment_score}%</Badge>
        </div>

        {/* Celebration */}
        <div className="rounded-lg bg-[#28A745]/5 p-3 border border-[#28A745]/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎉</span>
            <h3 className="text-sm font-medium text-[#28A745]">Celebration</h3>
          </div>
          <p className="text-sm text-[#374151]">{insights.celebration}</p>
        </div>

        {/* Focus Area */}
        <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-700">Priority Focus</h3>
          </div>
          <p className="text-sm text-[#374151]">{insights.focus_area}</p>
        </div>

        {/* Key Insights */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#28A745]" />
            <h3 className="text-sm font-medium text-[#374151]">Key Insights</h3>
          </div>
          {insights.key_insights?.map((insight, index) => (
            <div key={index} className="flex items-start gap-2 p-2 rounded border-l-2 border-[#28A745]/30 bg-gray-50">
              <div className="w-1.5 h-1.5 rounded-full bg-[#28A745] mt-2 flex-shrink-0"></div>
              <p className="text-sm text-[#374151]">{insight}</p>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#374151]">Groq Recommendations:</h3>
          {insights.recommendations?.map((rec, index) => (
            <div key={index} className="flex items-start gap-2 p-2 rounded bg-amber-50 border-l-2 border-amber-300">
              <span className="text-amber-600 text-xs mt-0.5">💡</span>
              <p className="text-sm text-[#374151]">{rec}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
