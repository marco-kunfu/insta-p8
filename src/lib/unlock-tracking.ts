import { db } from "./db"

/**
 * Persistent unlock-attempt counter, shared across serverless instances.
 *
 * Why this exists: the webhook handler runs in Vercel serverless functions,
 * each invocation having its own memory. A JS `Map` would reset between
 * requests, so the 3-attempt gate cap was ineffective — users could spam
 * the gate card indefinitely. This writes count to the `unlock_attempts`
 * table so the cap works no matter which Vercel instance handles the
 * next webhook.
 *
 * Stale entries are auto-expired by a scheduled pg_cron job (hourly DELETE
 * WHERE updated_at < NOW() - INTERVAL '24 hours'). See schema.sql.
 *
 * The increment is done with a raw atomic INSERT ... ON CONFLICT DO UPDATE
 * so no concurrent invocations can lose a count.
 */

const UNLOCK_TTL_MS = 24 * 60 * 60 * 1000

export function unlockKey(senderId: string, ruleId: string): string {
  return `${senderId}::${ruleId}`
}

async function deleteAttempt(key: string): Promise<void> {
  try {
    await db.unlockAttempt.deleteMany({ where: { key } })
  } catch {
    // Swallow
  }
}

/**
 * Increment the attempt counter for a (sender, rule) pair via an atomic
 * INSERT ... ON CONFLICT DO UPDATE upsert. Atomic and race-free.
 *
 * Returns the new count. If the query fails for any reason (table missing,
 * network error, etc.), falls back to 1 so the user still gets their
 * first gate card rather than being silently blocked.
 */
export async function bumpUnlockAttempt(key: string): Promise<number> {
  try {
    const rows = await db.$queryRaw<{ count: number }[]>`INSERT INTO public.unlock_attempts (key, count, updated_at) VALUES (${key}, 1, NOW()) ON CONFLICT (key) DO UPDATE SET count = public.unlock_attempts.count + 1, updated_at = NOW() RETURNING count`
    const count = rows[0]?.count
    if (typeof count !== "number") {
      console.warn(`[unlock-tracking] bump upsert returned non-number for key=${key}: ${JSON.stringify(rows)}`)
      return 1
    }
    return count
  } catch (e) {
    console.warn(`[unlock-tracking] bump upsert threw for key=${key}:`, e instanceof Error ? e.message : e)
    return 1
  }
}

/**
 * Remove the counter for a (sender, rule) pair — call after verification
 * succeeds or fails outright so retries start fresh.
 */
export async function clearUnlockAttempts(key: string): Promise<void> {
  await deleteAttempt(key)
}
