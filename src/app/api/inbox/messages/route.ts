import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
    try {
        const conversationId = request.nextUrl.searchParams.get("conversationId")
        if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })

        // Fetch messages for this conversation
        const messages = await db.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" }
        })

        return NextResponse.json(
            messages.map((m) => ({
                id: m.id,
                conversation_id: m.conversationId,
                user_id: Number(m.userId),
                sender_id: m.senderId,
                sender_username: m.senderUsername,
                content: m.content,
                is_from_instagram: m.isFromInstagram,
                created_at: m.createdAt
            }))
        )
    } catch (error) {
        console.error("[Inbox] Messages GET error:", error)
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }
}
