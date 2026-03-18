import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ProgressScreen from "@/components/progress-screen"

export default async function ProgressPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in?redirect_url=/progress")
  return <ProgressScreen />
}
