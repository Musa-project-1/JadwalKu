import { useEffect, useRef } from 'react'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  children,
}) {
  const dialogRef = useRef(null)

  // Escape menutup dialog + fokus dipindahkan ke dialog saat terbuka (a11y).
  useEffect(() => {
    if (!open) return undefined
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        tabIndex={-1}
        // Klik di dalam panel tidak boleh menutup dialog.
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-surface-container-lowest p-lg shadow-level-2 outline-none dark:bg-surface-container-low"
      >
        <h2 id="confirm-title" className="text-title-md text-on-surface">{title}</h2>
        {description ? (
          <p className="mt-2 text-body-lg text-on-surface-variant">{description}</p>
        ) : null}
        {children}
        <div className="mt-lg flex justify-end gap-sm">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
