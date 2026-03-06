import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ValueOSDashboard } from "@/components/value-os-dashboard"

export default async function ValuePage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in?redirect_url=/value")
  }

  return (
    <AppShell>
      <ValueOSDashboard />
    </AppShell>
  )
}
