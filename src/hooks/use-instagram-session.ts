"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { safeLocal, safeSession } from "@/lib/safe-storage"

export function useInstagramSession() {
    const [username, setUsername] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [profilePic, setProfilePic] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const code = searchParams.get("code")

        const handleSession = async () => {
            // CASE A: New Login from Instagram
            if (code) {
                try {
                    // Link the connected Instagram account to the Kunfupay vendor
                    // resolved by the embed handshake (KunfupayEmbedProvider).
                    // `state` carries it when this runs in a popup opened from
                    // the iframe, which starts with an empty sessionStorage.
                    const vendorId =
                        searchParams.get("state") ||
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

                        // Popup flow: hand control back to the embedded app that
                        // opened us and get out of the way.
                        if (window.opener && window.opener !== window) {
                            window.opener.postMessage({ type: "insta:linked" }, "*")
                            window.close()
                            return
                        }
                        // Remove code from URL
                        router.replace("/embed")
                    }
                } catch (err) {
                    console.error("Login failed:", err)
                }
            }
            // CASE B: Restore Session from LocalStorage
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
    }, [searchParams, router])

    // The login popup reports back when it has linked the account. Nothing from
    // the message is trusted beyond the fact that it arrived — we just re-read
    // our own session.
    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.data?.type !== "insta:linked") return
            window.location.reload()
        }
        window.addEventListener("message", onMessage)
        return () => window.removeEventListener("message", onMessage)
    }, [])

    const logout = () => {
        safeLocal.removeItem("ig_user_id")
        safeLocal.removeItem("ig_username")
        safeLocal.removeItem("ig_profile_pic")
        document.cookie = "insta_session=; Max-Age=0; path=/;"
        setUsername(null)
        setUserId(null)
        setProfilePic(null)
        router.push("/")
    }

    return { userId, username, profilePic, isLoading, logout }
}
