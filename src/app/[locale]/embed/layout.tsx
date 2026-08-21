"use client"

// /embed/* — the app inside the Kunfupay iframe. The route decides the mode:
// this layout always runs the embed handshake; the standalone surface is
// /dashboard (see the one&one concept in embed-provider.tsx).
import { KunfupayEmbedProvider } from "@/components/kunfupay/embed-provider"
import { HostThemeSync } from "@/components/kunfupay/host-theme-sync"
import { PanelShell } from "@/components/layout/panel-shell"

export default function EmbedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <KunfupayEmbedProvider>
            {/* Theme follows the host dashboard here — see HostThemeSync. */}
            <HostThemeSync />
            <PanelShell>{children}</PanelShell>
        </KunfupayEmbedProvider>
    )
}
