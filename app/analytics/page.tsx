import { Inter } from "next/font/google"
import SimpleAnalytics from "@/components/simple-analytics"
import { getAnalyticsSnapshot } from "@/app/actions/analytics_snapshot"

const inter = Inter({ subsets: ["latin"] })

export default async function AnalyticsPage() {
  const snapshot = await getAnalyticsSnapshot()
  return (
    <div className={inter.className}>
      <SimpleAnalytics initialData={snapshot} />
    </div>
  )
}
