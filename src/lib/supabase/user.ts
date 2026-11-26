import "server-only";
import { createClient } from "./server";

/**
 * The signed-in user's id, or null for a guest. Reads the session cookie,
 * or an `Authorization: Bearer <access token>` header when given (used
 * right after sign-up, before the browser has written the cookie).
 */
export async function currentUserId(req?: Request): Promise<string | null> {
  const supabase = await createClient();
  const bearer = req?.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const { data } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();
  return data.user?.id ?? null;
}
