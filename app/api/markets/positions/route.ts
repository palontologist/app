import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, marketBets, markets } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bets = await db.select().from(marketBets).where(eq(marketBets.userId, session.userId))
  const result = [] as any[]
  for (const b of bets) {
    const m = await db.select().from(markets).where(eq(markets.id, b.marketId))
    const mk = m[0]
    const current = b.side === 'YES' ? (mk?.yesPriceCents ?? 50) : (mk?.noPriceCents ?? 50)
    const entry = b.priceCents
    const shares = (b.sharesMilli || 0) / 1000
    const pnlCents = Math.round(shares * (current - entry))
    result.push({
      marketId: b.marketId,
      side: b.side,
      amountCents: b.amountCents,
      priceCents: b.priceCents,
      shares,
      currentPriceCents: current,
      pnlCents,
      region: b.region,
      settled: b.settled,
      payoutCents: b.payoutCents,
    })
  }

  return NextResponse.json(result)
}

