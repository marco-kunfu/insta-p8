"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

/**
 * Icon button for light/dark theme. Compact on purpose — it lives in the
 * panel header next to the account cluster, where the previous 64px pill
 * outweighed the navigation it sat beside. State still surfaces through
 * `role="switch"`/`aria-checked` plus the label, never through the icon alone.
 *
 * Color contrast: icon uses --muted-foreground on --background (≥4.5:1),
 * border uses --border (≥3:1).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggle } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {isDark ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
      {/* Hidden but readable label for assistive tech that ignores aria-label */}
      <span className="sr-only">{isDark ? "Dark theme enabled" : "Light theme enabled"}</span>
    </button>
  )
}
