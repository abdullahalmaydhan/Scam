import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ confirm: z.literal("DELETE") });

/**
 * DELETE /api/account (signed in), body { confirm: "DELETE" }.
 * Deletes the auth user; profile, sessions, answers, badges and scans
 * cascade (HANDOFF §8 rule 13). Then signs the session out.
 */
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return apiError("AUTH_REQUIRED", 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("BAD_REQUEST", 400);

  const { error } = await createAdminClient().auth.admin.deleteUser(data.user.id);
  if (error) return apiError("GENERIC", 500);

  // Clear the session cookies on this response.
  await supabase.auth.signOut().catch(() => {});
  return apiOk({ ok: true });
}
