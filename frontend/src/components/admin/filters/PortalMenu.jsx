import { createPortal } from 'react-dom'
import { usePortalPosition } from './usePortalPosition'

export function PortalMenu({ open, triggerRef, widthClass = 'w-56', align = 'left', children }) {
  const pos = usePortalPosition(open, triggerRef)
  if (!open || !pos) return null
  const wMap = { 'w-56': 224, 'w-48': 192, 'w-44': 176, 'w-72': 288, 'w-80': 320 }
  const w = wMap[widthClass] || 224
  const left = align === 'right'
    ? Math.max(8, (pos.triggerRight || pos.left + w) - w)
    : pos.left
  return createPortal(
    <div
      data-portal-menu
      style={{ position: 'fixed', top: pos.top, left, width: w, zIndex: 9999 }}
      className={`rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-level-3 dark:bg-surface-container-high animate-fade-up ${
        widthClass.includes('w-72') || widthClass.includes('w-80') ? 'rounded-3xl p-3' : ''
      }`}
    >
      {children}
    </div>,
    document.body,
  )
}
