import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, markets } from '@/lib/db'
import { generateCurrentAndFutureMarkets } from '@/lib/markets'
import { eq } from 'drizzle-orm'

export async function POST() {
  const session = await auth()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Simple sync: upsert current generator markets into DB with default prices
  const list = generateCurrentAndFutureMarkets(new Date())
  for (const m of list) {
    const rows = await db.select().from(markets).where(eq(markets.id, m.id))
    const base = {
      id: m.id,
      title: m.title,
      description: m.description,
      region: (m as any).region || null,
      settlementDateISO: m.settlementDateISO,
      yesPriceCents: 58, // placeholder odds you can later compute from orderbook/liquidity
      noPriceCents: 42,
      threshold: m.threshold != null ? String(m.threshold) : null,
      unit: m.unit || null,
      source: m.source || null,
      updatedAt: Date.now(),
    }
    if (rows.length === 0) {
      await db.insert(markets).values({ ...base, createdAt: Date.now(), status: 'OPEN' })
    } else {
      await db.update(markets).set(base).where(eq(markets.id, m.id))
    }
  }
  return NextResponse.json({ ok: true, count: list.length })
}

