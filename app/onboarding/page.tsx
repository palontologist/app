import { Inter } from "next/font/google"
import OnboardingFlow from "@/components/onboarding-flow"

const inter = Inter({ subsets: ["latin"] })

export default function OnboardingPage() {
  return (
    <main className={inter.className}>
      <OnboardingFlow />
    </main>
  )
}
