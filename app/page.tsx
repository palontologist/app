import Link from "next/link"
import { Inter } from "next/font/google"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export default async function LandingPage() {
  const { userId } = await auth()
  if (userId) {
    const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
    if (rows[0]?.onboarded) {
      redirect("/dashboard")
    } else {
      redirect("/onboarding")
    }
  }
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
          Ship What Matters.
        </h1>
        <p className="mt-4 text-base text-[#4B5563] sm:text-lg">
          Greta powers founders with Mission Alignment & AI Insight.
        </p>
        <p className="mt-4 text-sm text-[#6B7280] sm:text-base">
          Every task you complete moves you toward your deepest goals. Greta shows your real Mission Alignment Score, then gives you AI-powered suggestions for what to do next—so you achieve customer traction, not just busywork.
        </p>

        <div className="mt-8 space-y-3">
          <Link href="/sign-in?redirect_url=/onboarding" aria-label="Get Started Free with greta">
            <Button
              className="h-11 rounded-full px-6 text-white bg-[#28A745] hover:bg-[#23923d] transition-colors w-full"
              size="lg"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-4 text-sm text-[#6B7280]">
          Start making your impact visible.
        </div>

        {/* Key Features */}
        <div className="mt-12 grid gap-4 text-left w-full max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#28A745]"></div>
            <span className="text-sm text-[#6B7280]">Mission Alignment Score: see progress, not just completion</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#28A745]"></div>
            <span className="text-sm text-[#6B7280]">AI Insights: actionable steps for lasting traction</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#28A745]"></div>
            <span className="text-sm text-[#6B7280]">Transparent Analytics: know what moves you closer to your vision</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-16 text-xs text-[#6B7280]">Built for founders, makers, and doers.</p>
      </section>
    </main>
  )
}
