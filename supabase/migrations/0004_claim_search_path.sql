-- =====================================================================
-- 0004 — claim_game finds pgcrypto
-- Run after 0003.
--
-- Why: claim_game calls digest() (pgcrypto), which lives in the
-- `extensions` schema on Supabase. With search_path = public it failed
-- with "function digest(text, unknown) does not exist". 0003 fixed the
-- same thing for start_game; claim_game is the only other pgcrypto user.
-- =====================================================================

alter function public.claim_game(uuid, text, uuid)
  set search_path = public, extensions;
