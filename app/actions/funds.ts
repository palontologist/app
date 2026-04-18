"use server"

import { auth } from "@clerk/nextjs/server"
import { db, funds, portfolioCompanies, portfolioActivities, workspaces } from "@/lib/db"
import { eq, and, desc, sql, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getOrCreateFund(organizationId: string, name: string) {
  const existing = await db.select().from(funds).where(eq(funds.organizationId, organizationId))
  if (existing[0]) return existing[0]

  const [created] = await db.insert(funds).values({
    organizationId,
    name,
    thesis: "",
    sdgTargets: JSON.stringify([7, 13]),
    plan: "studio",
  }).returning()
  return created
}

export async function getFundByOrg(organizationId: string) {
  const rows = await db.select().from(funds).where(eq(funds.organizationId, organizationId))
  return rows[0] || null
}

export async function getPortfolioCompanies(fundId: number) {
  return db.select().from(portfolioCompanies).where(eq(portfolioCompanies.fundId, fundId)).orderBy(desc(portfolioCompanies.createdAt))
}

export async function addPortfolioCompany(fundId: number, data: { name: string; sector?: string; sdgAlignment?: number; website?: string; notes?: string }) {
  const [created] = await db.insert(portfolioCompanies).values({
    fundId,
    name: data.name,
    sector: data.sector,
    sdgAlignment: data.sdgAlignment || 0,
    website: data.website,
    notes: data.notes,
  }).returning()
  revalidatePath("/fund/companies")
  return created
}

export async function updatePortfolioCompany(id: number, data: Partial<{ name: string; sector: string; sdgAlignment: number; website: string; notes: string }>) {
  const [updated] = await db.update(portfolioCompanies).set({
    ...data,
    updatedAt: Date.now(),
  }).where(eq(portfolioCompanies.id, id)).returning()
  revalidatePath("/fund/companies")
  return updated
}

export async function deletePortfolioCompany(id: number) {
  await db.delete(portfolioCompanies).where(eq(portfolioCompanies.id, id))
  revalidatePath("/fund/companies")
}

export async function addPortfolioActivity(companyId: number, data: { date: string; activityType: string; hours: number; sdgCategory?: string; description?: string }) {
  const [created] = await db.insert(portfolioActivities).values({
    companyId,
    date: data.date,
    activityType: data.activityType,
    hours: data.hours,
    sdgCategory: data.sdgCategory,
    description: data.description,
  }).returning()
  revalidatePath("/fund")
  return created
}

export async function getPortfolioActivities(companyId: number) {
  return db.select().from(portfolioActivities).where(eq(portfolioActivities.companyId, companyId)).orderBy(desc(portfolioActivities.date))
}

export async function getPortfolioSummary(fundId: number) {
  const companies = await db.select({
    id: portfolioCompanies.id,
    name: portfolioCompanies.name,
    sector: portfolioCompanies.sector,
    sdgAlignment: portfolioCompanies.sdgAlignment,
  }).from(portfolioCompanies).where(eq(portfolioCompanies.fundId, fundId))

  const companyIds = companies.map(c => c.id)
  if (companyIds.length === 0) {
    return { companies, totalHours: 0, sdgBreakdown: {}, byCompany: {} }
  }

  const activities = await db.select().from(portfolioActivities)
  const allActivities = activities.filter(a => companyIds.includes(a.companyId))

  const totalHours = allActivities.reduce((sum, a) => sum + a.hours, 0)

  const sdgBreakdown: Record<string, number> = {}
  const byCompany: Record<number, number> = {}

  for (const a of allActivities) {
    if (a.sdgCategory) {
      sdgBreakdown[a.sdgCategory] = (sdgBreakdown[a.sdgCategory] || 0) + a.hours
    }
    byCompany[a.companyId] = (byCompany[a.companyId] || 0) + a.hours
  }

  return { companies, totalHours, sdgBreakdown, byCompany }
}

export async function updateFund(fundId: number, data: Partial<{ name: string; thesis: string; sdgTargets: string; plan: string }>) {
  const [updated] = await db.update(funds).set({
    ...data,
    updatedAt: Date.now(),
  }).where(eq(funds.id, fundId)).returning()
  revalidatePath("/fund")
  return updated
}