import { useCallback, useLayoutEffect, useState } from 'react'

export function usePortalPosition(open, triggerRef) {
  const [pos, setPos] = useState(null)
  const update = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 6
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = r.left
    const menuW = 224
    if (left + menuW > vw - 8) left = Math.max(8, vw - menuW - 8)
    let top = r.bottom + gap
    const estH = 260
    if (top + estH > vh - 8) top = Math.max(8, r.top - estH - gap)
    setPos({ top, left, width: menuW, triggerWidth: r.width, triggerRight: r.right })
  }, [triggerRef])

  useLayoutEffect(() => {
    if (!open) return
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, update])
  return pos
}
