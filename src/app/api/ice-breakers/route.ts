import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Map a Prisma IceBreaker record back to the raw DB row shape the frontend expects
function serializeIceBreaker(ib: {
    id: string
    userId: bigint
    question: string
    response: string
    isActive: boolean | null
    createdAt: Date | null
}) {
    return {
        id: ib.id,
        user_id: Number(ib.userId),
        question: ib.question,
        response: ib.response,
        is_active: ib.isActive,
        created_at: ib.createdAt,
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const userId = searchParams.get("userId")

        if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

        let userIdBig: bigint
        try {
            userIdBig = BigInt(userId)
        } catch {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 })
        }

        const data = await db.iceBreaker.findMany({
            where: { userId: userIdBig },
            orderBy: { createdAt: "asc" },
        })

        return NextResponse.json(data.map(serializeIceBreaker))
    } catch (error) {
        console.error("Ice Breaker GET Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, iceBreakers } = body // Array of ice breakers

        if (!userId || !Array.isArray(iceBreakers)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
        }

        let userIdBig: bigint
        try {
            userIdBig = BigInt(userId)
        } catch {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
        }

        // 1. Update Database (Replace all for simplicity or Upsert)
        // Strategy: Delete all for user and re-insert. Simple and effective for limited list (max 4).
        await db.iceBreaker.deleteMany({
            where: { userId: userIdBig },
        })

        const insertedRecords = await db.iceBreaker.createManyAndReturn({
            data: iceBreakers.map((ib: any) => ({
                userId: userIdBig,
                question: ib.question,
                response: ib.response,
                isActive: true,
            })),
        })

        const inserted = insertedRecords.map(serializeIceBreaker)

        // 2. Sync to Instagram
        const user = await db.instagramAccount.findUnique({
            where: { id: userIdBig },
            select: { accessToken: true, pageId: true },
        })

        if (user && user.accessToken && user.pageId) {
            // Construct IG Payload
            const ice_breakers = inserted.map((ib: any) => ({
                question: ib.question,
                payload: `ICE_BREAKER_${ib.id}`
            }))

            // We need to SAVE/MAP this payload to the response?
            // Actually, for simple text reply, we can handle the payload in webhook.
            // BUT, our current webhook looks for Keywords or Postbacks.
            // Let's assume standard behavior: User clicks question -> It sends the question as text?
            // No, Ice Breakers send a Postback payload usually.
            // IF we want to reply with the `response`, we need to map the payload to the response.
            // Let's update the DB insert to include payload if possible, or just match by Question Text (easier for now).
            // IG says: "When a person taps an ice breaker, your webhook receives a messaging_postbacks event."

            // Wait, current DB schema doesn't have payload.
            // Let's use the 'question' as the trigger for now or rely on the fact that we just need to set them.
            // Actually, keeping it simple: We set them on IG. When user clicks, we get a Postback.
            // We need to know which response to send.

            const response = await fetch(
                `https://graph.instagram.com/v21.0/me/messenger_profile?access_token=${user.accessToken}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ice_breakers: ice_breakers,
                        platform: "instagram" // Important
                    })
                }
            )
            const igResult = await response.json()
            if (igResult.error) {
                console.error("IG Sync Error", igResult.error)
                return NextResponse.json({ success: true, warning: "Saved to DB but IG Sync failed", error: igResult.error }, { status: 200 })
            }
        }

        return NextResponse.json({ success: true, data: inserted })

    } catch (error) {
        console.error("Ice Breaker POST Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
