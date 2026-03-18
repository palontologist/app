import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import GoalsScreen from "@/components/goals-screen"

export default async function GoalsRoute() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in?redirect_url=/goals")
  return <GoalsScreen />
}
