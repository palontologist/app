"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { syncGoogleCalendar } from "@/app/actions/google-calendar-sync"
import { Loader2, Calendar, CheckCircle, AlertCircle } from "lucide-react"

interface SyncResult {
  success: boolean
  eventsImported?: number
  tasksImported?: number
  error?: string
}

export function GoogleCalendarSync() {
  const [isLoading, setIsLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const handleSync = async () => {
    setIsLoading(true)
    setSyncResult(null)
    
    try {
      const result = await syncGoogleCalendar()
      setSyncResult(result)
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Import events and tasks from your Google Calendar to keep everything in sync.
        </p>
        
        <Button 
          onClick={handleSync} 
          disabled={isLoading}
          className="w-full"
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
                    Imported {syncResult.eventsImported || 0} events and {syncResult.tasksImported || 0} tasks
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
      </CardContent>
    </Card>
  )
}