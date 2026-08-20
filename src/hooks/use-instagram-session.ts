"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { safeLocal, safeSession } from "@/lib/safe-storage"
import { useVendor } from "@/components/kunfupay/embed-provider"
import { notifyInstagramLinked, onInstagramLinked } from "@/lib/instagram-link-events"

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
 * The app's Instagram session, from whichever source is authoritative:
 *
 *  - Embedded (vendorId from the Kunfupay handshake): the server decides —
 *    the account row linked to this vendor. localStorage is ignored here,
 *    because `allow-same-origin` makes the iframe share it with any
 *    standalone tab on this origin (stale test logins included).
 *  - Standalone: localStorage, as always.
 *  - OAuth return (?code=...): exchanges the code, then notifies every other
 *    context (iframe, opener) through instagram-link-events.
 */
export function useInstagramSession() {
    const [username, setUsername] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [profilePic, setProfilePic] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const searchParams = useSearchParams()
    const router = useRouter()
    const { vendorId: embedVendorId } = useVendor()
    // The latest session state, readable from stable callbacks without
    // re-subscribing listeners on every render.
    const userIdRef = useRef<string | null>(null)
    userIdRef.current = userId

    const applyAccount = useCallback((account: Account | null) => {
        setUserId(account?.userId ?? null)
        setUsername(account?.username ?? null)
        if (!account) setProfilePic(null)
    }, [])

    const refresh = useCallback(async () => {
        if (embedVendorId) {
            const account = await fetchVendorAccount(embedVendorId, true)
            applyAccount(account)
            if (account) setProfilePic(safeLocal.getItem("ig_profile_pic"))
        } else {
            const savedId = safeLocal.getItem("ig_user_id")
            const savedName = safeLocal.getItem("ig_username")
            if (savedId && savedName) {
                setUserId(savedId)
                setUsername(savedName)
                setProfilePic(safeLocal.getItem("ig_profile_pic"))
            }
        }
    }, [embedVendorId, applyAccount])

    useEffect(() => {
        const code = searchParams.get("code")

        const handleSession = async () => {
            // CASE A: OAuth return from Instagram (runs in its own tab)
            if (code) {
                try {
                    // `state` carries the vendorId across the top-level hop —
                    // this tab starts with an empty sessionStorage.
                    const vendorId =
                        searchParams.get("state") ||
                        embedVendorId ||
                        safeSession.getItem("kunfupay_vendor_id")
                    const res = await fetch("/api/instagram/callback", {
                        method: "POST",
                        body: JSON.stringify({ code, vendorId }),
                    })
                    const data = await res.json()

                    if (data.success) {
                        safeLocal.setItem("ig_user_id", data.userId)
                        safeLocal.setItem("ig_username", data.username)
                        if (data.profilePic) safeLocal.setItem("ig_profile_pic", data.profilePic)

                        setUserId(data.userId)
                        setUsername(data.username)
                        setProfilePic(data.profilePic || null)

                        // Tell the iframe / opener the account is linked, on
                        // every channel that survives the OAuth hop.
                        notifyInstagramLinked()

                        // Get out of the way when we were opened as a login
                        // window. close() is best-effort (some browsers refuse
                        // it after the cross-origin round trip) — if this tab
                        // survives, it lands on the dashboard instead.
                        window.close()
                        router.replace("/embed")
                    } else if (data.error === "Code already used") {
                        // Double-fire (StrictMode remount / double click) —
                        // the first exchange already linked the account.
                        notifyInstagramLinked()
                        window.close()
                        router.replace("/embed")
                    } else {
                        toast.error(`Instagram login failed: ${data.error || "unknown error"}`, { duration: 10000 })
                    }
                } catch (err) {
                    console.error("Login failed:", err)
                    toast.error("Instagram login failed. Please try again.", { duration: 10000 })
                }
            }
            // CASE B: Embedded — the vendor's linked account, from the server
            else if (embedVendorId) {
                const account = await fetchVendorAccount(embedVendorId)
                applyAccount(account)
                if (account) setProfilePic(safeLocal.getItem("ig_profile_pic"))
            }
            // CASE C: Standalone — restore from localStorage
            else {
                const savedId = safeLocal.getItem("ig_user_id")
                const savedName = safeLocal.getItem("ig_username")

                if (savedId && savedName) {
                    setUserId(savedId)
                    setUsername(savedName)
                    setProfilePic(safeLocal.getItem("ig_profile_pic"))
                }
            }
            setIsLoading(false)
        }

        handleSession()
    }, [searchParams, router, embedVendorId, applyAccount])

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
            if (embedVendorId && !userIdRef.current) refresh()
        }
        document.addEventListener("visibilitychange", onFocusBack)
        window.addEventListener("focus", onFocusBack)

        return () => {
            unsubscribe()
            document.removeEventListener("visibilitychange", onFocusBack)
            window.removeEventListener("focus", onFocusBack)
        }
    }, [embedVendorId, refresh])

    const logout = async () => {
        // Embedded: unlink the account from the vendor server-side, or the
        // next account fetch would immediately restore the session.
        if (embedVendorId) {
            try {
                await fetch("/api/instagram/account", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ vendorId: embedVendorId }),
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
        router.push(embedVendorId ? "/embed" : "/")
    }

    return { userId, username, profilePic, isLoading, logout }
}
