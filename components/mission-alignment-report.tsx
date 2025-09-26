"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, TrendingUp, Target, CheckCircle, AlertCircle, Calendar, Download, Share } from "lucide-react"
import { getHistoricalAlignmentData } from "@/app/actions/analytics"
import { generateWeeklyInsights } from "@/lib/ai"
import { getTasks } from "@/app/actions/tasks"
import { getGoals } from "@/app/actions/goals"
import { getUser } from "@/app/actions/user"

interface MissionAlignmentReportProps {
  reportType?: 'weekly' | 'monthly'
  onReportGenerated?: (report: any) => void
}

export default function MissionAlignmentReport({ reportType = 'weekly', onReportGenerated }: MissionAlignmentReportProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [report, setReport] = React.useState<any>(null)
  const [userData, setUserData] = React.useState<any>(null)
  const [tasks, setTasks] = React.useState<any[]>([])
  const [goals, setGoals] = React.useState<any[]>([])

  const generateReport = async () => {
    setLoading(true)
    try {
      const [tasksResult, goalsResult, userResult] = await Promise.all([
        getTasks(),
        getGoals(),
        getUser(),
      ])

      if (tasksResult.success) setTasks(tasksResult.tasks)
      if (goalsResult.success) setGoals(goalsResult.goals)
      if (userResult.success) setUserData(userResult.user)

      // Generate AI-powered weekly insights
      const insights = await generateWeeklyInsights(
        tasksResult.success ? tasksResult.tasks : [],
        userResult.success ? userResult.user.mission || "" : "",
        userResult.success ? userResult.user.worldVision || "" : ""
      )

      // Get historical data for the period
      const days = reportType === 'weekly' ? 7 : 30
      const historicalResult = await getHistoricalAlignmentData(days)

      const reportData = {
        type: reportType,
        generatedAt: new Date().toISOString(),
        period: {
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          days
        },
        user: {
          name: userResult.success ? userResult.user.name : "Founder",
          mission: userResult.success ? userResult.user.mission : "",
          focusAreas: userResult.success ? userResult.user.focusAreas : ""
        },
        summary: {
          totalTasks: tasksResult.success ? tasksResult.tasks.length : 0,
          completedTasks: tasksResult.success ? tasksResult.tasks.filter(t => t.completed).length : 0,
          completionRate: tasksResult.success && tasksResult.tasks.length > 0
            ? Math.round((tasksResult.tasks.filter(t => t.completed).length / tasksResult.tasks.length) * 100)
            : 0,
          averageAlignment: tasksResult.success && tasksResult.tasks.length > 0
            ? Math.round(tasksResult.tasks.reduce((sum, t) => sum + (t.alignment_score || 0), 0) / tasksResult.tasks.length)
            : 0,
          highAlignmentTasks: tasksResult.success ? tasksResult.tasks.filter(t => (t.alignment_score || 0) >= 80).length : 0,
          distractionTasks: tasksResult.success ? tasksResult.tasks.filter(t => t.alignment_category === "distraction").length : 0,
          activeGoals: goalsResult.success ? goalsResult.goals.length : 0,
          completedGoals: goalsResult.success ? goalsResult.goals.filter(g => {
            const current = g.current_value || 0
            const target = g.target_value || 1
            return current >= target
          }).length : 0
        },
        insights: insights,
        historicalData: historicalResult.success ? historicalResult.data : [],
        recommendations: generateRecommendations(tasksResult.success ? tasksResult.tasks : [], insights),
        celebrations: generateCelebrations(tasksResult.success ? tasksResult.tasks : [], insights)
      }

      setReport(reportData)
      onReportGenerated?.(reportData)
    } catch (error) {
      console.error("Failed to generate report:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = (tasks: any[], insights: any) => {
    const recommendations = []

    if (insights.areas_for_improvement && insights.areas_for_improvement.length > 0) {
      recommendations.push(...insights.areas_for_improvement)
    }

    // Add data-driven recommendations
    const distractions = tasks.filter(t => t.alignment_category === "distraction")
    if (distractions.length > 0) {
      recommendations.push(`Consider delegating or eliminating: ${distractions[0].title}`)
    }

    const highAlignmentPending = tasks.filter(t => !t.completed && (t.alignment_score || 0) >= 80)
    if (highAlignmentPending.length > 0) {
      recommendations.push(`Prioritize completing high-impact tasks like: ${highAlignmentPending[0].title}`)
    }

    return recommendations.slice(0, 4)
  }

  const generateCelebrations = (tasks: any[], insights: any) => {
    const celebrations = []

    if (insights.key_wins && insights.key_wins.length > 0) {
      celebrations.push(...insights.key_wins.map(win => `🎉 ${win}`))
    }

    const completedHighAlignment = tasks.filter(t => t.completed && (t.alignment_score || 0) >= 80)
    if (completedHighAlignment.length > 0) {
      celebrations.push(`🌟 Completed ${completedHighAlignment.length} high-alignment tasks`)
    }

    if (insights.celebration) {
      celebrations.push(insights.celebration)
    }

    return celebrations.slice(0, 3)
  }

  const exportReport = () => {
    if (!report) return

    const reportText = `
MISSION ALIGNMENT REPORT
${report.type.toUpperCase()} - ${report.period.start} to ${report.period.end}

FOUNDER: ${report.user.name}
MISSION: ${report.user.mission}

SUMMARY
• Tasks: ${report.summary.completedTasks}/${report.summary.totalTasks} completed (${report.summary.completionRate}%)
• Average Alignment: ${report.summary.averageAlignment}%
• High-Alignment Tasks: ${report.summary.highAlignmentTasks}
• Distraction Tasks: ${report.summary.distractionTasks}
• Active Goals: ${report.summary.activeGoals}

KEY INSIGHTS
${report.insights.key_insights?.join('\n') || 'No insights available'}

CELEBRATIONS
${report.celebrations?.join('\n') || 'Great work this period!'}

RECOMMENDATIONS
${report.recommendations?.join('\n') || 'Keep up the excellent work!'}

NEXT WEEK FOCUS
${report.insights.next_week_focus || 'Continue building momentum'}

Report generated on ${new Date(report.generatedAt).toLocaleDateString()}
    `

    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-alignment-report-${report.type}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const currentPeriod = reportType === 'weekly' ? 'This Week' : 'This Month'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white">
          <FileText className="mr-2 h-4 w-4" />
          {reportType === 'weekly' ? 'Weekly Report' : 'Monthly Report'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#28A745]" />
            Mission Alignment {reportType === 'weekly' ? 'Weekly' : 'Monthly'} Report
          </DialogTitle>
        </DialogHeader>

        {!report ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-[#28A745] mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Generate Your {reportType} Report</h3>
              <p className="text-sm text-[#6B7280] mb-6">
                Get AI-powered insights on your mission alignment progress for {currentPeriod.toLowerCase()}.
              </p>
              <Button
                onClick={generateReport}
                className="text-white bg-[#28A745] hover:bg-[#23923d]"
                disabled={loading}
              >
                {loading ? "Generating Report..." : "Generate Report"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                Mission Alignment {reportType === 'weekly' ? 'Weekly' : 'Monthly'} Report
              </h2>
              <p className="text-sm text-[#6B7280]">
                {report.period.start} to {report.period.end} • Generated {new Date(report.generatedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#28A745]">{report.summary.completionRate}%</div>
                  <div className="text-xs text-[#6B7280]">Completion Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{report.summary.averageAlignment}%</div>
                  <div className="text-xs text-[#6B7280]">Avg Alignment</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{report.summary.highAlignmentTasks}</div>
                  <div className="text-xs text-[#6B7280]">High Impact</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{report.summary.distractionTasks}</div>
                  <div className="text-xs text-[#6B7280]">Distractions</div>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.insights.key_insights?.map((insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-sm">{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Celebrations */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Celebrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.celebrations?.map((celebration: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">🎉</span>
                      <span className="text-sm">{celebration}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.recommendations?.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-1">💡</span>
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Week Focus */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Next {reportType === 'weekly' ? 'Week' : 'Month'} Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.insights.next_week_focus || 'Continue building momentum on your mission!'}</p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={exportReport}
                className="flex-1 text-white bg-[#28A745] hover:bg-[#23923d]"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}