"use client"

/**
 * Client-side store for the Kunfupay embed session token.
 *
 * The embed_token identifies the current user against the Kunfupay external
 * APIs. It lives only for ~1h and only in sessionStorage: our API routes
 * receive it per-request via the X-Kunfupay-Embed-Token header and forward
 * it to Kunfupay together with the app credentials (server-side only).
 */

import { safeSession } from "@/lib/safe-storage"

const TOKEN_KEY = "kunfupay_embed_token"
const EXPIRES_KEY = "kunfupay_embed_token_expires_at"

/**
 * Whether the app is running inside the Kunfupay iframe. Standalone use (the
 * app opened directly in a tab) stays supported: Instagram Business Login
 * cannot be framed, so the OAuth flow needs a top-level context.
 */
export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.self !== window.top
  } catch {
    // Cross-origin access throws — that only happens when framed.
    return true
  }
}

// Memory holds the token, sessionStorage only mirrors it: inside the iframe
// Web Storage may be denied outright, and losing the token there would leave
// the app unable to call Kunfupay at all.
let memoryToken: string | null = null
let memoryExpiresAt: number | null = null

export function setEmbedToken(token: string, expiresAt?: number) {
  if (typeof window === "undefined") return
  memoryToken = token
  memoryExpiresAt = expiresAt ?? null

  safeSession.setItem(TOKEN_KEY, token)
  if (expiresAt) {
    safeSession.setItem(EXPIRES_KEY, String(expiresAt))
  } else {
    safeSession.removeItem(EXPIRES_KEY)
  }
}

export function getEmbedToken(): string | null {
  if (typeof window === "undefined") return null

  const token = memoryToken ?? safeSession.getItem(TOKEN_KEY)
  if (!token) return null

  const expiresAt = memoryExpiresAt ?? Number(safeSession.getItem(EXPIRES_KEY))
  if (expiresAt && Date.now() >= expiresAt) {
    memoryToken = null
    memoryExpiresAt = null
    safeSession.removeItem(TOKEN_KEY)
    safeSession.removeItem(EXPIRES_KEY)
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
