# HANDOFF.md — احتيال؟ (Scam or Safe?)

Source of truth for building. Where this file and `PRD.md` disagree, **this file wins**.
Design canvas (screens, states, clickable prototype): https://claude.ai/artifact/NMdesquDLUrKi5D55EfNLH
Anything assumed rather than decided by the owner is marked **[?]**.

## 1. Persona and core task
- **محمد**, a government employee with basic tech skills. He's on his lunch break at work, iPhone in one hand, with 5 free minutes. He got the site's link from the family group chat. He also has a laptop.
- **Core task:** play one full challenge round and see how many messages he spotted correctly, and why he got the others wrong.
- Secondary: check a suspicious message (the detector), and read a short article (learn).

## 2. Owner decisions (numbered, keep them)
1. Build follows the full PRD (not a 4-day cut).
2. The game is the core of the platform.
3. Persona above. Feel: confident, calm, clear. Not scary, not "hacker".
4. Whole platform in scope.
5. Devices: phone **and** laptop. Every screen has both layouts.
6. Big numbers are written **without** a thousands separator (`٢٥٤٠`).
7. Risk levels are **3** (low, suspicious, high). "Not enough information" is a separate state, not a 4th level.
8. Visual direction: dark ink dominant, beige paper secondary (see DESIGN.md).
9. Dark theme by default, light theme available in Settings.
10. Answer buttons: احتيال in red with ✕, حقيقية in green with ✓.
11. Dot pattern on every screen, plus decorative stamps and bubbles on home.
12. "ابدأ التحدي" is the biggest action on home (72px), right under the example message on mobile.
13. Site name: **احتيال؟**
14. Laptop home shows 3 example messages.
15. Answer buttons look the same on phone and laptop.
16. Laptop states use the same content in the page column. Mobile sheets become centered dialogs.
17. Learn: all topics are the same size, nothing highlighted.
18. No mention of the challenge inside the learn section.
19. A round is **10 questions**, except **websites, which is 3**. Mixed = 10 from all categories.
20. The result screen has only two actions: **اختر تحدي آخر** and **ارجع للرئيسية**. No "play again".
21. On the difficulty screen the side label is "{n} نقاط / لكل سؤال".
22. The question bank has 162 game questions (`content/scenarios.json`), plus 3 home examples.
23. **Difficulty follows a fixed rubric** (§8 rule 14). Every category and level has a 50/50 split of scam and safe.
24. Website questions: the security label («آمن» / «غير آمن») sits on its own line, with the URL under it at full width. `https://` is hidden, `http://` is shown.
25. Learn "next topic" is a card ("الموضوع التالي" + title + arrow), not a long button. The article scrolls back to the top when it opens.
26. Login from the header is generic ("ادخل", no points message). The points message appears only on sign up from a game result.
28. **Arabic and English across the whole site, plus dark and light.** The choice is saved on the device (`localStorage` keys `sos.lang` and `sos.theme`) and in `profiles` for signed-in users, and it applies to every screen immediately. English switches the layout to `dir="ltr"`, flips directional arrows and uses Western digits. All content (162 questions, 8 articles, badges, every UI string) has English versions.
27. Guests get a **gear icon** (44px, outlined) next to "تسجيل الدخول" in the home header, on phone and laptop. It opens the guest settings: language and appearance only, saved in localStorage, plus a card asking them to log in. Signed-in users reach Settings from the gear inside "حسابي".

## 3. Screens (names match the canvas boards)
| ID | Screen | Phone board | Laptop board | Needs |
|---|---|---|---|---|
| H-1 | Home (guest) | `hifi/HiMain` | `hifi/LapMain` | showcase |
| H-2 | Home (signed in): header shows the avatar + "حسابي" | `states/HomeUser` | LapMain + avatar | auth |
| G-1 | Choose category | `hifi/Game` (screen 1) | `hifi/LapGame` | — |
| G-2 | Choose difficulty | Game (screen 2) | LapGame | — |
| G-3 | Question ×10 (×3 websites) | Game (screen 3) | LapGame | `/api/game/start` |
| G-4 | Exit confirm (sheet or dialog) | Game, `states/QExit` | `hifi/LapQExit` | — |
| G-5 | Result + review mistakes | Game (screen 4), `hifi/HiResult` | `hifi/LapResult` | `/api/game/submit` |
| S-1 | Detector input (text or image) | `hifi/HiScan` | `hifi/LapScan` | auth, `/api/scan/remaining` |
| S-2 | Detector result | `hifi/HiScanResult` | `hifi/LapScanResult` | `/api/scan` |
| L-1 | Learn list (8 topics, equal size) | `hifi/LearnApp` | `hifi/LapLearnApp` | `/api/articles` |
| L-2 | Article | LearnApp (article) | LapLearnApp | `/api/articles/[slug]` |
| A-1 | Login | `hifi/HiLogin` | `hifi/LapLogin` | Supabase Auth |
| A-2 | Sign up | `hifi/HiSignup` | `hifi/LapSignup` | Supabase Auth + claim |
| A-3 | Forgot password / link sent | `states/Forgot`, `states/ForgotSent` | same, centered | Supabase Auth |
| A-4 | Reset password (from email link) **[?] not drawn**: reuse the A-3 form with 2 password fields | — | — | Supabase Auth |
| P-1 | Profile: points, stats, per-category bars, badges, history | `hifi/HiProfile` | `hifi/LapProfile` | `/api/profile`, `/api/badges`, `/api/profile/history` |
| P-0 | Guest settings (language + appearance only) | `states/GuestSettings` | `states/LapGuestSettings` | localStorage |
| P-2 | Settings | `hifi/HiSettings` | `hifi/LapSettings` | `PATCH /api/profile`, `DELETE /api/account` |

## 4. Happy path (13 taps on phone)
Home → **ابدأ التحدي** → SMS is preselected → **التالي: اختر الصعوبة** → سهل is preselected → **ابدأ ١٠ أسئلة** → 10 answers (each tap prints the stamp, then the next message after 720ms) → Result.
From Result: **اختر تحدي آخر** (back to G-1, keeping the last choices) or **ارجع للرئيسية**.
Guest on Result: "أنشئ حساب واحفظ ٧٠ نقطة" → A-2 → sign-up → `POST /api/game/claim` → Result shows the "saved" line → Home (signed in).

## 5. Unhappy paths
| Situation | What happens |
|---|---|
| Interrupted mid-round, taps خروج | G-4: "تطلع من الجولة؟". كمّل الجولة keeps the state. اطلع → home, and the session is abandoned (not graded). |
| Closes the tab mid-round | Answers are in `sessionStorage`. On return within 1 day, offer to resume **[?]** (or start over). Sessions are marked abandoned after 1 day. |
| Network drops during the round | Keep answering. Answers are kept locally and sent in one call at the end. If submit fails → banner `errors.NETWORK` + button `NETWORK_CTA`, and retry with the same answers. |
| Submit sent twice | 409 `SESSION_ALREADY_SUBMITTED`. Show the result if we have it, otherwise the error and "ابدأ تحدي جديد". |
| Guest finishes and leaves without an account | Points are lost (they were warned on Result). |
| Guest signs up more than 24h later | 409 `CLAIM_NOT_ALLOWED`. Show the message, keep the new account. |
| Detector as a guest | S-1 shows the "الكاشف يحتاج حساب" state. |
| Detector, 6th scan today | "استخدمت تحليلاتك الـ ٥ لليوم". Resets at 00:00 Asia/Riyadh. |
| Detector AI fails or times out | `SCAN_FAILED`, not counted, nothing stored. |
| Image too big or wrong type | Inline error card with the size, plus the hint. |
| Text too short or unreadable image | Result state "المعلومات ما تكفي نحكم" (no meter). |
| Wrong login | Error under the password field `errors.LOGIN_FAILED`, with a link to "نسيت كلمة المرور؟". |
| Email already used at sign-up | Error under the email field + primary "سجّل دخول بهذا البريد". |
| Delete account | Sheet with real numbers ("بتنحذف ٢٥٤٠ نقطة و٦ شارات وسجل ٢٣ جولة") → delete → signed out → home. |
| New account, profile has no rounds | P-1 empty state + "العب أول جولة · ٣ دقايق". |

## 6. Data (nouns) → tables in `0001_init.sql`
User account (`auth.users`) · Profile (`profiles`: display_name, language, theme, total_points) · Scenario / question (`scenarios`) · Round (`game_sessions`) · Answer (`game_answers`) · Badge (`badges`) · Earned badge (`user_badges`) · Scan log (`scan_usage`, **no content**) · Article (`articles`) · Stats (views `user_stats`, `user_category_stats`).

## 7. Actions (verbs)
Start round · Answer a question (local) · Leave round · Submit round · Claim a guest round · Sign up · Log in · Log out · Reset password · Scan text · Scan image · Read article · Change language · Change theme · Edit name · Delete account.

## 8. Rules (from every state)
1. A round has 10 questions (websites: 3). Questions are random, with no repeats within a round. Showcase messages never appear in rounds.
2. Points per correct answer: easy 10, medium 20, hard 30. **No minus points.** Points = correct × points per correct answer.
3. No correction during the round. The stamp shows the player's choice only. Corrections appear in "راجع أخطاءك" on Result (wrong answers only, with explanations).
4. Grading happens only on the server, once per round. Correct answers never reach the browser before submit.
5. Guests can play, but nothing is saved unless they sign up or log in within 24h and claim (once).
6. Overall percent = total correct ÷ total answered. Mixed rounds count under each question's own category.
7. Badges (13, `content/badges.json`) are checked after every saved round and after a claim. Each is earned once.
8. The detector needs an account. Limit **5 successful scans a day** per user, reset at 00:00 Asia/Riyadh. Failed scans aren't counted.
9. The detector never stores or logs the message text or image.
10. Links in messages and results are plain text, never clickable, never auto-opened.
11. Risk is one of 3 levels, or "insufficient", which gets its own screen without a meter. No probability numbers.
12. Language and theme: guests keep them in localStorage. Signed-in users keep them in `profiles`.
13. Deleting an account deletes everything (cascade) and can't be undone.
14. **Difficulty rubric.** Use it for every new question.
    - **سهل**: scams show 3 or more obvious signs (unknown or international number, a strange link, a prize you never entered, asks for a PIN, password or fees, threats). Safe messages are plain notifications with no link and no request.
    - **متوسط**: scams show only 1 or 2 signs and use realistic topics (parcels, fines, customs, a "new number" from family). Safe messages involve money, banks or deliveries, so they feel risky.
    - **صعب**: scams use a **trusted-looking sender** (a spoofed bank or company name, a hacked contact, an unverified account named like a real one), look-alike domains (`bankk`, `cornpany`, `bank.com.sa-secure.help`) or one subtle request. Safe messages look scary (OTP codes, transfers, "if this wasn't you…", "reply 0") but send you to channels you already know.

## 9. State texts
Every Arabic UI string, including all empty, loading, error, success and limit states, is in `content/ui-strings.ar.json`. Use the keys; don't retype the texts.
Article content is in `content/articles.json` (8 articles). Game content is in `content/scenarios.json`. Both are loaded by `supabase/seed.sql`.

## 10. Open questions for the owner / backend
1. ~~English copy~~ Done: `content/ui-strings.en.json`, the `*_en` fields in `content/scenarios.json` and `content/articles.json`, and migration `0002_english.sql`. **[?]** A native English reviewer should check the wording before launch.
2. **[?] Resume a round** after closing the tab: resume or start over?
3. **[?] Reporting channels** in the article "وين تبلّغ في السعودية": 330330 for SMS, «كلنا أمن», the bank's number, «ساما تهتم». Re-check them against sama.gov.sa and moi.gov.sa right before launch.
4. **[?] Privacy page:** the wording about Gemini processing, and PDPL (the Saudi data protection law) compliance before public launch.
5. **[?] Content review:** a second person should review the 162 scenarios (is each answer and explanation correct?) before launch. Add more scenarios over time so rounds don't repeat. Today each category and level has 12 (websites 6).
6. **[?] Leaderboard:** optional in the PRD, not designed, out of scope for now.
7. **[?] The daily scan limit** is 5. Change it in one place: `scans_left_today(..., p_limit)` + `SCAN_DAILY_LIMIT` in env.
8. **[?] Email confirmation:** should Supabase require email confirmation before the first login? If yes, the guest claim happens after the user confirms and logs in. The token stays valid for 24h.
9. **[?] Rate-limit guests** on `/api/game/start` (e.g. 30 rounds an hour per IP) to stop scraping the question bank.
