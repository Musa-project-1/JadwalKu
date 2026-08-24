# DESIGN_REFERENCE.md — UI Design Compliance Instructions

> This file contains mandatory instructions for the AI/coding assistant (Claude Code or similar) working on the UI implementation of the **Jadwal Kampus** project. Read and follow this before writing any component.

---

## Main Rule

**The `references/` folder is the single source of truth for this app's visual appearance.** All UI design — layout, colors, spacing, typography, components, icons, element positioning — MUST follow what's in that folder, NOT free interpretation, NOT generic design patterns, and NOT default templates from any UI library.

Before building or editing any screen/component:

1. **Check the `references/` folder first** — look for the file related to the screen being worked on (filenames usually correspond to the screen name, e.g. `home.png`, `weekly-schedule.png`, `admin-dashboard.png`, etc.)
2. **Actually look at/analyze the file directly** before writing code — don't guess from the filename alone
3. **Replicate as accurately as possible**: layout structure, element order, exact colors (pull from the image if not listed in the design tokens), corner radius, spacing between elements, font sizes, icons used
4. **If any part of the reference is unclear** (e.g. low image resolution, or a state that isn't depicted), fall back to the design tokens in `design-system.md` — not the AI's personal preference
5. **If a reference for a given screen doesn't exist yet**, STOP and ask the user first — don't invent a new design on your own

## Design Tokens as a Supplement (not a replacement for the visual reference)

**The primary source for design tokens is `design-system.md`** (not the summary in PLAN.md) — that file contains the complete definitions from Google Stitch: the full light/dark color scale (primary, secondary, tertiary, surface container levels, outline, error, fixed variants), the complete typography scale (display, headline-lg, title-md, body-lg, body-sm, label-caps with exact size/weight/line-height/letter-spacing), radius per component category, elevation/shadow per level, and component specs (Buttons, Schedule Cards, Chips & Badges, Input Fields, Sidebar).

Use this ONLY for things not explicitly visible in the reference images — if there's a conflict between `design-system.md` and a visual interpretation from a screenshot, **`design-system.md` wins**, since it's the raw token set Stitch used to generate the image in the first place.

Quick summary (full detail in `design-system.md`):
- Primary teal `#00685F` / on-primary white
- Background `#F5FAF8` (light)
- Font: Inter, scale from `display` 36px/700 down to `label-caps` 12px/600
- Card radius 12–16px, buttons/inputs 8px, chips/badges full pill
- 8px grid, 24px desktop gutter, 16px mobile margin

Class-type color coding (MUST stay consistent across every screen, even when not explicit in a reference image):
- 🟢 K1 — Offline Class
- 🔵 K2 — Online Class
- 🟣 HB / HBH / HBD — Hybrid
- 🟡 GBK1 / GBK2 — Combined Class
- ⚪ Neutral/inactive

Icons MUST be stroke-based (2px width), per `design-system.md`'s "Sidebar (Desktop)" spec, applied to icons app-wide — not plain text glyphs (e.g. `⌂ ▦ ☑ ✎ ⚙`). Use the existing `Icon.jsx` component and `public/icons.svg` sprite consistently; don't introduce ad-hoc unicode/emoji icons or a second icon system.

## Expected Workflow

For every screen being built:

1. State which file in the `references/` folder is being used as the reference for this screen
2. Build the React + Tailwind component to match it as closely as possible
3. When in doubt between two interpretations, pick whichever is visually closer to the reference, not whichever is easier to code
4. Once done, present the result side-by-side with the original reference, and explicitly call out any part that may differ (e.g. due to a technical limitation) along with the reason — never silently deviate without mentioning it

## Handling Broken or Inconsistent References

Since the references come from an AI generation tool (Google Stitch), individual files may occasionally be broken, incomplete, or inconsistent with the rest of the design system — this is expected and must be handled deliberately, not silently copied into the codebase.

**Signs a reference file may be broken or off-theme:**
- Colors that don't match any value in `design-system.md` (not primary teal, not a listed status color, not a neutral/surface tone)
- A different font, radius, spacing scale, or component style than every other reference file uses
- Visibly corrupted, cut-off, low-resolution, or partially-rendered elements
- Layout that contradicts the breakpoint rules in `design-system.md` (e.g. a "desktop" reference using mobile bottom-nav patterns)
- A screen that duplicates another reference but with conflicting details (e.g. two different "Home" references that disagree on layout)

**What to do when this happens:**

1. **Don't silently "fix" it by guessing** — and don't silently copy the broken/inconsistent part into the component either
2. **Flag it explicitly to the user** before building that screen: name the file, describe exactly what looks broken or off-theme, and show the specific inconsistency (e.g. "this reference uses `#3B82F6` for the primary button, but `design-system.md` defines primary as `#00685F`")
3. **Propose the correction**: default to reconciling the file with `design-system.md` (since that's the authoritative token source) and explain the proposed fix, rather than picking arbitrarily
4. **Wait for confirmation** before proceeding with that screen, unless the fix is trivial and unambiguous (e.g. an obviously mistyped hex value that's one character off from a real token) — in that case, apply the correction and clearly note what was changed and why
5. **Log it** — keep a running note (e.g. at the top of this file or in a `references/ISSUES.md`) of every reference file that needed correction, so the list of "trust but verify" files stays visible over time instead of being forgotten after the first fix

## What NOT to Do

- ❌ Building UI from generic assumptions about "what a typical schedule app usually looks like"
- ❌ Swapping colors, fonts, or layout because it's "more modern" or "best practice" without explicit user approval
- ❌ Skipping/ignoring files in the `references/` folder because the text description in PLAN.md seems "clear enough" — the text in PLAN.md is a feature summary, not a detailed visual spec
- ❌ Using third-party UI library components (e.g. shadcn, Material UI) with default styling without adapting them to match the reference design
- ❌ Copying an obviously broken or off-theme reference file into a component as-is without flagging it first (see "Handling Broken or Inconsistent References" above)

## Known Gap: Dark Mode Tokens Are Approximated

`design-system.md`'s `colors-dark` block is **not** an original Stitch export — Stitch only generated light-mode reference screens, so there was no dark-mode source to extract exact tokens from. The dark scheme currently in `design-system.md` was derived from the light scheme's M3 `-fixed`/`inverse-*` tokens as a reasonable placeholder. This is why dark mode may look duller or less "designed" than light mode — it genuinely doesn't have the same authority behind it.

**When working on dark mode specifically:**
- Treat `colors-dark` as directionally correct but not pixel-perfect — don't assume a dark-mode visual mismatch is a coding bug before checking whether it's actually a token-accuracy issue
- If dark-mode Stitch references ever become available, replace `colors-dark` in `design-system.md` with the real export and remove the approximation warning
- Class-type status colors (K1 green, K2 blue, hybrid purple, combined amber) should stay recognizable in dark mode too — verify contrast against the dark surface, don't just reuse the light-mode hex values as-is

## Related Files

- `references/` — main folder containing all design assets (screenshots/exports from Google Stitch) per screen
- `references/ISSUES.md` — running log of any reference files flagged as broken/inconsistent and how they were resolved (create this file the first time an issue is found)
- `design-system.md` — complete design tokens exported from Google Stitch (colors, typography, spacing, elevation, shape, component specs) — **the source of truth for all visual values**
- `prompt-desain-google-stitch.md` — the prompt used to generate the design in Stitch (useful for understanding the intent behind an element when the visual reference is unclear)
- `PLAN.md` §7 — design token summary (points back to `design-system.md` for full detail)