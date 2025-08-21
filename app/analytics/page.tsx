import { Inter } from "next/font/google"
import EnhancedAnalytics from "@/components/enhanced-analytics"

const inter = Inter({ subsets: ["latin"] })

export default async function AnalyticsPage() {
  return (
    <div className={inter.className}>
      <EnhancedAnalytics />
    </div>
  )
}
