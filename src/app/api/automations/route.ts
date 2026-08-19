import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Prisma, type Automation } from "@prisma/client"

// Map a Prisma Automation record back to the raw DB row shape the frontend expects
function serializeAutomation(a: Automation) {
  return {
    id: a.id,
    user_id: Number(a.userId),
    name: a.name,
    trigger_type: a.triggerType,
    trigger_value: a.triggerValue,
    response_type: a.responseType,
    response_content: a.responseContent,
    media_selection: a.mediaSelection,
    selected_reel_id: a.selectedReelId,
    specific_media_id: a.specificMediaId,
    trigger_source: a.triggerSource,
    follow_up_steps: a.followUpSteps,
    is_active: a.isActive,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    let userIdBig: bigint
    try {
      userIdBig = BigInt(userId)
    } catch {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // STABLE FIX: Fetch rules by the Login ID (userId) directly.
    // We stop caring about the shifting Business ID here.
    const data = await db.automation.findMany({
      where: { userId: userIdBig },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(data.map(serializeAutomation))
  } catch (error) {
    console.error("[v0] Automations GET error:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, trigger_source, trigger_type, trigger_value, content, specific_media_id } = await request.json()

    if (!userId || !name || !trigger_value || !content || !trigger_source) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Validate trigger_source
    if (!['comment', 'dm', 'story'].includes(trigger_source)) {
      return NextResponse.json({ error: "Invalid trigger source" }, { status: 400 })
    }

    let userIdBig: bigint
    try {
      userIdBig = BigInt(userId)
    } catch {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // STABLE FIX: Always save to the Login ID
    const finalTriggerValue =
      trigger_type === "postback"
        ? `PAYLOAD_${Date.now()}_${Math.random().toString(36).substring(7)}`
        : trigger_value.toLowerCase()

    const data = await db.automation.create({
      data: {
        userId: userIdBig,
        name,
        triggerSource: trigger_source,
        triggerType: trigger_type || "keyword",
        triggerValue: finalTriggerValue,
        responseType: "pro",
        responseContent: content,
        isActive: true,
        specificMediaId: specific_media_id || null,
      },
    })

    return NextResponse.json(serializeAutomation(data))
  } catch (error) {
    console.error("[v0] Automations POST error:", error)
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    await db.automation.deleteMany({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Automations DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, trigger_source, trigger_type, trigger_value, content, specific_media_id } = await request.json()

    if (!id || !name || !trigger_value || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Validate trigger_source if provided
    if (trigger_source && !['comment', 'dm', 'story'].includes(trigger_source)) {
      return NextResponse.json({ error: "Invalid trigger source" }, { status: 400 })
    }

    const updateData: Prisma.AutomationUpdateInput = {
      name,
      triggerType: trigger_type || "keyword",
      triggerValue: trigger_value.toLowerCase(),
      responseContent: content,
      specificMediaId: specific_media_id || null,
    }

    // Only update trigger_source if provided
    if (trigger_source) {
      updateData.triggerSource = trigger_source
    }

    const data = await db.automation.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(serializeAutomation(data))
  } catch (error) {
    console.error("[v0] Automations PUT error:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, is_active, action } = await request.json()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    if (action === "duplicate") {
      const original = await db.automation.findUnique({ where: { id } })
      if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 })

      const data = await db.automation.create({
        data: {
          userId: original.userId,
          name: `${original.name} (copy)`,
          triggerType: original.triggerType,
          triggerValue: original.triggerValue,
          responseType: original.responseType,
          responseContent: (original.responseContent ?? undefined) as Prisma.InputJsonValue | undefined,
          mediaSelection: (original.mediaSelection ?? undefined) as Prisma.InputJsonValue | undefined,
          selectedReelId: original.selectedReelId,
          specificMediaId: original.specificMediaId,
          triggerSource: original.triggerSource,
          followUpSteps: (original.followUpSteps ?? undefined) as Prisma.InputJsonValue | undefined,
          isActive: false,
        },
      })

      return NextResponse.json(serializeAutomation(data))
    }

    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "Missing is_active" }, { status: 400 })
    }

    const data = await db.automation.update({
      where: { id },
      data: { isActive: is_active },
    })

    return NextResponse.json(serializeAutomation(data))
  } catch (error) {
    console.error("[v0] Automations PATCH error:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
