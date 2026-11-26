import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; displayName: string };

/** The signed-in user and their display name, or null for a guest. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const name =
    profile?.display_name ?? (user.user_metadata?.display_name as string | undefined) ?? user.email?.split("@")[0] ?? "";
  return { id: user.id, displayName: name };
}
