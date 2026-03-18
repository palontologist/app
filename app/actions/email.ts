"use server"

import { resend, FROM_ADDRESS } from "@/lib/resend"
import { WelcomeEmailHtml } from "@/emails/welcome"
import { WeeklyDigestHtml } from "@/emails/weekly-digest"

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Welcome to Greta — let's build something that matters",
      html: WelcomeEmailHtml({ name }),
    })
    if (error) {
      console.error("Resend welcome email error:", error)
      return { success: false, error }
    }
    return { success: true, id: data?.id }
  } catch (err) {
    console.error("sendWelcomeEmail threw:", err)
    return { success: false, error: err }
  }
}

export async function sendWeeklyDigest(
  to: string,
  name: string,
  stats: {
    alignmentScore: number
    tasksCompleted: number
    weekValue: number
    topGoal: string | null
    nextSuggestedTask: string | null
  },
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Your week in review, ${name.split(" ")[0]} — Greta`,
      html: WeeklyDigestHtml({ name, ...stats }),
    })
    if (error) {
      console.error("Resend weekly digest error:", error)
      return { success: false, error }
    }
    return { success: true, id: data?.id }
  } catch (err) {
    console.error("sendWeeklyDigest threw:", err)
    return { success: false, error: err }
  }
}
