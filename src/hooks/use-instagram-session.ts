"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { safeLocal } from "@/lib/safe-storage"
import { useVendor } from "@/components/kunfupay/embed-provider"
import { onInstagramLinked } from "@/lib/instagram-link-events"

type Account = { userId: string; username: string }

// One shared lookup per vendor: several components mount this hook at once,
// and they should ride the same request instead of racing identical fetches.
let accountCache: { vendorId: string; promise: Promise<Account | null> } | null = null

function fetchVendorAccount(vendorId: string, force = false): Promise<Account | null> {
    if (!force && accountCache?.vendorId === vendorId) return accountCache.promise

    const promise = fetch(`/api/instagram/account?vendorId=${encodeURIComponent(vendorId)}`)
        .then((res) => (res.ok ? res.json() : { account: null }))
        .then((data) => data.account ?? null)
        .catch(() => null)

    accountCache = { vendorId, promise }
    return promise
}

/**
 * The app's Instagram session, from whichever source the PANEL MODE (decided
 * by route — see embed-provider.tsx) makes authoritative:
 *
 *  - embed: the server decides — the account row linked to this vendor.
 *    localStorage is ignored here, because Chrome partitions third-party
 *    iframe storage and shares this origin's storage with standalone tabs
 *    (stale test logins included).
 *  - standalone (/dashboard): localStorage, as always. The OAuth return page
 *    (/instagram-return) writes it before landing here.
 */
export function useInstagramSession() {
    const [username, setUsername] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [profilePic, setProfilePic] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const router = useRouter()
    const { vendorId, mode } = useVendor()
    // The latest session state, readable from stable callbacks without
    // re-subscribing listeners on every render.
    const userIdRef = useRef<string | null>(null)
    userIdRef.current = userId

    const readLocalSession = useCallback(() => {
        const savedId = safeLocal.getItem("ig_user_id")
        const savedName = safeLocal.getItem("ig_username")
        if (savedId && savedName) {
            setUserId(savedId)
            setUsername(savedName)
            setProfilePic(safeLocal.getItem("ig_profile_pic"))
        }
    }, [])

    const refresh = useCallback(async () => {
        if (mode === "embed" && vendorId) {
            const account = await fetchVendorAccount(vendorId, true)
            setUserId(account?.userId ?? null)
            setUsername(account?.username ?? null)
            setProfilePic(account ? safeLocal.getItem("ig_profile_pic") : null)
        } else {
            readLocalSession()
        }
    }, [mode, vendorId, readLocalSession])

    useEffect(() => {
        const handleSession = async () => {
            if (mode === "embed" && vendorId) {
                const account = await fetchVendorAccount(vendorId)
                setUserId(account?.userId ?? null)
                setUsername(account?.username ?? null)
                setProfilePic(account ? safeLocal.getItem("ig_profile_pic") : null)
            } else {
                readLocalSession()
            }
            setIsLoading(false)
        }

        handleSession()
    }, [mode, vendorId, readLocalSession])

    // The login tab reports back when it has linked the account; re-read our
    // own session. Also re-check when this window regains focus — the user
    // coming back to the dashboard tab is the one signal that always fires,
    // even when every notification channel was severed.
    useEffect(() => {
        const unsubscribe = onInstagramLinked(() => {
            refresh()
        })

        const onFocusBack = () => {
            if (document.visibilityState !== "visible") return
            if (mode === "embed" && !userIdRef.current) refresh()
        }
        document.addEventListener("visibilitychange", onFocusBack)
        window.addEventListener("focus", onFocusBack)

        return () => {
            unsubscribe()
            document.removeEventListener("visibilitychange", onFocusBack)
            window.removeEventListener("focus", onFocusBack)
        }
    }, [mode, refresh])

    const logout = async () => {
        // Embedded: unlink the account from the vendor server-side, or the
        // next account fetch would immediately restore the session.
        if (mode === "embed" && vendorId) {
            try {
                await fetch("/api/instagram/account", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ vendorId }),
                })
            } catch (err) {
                console.error("Unlink failed:", err)
            }
            accountCache = null
        }

        safeLocal.removeItem("ig_user_id")
        safeLocal.removeItem("ig_username")
        safeLocal.removeItem("ig_profile_pic")
        document.cookie = "insta_session=; Max-Age=0; path=/;"
        setUsername(null)
        setUserId(null)
        setProfilePic(null)
        router.push(mode === "embed" ? "/embed" : "/")
    }

    return { userId, username, profilePic, isLoading, logout }
}
