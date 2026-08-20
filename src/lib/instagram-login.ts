"use client"

import { isEmbedded } from "@/lib/embed-session"
import { safeSession } from "@/lib/safe-storage"

/**
 * Instagram Business Login (Instagram API with Instagram Login). client_id must
 * be the Instagram app ID from the Instagram product page, not the parent Meta
 * app ID.
 */
export function buildInstagramOauthUrl(): string {
  const params = new URLSearchParams({
    enable_fb_login: "0",
    force_authentication: "1",
    client_id: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID ?? "",
    redirect_uri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI ?? "",
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
  })
  // `state` round-trips the vendor across the top-level hop: sessionStorage
  // does not reach a popup, and the iframe's embed session is left behind.
  const vendorId = safeSession.getItem("kunfupay_vendor_id")
  if (vendorId) params.set("state", vendorId)
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`
}

/**
 * Starts the OAuth flow in whatever context can actually show it.
 *
 * Instagram serves X-Frame-Options: DENY, so its screen can never render
 * inside the Kunfupay iframe. Returns true when the login window could not be
 * opened — that means the host's iframe sandbox lacks `allow-popups`, and the
 * caller should tell the user to continue in a separate tab.
 */
export function startInstagramLogin(): boolean {
  const url = buildInstagramOauthUrl()

  if (!isEmbedded()) {
    window.location.href = url
    return false
  }

  return !window.open(url, "_blank")
}

/** Where to open the app so login works when popups are blocked. */
export function standaloneUrl(): string {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/embed`
}
