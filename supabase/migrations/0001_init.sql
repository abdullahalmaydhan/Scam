-- =====================================================================
-- احتيال؟ (Scam or Safe?) — initial schema
-- Run with: supabase db push   (or paste into the Supabase SQL editor)
-- All game grading, points and badges run in SECURITY DEFINER functions
-- that only the service role may execute. The browser never sees answers.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type scenario_category as enum ('sms','whatsapp','email','banking','websites');
create type game_mode        as enum ('sms','whatsapp','email','banking','websites','mixed');
create type difficulty_level as enum ('easy','medium','hard');
create type answer_choice    as enum ('scam','safe');
create type session_status   as enum ('active','completed','abandoned');
create type risk_level       as enum ('low','suspicious','high','insufficient');
create type badge_rule       as enum ('first_round','perfect_round','perfect_hard_round','points_total','category_correct');

-- ---------- profiles ----------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 80),
  language      text not null default 'ar'   check (language in ('ar','en')),
  theme         text not null default 'dark' check (theme in ('dark','light')),
  total_points  integer not null default 0 check (total_points >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- create a profile automatically on sign-up (display_name comes from sign-up metadata)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''), split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- scenarios (game questions) ----------
create table public.scenarios (
  id              uuid primary key default gen_random_uuid(),
  category        scenario_category not null,
  difficulty      difficulty_level not null,
  sender          text not null,            -- phone, name, email address or full URL (websites)
  sender_meta     text not null default '', -- time label shown on the slip, e.g. "١١:٤٢ ص" or "واتساب · أمس"
  subject         text,                     -- email subject or website page title
  body            text not null,
  link            text,                     -- shown as non-clickable text only
  correct_answer  answer_choice not null,
  explanation     text not null,            -- one short sentence, shown in "راجع أخطاءك"
  is_active       boolean not null default true,
  is_showcase     boolean not null default false, -- home-page examples; never served in a round
  created_at      timestamptz not null default now()
);
create index scenarios_pick_idx on public.scenarios (category, difficulty) where is_active and not is_showcase;

-- ---------- game sessions & answers ----------
create table public.game_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade,  -- null = guest
  mode              game_mode not null,
  difficulty        difficulty_level not null,
  question_ids      uuid[] not null,
  status            session_status not null default 'active',
  correct_count     integer,
  total_count       integer not null,
  points            integer,
  claim_token_hash  text,          -- guests only: sha256 of the token the browser keeps
  claimed_at        timestamptz,
  started_at        timestamptz not null default now(),
  completed_at      timestamptz
);
create index game_sessions_user_idx on public.game_sessions (user_id, completed_at desc);

create table public.game_answers (
  id            bigint generated always as identity primary key,
  session_id    uuid not null references public.game_sessions(id) on delete cascade,
  scenario_id   uuid not null references public.scenarios(id),
  position      integer not null check (position >= 1),
  category      scenario_category not null,   -- the scenario's own category (mixed rounds count per category)
  answer        answer_choice not null,
  is_correct    boolean not null,
  answered_at   timestamptz not null default now(),
  unique (session_id, position)
);

-- ---------- badges ----------
create table public.badges (
  code            text primary key,
  name_ar         text not null,
  name_en         text not null,
  description_ar  text not null,
  rule            badge_rule not null,
  threshold       integer,
  category        scenario_category,
  sort            integer not null
);
create table public.user_badges (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  badge_code  text not null references public.badges(code),
  earned_at   timestamptz not null default now(),
  primary key (user_id, badge_code)
);

-- ---------- scan usage (never stores the message itself) ----------
create table public.scan_usage (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  input_type  text not null check (input_type in ('text','image')),
  result      risk_level,          -- null when the AI call failed (failed calls do not count)
  created_at  timestamptz not null default now()
);
create index scan_usage_user_day_idx on public.scan_usage (user_id, created_at desc);

-- ---------- learn articles ----------
create table public.articles (
  slug          text primary key,
  title_ar      text not null,
  minutes       integer not null,
  intro_ar      text not null,
  sections      jsonb not null,      -- [{ "heading": "...", "kind": "p"|"list", "text": "...", "items": ["..."] }]
  sort          integer not null,
  is_published  boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- ---------- stats views ----------
create view public.user_stats with (security_invoker = true) as
select p.id as user_id,
       p.total_points,
       count(distinct s.id) filter (where s.status = 'completed')           as rounds_completed,
       count(a.id)                                                          as questions_answered,
       count(a.id) filter (where a.is_correct)                              as correct_answers,
       case when count(a.id) = 0 then 0
            else round(100.0 * count(a.id) filter (where a.is_correct) / count(a.id))::int end as correct_percent
from public.profiles p
left join public.game_sessions s on s.user_id = p.id
left join public.game_answers a on a.session_id = s.id
group by p.id, p.total_points;

create view public.user_category_stats with (security_invoker = true) as
select s.user_id, a.category,
       count(*)                              as answered,
       count(*) filter (where a.is_correct)  as correct,
       round(100.0 * count(*) filter (where a.is_correct) / count(*))::int as correct_percent
from public.game_answers a
join public.game_sessions s on s.id = a.session_id
where s.user_id is not null
group by s.user_id, a.category;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles      enable row level security;
alter table public.scenarios     enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_answers  enable row level security;
alter table public.badges        enable row level security;
alter table public.user_badges   enable row level security;
alter table public.scan_usage    enable row level security;
alter table public.articles      enable row level security;

create policy "own profile read"    on public.profiles for select using (auth.uid() = id);
create policy "own profile update"  on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);
-- total_points can only change through the SECURITY DEFINER functions below
create or replace function public.protect_points() returns trigger language plpgsql as $$
begin
  if new.total_points is distinct from old.total_points
     and current_user not in ('postgres','service_role','supabase_admin') then
    raise exception 'total_points is read-only';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_protect_points before update on public.profiles
  for each row execute function public.protect_points();

-- scenarios: NO policy for anon/authenticated => nobody can read answers from the browser.
create policy "own sessions read"   on public.game_sessions for select using (auth.uid() = user_id);
create policy "own answers read"    on public.game_answers  for select
  using (exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "badges public read"  on public.badges        for select using (true);
create policy "own badges read"     on public.user_badges   for select using (auth.uid() = user_id);
create policy "own scans read"      on public.scan_usage    for select using (auth.uid() = user_id);
create policy "articles public read" on public.articles     for select using (is_published);

-- =====================================================================
-- Game functions (service role only)
-- =====================================================================
create or replace function public.round_size(p_mode game_mode) returns integer
language sql immutable as $$ select case when p_mode = 'websites' then 3 else 10 end $$;

create or replace function public.points_per_correct(p_diff difficulty_level) returns integer
language sql immutable as $$ select case p_diff when 'easy' then 10 when 'medium' then 20 else 30 end $$;

-- start a round: picks random questions, returns them WITHOUT answers
create or replace function public.start_game(p_mode game_mode, p_difficulty difficulty_level, p_user uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ids uuid[]; v_session uuid; v_token text := null; v_size int := round_size(p_mode);
begin
  select array_agg(id) into v_ids from (
    select id from scenarios
    where is_active and not is_showcase and difficulty = p_difficulty
      and (p_mode = 'mixed' or category::text = p_mode::text)
    order by random() limit v_size) q;
  if v_ids is null or array_length(v_ids,1) < v_size then
    raise exception 'NOT_ENOUGH_QUESTIONS' using errcode = 'P0001';
  end if;
  if p_user is null then v_token := encode(gen_random_bytes(24),'hex'); end if;
  insert into game_sessions (user_id, mode, difficulty, question_ids, total_count, claim_token_hash)
  values (p_user, p_mode, p_difficulty, v_ids, v_size,
          case when v_token is null then null else encode(digest(v_token,'sha256'),'hex') end)
  returning id into v_session;
  return jsonb_build_object(
    'session_id', v_session, 'claim_token', v_token, 'total', v_size,
    'points_per_correct', points_per_correct(p_difficulty),
    'questions', (select jsonb_agg(jsonb_build_object(
        'position', o.ord, 'category', s.category, 'sender', s.sender, 'sender_meta', s.sender_meta,
        'subject', s.subject, 'body', s.body, 'link', s.link) order by o.ord)
      from unnest(v_ids) with ordinality as o(id, ord) join scenarios s on s.id = o.id));
end $$;

-- award badges for a user, returns the newly earned ones
create or replace function public.award_badges(p_user uuid, p_session uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_new jsonb := '[]'::jsonb; b record; v_ok boolean; v_s game_sessions;
begin
  select * into v_s from game_sessions where id = p_session;
  for b in select * from badges order by sort loop
    continue when exists (select 1 from user_badges where user_id = p_user and badge_code = b.code);
    v_ok := case b.rule
      when 'first_round' then true
      when 'perfect_round' then v_s.correct_count = v_s.total_count
      when 'perfect_hard_round' then v_s.correct_count = v_s.total_count and v_s.difficulty = 'hard'
      when 'points_total' then (select total_points from profiles where id = p_user) >= b.threshold
      when 'category_correct' then (select count(*) from game_answers a join game_sessions s on s.id = a.session_id
                                    where s.user_id = p_user and a.is_correct and a.category = b.category) >= b.threshold
    end;
    if v_ok then
      insert into user_badges (user_id, badge_code) values (p_user, b.code);
      v_new := v_new || jsonb_build_object('code', b.code, 'name_ar', b.name_ar, 'description_ar', b.description_ar);
    end if;
  end loop;
  return v_new;
end $$;

-- grade a round once. p_answers = '[{"position":1,"answer":"scam"}, ...]'
create or replace function public.submit_game(p_session uuid, p_answers jsonb, p_user uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_s game_sessions; v_correct int; v_points int; v_badges jsonb := '[]'::jsonb; v_total_points int := null;
begin
  select * into v_s from game_sessions where id = p_session for update;
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001'; end if;
  if v_s.status <> 'active' then raise exception 'SESSION_ALREADY_SUBMITTED' using errcode = 'P0001'; end if;
  if v_s.user_id is distinct from p_user then raise exception 'SESSION_NOT_YOURS' using errcode = 'P0001'; end if;
  if jsonb_array_length(p_answers) <> v_s.total_count then raise exception 'WRONG_ANSWER_COUNT' using errcode = 'P0001'; end if;

  insert into game_answers (session_id, scenario_id, position, category, answer, is_correct)
  select p_session, s.id, o.ord, s.category, (x->>'answer')::answer_choice, (x->>'answer')::answer_choice = s.correct_answer
  from unnest(v_s.question_ids) with ordinality o(id, ord)
  join scenarios s on s.id = o.id
  join jsonb_array_elements(p_answers) x on (x->>'position')::int = o.ord;

  select count(*) filter (where is_correct) into v_correct from game_answers where session_id = p_session;
  if (select count(*) from game_answers where session_id = p_session) <> v_s.total_count then
    raise exception 'WRONG_ANSWER_POSITIONS' using errcode = 'P0001';
  end if;
  v_points := v_correct * points_per_correct(v_s.difficulty);   -- no minus points for wrong answers
  update game_sessions set status = 'completed', correct_count = v_correct, points = v_points, completed_at = now()
  where id = p_session;

  if p_user is not null then
    update profiles set total_points = total_points + v_points, updated_at = now() where id = p_user
    returning total_points into v_total_points;
    v_badges := award_badges(p_user, p_session);
  end if;

  return jsonb_build_object(
    'correct', v_correct, 'total', v_s.total_count, 'points', v_points,
    'percent', round(100.0 * v_correct / v_s.total_count)::int,
    'saved', p_user is not null, 'total_points', v_total_points, 'new_badges', v_badges,
    'wrong', (select coalesce(jsonb_agg(jsonb_build_object(
        'position', a.position, 'your_answer', a.answer, 'correct_answer', s.correct_answer,
        'body', s.body, 'explanation', s.explanation) order by a.position), '[]'::jsonb)
      from game_answers a join scenarios s on s.id = a.scenario_id
      where a.session_id = p_session and not a.is_correct));
end $$;

-- a guest who signs up right after a round can keep its points (within 24h, once)
create or replace function public.claim_game(p_session uuid, p_token text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_s game_sessions; v_total int; v_badges jsonb;
begin
  select * into v_s from game_sessions where id = p_session for update;
  if not found or v_s.user_id is not null or v_s.claimed_at is not null or v_s.status <> 'completed'
     or v_s.claim_token_hash <> encode(digest(p_token,'sha256'),'hex')
     or v_s.completed_at < now() - interval '24 hours' then
    raise exception 'CLAIM_NOT_ALLOWED' using errcode = 'P0001';
  end if;
  update game_sessions set user_id = p_user, claimed_at = now(), claim_token_hash = null where id = p_session;
  update profiles set total_points = total_points + v_s.points, updated_at = now() where id = p_user
  returning total_points into v_total;
  v_badges := award_badges(p_user, p_session);
  return jsonb_build_object('points', v_s.points, 'total_points', v_total, 'new_badges', v_badges);
end $$;

-- scans left today (resets at 00:00 Asia/Riyadh). Limit lives in one place.
create or replace function public.scans_left_today(p_user uuid, p_limit int default 5)
returns integer language sql security definer set search_path = public as $$
  select greatest(0, p_limit - count(*)::int) from scan_usage
  where user_id = p_user and result is not null
    and created_at >= (date_trunc('day', now() at time zone 'Asia/Riyadh') at time zone 'Asia/Riyadh')
$$;

revoke all on function public.start_game(game_mode, difficulty_level, uuid) from public, anon, authenticated;
revoke all on function public.submit_game(uuid, jsonb, uuid)                 from public, anon, authenticated;
revoke all on function public.claim_game(uuid, text, uuid)                   from public, anon, authenticated;
revoke all on function public.award_badges(uuid, uuid)                       from public, anon, authenticated;
revoke all on function public.scans_left_today(uuid, int)                    from public, anon, authenticated;
grant execute on function public.start_game(game_mode, difficulty_level, uuid) to service_role;
grant execute on function public.submit_game(uuid, jsonb, uuid)                 to service_role;
grant execute on function public.claim_game(uuid, text, uuid)                   to service_role;
grant execute on function public.award_badges(uuid, uuid)                       to service_role;
grant execute on function public.scans_left_today(uuid, int)                    to service_role;

-- clean abandoned guest rounds older than 2 days (run daily with pg_cron if available)
create or replace function public.cleanup_sessions() returns void language sql security definer set search_path = public as $$
  delete from game_sessions where user_id is null and started_at < now() - interval '2 days';
  update game_sessions set status = 'abandoned' where status = 'active' and started_at < now() - interval '1 day';
$$;
