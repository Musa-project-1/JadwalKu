---
name: Academic Precision
colors:
  surface: '#f5faf8'
  surface-dim: '#d6dbd9'
  surface-bright: '#f5faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f5f2'
  surface-container: '#eaefed'
  surface-container-high: '#e4e9e7'
  surface-container-highest: '#dee4e1'
  on-surface: '#171d1c'
  on-surface-variant: '#3d4947'
  inverse-surface: '#2c3130'
  inverse-on-surface: '#edf2f0'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#924628'
  on-tertiary: '#ffffff'
  tertiary-container: '#b05e3d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#773215'
  background: '#f5faf8'
  on-background: '#171d1c'
  surface-variant: '#dee4e1'
colors-dark:
  # ⚠️ APPROXIMATED — not exported from Stitch/Material Theme Builder.
  # The original Stitch design system export only included the light scheme.
  # These values are derived from the light scheme's "fixed" and "inverse" tokens
  # (which M3 provides specifically for this purpose) plus standard M3 dark-theme
  # conventions. Treat as a reasonable placeholder, not ground truth — replace with
  # a real Material Theme Builder dark export if one becomes available.
  surface: '#0e1513'
  surface-dim: '#0e1513'
  surface-bright: '#343a39'
  surface-container-lowest: '#090f0e'
  surface-container-low: '#171d1c'
  surface-container: '#1b211f'
  surface-container-high: '#252b2a'
  surface-container-highest: '#303634'
  on-surface: '#dee4e1'
  on-surface-variant: '#bcc9c6'
  inverse-surface: '#dee4e1'
  inverse-on-surface: '#2c3130'
  outline: '#879390'
  outline-variant: '#3d4947'
  surface-tint: '#6bd8cb'
  primary: '#6bd8cb'
  on-primary: '#00382f'
  primary-container: '#005049'
  on-primary-container: '#89f5e7'
  inverse-primary: '#00685f'
  secondary: '#b7c8e1'
  on-secondary: '#1f2f3f'
  secondary-container: '#38485d'
  on-secondary-container: '#d3e4fe'
  tertiary: '#ffb59a'
  on-tertiary: '#5c1900'
  tertiary-container: '#773215'
  on-tertiary-container: '#ffdbce'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#773215'
  background: '#0e1513'
  on-background: '#dee4e1'
  surface-variant: '#3d4947'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar-width: 280px
  container-max: 1280px
---

## Brand & Style
The design system is built for "Jadwal Kampus," an academic scheduling platform that demands clarity, focus, and efficiency. The brand personality is organized, dependable, and modern.

The design style follows a **Modern Minimalist** approach. It utilizes a flat aesthetic with no gradients, focusing on high-quality typography and intentional white space to reduce cognitive load. Interaction is communicated through crisp color shifts and subtle elevation changes rather than decorative effects. The interface should feel like a high-performance tool that fades into the background, allowing the schedule data to remain the primary focus.

## Colors
This design system employs a focused palette designed for high legibility in both light and dark environments.

- **Primary (Teal):** Used for primary actions, active navigation states, and key brand moments.
- **Secondary (Slate):** Used for secondary text, icons, and neutral interactive states.
- **Backgrounds:** A soft off-white (`#F8FAFC`) for light mode to reduce eye strain and a deep navy-slate (`#0F172A`) for dark mode to maintain contrast without harshness.
- **Semantic Status:**
    - **Offline:** Success Green, for physical classroom locations.
    - **Online:** Blue, representing digital connectivity.
    - **Hybrid:** Purple, a distinct mix for blended learning.
    - **Conflict/Combined:** Amber, used for warnings or schedule overlaps.

**⚠️ Dark mode note:** the `colors` block above (light scheme) is the original Stitch export. The `colors-dark` block is a **derived approximation**, not an original Stitch export — Stitch's reference screens were only generated in light mode. It was constructed from the light scheme's `-fixed` and `inverse-*` tokens (which M3 provides specifically to make this kind of derivation possible) plus standard Material 3 dark-theme conventions. Use it as a working placeholder; if a real dark-mode export from Stitch or Material Theme Builder becomes available later, replace `colors-dark` with the exact values and remove this note.

## Typography
The system uses **Inter** exclusively to ensure maximum readability across all platforms. The hierarchy is strictly enforced to help students quickly scan complex schedules.

Use `display` and `headline-lg` for dashboard overviews. `title-md` is the primary style for course names within cards. `label-caps` should be used for secondary metadata like room numbers or timestamps. In dark mode, ensure body text uses a slightly desaturated white (Slate-200) to prevent "vibration" against the dark background.

## Layout & Spacing
The design system operates on an **8px linear grid**. All dimensions, padding, and margins must be multiples of 8px (or 4px for fine-tuned micro-adjustments).

**Desktop Layout:**
- **Persistent Left Sidebar:** Fixed at 280px. Contains primary navigation.
- **Main Content:** Fluid area with a max-width of 1280px, centered.
- **Gutter:** 24px between grid items.

**Mobile Layout:**
- **Margins:** 16px side margins.
- **Navigation:** Transition from sidebar to a **Bottom Navigation Bar** for thumb-friendly access to the schedule, search, and profile.
- **Reflow:** Schedule columns stack vertically or transition to a horizontal-scroll "Day View."

## Elevation & Depth
In keeping with the minimalist flat style, the design system uses **Tonal Layering** supplemented by extremely subtle shadows.

- **Level 0 (Base):** The main background color (#F8FAFC / #0F172A).
- **Level 1 (Cards/Surface):** Pure White (Light) or Slate-900 (Dark). Use a very soft, diffused shadow: `0 4px 6px -1px rgb(0 0 0 / 0.1)`.
- **Level 2 (Modals/Popovers):** Higher contrast shadow to separate from the surface: `0 10px 15px -3px rgb(0 0 0 / 0.1)`.

Avoid any inner shadows or bevels. Depth is primarily communicated through the contrast between the base background and card surfaces.

## Shapes
The visual language uses a **Rounded** aesthetic to feel approachable and modern.

- **Cards & Containers:** Use a 12px or 16px radius (`rounded-lg` to `rounded-xl`) to soften the dense information of a schedule.
- **Buttons & Inputs:** Standardized at 8px (`rounded-md`).
- **Chips/Badges:** Use a full pill shape (999px) to distinguish them from interactive buttons.
- **Focus States:** 2px solid Teal border with a 4px offset.

## Components

### Buttons
- **Primary:** Solid Teal background, White text. No gradient. On hover, darken to `#0D9488`.
- **Secondary:** Slate-100 background (Light) or Slate-800 (Dark). Slate-700/300 text.
- **Ghost:** No background, Teal text. Used for less prominent actions.

### Schedule Cards
- **Structure:** 12px padding, 16px corner radius.
- **Indicator:** A 4px vertical bar on the left side of the card using the **Status Colors** (Online/Offline/Hybrid) to categorize the class type at a glance.
- **Typography:** Title in `title-md`, time/location in `body-sm` using secondary color.

### Chips & Badges
- Used for "Course Codes" or "Tags."
- Small text, high-contrast background (e.g., light teal background with dark teal text).

### Input Fields
- 1px Slate-200 border. Transitions to 2px Teal border on focus.
- Placeholder text in Slate-400.

### Sidebar (Desktop)
- Active state indicated by a Teal vertical pill on the left edge and a subtle background tint (Teal at 5% opacity).
- Icons should be stroke-based (2px width) for a clean, architectural look.