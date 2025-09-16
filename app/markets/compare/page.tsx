"use client"

import { useEffect, useMemo, useState } from 'react'
import { generateCurrentAndFutureMarkets } from '@/lib/markets'
import useSWR from 'swr'
const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function MarketsComparePage() {
  const [synced, setSynced] = useState(false)
  useEffect(() => {
    // Fire and forget: sync DB with generator markets so prices show
    fetch('/api/markets/sync', { method: 'POST' }).then(() => setSynced(true)).catch(() => setSynced(true))
  }, [])
  const { data: list } = useSWR(synced ? '/api/markets/list' : null, fetcher)
  const latam = (list || []).filter((m: any) => m.region === 'LATAM')
  const africa = (list || []).filter((m: any) => m.region === 'AFRICA')

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">LATAM vs Africa — Future Markets</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RegionColumn title="LATAM" markets={latam} regionKey="LATAM" />
        <RegionColumn title="Africa" markets={africa} regionKey="AFRICA" />
      </div>
    </div>
  )
}

function RegionColumn({ title, markets, regionKey }: { title: string; markets: ReturnType<typeof generateCurrentAndFutureMarkets>; regionKey: string }) {
  return (
    <div>
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      <div className="grid gap-4">
        {markets.map((m) => (
          <MarketCard key={m.id} market={m} regionKey={regionKey} />
        ))}
      </div>
    </div>
  )
}

function MarketCard({ market, regionKey }: { market: any; regionKey: string }) {
  const [amount, setAmount] = useState(100)
  const [loading, setLoading] = useState<'YES' | 'NO' | null>(null)
  const yes = market.yesPriceCents ?? 50
  const no = market.noPriceCents ?? 50

  async function place(side: 'YES' | 'NO') {
    try {
      setLoading(side)
      const res = await fetch('/api/markets/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId: market.id, side, amountCents: amount, region: regionKey }),
      })
      if (!res.ok) throw new Error('Failed')
      alert('Bet placed')
    } catch (e) {
      alert('Error placing bet')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium leading-snug pr-4">{market.title}</h3>
        <span className="text-xs text-gray-500">{market.settlementDateISO}</span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{market.description}</p>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <label className="text-gray-700">Amount (cents)</label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value || '0'))}
          className="w-32 rounded border px-2 py-1"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <button
          className="rounded border p-3 hover:bg-green-50"
          onClick={() => place('YES')}
          disabled={loading !== null}
        >
          {loading === 'YES' ? 'Placing...' : `Buy YES (${yes}¢)`}
        </button>
        <button
          className="rounded border p-3 hover:bg-red-50"
          onClick={() => place('NO')}
          disabled={loading !== null}
        >
          {loading === 'NO' ? 'Placing...' : `Buy NO (${no}¢)`}
        </button>
      </div>
      <Position marketId={market.id} sideYesPrice={yes} sideNoPrice={no} />
      <div className="mt-2 text-xs text-gray-500">
        <span>Source: {market.source || '—'}</span>
        {market.unit ? <span className="ml-2">Unit: {market.unit}</span> : null}
      </div>
    </div>
  )
}

function Position({ marketId, sideYesPrice, sideNoPrice }: { marketId: string; sideYesPrice: number; sideNoPrice: number }) {
  const { data } = useSWR('/api/markets/positions', fetcher)
  const rows = (data || []).filter((p: any) => p.marketId === marketId)
  if (rows.length === 0) return null
  const pnl = rows.reduce((acc: number, r: any) => acc + (r.pnlCents || 0), 0)
  const invested = rows.reduce((acc: number, r: any) => acc + (r.amountCents || 0), 0)
  return (
    <div className="mt-3 rounded border p-2 text-xs text-gray-700">
      <div>Positions: {rows.length} • Invested: {(invested/100).toFixed(2)} • PnL: {(pnl/100).toFixed(2)}</div>
    </div>
  )
}

