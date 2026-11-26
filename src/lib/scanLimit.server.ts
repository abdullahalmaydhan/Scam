import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** One place for the daily limit (HANDOFF §10.7): SCAN_DAILY_LIMIT, default 5. */
export function scanLimit(): number {
  const n = Number(process.env.SCAN_DAILY_LIMIT ?? 5);
  return Number.isInteger(n) && n > 0 ? n : 5;
}

/** Successful scans left today (resets 00:00 Asia/Riyadh), from SQL. */
export async function scansLeft(userId: string): Promise<number> {
  const { data, error } = await createAdminClient().rpc("scans_left_today", {
    p_user: userId,
    p_limit: scanLimit(),
  });
  if (error) throw error;
  return data as number;
}

/** Next 00:00 in Riyadh (UTC+3, no daylight saving), e.g. "2026-11-27T00:00:00+03:00". */
export function nextRiyadhMidnight(now = new Date()): string {
  const riyadh = new Date(now.getTime() + 3 * 3600_000);
  riyadh.setUTCDate(riyadh.getUTCDate() + 1);
  return `${riyadh.toISOString().slice(0, 10)}T00:00:00+03:00`;
}
