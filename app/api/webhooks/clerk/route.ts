import { NextResponse } from "next/server"
import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { sendWelcomeEmail } from "@/app/actions/email"
import { identifyUser, trackServerEvent } from "@/lib/posthog-server"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET — set it in .env.local")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  let event: Awaited<ReturnType<typeof verifyWebhook>>

  try {
    event = await verifyWebhook(req)
  } catch (err) {
    console.error("Clerk webhook verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "user.created") {
    const data = event.data as {
      id: string
      first_name: string | null
      last_name: string | null
      email_addresses: { email_address: string; id: string }[]
      primary_email_address_id: string | null
      created_at: number
      image_url: string | null
    }

    const primaryEmail =
      data.email_addresses.find((e) => e.id === data.primary_email_address_id)?.email_address
      ?? data.email_addresses[0]?.email_address

    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Founder"

    await identifyUser(data.id, {
      email: primaryEmail,
      name,
      createdAt: new Date(data.created_at).toISOString(),
      avatar: data.image_url,
    })

    await trackServerEvent(data.id, "user_signed_up", { email: primaryEmail, name })

    if (primaryEmail) {
      await sendWelcomeEmail(primaryEmail, name)
    }
  }

  return NextResponse.json({ received: true })
}
