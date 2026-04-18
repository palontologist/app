import { NextRequest, NextResponse } from "next/server"
import { db, funds, portfolioCompanies, portfolioActivities } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId")
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
  }

  const body = await request.json()
  const { activities } = body as { activities: Array<{ company: string; date: string; hours: number; activityType: string; sdgCategory: string; description: string }> }

  const fundRows = await db.select().from(funds).where(eq(funds.organizationId, orgId))
  if (!fundRows[0]) {
    return NextResponse.json({ error: "No fund found" }, { status: 400 })
  }

  const fund = fundRows[0]
  const companies = await db.select().from(portfolioCompanies).where(eq(portfolioCompanies.fundId, fund.id))
  const companyMap = new Map(companies.map(c => [c.name.toLowerCase(), c.id]))

  const created: number[] = []
  for (const activity of activities) {
    const companyId = companyMap.get(activity.company.toLowerCase())
    if (!companyId) continue

    const [createdActivity] = await db.insert(portfolioActivities).values({
      companyId,
      date: activity.date,
      activityType: activity.activityType,
      hours: activity.hours,
      sdgCategory: activity.sdgCategory,
      description: activity.description,
    }).returning()
    created.push(createdActivity.id)
  }

  return NextResponse.json({ inserted: created.length })
}