"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Square, Clock } from "lucide-react"
import { startTaskTimer, stopTaskTimer, getActiveTimer } from "@/app/actions/timers"

type TaskTimerProps = {
  taskId: number
  taskTitle: string
  onTimeLogged?: (minutes: number) => void
}

export default function TaskTimer({ taskId, taskTitle, onTimeLogged }: TaskTimerProps) {
  const [isRunning, setIsRunning] = React.useState(false)
  const [elapsedTime, setElapsedTime] = React.useState(0)
  const [startTime, setStartTime] = React.useState<Date | null>(null)

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, startTime])

  React.useEffect(() => {
    // Check if there's an active timer for this task
    checkActiveTimer()
  }, [taskId])

  const checkActiveTimer = async () => {
    const result = await getActiveTimer(taskId)
    if (result.success && result.timer) {
      setIsRunning(true)
      setStartTime(new Date(result.timer.start_time))
    }
  }

  const handleStart = async () => {
    const result = await startTaskTimer(taskId)
    if (result.success) {
      setIsRunning(true)
      setStartTime(new Date())
      setElapsedTime(0)
    }
  }

  const handlePause = async () => {
    if (startTime) {
      const minutes = Math.floor(elapsedTime / 60)
      const result = await stopTaskTimer(taskId, minutes)
      if (result.success) {
        setIsRunning(false)
        setStartTime(null)
        setElapsedTime(0)
        onTimeLogged?.(minutes)
      }
    }
  }

  const handleStop = async () => {
    if (startTime) {
      const minutes = Math.floor(elapsedTime / 60)
      const result = await stopTaskTimer(taskId, minutes, true) // true for complete stop
      if (result.success) {
        setIsRunning(false)
        setStartTime(null)
        setElapsedTime(0)
        onTimeLogged?.(minutes)
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

  if (!isRunning && elapsedTime === 0) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleStart}
        className="text-[#28A745] border-[#28A745] hover:bg-[#28A745] hover:text-white bg-transparent"
      >
        <Play className="mr-1 h-3 w-3" />
        Start
      </Button>
    )
  }

  return (
    <Card className="border-[#28A745]/20 bg-[#28A745]/5">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#28A745]" />
            <div>
              <div className="font-mono text-lg font-bold text-[#28A745]">{formatTime(elapsedTime)}</div>
              <div className="text-xs text-[#6B7280] truncate max-w-32">{taskTitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isRunning ? (
              <>
                <Button size="sm" variant="ghost" onClick={handlePause} className="h-8 w-8 p-0">
                  <Pause className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleStop} className="h-8 w-8 p-0 text-red-600">
                  <Square className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={handleStart} className="h-8 w-8 p-0 text-[#28A745]">
                <Play className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
