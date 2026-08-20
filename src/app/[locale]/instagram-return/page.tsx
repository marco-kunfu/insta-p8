"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { BRAND } from "@/lib/brand"
import { safeLocal, safeSession } from "@/lib/safe-storage"
import { parseOauthState } from "@/lib/instagram-login"
import { notifyInstagramLinked } from "@/lib/instagram-link-events"

type Status = "working" | "linked-embed" | "error"

/**
 * OAuth return leg, in its own top-level page (never inside the panel
 * layouts). `state` says which surface started the login:
 *
 *  - standalone ("s:..."): this IS the user's tab — exchange the code and
 *    continue to /dashboard in place. Never window.close().
 *  - embed ("e:<vendorId>"): this tab was opened from the Kunfupay iframe —
 *    exchange the code, notify the iframe on every channel that can survive
 *    the hop, then try to close; if the browser refuses, say "go back to the
 *    Kunfupay panel" instead of leaving a dead tab.
 */
export default function InstagramReturnPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<Status>("working")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // The OAuth code is single-use: React StrictMode remounts effects in dev,
  // and two exchanges of the same code would turn success into an error.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const code = searchParams.get("code")
    const oauthError = searchParams.get("error")
    const { mode, vendorId } = parseOauthState(searchParams.get("state"))

    const fail = (message: string) => {
      setErrorMessage(message)
      setStatus("error")
    }

    if (oauthError) {
      fail(oauthError === "access_denied" ? "Cancelaste el acceso en Instagram." : oauthError)
      return
    }
    if (!code) {
      fail("Falta el código de autorización.")
      return
    }

    const run = async () => {
      try {
        const res = await fetch("/api/instagram/callback", {
          method: "POST",
          body: JSON.stringify({
            code,
            vendorId: vendorId || safeSession.getItem("kunfupay_vendor_id"),
          }),
        })
        const data = await res.json()

        // "Code already used" is a harmless double-fire: the first exchange
        // already linked the account — treat it as success.
        if (!data.success && data.error !== "Code already used") {
          fail(data.error || "No se pudo completar el login.")
          return
        }

        if (data.success) {
          safeLocal.setItem("ig_user_id", data.userId)
          safeLocal.setItem("ig_username", data.username)
          if (data.profilePic) safeLocal.setItem("ig_profile_pic", data.profilePic)
        }

        // Tell the iframe / opener the account is linked, on every channel
        // that can survive the OAuth hop.
        notifyInstagramLinked()

        if (mode === "embed") {
          // Best-effort: browsers only honor close() on script-opened tabs.
          window.close()
          setStatus("linked-embed")
          return
        }

        router.replace("/dashboard")
      } catch (err) {
        console.error("Instagram return failed:", err)
        fail("No se pudo completar el login. Inténtalo de nuevo.")
      }
    }

    run()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      {status === "working" && (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Conectando tu cuenta de Instagram…</p>
        </>
      )}

      {status === "linked-embed" && (
        <>
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-semibold">Cuenta conectada</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ya puedes cerrar esta pestaña y volver al panel de Kunfupay — {BRAND.name} se
            actualizará solo.
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-10 w-10 text-destructive" />
          <h1 className="text-xl font-semibold">No se pudo conectar Instagram</h1>
          <p className="max-w-sm text-sm text-muted-foreground">{errorMessage}</p>
          <button
            onClick={() => router.replace("/dashboard")}
            className="mt-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver a la app
          </button>
        </>
      )}
    </div>
  )
}
