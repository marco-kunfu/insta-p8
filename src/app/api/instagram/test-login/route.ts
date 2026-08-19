import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * POST /api/instagram/test-login
 * Creates a mock user for local development — no Instagram OAuth needed.
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not available in production" }, { status: 403 })
    }

    const TEST_USER_ID = "9999999999"
    const TEST_USERNAME = "test_creator"

    const testUser = {
      username: TEST_USERNAME,
      accessToken: "TEST_TOKEN_NOT_REAL",
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      businessAccountId: BigInt(TEST_USER_ID),
      pageId: TEST_USER_ID,
    }

    await db.instagramAccount.upsert({
      where: { id: BigInt(TEST_USER_ID) },
      create: { id: BigInt(TEST_USER_ID), ...testUser },
      update: testUser,
    })

    const response = NextResponse.json({
      success: true,
      username: TEST_USERNAME,
      userId: TEST_USER_ID,
    })

    response.cookies.set(
      "insta_session",
      JSON.stringify({ username: TEST_USERNAME, userId: TEST_USER_ID }),
      {
        path: "/",
        maxAge: 60 * 24 * 60 * 60,
        sameSite: "lax",
        secure: false,
      }
    )

    return response
  } catch (error: any) {
    console.error("[test-login] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
