"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, MessageSquare, CheckCircle, Lightbulb, TrendingUp, Target } from "lucide-react"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { getTasks } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"
import { getUser } from "@/app/actions/user"

interface WeeklyReflectionProps {
  onReflectionComplete?: () => void
}

export default function WeeklyReflection({ onReflectionComplete }: WeeklyReflectionProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [userData, setUserData] = React.useState<any>(null)
  const [tasks, setTasks] = React.useState<any[]>([])
  const [goals, setGoals] = React.useState<any[]>([])
  const [reflection, setReflection] = React.useState({
    keyWins: "",
    mainChallenges: "",
    alignmentHighlights: "",
    improvementAreas: "",
    nextWeekFocus: "",
  })
  const [aiSummary, setAiSummary] = React.useState<string>("")

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tasksResult, goalsResult, userResult] = await Promise.all([
        getTasks(),
        getGoals(),
        getUser(),
      ])

      if (tasksResult.success) setTasks(tasksResult.tasks)
      if (goalsResult.success) setGoals(goalsResult.goals)
      if (userResult.success) setUserData(userResult.user)
    } catch (error) {
      console.error("Failed to load data:", error)
    }
  }

  const generateAISummary = async () => {
    if (!userData) return

    setLoading(true)
    try {
      const completedTasks = tasks.filter(t => t.completed)
      const highAlignmentTasks = tasks.filter(t => (t.alignment_score || 0) >= 80)
      const distractionTasks = tasks.filter(t => t.alignment_category === "distraction")

      const prompt = `
You are an AI coach helping a founder reflect on their weekly progress. Based on their reflection and data, provide encouraging, actionable insights.

User Mission: "${userData.mission || "Not defined"}"
Focus Areas: "${userData.focus_areas || "Not specified"}"

User's Reflection:
- Key Wins: ${reflection.keyWins}
- Main Challenges: ${reflection.mainChallenges}
- Alignment Highlights: ${reflection.alignmentHighlights}
- Areas for Improvement: ${reflection.improvementAreas}
- Next Week Focus: ${reflection.nextWeekFocus}

Task Data:
- Total Tasks: ${tasks.length}
- Completed Tasks: ${completedTasks.length}
- High Alignment Tasks: ${highAlignmentTasks.length}
- Distraction Tasks: ${distractionTasks.length}

Provide a concise, encouraging summary that:
1. Celebrates their wins and progress
2. Acknowledges challenges constructively
3. Reinforces their mission alignment
4. Provides 1-2 specific next steps
5. Ends with motivational encouragement

Keep it under 200 words, be specific to their mission, and maintain an encouraging tone.
`

      const { text } = await generateText({
        model: groq("moonshotai/kimi-k2-instruct-0905"),
        prompt,
        temperature: 0.3,
      })

      const cleanedText = text
        .replace(/<Thinking>[\s\S]*?<\/Thinking>/gi, "")
        .trim()
        .replace(/^["']|["']$/g, "")

      setAiSummary(cleanedText)
    } catch (error) {
      console.error("Failed to generate AI summary:", error)
      setAiSummary("Unable to generate summary at this time. Your reflection has been saved!")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    await generateAISummary()
    // Here you would save the reflection to the database
    setOpen(false)
    onReflectionComplete?.()
  }

  const currentWeek = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white">
          <MessageSquare className="mr-2 h-4 w-4" />
          Weekly Reflection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#28A745]" />
            Weekly Reflection - {currentWeek}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{tasks.filter(t => t.completed).length}</div>
              <div className="text-xs text-green-700">Tasks Completed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{tasks.filter(t => (t.alignment_score || 0) >= 80).length}</div>
              <div className="text-xs text-blue-700">High Alignment</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{tasks.filter(t => t.alignment_category === "distraction").length}</div>
              <div className="text-xs text-orange-700">Distractions</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{goals.length}</div>
              <div className="text-xs text-purple-700">Active Goals</div>
            </div>
          </div>

          {/* Reflection Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyWins" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                What were your key wins this week?
              </Label>
              <Textarea
                id="keyWins"
                placeholder="e.g., Completed the MVP launch, had great customer feedback sessions..."
                value={reflection.keyWins}
                onChange={(e) => setReflection(prev => ({ ...prev, keyWins: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainChallenges" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                What were your main challenges?
              </Label>
              <Textarea
                id="mainChallenges"
                placeholder="e.g., Time management, technical hurdles, team coordination..."
                value={reflection.mainChallenges}
                onChange={(e) => setReflection(prev => ({ ...prev, mainChallenges: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alignmentHighlights" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#28A745]" />
                What went well with mission alignment?
              </Label>
              <Textarea
                id="alignmentHighlights"
                placeholder="e.g., Focused on customer acquisition tasks, made progress on core product features..."
                value={reflection.alignmentHighlights}
                onChange={(e) => setReflection(prev => ({ ...prev, alignmentHighlights: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvementAreas" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                Areas for improvement next week?
              </Label>
              <Textarea
                id="improvementAreas"
                placeholder="e.g., Reduce time on admin tasks, be more selective about meetings..."
                value={reflection.improvementAreas}
                onChange={(e) => setReflection(prev => ({ ...prev, improvementAreas: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextWeekFocus" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                What's your main focus for next week?
              </Label>
              <Textarea
                id="nextWeekFocus"
                placeholder="e.g., Ship the new feature, conduct user interviews, plan Q2 strategy..."
                value={reflection.nextWeekFocus}
                onChange={(e) => setReflection(prev => ({ ...prev, nextWeekFocus: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          {/* AI Summary Preview */}
          {aiSummary && (
            <Card className="border-l-4 border-l-[#28A745]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[#28A745]" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#111827]">{aiSummary}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              className="flex-1 text-white bg-[#28A745] hover:bg-[#23923d]"
              disabled={loading}
            >
              {loading ? "Generating Summary..." : "Complete Reflection"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}