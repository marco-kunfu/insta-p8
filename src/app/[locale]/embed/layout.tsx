"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { KunfupayEmbedProvider } from "@/components/kunfupay/embed-provider"
import { Loader2 } from "lucide-react"

export default function EmbedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <KunfupayEmbedProvider>
            <EmbedShell>{children}</EmbedShell>
        </KunfupayEmbedProvider>
    )
}

function EmbedShell({
    children,
}: {
    children: React.ReactNode
}) {
    const { username, profilePic, logout, isLoading } = useInstagramSession()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
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