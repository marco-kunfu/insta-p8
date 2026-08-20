"use client"

import { safeLocal } from "@/lib/safe-storage"

/**
 * Cross-context notification that an Instagram account was just linked.
 *
 * The OAuth return leg runs in its own tab, and the app that needs to react
 * lives in the Kunfupay iframe. `window.opener` is the obvious bridge, but
 * Instagram's login flow can sever it (COOP), so every same-origin channel is
 * used at once — whichever survives, wins:
 *   1. BroadcastChannel (same-origin contexts, iframe included)
 *   2. a localStorage write, whose `storage` event fires in other windows
 *   3. postMessage to window.opener, when it is still reachable
 */

const CHANNEL_NAME = "insta:linked"
const STORAGE_PING_KEY = "insta_linked_at"

export function notifyInstagramLinked() {
  if (typeof window === "undefined") return

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.postMessage({ type: CHANNEL_NAME })
    channel.close()
  } catch {
    // Opaque origin — BroadcastChannel unavailable; other channels remain.
  }

  safeLocal.setItem(STORAGE_PING_KEY, String(Date.now()))

  if (window.opener && window.opener !== window) {
    try {
      window.opener.postMessage({ type: CHANNEL_NAME }, "*")
    } catch {
      // Opener gone or cross-origin — nothing to do.
    }
  }
}

/** Subscribe to link notifications from any channel. Returns the cleanup. */
export function onInstagramLinked(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  let channel: BroadcastChannel | null = null
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = () => callback()
  } catch {
    channel = null
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_PING_KEY) callback()
  }
  const onMessage = (event: MessageEvent) => {
    // Nothing from the message is trusted beyond the fact that it arrived —
    // subscribers only re-read their own session.
    if (event.data?.type === CHANNEL_NAME) callback()
  }

  window.addEventListener("storage", onStorage)
  window.addEventListener("message", onMessage)

  return () => {
    channel?.close()
    window.removeEventListener("storage", onStorage)
    window.removeEventListener("message", onMessage)
  }
}
