import {
  BarChart3, LayoutDashboard, MessageSquare, Snowflake, Zap,
  type LucideIcon,
} from "lucide-react"

/**
 * Analytics and Settings are placeholder screens that only say "Coming Soon".
 * They are hidden from navigation rather than deleted — the routes and their
 * pages stay in the codebase, so flipping this to `true` brings them back.
 */
const SHOW_PLACEHOLDER_PAGES = false

export type NavItem = {
  /** Suffix appended to the surface base (`/embed` or `/dashboard`). */
  path: string
  icon: LucideIcon
  label: string
  placeholder?: boolean
}

/**
 * Single source of truth for the panel sections, shared by every chrome that
 * renders navigation. Paths are suffixes: the base (/embed inside the
 * Kunfupay iframe, /dashboard standalone) comes from the current route —
 * the mode IS the route.
 */
export const NAV_ITEMS: NavItem[] = [
  { path: "", icon: LayoutDashboard, label: "Overview" },
  { path: "/automations", icon: Zap, label: "Automations" },
  { path: "/inbox", icon: MessageSquare, label: "Inbox" },
  { path: "/ice-breakers", icon: Snowflake, label: "Ice breakers" },
  { path: "/analytics", icon: BarChart3, label: "Analytics", placeholder: true },
]

export const VISIBLE_NAV_ITEMS = NAV_ITEMS.filter(
  (item) => SHOW_PLACEHOLDER_PAGES || !item.placeholder,
)

/** Which surface a locale-stripped pathname belongs to. */
export function panelBaseFor(pathname: string | null | undefined): "/embed" | "/dashboard" {
  return pathname?.startsWith("/embed") ? "/embed" : "/dashboard"
}

/** The part of the path after the surface base: "/embed/inbox" → "/inbox". */
export function navSuffixFor(pathname: string | null | undefined): string {
  if (!pathname) return ""
  return pathname.slice(panelBaseFor(pathname).length)
}

export function isNavItemActive(pathname: string | null | undefined, item: NavItem): boolean {
  const suffix = navSuffixFor(pathname)
  // Overview owns the base path exactly; every other section owns its subtree.
  return item.path === "" ? suffix === "" || suffix === "/" : suffix.startsWith(item.path)
}

/** Label of the section a pathname lands on, for announcements and titles. */
export function navLabelFor(pathname: string | null | undefined): string | null {
  return NAV_ITEMS.find((item) => isNavItemActive(pathname, item))?.label ?? null
}
