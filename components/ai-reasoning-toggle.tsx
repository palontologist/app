"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type AIReasoningToggleProps = {
  reasoning?: string
  title?: string
}

export default function AIReasoningToggle({ reasoning, title = "AI Reasoning" }: AIReasoningToggleProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  if (!reasoning) return null

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 px-2 text-xs text-[#6B7280] hover:text-[#28A745]"
      >
        {isOpen ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
        <Brain className="h-3 w-3 mr-1" />
        {title}
      </Button>

      {isOpen && (
        <Card className="mt-2 border-[#28A745]/20">
          <CardContent className="p-3">
            <div className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap">{reasoning}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
