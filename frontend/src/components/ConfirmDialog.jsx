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
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-xl bg-surface-container-lowest p-lg shadow-level-2 dark:bg-surface-container-low"
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
