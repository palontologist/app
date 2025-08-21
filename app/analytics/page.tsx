import { Inter } from "next/font/google"
import SimpleAnalytics from "@/components/simple-analytics"

const inter = Inter({ subsets: ["latin"] })

export default async function AnalyticsPage() {
  return (
    <div className={inter.className}>
      <SimpleAnalytics />
    </div>
  )
}
