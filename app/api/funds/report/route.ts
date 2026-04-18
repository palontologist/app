import { NextRequest, NextResponse } from "next/server"
import { db, funds, portfolioCompanies, portfolioActivities } from "@/lib/db"
import { eq } from "drizzle-orm"

const QUARTER_MONTHS: Record<string, number[]> = {
  "Q1": [1, 2, 3],
  "Q2": [4, 5, 6],
  "Q3": [7, 8, 9],
  "Q4": [10, 11, 12],
}

export async function POST(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId")
  const quarter = request.nextUrl.searchParams.get("quarter") || "Q1"
  const year = parseInt(request.nextUrl.searchParams.get("year") || "2026")

  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
  }

  const fundRows = await db.select().from(funds).where(eq(funds.organizationId, orgId))
  const fund = fundRows[0]
  if (!fund) {
    return NextResponse.json({ error: "No fund found" }, { status: 400 })
  }

  const companies = await db.select().from(portfolioCompanies).where(eq(portfolioCompanies.fundId, fund.id))
  const companyIds = companies.map(c => c.id)

  if (companyIds.length === 0) {
    return NextResponse.json({ totalHours: 0, companies: 0, sdgGoals: 0, sdgBreakdown: {}, companyImpact: [] })
  }

  const activities = await db.select().from(portfolioActivities)
  const allActivities = activities.filter(a => companyIds.includes(a.companyId))

  const yearStr = year.toString()
  const quarterMonths = QUARTER_MONTHS[quarter]
  const filteredActivities = allActivities.filter(a => {
    const dateParts = a.date.split("-")
    if (dateParts.length !== 3) return false
    const activityYear = parseInt(dateParts[0])
    const activityMonth = parseInt(dateParts[1])
    return activityYear === year && quarterMonths.includes(activityMonth)
  })

  const totalHours = filteredActivities.reduce((sum: number, a: any) => sum + a.hours, 0)

  const sdgBreakdown: Record<string, number> = {}
  const companyImpact: Record<number, { name: string; hours: number; sdg: number }> = {}

  for (const a of filteredActivities) {
    if (a.sdgCategory) {
      sdgBreakdown[a.sdgCategory] = (sdgBreakdown[a.sdgCategory] || 0) + a.hours
    }
    const company = companies.find(c => c.id === a.companyId)
    if (company) {
      if (!companyImpact[a.companyId]) {
        companyImpact[a.companyId] = { name: company.name, hours: 0, sdg: company.sdgAlignment }
      }
      companyImpact[a.companyId].hours += a.hours
    }
  }

  return NextResponse.json({
    totalHours,
    companies: companies.length,
    sdgGoals: Object.keys(sdgBreakdown).length,
    sdgBreakdown,
    companyImpact: Object.values(companyImpact),
  })
}