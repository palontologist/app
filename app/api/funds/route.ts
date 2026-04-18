import { NextRequest, NextResponse } from "next/server"
import { db, funds, portfolioCompanies, portfolioActivities } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId")
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
  }

  const fundRows = await db.select().from(funds).where(eq(funds.organizationId, orgId))
  const fund = fundRows[0]
  if (!fund) {
    return NextResponse.json({ companies: [], totalHours: 0, sdgBreakdown: {}, byCompany: {} })
  }

  const companies = await db.select().from(portfolioCompanies).where(eq(portfolioCompanies.fundId, fund.id))
  const companyIds = companies.map(c => c.id)

  if (companyIds.length === 0) {
    return NextResponse.json({ companies, totalHours: 0, sdgBreakdown: {}, byCompany: {} })
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

  return NextResponse.json({ companies, totalHours, sdgBreakdown, byCompany })
}