import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"
import HomeScreen from "@/components/home-screen"

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in?redirect_url=/dashboard")

  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
  if (!rows[0]?.onboarded) redirect("/onboarding")

  return <HomeScreen />
}
