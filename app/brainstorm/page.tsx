import { Inter } from "next/font/google"
import BrainstormPage from "@/components/brainstorm-page"

const inter = Inter({ subsets: ["latin"] })

export default function Page() {
  return (
    <main className={inter.className}>
      <BrainstormPage />
    </main>
  )
}
