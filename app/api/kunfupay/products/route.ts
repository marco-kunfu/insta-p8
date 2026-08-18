import { NextResponse } from "next/server"
import { KunfupayError, listProducts, type KunfupayProductOption } from "@/lib/kunfupay"

// Proxy so the API key stays server-side. Only the fields the DM card needs
// are forwarded — the rest of the Kunfupay payload never reaches the browser.
export async function GET() {
  try {
    const { data } = await listProducts({ status: "active", limit: 100 })

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
      // 503 when this deployment simply isn't wired to Kunfupay yet, 502 when
      // Kunfupay itself rejected or failed the call.
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "missing_api_key" ? 503 : 502 },
      )
    }
    console.error("[kunfupay] products GET unexpected:", error)
    return NextResponse.json({ error: "api_error" }, { status: 500 })
  }
}
