"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Users, DollarSign, BarChart3, User } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/clients", label: "Clients", Icon: Users },
  { href: "/value", label: "Value", Icon: DollarSign },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-slate-900">
            greta
          </Link>
          
          <nav className="flex items-center gap-1">
            {TABS.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/")
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === "/profile"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}