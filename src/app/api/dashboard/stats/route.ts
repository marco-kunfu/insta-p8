import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId")
        if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

        const userIdBigInt = BigInt(userId)

        // 1. Total Automations
        const automationsCount = await db.automation.count({
            where: { userId: userIdBigInt },
        })

        // 2. Active Triggers
        const activeTriggersCount = await db.automation.count({
            where: { userId: userIdBigInt, isActive: true },
        })

        // 3. Audience Reached (Total Conversations)
        const audienceCount = await db.conversation.count({
            where: { userId: userIdBigInt },
        })

        // 4. Messages Sent (where is_from_instagram is false, implying bot/system sent it)
        const messagesSentCount = await db.message.count({
            where: { userId: userIdBigInt, isFromInstagram: false },
        })

        // 5. Recent Activity (Last 5 messages sent by bot)
        const recentMessages = await db.message.findMany({
            where: { userId: userIdBigInt, isFromInstagram: false },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                content: true,
                createdAt: true,
                senderUsername: true,
                conversationId: true,
                conversation: { select: { recipientUsername: true } },
            },
        })

        return NextResponse.json({
            metrics: {
                totalAutomations: automationsCount || 0,
                activeTriggers: activeTriggersCount || 0,
                audienceReached: audienceCount || 0,
                messagesSent: messagesSentCount || 0,
            },
            recentActivity: recentMessages.map((m) => ({
                id: m.id,
                content: m.content,
                created_at: m.createdAt,
                sender_username: m.senderUsername,
                conversation_id: m.conversationId,
                recipient: { recipient_username: m.conversation.recipientUsername },
            })),
        })
    } catch (error) {
        console.error("[v0] Dashboard Stats error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
