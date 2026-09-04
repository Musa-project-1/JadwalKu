import { PageCard } from '../PageCard'

/**
 * AdminPageCard - Reusable single-card container for admin pages.
 *
 * Thin wrapper over the generic PageCard so admin & student pages share the
 * exact same "single unified card" visual pattern (one border, one rounded-2xl,
 * border-b section dividers, zero nested card borders).
 */
export function AdminPageCard({ children, className = '' }) {
  return <PageCard className={className}>{children}</PageCard>
}
