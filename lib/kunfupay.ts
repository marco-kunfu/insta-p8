/**
 * Server-only client for the Kunfupay products API (hosted checkout).
 *
 * Auth is the API-key transport only: `X-API-Key` identifies the vendor by
 * itself, so no userId travels with the request. The app-credentials path
 * (`X-Client-Id`/`X-Client-Secret` + userId) is deliberately not ported —
 * `/integrations/products` answers `401 Missing X-API-Key` for it.
 *
 * Prices come back as decimal euros (49 = 49,00 €); the API only handles EUR.
 */

const DEFAULT_BASE = "https://api.kunfupay.com/api/v1/integrations"

export interface KunfupayProduct {
  id: string
  shortId: string
  externalReference: string | null
  name: string
  slug: string
  visible: boolean
  price: number
  free: boolean
  currency: string
  checkoutPath: string
  checkoutUrl: string
  tags: string[]
  createdAt: string
}

/** The trimmed shape /api/kunfupay/products hands to the browser. */
export interface KunfupayProductOption {
  id: string
  name: string
  price: number
  currency: string
  free: boolean
  checkoutUrl: string
}

export interface ListProductsParams {
  status?: "active" | "expired" | "deleted" | "list"
  limit?: number
  skip?: number
}

export interface ListProductsResponse {
  data: KunfupayProduct[]
  count: number
  limit: number
  skip: number
}

export type KunfupayErrorCode = "missing_api_key" | "invalid_api_key" | "api_error"

export class KunfupayError extends Error {
  readonly status: number
  readonly code: KunfupayErrorCode

  constructor(message: string, status: number, code: KunfupayErrorCode) {
    super(message)
    this.name = "KunfupayError"
    this.status = status
    this.code = code
  }
}

function apiBase(): string {
  return process.env.KUNFUPAY_INTEGRATIONS_API_BASE?.trim() || DEFAULT_BASE
}

function requireApiKey(): string {
  const key = process.env.KUNFUPAY_API_KEY?.trim()
  if (!key) {
    throw new KunfupayError("KUNFUPAY_API_KEY is not set", 0, "missing_api_key")
  }
  return key
}

export async function listProducts(params?: ListProductsParams): Promise<ListProductsResponse> {
  // Resolved before the try so a missing key surfaces as `missing_api_key`
  // instead of being swallowed by the network catch below.
  const key = requireApiKey()

  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.limit !== undefined) query.set("limit", String(params.limit))
  if (params?.skip !== undefined) query.set("skip", String(params.skip))

  let res: Response
  try {
    res = await fetch(`${apiBase()}/products?${query.toString()}`, {
      headers: { "Content-Type": "application/json", "X-API-Key": key },
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "network error"
    throw new KunfupayError(`Kunfupay products API unreachable: ${detail}`, 0, "api_error")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail =
      body && typeof body === "object" && typeof (body as any).error === "string"
        ? (body as any).error
        : res.statusText
    throw new KunfupayError(
      `Kunfupay products API error (${res.status}): ${detail}`,
      res.status,
      res.status === 401 ? "invalid_api_key" : "api_error",
    )
  }

  return (await res.json()) as ListProductsResponse
}
