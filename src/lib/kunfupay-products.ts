/**
 * Server-only client for the Kunfupay products API (hosted checkout).
 *
 * Auth follows the KunfuApps external integrations guide: the app
 * credentials (X-Client-Id / X-Client-Secret) identify this KunfuApp and
 * the per-session embed token (X-Kunfupay-Embed-Token) identifies the user
 * whose products are listed. The old vendor X-API-Key transport is gone —
 * no user-provided API key is needed anymore.
 *
 * Prices come back as decimal euros (49 = 49,00 €); the API only handles EUR.
 */

import { callKunfupay, KunfupayApiError } from "@/lib/kunfupay"

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

export type KunfupayErrorCode = "missing_token" | "invalid_token" | "forbidden" | "api_error"

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

export async function listProducts(
  embedToken: string,
  params?: ListProductsParams,
): Promise<ListProductsResponse> {
  if (!embedToken) {
    throw new KunfupayError("Missing embed token for the current session", 0, "missing_token")
  }

  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.limit !== undefined) query.set("limit", String(params.limit))
  if (params?.skip !== undefined) query.set("skip", String(params.skip))

  try {
    return await callKunfupay<ListProductsResponse>(
      embedToken,
      `/integrations/products?${query.toString()}`,
    )
  } catch (error) {
    if (error instanceof KunfupayApiError) {
      const code: KunfupayErrorCode =
        error.status === 401 ? "invalid_token" : error.status === 403 ? "forbidden" : "api_error"
      throw new KunfupayError(
        `Kunfupay products API error (${error.status}): ${error.message}`,
        error.status,
        code,
      )
    }
    const detail = error instanceof Error ? error.message : "network error"
    throw new KunfupayError(`Kunfupay products API unreachable: ${detail}`, 0, "api_error")
  }
}
