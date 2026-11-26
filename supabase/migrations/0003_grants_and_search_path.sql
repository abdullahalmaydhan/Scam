-- =====================================================================
-- 0003 — table grants + pgcrypto search_path
-- Run after 0001 and 0002.
--
-- Why: new Supabase projects no longer grant table privileges in `public`
-- to anon / authenticated / service_role automatically. 0001 relied on
-- those defaults, so every query failed with "permission denied" (42501),
-- even with the service role key. RLS stays the gate: these grants only
-- let a role reach a table, and the 0001 policies decide which rows it sees.
-- scenarios still has NO read policy, so anon/authenticated get 0 rows.
--
-- Also: on Supabase, pgcrypto lives in the `extensions` schema. start_game
-- calls gen_random_bytes() with search_path = public, so it failed with
-- "function gen_random_bytes(integer) does not exist".
--
-- Any table added in a later migration needs its own grants.
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Server (service role): full access. It bypasses RLS.
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Browser roles: read only, filtered by the RLS policies in 0001.
grant select on
  public.profiles,
  public.scenarios,        -- no policy => 0 rows
  public.game_sessions,
  public.game_answers,
  public.badges,
  public.user_badges,
  public.scan_usage,
  public.articles,
  public.user_stats,
  public.user_category_stats
to anon, authenticated;

-- Signed-in users can update their own profile (policy "own profile update";
-- total_points is still guarded by the protect_points trigger).
grant update on public.profiles to authenticated;

-- gen_random_bytes() is in the extensions schema on Supabase.
alter function public.start_game(game_mode, difficulty_level, uuid)
  set search_path = public, extensions;
