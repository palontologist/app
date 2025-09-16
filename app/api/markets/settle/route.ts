import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, markets, marketBets } from '@/lib/db'
import { and, eq } from 'drizzle-orm'

// Intended to be called by a cron on month-end + buffer
export async function POST() {
  const session = await auth()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find markets that should be resolved (status OPEN, settlement date in the past, and outcome set)
  const all = await db.select().from(markets)
  const now = new Date()
  let settled = 0
  for (const m of all) {
    if (m.status !== 'OPEN') continue
    const settleDate = new Date(m.settlementDateISO + 'T23:59:59Z')
    const shouldSettle = settleDate.getTime() < now.getTime() && (m.outcome === 'YES' || m.outcome === 'NO')
    if (!shouldSettle) continue

    // Payout: YES bets get 100 - price if YES, NO bets get 100 - price if NO; here we simply pay 100 per share on winner
    const winner = m.outcome
    const bets = await db.select().from(marketBets).where(and(eq(marketBets.marketId, m.id), eq(marketBets.settled, false)))
    for (const b of bets) {
      const shares = (b.sharesMilli || 0) / 1000
      const payout = b.side === winner ? Math.round(shares * 100) : 0
      await db.update(marketBets).set({ payoutCents: payout, settled: true, settledAt: Date.now() }).where(eq(marketBets.id, b.id))
    }

    await db.update(markets).set({ status: 'RESOLVED', resolvedAt: Date.now(), updatedAt: Date.now() }).where(eq(markets.id, m.id))
    settled++
  }

  return NextResponse.json({ ok: true, settled })
}

