import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function SocialIndex() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/social");
  redirect("/social/feed");
}

