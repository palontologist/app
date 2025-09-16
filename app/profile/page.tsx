import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getUser } from "@/app/actions/user"
import { getGoals } from "@/app/actions/goals"
import { getTasks } from "@/app/actions/tasks"
import { getGoogleConnectionStatus } from "@/app/actions/google-status"
import ProfileContent from "@/components/profile-content"

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session.userId) {
    redirect('/sign-in')
  }

  const userResult = await getUser()
  const goalsResult = await getGoals()
  const tasksResult = await getTasks()
  const googleStatusResult = await getGoogleConnectionStatus()

  if (!userResult.success || !userResult.user) {
    redirect('/onboarding')
  }

  const goals = goalsResult.success ? goalsResult.goals : []
  const tasks = tasksResult.success ? tasksResult.tasks : []
  const googleStatus = googleStatusResult.success ? googleStatusResult : null

  return (
    <ProfileContent 
      user={userResult.user}
      goals={goals.map((g: any) => ({ ...g, type: g.type || g.category === 'personal' ? 'personal' : 'startup' }))}
      tasks={tasks}
      googleStatus={googleStatus}
    />
  )
}