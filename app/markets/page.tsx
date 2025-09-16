import { generateCurrentAndFutureMarkets } from '@/lib/markets'

export const dynamic = 'force-dynamic'

export default function MarketsPage() {
  const markets = generateCurrentAndFutureMarkets(new Date())
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">Current & Future Markets</h1>
      <div className="grid gap-4">
        {markets.map((m) => (
          <div key={m.id} className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{m.title}</h2>
              <span className="text-xs text-gray-500">Settle: {m.settlementDateISO}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{m.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded border p-3">
                <div className="text-gray-500">YES</div>
                <div className="text-xs text-gray-500">live</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-gray-500">NO</div>
                <div className="text-xs text-gray-500">live</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <span>Source: {m.source || '—'}</span>
              {m.unit ? <span className="ml-2">Unit: {m.unit}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

