/**
 * Placeholder loading dengan efek shimmer (UIUX_MODERNIZATION.md Phase B7).
 */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-surface-container-high via-surface-container-highest to-surface-container-high bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] ${className}`}
    />
  )
}
