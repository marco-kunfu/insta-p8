import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, recipientId, message, attachment } = body

        if (!userId || !recipientId || (!message && !attachment)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Get User Access Token
        const user = await db.instagramAccount.findUnique({
            where: { id: BigInt(userId) },
            select: { accessToken: true, username: true, businessAccountId: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // 2. Prepare Payload for Instagram API
        const apiBody: any = { recipient: { id: recipientId } }

        if (message) {
            apiBody.message = { text: message }
        } else if (attachment) {
            apiBody.message = { attachment }
        }

        // 3. Send to Instagram
        const res = await fetch(
            `https://graph.instagram.com/v24.0/me/messages?access_token=${user.accessToken}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(apiBody)
            }
        )

        const data = await res.json()

        if (data.error) {
            console.error("[Inbox Send] Instagram API Error:", data.error)
            return NextResponse.json({ error: data.error.message }, { status: 500 })
        }

        // 4. Log to Database (Outbound Message)
        // Find Conversation ID first
        const conv = await db.conversation.findUnique({
            where: {
                userId_recipientId: {
                    userId: BigInt(userId),
                    recipientId: String(recipientId)
                }
            },
            select: { id: true }
        })

        // If conversation doesn't exist (unlikely if replying, but possible if initiating), create it logic is tricky here
        // without knowing username. Assuming it exists for now as this is usually a reply flow.

        if (conv) {
            await db.message.create({
                data: {
                    id: `mid_out_${Date.now()}_${Math.random()}`,
                    conversationId: conv.id,
                    userId: BigInt(userId),
                    senderId: user.businessAccountId?.toString() ?? "",
                    senderUsername: user.username,
                    content: message || "[Attachment]",
                    isFromInstagram: false
                }
            })

            // Update conversation timestamp
            await db.conversation.update({
                where: { id: conv.id },
                data: { lastMessageAt: new Date() }
            })
        }

        return NextResponse.json({ success: true, data })

    } catch (error) {
        console.error("[Inbox Send] Internal Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
