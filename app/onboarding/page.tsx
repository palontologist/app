import { Inter } from "next/font/google"
import OnboardingFlow from "@/components/onboarding-flow"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"

const inter = Inter({ subsets: ["latin"] })

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) {
    // Clerk will handle redirect to sign-in via middleware if route protected; fallback here
    redirect("/sign-in?redirect_url=/onboarding")
  }
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
  if (rows[0]?.onboarded) {
    redirect("/dashboard")
  }
  return (
    <main className={inter.className}>
      <OnboardingFlow />
    </main>
  )
}
