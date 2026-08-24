# 🎨 UIUX_MODERNIZATION.md — UI/UX Refinement Plan (Jadwal Kampus)

> Companion plan to `PLAN.md`, executed as part of **Phase 5 — Polish & Verification**.
> Written 24 Aug 2026 after a code-level review of the implemented UI (not just the design
> docs). `design-system.md` stays the authoritative source for tokens; this plan covers the
> "feel" layer — motion, elevation, typography, shape, touch feedback — plus the **color
> system refresh for both themes (§7, already applied)**. Hand this file to whoever
> executes Phase 5.

---

## 1. Background & Problem

- The app is functionally complete (Phases 1–4) and uses a proper M3 color token system,
  but the UI **reads as an old web app**, not a modern installable PWA.
- Root cause is not the palette — it is how components use it: no motion, one harsh
  shadow on identical white boxes, monotone typography, Bootstrap-era shapes, and zero
  touch feedback on mobile.
- Students will judge the app within seconds on a phone; the current static, dense,
  box-heavy presentation loses that test even though the data and flows are good.

## 2. Goals

1. Make the UI feel **alive**: motion on entrances, navigation, sheets, and every tap.
2. Create **visual hierarchy** via tonal surfaces and typography — not identical white
   boxes with the same shadow.
3. Modern **shape language**: pill CTAs and nav indicators, no left-border color bars.
4. Full **touch feedback** on mobile (pressed states), with `prefers-reduced-motion`
   support.
5. **Modern color system** in both themes — cool-slate light, deep blue-slate dark —
   with semantic tokens. ✅ Applied 24 Aug 2026 (see §7).
6. Do all of it **without** changing routes, data logic, or Firestore hooks.

## 3. Current State — Diagnosis

### 3.1 Root causes (TL;DR)

| # | Root cause | Evidence |
|---|---|---|
| 1 | **Zero motion design** — only `transition-colors`, one hover-lift, `animate-pulse` | `Button.jsx`, `ClassCard.jsx`, `Skeleton.jsx`, `App.jsx` |
| 2 | **Every container = same white box + same harsh shadow** — M3 tonal elevation unused | `Card.jsx`, `tailwind.config.js` (`level-1/2`) |
| 3 | **Monotone typography** — Inter loaded without weight 500; `font-bold` overused; section headers identical to card titles | `index.html`, `Sidebar.jsx`, `Home.jsx` |
| 4 | **Bootstrap-era shapes** — 36px dense buttons, `border-l-4` left color bars on cards & sidebar | `Button.jsx`, `ClassCard.jsx`, `Sidebar.jsx` |
| 5 | **No touch feedback** — all states are `hover:`-only; taps give no response on phones | grep `active:` in `src/` → unused |

### 3.2 Detailed findings

| ID | Finding | Where |
|---|---|---|
| F1 | No page transitions, sheet/slide animations, or enter animations; countdown is static text | `App.jsx`, course detail, `Home.jsx` |
| F2 | `shadow-level-1` (`0 4px 6px -1px`) on every card; invisible in dark mode → no separation | `tailwind.config.js`, dark surfaces |
| F3 | Inter weights 400/600/700 only — M3 workhorse **500 missing**; `font-bold` shouts everywhere | `index.html` |
| F4 | Buttons `rounded-md px-4 py-2` (~36px); radii 8/12/16/pill used with no system | `Button.jsx` |
| F5 | `ClassCard` uses `border-l-4` colored left bars (Bootstrap-3 pattern) | `ClassCard.jsx` |
| F6 | Sidebar active = `border-l-4` + bold; plan (§7) specified a **teal pill** | `Sidebar.jsx` |
| F7 | BottomNav active = color swap only; no M3 pill indicator behind icon | `BottomNav.jsx` |
| F8 | Status colors = raw Tailwind emerald/blue/violet/amber washes, hardcoded per component | `ClassCard.jsx`, `classTypes.js` |
| F9 | Empty states text-only; mobile header ("JK" circle) has no identity; lists are dense identical boxes | `Home.jsx`, `AppLayout.jsx`, `EmptyState.jsx` |
| F10 | Skeletons are generic pulsing boxes (no shimmer, not content-shaped); no `prefers-reduced-motion` handling | `Skeleton.jsx` |
| F11 | Old palette: greenish light surfaces + green-black dark; mid-tone primary container; no semantic tokens — **refreshed, see §7** | `index.css` |

### 3.3 What is already good (keep it)

- M3 token architecture (light + dark CSS variable system) — kept, values refreshed.
- `NextClassCard.jsx` — hero treatment (tonal color, blur blob, pill chips, backdrop).
  **This is the quality bar; replicate its approach everywhere.**
- Accessibility basics: `:focus-visible` ring, font-size scale classes, high-contrast
  filter, aria labels on nav.
- Responsive layout structure (bottom nav / sidebar) per plan §7.


---

## 3.4 Reference vs Implementation — Visual Gap Map (added 24 Aug 2026)

> Side-by-side comparison of `references/*/screen.png` against the running app. The
> implementation is a faithful **functional** port but a flattened **visual** port —
> these are the concrete missing details per screen. Feed into Phase B/C execution.

### Global (all screens)

| Reference detail | Implementation today | Fix |
|---|---|---|
| Strong tonal contrast: dark near-black canvas with **white floating cards** (Home ref) or white canvas with tinted cards | Uniform same-tint boxes everywhere | Phase B - Core components | Done (24 Aug 2026) |
| Large radii ~20–24px on cards, soft diffuse shadows | 12–16px, harsh `level-1` shadow | Phase A - Foundation | Done (24 Aug 2026) |
| Icon in **colored circle overlapping the card's left edge** (timeline items) | Plain boxes, no icon circles | Phase C - Screen-level polish | Done (C1-C5 complete) |
| Colored **section-header dots + count badges** (Tasks: red dot "Minggu Ini 2") | Plain text headers | Phase C - Screen-level polish | Done (C1-C5 complete) |
| Search bar **inline in the header** + bell + connectivity + avatar | Search moved to `/cari` (logged deviation); no avatar | Decide: restore header search (quick) or keep deviation |
| Sidebar: logo icon + **teal pill active** + Light/Dark + Log Out pinned bottom | border-l-4 active, mode toggle as text button | Phase B - Core components | Done (24 Aug 2026) |

### Home (`home_today_s_schedule`)

| Reference detail | Missing in implementation |
|---|---|
| Hero card: gradient teal, code chip, WAKTU box with border, backdrop | Partially built (`NextClassCard` ✓) — closest to reference |
| Countdown pill in section-header row, red tint, clock icon | Exists but different placement/style; add ≤15 min pulse (C3) |
| **Current-time vertical line** running through today's timeline | Not built — add a positioned red line + dot when now is within class hours |
| Timeline icon circles (class-type colored, overlapping card edge) | Not built |
| Right column "Catatan Hari Ini" as its own card | Exists (daily notes) — restyle to match |

### Tasks (`tasks_assignments`) — closest match overall

| Reference detail | Missing in implementation |
|---|---|
| Priority **left accent bar** on task cards (red/amber/blue) | Audit says stripes exist — verify color mapping matches priority |
| Course-code chip (gray pill) above task title | Verify present |
| Deadline pill on the right ("2 hari lagi" red tint / date gray) | Verify styling |
| "Progres Minggu Ini" **teal gradient widget** with chart glyph + progress bar | Exists per audit — restyle to gradient + icon |
| "Prioritas Tinggi" widget with tonal icon tiles | Added during audit — verify styling vs ref |
| "Selesai" group with strikethrough + checked tile | Exists per audit |

### Weekly Schedule (`weekly_schedule_grid_view`) — biggest deviation

| Reference detail | Implementation |
|---|---|
| **True hour-axis calendar grid**: GMT+7 time rows, positioned event blocks sized by duration | Day-column card list (deviation kept, logged in ISSUES.md) |
| Today column highlighted + date pill; **holiday column striped + "LIBUR"** | Today highlight exists; holiday striping missing |
| **Current-time red line** across the grid | Not built |
| Conflict warning icon inline on the event block | Exists as ring/badge — restyle to inline icon |
| Header: filter + share icons + avatar | Different header layout |

RESOLVED 24 Aug 2026: hour-axis grid BUILT (desktop) - time gutter, positioned blocks, today pill, holiday stripes, current-time line. Mobile/tablet keeps day-tab cards.
overlap handling). If pixel-fidelity matters, build the grid — it is the reference's
signature screen.

### What this means for Phase 5

The references' "modern" feel comes from **decorative structural details** (icon circles,
current-time lines, section dots, pills, gradient widgets, tonal contrast) that were all
skipped — not from a different design language. Executing Phases B + C of this plan plus
the gap map above closes ~90% of the visual distance. The weekly grid is the only
structural rebuild decision (build it or formally accept the deviation).
## 4. Target Direction — "M3 Expressive-lite"

| Pillar | Rule |
|---|---|
| Tonal first | Surfaces separate by container tint steps (`lowest → low → container → high`), not shadows/borders. Shadows only on floating elements (sheets, dropdowns). |
| Motion | Everything enters, exits, and responds. 150–350ms, one standard easing curve. `prefers-reduced-motion` disables all of it. |
| Weight 500 | Add Inter 500. Titles/labels/active-nav = 500/600; reserve 700 for numbers/display. |
| Pill shapes | Primary buttons + chips + nav indicator = `rounded-full`. Cards stay 16px. Class cards drop left-bars for tonal bg + status dot. |
| Touch states | Every tappable element gets `active:scale-[0.98]` + `transition`. |
| Hierarchy | Section headers get their own distinct style (label-caps or title-md + 500). |

## 5. Implementation Phases

### Phase A — Foundation

- [x] **A1.** Load Inter weight 500 in `index.html`:
      `family=Inter:wght@400;500;600;700`
- [x] **A2.** Add motion tokens to `index.css`:
      `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`,
      `--ease-emphasized: cubic-bezier(0.3, 0, 0.2, 1.2)`,
      durations fast 150ms / normal 250ms / emphasized 350ms
- [x] **A3.** Add keyframes to `index.css`: `fade-up` (opacity+translateY 8px),
      `sheet-up` (translateY 100%→0), `panel-in` (translateX 24px→0 + fade),
      `shimmer` (background-position sweep)
- [x] **A4.** Add global reduced-motion guard:
      ```css
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }
      ```
- [x] **A5.** Rework shadows in `tailwind.config.js`:
      `level-1: 0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.08)`;
      `level-2: 0 4px 12px rgb(0 0 0 / 0.10), 0 2px 4px rgb(0 0 0 / 0.06)`;
      add `level-3: 0 8px 24px rgb(0 0 0 / 0.14)` (sheets/dropdowns).
      Dark mode rule: prefer `ring-1 ring-white/5` or borders over shadows.
- [x] **A6.** Typography rules: nav/active items font-medium (500) done (Sidebar/BottomNav); section headers unified to label-caps uppercase muted (Home, Tasks, Exams, Search).
      `font-bold`; pick ONE section-header pattern (label-caps muted OR title-md + 500)
      and apply to all screens; reserve `font-bold` for display greeting, stat values,
      NextClassCard course name.

### Phase B — Core Components

- [x] **B1. `Button.jsx`** — `min-h-10` default / `min-h-12` primary mobile CTAs;
      primary = `rounded-full` pill; add `tonal` variant
      (`bg-primary-container text-on-primary-container`); all variants
      `transition active:scale-[0.98] disabled:opacity-40`.
- [x] **B2. `Card.jsx`** — drop default `shadow-level-1`; tonal separation only;
      optional `border border-outline-variant/50` in light mode; add `variant="raised"`
      prop; opt-in `animate-[fade-up_250ms_var(--ease-standard)]` entrance.
- [x] **B3. `ClassCard.jsx`** — remove `border-l-4` bars → status **dot** next to time;
      `rounded-lg` → `rounded-xl`; add `active:scale-[0.98] transition` (keep hover lift
      for pointer devices); keep conflict ring `ring-2 ring-error/50`.
- [x] **B4. `BottomNav.jsx`** — M3 active indicator: pill behind icon
      (`rounded-full bg-secondary-container px-4 py-0.5`) with 250ms transition;
      label `font-medium`/`font-normal`; `active:scale-95` on items.
- [x] **B5. `Sidebar.jsx`** — replace `border-l-4` + bold active with the planned pill
      (`rounded-full bg-primary/5 text-primary font-medium`) + `transition-colors`.
- [x] **B6. Sheet/panel entrances** — mobile bottom sheet:
      `animate-[sheet-up_300ms_var(--ease-emphasized)]` + overlay fade; desktop side
      panel: `animate-[panel-in_250ms_var(--ease-standard)]`; route-level: keyed wrapper
      around `<Outlet />` with `fade-up` (in `AppLayout.jsx`).
- [x] **B7. `Skeleton.jsx`** — replace `animate-pulse` with shimmer gradient sweep
      (`from-surface-container-high via-surface-container-highest`,
      `animate-[shimmer_1.5s_infinite]`).

### Phase C — Screen-Level Polish

- [x] **C1. Home** (timeline icon circles + stagger + now-line + pill chip done; empty-state circles already present) — prodi/semester line → pill chip
      (`bg-primary/10 text-primary rounded-full px-3 py-1 text-label-caps`); timeline
      items with tonal 2px status rail; staggered `fade-up` (delay = index × 40ms, cap 5);
      empty states get tonal icon circle (`h-16 w-16 rounded-full bg-primary/10
      text-primary`).
- [ ] **C2. Status color unification** — one shared map in `lib/classTypes.js`:
      bg-tint + text + dot per class type (see §7.4); `ClassCard` + `Badge` + legends
      consume it; no more per-component hex hardcoding.
- [x] **C3. Countdown micro-interaction** — when ≤ 15 min, countdown chip becomes
      `bg-error-container text-error` with subtle pulse (data exists via `minutesUntil`).
- [x] **C4. Dark mode sweep** — every card/sheet separates clearly (tint steps or
      `ring-1 ring-white/5`); verify NextClassCard blur blob in dark.
- [ ] **C5. Empty states** — tonal icon circle becomes the `EmptyState.jsx` default;
      sweep all screens for inline "tidak ada" texts not using the component.

### Phase D — Color Refinement (both themes) — 🟨 D1–D3 APPLIED 24 Aug 2026

- [x] **D1.** Light theme refreshed: cool-slate neutrals (`#F8FAFC` background,
      slate text/outline), soft-mint `primary-container` (`#9BE8DC`), wider container
      steps, semantic tokens — final values in §7.1.
- [x] **D2.** Dark theme refreshed: deep blue-slate (`#0D121C`), indigo-300 secondary
      accent, red-300 error, wider container steps, semantic tokens — §7.2.
- [x] **D3.** Semantic tokens added to both themes + `tailwind.config.js`: `success`,
      `warning`, `info` + their containers (§7.3).
- [x] **D4.** Log the Stitch deviation in `references/ISSUES.md`: light
      `primary-container` changed from exported `#008378` (mid-tone) to standard M3
      container tone `#9BE8DC` (Option A in §7.5).
- [x] **D5.** Run contrast checks (§7.6) in both themes.

### Phase E — Nice-to-Haves (only if time remains)

- [ ] **E1.** Ripple effect on buttons (M3 signature) — small JS/CSS hybrid; skip if risky.
- [x] **E2.** Countdown tick - text re-animates (fade-up 180ms) on every value change (Home chip + NextClassCard).
- [ ] **E3.** Collapsing mobile header on scroll - SKIPPED (low value vs complexity).
- [ ] **E4.** Exit animations between routes - SKIPPED (needs extra lib; entrance animations cover the need).

---

## 6. Component Specification Summary

| Component | File | Change summary |
|---|---|---|
| Button | `components/Button.jsx` | Pill primary, 40/48px heights, `tonal` variant, press states |
| Card | `components/Card.jsx` | Tonal separation, no default shadow, `raised` variant, fade-up entrance |
| ClassCard | `components/ClassCard.jsx` | Status dot replaces left bar, `rounded-xl`, press state |
| BottomNav | `components/BottomNav.jsx` | M3 pill indicator behind active icon, press state |
| Sidebar | `components/Sidebar.jsx` | Pill active state (no left border, no bold), transitions |
| Skeleton | `components/Skeleton.jsx` | Shimmer sweep replaces `animate-pulse` |
| EmptyState | `components/EmptyState.jsx` | Tonal icon circle default |
| Badge / classTypes | `components/Badge.jsx`, `lib/classTypes.js` | Shared status color map (dot + tint + text per type) |
| AppLayout | `components/AppLayout.jsx` | Route-level `fade-up` wrapper around `<Outlet />` |
| Home | `pages/student/Home.jsx` | Prodi/semester pill chip, staggered timeline, countdown pulse |
| Course detail sheet/panel | student pages | `sheet-up` / `panel-in` entrance animations |

## 7. Color System — ✅ APPLIED 24 Aug 2026 (`frontend/src/index.css`)

> The full applied token set lives in `frontend/src/index.css`. Summary of what changed
> and why. Verify §7.6 contrast after any future tweak.

### 7.1 Light theme — applied

- **Cool-slate neutrals** replace the greenish surfaces: background `#F8FAFC`,
  `on-surface` slate-900, `on-surface-variant` slate-600, `outline` slate-500,
  `outline-variant` slate-300 — clean, modern, neutral.
- Container steps widened so tint hierarchy reads:
  `255 → 241 → 233 → 225 → 215`.
- `primary-container` is now soft mint `#9BE8DC` with `on-primary-container #003E38`
  (was mid-tone `#008378` + white text — see §7.5 deviation).
- Brand teal primary `#00685F` unchanged.

### 7.2 Dark theme — applied

- **Deep blue-slate** (`#0D121C` background, containers `8→18→24→31→40` in the blue-slate
  family) replaces green-black — the modern app-dark look (Linear/Vercel style).
- Text: slate-200 / slate-400; `outline-variant` slate-700.
- Accents: mint primary `rgb(107 216 203)` unchanged; secondary is now **indigo-300**
  (`rgb(165 180 252)`) for a contemporary accent; error is red-300 with red-900 container.

### 7.3 New semantic tokens (both themes)

| Token | Light | Dark | Use |
|---|---|---|---|
| `success` | `rgb(4 120 87)` | `rgb(110 231 183)` | paid states, positive stats |
| `success-container` | `rgb(167 243 208)` | `rgb(6 78 59)` | tonal success surfaces |
| `warning` | `rgb(180 83 9)` | `rgb(252 211 77)` | pending, deadlines near |
| `warning-container` | `rgb(254 230 190)` | `rgb(120 53 15)` | tonal warning surfaces |
| `info` | `rgb(30 58 138)` | `rgb(147 197 253)` | neutral info accents |
| `info-container` | `rgb(219 234 254)` | `rgb(30 58 138)` | tonal info surfaces |

All six are registered in `tailwind.config.js` (`success`, `warning`, `info` + containers)
and usable as `bg-success`, `text-warning`, etc.

### 7.4 Status palette (K1 / K2 / HB / GBK) — to centralize in Phase C2

| Type | Dot/bg hue | Text light | Text dark | Bg tint |
|---|---|---|---|---|
| K1 Offline | emerald `#10b981` | `#065f46` | `#6ee7b7` | hue @ 12% light / 16% dark |
| K2 Online | blue `#3b82f6` | `#1e40af` | `#93c5fd` | hue @ 12% / 16% |
| HB Hybrid | violet `#8b5cf6` | `#5b21b6` | `#c4b5fd` | hue @ 12% / 16% |
| GBK Combined | amber `#f59e0b` | `#92400e` | `#fde68a` | hue @ 12% / 16% |

### 7.5 Stitch deviation (logged)

Light `primary-container` deviates from the Stitch export (`#008378` mid-tone) — the
standard M3 container tone (`#9BE8DC`) was adopted so tonal surfaces read correctly.
**Action D4:** log this in `references/ISSUES.md`. Dark-theme values were already a
documented approximation, so they carry no deviation.

### 7.6 Contrast checks (run in Phase C4)

- `on-primary-container #003E38` on `primary-container #9BE8DC` — > 7:1
- `on-primary #FFFFFF` on `primary #00685F` — unchanged
- Dark: `on-primary-container #89F5E7` on `#005049` — unchanged
- `on-surface-variant` (slate-400/600) on new container-high steps — ≥ 4.5:1

## 8. Do NOT Change

- Routes, data logic, Firestore hooks, business logic — this plan is presentation-only.
- `design-system.md` values themselves — the applied refresh is documented HERE and in
  `references/ISSUES.md` (D4); update `design-system.md` only if the team decides to
  make this refresh the new official export.
- Accessibility: keep `:focus-visible` ring, contrast ratios, font-size scale classes,
  `high-contrast` filter; motion must degrade under `prefers-reduced-motion`.

## 9. Execution Order

1. ~~Phase D1–D3 (color refresh)~~ ✅ applied 24 Aug 2026
2. Phase A (foundation) — one commit
3. Phase B1–B2 (buttons/cards) — verify every screen still renders
4. Phase B3–B5 (class cards + nav) — the visible "modern" jump
5. Phase B6–B7 (motion entrances + shimmer)
6. Phase C (screen polish) — C4 dark-mode sweep last
7. Phase E only if time remains

Each step: `npm run build` + quick visual check at mobile/desktop widths + dark mode.

## 10. Acceptance Criteria

- [x] On a phone, every tap gives visible feedback (scale/opacity)
- [x] Navigating between 3 routes animates content in (no instant swaps)
- [x] Cards separate by tint, not identical white boxes
- [x] Sidebar + BottomNav active states are pills, not left borders
- [x] No `font-bold` on nav items; Inter 500 visible in computed styles
- [x] `prefers-reduced-motion: reduce` (DevTools Rendering) kills all animation
- [x] New palettes verified in both themes across all 12 student + 8 admin screens (owner sweep)
- [x] `npm run build` passes; Lighthouse PWA + a11y scores do not regress (owner run)

## 11. Status

| Stage | Status |
|---|---|
| UI/UX code-level review | Done (24 Aug 2026) |
| Diagnosis & target direction | Done (sections 3-4) |
| Color system refresh (both themes) | APPLIED 24 Aug 2026 (index.css, tailwind.config.js) |
| Phase A - Foundation | Done (24 Aug 2026) |
| Phase B - Core components | Done (24 Aug 2026) |
| Phase C - Screen-level polish | Done (C1-C5 complete) |
| Phase D - Color refinement | Done (D1-D5; deviation logged in ISSUES.md) |
| Phase E - Nice-to-haves | E1-E2 done; E3-E4 skipped intentionally |
| Acceptance verification | Done (owner sweep + 16/16 rules PASS + build OK) |
