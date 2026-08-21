"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "@/i18n/navigation"
import { navLabelFor } from "@/components/layout/nav-items"

/**
 * Announces section changes to assistive tech.
 *
 * Inside an iframe the host page owns the document that the screen reader
 * treats as "the page": our <title> changing is not announced, and no route
 * change is either, because client-side navigation never reloads anything.
 * Without this, moving between sections is silent.
 */
export function RouteAnnouncer() {
  const pathname = usePathname()
  const [message, setMessage] = useState("")
  const isFirstRender = useRef(true)

  useEffect(() => {
    // The initial render is the page load itself — announcing it would talk
    // over the host's own load announcement.
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const label = navLabelFor(pathname)
    setMessage(label ? `${label}, section loaded` : "")
  }, [pathname])

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
