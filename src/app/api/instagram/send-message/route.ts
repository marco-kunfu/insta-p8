import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * POST /api/instagram/send-message
 * Send a DM reply to an Instagram user
 *
 * Request body:
 * {
 *   "user_id": 123456,
 *   "recipient_id": 789012,
 *   "message": "Your reply text here"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, recipient_id, message } = await request.json()

    if (!user_id || !recipient_id || !message) {
      return NextResponse.json({ error: "Missing required fields: user_id, recipient_id, message" }, { status: 400 })
    }

    // Get user's access token
    const user = await db.instagramAccount.findUnique({
      where: { id: BigInt(user_id) },
      select: { accessToken: true, username: true },
    })

    if (!user) {
      console.error("[v0] Failed to get user:", user_id)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] Sending DM from", user.username, "to", recipient_id)

    // Send message via Instagram API
    const sendUrl = `https://graph.instagram.com/v24.0/me/messages?access_token=${encodeURIComponent(user.accessToken)}`

    const response = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          id: recipient_id.toString(),
        },
        message: {
          text: message,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Failed to send message:", data)
      return NextResponse.json({ error: data.error?.message || "Failed to send message" }, { status: 400 })
    }

    console.log("[v0] Message sent successfully:", data.message_id)

    // Store the sent message in database
    const conversation = await db.conversation.findUnique({
      where: {
        userId_recipientId: {
          userId: BigInt(user_id),
          recipientId: recipient_id.toString(),
        },
      },
      select: { id: true },
    })

    if (conversation) {
      // The DM already went out — a storage failure must not turn the
      // response into an error (matches the old fire-and-forget insert).
      await db.message
        .create({
          data: {
            id: data.message_id,
            conversationId: conversation.id,
            userId: BigInt(user_id),
            senderId: user_id.toString(),
            senderUsername: user.username,
            content: message,
            isFromInstagram: false,
          },
        })
        .catch((e) => console.error("[v0] Failed to store sent message:", e))
    }

    return NextResponse.json({
      success: true,
      message_id: data.message_id,
    })
  } catch (error) {
    console.error("[v0] Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
