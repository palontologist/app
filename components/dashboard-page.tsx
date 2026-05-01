"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Calendar, ArrowRight, Play, Square, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getValueSummary, getClients, createClient, createTimeEntry, createPayment, getTimeEntries, getPayments } from "@/app/actions/value"
import { getUser } from "@/app/actions/user"
import { startTaskTimer, stopTaskTimer } from "@/app/actions/tasks"

export default function DashboardPage() {
  const [summary, setSummary] = React.useState<any>(null)
  const [clients, setClients] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [userProfile, setUserProfile] = React.useState<any>(null)
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = React.useState(false)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
  const [timerStart, setTimerStart] = React.useState<Date | null>(null)
  const [calcInput, setCalcInput] = React.useState({ 
    clientName: '', 
    hourlyRate: 75, 
    hoursTracked: 20,
    meetingHours: 10,
    emailHours: 5
  })
  const [quickResults, setQuickResults] = React.useState<{ effectiveRate: number; verdict: string } | null>(null)
  const [addSuccessful, setAddSuccessful] = React.useState(false)
  const [timeEntries, setTimeEntries] = React.useState<any[]>([])
  const [payments, setPayments] = React.useState<any[]>([])
  const [timePeriod, setTimePeriod] = React.useState<'week' | 'month'>('month')
  
  // Client management modal
  const [selectedClient, setSelectedClient] = React.useState<any>(null)
  const [timerClient, setTimerClient] = React.useState<any>(null) // Client for timer
  const [logHours, setLogHours] = React.useState('')
  const [logAmount, setLogAmount] = React.useState('')
  const [showClientModal, setShowClientModal] = React.useState(false)

  // Load data on mount - this runs once
  const [dataLoaded, setDataLoaded] = React.useState(false)
  
  React.useEffect(() => {
    loadData()
    setDataLoaded(true)
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
      const [sumResult, clientsResult, timeResult, payResult, userResult] = await Promise.all([
        getValueSummary(),
        getClients(),
        getTimeEntries(),
        getPayments(),
        getUser(),
      ])
      if (sumResult.success) setSummary(sumResult.summary)
      if (clientsResult.success) setClients(clientsResult.clients || [])
      if (timeResult.success) setTimeEntries(timeResult.entries || [])
      if (payResult.success) setPayments(payResult.payments || [])
      if (userResult.success && userResult.user) {
        setUserProfile(userResult.user)
      }
    } catch (err) {
      console.error("Dashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Get insight for a specific client
  const getClientInsight = (clientId: number) => {
    const clientTime = timeEntries.filter((t: any) => t.clientId === clientId)
    const clientPayments = payments.filter((p: any) => p.clientId === clientId)
    const totalHours = clientTime.reduce((sum: number, t: any) => sum + (t.durationMinutes || 0), 0) / 60
    const totalRevenue = clientPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) / 100
    const effectiveRate = totalHours > 0 ? totalRevenue / totalHours : 0
    return { totalHours, totalRevenue, effectiveRate }
  }

  const handleLogTime = async () => {
    if (!selectedClient || !logHours) return
    try {
      const fd = new FormData()
      fd.set('durationMinutes', String(Math.round(parseFloat(logHours) * 60)))
      fd.set('clientId', String(selectedClient.id))
      await createTimeEntry(fd)
      setLogHours('')
      loadData()
    } catch (err) {
      console.error('Failed to log time:', err)
    }
  }

  const handleLogRevenue = async () => {
    if (!selectedClient || !logAmount) return
    try {
      const fd = new FormData()
      fd.set('amount', String(Math.round(parseFloat(logAmount) * 100)))
      fd.set('clientId', String(selectedClient.id))
      await createPayment(fd)
      setLogAmount('')
      loadData()
    } catch (err) {
      console.error('Failed to log revenue:', err)
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

  React.useEffect(() => {
    if (calcInput.hourlyRate > 0 && calcInput.hoursTracked > 0) {
      const billableHours = calcInput.hoursTracked
      const overheadHours = (calcInput.meetingHours || 0) + (calcInput.emailHours || 0)
      const totalHours = billableHours + overheadHours
      const effectiveRate = totalHours > 0 ? (calcInput.hourlyRate * billableHours) / totalHours : 0
      const targetRate = userProfile?.targetHourlyRate || 75
      
      let verdict = ''
      if (effectiveRate < 15) {
        verdict = "You're making less than minimum wage. This client is costing you money."
      } else if (effectiveRate < targetRate * 0.4) {
        verdict = `Warning: You're effectively earning far less than you think (target: $${targetRate}/hr).`
      } else if (effectiveRate < targetRate * 0.8) {
        verdict = `You're undercharging. There's room to raise rates (target: $${targetRate}/hr).`
      } else if (effectiveRate >= targetRate) {
        verdict = `This client is paying well. Keep them! (target: $${targetRate}/hr)`
      } else {
        verdict = `You're close to your target rate of $${targetRate}/hr. Consider raising rates.`
      }
      setQuickResults({ effectiveRate: Math.round(effectiveRate), verdict })
    }
  }, [calcInput, userProfile])

  // Don't render until data is loaded
  if (!dataLoaded) {
    return (
      <div className="p-8 text-center text-slate-400">Loading...</div>
    )
  }

  const handleAddClient = async () => {
    if (!calcInput.clientName.trim()) return
    try {
      const fd = new FormData()
      fd.set('name', calcInput.clientName)
      fd.set('hourlyRate', String(calcInput.hourlyRate * 100))
      const result = await createClient(fd)
      if (result.success) {
        setAddSuccessful(true)
        loadData()
        const userRate = userProfile?.targetHourlyRate || 75
        const meetingHours = userProfile?.meetingHoursPerMonth ?? 10
        const emailHours = userProfile?.emailHoursPerMonth ?? 5
        setTimeout(() => {
          setCalcInput({ clientName: '', hourlyRate: userRate, hoursTracked: 20, meetingHours, emailHours })
          setQuickResults(null)
          setAddSuccessful(false)
        }, 2000)
      }
    } catch (err) {
      console.error('Failed to add client:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Value Check */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Quick Value Check
          </CardTitle>
          <p className="text-sm text-muted-foreground">Enter ONE client to see if you're actually making what you think.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-7">
            <div>
              <Label className="text-xs">Client Name</Label>
              <Input
                placeholder="e.g. Acme Corp"
                value={calcInput.clientName}
                onChange={(e) => setCalcInput({ ...calcInput, clientName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Your Rate ($/hr)</Label>
              <Input
                type="number"
                value={calcInput.hourlyRate}
                onChange={(e) => setCalcInput({ ...calcInput, hourlyRate: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Billable Hours</Label>
              <Input
                type="number"
                value={calcInput.hoursTracked}
                onChange={(e) => setCalcInput({ ...calcInput, hoursTracked: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Meeting Hrs/Mo</Label>
              <Input
                type="number"
                value={calcInput.meetingHours}
                onChange={(e) => setCalcInput({ ...calcInput, meetingHours: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email Hrs/Mo</Label>
              <Input
                type="number"
                value={calcInput.emailHours}
                onChange={(e) => setCalcInput({ ...calcInput, emailHours: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddClient}
                disabled={!calcInput.clientName.trim() || addSuccessful}
                className="w-full mt-1 bg-green-600 hover:bg-green-700"
              >
                {addSuccessful ? 'Added!' : 'Add Client'}
              </Button>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  const userRate = userProfile?.targetHourlyRate || 75
                  const meetingHours = userProfile?.meetingHoursPerMonth ?? 10
                  const emailHours = userProfile?.emailHoursPerMonth ?? 5
                  setCalcInput({ clientName: '', hourlyRate: userRate, hoursTracked: 20, meetingHours, emailHours })
                  setQuickResults(null)
                }}
                variant="outline" 
                className="w-full mt-1"
              >
                Reset
              </Button>
            </div>
          </div>

          {quickResults && (
            <div className="mt-6 rounded-lg bg-white p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-3">
                <div className={`text-3xl font-bold ${quickResults.effectiveRate < 40 ? 'text-red-600' : quickResults.effectiveRate < 80 ? 'text-orange-600' : 'text-green-600'}`}>
                  ${quickResults.effectiveRate}/hr
                </div>
                <div className="text-sm text-muted-foreground">effective rate</div>
              </div>
              
              <div className={`p-3 rounded-lg ${quickResults.effectiveRate < 40 ? 'bg-red-50 border border-red-200' : quickResults.effectiveRate < 80 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                <p className={`font-medium ${quickResults.effectiveRate < 40 ? 'text-red-700' : quickResults.effectiveRate < 80 ? 'text-orange-700' : 'text-green-700'}`}>
                  {quickResults.verdict}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Period Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={timePeriod === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('week')}
            className={timePeriod === 'week' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            This Week
          </Button>
          <Button
            variant={timePeriod === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('month')}
            className={timePeriod === 'month' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Overall Value Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{timePeriod === 'week' ? 'This Week' : 'This Month'}</p>
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

      {/* Timer Section - Integrated with client */}
      <Card className={isTimerRunning ? "border-green-500 bg-green-50" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant={isTimerRunning ? "destructive" : "default"}
                onClick={isTimerRunning ? handleStopTimer : handleStartTimer}
                disabled={!timerClient && !isTimerRunning}
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
                  {isTimerRunning ? `Recording for ${timerClient?.name || 'client'}...` : timerClient ? `Ready to work for ${timerClient.name}` : "Select a client to start"}
                </p>
                <p className={`text-2xl font-mono font-bold ${isTimerRunning ? "text-green-600" : "text-slate-400"}`}>
                  {isTimerRunning ? formatTime(elapsedSeconds) : "0:00"}
                </p>
              </div>
            </div>
            {!isTimerRunning && (
              <div className="flex gap-2">
                {clients.slice(0, 3).map((client) => (
                  <Button
                    key={client.id}
                    variant={timerClient?.id === client.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimerClient(client)}
                    className={timerClient?.id === client.id ? "bg-green-600" : ""}
                  >
                    {client.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          {timerClient && !isTimerRunning && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  ${((timerClient.hourlyRate || 0) / 100).toFixed(0)}/hr × {timerClient.name}
                </span>
                {timerClient && getClientInsight(timerClient.id).totalHours > 0 && (
                  <span className={`font-medium ${
                    getClientInsight(timerClient.id).effectiveRate >= ((timerClient.hourlyRate || 0) / 100) 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    Effective: ${Math.round(getClientInsight(timerClient.id).effectiveRate)}/hr
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-700">Your Clients ({clients.length})</h2>
          <span className="text-xs text-slate-400">Click to manage</span>
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
            {clients.map((client) => {
              const insight = getClientInsight(client.id)
              const rate = (client.hourlyRate || 0) / 100
              const status = insight.effectiveRate > 0 
                ? (insight.effectiveRate >= rate ? 'on-target' : 'underpriced')
                : 'no-data'
              
              return (
                <Card 
                  key={client.id} 
                  className="cursor-pointer hover:border-green-300 transition-colors"
                  onClick={() => {
                    setSelectedClient(client)
                    setShowClientModal(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{client.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">${rate}/hr</span>
                          <span className="text-xs text-slate-200">•</span>
                          <span className="text-xs text-slate-400">{insight.totalHours.toFixed(1)}h logged</span>
                          <span className="text-xs text-slate-200">•</span>
                          <span className="text-xs font-medium">
                            {insight.effectiveRate > 0 
                              ? `$${Math.round(insight.effectiveRate)}/hr effective`
                              : 'No revenue yet'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={status === 'underpriced' ? 'bg-red-100 text-red-700' : status === 'on-target' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                          {status === 'underpriced' ? 'Underpriced' : status === 'on-target' ? 'On target' : 'No data'}
                        </Badge>
                        <p className="text-xs text-slate-400 mt-1">
                          ${insight.totalRevenue.toLocaleString()} revenue
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Client Management Modal */}
      {showClientModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {selectedClient.name}
                <Button variant="ghost" size="sm" onClick={() => setShowClientModal(false)}>✕</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Hours</p>
                  <p className="font-semibold">{getClientInsight(selectedClient.id).totalHours.toFixed(1)}h</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Revenue</p>
                  <p className="font-semibold">${getClientInsight(selectedClient.id).totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Eff. Rate</p>
                  <p className="font-semibold">${Math.round(getClientInsight(selectedClient.id).effectiveRate)}/hr</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-sm font-medium">Log Work Session</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Hours"
                    type="number"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleLogTime} className="bg-green-600 hover:bg-green-700">
                    Log Time
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <Label className="text-sm font-medium">Log Revenue</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Amount ($)"
                    type="number"
                    value={logAmount}
                    onChange={(e) => setLogAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleLogRevenue} className="bg-green-600 hover:bg-green-700">
                    Log Pay
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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