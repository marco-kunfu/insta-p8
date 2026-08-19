import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { diagnoseAIReply } from "@/lib/ai-reply"

// Runs one real completion with the account's stored settings and reports the
// outcome. The send path in the webhook swallows failures, which makes a
// misconfigured key look identical to the feature being switched off.
export async function POST(request: NextRequest) {
  const { userId, probe } = await request.json().catch(() => ({ userId: null, probe: undefined }))
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const data = await db.instagramAccount
    .findUnique({
      where: { id: BigInt(userId) },
      select: { groqApiKey: true, aiBaseUrl: true, aiModel: true, aiContext: true },
    })
    .catch(() => null)

  const result = await diagnoseAIReply(data?.groqApiKey, data?.aiBaseUrl, data?.aiModel, data?.aiContext, probe)
  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
