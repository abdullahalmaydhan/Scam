-- English content columns + language-aware game functions
alter table public.scenarios add column sender_en text, add column sender_meta_en text, add column subject_en text,
  add column body_en text, add column explanation_en text;
alter table public.articles add column title_en text, add column intro_en text, add column sections_en jsonb;

-- start_game: the same as 0001, but each question also carries its English fields (the API picks by locale)
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
        'position', o.ord, 'category', s.category, 'link', s.link,
        'sender', s.sender, 'sender_meta', s.sender_meta, 'subject', s.subject, 'body', s.body,
        'sender_en', coalesce(s.sender_en, s.sender), 'sender_meta_en', s.sender_meta_en, 'subject_en', s.subject_en, 'body_en', s.body_en)
        order by o.ord)
      from unnest(v_ids) with ordinality as o(id, ord) join scenarios s on s.id = o.id));
end $$;

-- submit_game: same grading, the "wrong" list carries English too
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
  v_points := v_correct * points_per_correct(v_s.difficulty);
  update game_sessions set status = 'completed', correct_count = v_correct, points = v_points, completed_at = now() where id = p_session;
  if p_user is not null then
    update profiles set total_points = total_points + v_points, updated_at = now() where id = p_user returning total_points into v_total_points;
    v_badges := award_badges(p_user, p_session);
  end if;
  return jsonb_build_object(
    'correct', v_correct, 'total', v_s.total_count, 'points', v_points,
    'percent', round(100.0 * v_correct / v_s.total_count)::int,
    'saved', p_user is not null, 'total_points', v_total_points, 'new_badges', v_badges,
    'wrong', (select coalesce(jsonb_agg(jsonb_build_object(
        'position', a.position, 'your_answer', a.answer, 'correct_answer', s.correct_answer,
        'body', s.body, 'explanation', s.explanation, 'body_en', s.body_en, 'explanation_en', s.explanation_en) order by a.position), '[]'::jsonb)
      from game_answers a join scenarios s on s.id = a.scenario_id
      where a.session_id = p_session and not a.is_correct));
end $$;

revoke all on function public.start_game(game_mode, difficulty_level, uuid) from public, anon, authenticated;
revoke all on function public.submit_game(uuid, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.start_game(game_mode, difficulty_level, uuid) to service_role;
grant execute on function public.submit_game(uuid, jsonb, uuid) to service_role;
