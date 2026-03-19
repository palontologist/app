"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Home, Target, TrendingUp, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard", label: "Home",     Icon: Home },
  { href: "/goals",     label: "Goals",    Icon: Target },
  { href: "/progress",  label: "Progress", Icon: TrendingUp },
  { href: "/social",    label: "Social",   Icon: Users },
  { href: "/profile",   label: "Profile",  Icon: User },
] as const

interface AppShellProps {
  children: React.ReactNode
  /** Optional alignment score shown as badge in top nav (pass from page) */
  alignmentScore?: number | null
}

export function AppShell({ children, alignmentScore }: AppShellProps) {
  const pathname = usePathname()
  const { user } = useUser()

  const initials = React.useMemo(() => {
    const name = user?.fullName || user?.firstName || ""
    return name
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  }, [user])

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 lg:flex-row">
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-56 lg:border-r lg:bg-white lg:z-30">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="h-7 w-7 rounded-full bg-green-600 flex items-center justify-center">
            <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
              <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" />
              <path d="M7 4v3l2 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">greta</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4 text-xs text-slate-400 text-center">greta · mission aligned</div>
      </aside>

      {/* ── Mobile top nav ── */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur-md border-b border-black/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center">
            <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
              <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" />
              <path d="M7 4v3l2 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-slate-800">greta</span>
        </div>
        <div className="flex items-center gap-2">
          {alignmentScore != null && (
            <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
              {alignmentScore}% aligned
            </span>
          )}
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 lg:pl-56 pb-20 lg:pb-0">
        {children}
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-white/95 backdrop-blur-md border-t border-black/[0.06] px-2 pt-2.5 pb-5">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-1 transition-colors",
                active ? "" : "hover:bg-green-50/40"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-green-600" : "text-slate-400"
                )}
              />
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  active ? "text-green-600 font-semibold" : "text-slate-400"
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
