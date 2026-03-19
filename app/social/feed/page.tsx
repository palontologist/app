import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SocialFeedScreen from "@/components/social-feed-screen";

export default async function SocialFeedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/social/feed");
  return <SocialFeedScreen />;
}

