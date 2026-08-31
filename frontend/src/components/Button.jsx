import { useCallback } from 'react'

const VARIANTS = {
  primary:
    'bg-primary text-on-primary shadow-level-1 hover:bg-[#0D9488] hover:shadow-level-2 disabled:opacity-40',
  tonal:
    'bg-primary-container text-on-primary-container hover:brightness-[0.98] disabled:opacity-40',
  secondary:
    'bg-surface-container-high text-on-surface hover:bg-surface-container-highest disabled:opacity-40',
  outline:
    'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-40',
  ghost: 'bg-transparent text-primary hover:bg-primary/5 disabled:opacity-40',
  danger: 'bg-error text-on-error hover:brightness-110 disabled:opacity-40',
}

/** Efek ripple M3: span melingkar yang mengembang dari titik sentuh. */
function spawnRipple(e) {
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2
  const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2
  const ripple = document.createElement('span')
  ripple.className = 'ripple'
  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  btn.appendChild(ripple)
  setTimeout(() => ripple.remove(), 650)
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  onPointerDown,
  ...props
}) {
  const handlePointerDown = useCallback(
    (e) => {
      spawnRipple(e)
      onPointerDown?.(e)
    },
    [onPointerDown],
  )

  return (
    <button
      type={type}
      onPointerDown={handlePointerDown}
      className={`relative inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-2 text-body-lg font-medium transition-all duration-200 active:opacity-85 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
