/**
 * PageCard - Reusable single-card container for any page.
 *
 * Enforces:
 * - Single outer card with border (0.5px / outline-variant) and rounded-2xl
 * - Zero nested card borders or double rounded corners
 * - Clean border-b dividers between sections (Header -> Toolbar -> Table -> Footer)
 * - Zero vertical scroll leak for dense viewport fit
 *
 * Use this to wrap a page's header + content in ONE unified box, following the
 * same pattern used across the Admin Console. Nested cards/toolbars should NOT
 * add their own outer border/rounded/shadow — only section dividers (border-b).
 */
export function PageCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low shadow-xs flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden ${className}`}
      style={{ border: '0.5px solid var(--color-outline-variant, rgba(120, 120, 120, 0.2))' }}
    >
      {children}
    </div>
  )
}
