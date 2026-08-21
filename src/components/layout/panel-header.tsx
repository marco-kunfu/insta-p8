"use client"

import { LogOut, Zap } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { PanelNav } from "@/components/layout/panel-nav"
import { BRAND } from "@/lib/brand"
import type { PanelMode } from "@/components/kunfupay/embed-provider"

interface PanelHeaderProps {
  mode: PanelMode
  username: string
  profilePic?: string | null
  onLogout?: () => void
}

/**
 * The panel's only chrome: underline-tab navigation plus the connected
 * account, in one row that flows with the document (no `sticky`, no `fixed`,
 * no viewport units — see PanelNav for why none of those work inside the
 * auto-resized iframe). The row is `items-stretch` on purpose: the tabs span
 * the full height so their active underline meets the header's bottom rule;
 * everything else re-centers itself with `self-center`.
 *
 * Two differences by mode, everything else identical:
 *  - brand lockup: standalone shows it, embed doesn't — the Kunfupay
 *    dashboard already frames the iframe with its own header and app name,
 *    so repeating ours is noise inside a box we didn't draw.
 *  - theme control: standalone owns its theme, embed inherits the host's
 *    (see host-theme-sync.tsx), so there is nothing to toggle there.
 */
export function PanelHeader({ mode, username, profilePic, onLogout }: PanelHeaderProps) {
  const isEmbed = mode === "embed"

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-stretch gap-2 px-3 md:h-16 md:gap-4 md:px-6">
        {!isEmbed && (
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5 self-center rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="morfeo-avatar-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white">
              <Zap className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="font-mono-ui hidden text-sm font-bold tracking-tight sm:inline">{BRAND.name}</span>
          </Link>
        )}

        <PanelNav className="flex-1" />

        {/* The rule keeps the scrolling row visibly separate from the account
            cluster: without it a half-clipped nav item looks like part of
            this group. `my-3` shortens it to a divider rather than a second
            full-height border competing with the tabs' underlines. */}
        <div className="my-3 w-px shrink-0 self-stretch bg-border" aria-hidden="true" />

        <div className="flex shrink-0 items-center gap-1 self-center md:gap-2">
          {!isEmbed && <ThemeToggle />}

          <div className="flex items-center gap-2">
            {/* The ring is Instagram's gradient on purpose: it marks whose
                account is connected, not our brand. */}
            <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500 p-[1.5px]">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-background">
                {profilePic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePic} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold" aria-hidden="true">
                    {username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <p className="hidden min-w-0 max-w-[10rem] truncate text-[13px] font-semibold leading-tight sm:block">
              @{username}
            </p>
          </div>

          <button
            onClick={onLogout}
            title={`Disconnect @${username}`}
            aria-label={`Disconnect @${username}`}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
