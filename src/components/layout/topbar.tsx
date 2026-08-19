"use client"

import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileNav } from "@/components/layout/mobile-nav"
import { BRAND } from "@/lib/brand"

interface TopBarProps {
  username: string
  profilePic?: string | null
  onLogout?: () => void
}

/**
 * Dashboard top bar, following the shell on business.kunfupay.com: a
 * 56/64px header with a #ece9fb bottom rule and a right-hand action cluster
 * holding the account chip. Their bar also carries a command-palette search
 * and a notification bell; both are left out rather than mocked, since there
 * is nothing behind either one here.
 */
export function TopBar({ username, profilePic, onLogout }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex min-h-14 md:min-h-16 items-center gap-2 border-b border-border bg-background px-4 md:px-6">
      <div className="md:hidden flex items-center gap-2">
        <MobileNav username={username} profilePic={profilePic} onLogout={onLogout} />
        <span className="font-serif-display text-lg">{BRAND.name}</span>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <ThemeToggle />

        <div className="flex items-center gap-2.5 rounded-full border border-border py-1 pl-1 pr-2.5">
          {/* The ring is Instagram's gradient on purpose: it marks whose
              account is connected, not our brand. */}
          <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500 p-[1.5px]">
            <div className="w-full h-full overflow-hidden rounded-full bg-background flex items-center justify-center">
              {profilePic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePic} alt={username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold">{username.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="hidden sm:block min-w-0 leading-tight">
            <p className="text-[13px] font-semibold truncate">@{username}</p>
            <p className="morfeo-eyebrow text-muted-foreground">connected</p>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className="ml-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
