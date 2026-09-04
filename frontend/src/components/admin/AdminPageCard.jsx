/**
 * AdminPageCard - Reusable single-card container for admin pages.
 * 
 * Enforces:
 * - Single outer card with border (0.5px / outline-variant) and rounded-2xl (12-16px)
 * - Zero nested card borders or double rounded corners
 * - Clean border-b dividers between sections (Header -> Filter/Toolbar -> Table -> Footer)
 * - Zero vertical scroll leak for dense viewport fit
 */
export function AdminPageCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low shadow-xs flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden ${className}`}
      style={{ border: '0.5px solid var(--color-outline-variant, rgba(120, 120, 120, 0.2))' }}
    >
      {children}
    </div>
  )
}
