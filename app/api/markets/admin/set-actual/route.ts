import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, markets } from '@/lib/db'
import { eq } from 'drizzle-orm'

// Minimal admin guard: restrict to your admin user id(s)
const ADMIN_IDS = (process.env.MARKETS_ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean)

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session.userId || (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(session.userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { marketId, outcome, actualValue } = body as { marketId?: string; outcome?: 'YES' | 'NO' | 'N/A'; actualValue?: string }
  if (!marketId || !outcome) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  await db.update(markets).set({ outcome, actualValue: actualValue || null, updatedAt: Date.now() }).where(eq(markets.id, marketId))
  return NextResponse.json({ ok: true })
}

