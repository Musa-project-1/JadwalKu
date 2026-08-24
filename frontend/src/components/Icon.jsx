/**
 * Material Symbols Outlined icon (font-based, sesuai referensi desain Stitch).
 *
 * @param {{ name: string, size?: number|string, filled?: boolean, className?: string }} props
 */
export function Icon({ name, size = 24, filled = false, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  )
}
