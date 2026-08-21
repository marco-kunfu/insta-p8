"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { kunfupayEmbed } from "@/lib/kunfupay-embed-sdk"
import { setEmbedToken } from "@/lib/embed-session"
import { safeSession } from "@/lib/safe-storage"
import { routing } from "@/i18n/routing"
import { Loader2 } from "lucide-react"

/**
 * Panel mode, decided BY ROUTE — the one&one concept:
 *   /embed/*     → "embed": the app lives inside the Kunfupay iframe.
 *   /dashboard/* → "standalone": the app opened directly on its own domain.
 * No window.top sniffing: each surface mounts the provider that matches it.
 */
export type PanelMode = "standalone" | "embed"

type VendorContextValue = {
  /** Kunfupay vendor id — always set in embed mode, null in standalone. */
  vendorId: string | null
  mode: PanelMode
}

const VendorContext = createContext<VendorContextValue>({
  vendorId: null,
  mode: "standalone",
})

export function useVendor() {
  return useContext(VendorContext)
}

/**
 * Standalone surface (/dashboard): no Kunfupay handshake, no vendor session.
 * The Instagram session lives in localStorage and OAuth runs in this same tab.
 */
export function StandaloneVendorProvider({ children }: { children: React.ReactNode }) {
  return (
    <VendorContext.Provider value={{ vendorId: null, mode: "standalone" }}>
      {children}
    </VendorContext.Provider>
  )
}

function normalizeLocale(raw: string | null | undefined): (typeof routing.locales)[number] | null {
  if (!raw) return null
  const short = raw.toLowerCase().slice(0, 2)
  return (routing.locales as readonly string[]).includes(short)
    ? (short as (typeof routing.locales)[number])
    : null
}

/**
 * Kunfupay embed handshake, from the KunfuApp template:
 *  1. Verify ?embed_token=... against /api/auth/verify-token → vendorId
 *     (?vendorId=xxx bypasses verification for local development).
 *  2. Signal kunfupayEmbed.ready() and keep the iframe height synced.
 *  3. Follow the host dashboard's locale (postMessage kunfupay:locale,
 *     falling back to ?lang= / navigator.language on first load).
 *
 * vendorId persists in sessionStorage so in-app navigation (which drops the
 * query params) keeps the vendor without re-verifying on every page.
 *
 * This provider assumes it IS embedded (the /embed route decides that); a
 * visit with no way to resolve a vendor is an error, not a standalone
 * fallback — the standalone surface lives at /dashboard.
 */
export function KunfupayEmbedProvider({ children }: { children: React.ReactNode }) {
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const [vendorId, setVendorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ---- Locale sync with the host ----
  useEffect(() => {
    const replaceWithLocale = (locale: (typeof routing.locales)[number]) => {
      const query = Object.fromEntries(new URLSearchParams(window.location.search))
      router.replace({ pathname, query }, { locale })
    }

    const unsub = kunfupayEmbed.onLocaleReceived((raw) => {
      const next = normalizeLocale(raw)
      if (next && next !== currentLocale) {
        replaceWithLocale(next)
      }
    })

    if (!kunfupayEmbed.hasReceivedLocale()) {
      const initial = normalizeLocale(kunfupayEmbed.getLocaleFromUrl())
      if (initial && initial !== currentLocale) {
        replaceWithLocale(initial)
      }
    }

    return unsub
  }, [currentLocale, pathname, router])

  // ---- Token verification → vendorId ----
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get("embed_token")
    const devVendorId = urlParams.get("vendorId")
    const stored = safeSession.getItem("kunfupay_vendor_id")

    if (devVendorId) {
      safeSession.setItem("kunfupay_vendor_id", devVendorId)
      setVendorId(devVendorId)
      kunfupayEmbed.ready()
      return
    }

    if (token) {
      // Keep the raw embed_token for the session: our API routes forward it
      // to the Kunfupay external APIs (X-Kunfupay-Embed-Token). The host
      // refreshes it via postMessage kunfupay:token when it rotates.
      setEmbedToken(token)
      fetch("/api/auth/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Token verification failed")
          return res.json()
        })
        .then(({ vendorId: vid }) => {
          safeSession.setItem("kunfupay_vendor_id", vid)
          setVendorId(vid)
        })
        .catch(() => setError("auth"))
        .finally(() => kunfupayEmbed.ready())
      return
    }

    if (stored) {
      setVendorId(stored)
    } else {
      setError("missing-token")
    }
    kunfupayEmbed.ready()
  }, [])

  // ---- Token refresh from the host (postMessage kunfupay:token) ----
  useEffect(() => {
    kunfupayEmbed.onTokenReceived((token, expiresAt) => {
      setEmbedToken(token, expiresAt)
    })
  }, [])

  // ---- Keep iframe height synced ----
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => kunfupayEmbed.autoResize())
    observer.observe(document.documentElement)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center bg-background text-foreground">
        <p className="font-medium">No se pudo verificar el acceso</p>
        <p className="text-sm text-muted-foreground">
          Abre esta app desde tu panel de Kunfupay (/embed?embed_token=...). Para usarla
          fuera del panel, entra por /dashboard.
        </p>
      </div>
    )
  }

  if (!vendorId) {
    return (
      <div className="flex items-center justify-center py-24 bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <VendorContext.Provider value={{ vendorId, mode: "embed" }}>
      {children}
    </VendorContext.Provider>
  )
}
