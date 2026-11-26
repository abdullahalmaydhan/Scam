import { z } from "zod";
import { apiError, apiOk, isNetworkError, sqlErrorCode } from "@/lib/api";
import type { NewBadge } from "@/lib/game/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/user";

const Body = z.object({
  session_id: z.uuid(),
  claim_token: z.string().regex(/^[0-9a-f]{48}$/),
});

/**
 * POST /api/game/claim (signed in) → claim_game(session, token, user).
 * Adds a guest round to the new account once, within 24h.
 */
export async function POST(req: Request) {
  const userId = await currentUserId(req);
  if (!userId) return apiError("AUTH_REQUIRED", 401);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("BAD_REQUEST", 400);

  const { data, error } = await createAdminClient().rpc("claim_game", {
    p_session: parsed.data.session_id,
    p_token: parsed.data.claim_token,
    p_user: userId,
  });

  if (error) {
    if (sqlErrorCode(error, ["CLAIM_NOT_ALLOWED"] as const)) return apiError("CLAIM_NOT_ALLOWED", 409);
    if (isNetworkError(error)) return apiError("NETWORK", 503);
    return apiError("GENERIC", 500);
  }
  return apiOk(data as { points: number; total_points: number; new_badges: NewBadge[] });
}
