# Design System: JadwalKu Dark Mode

## 1. Visual Theme & Atmosphere
JadwalKu Dark Mode presents a premium, low-light OLED dashboard layout. The visual theme is styled as a soft mechanical terminal with highly diffused ambient depth, subtle glow accents, and sharp typography. All components adhere to concentrated concentric nesting and hardware-like curves.

- **Density:** 5/10 (Balanced text, structured grids)
- **Variance:** 7/10 (Asymmetrical grid cards, floating controls, glowing status indications)
- **Motion:** 6/10 (Spring-ease animations, staggered waterfall reveals, and GPU-safe transitions)

---

## 2. Color Palette & Roles
- **OLED Canvas:** `#080C0E` — Deep dark canvas backdrop surface
- **Surface Cards:** `#111619` — Dark primary card containers and floating dialog sheets
- **Text Main:** `#F1F5F9` (Slate-100) — Primary high-contrast typography
- **Text Muted:** `#94A3B8` (Slate-400) — Secondary label text and description captions
- **Concentric Borders:** `rgba(255, 255, 255, 0.08)` — Faint container hairlines
- **Primary Accent:** `#0D9488` (Teal-600) — Brand focal theme color
- **Accent Dark Glow:** `rgba(13, 148, 136, 0.15)` — Highlight filters and tab selection wells
- **Status Colors (Glow Tints):**
  - **Offline (School):** `#34D399` (Emerald-400 / 15% BG tint)
  - **Online (Zoom):** `#60A5FA` (Blue-400 / 15% BG tint)
  - **Hybrid (Co-present):** `#A78BFA` (Violet-400 / 15% BG tint)
  - **Combined (Groups):** `#FBBF24` (Amber-400 / 15% BG tint)
- **Daily Note Highlight:**
  - **Container Fill:** `rgba(217, 119, 6, 0.08)` (Amber Container 8%)
  - **Left Border Indicator:** `#D97706` (Orange-600 / 60% opacity)
  - **Note Text:** `#FCD34D` (Amber-300)

---

## 3. Typography Rules
- **Display & Headlines:** `Plus Jakarta Sans` or `Outfit` — Geometric shape, slightly tracked-in (-0.02em) for H1/H2 sizes, commanding weight and structure.
- **Body & Labels:** `Plus Jakarta Sans` — Tight, relaxed leading, sentence-case styling, restricted to a maximum of 65 characters per line width.
- **Data & Numbers:** `Geist Mono` or `JetBrains Mono` — Tabular figures enabled (`font-variant-numeric: tabular-nums`) to align time grids and SKS counts symmetrically.
- **Banned:** `Inter` (lacks character), generic system sans-serifs, and classic serif fonts (`Times New Roman`, `Georgia`).

---

## 4. Component Stylings
- **Double-Bezel Card Shells:** Cards are split into concentric layers:
  - **Outer Frame:** Softer border lines (`1px border-outline-variant/15`), outer rounded corners (`rounded-3xl` / 24px), with faint shadow elevations (`shadow-level-1`).
  - **Inner Core Tray:** Darker offset backgrounds (`bg-surface-container-highest/20`), tighter concentric rounded corners (`rounded-2xl` / 16px), nesting inline metadata details (time, room, links).
- **Status left Borders:** High-fidelity event/exam cards contain a solid 4px left-border reflecting the session tone (`offline` / `online` / `hybrid`) to structure the content stream visually.
- **Circular Custom Checkboxes:** Bullet toggles are styled as custom round buttons (`w-6 h-6 rounded-full border-2 border-outline`) that transition smoothly into solid primary fills with checkmark icons.
- **Glass Sticky Date Headers:** Floating date separator rows use `bg-surface/80 backdrop-blur-md` transparency overlays with a thin bottom division line.

---

## 5. Layout Principles
- **Asymmetric Grid Spacing:** Gaps between widgets use responsive spacing clamp guidelines. Vertical lists utilize left padding offsets (`pl-6`) to make timeline vertical threads align symmetrically with card action bubbles.
- **No Overlapping Clashes:** Avoid absolute position stacking. All elements hold clear spatial boundaries.
- **Responsive Stacking:** Desktop multi-column grids collapse to a single-column layout flow under `768px` (mobile viewport limits).
- **Viewport Guardrails:** Full-height layouts are defined via `min-h-[100dvh]` to eliminate mobile address bar screen jumps.

---

## 6. Motion & Interaction
- **Physics Springs:** Transitions bind to heavy spring damping factors (`transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`) for button active pressed scales (`active:scale-[0.97]`).
- **Cascade Mounts:** List items render sequentially using staggered animation delay offsets (`40ms` stagger increments) to create fluid loading entries.
- **Routing View Transitions:** NavLink hooks integrate native SPA fade animations to avoid instant screen jumps.

---

## 7. Anti-Patterns (Banned)
- No emojis inside labels or headings.
- No harsh, pure black drop shadows.
- No neon purple/blue gradient buttons.
- No centered hero layout structures.
- No generic filler names.
- No standard Lucide-style thick-stroked icon packs.

