import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/kunfupay";

/**
 * Kunfupay webhook (KunfuApps external integrations guide):
 *  - HMAC-SHA256 verified over the raw body before parsing.
 *  - The unsigned X-Kunfupay-Webhook-Id header must match the signed
 *    webhookId inside the body.
 *  - Delivery is at-least-once: dedupe on the signed webhookId via the
 *    kunfupay_webhook_events primary key, and reply 2xx fast.
 *  - `userId` is the va_* alias of the vendor (same value verify-token
 *    stores as Vendor.id).
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-kunfupay-signature") || "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { webhookId, event, userId, data } = body;

    // The header is unsigned — accept it only when it names the signed id.
    const headerWebhookId = req.headers.get("x-kunfupay-webhook-id");
    if (webhookId && headerWebhookId && headerWebhookId !== webhookId) {
      return NextResponse.json({ error: "Webhook id mismatch" }, { status: 400 });
    }

    // Dedupe: the insert is the claim. A P2002 means this delivery was
    // already processed — acknowledge it without re-running side effects.
    if (webhookId) {
      try {
        await db.kunfupayWebhookEvent.create({
          data: { webhookId, event: event ?? "unknown", userId: userId ?? null, payload: body },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return NextResponse.json({ received: true, duplicate: true });
        }
        throw error;
      }
    }

    switch (event) {
      case "app.installed": {
        await db.vendor.upsert({
          where: { id: userId },
          create: { id: userId, isActive: true },
          update: { isActive: true, uninstalledAt: null },
        });
        console.log(`App installed for vendor: ${userId}`);
        break;
      }

      case "app.uninstalled": {
        await db.vendor.update({
          where: { id: userId },
          data: { isActive: false, uninstalledAt: new Date() },
        });
        console.log(`App uninstalled for vendor: ${userId}`);
        break;
      }

      case "sale.completed": {
        // TODO: Handle sale completion (e.g., log analytics, trigger automations)
        console.log(`Sale completed for vendor ${userId}:`, data);
        break;
      }

      // External-API events of the vendor's Platform (fan-out from Kunfupay).
      // data keeps the original external-webhook contract:
      //   { eventType, payload: { ...metadata... }, timestamp }
      // Payments/subscriptions reconciliation hangs off these — the row saved
      // above already keeps the full envelope for when that logic lands.
      case "external.payment.completed":
      case "external.payment.failed":
      case "external.productPayment.completed":
      case "external.productPayment.failed":
      case "external.productPayment.expired":
      case "external.subscription.activated":
      case "external.subscription.payment_succeeded":
      case "external.subscription.payment_failed":
      case "external.subscription.canceled":
      case "external.subscription.suspended": {
        console.log(`External event ${event} for vendor ${userId}:`, data?.payload);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
