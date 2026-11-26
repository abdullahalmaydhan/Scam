# API.md — routes, requests, responses

All routes are Next.js Route Handlers under `src/app/api/**/route.ts`.
- `supabaseServer()` = a server client with the **user's cookie session** (from `@supabase/ssr`). It reads `auth.getUser()`.
- `supabaseAdmin()` = a server client with `SUPABASE_SERVICE_ROLE_KEY`. Use it **only** for the SQL functions and for account deletion.
- Validate every body with `zod`. On a validation error, return `400 { "error": "BAD_REQUEST" }`.
- Errors return `{ "error": "<CODE>" }`. The UI maps each code to the exact Arabic text in `content/ui-strings.ar.json → errors`.

Locale: every route reads the `sos-lang` cookie (`ar` default, or `en`). Game routes return both `body` and `body_en`, and the client shows the one for the current locale, so switching language mid-round works without a reload.

Enums: `mode ∈ sms|whatsapp|email|banking|websites|mixed` · `difficulty ∈ easy|medium|hard` · `answer ∈ scam|safe` · `risk ∈ low|suspicious|high|insufficient`.

---

## Game

### `POST /api/game/start` (guest or signed in)
Body `{ "mode": "sms", "difficulty": "easy" }`
Calls `start_game(mode, difficulty, user_id | null)`.
`200`
```json
{ "session_id": "uuid", "claim_token": "hex | null", "total": 10, "points_per_correct": 10,
  "questions": [ { "position": 1, "category": "sms", "sender": "+966 55 384 2917", "sender_meta": "١١:٤٢ ص",
                   "subject": null, "body": "…", "link": "spl-ksa-track.info/pay" } ] }
```
- Rounds are 10 questions, except `websites`, which is 3. `mixed` takes 10 from all categories at the chosen level.
- Guests get a `claim_token`. Keep it with the `session_id` in `sessionStorage` key `pendingRound`.
- Errors: `503 NOT_ENOUGH_QUESTIONS`.

### `POST /api/game/submit`
Body `{ "session_id": "uuid", "answers": [ { "position": 1, "answer": "scam" }, … ] }` (all answers at once, sent at the end)
The browser keeps answers in memory and in `sessionStorage` during the round, so a dropped connection doesn't lose them (state "انقطع الاتصال").
Calls `submit_game(session_id, answers, user_id | null)`.
`200`
```json
{ "correct": 7, "total": 10, "points": 70, "percent": 70, "saved": false, "total_points": null,
  "new_badges": [ { "code": "first_round", "name_ar": "البداية", "description_ar": "أكملت أول جولة" } ],
  "wrong": [ { "position": 3, "your_answer": "safe", "correct_answer": "scam", "body": "…", "explanation": "…" } ] }
```
Errors: `404 SESSION_NOT_FOUND` · `409 SESSION_ALREADY_SUBMITTED` · `403 SESSION_NOT_YOURS` · `400 WRONG_ANSWER_COUNT | WRONG_ANSWER_POSITIONS` · `503 NETWORK`.

### `POST /api/game/claim` (signed in)
Called automatically right after sign-up or login when `sessionStorage.pendingRound` exists. Clear the key afterwards, even on error.
Body `{ "session_id": "uuid", "claim_token": "hex" }` → `claim_game(...)`
`200 { "points": 70, "total_points": 70, "new_badges": [ … ] }` · Errors: `409 CLAIM_NOT_ALLOWED` (already claimed, expired after 24h, or wrong token).

---

## Profile & badges (signed in)

### `GET /api/profile`
```json
{ "display_name": "محمد بن عبدالله بن سعيد القحطاني", "email": "mohammed.alqahtani@gmail.com", "member_since": "2026-11-01",
  "language": "ar", "theme": "dark",
  "stats": { "total_points": 2540, "rounds_completed": 23, "questions_answered": 210, "correct_answers": 163, "correct_percent": 78 },
  "categories": [ { "category": "sms", "answered": 70, "correct": 60, "correct_percent": 86 } ],
  "badges_earned": 6, "badges_total": 13 }
```
`correct_percent` = total correct ÷ total answered (not the average of round percents). Read it from the `user_stats` view. Mixed rounds count under each question's own category (the `user_category_stats` view).

### `GET /api/profile/history?limit=10`
`[ { "mode": "sms", "difficulty": "easy", "correct": 7, "total": 10, "points": 70, "completed_at": "…" } ]`

### `GET /api/badges`
`[ { "code": "expert_whatsapp", "name_ar": "خبير الواتساب", "description_ar": "…", "earned_at": null, "progress": { "current": 40, "target": 50 } } ]`
Progress: `points_total` → current total_points. `category_correct` → correct answers in that category. The other rules → `null`.

### `PATCH /api/profile`
Body (any of) `{ "display_name": "…", "language": "ar|en", "theme": "dark|light" }` → `200 { ok: true }`. A guest saves language and theme in `localStorage` only.

### `DELETE /api/account`
Body `{ "confirm": "DELETE" }` → uses `supabaseAdmin().auth.admin.deleteUser(user.id)`. Profile, sessions, answers, badges and scans cascade. Then sign out. `200 { ok: true }`.

---

## Scam detector (signed in)

### `GET /api/scan/remaining` → `{ "remaining": 4, "limit": 5, "resets_at": "2026-11-27T00:00:00+03:00" }`

### `POST /api/scan`
- Text: `application/json` `{ "type": "text", "text": "…" }`. 10 to 4000 characters.
- Image: `multipart/form-data` with `type=image` and `file` (png, jpg or webp, ≤ 5 MB).

Flow:
1. Auth required → `401 AUTH_REQUIRED` (UI shows the state "الكاشف يحتاج حساب").
2. `scans_left_today(uid, 5)`, and if it's 0 → `429 DAILY_LIMIT`.
3. Validate → `413 IMAGE_TOO_LARGE` (include `size_mb`) · `415 IMAGE_TYPE` · `400 TEXT_TOO_SHORT`.
4. Call Gemini as described in `AI_SCAN.md`. On timeout (20s) or invalid JSON after 1 retry → `502 SCAN_FAILED`, and **do not** insert a usage row, so the scan isn't counted.
5. Insert `scan_usage(user_id, input_type, result)`. **Never store the text or image.** Don't log it either.
`200`
```json
{ "risk": "high", "reason": "الرابط ما ينتمي لموقع البنك الرسمي، والرسالة تضغط عليك تحدّث بياناتك بسرعة.",
  "actions": "لا تضغط الرابط ولا ترد. احذف الرسالة. ولو دخلت بياناتك، كلّم بنكك على الرقم اللي ورا بطاقتك.",
  "remaining": 4 }
```

---

## Learn (public)
`GET /api/articles` → `[ { slug, title_ar, minutes, sort } ]` · `GET /api/articles/[slug]` → full article with `sections`.
These pages can also be statically generated from the `articles` table at build time.

## Home showcase (public)
`GET /api/showcase` → the 3 rows with `is_showcase = true` **including** their answer. They're examples, never used in rounds.

## Auth (Supabase client SDK, no custom routes)
- Sign up: `supabase.auth.signUp({ email, password, options: { data: { display_name } } })`. Password ≥ 8 characters.
- Sign in: `signInWithPassword`. Forgot password: `resetPasswordForEmail(email, { redirectTo: <site>/reset-password })`.
- After sign up or sign in: if `sessionStorage.pendingRound` exists → `POST /api/game/claim`.
- Map Supabase errors: invalid credentials → `errors.LOGIN_FAILED` · user already registered → `errors.EMAIL_TAKEN` · weak password → `errors.PASSWORD_SHORT`.
