const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const XAI_URL = "https://api.x.ai/v1/chat/completions"

/**
 * Which provider a key belongs to, read off the key itself. Groq issues
 * `gsk_…`, OpenAI `sk-…`.
 *
 * This used to be inferred from which env var happened to be set, which broke
 * the per-user key path: with a Groq key stored in the database and no
 * GROQ_API_KEY in the environment, the request went to OpenAI's endpoint
 * asking for gpt-4o-mini, came back 401, and the DM was silently dropped.
 */
function providerFor(apiKey: string): Provider {
  if (apiKey.startsWith("gsk_")) return "groq"
  if (apiKey.startsWith("xai-")) return "xai"
  if (apiKey.startsWith("sk-")) return "openai"
  // Unrecognised prefix: prefer whichever the environment is set up for.
  return process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY ? "openai" : "groq"
}

const ENDPOINTS: Record<Provider, string> = {
  groq: GROQ_URL,
  openai: OPENAI_URL,
  xai: XAI_URL,
}

const DEFAULT_MODELS: Record<Provider, string> = {
  groq: "llama-3.1-8b-instant",
  openai: "gpt-4o-mini",
  // xAI renames models fairly often; override it in the Model field if this
  // one is retired.
  xai: "grok-3",
}

type Provider = "groq" | "openai" | "xai"

function resolveEndpoint(userBaseUrl: string | null | undefined, provider: Provider): string {
  if (userBaseUrl) {
    // user stored a base URL like "https://api.quickaitool.com/v1" — append the completions path
    const base = userBaseUrl.replace(/\/+$/, "")
    return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`
  }
  return process.env.AI_BASE_URL || ENDPOINTS[provider]
}

export async function generateAIReply(
  userMessage: string,
  aiContext: string,
  userApiKey?: string | null,
  userBaseUrl?: string | null,
  userModel?: string | null,
): Promise<string | null> {
  const apiKey = userApiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn("[ai-reply] No API key configured (GROQ_API_KEY or OPENAI_API_KEY)")
    return null
  }

  const provider = providerFor(apiKey)
  const endpoint = resolveEndpoint(userBaseUrl, provider)
  const model = userModel || process.env.AI_MODEL || DEFAULT_MODELS[provider]

  const systemPrompt = aiContext?.trim()
    ? `You are replying to Instagram DMs on behalf of this account: ${aiContext.trim()}\n\nRules: max 1 sentence, casual Instagram tone, no hashtags, no emojis unless natural, never reveal you are AI. If you don't know something specific, say you'll get back to them.`
    : "You are replying to Instagram DMs. Keep replies to 1 short sentence. Casual tone. No hashtags. Never reveal you are AI."

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error(
        `[ai-reply] ${provider} rejected the request: ${res.status} at ${endpoint} with model "${model}" — ${errText.slice(0, 200)}`,
      )
      return null
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch (e) {
    console.error("[ai-reply] fetch error", e)
    return null
  }
}

export interface AIDiagnostics {
  ok: boolean
  provider: Provider
  endpoint: string
  model: string
  keySource: "user" | "GROQ_API_KEY" | "OPENAI_API_KEY" | "none"
  status?: number
  reply?: string
  error?: string
  /** Populated when the model was rejected, so the right name is one call away. */
  availableModels?: string[]
}

/** Providers here are OpenAI-compatible, so /models sits beside /chat/completions. */
async function listModels(endpoint: string, apiKey: string): Promise<string[] | undefined> {
  try {
    const res = await fetch(endpoint.replace(/\/chat\/completions$/, "/models"), {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return undefined
    const data = await res.json()
    return (data.data || []).map((m: any) => m.id).filter(Boolean).sort()
  } catch {
    return undefined
  }
}

/**
 * Run one real completion and report what happened. Exists because the send
 * path swallows failures — a key pointed at the wrong provider is
 * indistinguishable from "the AI is off" from the outside, which cost a long
 * debugging loop. Never returns the key itself, only where it came from.
 */
export async function diagnoseAIReply(
  userApiKey?: string | null,
  userBaseUrl?: string | null,
  userModel?: string | null,
): Promise<AIDiagnostics> {
  const apiKey = userApiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
  const keySource: AIDiagnostics["keySource"] = userApiKey
    ? "user"
    : process.env.GROQ_API_KEY
      ? "GROQ_API_KEY"
      : process.env.OPENAI_API_KEY
        ? "OPENAI_API_KEY"
        : "none"

  if (!apiKey) {
    return { ok: false, provider: "groq", endpoint: "", model: "", keySource, error: "No API key configured" }
  }

  const provider = providerFor(apiKey)
  const endpoint = resolveEndpoint(userBaseUrl, provider)
  const model = userModel || process.env.AI_MODEL || DEFAULT_MODELS[provider]

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Reply with exactly: ok" },
          { role: "user", content: "ping" },
        ],
        max_tokens: 10,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      // A rejected model is the one failure where the fix is a specific string
      // the provider can hand us, so fetch it rather than making anyone guess.
      const availableModels = /model_not_found|does not exist/i.test(body)
        ? await listModels(endpoint, apiKey)
        : undefined
      return { ok: false, provider, endpoint, model, keySource, status: res.status, error: body.slice(0, 300), availableModels }
    }
    const data = await res.json()
    return { ok: true, provider, endpoint, model, keySource, status: res.status, reply: data.choices?.[0]?.message?.content?.trim() }
  } catch (e) {
    return { ok: false, provider, endpoint, model, keySource, error: e instanceof Error ? e.message : "network error" }
  }
}
