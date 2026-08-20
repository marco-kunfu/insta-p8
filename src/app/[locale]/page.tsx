"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LandingPage } from "@/components/layout/landing-page"
import { safeLocal } from "@/lib/safe-storage"

// Public landing on the direct domain — standalone surface. The OAuth return
// never lands here anymore (it goes to /instagram-return); this page only
// forwards visitors who already have a local session to their dashboard.
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (safeLocal.getItem("ig_user_id")) {
      router.replace("/dashboard")
    }
  }, [router])

  return <LandingPage />
}
