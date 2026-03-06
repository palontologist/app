"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Globe,
  BarChart3,
  DollarSign,
  User,
  Menu,
  X,
  MessageSquare,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/impact",
    label: "Impact",
    icon: Globe,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/value",
    label: "Value",
    icon: DollarSign,
  },
  {
    href: "/coach",
    label: "Coach",
    icon: MessageSquare,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
]

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[#28A745]/10 text-[#28A745]"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const isActive = (item: (typeof navItems)[number]) => {
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-56 lg:flex-col lg:border-r lg:bg-background lg:z-30">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#28A745]" />
            <span className="text-lg font-bold">greta</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item)}
            />
          ))}
        </nav>
        <div className="border-t p-4">
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#28A745]" />
          <span className="text-lg font-bold">greta</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="absolute left-0 top-14 bottom-0 w-64 bg-background border-r shadow-xl flex flex-col">
            <div className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive(item)}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-56">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  )
}
