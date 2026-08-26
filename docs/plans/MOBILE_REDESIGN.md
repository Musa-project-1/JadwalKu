# 📱 MOBILE_REDESIGN.md — JadwalKu Mobile UI/UX Redesign

> Written 26 Aug 2026. Companion to `UIUX_MODERNIZATION.md` (desktop-first visual
> modernization, Phases A–D complete) and `REDESIGN_PLAN.md` (Stitch v2 re-skin).
> This plan is **mobile-first**: layout structure, navigation reachability, touch
> ergonomics, and modal patterns on screens < 600px — covering **both student and
> admin** surfaces.
>
> Rules inherited from prior plans: routes / data logic / Firestore hooks untouched;
> tokens in `index.css` stay the source of truth; Tailwind + existing motion tokens
> only (no new deps); accessibility (`:focus-visible`, contrast ≥ AA,
> `prefers-reduced-motion`) must not regress; desktop/tablet layouts unchanged except
> where bugs are fixed.

---

## 1. Diagnosis — concrete mobile problems (code-level)

### Student shell (`AppLayout.jsx`, `BottomNav.jsx`)

| # | Problem | Evidence |
|---|---|---|
| S1 | **Crowded header** at 360px: logo mark + "JadwalKu" wordmark + "Mode Admin" pill *with text* + search icon + bell + theme toggle = 5 items inside a 72px bar | `AppLayout.jsx` header block |
| S2 | **Dead-end navigation**: BottomNav exposes only 4 tabs. Settings, Notifications, Export/Share, Riwayat, Tentang are unreachable from mobile chrome except via buried links/popover | `BottomNav.jsx` uses `STUDENT_NAV`; no "More" affordance |
| S3 | **No safe-area handling** — floating nav ignores `env(safe-area-inset-bottom)`; clips into iOS home indicator in installed-PWA mode | grep `safe-area` → unused |
| S4 | **Inconsistent floating layers**: Tasks FAB at `bottom-24 right-4`, admin BulkActionBar at `bottom-6 left-1/2`, nav pill at `bottom-4` — ad-hoc offsets, collision-prone | `Tasks.jsx`, `ManageSchedule.jsx` |

### Student screens

| # | Problem | Evidence |
|---|---|---|
| P1 | **Home aside buried**: Catatan Hari Ini + stat chips + Tugas Terdekat stack *below* the entire day timeline on mobile — the note is unreachable without long scrolling | `Home.jsx` single-column order |
| P2 | **Greeting oversized on phones**: Permanent Marker 34px + two chip rows push first real content far down | `Home.jsx` header |
| P3 | **Tasks filter cluster wraps** into 3–4 rows of pills (scope tabs + status segmented control + course `<select>`) at narrow widths | `Tasks.jsx` toolbar |
| P4 | **WeeklySchedule header controls wrap awkwardly** (week navigator + TA dropdown + share) | `WeeklySchedule.jsx` |
| P5 | **Modals are centered desktop dialogs on phones** — `AddTaskForm` (max-w-lg, centered). The `sheet-up` keyframe exists in `index.css` but only `CourseDetailPanel` uses bottom-sheet pattern | `Tasks.jsx`, `index.css` |

### Admin shell & screens

| # | Problem | Evidence |
|---|---|---|
| A1 | **BUG — sticky tab bar misaligned**: mobile admin nav is `sticky top-16` (64px) but header is `h-[72px]` → 8px strip of scrolled content shows through / overlap while scrolling | `AdminLayout.jsx` |
| A2 | **Dashboard stat cards cramped** at ≤400px: `grid-cols-2` with `p-5/p-6`, `text-3xl/4xl` numbers, absolutely-positioned 44px icons overlapping labels | `AdminDashboard.jsx` |
| A3 | **All admin form modals are centered dialogs** (Tambah/Edit Sesi, MK cepat, etc.) — poor thumb reach; same Sheet gap as students | `ManageSchedule.jsx`, others |
| A4 | **BulkActionBar overflows** small screens: count + 3 labeled buttons + cancel inside `max-w-[95vw]` | `ManageSchedule.jsx` |
| A5 | **Sub-44px touch targets**: several `p-1` (~24px) icon buttons across cards/lists | various |

---

## 2. Implementation Phases

### Phase 0 — Baseline audit
- [ ] Run dev server; screenshot every student + admin screen at 360×800 (light + dark).
- [ ] Log per-screen issues into this file (§4 Screen Checklist) before changing anything.

### Phase 1 — Mobile foundation (shared primitives)
- [ ] **F1. Safe-area support** — utilities in `index.css`
      (`.pb-safe { padding-bottom: env(safe-area-inset-bottom); }` etc.); apply to
      BottomNav, FABs, BulkActionBar, OfflineBanner.
- [ ] **F2. New `components/Sheet.jsx`** — one primitive:
      - Mobile (<600px): bottom sheet — `sheet-up` entrance, drag-handle bar,
        `max-h-[90vh] overflow-y-auto`, overlay fade.
      - Tablet/desktop: side panel (`panel-in`) or centered dialog variant via prop.
      - Focus trap basics, ESC/backdrop close, aria-modal.
- [ ] **F3. Floating-layer convention** — documented z-index scale +
      offset constants for FAB / bulk bar / nav; fix collisions (S4).

### Phase 2 — Student shell
- [ ] **S1-fix. Header slimming (<600px)**: logo mark only (hide wordmark),
      collapse "Mode Admin" to compact icon button → target ≤ 4 items.
- [ ] **S2-fix. BottomNav "Lainnya"**: add 5th tab opening a bottom-sheet grid of
      secondary destinations (Pengaturan, Notifikasi, Bagikan/Ekspor, Riwayat,
      Tentang) with active-state highlighting.
- [ ] Standardize FAB placement relative to new nav metrics (incl. safe area).

### Phase 3 — Student screens
- [ ] **P1/P2-fix. Home reorder (mobile)**: greeting (smaller font) → compact
      stat chips row → NextClassCard → Catatan Hari Ini (collapsible card) →
      timeline → Tugas Terdekat.
- [ ] **P3-fix. Tasks filters**: single horizontally-scrollable chip row;
      move course/status selection into a "Filter" button that opens `Sheet` on mobile.
- [ ] **P4-fix. WeeklySchedule controls**: group week nav + TA + share into one
      scrollable row instead of wrapping.
- [ ] **P5-fix. AddTaskForm → `Sheet`**.

### Phase 4 — Admin shell & dashboard
- [ ] **A1-fix.** Change sticky offset `top-16` → `top-[72px]` in `AdminLayout`;
      polish chip scroller active states to match student design language.
- [ ] **A2-fix. Dashboard stats**: <400px → inline-icon horizontal cards
      (or reduced padding/scale 2-col); eliminate label/icon overlap.

### Phase 5 — Admin screens
- [ ] **A3-fix.** Migrate all admin form modals onto `Sheet`.
- [ ] **A4-fix. BulkActionBar responsive**: icon-only buttons + count badge under
      `sm`; full labels above; safe-area padding.
- [ ] **A5-fix. Touch targets**: padded hit boxes (visual size unchanged) for all
      sub-44px icon buttons.

### Phase 6 — Verification
- [ ] Browser sweep at 360 / 412 / 600 widths × light/dark for every screen:
      no horizontal overflow, no clipped text, tap targets ≥ 44px.
- [ ] `npm run build` passes; tablet/desktop breakpoints visually unchanged
      (except A1 bug fix).

---

## 3. Constraints & Do-NOTs

- No new dependencies; CSS/Tailwind + existing keyframes/motion tokens only.
- Do not touch routes, hooks, Firestore logic, business logic.
- Keep M3 token system intact — any new color maps INTO existing tokens.
- Keep `prefers-reduced-motion` behavior working for all new animations.

---

## 4. Screen Checklist (audit log — fill during Phase 0)

| Screen | 360px issues found | Fixed |
|---|---|---|
| Home | P1 aside burial, P2 greeting size | ☐ |
| Weekly Schedule | P4 control wrapping | ☐ |
| Tasks | P3 filter wrap, P5 dialog, FAB offset | ☐ |
| Exams | TBD audit | ☐ |
| Search / Notifications / Settings / About / Riwayat / Export | TBD audit | ☐ |
| Onboarding | TBD audit | ☐ |
| Admin Login / Dashboard | A2 stat cards | ☐ |
| Manage Schedule | A3 modals, A4 bulk bar, table cards OK | ☐ |
| Manage Courses / Exams / Academic Settings | TBD audit | ☐ |

---

## 5. Status

| Stage | Status |
|---|---|
| Code-level mobile diagnosis | Done (26 Aug 2026) |
| Phase 0 audit | Not started |
| Phase 1 foundation | Not started |
| Phase 2 student shell | Not started |
| Phase 3 student screens | Not started |
| Phase 4 admin shell/dashboard | Not started |
| Phase 5 admin screens | Not started |
| Phase 6 verification | Not started |
