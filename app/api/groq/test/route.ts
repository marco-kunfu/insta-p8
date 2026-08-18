import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { diagnoseAIReply } from "@/lib/ai-reply"

// Runs one real completion with the account's stored settings and reports the
// outcome. The send path in the webhook swallows failures, which makes a
// misconfigured key look identical to the feature being switched off.
export async function POST(request: NextRequest) {
  const { userId } = await request.json().catch(() => ({ userId: null }))
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from("users")
    .select("groq_api_key, ai_base_url, ai_model")
    .eq("id", userId)
    .single()

  const result = await diagnoseAIReply(data?.groq_api_key, data?.ai_base_url, data?.ai_model)
  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
