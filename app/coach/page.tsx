import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { CoachCard } from "@/components/coach-card"

export default async function CoachPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in?redirect_url=/coach")
  }

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI Coach</h1>
          <p className="text-muted-foreground mt-1">
            Your personal coach to stay mission-aligned, prioritize ruthlessly, and build habits that compound.
          </p>
        </div>
        <CoachCard />
      </div>
    </AppShell>
  )
}
