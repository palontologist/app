import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, marketBets, markets } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { marketId, side, amountCents, region } = body as {
      marketId?: string
      side?: 'YES' | 'NO'
      amountCents?: number
      region?: string
    }

    if (!marketId || !side || !amountCents || amountCents <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // fetch current price
    const m = await db.select().from(markets).where(eq(markets.id, marketId))
    const yesPrice = m[0]?.yesPriceCents ?? 50
    const noPrice = m[0]?.noPriceCents ?? 50
    const priceCents = side === 'YES' ? yesPrice : noPrice
    // compute shares: amount / price (scaled by 1000 for integer math)
    const sharesMilli = Math.floor((amountCents * 1000) / Math.max(1, priceCents))

    await db.insert(marketBets).values({
      userId: session.userId,
      marketId,
      side,
      amountCents,
      priceCents,
      sharesMilli,
      region: region || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('bet error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

