import crypto from "crypto";

// ---- Kunfupay Public API Client ----

const API_BASE = process.env.KUNFUPAY_API_BASE || "https://business.kunfupay.com/api/v1";
// External integrations API (KunfuApps): app credentials + per-user embed token.
const API_URL = process.env.KUNFUPAY_API_URL || "https://api.kunfupay.com/api/v1";
const CLIENT_ID = process.env.KUNFUPAY_CLIENT_ID || "";
const CLIENT_SECRET = process.env.KUNFUPAY_CLIENT_SECRET || "";

// ---- External integrations client (server-side only) ----

export class KunfupayApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "KunfupayApiError";
    this.status = status;
  }
}

/**
 * Calls the Kunfupay external APIs on behalf of the user of the current
 * embed session. The credentials identify this KunfuApp; the embed token
 * identifies the user — Kunfupay resolves their live Platform from it.
 * Never expose CLIENT_SECRET to the browser; the token arrives per-request
 * from the iframe via the X-Kunfupay-Embed-Token header.
 */
export async function callKunfupay<T>(
  embedToken: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Client-Id", CLIENT_ID);
  headers.set("X-Client-Secret", CLIENT_SECRET);
  headers.set("X-Kunfupay-Embed-Token", embedToken);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new KunfupayApiError(
      body?.error ?? `Kunfupay API error: ${response.status}`,
      response.status
    );
  }

  return body as T;
}

/** Sanity check: validates credentials, token, installation and capability. */
export async function getIntegrationsMe(embedToken: string) {
  return callKunfupay(embedToken, "/integrations/me");
}

async function kunfupayFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": CLIENT_ID,
      "X-Client-Secret": CLIENT_SECRET,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Kunfupay API error: ${res.status}`);
  }

  return res.json();
}

// ---- Sales API ----

export async function listSales(userId: string, params?: { page?: number; limit?: number; status?: string }) {
  return kunfupayFetch("/public/sales/list", {
    method: "POST",
    body: JSON.stringify({ userId, ...params }),
  });
}

export async function getSale(saleId: string) {
  return kunfupayFetch(`/public/sales/${saleId}`);
}

export async function getProduct(productId: string) {
  return kunfupayFetch(`/public/products/${productId}`);
}

// ---- Webhook Signature Verification ----

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.KUNFUPAY_WEBHOOK_SIGNING_KEY;
  if (!secret) return false;

  // HMAC-SHA256 hex over the raw body. Reject malformed signatures up front —
  // timingSafeEqual throws on length mismatch, so compare decoded buffers.
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const received = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    received.length === expectedBuffer.length &&
    crypto.timingSafeEqual(received, expectedBuffer)
  );
}

// ---- Embed Token Verification ----

export async function verifyEmbedToken(token: string): Promise<{ userId: string; appKey: string; appId: string; expiresAt: number }> {
  return kunfupayFetch("/public/embed/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
