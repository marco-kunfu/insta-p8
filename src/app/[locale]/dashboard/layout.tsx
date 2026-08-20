"use client"

// /dashboard/* — the app on its own domain, outside the Kunfupay iframe. The
// route decides the mode: no embed handshake, localStorage session, and the
// Instagram OAuth runs in this same tab (see embed-provider.tsx).
import { StandaloneVendorProvider } from "@/components/kunfupay/embed-provider"
import { PanelShell } from "@/components/layout/panel-shell"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <StandaloneVendorProvider>
            <PanelShell>{children}</PanelShell>
        </StandaloneVendorProvider>
    )
}
