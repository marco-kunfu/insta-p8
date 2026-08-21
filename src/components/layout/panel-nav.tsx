"use client"

import { useEffect, useRef } from "react"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { VISIBLE_NAV_ITEMS, isNavItemActive, panelBaseFor } from "@/components/layout/nav-items"

/**
 * The panel's navigation: one horizontal row of underline tabs.
 *
 * Why a row and not a sidebar — the app runs inside an auto-resized iframe
 * (`kunfupay:resize` sends scrollHeight, so the host makes the frame exactly
 * as tall as the content). In that box there is no viewport to pin things to:
 * `fixed`/`sticky` never engage, and a 256px rail eats a third of the width
 * the host gives us. A row costs one line of height and degrades by scrolling.
 *
 * The tabs fill the header's height (h-full down the tree) so the 2px active
 * underline lands on the header's own bottom rule instead of floating.
 *
 * Accessibility notes:
 *  - Real links inside a labelled <nav>, not `role="tab"`: the route changes,
 *    so screen readers should treat these as navigation, and native link
 *    semantics survive the iframe boundary where custom widgets get fragile.
 *  - `aria-current="page"` marks the active section — the styling is a hint,
 *    not the signal.
 *  - `overscroll-contain` stops a horizontal flick from scrolling the HOST
 *    page once this row hits its end.
 *  - Keyboard focus scrolls its item into view (browsers do this for the
 *    scroll container; `scroll-mx` keeps it off the clipped edge), and the
 *    active item is scrolled into view on mount so it is never off-screen.
 *  - The focus ring is inset: the links span the full header height, so an
 *    outset ring would clip against the header's edges.
 */
export function PanelNav({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const base = panelBaseFor(pathname)
  const activeRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    // "center", not "nearest": nearest leaves the item flush against the clip
    // edge, where it reads as a cut-off sliver instead of the current section.
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [pathname])

  return (
    <nav aria-label="Sections" className={cn("min-w-0 h-full", className)}>
      <ul
        className={cn(
          "flex h-full items-stretch gap-1 overflow-x-auto overscroll-x-contain motion-safe:scroll-smooth snap-x",
          // The scrollbar would sit on the header's bottom rule; a soft mask on
          // both edges is the affordance instead — a clipped item fades out, so
          // "there is more here" reads as intent rather than as a layout bug.
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[mask-image:linear-gradient(to_right,transparent_0,black_10px,black_calc(100%-10px),transparent_100%)]",
        )}
      >
        {VISIBLE_NAV_ITEMS.map((item) => {
          const href = base + item.path
          const active = isNavItemActive(pathname, item)
          return (
            <li key={href} ref={active ? activeRef : undefined} className="flex shrink-0 snap-start scroll-mx-2">
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // The 44px+ target (WCAG 2.5.8) comes from spanning the
                  // header height — the iframe is often driven on a phone
                  // inside the Kunfupay dashboard.
                  "flex items-center gap-2 border-b-2 px-3 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
