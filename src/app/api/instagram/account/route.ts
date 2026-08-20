import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/instagram/account?vendorId=... — the Instagram account linked to a
// Kunfupay vendor. The embedded app resolves its session from this server
// truth instead of localStorage: with `allow-same-origin` on the iframe
// sandbox, the iframe shares storage with any standalone tab on this origin,
// so a stale browser session could otherwise impersonate a fresh vendor.
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get("vendorId")
    if (!vendorId) return NextResponse.json({ error: "Missing vendorId" }, { status: 400 })

    const account = await db.instagramAccount.findFirst({
      where: { vendorId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, username: true },
    })

    if (!account) return NextResponse.json({ account: null })

    // Instagram ids can exceed Number.MAX_SAFE_INTEGER — serialize as string,
    // which is also what the OAuth callback hands the client.
    return NextResponse.json({
      account: { userId: account.id.toString(), username: account.username },
    })
  } catch (error) {
    console.error("Instagram account lookup error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/instagram/account — unlink the vendor's Instagram account (the
// embed's "log out"). The account row survives; only the vendor claim clears.
export async function DELETE(request: NextRequest) {
  try {
    const { vendorId } = await request.json()
    if (!vendorId) return NextResponse.json({ error: "Missing vendorId" }, { status: 400 })

    await db.instagramAccount.updateMany({
      where: { vendorId },
      data: { vendorId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Instagram account unlink error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
