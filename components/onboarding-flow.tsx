"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, Plus, X, Calendar, DollarSign, Users, Briefcase, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { completeOnboarding } from "@/app/actions/onboarding"
import { createClient, getClients } from "@/app/actions/value"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"

type OnboardingStep = "welcome" | "about" | "clients" | "insight" | "complete"

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = React.useState<OnboardingStep>("welcome")
  const [name, setName] = React.useState("")
  const [targetRate, setTargetRate] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [clients, setClients] = React.useState<{id: number, name: string, email: string, hourlyRate: number}[]>([])
  const [newClientEmail, setNewClientEmail] = React.useState("")
  const [newClientName, setNewClientName] = React.useState("")
  
  // User profile fields
  const [company, setCompany] = React.useState("")
  const [profession, setProfession] = React.useState("")
  const [useCase, setUseCase] = React.useState("")

  const handleAddClient = async () => {
    if (!newClientName.trim()) return
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", newClientName)
      if (newClientEmail) formData.append("email", newClientEmail)
      if (targetRate) formData.append("hourlyRate", (parseInt(targetRate.replace(/\D/g, "")) * 100).toString())
      
      const result = await createClient(formData)
      if (result.success) {
        setClients(prev => [...prev, { 
          id: Date.now(), 
          name: newClientName, 
          email: newClientEmail, 
          hourlyRate: targetRate ? parseInt(targetRate.replace(/\D/g, "")) * 100 : 6000 
        }])
        setNewClientName("")
        setNewClientEmail("")
      }
    } catch (err) {
      console.error("Failed to add client:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("mission", `Target rate: ${targetRate} | Clients: ${clients.map(c => c.name).join(", ")}`)
      formData.append("worldVision", useCase || "value tracking")
      formData.append("focusAreas", [profession, company].filter(Boolean).join(", "))

      const result = await completeOnboarding(formData)
      router.push(result.success ? "/dashboard" : "/dashboard")
    } catch (error) {
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <SignedOut>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to greta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-slate-500">
              Discover which clients are really paying you.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full bg-green-600 hover:bg-green-700">Get Started</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </SignedOut>
      
      <SignedIn>
        {step === "welcome" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Let's find your real rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Your name</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How should we call you?"
                />
              </div>
              <div className="space-y-2">
                <Label>Your target hourly rate ($)</Label>
                <Input 
                  value={targetRate} 
                  onChange={(e) => setTargetRate(e.target.value)}
                  placeholder="e.g., 75"
                />
              </div>
              <Button
                onClick={() => setStep("about")}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!name.trim()}
              >
                Next: About You
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "about" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Tell us about yourself</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Your profession</Label>
                <Input 
                  value={profession} 
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g., Designer, Consultant, Developer"
                />
              </div>
              <div className="space-y-2">
                <Label>Company you work for (or "Self-employed")</Label>
                <Input 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc"
                />
              </div>
              <div className="space-y-2">
                <Label>What will you use greta for?</Label>
                <Input 
                  value={useCase} 
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="e.g., Track which clients are worth my time"
                />
              </div>
              <Button
                onClick={() => setStep("clients")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Next: Add Clients
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "clients" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Add your clients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500 text-center">
                Add clients you work with. We'll calculate your real rates.
              </p>
              
              {/* Add client form inline */}
              <div className="flex gap-2">
                <Input 
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Client name"
                  className="flex-1"
                />
                <Input 
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="flex-1"
                />
              </div>
              <Button
                onClick={handleAddClient}
                className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                disabled={!newClientName.trim() || isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>

              {/* Client list */}
              {clients.length > 0 && (
                <div className="space-y-2">
                  {clients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{client.name}</p>
                        {client.email && <p className="text-xs text-slate-500">{client.email}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${client.hourlyRate/100}/hr</p>
                        <p className="text-xs text-slate-400">billed</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setStep("insight")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                See My Rates
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "insight" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Your Value Insight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clients.length > 0 ? (
                <>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    {clients.slice(0, 3).map((client) => (
                      <div key={client.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{client.name}</p>
                          <p className="text-xs text-slate-500">${client.hourlyRate/100}/hr billed</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${client.hourlyRate/100 >= 60 ? "text-green-600" : "text-red-500"}`}>
                            ~${Math.round(client.hourlyRate/100 * 0.6)}/hr
                          </p>
                          <p className="text-xs text-slate-400">effective</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 text-center">
                    Effective rate is ~60% of billed (accounting for prep, emails, meetings)
                  </p>
                </>
              ) : (
                <p className="text-center text-slate-500">
                  Add clients to see your rates here.
                </p>
              )}

              <Button
                onClick={handleComplete}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Setting up..." : "Enter greta"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </SignedIn>
    </div>
  )
}