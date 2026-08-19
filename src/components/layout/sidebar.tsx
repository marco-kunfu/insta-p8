"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import {
  Zap, LayoutDashboard, Settings, BarChart3,
  MessageSquare, Snowflake,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BRAND } from "@/lib/brand"

/**
 * Analytics and Settings are placeholder screens that only say "Coming Soon".
 * They are hidden from navigation rather than deleted — the routes and their
 * pages stay in the codebase, so flipping this to `true` brings them back.
 */
const SHOW_PLACEHOLDER_PAGES = false

const NAV = [
  { href: "/embed", icon: LayoutDashboard, label: "Overview" },
  { href: "/embed/automations", icon: Zap, label: "Automations" },
  { href: "/embed/inbox", icon: MessageSquare, label: "Inbox" },
  { href: "/embed/ice-breakers", icon: Snowflake, label: "Ice breakers" },
  { href: "/embed/analytics", icon: BarChart3, label: "Analytics", placeholder: true },
]

const VISIBLE_NAV = NAV.filter((item) => SHOW_PLACEHOLDER_PAGES || !item.placeholder)

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  username?: string
  profilePic?: string | null
  className?: string
  onLogout?: () => void
  onNavigate?: () => void
}

export function Sidebar({ className, username = "creator", profilePic, onLogout, onNavigate, ...props }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn("flex flex-col bg-sidebar text-sidebar-foreground", className)} {...props}>
      {/* Brand */}
            <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
              <div className="morfeo-avatar-gradient w-7 h-7 text-white rounded-md flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <span className="font-mono-ui text-sm font-bold tracking-tight text-sidebar-foreground flex-1">{BRAND.name}</span>
            </div>

            <div className="mx-5 h-px bg-sidebar-border" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {VISIBLE_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              // Measured on business.kunfupay.com: the active row is solid
              // #734bfc with white text, 9px radius, 14px/600 — not a gradient
              // chip and not a soft tint. MORFEO.md's icon-above-label gradient
              // describes their mobile bottom-nav, not this sidebar.
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[9px] text-sm transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                active
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}

      </nav>

    </aside>
  )
}