import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, marketBets } from '@/lib/db'

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

    await db.insert(marketBets).values({
      userId: session.userId,
      marketId,
      side,
      amountCents,
      region: region || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('bet error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

