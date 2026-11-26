# DESIGN.md — احتيال؟

Direction: **"B inverted": ink and paper.** A dark ink desk, a paper slip that carries the message, and one stamp.
Feel: confident, calm, clear. Not scary, not "hacker".
Boldness is spent in one place per screen (the SEE FIRST item). Everything else stays calm.

## 1. Color tokens

### Dark (default)
| Token | Hex | Allowed use |
|---|---|---|
| `ink` | `#18212E` | Page background. Text on `paper`. |
| `surface` | `#222D3C` | Cards, list items, sheets, inputs. |
| `line` | `#3A4555` | Borders, dividers, progress track, disabled button fill. |
| `paper` | `#F6F3EC` | Primary text. Primary button fill. Message slip. Selected border. |
| `dust` | `#B4AD9F` | Secondary text only (7.2:1 on ink). |
| `disabled-text` | `#CFC8BA` | Text on a disabled button (6:1 on line). |
| `stamp` | `#B83227` | "احتيال" stamp **on paper only**. |
| `stamp-safe` | `#1F7A4D` | "حقيقية" stamp **on paper only**. |
| `alert` | `#F26B5B` | "احتيال" answer button, high risk, errors, destructive actions. On ink/surface only. |
| `safe` | `#4CB882` | "حقيقية" answer button, low risk, success. On ink/surface only. |
| `warn` | `#E0B030` | Suspicious risk, offline banner, privacy tip icon. |
| `dot` | `#263142` | Background dot pattern. |
| `deco` | `#2E3B4F` | Decorative strokes on the home page only. |
| `scrim` | `rgba(10,14,20,.72)` | Behind sheets and dialogs. |
| `slip-meta` | `#5B6472` | Secondary text inside the paper slip. |

### Light (Settings › المظهر › فاتح)
`ink → #F6F3EC`, `surface → #FFFFFF`, `line → #D8D2C4`, `paper → #18212E` (text and primary button), `dust → #5B6472`.
Message slip in light: `#FFFFFF` with a 1px `#D8D2C4` border. `stamp`, `stamp-safe` and `warn` stay the same.
`alert` becomes `#B83227` and `safe` becomes `#1F7A4D` on light backgrounds, for contrast.

### Answer button tints
- احتيال: background `rgba(242,107,91,.08)`, 2px border `alert`, text `alert`. When pressed: fill `alert`, text `ink`.
- حقيقية: background `rgba(76,184,130,.08)`, 2px border `safe`, text `safe`. When pressed: fill `safe`, text `ink`.
- Always with an icon: ✕ for احتيال and ✓ for حقيقية (Lucide `X`, `Check`). Never color alone.

## 2. Typography (4 sizes only)
| Role | Font | Weight | Size / line height |
|---|---|---|---|
| display | Almarai | 800 | 48 / 60 |
| title | Almarai | 800 | 22 / 31 |
| body | Noto Sans Arabic | 400, 700 | 16 / 27 |
| caption | Noto Sans Arabic | 400, 600 | 13 / 20 |

- Message text in the game slip and the scan input: `title` size (22) at weight 400. Laptop scan input is 22, mobile scan input is 16.
- Buttons: Almarai 800, 16. The home "ابدأ التحدي" button is Almarai 800, 22.
- No letter-spacing on Arabic. Links and codes inside slips: `ui-monospace`, 16.
- Google Fonts: `Almarai:wght@400;700;800`, `Noto+Sans+Arabic:wght@400;600;700`.

## 3. Spacing, radius, shadow
- 8px grid. Steps: 4 (inside tight groups only), 8, 16, 24, 32, 48, 64.
- Phone side padding 16. Laptop container `max-width: 1120px`, padding 24. Reading column 720. Forms 560 (card padding 48).
- Radius: **8** for everything. **4** for link chips, segmented options and the progress bar. Circles only for stamps, score ring and avatars.
- Shadows: none. Layers separate by color (ink → surface → paper).
- Touch targets ≥ 44px. Primary button 56. Answer buttons 64. Home "ابدأ التحدي" 72. Secondary button 48. Input 52.

## 4. Background
- Every screen: `background-color: ink; background-image: radial-gradient(#263142 1.2px, transparent 1.2px); background-size: 24px 24px`.
- Home only (mobile and laptop): decorative line drawings behind the content, `stroke: #2E3B4F; stroke-width: 1.5`. Two stamp rings (one solid, one dashed `3 6`), two chat bubbles and one dotted wave. They're `aria-hidden` and `pointer-events: none`. Content sits above them.

## 5. Components (with states)
| Component | Spec | States |
|---|---|---|
| Primary button | fill `paper`, text `ink`, h56, r8, Almarai 800/16 | pressed: fill `#DCD6C8` + scale .98 · loading: spinner (18px, rotating) + verb in progress ("نجهز الأسئلة…", "نحلل الرسالة…") · disabled: fill `line`, text `disabled-text` |
| Hero CTA (home only) | Primary at h72, Almarai 22, trailing arrow pointing left | same as primary |
| Secondary button | transparent, 1px `line`, text `paper`, h48, Noto 600/16 | pressed: background `surface` |
| Destructive button | transparent, 1px `alert`, text `alert`, h48 · confirm in a sheet: fill `alert`, text `ink`, h56 | — |
| Answer button pair | 2 equal columns, gap 16, h64 (see §1) | default · pressed (fill) · disabled while loading (border `line`, text `dust`) |
| Input | fill `surface`, 1px `line`, r8, h52, padding 0 16, body 16 · label caption 600 above, gap 8 | focus: 2px `paper` · error: 2px `alert` + caption in `alert` under it, `role="alert"` |
| Message slip | fill `paper`, text `ink`, r8, padding 24/16 mobile, 32 laptop, gap 16. Header: sender (body 700) + meta (caption `slip-meta`). Email adds "من:" + subject (Almarai 800/16). Websites add a URL bar: white, 1px `#D8D2C4`, r8, padding 12, `dir="ltr"`, **two rows**. Row 1 is the security chip (lock icon + «آمن» in `stamp-safe`, or an open lock + «غير آمن» in `stamp`, 1px border in the same color, r4, caption 600, `white-space: nowrap`). Row 2 is the URL at full width, mono 14 / 24, `overflow-wrap: anywhere`, with `https://` removed and `http://` kept. Link chip: mono 16, 1px dashed `slip-meta`, r4, aligned to the end. | stamp state (see Motion) |
| Card | fill `surface`, r8, padding 16 (24 laptop) | — |
| List item | card, min-h 64, title body 700 + caption `dust`, chevron pointing left (forward) | pressed: `line` |
| Radio option | list item + 20px ring. Selected: 2px `paper` border, filled dot. Unselected: transparent border, `dust` ring | — |
| Segmented control | track `surface` padding 4 r8 · option h44 r4 · selected: fill `paper` text `ink` 700 | — |
| Next card (learn) | surface, 1px `line`, r8, min-h 72, padding 16: caption «الموضوع التالي» in `dust` + title body 700 + an arrow pointing left. Full width on phone, 720 column on laptop. | pressed: `line` |
| Badge chip | earned: fill `paper` text `ink` · in progress: 1px dashed `dust`, text `dust`, with "٤٠ من ٥٠" | — |
| Risk meter | 3 equal segments h8 r4, gap 4: منخفضة · مشبوهة · مرتفعة. Active segment and label in the risk color + icon. **"المعلومات ما تكفي" is not a fourth segment**: it's a sentence in `dust` that replaces the meter. | — |
| Progress bar | track `line` h8 r4, fill `paper`, fills from the **right**, width transition 300ms ease | — |
| Score ring | 152px (184 laptop) circle, 3px border `paper` (`safe` when perfect), rotated −8°, number display 48 + "من ١٠" caption | — |
| Sheet (mobile) | bottom, fill `surface`, radius 8 8 0 0, padding 24 16 32, grabber 40×4 `line`, over `scrim` | — |
| Dialog (laptop) | the same content centered, width 480, padding 32, r8 | — |

**Hover:** never hard-code white for hover. A hovered link or list item keeps the `paper` token (dark text in light theme), and only its background changes to `line`. Check every hover in both themes.

## 6. Motion (one idea)
**The stamp.** When the player taps احتيال or حقيقية, a stamp of their choice prints on the paper slip:
`@keyframes stamp { 0% {transform: scale(1.6) rotate(-4deg); opacity: 0} 60% {transform: scale(.94) rotate(-12deg); opacity: 1} 100% {transform: scale(1) rotate(-12deg)} }`, 420ms `cubic-bezier(.2,.8,.2,1)`.
After 720ms the next message appears. On the last message it goes to the result screen.
Stamp: 96px circle, 3px border, text Almarai 800/16, color `stamp` or `stamp-safe`, background `rgba(246,243,236,.92)`, positioned `left:16px; bottom:-28px` on the slip.
The stamp shows **what the player chose**, never whether it was correct.
Respect `prefers-reduced-motion`: skip the scale and rotate, and just show the stamp.

## 7. Layout
- Phone (< 768px): 390 reference width, single column, primary action at the bottom of the screen, except home, where "ابدأ التحدي" sits right under the example slip.
- Laptop (≥ 1024px): header with the brand "احتيال؟" (Almarai 22) + nav (التحدي · كاشف الاحتيال · تعرّف على الاحتيال) + "تسجيل الدخول" or the avatar with "حسابي". Content-heavy pages use 2 columns (`flex-wrap`, 48 gap). Forms sit in a centered 560 card.
- Home on laptop: headline + CTA on the start side, **3 example slips** on the end side (fraud, real, fraud) with their stamps, body 16, the text padded 88px on the stamp side so the stamp never covers words.

## 8. Arabic and RTL rules
- `dir="rtl"` on `<html>`. Use logical CSS (`margin-inline-start`, `padding-inline`, `text-align: start`).
- Back arrows point **right**. Forward chevrons point **left**. The progress bar fills from the right.
- Icons sit on the start side (right) of their label. A trailing arrow on the CTA points left.
- Don't mirror: clock times, phone numbers, emails, URLs, OTP codes, media controls, logos.
- Wrap any LTR run inside Arabic text in `<bdi dir="ltr">` (phone numbers, "+٧٠" points, URLs).
- Digits: Arabic-Indic in the UI (`١٢٣`). Decimal separator `٫`, percent `٪`. **No thousands separator** (write `٢٥٤٠`, `٥٠٠٠`).
- Avoid "٤٢/٥٠". Write "٤٢ من ٥٠".
- Quotes: «…».
