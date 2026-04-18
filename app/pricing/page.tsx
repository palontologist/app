import { Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const PLANS = [
  {
    name: "Solo",
    price: "$19",
    period: "/mo",
    description: "For freelancers managing 3-6 clients",
    features: [
      "Up to 5 clients",
      "Calendar sync (Google)",
      "Payment integration (Stripe/CSV)",
      "Effective hourly rate tracking",
      "Underpriced client alerts",
      "Rate recommendations",
    ],
    cta: "Get started",
    dark: false,
  },
  {
    name: "Studio",
    price: "$49",
    period: "/mo",
    description: "For small teams and agencies",
    features: [
      "Up to 15 clients",
      "Shared team dashboards",
      "Revenue per client analytics",
      "Client ROI tracking",
      "Priority support",
      "CSV exports",
    ],
    cta: "Get started",
    dark: true,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-white">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">greta</Link>
          <Link href="/sign-in" className="text-sm text-slate-500 hover:text-slate-900">Login</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-xs font-medium text-green-600 uppercase tracking-wider text-center mb-3">Pricing</p>
        <h1 className="text-4xl font-bold text-slate-900 text-center mb-4">Simple pricing, locked in for life</h1>
        <p className="text-lg text-slate-500 text-center mb-16">
          Founding users get these prices forever. No increase.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl ${
                plan.dark 
                  ? "bg-slate-900 text-white" 
                  : "bg-white border border-slate-200"
              }`}
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className={`text-sm ${plan.dark ? "text-slate-400" : "text-slate-500"}`}>
                  {plan.description}
                </p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={plan.dark ? "text-slate-400" : "text-slate-500"}>{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className={`flex items-center gap-2 text-sm ${
                    plan.dark ? "text-slate-300" : "text-slate-600"
                  }`}>
                    <Check className={`w-4 h-4 ${plan.dark ? "text-green-400" : "text-green-600"}`} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/sign-in?redirect_url=/onboarding">
                <Button className={`w-full ${
                  plan.dark 
                    ? "bg-white text-slate-900 hover:bg-slate-100" 
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}>
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-500">
            Need more than 15 clients?{" "}
            <a href="mailto:hello@greta.app" className="text-green-600 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>

      <footer className="py-8 text-center text-sm text-slate-400 border-t border-slate-100">
        <p>&copy; 2026 greta. Built for freelancers.</p>
      </footer>
    </div>
  )
}