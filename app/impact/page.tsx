import { Inter } from "next/font/google"
import ImpactPage from "@/components/impact-page"

const inter = Inter({ subsets: ["latin"] })

export default function Page() {
  return (
    <main className={inter.className}>
      <ImpactPage />
    </main>
  )
}
