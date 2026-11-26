import { apiError, apiOk } from "@/lib/api";
import { nextRiyadhMidnight, scanLimit, scansLeft } from "@/lib/scanLimit.server";
import { currentUserId } from "@/lib/supabase/user";

/** GET /api/scan/remaining → { remaining, limit, resets_at } */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return apiError("AUTH_REQUIRED", 401);
  try {
    return apiOk({ remaining: await scansLeft(userId), limit: scanLimit(), resets_at: nextRiyadhMidnight() });
  } catch {
    return apiError("GENERIC", 500);
  }
}
