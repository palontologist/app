"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { clients, timeEntries, payments, equityBets, revenueImpact } from "@/db/schema"
import { eq, desc, and, sum, sql } from "drizzle-orm"

// ---- Clients ----
export async function getClients() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated", clients: [] }

  try {
    const rows = await db.select().from(clients).where(eq(clients.userId, userId))
    return { success: true, clients: rows }
  } catch (error) {
    console.error("getClients error:", error)
    return { success: false, error: "Failed to load clients", clients: [] }
  }
}

export async function createClient(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated" }

  const name = formData.get("name") as string
  const email = formData.get("email") as string | null
  const hourlyRateStr = formData.get("hourlyRate") as string | null
  const notes = formData.get("notes") as string | null

  if (!name?.trim()) return { success: false, error: "Client name is required" }

  const hourlyRate = hourlyRateStr ? Math.round(parseFloat(hourlyRateStr) * 100) : null

  try {
    const [row] = await db
      .insert(clients)
      .values({
        userId,
        name: name.trim(),
        email: email?.trim() || null,
        hourlyRate,
        notes: notes?.trim() || null,
      })
      .returning()
    return { success: true, client: row }
  } catch (error) {
    console.error("createClient error:", error)
    return { success: false, error: "Failed to create client" }
  }
}

export async function deleteClient(id: number) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated" }

  try {
    await db.delete(clients).where(eq(clients.id, id))
    return { success: true }
  } catch (error) {
    console.error("deleteClient error:", error)
    return { success: false, error: "Failed to delete client" }
  }
}

// ---- Time Entries ----
export async function getTimeEntries() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated", entries: [] }

  try {
    const rows = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(desc(timeEntries.entryDate))
      .limit(50)
    return { success: true, entries: rows }
  } catch (error) {
    console.error("getTimeEntries error:", error)
    return { success: false, error: "Failed to load time entries", entries: [] }
  }
}

export async function createTimeEntry(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated" }

  const clientId = formData.get("clientId") ? Number(formData.get("clientId")) : null
  const durationMinutes = Number(formData.get("durationMinutes") || 0)
  const activityType = formData.get("activityType") as string | null
  const projectTag = formData.get("projectTag") as string | null
  const billable = formData.get("billable") === "true"
  const entryDateStr = formData.get("entryDate") as string

  if (!entryDateStr) return { success: false, error: "Date is required" }
  if (durationMinutes <= 0) return { success: false, error: "Duration must be positive" }

  try {
    const [row] = await db
      .insert(timeEntries)
      .values({
        userId,
        clientId,
        durationMinutes,
        activityType: activityType || null,
        projectTag: projectTag?.trim() || null,
        billable,
        entryDate: new Date(entryDateStr),
      })
      .returning()
    return { success: true, entry: row }
  } catch (error) {
    console.error("createTimeEntry error:", error)
    return { success: false, error: "Failed to create time entry" }
  }
}

// ---- Payments ----
export async function getPayments() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated", payments: [] }

  try {
    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.paymentDate))
      .limit(50)
    return { success: true, payments: rows }
  } catch (error) {
    console.error("getPayments error:", error)
    return { success: false, error: "Failed to load payments", payments: [] }
  }
}

export async function createPayment(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated" }

  const amountStr = formData.get("amount") as string
  const clientId = formData.get("clientId") ? Number(formData.get("clientId")) : null
  const description = formData.get("description") as string | null
  const paymentDateStr = formData.get("paymentDate") as string
  const paymentMethod = formData.get("paymentMethod") as string | null

  if (!amountStr) return { success: false, error: "Amount is required" }
  if (!paymentDateStr) return { success: false, error: "Date is required" }

  const amount = Math.round(parseFloat(amountStr) * 100) // Convert to cents

  try {
    const [row] = await db
      .insert(payments)
      .values({
        userId,
        clientId,
        amount,
        paymentDate: new Date(paymentDateStr),
        description: description?.trim() || null,
        paymentMethod: paymentMethod || null,
      })
      .returning()
    return { success: true, payment: row }
  } catch (error) {
    console.error("createPayment error:", error)
    return { success: false, error: "Failed to record payment" }
  }
}

// ---- Equity Bets ----
export async function getEquityBets() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated", bets: [] }

  try {
    const rows = await db
      .select()
      .from(equityBets)
      .where(eq(equityBets.userId, userId))
      .orderBy(desc(equityBets.createdAt))
    return { success: true, bets: rows }
  } catch (error) {
    console.error("getEquityBets error:", error)
    return { success: false, error: "Failed to load equity bets", bets: [] }
  }
}

export async function createEquityBet(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated" }

  const companyName = formData.get("companyName") as string
  const equityPctStr = formData.get("equityPercentage") as string | null
  const valuationStr = formData.get("estimatedValuation") as string | null
  const notes = formData.get("notes") as string | null

  if (!companyName?.trim()) return { success: false, error: "Company name is required" }

  // Store equity as basis points (1% = 100 basis points)
  const equityBasisPoints = equityPctStr ? Math.round(parseFloat(equityPctStr) * 100) : null
  // Store valuation in cents
  const valuation = valuationStr ? Math.round(parseFloat(valuationStr) * 100) : null

  try {
    const [row] = await db
      .insert(equityBets)
      .values({
        userId,
        companyName: companyName.trim(),
        equityPercentage: equityBasisPoints,
        estimatedValuation: valuation,
        notes: notes?.trim() || null,
      })
      .returning()
    return { success: true, bet: row }
  } catch (error) {
    console.error("createEquityBet error:", error)
    return { success: false, error: "Failed to create equity bet" }
  }
}

// ---- Value Summary (aggregated stats) ----
export async function getValueSummary() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated", summary: null }

  try {
    const [clientsData, paymentsData, timeData, betsData] = await Promise.all([
      db.select().from(clients).where(eq(clients.userId, userId)),
      db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.paymentDate)).limit(100),
      db.select().from(timeEntries).where(eq(timeEntries.userId, userId)).limit(100),
      db.select().from(equityBets).where(and(eq(equityBets.userId, userId), eq(equityBets.status, "active"))),
    ])

    // Total revenue (in cents -> dollars)
    const totalRevenueCents = paymentsData.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const totalRevenue = totalRevenueCents / 100

    // Revenue this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const thisWeekPayments = paymentsData.filter((p: any) => new Date(p.paymentDate) >= weekAgo)
    const weekRevenueCents = thisWeekPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const weekRevenue = weekRevenueCents / 100

    // Total hours tracked
    const totalMinutes = timeData.reduce((sum: number, e: any) => sum + (e.durationMinutes || 0), 0)
    const totalHours = totalMinutes / 60

    // Hours this week
    const thisWeekTime = timeData.filter((e: any) => new Date(e.entryDate) >= weekAgo)
    const weekMinutes = thisWeekTime.reduce((sum: number, e: any) => sum + (e.durationMinutes || 0), 0)
    const weekHours = weekMinutes / 60

    // Effective hourly rate
    const effectiveRate = weekHours > 0 ? weekRevenue / weekHours : 0

    // Equity value
    const totalEquityValue = betsData.reduce((sum: number, b: any) => {
      const pct = (b.equityPercentage || 0) / 10000 // basis points -> decimal
      const val = (b.estimatedValuation || 0) / 100 // cents -> dollars
      return sum + pct * val
    }, 0)

    return {
      success: true,
      summary: {
        totalRevenue,
        weekRevenue,
        totalHours,
        weekHours,
        effectiveRate: Math.round(effectiveRate),
        clientCount: clientsData.length,
        totalEquityValue: Math.round(totalEquityValue),
        equityBetsCount: betsData.length,
      },
    }
  } catch (error) {
    console.error("getValueSummary error:", error)
    return { success: false, error: "Failed to load value summary", summary: null }
  }
}

// ---- Client ROI Analysis ----
export async function getClientROI() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthenticated", clients: [] }

  try {
    const [clientsData, paymentsData, timeData] = await Promise.all([
      db.select().from(clients).where(eq(clients.userId, userId)),
      db.select().from(payments).where(eq(payments.userId, userId)),
      db.select().from(timeEntries).where(eq(timeEntries.userId, userId)),
    ])

    // Calculate metrics per client
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const clientROI = clientsData.map((client) => {
      const clientPayments = paymentsData.filter(
        (p: any) => p.clientId === client.id && new Date(p.paymentDate) >= thirtyDaysAgo
      )
      const clientTime = timeData.filter((t: any) => t.clientId === client.id && new Date(t.entryDate) >= thirtyDaysAgo)

      const revenueCents = clientPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      const revenue = revenueCents / 100

      const minutes = clientTime.reduce((sum: number, t: any) => sum + (t.durationMinutes || 0), 0)
      const hours = minutes / 60

      const effectiveRate = hours > 0 ? revenue / hours : 0

      // Get client's billed rate (if set)
      const billedRate = (client.hourlyRate || 0) / 100

      // Check if underpriced
      let underpriced = false
      let underpricedBy = 0
      if (billedRate > 0 && effectiveRate < billedRate * 0.8) {
        underpriced = true
        underpricedBy = billedRate - effectiveRate
      } else if (billedRate === 0 && effectiveRate > 0 && revenue > 500) {
        // No rate set but has revenue - suggest a rate
        underpriced = true
        underpricedBy = effectiveRate * 0.5
      }

      return {
        ...client,
        revenue,
        hours,
        effectiveRate: Math.round(effectiveRate),
        billedRate: billedRate || null,
        underpriced,
        underpricedBy: Math.round(underpricedBy),
        assessment: !billedRate
          ? "No rate set"
          : effectiveRate >= billedRate
          ? "On target"
          : "Underpriced",
      }
    })

    // Sort by revenue descending
    clientROI.sort((a, b) => b.revenue - a.revenue)

    return { success: true, clients: clientROI }
  } catch (error) {
    console.error("getClientROI error:", error)
    return { success: false, error: "Failed to load client ROI", clients: [] }
  }
}
