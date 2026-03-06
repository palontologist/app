"use client"

import * as React from "react"
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCoachResponse } from "@/app/actions/coach"

type Message = {
  role: "user" | "coach"
  content: string
  timestamp: Date
}

const STARTER_PROMPTS = [
  "What should I focus on today?",
  "Help me prioritize my tasks",
  "Am I on track with my mission?",
  "How can I improve my alignment?",
]

export function CoachCard() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "coach",
      content:
        "Hi! I'm greta, your AI coach. I'm here to help you stay aligned with your mission, prioritize what matters, and make progress on your goals. What's on your mind?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const result = await getCoachResponse(messageText)
      const coachMessage: Message = {
        role: "coach",
        content: result.success
          ? result.response!
          : result.error || "Something went wrong. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, coachMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[480px]">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <MessageSquare className="h-4 w-4 text-[#28A745]" />
          AI Coach
          <span className="ml-auto text-xs font-normal text-muted-foreground bg-[#28A745]/10 text-[#28A745] px-2 py-0.5 rounded-full">
            Powered by Groq
          </span>
        </CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "coach"
                  ? "bg-[#28A745]/10 text-[#28A745]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {msg.role === "coach" ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-[#28A745] text-white rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-[#28A745]/10 text-[#28A745] flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Starter prompts (only shown before any user message) */}
      {messages.filter((m) => m.role === "user").length === 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="text-xs border rounded-full px-2 py-1 hover:bg-accent transition-colors text-muted-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask your coach..."
          className="flex-1 text-sm"
          disabled={loading}
        />
        <Button
          size="icon"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="bg-[#28A745] hover:bg-[#23923d] text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
