"use client"

import { safeSession } from "@/lib/safe-storage"
import type { PanelMode } from "@/components/kunfupay/embed-provider"

/**
 * OAuth `state` codifica el MODO además del vendor, para que el retorno
 * (/instagram-return) sepa en qué contexto nació el login:
 *   "e:<vendorId>"  — embed: avisar al iframe y cerrar la pestaña
 *   "s:<vendorId?>" — standalone: seguir en la misma pestaña hacia /dashboard
 * Un state sin prefijo se trata como embed (logins en vuelo de la versión
 * anterior, cuyo state era el vendorId a secas).
 */
export function parseOauthState(raw: string | null): { mode: PanelMode; vendorId: string | null } {
  if (!raw) return { mode: "standalone", vendorId: null }
  if (raw.startsWith("s:")) return { mode: "standalone", vendorId: raw.slice(2) || null }
  if (raw.startsWith("e:")) return { mode: "embed", vendorId: raw.slice(2) || null }
  return { mode: "embed", vendorId: raw }
}

/**
 * Instagram Business Login (Instagram API with Instagram Login). client_id must
 * be the Instagram app ID from the Instagram product page, not the parent Meta
 * app ID.
 */
export function buildInstagramOauthUrl(mode: PanelMode): string {
  const params = new URLSearchParams({
    enable_fb_login: "0",
    force_authentication: "1",
    client_id: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID ?? "",
    redirect_uri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI ?? "",
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
  })
  // `state` round-trips mode + vendor across the top-level hop: sessionStorage
  // does not reach the login tab, and the iframe's embed session is left behind.
  const vendorId = safeSession.getItem("kunfupay_vendor_id") ?? ""
  params.set("state", `${mode === "embed" ? "e" : "s"}:${vendorId}`)
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`
}

/**
 * Starts the OAuth flow for the given panel mode (decided by route, never by
 * window.top sniffing):
 *
 *  - standalone: navigate this same tab. Instagram serves
 *    X-Frame-Options: DENY, but a top-level tab shows it fine, and the
 *    return leg lands back here and continues to /dashboard.
 *  - embed: open a separate tab — Instagram can never render inside the
 *    Kunfupay iframe. Returns true when the window could not be opened (the
 *    host's iframe sandbox lacks `allow-popups`), so the caller can tell the
 *    user to continue in a separate tab.
 */
export function startInstagramLogin(mode: PanelMode): boolean {
  const url = buildInstagramOauthUrl(mode)

  if (mode === "standalone") {
    window.location.href = url
    return false
  }

  return !window.open(url, "_blank")
}

/** Where to open the app so login works when popups are blocked. */
export function standaloneUrl(): string {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/dashboard`
}
