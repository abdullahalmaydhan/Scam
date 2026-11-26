import { z } from "zod";
import { apiError, apiOk, isNetworkError, sqlErrorCode } from "@/lib/api";
import { DIFFICULTIES, MODES, type StartResponse } from "@/lib/game/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/user";

const Body = z.object({
  mode: z.enum(MODES),
  difficulty: z.enum(DIFFICULTIES),
});

/**
 * POST /api/game/start (guest or signed in) → start_game(mode, difficulty, user).
 * The response never carries correct_answer or explanation.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("BAD_REQUEST", 400);

  const userId = await currentUserId();
  const { data, error } = await createAdminClient().rpc("start_game", {
    p_mode: parsed.data.mode,
    p_difficulty: parsed.data.difficulty,
    p_user: userId,
  });

  if (error) {
    if (sqlErrorCode(error, ["NOT_ENOUGH_QUESTIONS"] as const)) return apiError("NOT_ENOUGH_QUESTIONS", 503);
    if (isNetworkError(error)) return apiError("NETWORK", 503);
    return apiError("GENERIC", 500);
  }
  return apiOk(data as StartResponse);
}
