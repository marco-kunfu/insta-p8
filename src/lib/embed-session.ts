"use client"

/**
 * Client-side store for the Kunfupay embed session token.
 *
 * The embed_token identifies the current user against the Kunfupay external
 * APIs. It lives only for ~1h and only in sessionStorage: our API routes
 * receive it per-request via the X-Kunfupay-Embed-Token header and forward
 * it to Kunfupay together with the app credentials (server-side only).
 */

const TOKEN_KEY = "kunfupay_embed_token"
const EXPIRES_KEY = "kunfupay_embed_token_expires_at"

export function setEmbedToken(token: string, expiresAt?: number) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(TOKEN_KEY, token)
  if (expiresAt) {
    window.sessionStorage.setItem(EXPIRES_KEY, String(expiresAt))
  } else {
    window.sessionStorage.removeItem(EXPIRES_KEY)
  }
}

export function getEmbedToken(): string | null {
  if (typeof window === "undefined") return null
  const token = window.sessionStorage.getItem(TOKEN_KEY)
  if (!token) return null

  const expiresAt = Number(window.sessionStorage.getItem(EXPIRES_KEY))
  if (expiresAt && Date.now() >= expiresAt) {
    window.sessionStorage.removeItem(TOKEN_KEY)
    window.sessionStorage.removeItem(EXPIRES_KEY)
    return null
  }
  return token
}

/**
 * Headers to attach when calling our own API routes that proxy to the
 * Kunfupay external APIs. Empty when there is no live token (e.g. the
 * ?vendorId=... dev shortcut) — the route answers with a controlled error.
 */
export function embedAuthHeaders(): Record<string, string> {
  const token = getEmbedToken()
  return token ? { "X-Kunfupay-Embed-Token": token } : {}
}
