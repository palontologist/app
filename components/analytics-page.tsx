"use client"

import type React from "react"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { day: "Mon", aligned: 70, distraction: 30 },
  { day: "Tue", aligned: 85, distraction: 15 },
  { day: "Wed", aligned: 60, distraction: 40 },
  { day: "Thu", aligned: 78, distraction: 22 },
  { day: "Fri", aligned: 82, distraction: 18 },
  { day: "Sat", aligned: 55, distraction: 45 },
  { day: "Sun", aligned: 68, distraction: 32 },
]

const chartConfig = {
  aligned: { label: "Aligned", color: "hsl(var(--chart-1))" },
  distraction: { label: "Distraction", color: "hsl(var(--chart-2))" },
} as const

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-semibold">Your Weekly Focus Report</h1>
      </header>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alignment Over the Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Use shadcn/ui Chart components with Recharts for composable charts [^1] */}
          <ChartContainer
            config={chartConfig}
            className="h-64 w-full"
            style={
              {
                // Set chart color variables (ChartContainer expects these for hsl(var(--chart-x)))
                // --chart-1: accent green, --chart-2: neutral gray
                ["--chart-1"]: "134 61% 41%", // ~#28A745 in HSL
                ["--chart-2"]: "220 9% 85%", // gray
              } as React.CSSProperties
            }
          >
            <ResponsiveContainer>
              <BarChart data={data} stackOffset="none">
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  content={
                    <ChartTooltip>
                      <ChartTooltipContent />
                    </ChartTooltip>
                  }
                />
                <Bar dataKey="aligned" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="distraction" stackId="a" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <p className="mt-3 text-xs text-[#6B7280]">
            {"Percent of actions categorized as 'Aligned' vs 'Distraction' per day."}
          </p>
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      <Card className="border-l-4 border-l-[#28A745]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Smart Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-[#111827]">
          <SuggestionItem>
            {"You spent 6 hours on 'Distraction' tasks this week. Consider delegating or declining similar items."}
          </SuggestionItem>
          <SuggestionItem>
            {"You crushed it! 85% of your actions were highly aligned. Let's set a new goal for next week."}
          </SuggestionItem>
        </CardContent>
      </Card>
    </div>
  )
}

function SuggestionItem({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border bg-white p-3">{children}</div>
}
