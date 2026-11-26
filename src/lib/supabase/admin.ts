import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Server only: bypasses RLS. Use it only for the
 * SQL functions start_game, submit_game, claim_game, scans_left_today and
 * the scan_usage log, from route handlers.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars are missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
