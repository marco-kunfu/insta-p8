import { NextRequest, NextResponse } from "next/server"
import { KunfupayError, listProducts, type KunfupayProductOption } from "@/lib/kunfupay-products"

// Proxy so the app credentials stay server-side. The iframe sends the
// session's embed_token in X-Kunfupay-Embed-Token; only the fields the DM
// card needs are forwarded — the rest of the payload never reaches the browser.
export async function GET(req: NextRequest) {
  const embedToken = req.headers.get("x-kunfupay-embed-token") ?? ""

  try {
    const { data } = await listProducts(embedToken, { status: "active", limit: 100 })

    const options: KunfupayProductOption[] = data
      // A product without a checkout URL can't back a web_url button, and an
      // invisible one isn't purchasable — neither is worth offering.
      .filter((p) => p.visible && p.checkoutUrl)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        free: p.free,
        checkoutUrl: p.checkoutUrl,
      }))

    return NextResponse.json(options)
  } catch (error) {
    if (error instanceof KunfupayError) {
      console.error("[kunfupay] products GET:", error.message)
      // 401 when the session has no live embed token (expired or dev shortcut),
      // 502 when Kunfupay itself rejected or failed the call.
      const status =
        error.code === "missing_token" || error.code === "invalid_token" ? 401 : 502
      return NextResponse.json({ error: error.code }, { status })
    }
    console.error("[kunfupay] products GET unexpected:", error)
    return NextResponse.json({ error: "api_error" }, { status: 500 })
  }
}
