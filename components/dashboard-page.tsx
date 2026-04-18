"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Calendar, ArrowRight, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getValueSummary, getClients } from "@/app/actions/value"
import { startTaskTimer, stopTaskTimer } from "@/app/actions/tasks"

export default function DashboardPage() {
  const [summary, setSummary] = React.useState<any>(null)
  const [clients, setClients] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = React.useState(false)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
  const [timerStart, setTimerStart] = React.useState<Date | null>(null)

  React.useEffect(() => {
    loadData()
  }, [])

  // Timer interval
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerRunning && timerStart) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - timerStart.getTime()) / 1000)
        setElapsedSeconds(elapsed)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timerStart])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sumResult, clientsResult] = await Promise.all([
        getValueSummary(),
        getClients(),
      ])
      if (sumResult.success) setSummary(sumResult.summary)
      if (clientsResult.success) setClients(clientsResult.clients || [])
    } catch (err) {
      console.error("Dashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTimer = async () => {
    try {
      await startTaskTimer(0)
      setIsTimerRunning(true)
      setTimerStart(new Date())
      setElapsedSeconds(0)
    } catch (err) {
      console.error("Failed to start timer:", err)
    }
  }

  const handleStopTimer = async () => {
    if (elapsedSeconds > 0) {
      try {
        const minutes = Math.floor(elapsedSeconds / 60)
        await stopTaskTimer(0, minutes)
        setIsTimerRunning(false)
        setTimerStart(null)
        setElapsedSeconds(0)
        loadData()
      } catch (err) {
        console.error("Failed to stop timer:", err)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">Loading...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">This Month</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold" style={{ color: '#1c1a17' }}>
                ${(summary?.weekRevenue || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Effective Rate</p>
            <div className="mt-1">
              <span className="text-2xl font-bold" style={{ color: '#1c1a17' }}>
                ${summary?.effectiveRate || 0}/hr
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer Section - YouTube style */}
      <Card className={isTimerRunning ? "border-green-500 bg-green-50" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant={isTimerRunning ? "destructive" : "default"}
                onClick={isTimerRunning ? handleStopTimer : handleStartTimer}
                className={`w-14 h-14 rounded-full ${isTimerRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"}`}
              >
                {isTimerRunning ? (
                  <Square className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
              <div>
                <p className="text-sm text-slate-500">
                  {isTimerRunning ? "Recording time..." : "Ready to work?"}
                </p>
                <p className={`text-2xl font-mono font-bold ${isTimerRunning ? "text-green-600" : "text-slate-400"}`}>
                  {isTimerRunning ? formatTime(elapsedSeconds) : "0:00"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-700">Your Clients ({clients.length})</h2>
          <Link href="/clients" className="text-xs text-green-600 hover:underline">
            Manage
          </Link>
        </div>
        
        {clients.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-slate-500 mb-4">Add clients to start tracking value.</p>
              <Link href="/clients">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-1" /> Add Client
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {clients.slice(0, 3).map((client) => (
              <Card key={client.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{client.name}</p>
                    {client.email && (
                      <p className="text-xs text-slate-400">{client.email}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ${(client.hourlyRate || 0) / 100}/hr
                    </p>
                    <p className="text-xs text-slate-400">billed</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {clients.length > 3 && (
              <Link href="/clients" className="block text-center text-sm text-slate-500 py-2">
                + {clients.length - 3} more
              </Link>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 mb-3">Connect</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/api/google/auth/start">
            <Card className="hover:border-slate-300 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Calendar</p>
                  <p className="text-xs text-slate-400">Connect Google</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link href="/value" className="inline-flex items-center text-sm text-green-600 hover:underline">
          View value details <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  )
}