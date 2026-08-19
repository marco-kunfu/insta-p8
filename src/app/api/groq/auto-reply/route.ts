import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const data = await db.instagramAccount
    .findUnique({
      where: { id: BigInt(userId) },
      select: { groqAutoReplyEnabled: true, aiContext: true, groqApiKey: true, aiBaseUrl: true, aiModel: true },
    })
    .catch(() => null)

  if (!data) return NextResponse.json({ enabled: false, ai_context: "", has_api_key: false, ai_base_url: "", ai_model: "" })
  return NextResponse.json({
    enabled: data.groqAutoReplyEnabled ?? false,
    ai_context: data.aiContext ?? "",
    has_api_key: Boolean(data.groqApiKey),
    ai_base_url: data.aiBaseUrl ?? "",
    ai_model: data.aiModel ?? "",
  })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { userId, enabled, ai_context, groq_api_key, ai_base_url, ai_model } = body
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (typeof enabled === "boolean") update.groqAutoReplyEnabled = enabled
  if (typeof ai_context === "string") update.aiContext = ai_context
  if (typeof groq_api_key === "string") update.groqApiKey = groq_api_key || null
  if (typeof ai_base_url === "string") update.aiBaseUrl = ai_base_url || null
  if (typeof ai_model === "string") update.aiModel = ai_model || null

  try {
    await db.instagramAccount.updateMany({ where: { id: BigInt(userId) }, data: update })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings"
    return NextResponse.json({ error: message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
