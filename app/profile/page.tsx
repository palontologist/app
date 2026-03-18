import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import ProfileScreen from "@/components/profile-screen"

export default async function ProfilePage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in?redirect_url=/profile")
  return <ProfileScreen />
}
