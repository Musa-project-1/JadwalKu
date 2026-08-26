# Design System: JadwalKu Light Mode

## 1. Visual Theme & Atmosphere
JadwalKu is a fluid, modern academic scheduling companion. The atmosphere is structured yet breathing—balancing information density with generous whitespace and concentric geometry. Motion is simulated with natural spring physics to make the interface feel tactile and alive.

- **Density:** 5/10 (Balanced, clean layouts with breathing margins)
- **Variance:** 7/10 (Asymmetric alignments, offset card components, dynamic header areas)
- **Motion:** 6/10 (Fluid SPA page transitions, spring-physics micro-interactions on hovers and clicks)

---

## 2. Color Palette & Roles
- **Canvas Backdrop:** `#F8FAFC` (Slate-50) — Main page background surface
- **Surface Cards:** `#FFFFFF` — Primary container cards and sheet elements
- **Text Main:** `#0F172A` (Slate-900) — Primary typography color
- **Text Muted:** `#64748B` (Slate-500) — Secondary body copy, labels, and timestamps
- **Concentric Borders:** `rgba(226, 232, 240, 0.4)` (Slate-200, 40%) — Shell boundaries
- **Primary Accent:** `#00685f` (Deep Teal) — Primary brand theme color
- **Accent Light:** `rgba(0, 104, 95, 0.1)` — Active tabs and nav selections
- **Status Colors:**
  - **Offline (School):** `#10B981` (Emerald-500)
  - **Online (Zoom):** `#3B82F6` (Blue-500)
  - **Hybrid (Co-present):** `#8B5CF6` (Violet-500)
  - **Combined (Groups):** `#F59E0B` (Amber-500)
- **Daily Note Highlight:**
  - **Container Fill:** `#FFE4D6` (Warm Peach)
  - **Left Border Indicator:** `#D97706` (Orange-600)
  - **Note Text:** `#92400E` (Brown-800)

---

## 3. Typography Rules
- **Display & Headlines:** `Plus Jakarta Sans` or `Outfit` — Geometric, slightly tracked-in (-0.02em) for H1/H2 sizes, commanding weight and structure.
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

