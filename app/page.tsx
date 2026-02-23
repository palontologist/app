import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
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
    <main className="relative min-h-dvh bg-white text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <div className="text-xl font-bold text-primary">Greta</div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">Product</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground">FAQ</a>
          </div>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-balance">
                Turn your calendar into cash and equity.
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Greta is a value OS for freelancers and founders. It turns your meetings, deep work, and payments into a live story of how your work is compounding into revenue, valuation, and impact.
              </p>
              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Link href="/sign-in?redirect_url=/onboarding">
                  <Button size="lg" className="bg-[#28A745] hover:bg-[#23923d] h-12 px-8">
                    Get early access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

              </div>
              <p className="text-sm text-muted-foreground">
                Built for solo builders, indie agencies, and early-stage teams.
              </p>
            </div>

            {/* Right Content - Hero Dashboard Mock */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="space-y-4">
                <div className="text-sm font-semibold text-muted-foreground">This Month</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <div className="text-2xl font-bold">$7,420</div>
                      <div className="text-sm text-green-600">+32%</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hourly Rate</div>
                    <div className="mt-1 text-2xl font-bold">$142/hr</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Equity Value</div>
                    <div className="mt-1 text-2xl font-bold">$38k</div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-3">Time by Client vs Revenue</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                      <div className="text-sm">Client A</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">12.5h → $1,875</span>
                        <span className="text-xs font-semibold text-red-600">Underpriced</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                      <div className="text-sm">Client B</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">8h → $1,600</span>
                        <span className="text-xs font-semibold text-green-600">On target</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                      <div className="text-sm">Startup X</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">20h • Equity</span>
                        <span className="text-xs font-semibold">~$24k</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-border px-6 py-16 sm:px-8 sm:py-24 bg-secondary/20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Freelancers Card */}
            <div className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-2xl font-bold mb-4">Freelancers & small studios</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#28A745] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Auto-convert calendar + tasks into billable hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#28A745] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">See which clients <strong>actually pay for your time</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#28A745] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Get smart <strong>pricing suggestions</strong> so you stop undercharging</span>
                </li>
              </ul>
            </div>

            {/* Founders Card */}
            <div className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-2xl font-bold mb-4">Early-stage founders & builders</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#28A745] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">See where your week really goes: product, sales, fundraising, ops</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#28A745] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Map time to <strong>revenue, runway, and valuation</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#28A745] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Tell a clear story to cofounders, advisors, and investors</span>
                </li>
              </ul>
            </div>
          </div>
          <p className="text-center mt-8 text-muted-foreground">Same engine, two lenses. Greta adapts to how you work.</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-16">How Greta works</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="space-y-4">
              <div className="rounded-full w-12 h-12 bg-[#28A745]/10 flex items-center justify-center">
                <span className="font-bold text-[#28A745]">1</span>
              </div>
              <h3 className="text-xl font-semibold">Connect your work graph</h3>
              <p className="text-muted-foreground">Sync your calendar, tasks, and payments (Stripe / PayPal / M-Pesa / bank export). Greta builds a single view of your time and money.</p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <div className="rounded-full w-12 h-12 bg-[#28A745]/10 flex items-center justify-center">
                <span className="font-bold text-[#28A745]">2</span>
              </div>
              <h3 className="text-xl font-semibold">Tag projects, clients, and bets</h3>
              <p className="text-muted-foreground">Tag events and work blocks to clients, projects, or company 'bets'. Greta learns your patterns so future sessions auto-tag.</p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <div className="rounded-full w-12 h-12 bg-[#28A745]/10 flex items-center justify-center">
                <span className="font-bold text-[#28A745]">3</span>
              </div>
              <h3 className="text-xl font-semibold">See how your work compounds</h3>
              <p className="text-muted-foreground">Greta calculates effective hourly rate, value per project, and 'value density' of your week.</p>
            </div>

            {/* Step 4 */}
            <div className="space-y-4">
              <div className="rounded-full w-12 h-12 bg-[#28A745]/10 flex items-center justify-center">
                <span className="font-bold text-[#28A745]">4</span>
              </div>
              <h3 className="text-xl font-semibold">Adjust pricing, scope, and focus</h3>
              <p className="text-muted-foreground">Use Greta's insights to raise rates, renegotiate retainers, cut low-value work, and double down on what compounds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-border px-6 py-16 sm:px-8 sm:py-24 bg-secondary/20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-16">Built with the first 50 builders</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-white p-6">
              <p className="text-muted-foreground mb-4">"I stopped doing 'free strategy calls' that never converted — Greta showed me I was bleeding 10+ hours/month."</p>
              <p className="text-sm font-semibold">Freelance designer</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-6">
              <p className="text-muted-foreground mb-4">"Helped us show an investor exactly how our time turns into ARR."</p>
              <p className="text-sm font-semibold">SaaS founder</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-6">
              <p className="text-muted-foreground mb-4">"Finally realized which client was sucking half my week for 20% of the revenue."</p>
              <p className="text-sm font-semibold">Agency owner</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-4">Simple pricing that respects your runway</h2>
          <p className="text-center text-muted-foreground mb-16">Early users get lifetime discounts and direct input into the product roadmap.</p>
          <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-2xl font-bold mb-2">Solo</h3>
              <p className="text-muted-foreground mb-6">For freelancers/solo founders</p>
              <ul className="space-y-2 mb-8">
                <li className="text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#28A745]" />
                  Track your value across 2 calendars
                </li>
                <li className="text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#28A745]" />
                  Connect 5 clients/projects
                </li>
              </ul>
              <Link href="/sign-in?redirect_url=/onboarding">
                <Button className="w-full bg-[#28A745] hover:bg-[#23923d]">Join Solo beta</Button>
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/20 p-8">
              <h3 className="text-2xl font-bold mb-2">Studio / Team</h3>
              <p className="text-muted-foreground mb-6">Coming later</p>
              <ul className="space-y-2 mb-8">
                <li className="text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#28A745]" />
                  Shared view across your team
                </li>
                <li className="text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#28A745]" />
                  Multi-client workspace
                </li>
              </ul>
              <Button variant="outline" className="w-full">Join waitlist</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border px-6 py-16 sm:px-8 sm:py-24 bg-secondary/20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold text-center mb-16">Frequently asked questions</h2>
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-white p-6">
              <h3 className="font-semibold text-lg mb-2">Do I have to track time manually?</h3>
              <p className="text-muted-foreground">No. Greta starts with your calendar and tasks; you can refine tags, but you don't have to start a timer.</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-6">
              <h3 className="font-semibold text-lg mb-2">How does Greta know my revenue and payments?</h3>
              <p className="text-muted-foreground">Connect Stripe / PayPal / M-Pesa / or CSV exports. Greta links payments to clients/projects and overlays them on your time.</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-6">
              <h3 className="font-semibold text-lg mb-2">Will Greta replace my invoicing tool?</h3>
              <p className="text-muted-foreground">At first, Greta will <strong>suggest invoices and pricing</strong> that you can export to your existing tools. Later, direct invoicing may come.</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-6">
              <h3 className="font-semibold text-lg mb-2">Is my data secure?</h3>
              <p className="text-muted-foreground">Yes. We use encryption, read-only connections to your services, and never store sensitive payment data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 sm:px-8 sm:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-4">Know your value before everyone else does.</h2>
          <p className="text-lg opacity-90 mb-8">If you're a freelancer or early-stage founder, Greta shows you exactly how your work compounds into revenue, valuation, and impact.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="your@email.com"
              className="px-4 py-3 rounded-lg text-foreground flex-1 max-w-xs"
            />
            <select className="px-4 py-3 rounded-lg text-foreground">
              <option>I'm a Freelancer</option>
              <option>I'm a Founder</option>
            </select>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
              Get early access
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 sm:px-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Greta. Built for value-driven builders.</p>
      </footer>
    </main>
  )
}
