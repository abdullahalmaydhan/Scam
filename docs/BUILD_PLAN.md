# BUILD_PLAN.md — build in this order

Finish each milestone and check every box before you start the next. After each milestone, commit with a clear message.

## M0 · Project setup
- [ ] Next.js App Router + TypeScript + Tailwind, `src/` layout. `<html lang="ar" dir="rtl">`.
- [ ] Tailwind theme from DESIGN.md: colors as CSS variables (`--ink`, `--surface`, …) with a `[data-theme="light"]` override. Font sizes 48/22/16/13. Radius 8 and 4. 8px spacing.
- [ ] Load Almarai and Noto Sans Arabic with `next/font/google`.
- [ ] i18n: `content/ui-strings.ar.json` + `content/ui-strings.en.json`. The locale and theme live in a cookie and localStorage (`sos.lang`, `sos.theme`) and apply to every page immediately, with `dir` switching too. Add a helper `t(key, vars)` that also converts digits to Arabic-Indic when the locale is `ar`.
- [ ] Shared components from DESIGN.md §5: Button (primary, hero, secondary, destructive), AnswerButton, Input, Card, ListItem, RadioOption, Segmented, BadgeChip, RiskMeter, ProgressBar, ScoreRing, MessageSlip (sms, whatsapp, email, websites), Sheet/Dialog, Stamp.
- **Check:** a `/dev/components` page renders every component in dark and light, at 390 and 1280. There are no hard-coded colors outside the theme.

## M1 · Database
- [ ] Create a Supabase project. `supabase db push` both migrations (0001, 0002). Run `supabase/seed.sql`.
- [ ] `.env.local` from `.env.example`.
- [ ] `src/lib/supabase/{server,admin,browser}.ts`.
- **Check:** `select category, difficulty, count(*) from scenarios where not is_showcase group by 1,2` gives 12 per group, and 6 for websites. With the anon key, `select * from scenarios` returns 0 rows.

## M2 · Home + game (guest)
- [ ] H-1 home with the 3 showcase slips on laptop (`/api/showcase`) and the decorative background.
- [ ] `/play`: G-1 → G-2 → G-3 → G-5 as **one client page with local state** (no reload between questions).
- [ ] `/api/game/start` and `/api/game/submit` per API.md. Keep answers in state and `sessionStorage` while playing.
- [ ] The stamp animation, then the next question after 720ms. Respect reduced motion.
- [ ] G-4 exit sheet on mobile, dialog on laptop.
- [ ] Result: score ring, summary, guest box, review list, and only two buttons (اختر تحدي آخر · ارجع للرئيسية).
- **Check:** a websites round has 3 questions, every other round has 10. A hard round gives 30 per correct answer. The network tab never shows `correct_answer` before submit. Turning Wi-Fi off mid-round then on keeps the answers and submits fine. A second submit returns 409.

## M3 · Accounts
- [ ] A-1 login, A-2 sign up (sends `display_name`), A-3 forgot, A-4 reset.
- [ ] After auth, if `pendingRound` exists → `/api/game/claim` → show `result.saved_new_account` or `result.saved`.
- [ ] Header: "تسجيل الدخول" for a guest, avatar + "حسابي" when signed in.
- [ ] Middleware protects `/profile`, `/settings` and `/scan` (scan shows the guest state instead of redirecting).
- **Check:** a guest round of 7/10 on easy, then sign up → profile shows 70 points and the badge «البداية». Claiming the same round again returns 409.

## M4 · Profile and badges
- [ ] P-1 from `/api/profile`, `/api/badges` and `/api/profile/history`. Empty state for new users.
- [ ] Badge rows: earned first, then in-progress with "٤٠ من ٥٠" and "باقي ١٠".
- **Check:** the numbers match SQL (`user_stats`, `user_category_stats`). The percent is total correct ÷ total answered. A mixed round updates each category it touched.

## M5 · Learn
- [ ] L-1 list (8 equal rows) and L-2 article from `articles`. A "الموضوع التالي" button, and on the last article "ارجع لكل المواضيع". No mention of the challenge here.
- **Check:** all 8 articles render with their lists numbered in Arabic-Indic digits.

## M6 · Scam detector
- [ ] S-1 with the text/image tabs, the privacy tip and the remaining count.
- [ ] `/api/scan` per API.md and AI_SCAN.md (zod validation, 1 retry, 20s timeout, no storage).
- [ ] S-2 results for all 3 risk levels, plus the separate "insufficient" screen.
- [ ] States: guest, empty, loading, error, limit reached, image too big.
- **Check:** all 5 test cases in AI_SCAN.md pass. The 6th scan in a day is refused. A failed AI call doesn't reduce the remaining count. Searching the logs for the test message text finds nothing.

## M7 · Settings
- [ ] Language segmented control (switches `dir`), theme segmented control (`data-theme`), name and email, change password, logout.
- [ ] Delete account sheet with the user's real numbers → `DELETE /api/account` → signed out → home.
- **Check:** light theme passes 4.5:1 contrast on every text. Deleting removes every row of that user (sessions, answers, badges, scans).

## M8 · Quality pass
- [ ] Every screen and state from HANDOFF §3 and §5 exists on 390 and 1280, using texts only from `ui-strings`.
- [ ] RTL checklist (DESIGN.md §8). Lighthouse accessibility ≥ 95. Keyboard: every action is reachable, and focus is visible.
- [ ] No link inside a message or result is clickable.

## M9 · Deploy
- [ ] Vercel project, env vars set (never `NEXT_PUBLIC_` for secrets), Supabase auth redirect URLs set to the Vercel domain.
- [ ] Optional: schedule `select cleanup_sessions();` daily with pg_cron.
- **Check:** run the whole happy path on a real phone over 4G, from the deployed URL.
