import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getGoals, getAllGoalActivities } from "@/app/actions/goals"
import { getTasks } from "@/app/actions/tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Target, ClipboardList } from "lucide-react"

export default async function HistoryPage() {
  const session = await auth()
  if (!session.userId) redirect('/sign-in')

  const [goalsRes, tasksRes, activitiesRes] = await Promise.all([
    getGoals(),
    getTasks(),
    getAllGoalActivities(),
  ])

  const goals = goalsRes.success ? goalsRes.goals : []
  const tasks = tasksRes.success ? tasksRes.tasks : []
  const activities = activitiesRes.success ? activitiesRes.activities : []

  const completedGoals = goals.filter((g: any) => (g.target_value ? g.current_value >= g.target_value : false))
  const completedTasks = tasks.filter((t: any) => t.completed)

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="activities">
            <TabsList>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="activities">
              <div className="space-y-2">
                {activities.length === 0 && <p className="text-sm text-gray-500">No activities yet</p>}
                {activities.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-4 w-4 text-[#28A745]" />
                      <div>
                        <div className="text-sm font-medium">{a.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(a.created_at).toLocaleString()} • +{a.progress_value}
                        </div>
                      </div>
                    </div>
                    {a.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="goals">
              <div className="space-y-2">
                {completedGoals.length === 0 && <p className="text-sm text-gray-500">No completed goals yet</p>}
                {completedGoals.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-[#28A745]" />
                      <div>
                        <div className="text-sm font-medium">{g.title}</div>
                        <div className="text-xs text-gray-500">
                          {g.current_value} / {g.target_value} {g.unit}
                        </div>
                      </div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="space-y-2">
                {completedTasks.length === 0 && <p className="text-sm text-gray-500">No completed tasks yet</p>}
                {completedTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-sm font-medium">{t.title}</div>
                        {t.completed_at && (
                          <div className="text-xs text-gray-500">{new Date(t.completed_at).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

