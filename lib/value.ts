// Pure value calculation utilities — no server/DB imports, safe to use anywhere

export const DEFAULT_RATES = {
  design: 200,     // $200 per task
  content: 180,    // $180 per task
  sales: 120,      // $120 per task
  strategic: 136,  // $136 per task (~2hr @ $68/hr)
  other: 100,      // $100 per task
}

/**
 * Calculate estimated task value in dollars.
 * Uses alignment category to pick the base rate, then applies alignment score as weight.
 */
export function calculateTaskValue(
  alignmentScore: number | null,
  alignmentCategory: string | null | undefined,
  rates: typeof DEFAULT_RATES = DEFAULT_RATES,
): number {
  const cat = (alignmentCategory || "other").toLowerCase()
  if (cat === "distraction") return 0

  let base: number
  switch (cat) {
    case "high":       base = rates.strategic; break
    case "medium":     base = rates.content;   break
    case "low":        base = rates.sales;     break
    case "design":     base = rates.design;    break
    case "content":    base = rates.content;   break
    case "sales":      base = rates.sales;     break
    case "strategic":  base = rates.strategic; break
    default:           base = rates.other
  }

  const score = Math.max(0, Math.min(100, alignmentScore ?? 50))
  return Math.round(base * (score / 100))
}

/** Format dollar amount: $1,234 */
export function formatDollars(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value}`
}

/** Get the start of the current week (Monday) as a Date */
export function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday
  const start = new Date(now)
  start.setDate(now.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return start
}

/** Short day labels Mon–Sun */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** Get day label (Mon=0 … Sun=6) from a Date */
export function getDayLabel(date: Date): string {
  const js = date.getDay() // 0=Sun, 1=Mon ... 6=Sat
  const idx = js === 0 ? 6 : js - 1
  return DAY_LABELS[idx]
}
