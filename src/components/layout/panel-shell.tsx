"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { LandingPage } from "@/components/layout/landing-page"
import { Loader2 } from "lucide-react"

/**
 * The panel chrome (sidebar, topbar, Instagram gate), shared by both
 * surfaces: /embed (inside the Kunfupay iframe) and /dashboard (standalone).
 * The mounting layout decides the mode by wrapping this in the matching
 * vendor provider — the shell itself is mode-agnostic.
 */
export function PanelShell({
    children,
}: {
    children: React.ReactNode
}) {
    const { userId, username, profilePic, logout, isLoading } = useInstagramSession()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // No linked Instagram account: show the landing (with its "Log in"
    // button) instead of the dashboard chrome, which would otherwise render
    // as "@User connected" around pages that each say "please log in".
    if (!userId) {
        return <LandingPage />
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
                <Sidebar
                    className="h-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl"
                    username={username || "User"}
                    profilePic={profilePic}
                    onLogout={logout}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
                <TopBar username={username || "User"} profilePic={profilePic} onLogout={logout} />

                <main className="flex-1 relative overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
