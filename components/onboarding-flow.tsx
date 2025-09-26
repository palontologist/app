"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowLeft, Target, Lightbulb, Rocket, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { completeOnboarding } from "@/app/actions/onboarding"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"

type OnboardingStep = "welcome" | "mission" | "vision" | "goals" | "complete"

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = React.useState<OnboardingStep>("welcome")
  const [mission, setMission] = React.useState("")
  const [goals, setGoals] = React.useState("")
  const [name, setName] = React.useState("")
  const [worldVision, setWorldVision] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("mission", mission)
      formData.append("worldVision", worldVision)
      formData.append("focusAreas", goals)

      const result = await completeOnboarding(formData)

      if (result.success) {
        router.push(result.redirect || "/dashboard")
      } else {
        console.error("Failed to complete onboarding:", result.error)
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error completing onboarding:", error)
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <SignedOut>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in to start onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-[#6B7280]">You'll be redirected back here to finish setting up your profile.</p>
            <SignInButton mode="modal">
              <Button className="text-white bg-[#28A745] hover:bg-[#23923d]">Sign In</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </SignedOut>
      <SignedIn>
      {/* Progress indicator */}
      <div className="mb-8 flex items-center justify-center">
        <div className="flex items-center gap-2">
          {["welcome", "mission", "vision", "goals", "complete"].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`h-2 w-8 rounded-full transition-colors ${
                  getCurrentStepIndex(step) >= i ? "bg-[#28A745]" : "bg-gray-200"
                }`}
              />
              {i < 4 && <div className="h-px w-4 bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

  {step === "welcome" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#28A745]/10">
              <Target className="h-8 w-8 text-[#28A745]" />
            </div>
            <CardTitle className="text-xl">Welcome to Greta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-[#6B7280]">
              Ship what matters. Greta powers founders with Mission Alignment & AI Insights to help you achieve customer traction, not just busywork.
            </p>
            <div className="space-y-3">
              <Label htmlFor="founder-name">What should we call you?</Label>
              <Input id="founder-name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button
              onClick={() => setStep("mission")}
              className="w-full text-white bg-[#28A745] hover:bg-[#23923d]"
              disabled={!name.trim()}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

  {step === "mission" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#28A745]/10">
              <Rocket className="h-8 w-8 text-[#28A745]" />
            </div>
            <CardTitle className="text-xl">Define Your North Star</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-[#6B7280]">
              {
                "Your North Star is your ultimate mission. What impact do you want to make? What problem are you solving?"
              }
            </p>
            <div className="space-y-3">
              <Label htmlFor="mission-statement">Your Mission Statement</Label>
              <Textarea
                id="mission-statement"
                placeholder="e.g., Empower 10,000 founders to ship mission-aligned work every day"
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-[#6B7280]">
                {"Think big picture. This should inspire you every morning and guide every decision."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("welcome")} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep("vision")}
                className="flex-1 text-white bg-[#28A745] hover:bg-[#23923d]"
                disabled={!mission.trim()}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

  {step === "vision" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#28A745]/10">
              <Globe className="h-8 w-8 text-[#28A745]" />
            </div>
            <CardTitle className="text-xl">The World You Want to Create</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-[#6B7280]">
              {"Beyond your business mission, what kind of world do you want to help create? What values drive you?"}
            </p>
            <div className="space-y-3">
              <Label htmlFor="world-vision">Your Vision for the World</Label>
              <Textarea
                id="world-vision"
                placeholder="e.g., A world where every person has the tools and confidence to build something meaningful..."
                value={worldVision}
                onChange={(e) => setWorldVision(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-[#6B7280]">
                {"Think about the underlying values and societal change that motivates you beyond profit."}
              </p>
            </div>

            {/* Values Quick Select */}
            <div className="space-y-3">
              <Label>Core Values (Select what resonates)</Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  "Empowerment",
                  "Innovation",
                  "Equality",
                  "Sustainability",
                  "Education",
                  "Connection",
                  "Freedom",
                  "Creativity",
                  "Justice",
                  "Wellness",
                  "Transparency",
                  "Community",
                ].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-transparent"
                    onClick={() => {
                      if (!worldVision.includes(value)) {
                        setWorldVision((prev) =>
                          prev ? `${prev}, ${value.toLowerCase()}` : `A world built on ${value.toLowerCase()}`,
                        )
                      }
                    }}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("mission")} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep("goals")}
                className="flex-1 text-white bg-[#28A745] hover:bg-[#23923d]"
                disabled={!worldVision.trim()}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

  {step === "goals" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#28A745]/10">
              <Lightbulb className="h-8 w-8 text-[#28A745]" />
            </div>
            <CardTitle className="text-xl">Current Focus Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-[#6B7280]">
              {"What are the key areas you're working on right now? These help us understand your daily context."}
            </p>
            <div className="space-y-3">
              <Label htmlFor="current-goals">Key Focus Areas (Optional)</Label>
              <Textarea
                id="current-goals"
                placeholder="e.g., Product development, fundraising, team building, customer acquisition..."
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-[#6B7280]">
                {"These can evolve over time. We'll use them to better categorize your daily actions."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("vision")} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep("complete")} className="flex-1 text-white bg-[#28A745] hover:bg-[#23923d]">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

  {step === "complete" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#28A745]/10">
              <Target className="h-8 w-8 text-[#28A745]" />
            </div>
            <CardTitle className="text-xl">You're All Set!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium text-sm mb-2">Your North Star:</h3>
                <p className="text-sm text-[#374151]">{mission}</p>
              </div>
              <div className="rounded-lg bg-[#28A745]/5 p-4 border border-[#28A745]/20">
                <h3 className="font-medium text-sm mb-2">Your Vision for the World:</h3>
                <p className="text-sm text-[#374151]">{worldVision}</p>
              </div>
            </div>
            <p className="text-center text-[#6B7280]">
              {"Perfect! Now let's start tracking how your daily actions align with this mission."}
            </p>
            <Button
              onClick={handleComplete}
              className="w-full text-white bg-[#28A745] hover:bg-[#23923d]"
              disabled={isLoading}
            >
              {isLoading ? "Setting up..." : "Enter greta"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
      </SignedIn>
    </div>
  )
}

function getCurrentStepIndex(step: OnboardingStep): number {
  const steps = ["welcome", "mission", "vision", "goals", "complete"]
  return steps.indexOf(step)
}
