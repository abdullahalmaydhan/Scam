import { apiError, apiOk } from "@/lib/api";
import { getBadges } from "@/lib/profile.server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/badges (signed in): all 13 badges, earned_at, and progress where the rule has one. */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return apiError("AUTH_REQUIRED", 401);
  try {
    return apiOk(await getBadges(supabase, data.user));
  } catch {
    return apiError("GENERIC", 500);
  }
}
