/**
 * Kartu dasar — "JadwalKu Expressive": hyper-rounded 24px, tonal separation
 * tanpa border/shadow (UIUX_MODERNIZATION.md + DESIGN.md v2).
 */
export function Card({
  as: Tag = 'div',
  variant = 'flat',
  className = '',
  children,
  ...props
}) {
  const elevation =
    variant === 'raised'
      ? 'shadow-level-2'
      : 'border border-outline-variant/30 dark:border-white/5'
  return (
    <Tag
      className={`rounded-3xl bg-surface-container-lowest p-md dark:bg-surface-container-low ${elevation} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
