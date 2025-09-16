"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, CheckCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { syncGoogleCalendar } from "@/app/actions/google-calendar-sync"
import Link from "next/link"

interface SyncResult {
  success: boolean
  eventsImported?: number
  tasksImported?: number
  error?: string
}

interface GoogleCalendarManagerProps {
  isConnected?: boolean
  userEmail?: string | null
}

export function GoogleCalendarManager({ isConnected = false, userEmail }: GoogleCalendarManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  useEffect(() => {
    // Check for URL params indicating Google connection status
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('google_connected') === '1') {
      setSyncResult({ success: true, eventsImported: 0, tasksImported: 0 })
      setLastSyncTime(new Date().toLocaleString())
    } else if (urlParams.get('google_error')) {
      const errorType = urlParams.get('google_error')
      setSyncResult({ success: false, error: `Google connection failed: ${errorType}` })
    }
  }, [])

  const handleSync = async () => {
    setIsLoading(true)
    setSyncResult(null)
    
    try {
      const result = await syncGoogleCalendar()
      setSyncResult(result)
      if (result.success) {
        setLastSyncTime(new Date().toLocaleString())
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Google Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Not Connected
                </>
              )}
            </Badge>
            {isConnected && userEmail && (
              <span className="text-sm text-muted-foreground">({userEmail})</span>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {isConnected 
            ? "Sync your Google Calendar events and tasks with your dashboard. Events marked as tasks will be imported into your task list."
            : "Connect your Google Calendar to automatically import events and tasks."
          }
        </p>
        
        <div className="flex gap-2">
          {!isConnected ? (
            <Link href="/api/google/auth/start">
              <Button className="bg-[#4285F4] hover:bg-[#3367d6] text-white">
                <Calendar className="mr-2 h-4 w-4" />
                Connect Google Calendar
              </Button>
            </Link>
          ) : (
            <Button 
              onClick={handleSync} 
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Sync Calendar
                </>
              )}
            </Button>
          )}
          
          {isConnected && (
            <Button variant="outline" asChild>
              <Link href="https://calendar.google.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Calendar
              </Link>
            </Button>
          )}
        </div>

        {lastSyncTime && (
          <p className="text-xs text-muted-foreground">
            Last synced: {lastSyncTime}
          </p>
        )}

        {syncResult && (
          <Alert variant={syncResult.success ? "default" : "destructive"}>
            {syncResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {syncResult.success ? (
                <div>
                  <p className="font-medium">Sync completed successfully!</p>
                  <p className="text-sm">
                    Imported {syncResult.eventsImported || 0} events and {syncResult.tasksImported || 0} tasks from your calendar
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Sync failed</p>
                  <p className="text-sm">{syncResult.error}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Smart Import:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• Events with "TODO", "Task", or similar keywords → Tasks</li>
            <li>• Short events (≤30 minutes) → Tasks</li>
            <li>• Regular events → Events</li>
            <li>• Only imports events from last 30 days to next year</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}