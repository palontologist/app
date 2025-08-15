import { Inter } from "next/font/google"
import EnhancedDashboard from "@/components/enhanced-dashboard"

const inter = Inter({ subsets: ["latin"] })

export default function DashboardPage() {
  return (
    <main className={inter.className}>
      <EnhancedDashboard />
    </main>
  )
}
