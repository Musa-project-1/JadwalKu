# 🔄 REDESIGN_PLAN.md — JadwalKu Visual Redesign v2

> Written 25 Aug 2026. The v1 Stitch references were generated with an "old-web"
> direction ("minimal, flat, **no gradients**") — matching them faithfully is why the
> app felt dated. This plan replaces the visual direction: generate a **modern design**
> via Google Stitch (new prompt in `md/stitch-prompt-v2.md`), then re-skin the existing
> app against the new references.

---

## 1. What stays (do NOT redo)

- All features, routes, and data logic (Phases 1–4) — untouched.
- The modernization foundation already built: motion system (page transitions, ripples,
  sheet/panel animations), M3 color tokens + semantic tokens, pill components,
  Inter 500, shimmer skeletons, hour-axis weekly grid, StatusBanner, centralized status
  colors in `classTypes.js`.
- Brand: **JadwalKu**, teal `#00685F` primary + mint accents, logo.svg.

## 2. What changes

| Layer | Old (v1) | New (v2) |
|---|---|---|
| Art direction | "minimal, flat, no gradients" | Expressive 2026: soft aurora gradients, tonal layering, bento grids |
| Cards | 12–16px radius, uniform boxes | 20–28px radius, varied bento sizes, colored icon chips, tonal tints |
| Headers | Plain text | Large bold greeting/hero, gradient hero cards, glassy sticky header |
| Navigation | Plain sidebar/bottom bar | Pill indicator, floating dock-style bottom nav (mobile), grouped sidebar |
| Empty/loading | Text + pulse boxes | Illustrated tonal empty states, shimmer |
| Density | Uniform dense stacks | Deliberate whitespace, section rhythm, accent chips |

## 3. Workflow

1. [x] Run `md/stitch-prompt-v2.md` in Google Stitch (one prompt, all screens)
2. [x] Export each screen → replace the contents of `references/` (keep the same
      per-screen folder naming so the audit workflow keeps working)
3. [ ] Re-skin screens one by one against the new references (Tailwind classes only —
      no logic changes). Order: Home → Weekly → Tasks → Exams → Search → Settings →
      Notifications → Onboarding/Intro → Export → History → About → Admin screens
4. [ ] Visual sweep at 3 breakpoints + dark mode after each screen
5. [ ] Update `references/ISSUES.md` for any new-reference oddities

## 4. Rules

- Tokens in `index.css` stay the source of truth; if the Stitch output introduces new
  colors, map them INTO the existing tokens (do not scatter raw hexes).
- No new dependencies for layout (no framer-motion etc.) — CSS/Tailwind only.
- Keep accessibility: focus rings, contrast ≥ AA, font-size scale, reduced-motion.

## 5. Status

| Stage | Status |
|---|---|
| Diagnosis (old-web root cause) | Done — v1 prompt direction |
| New Stitch prompt (v2) | Done — `md/stitch-prompt-v2.md` |
| Generate new references | Not started (user, in Stitch) |
| Re-skin screens | Not started |
| Final sweep | Not started |
