import { NextRequest, NextResponse } from "next/server"
import { getIntegrationsMe, KunfupayApiError } from "@/lib/kunfupay"

// Sanity check for the external integrations wiring: a 200 proves the app
// credentials, the session's embed token, the installation and the
// EXTERNAL_INTEGRATIONS_API_ACCESS capability all resolve correctly.
export async function GET(req: NextRequest) {
  const embedToken = req.headers.get("x-kunfupay-embed-token")
  if (!embedToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 })
  }

  try {
    const me = await getIntegrationsMe(embedToken)
    return NextResponse.json(me)
  } catch (error) {
    if (error instanceof KunfupayApiError) {
      console.error("[kunfupay] /integrations/me:", error.status, error.message)
      return NextResponse.json(
        { error: error.message },
        { status: error.status === 401 || error.status === 403 ? error.status : 502 },
      )
    }
    console.error("[kunfupay] /integrations/me unexpected:", error)
    return NextResponse.json({ error: "api_error" }, { status: 500 })
  }
}
