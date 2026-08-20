"use client"

import { useState } from "react"
import { Zap } from "lucide-react"
import { BRAND } from "@/lib/brand"
import { startInstagramLogin, standaloneUrl } from "@/lib/instagram-login"

/**
 * The gate for the embedded app: until an Instagram business account is linked
 * there is nothing to show, so the dashboard chrome stays hidden rather than
 * presenting an empty shell that claims to be connected.
 */
export function ConnectInstagram() {
  const [popupBlocked, setPopupBlocked] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex min-h-14 items-center gap-2.5 border-b border-border px-5 md:min-h-16 md:px-10">
        <div className="morfeo-avatar-gradient flex h-7 w-7 items-center justify-center rounded-md text-white">
          <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
        <span className="font-mono-ui text-sm font-bold tracking-tight">{BRAND.name}</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="font-serif-display text-3xl md:text-4xl">Connect your Instagram account.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Link an Instagram business account to set up comment-to-DM funnels, keyword
          triggers and AI replies. Login opens in its own tab: Instagram does not allow
          its sign-in screen inside another dashboard.
        </p>

        <button
          onClick={() => setPopupBlocked(startInstagramLogin())}
          className="mt-2 rounded-full bg-primary px-6 py-2.5 font-mono-ui text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Connect Instagram
        </button>

        {popupBlocked && (
          <div className="mt-4 max-w-md rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 text-left">
            <p className="text-[13px] font-medium">
              Your browser blocked the login window.
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Open the app in a new tab to continue:{" "}
              <span className="font-mono-ui select-all break-all text-foreground">
                {standaloneUrl()}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
