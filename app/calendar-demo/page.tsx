import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getGoogleConnectionStatus } from "@/app/actions/google-status"
import { getEvents } from "@/app/actions/events"
import { getTasks } from "@/app/actions/tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GoogleCalendarManager } from "@/components/google-calendar-manager"
import { Calendar, CheckCircle, Clock, Target } from "lucide-react"
import Link from "next/link"

export default async function CalendarSyncDemo() {
  const session = await auth()
  
  if (!session.userId) {
    redirect('/sign-in')
  }

  const [googleStatusResult, eventsResult, tasksResult] = await Promise.all([
    getGoogleConnectionStatus(),
    getEvents(),
    getTasks(),
  ])

  const googleStatus = googleStatusResult.success ? googleStatusResult : null
  const events = eventsResult.success ? eventsResult.events : []
  const tasks = tasksResult.success ? tasksResult.tasks : []

  // Filter synced items
  const syncedEvents = events.filter((e: any) => e.google_event_id)
  const syncedTasks = tasks.filter((t: any) => t.google_event_id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Calendar Integration</h1>
          <p className="text-gray-600">
            Sync your Google Calendar events and tasks seamlessly with your dashboard
          </p>
        </div>

        {/* Calendar Manager */}
        <div className="mb-8">
          <GoogleCalendarManager 
            isConnected={googleStatus?.connected || false}
            userEmail={googleStatus?.email}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                </div>
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Synced Events</p>
                  <p className="text-2xl font-bold">{syncedEvents.length}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                </div>
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Synced Tasks</p>
                  <p className="text-2xl font-bold">{syncedTasks.length}</p>
                </div>
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Synced Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Synced Events ({syncedEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncedEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No synced events yet. {googleStatus?.connected ? "Try syncing your calendar!" : "Connect your Google Calendar first."}
                </p>
              ) : (
                <div className="space-y-3">
                  {syncedEvents.slice(0, 5).map((event: any) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.event_date).toLocaleDateString()}
                            {event.event_time && ` at ${event.event_time}`}
                          </p>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Google Calendar
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {syncedEvents.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      And {syncedEvents.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Synced Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Synced Tasks ({syncedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncedTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No synced tasks yet. {googleStatus?.connected ? "Create calendar events with task keywords (TODO, Task, etc.) and sync!" : "Connect your Google Calendar first."}
                </p>
              ) : (
                <div className="space-y-3">
                  {syncedTasks.slice(0, 5).map((task: any) => (
                    <div key={task.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={task.completed ? "default" : "secondary"} className="text-xs">
                              {task.completed ? "Completed" : "Pending"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Google Calendar
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {syncedTasks.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      And {syncedTasks.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/events">All Events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tasks">All Tasks</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}