import { Icon } from './Icon'

const ACCENTS = {
  primary: {
    border: 'border-l-[4px] border-primary',
    iconBg: 'bg-primary/10 text-primary',
    dot: 'bg-primary',
  },
  tertiary: {
    border: 'border-l-[4px] border-tertiary',
    iconBg: 'bg-tertiary/10 text-tertiary',
    dot: 'bg-tertiary',
  },
  error: {
    border: 'border-l-[4px] border-error',
    iconBg: 'bg-error-container text-on-error-container dark:bg-error/15 dark:text-error',
    dot: 'bg-error',
  },
  secondary: {
    border: 'border-l-[4px] border-outline-variant',
    iconBg: 'bg-surface-container-high text-secondary-fixed-dim dark:bg-surface-container-high/40',
    dot: 'bg-outline-variant',
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
      className={`group relative w-full overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 text-left transition-all duration-200 hover:bg-surface-bright dark:bg-surface-container-low ${accent.border} ${
        isRead ? 'opacity-65 cursor-default' : 'cursor-pointer hover:shadow-md'
      }`}
      aria-label={isRead ? item.title : `Tandai sudah dibaca: ${item.title}`}
    >
      <div className="flex items-start gap-md">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-200 group-hover:brightness-105 active:opacity-80 ${accent.iconBg}`}
        >
          <Icon name={item.icon} filled={!isRead} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="mb-xs flex items-start justify-between gap-sm">
            <h4 className="text-title-md text-on-surface font-semibold group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            <span className="shrink-0 text-body-sm text-on-surface-variant/80 font-medium">
              {item.timeLabel}
            </span>
          </div>
          <p className="text-body-sm text-secondary font-medium">{item.description}</p>
        </div>
        {!isRead && (
          <span
            aria-hidden="true"
            className={`mt-3 h-2 w-2 shrink-0 rounded-full animate-pulse ${accent.dot}`}
          />
        )}
      </div>
    </button>
  )
}
