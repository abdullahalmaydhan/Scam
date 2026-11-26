// Rows a user owns in every table (M7 delete check). Defaults to TEST_USER_EMAIL.
//   node --env-file=.env.local scripts/count-user-rows.mjs [userId]
import { createClient } from "@supabase/supabase-js";

const a = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
let id = process.argv[2];
if (!id) {
  const { data } = await a.auth.admin.listUsers({ perPage: 200 });
  id = data.users.find((u) => u.email === process.env.TEST_USER_EMAIL)?.id;
  if (!id) {
    console.log("auth user: none");
    process.exit(0);
  }
}
const { data: auth } = await a.auth.admin.getUserById(id);
const { data: sessions } = await a.from("game_sessions").select("id").eq("user_id", id);
const ids = (sessions ?? []).map((s) => s.id);
const count = async (table, col, val) =>
  (await a.from(table).select("*", { count: "exact", head: true }).eq(col, val)).count;
const answers = ids.length
  ? (await a.from("game_answers").select("*", { count: "exact", head: true }).in("session_id", ids)).count
  : 0;
console.log(
  JSON.stringify({
    user_id: id,
    auth_user: auth?.user ? 1 : 0,
    profiles: await count("profiles", "id", id),
    game_sessions: ids.length,
    game_answers: answers,
    user_badges: await count("user_badges", "user_id", id),
    scan_usage: await count("scan_usage", "user_id", id),
  }),
);
