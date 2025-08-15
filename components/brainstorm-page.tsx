"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Lightbulb, Chrome, Smartphone, Globe, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type IdeaCategory = "extension" | "webapp" | "mobile" | "saas" | "other"
type Idea = {
  id: string
  title: string
  description: string
  category: IdeaCategory
  createdAt: Date
}

const categoryIcons = {
  extension: Chrome,
  webapp: Globe,
  mobile: Smartphone,
  saas: Zap,
  other: Lightbulb,
}

const categoryLabels = {
  extension: "Browser Extension",
  webapp: "Web App",
  mobile: "Mobile App",
  saas: "SaaS Product",
  other: "Other",
}

const initialIdeas: Idea[] = [
  {
    id: "1",
    title: "Gmail Productivity Extension",
    description: "Chrome extension that tracks time spent in Gmail and suggests breaks for deep work",
    category: "extension",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Founder Accountability App",
    description: "Mobile app where founders can share daily wins and get peer accountability",
    category: "mobile",
    createdAt: new Date("2024-01-14"),
  },
]

export default function BrainstormPage() {
  const [ideas, setIdeas] = React.useState<Idea[]>(initialIdeas)
  const [openAdd, setOpenAdd] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [newDescription, setNewDescription] = React.useState("")
  const [newCategory, setNewCategory] = React.useState<IdeaCategory>("webapp")

  const handleAddIdea = () => {
    if (!newTitle.trim()) return

    const newIdea: Idea = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      category: newCategory,
      createdAt: new Date(),
    }

    setIdeas((prev) => [newIdea, ...prev])
    setNewTitle("")
    setNewDescription("")
    setNewCategory("webapp")
    setOpenAdd(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Idea Brainstorm</h1>
            <p className="text-sm text-[#6B7280]">Capture and organize your product ideas</p>
          </div>
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="text-white bg-[#28A745] hover:bg-[#23923d]">
              <Plus className="mr-2 h-4 w-4" />
              New Idea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Capture New Idea</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="idea-title">Idea Title</Label>
                <Input
                  id="idea-title"
                  placeholder="e.g., Google Calendar Extension"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="idea-description">Description</Label>
                <Textarea
                  id="idea-description"
                  placeholder="What problem does this solve? How would it work?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={newCategory === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewCategory(key as IdeaCategory)}
                      className={newCategory === key ? "bg-[#28A745] hover:bg-[#23923d] text-white" : ""}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleAddIdea} className="w-full text-white bg-[#28A745] hover:bg-[#23923d]">
                Save Idea
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Quick Start Templates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-[#28A745]" />
            Quick Start Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <TemplateCard
              icon={Chrome}
              title="Browser Extension"
              description="Enhance productivity in existing web apps"
              onClick={() => {
                setNewTitle("Chrome Extension Idea")
                setNewDescription("A browser extension that...")
                setNewCategory("extension")
                setOpenAdd(true)
              }}
            />
            <TemplateCard
              icon={Globe}
              title="SaaS Product"
              description="Subscription-based web application"
              onClick={() => {
                setNewTitle("SaaS Product Idea")
                setNewDescription("A web application that helps...")
                setNewCategory("saas")
                setOpenAdd(true)
              }}
            />
            <TemplateCard
              icon={Smartphone}
              title="Mobile App"
              description="iOS/Android application"
              onClick={() => {
                setNewTitle("Mobile App Idea")
                setNewDescription("A mobile app that allows users to...")
                setNewCategory("mobile")
                setOpenAdd(true)
              }}
            />
            <TemplateCard
              icon={Zap}
              title="API/Tool"
              description="Developer tool or API service"
              onClick={() => {
                setNewTitle("Developer Tool Idea")
                setNewDescription("A tool that helps developers...")
                setNewCategory("other")
                setOpenAdd(true)
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ideas List */}
      <section>
        <h2 className="mb-4 text-sm font-medium text-[#374151]">Your Ideas ({ideas.length})</h2>
        {ideas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Lightbulb className="mb-4 h-12 w-12 text-[#D1D5DB]" />
              <h3 className="mb-2 font-medium">No ideas yet</h3>
              <p className="mb-4 text-sm text-[#6B7280]">
                Start capturing your product ideas and build your innovation pipeline.
              </p>
              <Button onClick={() => setOpenAdd(true)} className="text-white bg-[#28A745] hover:bg-[#23923d]">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Idea
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {ideas.map((idea) => {
              const Icon = categoryIcons[idea.category]
              return (
                <Card key={idea.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[#28A745]" />
                        <CardTitle className="text-base">{idea.title}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabels[idea.category]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#6B7280] mb-3">{idea.description}</p>
                    <p className="text-xs text-[#9CA3AF]">Added {idea.createdAt.toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function TemplateCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-gray-50"
    >
      <Icon className="mt-0.5 h-5 w-5 text-[#28A745]" />
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-[#6B7280]">{description}</div>
      </div>
    </button>
  )
}
