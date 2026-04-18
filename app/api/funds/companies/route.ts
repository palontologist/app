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
    return NextResponse.json([])
  }

  const companies = await db.select().from(portfolioCompanies).where(eq(portfolioCompanies.fundId, fund.id))
  return NextResponse.json(companies)
}

export async function POST(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId")
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
  }

  const body = await request.json()
  const fundRows = await db.select().from(funds).where(eq(funds.organizationId, orgId))
  
  if (!fundRows[0]) {
    const [createdFund] = await db.insert(funds).values({
      organizationId: orgId,
      name: body.fundName || "New Fund",
    }).returning()
    
    const [created] = await db.insert(portfolioCompanies).values({
      fundId: createdFund.id,
      name: body.name,
      sector: body.sector,
      sdgAlignment: body.sdgAlignment || 0,
      website: body.website,
      notes: body.notes,
    }).returning()
    return NextResponse.json(created)
  }

  const [created] = await db.insert(portfolioCompanies).values({
    fundId: fundRows[0].id,
    name: body.name,
    sector: body.sector,
    sdgAlignment: body.sdgAlignment || 0,
    website: body.website,
    notes: body.notes,
  }).returning()
  return NextResponse.json(created)
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  await db.delete(portfolioCompanies).where(eq(portfolioCompanies.id, parseInt(id)))
  return NextResponse.json({ success: true })
}