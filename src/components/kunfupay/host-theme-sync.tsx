"use client"

import { useEffect } from "react"
import { kunfupayEmbed } from "@/lib/kunfupay-embed-sdk"
import { useTheme } from "@/components/theme-provider"

type HostTheme = "light" | "dark" | "system"

function normalizeTheme(raw: string | null | undefined): HostTheme | null {
  const value = raw?.toLowerCase().trim()
  if (value === "light" || value === "dark" || value === "system") return value
  // Kunfupay may name it "auto"; treat it as the OS preference.
  if (value === "auto") return "system"
  return null
}

/**
 * In embed mode the theme belongs to the host, not to us: the app renders
 * inside the Kunfupay dashboard, and a light panel inside a dark dashboard
 * reads as a broken widget. There is no toggle in the embed chrome for the
 * same reason.
 *
 * Resolution order, since the parent document is cross-origin and cannot be
 * inspected:
 *   1. postMessage `kunfupay:theme` — authoritative, and live (a theme flip
 *      in the dashboard reaches an already-open iframe).
 *   2. `?kunfupay_theme=` (the param the live host actually sends; `?theme=`
 *      kept as an alias) — the host's value at load time.
 *   3. `prefers-color-scheme` — the OS preference, which the iframe inherits
 *      and which the host most likely follows too. Better than pinning to
 *      light when the host tells us nothing.
 *
 * Nothing here is persisted: this is the host's preference for this frame.
 */
export function HostThemeSync() {
  const { setTheme } = useTheme()

  useEffect(() => {
    const unsubscribe = kunfupayEmbed.onThemeReceived((raw) => {
      const next = normalizeTheme(raw)
      if (next) setTheme(next, { persist: false })
    })

    if (!kunfupayEmbed.hasReceivedTheme()) {
      setTheme(normalizeTheme(kunfupayEmbed.getThemeFromUrl()) ?? "system", { persist: false })
    }

    return unsubscribe
  }, [setTheme])

  return null
}
