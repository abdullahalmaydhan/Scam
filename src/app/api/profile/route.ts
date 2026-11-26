import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { getProfile } from "@/lib/profile.server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/profile (signed in): stats from the user_stats / user_category_stats views. */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return apiError("AUTH_REQUIRED", 401);
  try {
    return apiOk(await getProfile(supabase, data.user));
  } catch {
    return apiError("GENERIC", 500);
  }
}

const Patch = z
  .object({
    display_name: z.string().trim().min(1).max(80).optional(),
    language: z.enum(["ar", "en"]).optional(),
    theme: z.enum(["dark", "light"]).optional(),
  })
  .refine((b) => Object.keys(b).length > 0);

/**
 * PATCH /api/profile (signed in): any of display_name, language, theme.
 * Runs as the user (RLS "own profile update"); total_points stays guarded
 * by the protect_points trigger.
 */
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return apiError("AUTH_REQUIRED", 401);
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("BAD_REQUEST", 400);
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", data.user.id);
  if (error) return apiError("GENERIC", 500);
  return apiOk({ ok: true });
}
