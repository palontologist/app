"use client"

import { useMemo, useState } from 'react'
import { generateCurrentAndFutureMarkets } from '@/lib/markets'

export default function MarketsComparePage() {
  const allMarkets = useMemo(() => generateCurrentAndFutureMarkets(new Date()), [])
  const latam = allMarkets.filter((m) => m.region === 'LATAM')
  const africa = allMarkets.filter((m) => m.region === 'AFRICA')

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
          {loading === 'YES' ? 'Placing...' : 'Buy YES'}
        </button>
        <button
          className="rounded border p-3 hover:bg-red-50"
          onClick={() => place('NO')}
          disabled={loading !== null}
        >
          {loading === 'NO' ? 'Placing...' : 'Buy NO'}
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <span>Source: {market.source || '—'}</span>
        {market.unit ? <span className="ml-2">Unit: {market.unit}</span> : null}
      </div>
    </div>
  )
}

