import { apiError, apiOk } from "@/lib/api";
import { getHistory } from "@/lib/profile.server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/profile/history?limit=10 (signed in): the latest completed rounds. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return apiError("AUTH_REQUIRED", 401);
  const raw = Number(new URL(req.url).searchParams.get("limit") ?? 10);
  const limit = Number.isInteger(raw) && raw >= 1 && raw <= 50 ? raw : 10;
  try {
    return apiOk(await getHistory(supabase, data.user, limit));
  } catch {
    return apiError("GENERIC", 500);
  }
}
