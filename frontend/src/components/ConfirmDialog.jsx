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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in max-[599px]:items-end max-[599px]:p-0"
      onClick={onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-2xl outline-none dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 overflow-hidden"
      >
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center -mt-2 mb-3 -mx-2">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>
        <h2 id="confirm-title" className="text-title-md font-bold text-on-surface">{title}</h2>
        {description ? (
          <p className="mt-2 text-body-sm font-medium leading-relaxed text-on-surface-variant">{description}</p>
        ) : null}
        {children}
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
