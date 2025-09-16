import { NextResponse } from 'next/server'
import { db, markets } from '@/lib/db'

export async function GET() {
  const rows = await db.select().from(markets)
  return NextResponse.json(rows)
}

