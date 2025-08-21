"use client"

import * as React from "react"

// Minimal shadcn-style wrappers used by Analytics components

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config?: Record<string, { label: string; color: string }>
}

export function ChartContainer({ className, style, children }: ChartContainerProps) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

export function ChartTooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function ChartTooltipContent({
  labelKey,
}: {
  labelKey?: string
}) {
  // Recharts will inject payload when used; this is a simple neutral wrapper
  return <div className="rounded border bg-white p-2 text-xs shadow-sm">{labelKey}</div>
}

