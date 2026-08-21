"use client"

import { PanelHeader } from "@/components/layout/panel-header"
import { RouteAnnouncer } from "@/components/layout/route-announcer"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { useVendor } from "@/components/kunfupay/embed-provider"
import { LandingPage } from "@/components/layout/landing-page"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

/**
 * The panel chrome (header, Instagram gate), shared by both surfaces:
 * /embed (inside the Kunfupay iframe) and /dashboard (standalone). One
 * horizontal navigation for both — the old sidebar-and-topbar dashboard shell
 * could not work inside an auto-resized iframe (no viewport to pin to, and a
 * 256px rail on a narrow frame), and running two different navigations for
 * the same pages was worse than running the one that survives both boxes.
 *
 * Mode-dependent bits live in PanelHeader; here it only decides whether the
 * shell may claim the full viewport height. In embed it must not: the host
 * sets the iframe height from our scrollHeight, so a `min-h-dvh` shell would
 * pin the frame to whatever height it was last given.
 */
export function PanelShell({ children }: { children: React.ReactNode }) {
    const { mode } = useVendor()
    const { userId, username, profilePic, logout, isLoading } = useInstagramSession()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="sr-only">Loading</span>
            </div>
        )
    }

    // No linked Instagram account: show the landing (with its "Log in"
    // button) instead of the panel chrome, which would otherwise render
    // as "@User connected" around pages that each say "please log in".
    if (!userId) {
        return <LandingPage />
    }

    return (
        <div
            className={cn(
                "relative flex flex-col bg-background text-foreground",
                mode === "standalone" && "min-h-dvh",
            )}
        >
            {/* First tab stop: jumps the keyboard past the section row. Inside
                the iframe this matters more than usual — the host's own chrome
                already precedes us in the tab order. */}
            <a
                href="#panel-content"
                // The padding is focus-prefixed on purpose: Tailwind's
                // `not-sr-only` resets padding to 0, so an unprefixed px-3
                // loses to it and the link shows up as a cramped sliver.
                className="sr-only rounded-md bg-primary text-sm font-semibold text-primary-foreground focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:px-3 focus:py-2"
            >
                Skip to content
            </a>

            <PanelHeader
                mode={mode}
                username={username || "User"}
                profilePic={profilePic}
                onLogout={logout}
            />

            <RouteAnnouncer />

            <main id="panel-content" tabIndex={-1} className="flex-1 focus:outline-none">
                {children}
            </main>
        </div>
    )
}
