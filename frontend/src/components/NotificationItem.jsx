import { Icon } from './Icon'

const ACCENTS = {
  primary: {
    bar: 'bg-primary',
    iconBg: 'bg-primary/10 text-primary',
    dot: 'bg-primary',
  },
  tertiary: {
    bar: 'bg-tertiary',
    iconBg: 'bg-tertiary/10 text-tertiary',
    dot: 'bg-primary',
  },
  error: {
    bar: 'bg-error',
    iconBg: 'bg-error-container text-on-error-container',
    dot: 'bg-primary',
  },
  secondary: {
    bar: 'bg-secondary-fixed-dim',
    iconBg: 'bg-surface-container-high text-secondary',
    dot: 'bg-primary',
  },
}

/**
 * Satu kartu notifikasi — mengikuti referensi notification_center:
 * bilah warna 4px di tepi kiri, ikon bulat 48px, judul title-md,
 * waktu di kanan atas, deskripsi body-sm, dan titik unread.
 */
export function NotificationItem({ item, onMarkRead }) {
  const accent = ACCENTS[item.accent] ?? ACCENTS.secondary
  const isRead = item.read

  return (
    <button
      type="button"
      onClick={() => onMarkRead?.(item.id)}
      className={`relative w-full overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest p-sm text-left transition-colors hover:bg-surface-bright dark:bg-surface-container-low ${
        isRead ? '' : 'cursor-pointer'
      }`}
      aria-label={isRead ? item.title : `Tandai sudah dibaca: ${item.title}`}
    >
      <span aria-hidden="true" className={`absolute bottom-0 left-0 top-0 w-1 ${accent.bar}`} />
      <div className="flex items-start gap-md">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${accent.iconBg}`}
        >
          <Icon name={item.icon} filled={!isRead} />
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <div className="mb-xs flex items-start justify-between gap-sm">
            <h4 className="text-title-md text-on-surface">{item.title}</h4>
            <span className="shrink-0 text-body-sm text-on-surface-variant">
              {item.timeLabel}
            </span>
          </div>
          <p className="text-body-sm text-secondary">{item.description}</p>
        </div>
        {!isRead && (
          <span
            aria-hidden="true"
            className={`mt-3 h-2 w-2 shrink-0 rounded-full ${accent.dot}`}
          />
        )}
      </div>
    </button>
  )
}
