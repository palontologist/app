export type Market = {
  id: string
  title: string
  description: string
  settlementDateISO: string // YYYY-MM-DD
  unit?: string
  source?: string
  threshold?: number
}

export type Commodity = {
  key: string
  name: string
  template: (date: Date) => Market[]
}

function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function endOfMonth(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
  return d
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  return d
}

// Coffee markets (Brazil CECAFÉ exports, Colombia FNC internal price)
export const coffeeCommodity: Commodity = {
  key: 'coffee',
  name: 'Coffee',
  template: (asof: Date) => {
    const months = [0, 1, 2]
    const markets: Market[] = []
    for (const m of months) {
      const monthStart = addMonths(asof, m)
      const settleDate = endOfMonth(monthStart)
      const settleISO = formatISODate(settleDate)
      const ym = `${settleDate.getUTCFullYear()}-${String(settleDate.getUTCMonth() + 1).padStart(2, '0')}`

      markets.push({
        id: `br-exports-3_5m-${ym}`,
        title: `Will Brazil CECAFÉ exports exceed 3.5M bags by ${settleISO}?`,
        description: 'Based on CECAFÉ monthly export data',
        settlementDateISO: settleISO,
        unit: '60kg bags',
        source: 'CECAFÉ',
        threshold: 3.5e6,
      })

      markets.push({
        id: `co-fnc-1_5m-${ym}`,
        title: `Will Colombia FNC internal price exceed 1,500,000 COP/125kg by ${settleISO}?`,
        description: 'Based on Federación Nacional de Cafeteros daily price',
        settlementDateISO: settleISO,
        unit: 'COP/125kg',
        source: 'FNC',
        threshold: 1_500_000,
      })
    }
    return markets
  },
}

// Add a few common commodities as placeholders (gold, oil) for future expansion
export const baseCommodities: Commodity[] = [coffeeCommodity]

export function generateCurrentAndFutureMarkets(asof: Date = new Date()): Market[] {
  const list: Market[] = []
  for (const c of baseCommodities) {
    list.push(...c.template(asof))
  }
  return list
}

