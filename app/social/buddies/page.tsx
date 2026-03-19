import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import BuddyMatchingScreen from "@/components/buddy-matching-screen";

export default async function SocialBuddiesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/social/buddies");
  return <BuddyMatchingScreen />;
}

