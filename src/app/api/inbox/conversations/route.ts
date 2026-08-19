import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId")
        if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

        // Fetch conversations sorted by last message
        const conversations = await db.conversation.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { lastMessageAt: "desc" }
        })

        return NextResponse.json(
            conversations.map((c) => ({
                id: c.id,
                user_id: Number(c.userId),
                recipient_id: c.recipientId,
                recipient_username: c.recipientUsername,
                last_message_at: c.lastMessageAt,
                created_at: c.createdAt,
                updated_at: c.updatedAt
            }))
        )
    } catch (error) {
        console.error("[Inbox] Conversations GET error:", error)
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }
}
