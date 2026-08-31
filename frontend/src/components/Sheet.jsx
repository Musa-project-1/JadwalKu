import { useEffect, useRef, useCallback } from 'react'

/**
 * Sheet — modal primitive (MOBILE_REDESIGN.md F2).
 *
 * - <600px (mobile): bottom sheet — `sheet-up` entrance, drag-handle bar,
 *   `max-h-[90vh] overflow-y-auto`, safe-area bottom padding.
 * - >=600px (tablet/desktop): centered dialog — identical to the previous
 *   centered modals (rounded-3xl, fade-up), so desktop rendering is unchanged.
 *
 * Replaces ad-hoc modal wrappers (AddTaskForm, admin CRUD dialogs) with one
 * accessible, consistent pattern.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconBg = 'bg-primary/10 text-primary',
  children,
  footer,
  className = '',
  panelClassName = '',
  maxWidthClass = 'max-w-lg',
}) {
  const panelRef = useRef(null)

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return undefined
    document.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] animate-[fade-in_200ms_var(--ease-standard)_both] tablet:items-center tablet:p-4"
      onClick={onClose}
    >
      {/* Blocker klik di dalam panel tidak boleh menutup sheet */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full overflow-hidden rounded-t-3xl bg-surface-container-lowest shadow-2xl outline-none animate-[sheet-up_300ms_var(--ease-emphasized)_both] tablet:rounded-3xl tablet:animate-[fade-up_250ms_var(--ease-standard)_both] dark:bg-surface-container-low ${maxWidthClass} ${panelClassName}`}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 tablet:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Optional header (icon + title), mirrors existing modal headers */}
        {(title || subtitle || icon) && (
          <header className="flex items-center justify-between gap-3 border-b border-outline-variant/15 px-5 pb-4 pt-3 tablet:p-6 tablet:pb-4">
            <div className="flex min-w-0 items-center gap-3">
              {icon && (
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 ${iconBg}`}
                >
                  {icon}
                </span>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 id="sheet-title" className="truncate text-title-md font-bold text-on-surface">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-body-xs font-medium text-on-surface-variant">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer"
            >
              <IconClose />
            </button>
          </header>
        )}

        {/* Body — scrollable, safe-area aware on mobile */}
        <div className={`max-h-[calc(90vh-7rem)] overflow-y-auto p-5 pb-safe tablet:max-h-[calc(85vh-7rem)] tablet:p-6 ${className}`}>
          {children}
        </div>

        {/* Optional sticky footer (action buttons) */}
        {footer && (
          <div className="border-t border-outline-variant/15 px-5 py-4 tablet:px-6">{footer}</div>
        )}
      </div>
    </div>
  )
}

function IconClose() {
  // Inline close glyph to avoid importing Icon (keeps Sheet dependency-light).
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  )
}
