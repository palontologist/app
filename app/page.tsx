import Link from "next/link"
import { ArrowRight, Check, DollarSign, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"
import { db, userProfiles } from "@/lib/db"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

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
    <main className="min-h-dvh bg-white text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">greta</span>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-slate-500 hover:text-slate-900">Pricing</Link>
            <Link href="/sign-in" className="text-sm text-slate-500 hover:text-slate-900">Login</Link>
          </div>
        </div>
      </nav>

      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-4">Value Intelligence</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
                That client is paying you $12/hour. Not $60.
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8">
                You bill $60/hour. But after meetings, emails, and scope creep — one client pays you less than minimum wage. Greta shows you which clients cost you money, so you can fix it.
              </p>
              <div className="flex gap-4">
                <Link href="/sign-in?redirect_url=/onboarding">
                  <Button className="bg-green-600 hover:bg-green-700 h-11 px-6">
                    Find my real rates
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                For freelance designers, consultants & agencies
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Your Real Rate</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-slate-900">$12/hr</span>
                    <span className="text-sm text-red-600 font-medium">80% below rate</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Billed</p>
                    <p className="text-lg font-semibold text-slate-900">$3,600</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Actual</p>
                    <p className="text-lg font-semibold text-red-600">$960</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Hours</p>
                    <p className="text-lg font-semibold text-slate-900">80h</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Client Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <span className="text-sm text-slate-700">Acme Corp</span>
                        <p className="text-xs text-slate-400">$60/hr billed × 30h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">$12/hr effective</p>
                        <p className="text-xs text-slate-400">$360 → $360</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                      <div>
                        <span className="text-sm text-slate-700">Startup X</span>
                        <p className="text-xs text-slate-400">$60/hr billed × 8h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">$185/hr effective</p>
                        <p className="text-xs text-slate-400">$480 → $1,480</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              The moment that changes everything
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Not a feature. A revelation. See which clients are secretly losing you money.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-100">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">The $12/hr Client</h3>
              <p className="text-sm text-slate-500">
                You charge $60 but after all the unpaid work, you're making less than a fast food worker.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">The Raise Signal</h3>
              <p className="text-sm text-slate-500">
                Data-backed proof that Client B can afford 40% more. Don't guess — know.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Keep or Fire?</h3>
              <p className="text-sm text-slate-500">
                Finally have the data to make objective decisions about who deserves your time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wider text-center mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Three steps to clarity</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">1</div>
              <div>
                <h3 className="font-semibold text-slate-900">Connect your calendar</h3>
                <p className="text-sm text-slate-500">Google Calendar integration tracks every client meeting automatically.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">2</div>
              <div>
                <h3 className="font-semibold text-slate-900">Link payments (optional)</h3>
                <p className="text-sm text-slate-500">Connect Stripe or upload invoices. See real money in vs. time spent.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">3</div>
              <div>
                <h3 className="font-semibold text-slate-900">Get the revelation</h3>
                <p className="text-sm text-slate-500">See your effective hourly rate per client. Spot underpriced work instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wider text-center mb-3">Pricing</p>
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Simple pricing, locked in</h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-slate-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Solo</h3>
                <p className="text-sm text-slate-500">For freelancers</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$19</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-600" />
                  Up to 5 clients
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-600" />
                  Calendar sync
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-600" />
                  Effective rate calculation
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-600" />
                  Underpriced alerts
                </li>
              </ul>
              <Link href="/sign-in?redirect_url=/onboarding">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">Get started</Button>
              </Link>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">Studio</h3>
                <p className="text-sm text-slate-400">For small teams</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$49</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Up to 15 clients
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Team dashboards
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Revenue analytics
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Priority support
                </li>
              </ul>
              <Link href="/sign-in?redirect_url=/onboarding">
                <Button className="w-full bg-white text-slate-900 hover:bg-slate-100">Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Know your numbers.</h2>
          <p className="text-slate-400 mb-8">
            Stop guessing which clients are worth it.
          </p>
          <Link href="/sign-in?redirect_url=/onboarding">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              Get started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-slate-400">
        <p>&copy; 2026 greta. Value intelligence for freelancers.</p>
      </footer>
    </main>
  )
}