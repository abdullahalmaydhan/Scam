// M1 database checks (BUILD_PLAN.md). Run:
//   node --env-file=.env.local scripts/check-db.mjs
// Prints only counts and pass/fail, never keys.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

let ok = true;
const check = (name, pass, detail = "") => {
  ok &&= pass;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

// 1. 12 per category × difficulty, 6 for websites (non-showcase).
const { data: rows, error } = await admin
  .from("scenarios")
  .select("category, difficulty, is_showcase")
  .range(0, 9999);
if (error) {
  check("read scenarios with service role", false, error.message);
  process.exit(1);
}
const groups = {};
for (const r of rows.filter((r) => !r.is_showcase)) {
  const k = `${r.category}/${r.difficulty}`;
  groups[k] = (groups[k] ?? 0) + 1;
}
const cats = ["sms", "whatsapp", "email", "banking", "websites"];
const diffs = ["easy", "medium", "hard"];
for (const c of cats) {
  for (const d of diffs) {
    const want = c === "websites" ? 6 : 12;
    const got = groups[`${c}/${d}`] ?? 0;
    check(`scenarios ${c}/${d} = ${want}`, got === want, `got ${got}`);
  }
}
const total = rows.filter((r) => !r.is_showcase).length;
const showcase = rows.filter((r) => r.is_showcase).length;
check("162 game questions", total === 162, `got ${total}`);
check("3 showcase messages", showcase === 3, `got ${showcase}`);

// 2. Other seed data.
for (const [table, want] of [["badges", 13], ["articles", 8]]) {
  const { count, error: e } = await admin.from(table).select("*", { count: "exact", head: true });
  check(`${table} = ${want}`, !e && count === want, e ? e.message : `got ${count}`);
}

// 3. The anon key sees no scenarios (no RLS read policy on purpose).
const { data: anonRows, error: anonErr } = await anon.from("scenarios").select("*");
check(
  "anon: select * from scenarios returns 0 rows",
  !anonErr && Array.isArray(anonRows) && anonRows.length === 0,
  anonErr ? anonErr.message : `got ${anonRows?.length}`,
);

// 4. The anon key can't call the game functions.
const { error: rpcErr } = await anon.rpc("start_game", { p_mode: "sms", p_difficulty: "easy" });
check("anon: start_game is refused", !!rpcErr, rpcErr ? rpcErr.code ?? rpcErr.message : "call succeeded");

console.log(ok ? "\nAll M1 checks passed." : "\nSome M1 checks failed.");
process.exit(ok ? 0 : 1);
