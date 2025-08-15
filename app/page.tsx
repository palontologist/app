"use client"

import Link from "next/link"
import { Inter } from "next/font/google"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const inter = Inter({ subsets: ["latin"] })

export default function OnboardingPage() {
  return (
    <main
      className={`${inter.className} relative min-h-dvh bg-white text-[#1A1A1A]`}
      aria-labelledby="onboarding-title"
    >
      {/* Subtle abstract background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#28A745]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#28A745]/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            background: "radial-gradient(1200px 400px at 50% -10%, rgba(0,0,0,0.04), rgba(255,255,255,0))",
          }}
        />
      </div>

      <section className="relative mx-auto flex max-w-md flex-col items-center px-6 pt-24 text-center sm:max-w-lg sm:pt-28">
        <h1 id="onboarding-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {"Align Your Action. Achieve Your Vision."}
        </h1>
        <p className="mt-4 text-base text-[#4B5563] sm:text-lg">
          {
            "greta helps you connect your daily work to your ultimate goal. Track time, build habits, achieve your mission."
          }
        </p>

        <div className="mt-8 space-y-3">
          <Link href="/onboarding" aria-label="Get Started with greta">
            <Button
              className="h-11 rounded-full px-6 text-white bg-[#28A745] hover:bg-[#23923d] transition-colors w-full"
              size="lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-4 text-left w-full max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#28A745]"></div>
            <span className="text-sm text-[#6B7280]">Time tracking with smart task detection</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#28A745]"></div>
            <span className="text-sm text-[#6B7280]">Goal progress with activity breakdown</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#28A745]"></div>
            <span className="text-sm text-[#6B7280]">AI-powered alignment insights</span>
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-16 text-xs text-[#6B7280]">{"Minimal. Focused. Built for founders."}</p>
      </section>
    </main>
  )
}
