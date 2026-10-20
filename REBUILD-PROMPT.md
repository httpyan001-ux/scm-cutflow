# 🔱 SCM CUTFLOW — MASTER REBUILD PROMPT
### (အခြား Coding AI တစ်ခုကို အစအဆုံး ပြန်ရေးခိုင်းဖို့ အသုံးပြုရန်)

> **အသုံးပြုနည်း:** အောက်က `=== PROMPT START ===` နဲ့ `=== PROMPT END ===` ကြားက စာအားလုံးကို
> copy ကူးပြီး Claude / GPT / Cursor / Gemini စတဲ့ coding AI ထဲ paste လုပ်ပါ။
> အပိုင်း ၁၄ ပိုင်း ပါဝင်ပြီး UI ကို မူရင်းထက် **ပိုမိုမိုက်အောင်** အဆင့်မြှင့်ထားသည်။

---

=== PROMPT START ===

# ROLE

You are an **elite full-stack engineer + award-winning product designer** building a complete,
production-grade web application from scratch. You write clean, type-safe, fully working code —
never placeholders, never `// TODO`, never truncated files. Every file you output must compile
and run. Treat this document as the complete, authoritative specification.

Build the entire project, then verify it builds and runs before declaring completion.

---

# 0. PROJECT IDENTITY

**Name:** SCM CUTFLOW
**Tagline:** AETHER-FORGE — Cyber-Forge AI Video Workstation
**Audience:** Myanmar (Burmese) content creators on **mobile phones** (primary) and desktop (secondary).
**Core idea:** A single dashboard ("the Forge") containing **10 distinct AI video tools** called
**Factions**. 5 are unlimited for PRO members, 5 are pay-per-use with credits. Users sign up with
Gmail + OTP, buy PRO or credits, run tools, watch a cinematic processing animation, then export
the finished video package.

**Language rule (critical):** The UI is **bilingual Burmese-first**. Every user-facing label has
Burmese text. Technical/branding words stay in English (RECAP, GPU TURBO, PRO, CREDIT).
Burmese text must **never** be clipped — enforce `line-height: 1.78` and
`font-family: "Noto Sans Myanmar", "Pyidaungsu"` on a dedicated `.my` utility class.

---

# 1. TECH STACK (mandatory)

| Layer | Technology |
|---|---|
| Framework | **Next.js 16 (App Router)**, React 19, TypeScript strict |
| Styling | **Tailwind CSS v4** (`@import "tailwindcss"`) + a custom design-token CSS layer |
| Database | **PostgreSQL** via **Drizzle ORM** (`drizzle-orm/node-postgres`) |
| Auth | **Custom** — scrypt password hashing (`node:crypto`), DB-backed sessions, HttpOnly cookies. **No NextAuth, no Clerk, no Supabase auth.** |
| Email | **nodemailer** (SMTP) for real OTP delivery |
| Animation | **Pure CSS keyframes + Canvas 2D only.** No Framer Motion, no GSAP, no Three.js, no WebGL. Must be battery-safe on phones. |
| Icons | **Unicode glyphs + emoji only** (◈ ⬢ ⚡ ◆ ≋ ☰ ▶ ✦ ⟡ ⬣ ◉). No icon libraries. |
| State | React hooks only. No Redux/Zustand. |

**Hard constraints**
- Zero `any` leaks in public APIs; `tsc --noEmit` must pass with **0 errors**.
- `npm run build` must succeed.
- Must work **with no third-party API key at all** (offline fallback engine), and automatically
  upgrade to cloud AI when a key exists.
- Mobile-first: **no horizontal overflow at 360 px width, ever.**

---

# 2. DESIGN SYSTEM — "AETHER-FORGE v4"

## 2.1 Visual language
A fusion of: **Cyberpunk 2077** neon-industrial HUDs · **Dune** monumental scale ·
**Nothing OS** dot-matrix precision · **Apple Vision Pro** spatial glass depth.
Dark, cinematic, high-contrast, neon-on-black. Every surface feels like a machined panel
in a futuristic workshop.

## 2.2 Tokens
```
--forge-bg: #04050c          /* near-black base */
--user-ac / --user-bc        /* user-chosen theme colors, live-swappable */
safe areas: env(safe-area-inset-top/bottom/left/right)
```

**Typography (3 families, exact roles)**
- `Unbounded` (700/900) → `.display` — headings, numbers, hero type
- `JetBrains Mono` → `.mono` — labels, HUD readouts, telemetry, IDs
- `Noto Sans Myanmar` → `.my` — all Burmese text, `line-height: 1.78`

## 2.3 Required CSS utility classes (implement all)
```
.forge-glass      glassmorphism panel (blur 18px, saturate 1.4, inner top highlight + bottom shadow)
.forge-panel      solid machined panel with inset top light
.dotgrid          Nothing-OS dot matrix overlay
.holo-lines       horizontal hologram scanlines
.noise-veil       SVG fractal-noise film grain (overlay blend)
.flow-border      animated conic-gradient neon border using @property --ang (4.5s spin)
.clip-shard       angled-corner clip-path (cut top-right + bottom-left)
.clip-tag         parallelogram price tag
.clip-hex         hexagon
.cyber-frame + .cyber-corner (.cc-tl/.cc-tr/.cc-bl/.cc-br)  glowing L-brackets
.scan-beam        vertical laser sweep (translateY, GPU only)
.tick-ring        repeating-conic-gradient radar tick ring with radial mask
.floor-grid       perspective(420px) rotateX(62deg) scrolling grid floor
.shimmer-text     background-clip:text moving gradient
.chromatic        RGB-split text shadow
.text-stroke      -webkit-text-stroke outline type
.btn-bevel        3D bevel (inset top light + inset bottom shade + colored glow)
.forge-switch     custom iOS-style toggle with gradient-on state
.credit-slider / .dur-slider   custom range inputs with neon thumbs
.faction-lift     hover translateY(-3px) + brightness (disabled on touch via @media (hover:none))
.hazard / .hazard-faint   diagonal caution stripes
```

**Animations (CSS keyframes, all GPU-safe transform/opacity only):**
`angSpin, scanY, irisPulse, spinSlow, eqBar, tickerX, riseIn, shimmer, sheetUp, blinkDot,
corePulse, shockRing, floatY, plasmaDrift, gridScroll, glitchA, chargeBar, logIn, orbOrbit,
dashSpin, auroraA/B, gpuGlow, reelSpin, radarSweep, filmPan, barsRise, tierGlow, beamSweepX,
badgePulse, skeletonSheen, slideInRight, faqOpen`

**Accessibility & performance**
- `@media (prefers-reduced-motion: reduce)` → kill all animations.
- Canvas particle systems pause via `IntersectionObserver` + `document.hidden`.
- `:focus-visible` outline in the user's accent color on every interactive element.

## 2.4 🚀 UI UPGRADES — go BEYOND the original (required)
Implement **all** of these to make it more impressive than a normal dashboard:

1. **Scroll progress beam** — 2 px gradient bar pinned at viewport top, `scaleX` driven by scroll.
2. **Aurora backdrop** — two slow-drifting blurred color blobs behind every hero section.
3. **Live ember canvas** — floating glowing particles in faction colors; density scales with context
   (more particles when a job completes). Pauses off-screen.
4. **Asymmetric editorial deck** — the 10 tool cards are NOT a uniform grid. Cards 1 and 6 span
   full width; the rest are 2-col on tablet+. Each card is a **bespoke layout** (see §4).
5. **Magnetic depth on cards** — `.faction-lift` micro-elevation with colored glow on hover,
   scale-down on tap.
6. **Command palette (⌘K / long-press)** — fuzzy-search all 10 tools + Guide sections + profile
   actions, keyboard navigable.
7. **Skeleton shimmer** loaders instead of spinners for lists.
8. **Toast system** — glass pill toasts above the bottom nav, auto-dismiss, stacked.
9. **Empty states with personality** — every empty list shows a glyph, a Burmese line, and a CTA.
10. **Animated number counters** — credits/stats count up when they change.
11. **Page transition veil** — a quick ink-wipe when navigating between dashboard and a faction.
12. **Haptic-style feedback** — `active:scale-[0.97]` + optional `navigator.vibrate(8)` on primary taps.
13. **Theme engine** — user accent colors propagate via CSS variables to header, cards, reactors,
    buttons, sliders, focus rings — instantly, without reload.
14. **Dynamic OG/meta** — per-faction metadata and theme-color.

---

# 3. DATABASE SCHEMA (Drizzle, exact)

```ts
// scm_users
id uuid pk default random
email text unique notNull            // normalized gmail (dots & +suffix stripped)
username text unique
passwordHash text notNull default ''  // scrypt$N$r$p$salt$hex
emailVerified boolean notNull default false
displayName text notNull default 'Forge Operator'
avatar text notNull default '⬢'       // emoji/glyph avatar
photoUrl text notNull default ''      // uploaded data-URL image
background text notNull default 'nebula'   // preset id
backgroundUrl text notNull default ''      // uploaded data-URL image
themePrimary text notNull default '#00e5ff'
themeSecondary text notNull default '#ff2e4c'
aiApiKey text notNull default ''      // BYOK, never returned to client
aiProvider text notNull default 'auto'  // auto | openai | offline
isPro boolean notNull default false
proStartedAt / proExpiresAt timestamptz
proPlan text notNull default '30-day'
proByok boolean notNull default false
credits integer notNull default 60    // welcome bonus
failedLogins integer notNull default 0
lockedUntil timestamptz
lastLoginAt timestamptz
createdAt / updatedAt timestamptz notNull defaultNow

// scm_sessions
id uuid pk · userId fk cascade · tokenHash text unique (sha256 of raw token)
userAgent text · ip text · expiresAt timestamptz · createdAt
index on userId

// scm_otp_codes
id uuid pk · email text · codeHash text (sha256) · purpose text default 'register'
attempts integer default 0 · consumed boolean default false
expiresAt timestamptz · createdAt · index on email

// scm_tasks
id uuid pk · userId fk cascade · faction text · status text default 'queued'
progress integer default 4 · cost integer default 0
inputPayload jsonb notNull default {} · resultPayload jsonb default {}
error text · createdAt / updatedAt
indexes: userId, faction, createdAt

// scm_credit_orders
id · userId fk · amount int · priceMmk int · method text · status text · createdAt

// scm_pro_orders
id · userId fk · plan text · mode text ('standard'|'byok') · priceMmk int · method text · status · createdAt
```

---

# 4. THE 10 FACTION TOOLS

Each faction is defined in one registry file (`src/lib/factions.ts`) with:
`slug, code, name, myName (Burmese), tagline, myTagline, group ('pro'|'forge'), cost,
route, durationSec, primary, secondary, tertiary, glow, ink, glyph, hudKind, inputKind,
description, myDescription, microHudLabel, accepts, extraFields[]`.

## 4.1 GROUP A — PRO ZONE (unlimited for PRO members, 0 CR)

| # | Tool | Burmese | Colors | Glyph | Function |
|---|---|---|---|---|---|
| 01 | **RECAP** | ရီကက် အနှစ်ချုပ် | `#FF2E4C` / `#FF7A18` | ◈ | Long video → chapters + key beats + highlight rail |
| 02 | **REEL** | ရီးလ် ဗိုင်းရယ်ဖြတ် | `#E8FF00` / `#FF00E5` | ▮ | Auto-reframe to 9:16, virality scoring, 3 viral cuts |
| 03 | **MM VOICE** | မြန်မာအသံ | `#00FF9D` / `#00B8FF` | ≋ | Burmese voice clone + TTS + dubbing |
| 04 | **SUBS** | စာတန်းထိုး | `#00E5FF` / `#7C3AED` | ☰ | Polyglot subtitles with correct Burmese shaping |
| 05 | **UPSCALE** | ရုပ်ထွက်မြှင့် | `#B794FF` / `#7DF9FF` | ⬢ | 2X/4X neural super-resolution, denoise, relight |

## 4.2 GROUP B — CREDIT FORGE (deduct credits per run)

| # | Tool | Burmese | Cost | Colors | Glyph | Function |
|---|---|---|---|---|---|---|
| 06 | **NEWS** | သတင်းဗီဒီယို | 15 CR | `#FF8A00` / `#FF2E4C` | ◉ | Headline → anchor + b-roll + ticker broadcast cut |
| 07 | **URL RECAP** | လင့်ခ်အနှစ်ချုပ် | 10 CR | `#38FFC8` / `#0EA5E9` | ⬣ | Article URL → 60-second narrated digest |
| 08 | **YT PRO** | ယူကျု့အဆင့်မြှင့် | **tiered 12–40 CR** | `#FF3B30` / `#FFD60A` | ▶ | YouTube link **or phone upload** → chapters + hooks + 4K |
| 09 | **DOC TRANSLATE** | စာရွက်ဘာသာပြန် | 8 CR | `#A855F7` / `#EC4899` | ✦ | PDF/DOCX → translated Burmese slide video |
| 10 | **KNOWLEDGE** | အသိပညာထုတ်နုတ် | 5 CR | `#7CFC00` / `#00E5FF` | ⟡ | **Web discovery → pick 5 → narrated fact video** |

## 4.3 Bespoke card designs (NOT a shared template — this is mandatory)
Each of the 10 dashboard cards must have a **structurally different layout**:
1. **RECAP** — `clip-shard` diagonal card, 4 staggered skewed timeline blades, left plasma edge, giant ghost glyph.
2. **REEL** — volt ticker tape across the top, a row of 3 phone frames (middle one lit), virality chip.
3. **MM VOICE** — shockwave orb + ember canvas + 34-bar live EQ field.
4. **SUBS** — left language rail (MM / EN / 双) + stacked Burmese + English caption preview.
5. **UPSCALE** — pixel-mosaic background + circular 4X magnifier lens badge.
6. **NEWS** — diagonal hazard "BREAKING" ribbon + blinking LIVE pill + crawling ticker.
7. **URL RECAP** — spinning conic portal ring + link chip + 62s progress.
8. **YT PRO** — `clip-slant` card with a solid red YouTube play block on the left.
9. **DOC TRANSLATE** — 3 stacked rotated paper sheets + floating ✦ sparkle.
10. **KNOWLEDGE** — inline SVG neural constellation (nodes + edges) + diamond progress pips.

## 4.4 Per-faction Micro-HUD
Each faction has a unique telemetry widget (`hudKind`): `timeline` (channel bars),
`vertical` (9:16 virality meter), `waveform` (animated EQ + dB), `captions` (Burmese cue preview),
`pixels` (filling pixel lattice + PSNR), `ticker` (crawling broadcast strip), `digest`
(claims/quotes counters), `extractor` (red progress rail), `slides` (3 slide chips), `graph`
(diamond pips).

---

# 5. SHARED TOOL CONTROLS

## 5.1 Hex Ingestion Chamber (file upload)
**Never a plain dashed box.** Build:
- Angled cyber-bracket corners glowing in the faction color
- Rotating dashed outer ring + counter-rotating inner arc + `tick-ring`
- Hexagon (`clip-hex`) aperture core with pulsing faction glyph
- Animated vertical `scan-beam` laser
- Drifting plasma blobs behind
- Single-tap native file picker **and** drag-and-drop
- Mobile height **150–196 px**
- After ingest: **16:9 viewport preview** with HUD tags (duration ◷, resolution, `16:9 VIEWPORT`),
  a glowing **✕ PURGE** control, filename row, and a live ingest % bar.

## 5.2 Duration Slider (RECAP + YT PRO only)
Custom neon timeline scrubber (not a default range input):
- Huge readout in **both** formats: `2m 30s` + `၂ မိနစ် ၃၀ စက္ကန့်`
- Custom rail with 24 tick marks + gradient fill + glow + neon square thumb
- Quick-select chips (min / 25% / 50% / max)
- **RECAP:** 30 s → **600 s (10 min) max**, step 15 s, default 120 s
- **YT PRO:** 60 s → **1800 s (30 min) max**, step 30 s, default 300 s
- **Server must clamp** the value — never trust the client.

## 5.3 Aspect Ratio Picker (all video factions)
5 options with **live shape previews** (a real box drawn at the correct ratio):
`9:16` (Reels/TikTok) · `16:9` (YouTube) · `1:1` (Feed) · `3:4` (Portrait) · `4:3` (Classic).
Selected chip glows in the faction accent. Burmese sub-label for each.

## 5.4 Render Lane — two ignite buttons (every faction)
```
[ ⬢ IGNITE / GENERATE ]      [ ⚡ GPU TURBO ]
  PRO ∞ free, or base CR       2.4× faster, +4–8 CR
```
- GPU costs: `recap 6 · reel 6 · mm-voice 6 · subs 5 · upscale 8 · news 8 · url-recap 6 ·
  yt-pro 7 · doc-translate 5 · knowledge 4`
- GPU multiplies render time by **0.42**.
- **PRO users still pay GPU credits.**
- If the vault can't cover it, the GPU button becomes **⚡ BUY CR** and opens the credit slider.
- A small invoice bar above shows: source · length · aspect · tier · `VAULT ⚡ N CR`.

---

# 6. FLAGSHIP STUDIOS (3 factions get custom full-page studios)

## 6.1 RECAP STUDIO — zero-key speech engine
Three source tabs: **⬢ FILE / ◉ MIC LIVE / ☰ TEXT**.
- **MIC LIVE:** Web Speech API (`lang="my-MM"`, continuous, interim results) with auto-restart on
  end, live level meter from `AudioContext` analyser, recording timer, shockwave record button.
- **FILE:** on play, optionally auto-capture audio through the mic for transcription (no key needed).
- **TEXT:** paste/type directly; a SAMPLE button fills Burmese demo text.
- **SUMMARY IGNITE** → instant local summary appears first, then silently upgrades to cloud if a key
  exists. Badge shows `☁ CLOUD` or `⬢ OFFLINE`.
- Offline summarizer: Burmese `။`-aware sentence splitter + word-frequency + position-bias scoring
  → bullets, chapters, keywords, reading stats.
- Then Duration slider + Aspect picker + style chips + Render Lane + Export bar.

## 6.2 YT PRO STUDIO — premium credit flagship
This must **look and feel more expensive** than every other tool.
- **Source pill tabs:** `▶ YOUTUBE LINK` / `⬆ ဖုန်းမှ UPLOAD` (both must work).
  - Link mode: paste URL → extract video id → show **real YouTube thumbnail**
    (`img.youtube.com/vi/{id}/hqdefault.jpg`) + validation warning for bad formats.
  - Upload mode: **YouTube-Studio-style upload box** — white play-button-shaped ⬆ mark,
    shockwave ring, film-strip trim, red radial glow, `SELECT VIDEO` button opening the phone
    gallery (`accept="video/*"`), drag-drop. After upload: 16:9 player + `⬆ UPLOADED` badge +
    duration chip + filename + MB + upload % bar + ✕ REMOVE.
- **Tiered pricing driven by the duration slider:**
  `≤5m = 12 CR · ≤10m = 18 CR · ≤20m = 28 CR · ≤30m = 40 CR` — tier rail shows all four,
  the active one glows (`tier-glow`). Server recomputes the price; never trust the client.
- **Cinema processing reactor** (unique to YT PRO): radar sweep SVG + rotating film-reel ring with
  8 sprocket holes + progress ring + 6-stage rail
  (`🔗 LINK LOCK → ⬇ STREAM PULL → 📈 RETENTION SCAN → ⛏ HOOK MINING → ✦ 4K RELIGHT → ◆ MASTER MUX`)
  + 36-bar equalizer + sweeping light beam + live meta row.

## 6.3 KNOWLEDGE STUDIO — web discovery → select 5 → video
This is a **4-phase interactive flow**:

**Phase 1 — Topic:** text input + preset chips (General knowledge, Science facts, Myanmar history,
Technology, Health & body, Space & ocean) + big `🌐 START` button.

**Phase 2 — Scanning (animated):** `POST /api/v1/knowledge/discover`. While waiting, show a
scanning reactor: tick ring + rotating dashed ring + 🌐 core + a 5-step checklist that advances:
```
🌐 knowledge web ချိတ်ဆက်နေသည်…
🔎 website များ စကင်ဖတ်နေသည်…
📚 အချက်အလက် ထုတ်နုတ်နေသည်…
⚖️ ယုံကြည်စိတ်ချရမှု စစ်ဆေးနေသည်…
✨ ခေါင်းစဉ် ၁၀ ခု ပြင်ဆင်နေသည်…
```
Enforce a minimum ~2.6 s so the animation is always seen.

**Phase 3 — Select exactly 5 of 10:** each result card shows thumbnail image, CATEGORY, source
publication, ★ interest score, Burmese title, 2-line summary, and a `+ / ✓` selector.
A `5/5` counter with progress bar; when 5 are chosen the rest lock (dimmed). Then Aspect picker +
narrator voice chips + GPU toggle, then **✓ CONFIRM (N CR)**.

**Phase 4 — Production:** `POST /api/v1/knowledge/produce` validates **exactly 5** topics
(else `NEED_FIVE` 400), charges atomically, and generates server-side:
- A **>60 second narrated script** — intro hook (8 s) + 5 fact segments (11–16 s each, each with a
  rotating Burmese hook phrase, the fact, and source attribution) + outro CTA (9 s) ≈ **86 s**
- Per-scene **on-screen captions**, start/end timestamps, and a matched image per scene
- A ready-to-post **social caption with hashtags `#` and mentions `@`**
- Then a 5-stage production reactor:
  `📝 SCRIPT WRITE → 🎙 VOICE RECORD → 🖼 IMAGE MATCH → 💬 CAPTION #@ → 🎬 VIDEO MUX`
- Result view: title, length, aspect, image count, horizontal scene-image strip, scrollable
  scene-by-scene script with timestamps, and the full Export Bar.

**Discovery engine:** if an API key exists, query the model for 10 real, diverse, factual topics
(JSON-only response). If not, use a **curated offline knowledge pool of 12+ real topics** with
Burmese titles/summaries, real publication names and URLs, deterministic-but-varied shuffling
seeded by the query, and query-word relevance biasing. **Both paths must work.**

---

# 7. UNIVERSAL OUTPUT EXPORT BAR (every faction result)

Build a normalizer that converts **any** faction result into one bundle
(video name, aspect, length, caption, hashtags, mentions, scriptText, timestamps), then render:

```
🎬 VIDEO + CAPTION + TIMESTAMP   → downloads  {name}-PACKAGE.txt   (everything in one file)
⧉ CAPTION COPY   (#@ included)   💬 CAPTION .TXT
📝 SCRIPT .TXT                    ⏱ TIMESTAMP .TXT
⧉ Script copy   ⧉ #@ only copy   ⬇ SRT
▸ Caption preview (expandable, scrollable)
```
- The PACKAGE file is formatted with `═` rule lines and 3 sections: `[1] CAPTION (#@)`,
  `[2] TIMESTAMPS`, `[3] SCRIPT`, plus a header with video filename / aspect / length / export time.
- Clipboard must have a `document.execCommand` fallback.
- Every copy/download shows an inline success flash.
- The normalizer must handle: `chapters, chapters2, summary, bullets, lines, cuts, slides, qa,
  entities, script, transcript, timestamps, scriptText` — whichever the faction produced.

---

# 8. AUTH SYSTEM (security is a hard requirement)

## 8.1 Register — `/register`
Two-step wizard with a step rail.
**Step 1 fields:** `USERNAME`, `GMAIL`, `PASSWORD`, `CONFIRM PASSWORD` — all with live
validation ticks, inline Burmese error text, and a 5-segment password strength bar.
**Step 2:** 6-digit OTP input (wide letter-spacing, numeric keypad, `autocomplete="one-time-code"`),
60-second resend cooldown, back-to-edit button.

**Rules:**
- **Gmail only.** Regex-validate `@gmail.com`; reject throwaway local-parts
  (`test/fake/temp/spam/admin…`); **normalize** by lowercasing, stripping dots and `+suffix`
  so one inbox = one account.
- Password: min 8 chars, must contain lowercase + uppercase + digit, reject common passwords.
- **OTP must be real** — generate with `crypto.randomInt`, store only `sha256(code)`, 10-minute
  expiry, max 5 attempts then invalidate, single-use (`consumed`), and invalidate previous codes
  for that email. Send via **nodemailer SMTP** with a branded dark HTML email showing the code in a
  large glowing monospace box with a Burmese explanation.
- If SMTP is unconfigured, return **503** with setup instructions — **never** fake-accept a code.
- On success: create the user (`displayName = username`, 60 welcome credits,
  `emailVerified = true`), create a session, return the public user.

## 8.2 Login — `/login`
Username **or** Gmail + password. Uniform `INVALID_CREDENTIALS` error (no account enumeration).
Track `failedLogins`; after **6** failures lock for **15 minutes** (423 with remaining minutes).
Reset counters on success and stamp `lastLoginAt`.

## 8.3 Sessions & hardening
- Token: 32 random bytes (base64url). Store **only** `sha256(token)` in `scm_sessions`.
- Cookie: `HttpOnly`, `Path=/`, 14-day expiry. **`SameSite=None; Secure` when
  `x-forwarded-proto === https`, otherwise `Lax`** (so it survives trusted preview iframes).
- `middleware.ts`: redirect unauthenticated users to `/login?next=…`; redirect logged-in users away
  from `/login` and `/register`. Apply security headers:
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `Cross-Origin-Opener-Policy`, and a full **CSP**.
  ⚠️ **Do NOT send `X-Frame-Options`.** Use CSP `frame-ancestors` with a configurable allow-list
  (`process.env.FRAME_ANCESTORS ?? "'self' https://*.arena.site https://*.e2b.app …"`) — the legacy
  header cannot express an allow-list and breaks trusted preview embedding.
- In-memory sliding-window rate limiter: OTP 8/15 min per IP + 4/15 min per email,
  login 12/10 min, register 10/15 min, agent/discovery 20/10 min.
- **Every** `/api/me/*`, `/api/v1/*` route must call the session helper and return
  **401 UNAUTHORIZED** when absent. Never return `aiApiKey` to the client — only a `hasAiKey` boolean.

---

# 9. MONETIZATION LOGIC (server-authoritative)

## 9.1 PRO — one payment card, dual pricing via a toggle
A **single** payment card (not two) containing an **ON/OFF switch**:
> **"⧉ ကိုယ့် API KEY နဲ့ကိုအသုံးပြုမည်"**

| Plan | STANDARD (switch OFF, platform key) | BYOK (switch ON, user's key) |
|---|---|---|
| 30 days | **15,000 Ks** | **9,000 Ks** |
| 90 days | **39,000 Ks** | **24,000 Ks** |
| 1 year | **129,000 Ks** | **79,000 Ks** |

- Toggling instantly updates every price, the "Due today" row, and shows the standard price
  struck-through next to the BYOK price.
- BYOK mode reveals an inline `sk-…` key field. **Server rejects BYOK purchase with 400
  `BYOK_KEY_REQUIRED`** unless a key is saved or supplied with the order.
- Payment methods: **KBZPay · WavePay · CBPay · Visa/MPU** — mobile-money needs a phone number,
  card needs number + MM/YY + CVC. Show a ~1.1 s "verifying" state.
- Extends from the current expiry if still active; writes to `scm_pro_orders` with the mode.

## 9.2 Credits
- **10 CR = 1,000 MMK.**
- Profile → Credits tab: **slider 10–500** with live MMK conversion, quick chips
  (+50/+100/+200/+500), liquid progress bar, payment method grid, and a `BUY` button.
- Deduction is **atomic and guarded**:
  `UPDATE … SET credits = credits - total WHERE id = ? AND credits >= total RETURNING credits`
  → if no row returned, respond **402 INSUFFICIENT_CREDITS** with `balance`, `cost`, `baseCost`,
  `gpu`, `gpuCost`. Credits can never go negative.

## 9.3 PRO vs FREE enforcement matrix

| Capability | FREE | PRO |
|---|---|---|
| RECAP / REEL / MM VOICE / SUBS / UPSCALE | ❌ **402 `PRO_REQUIRED`** | ✅ unlimited, 0 CR |
| NEWS / URL / YT PRO / DOC / KNOWLEDGE | ✅ with credits | ✅ with credits |
| GPU TURBO | ✅ pays credits | ✅ **still pays credits** |
| Daily render quota | **10 / day** | **10 / day** |
| History retention | wiped nightly | wiped nightly |

**Never trust a frontend badge** — re-check `isPro && proExpiresAt > now()` on every request, and
auto-downgrade an expired PRO on read.

## 9.4 Daily quota + nightly auto-clean
- Day boundary = **00:00 Asia/Yangon (UTC+6:30)** — compute with an explicit offset, not local time.
- `purgeOldHistory(userId)` deletes every task created before today's start; call it on list and
  before each dispatch.
- `todayJobCount(userId)` ≥ **10** → reject dispatch with **429 `DAILY_LIMIT`**.
- `GET /api/v1/tasks` returns a `policy` object: `{ dailyLimit, used, since, resetsAt, note }`.
- Dashboard + History show an **amber hazard-striped banner** with a **live HH:MM:SS countdown** to
  midnight, a `used/10` progress bar, and the Burmese warning:
  > ⚠ History သည် **ည ၁၂ နာရီထိုးတိုင်း** System မှ **အလိုအလျောက် ရှင်းလင်း** ပါမည်။
  > အရေးကြီးသောဖိုင်များကို **ကြိုတင် EXPORT** လုပ်ထားပါ။

---

# 10. JOB ENGINE (async, Celery-style)

- `POST /api/v1/faction/[faction]` → validate PRO/credits/quota → clamp duration → compute cost →
  atomic charge → insert task → return **202** `{ task_id, status: "queued", cost, gpu, lane,
  aspect, targetDuration, poll }`.
- `GET /api/v1/tasks/[taskId]` → recompute progress from elapsed time with an **ease-out curve**
  (`4 → 97%`), flip to `completed` at 100% and attach the result. **Preserve a pre-computed
  `resultPayload`** (KNOWLEDGE writes its video at dispatch) instead of overwriting it.
- Render duration scales with requested output length (0.7×–1.9× of base) and ×0.42 with GPU.
- Client polls every **1.3 s** — the UI must never freeze or block.

## 10.1 The Forge Reactor (shared processing animation)
Full-screen-capable cinematic component:
- Plasma drift blobs + dot grid + hologram lines + ember canvas + film-grain noise veil
- Rotating tick ring + conic energy sweep + double shockwave rings
- SVG progress ring with gradient stroke + drop-shadow glow + animated dash overlay
- Pulsing core showing `NN%`, stage name, and the Burmese stage label
- Orbiting faction glyph
- Glitching chromatic stage banner:
  `INGESTION → DECODE MATRIX → NEURAL WEAVE → PLASMA RENDER → FINALIZE → FORGED`
  (Burmese: `သွင်းယူနေသည် → ကုဒ်ဖြေနေသည် → AI ရက်လုပ်နေသည် → ပုံဖော်နေသည် → အပြီးသတ်နေသည် → ပြီးမြောက်ပြီ`)
- Liquid progress bar with a sweeping light beam
- **Streaming terminal log with faction-specific lines** (each tool logs different technical steps)
- Perspective scrolling floor grid
- On completion: a **"LEGENDARY DROP"** holo-rarity result frame with increased ember density.

---

# 11. USER PROFILE (right-side slide-over drawer)

Opens from the header avatar. Slides in from the right (`slideInRight`), ESC + backdrop close,
body scroll lock. Header uses the user's custom background image or preset gradient.
**6 tabs:**

1. **◉ Profile** — display name · **profile photo upload** (client-side canvas resize to 320 px,
   JPEG q0.82, ✕ remove) · **custom background upload** (900 px) · 16 emoji avatars ·
   6 background presets · **SAVE** · **⎋ LOGOUT**
2. **▤ Stats** — **USER STATIC CARD**: uploaded photo + display name + `@username` + email +
   PRO/BYOK/FREE badge over the user's background image; `JOBS / SPENT / VAULT` tiles;
   favorite faction; PRO expiry; per-faction usage matrix with bars; recent ledger
3. **◆ PRO** — the single dual-price payment card from §9.1
4. **⚡ Credits** — the credit slider shop from §9.2
5. **◈ Theme** — 6 presets (Aether Cyan, Mandalay Gold, Emerald Bagan, Royal Violet, Volt
   Rebellion, Forge Ember) + **2 custom color pickers** + a live preview panel; applying updates
   CSS variables instantly across the whole app
6. **⧉ API** — engine status (server key / user key), provider selector (AUTO / CLOUD / OFFLINE),
   masked BYOK key field with show/hide, and an explanation that the app works fully without a key

**Image upload security:** accept only `data:image/(png|jpe?g|webp|gif);base64,…`, cap at ~1.4 MB
after resize, validate server-side before persisting.

---

# 12. SUPPORT AI AGENT (scope-locked chatbot)

A floating `💬 AI` button (bottom-right, above the mobile nav) opening a chat window
(bottom sheet on mobile, centered card on desktop) with a first-visit nudge bubble.

**It answers ONLY:** the 10 faction tools and how they work, duration/aspect, PRO membership and
pricing, credits, GPU TURBO, API key/BYOK, and troubleshooting of those features.

**It must REFUSE:** source code, architecture, tech stack, database schema, deployment, env vars,
secrets, API keys, payment/credit bypass, "how did you build this", clone requests, prompt-injection
("ignore previous instructions", "act as…", "developer mode"), and all off-topic subjects
(sports, politics, medical/legal advice, poems, recipes, homework…).

**Implementation (critical):**
- A **deterministic knowledge engine** answers from the real registry data — prices, GPU costs,
  tier tables, step-by-step guides — so it works with **zero API key**.
- The guardrail classifier runs **before** any model call (`blocked` / `offtopic` / `ok`) so
  internals can never leak; if a cloud model is used, **re-screen its output** before returning.
- Refusals are polite, in Burmese, and redirect with example questions.
- Responses render simple `**bold**` markdown; each reply offers follow-up quick chips.
- Engine badge on each reply: `guard` / `offline` / `cloud`.

---

# 13. PAGES & NAVIGATION

| Route | Purpose |
|---|---|
| `/login` · `/register` | Auth (public) |
| `/` | Dashboard — hero reactor, pipeline strip, guide banner, search, 10 faction cards, PRO sanctum, credit vault, today's jobs + auto-clean banner |
| `/faction/[slug]` | Tool workstation — sanctum header, breadcrumb, collapsible how-it-works, ingestion, controls, micro-HUD, render lane |
| `/guide` | **Full Burmese user guide** — 5-step Start Here with a persisted checklist + progress, 5-stage pipeline explainer, **all 10 tools with logo + name + inputs + 5 steps + tips + output + cost** (searchable, deep-linkable `#faction-recap`), billing explainer, 8-question FAQ accordion |
| `/history` | Forge ledger — auto-clean banner, timeline list with GPU badges |

**Header:** rotating logo mark, `CUTFLOW` + `AETHER-FORGE · v4`, 📖 Guide, PRO/FREE badge,
credit pill, avatar/photo button. Must **never overflow at 360 px** — use `min-w-0` + `truncate`
on the brand and `shrink-0` on the action cluster. Below it, a scrolling marquee of tools/prices.

**Mobile bottom nav (5):** `⬢ Forge · ◆ Pro ∞ · 📖 Guide · ▤ Ledger · ⚡ Vault`.

---

# 14. MOBILE-FIRST RULES (non-negotiable)

- `min-height: 100dvh`, `overflow-x: clip` on `html` and `body`
- Full `env(safe-area-inset-*)` padding on header, bottom nav, drawers, and sheets
- **Inputs ≥ 16 px font on phones** (prevents iOS zoom-on-focus)
- Tap targets ≥ 40 px; `touch-action: manipulation`; no tap highlight
- Modals are **bottom sheets** below 768 px, centered dialogs above
- `overflow-wrap: anywhere` for long Burmese strings, filenames, and URLs
- Fluid type with `clamp()`; horizontal chip rails scroll with hidden scrollbars
- Test mentally at **360 × 640** — nothing may clip, overlap, or scroll sideways

---

# 15. ENVIRONMENT & DELIVERY

```env
DATABASE_URL=postgresql://user:pass@host:5432/db

# OTP email (required for Register)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=16-char-app-password        # Google Account → Security → App passwords
MAIL_FROM=SCM CUTFLOW <you@gmail.com>

# Optional — cloud AI (app works fully offline without it)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Optional — iframe embedding allow-list
FRAME_ANCESTORS='self'
```

**Deliver:**
1. Every file, complete and compiling — no omissions, no "rest is similar".
2. `package.json`, Drizzle config, `.env.example`, and a `README.md` with setup steps
   (install → set env → `drizzle-kit push` → `npm run build` → `npm start`).
3. Verify before finishing: `tsc --noEmit` = **0 errors**, `next build` succeeds,
   `/login` and `/register` render, protected routes 307 → `/login`, protected APIs return 401.
4. Seed nothing — a fresh user registers, gets 60 CR, and can immediately run a credit tool.

**Definition of done:** A new user can register with a real Gmail OTP, log in, customize their
profile photo/background/theme, buy PRO or credits, run all 10 tools (with duration/aspect/GPU
choices where applicable), watch the cinematic reactor, export the full video + caption `#@` +
timestamp + script package, chat with the scope-locked support agent, read the Burmese guide, and
see their history auto-clean at midnight — all on a 360 px phone screen with zero horizontal scroll.

=== PROMPT END ===

---

## 📌 အသုံးပြုရာမှာ မှတ်သားစရာ

| အချက် | ရှင်းလင်းချက် |
|---|---|
| **အရှည်** | ဒီ prompt က ရှည်ပေမယ့် **အပိုင်းလိုက်ဖြတ်မပို့ပါနဲ့** — တစ်ခါတည်းအပြည့်ပို့မှ AI က အပြည့်အစုံဆောက်မည် |
| **အဆင့်ဆင့်ခိုင်းချင်ရင်** | နောက်ဆုံးမှာ ဒီစာကြောင်းထည့်ပါ — *"Build in this order: (1) schema + auth, (2) design system + shell, (3) faction registry + cards, (4) job engine + reactor, (5) 3 flagship studios, (6) profile + billing, (7) guide + agent. Show me each phase before continuing."* |
| **UI ပိုမိုက်ချင်ရင်** | §2.4 က ၁၄ ချက်ကို "all mandatory" လို့ ထပ်အလေးပေးပြောပါ |
| **ဈေးနှုန်းပြောင်းချင်ရင်** | §9.1 နဲ့ §4.2 ဇယားထဲက ကိန်းဂဏန်းတွေပဲ ပြင်ပါ |
| **Faction ထပ်ထည့်ချင်ရင်** | §4 ဇယားထဲ row ထပ်ဖြည့် + §4.3 မှာ card layout အသစ်ရေးပါ |
