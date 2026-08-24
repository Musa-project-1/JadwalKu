import { TONE_CLASSES } from '../lib/classTypes'

export function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-label-caps uppercase ${TONE_CLASSES[tone] ?? TONE_CLASSES.neutral} ${className}`}
    >
      {children}
    </span>
  )
}
