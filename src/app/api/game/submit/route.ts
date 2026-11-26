import { z } from "zod";
import { apiError, apiOk, isNetworkError, sqlErrorCode } from "@/lib/api";
import type { SubmitResponse } from "@/lib/game/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/user";

const Body = z.object({
  session_id: z.uuid(),
  answers: z
    .array(
      z.object({
        position: z.number().int().min(1).max(10),
        answer: z.enum(["scam", "safe"]),
      }),
    )
    .min(1)
    .max(10)
    .refine((a) => new Set(a.map((x) => x.position)).size === a.length, "duplicate positions"),
});

const SQL_ERRORS = [
  "SESSION_NOT_FOUND",
  "SESSION_ALREADY_SUBMITTED",
  "SESSION_NOT_YOURS",
  "WRONG_ANSWER_COUNT",
  "WRONG_ANSWER_POSITIONS",
] as const;

const STATUS: Record<(typeof SQL_ERRORS)[number], number> = {
  SESSION_NOT_FOUND: 404,
  SESSION_ALREADY_SUBMITTED: 409,
  SESSION_NOT_YOURS: 403,
  WRONG_ANSWER_COUNT: 400,
  WRONG_ANSWER_POSITIONS: 400,
};

/** POST /api/game/submit → submit_game(session, answers, user). Grades once, in SQL. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("BAD_REQUEST", 400);

  const userId = await currentUserId();
  const { data, error } = await createAdminClient().rpc("submit_game", {
    p_session: parsed.data.session_id,
    p_answers: parsed.data.answers,
    p_user: userId,
  });

  if (error) {
    const code = sqlErrorCode(error, SQL_ERRORS);
    if (code) return apiError(code, STATUS[code]);
    if (isNetworkError(error)) return apiError("NETWORK", 503);
    return apiError("GENERIC", 500);
  }
  return apiOk(data as SubmitResponse);
}
