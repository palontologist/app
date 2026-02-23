import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"
import { ValueDashboard } from "@/components/value-dashboard"

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard")
  }
  
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
  
  if (!rows[0]?.onboarded) {
    redirect("/onboarding")
  }
  
  return (
    <main>
      <ValueDashboard userProfile={{
        workspaceType: (rows[0]?.currentWorkspaceType as 'personal' | 'startup') || 'personal'
      }} />
    </main>
  )
}
