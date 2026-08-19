import { NextRequest, NextResponse } from "next/server";
import { verifyEmbedToken } from "@/lib/kunfupay";
import { db } from "@/lib/db";

// POST /api/auth/verify-token — verify embed_token and return/create vendor
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    // Verify token against Kunfupay
    const { userId } = await verifyEmbedToken(token);

    // Ensure vendor exists (auto-create on first access)
    const vendor = await db.vendor.upsert({
      where: { id: userId },
      create: { id: userId, isActive: true },
      update: {},
    });

    return NextResponse.json({ vendorId: vendor.id, isActive: vendor.isActive });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
