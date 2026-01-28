import { Inter } from "next/font/google"
import SimplifiedDashboard from "@/components/simplified-dashboard"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"

const inter = Inter({ subsets: ["latin"] })

export default async function DashboardPage() {
  const { userId } = await auth()
  console.log('Dashboard: userId =', userId)
  
  if (!userId) {
    console.log('Dashboard: No userId, redirecting to sign-in')
    redirect("/sign-in?redirect_url=/dashboard")
  }
  
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
  console.log('Dashboard: profile rows found =', rows.length)
  console.log('Dashboard: profile data =', rows[0])
  
  if (!rows[0]?.onboarded) {
    console.log('Dashboard: User not onboarded, redirecting to onboarding')
    redirect("/onboarding")
  }
  
  console.log('Dashboard: All checks passed, rendering dashboard')
  
  return (
    <main className={inter.className}>
      <SimplifiedDashboard />
    </main>
  )
}
