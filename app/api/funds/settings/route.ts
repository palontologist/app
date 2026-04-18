import { NextRequest, NextResponse } from "next/server"
import { db, funds } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId")
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
  }

  const fundRows = await db.select().from(funds).where(eq(funds.organizationId, orgId))
  if (!fundRows[0]) {
    return NextResponse.json(null)
  }
  const fund = fundRows[0]
  return NextResponse.json({
    thesis: fund.thesis,
    sdgTargets: fund.sdgTargets,
    name: fund.name,
    plan: fund.plan,
    seatLimit: fund.seatLimit,
    seatsUsed: fund.seatsUsed,
    ssoProvider: fund.ssoProvider,
    ssoEntityId: fund.ssoEntityId,
    ssoSsoUrl: fund.ssoSsoUrl,
    apiKey: fund.apiKey,
    apiKeyEnabled: fund.apiKeyEnabled,
  })
}

export async function PUT(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId")
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
  }

  const body = await request.json()
  const {
    thesis,
    sdgTargets,
    name,
    plan,
    seatLimit,
    seatsUsed,
    ssoProvider,
    ssoEntityId,
    ssoSsoUrl,
    apiKey,
    apiKeyEnabled,
  } = body as {
    thesis?: string
    sdgTargets?: string
    name?: string
    plan?: string
    seatLimit?: number
    seatsUsed?: number
    ssoProvider?: string
    ssoEntityId?: string
    ssoSsoUrl?: string
    apiKey?: string
    apiKeyEnabled?: boolean
  }

  const fundRows = await db.select().from(funds).where(eq(funds.organizationId, orgId))
  if (!fundRows[0]) {
    const [created] = await db.insert(funds).values({
      organizationId: orgId,
      name: name || "My Fund",
      thesis: thesis || "",
      sdgTargets: sdgTargets || "7,13",
      plan: plan || "studio",
    }).returning()
    return NextResponse.json(created)
  }

  const [updated] = await db.update(funds).set({
    ...(thesis !== undefined && { thesis }),
    ...(sdgTargets !== undefined && { sdgTargets }),
    ...(name !== undefined && { name }),
    ...(plan !== undefined && { plan }),
    ...(seatLimit !== undefined && { seatLimit }),
    ...(seatsUsed !== undefined && { seatsUsed }),
    ...(ssoProvider !== undefined && { ssoProvider }),
    ...(ssoEntityId !== undefined && { ssoEntityId }),
    ...(ssoSsoUrl !== undefined && { ssoSsoUrl }),
    ...(apiKey !== undefined && { apiKey }),
    ...(apiKeyEnabled !== undefined && { apiKeyEnabled }),
    updatedAt: Date.now(),
  }).where(eq(funds.organizationId, orgId)).returning()

  return NextResponse.json(updated)
}