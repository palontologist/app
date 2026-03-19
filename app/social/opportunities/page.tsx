import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OpportunitiesScreen from "@/components/opportunities-screen";

export default async function SocialOpportunitiesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/social/opportunities");
  return <OpportunitiesScreen />;
}

