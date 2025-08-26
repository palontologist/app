"use server"

import { auth } from "@clerk/nextjs/server"

type PyTask = {
  id: number
  title: string
  priority: number
  deadline: string | null
  depends_on: number[]
}

export async function getMettaPySchedule(tasks: PyTask[]) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthenticated", order: [] }

    const url = process.env.METTA_SERVICE_URL || "http://localhost:8001/schedule"
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
      cache: "no-store",
    })
    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Service error: ${res.status} ${text}`, order: [] }
    }
    const data = await res.json()
    return { success: true, order: data.order as Array<{ id: number; title: string; order: number }>, reason: data.reason }
  } catch (error) {
    console.error("Failed to call Metta service:", error)
    return { success: false, error: "Failed to call Metta service", order: [] }
  }
}

