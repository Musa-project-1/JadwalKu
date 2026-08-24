import { Icon } from './Icon'
import {
  getClassType,
  TONE_TEXT_CLASSES,
  TONE_DOT_CLASSES,
  TONE_BG_CLASSES,
  TONE_ICONS,
} from '../lib/classTypes'

/**
 * Item timeline jadwal hari ini — kartu putih dengan ikon lingkaran
 * berwarna menempel di tepi kiri (sesuai referensi Stitch home).
 * `index` dipakai untuk stagger animation; `showNowBefore` menampilkan
 * garis "sekarang" sebelum item ini.
 */
export function ClassTimelineItem({
  entry,
  course,
  isPast = false,
  onNoteClick,
  index = 0,
  showNowBefore = false,
  nowLabel = '',
}) {
  const classType = getClassType(entry.tipeKelas)
  const text = TONE_TEXT_CLASSES[classType.tone]
  const dot = TONE_DOT_CLASSES[classType.tone]

  return (
    <>
      {showNowBefore && (
        <div className="relative my-1 flex items-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-error ring-4 ring-error/20" />
          <span className="h-0.5 flex-1 bg-error/60" />
          {nowLabel && (
            <span className="text-label-caps font-medium text-error">{nowLabel}</span>
          )}
        </div>
      )}
      <div
        className={`relative ml-5 rounded-xl bg-surface-container-lowest p-md pl-12 shadow-level-1 transition-all duration-200 hover:shadow-level-2 dark:bg-surface-container-low ${
          isPast ? 'opacity-60 hover:opacity-100' : ''
        } animate-[fade-up_250ms_var(--ease-standard)_both]`}
        style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
      >
        {/* Lingkaran ikon menempel di tepi kiri kartu */}
        <div
          className={`absolute -left-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full ring-4 ring-background ${TONE_BG_CLASSES[classType.tone]}`}
        >
          <Icon
            name={TONE_ICONS[classType.tone] ?? TONE_ICONS.neutral}
            size={20}
            className={text}
          />
        </div>
        <div className="mb-xs flex items-start justify-between gap-sm">
          <span className="text-title-md font-medium text-on-surface">
            {course?.namaMK ?? entry.kodeMK}
          </span>
          <button
            type="button"
            onClick={onNoteClick}
            className="p-1 text-on-surface-variant transition-colors hover:text-primary"
            title="Catatan mata kuliah"
            aria-label={`Catatan untuk ${course?.namaMK ?? entry.kodeMK}`}
          >
            <Icon name="note_add" size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-x-md gap-y-xs text-body-sm text-on-surface-variant">
          <span className={`flex items-center gap-xs font-medium ${text}`}>
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            {classType.label}
          </span>
          <span className="flex items-center gap-xs">
            <Icon name="schedule" size={16} />
            {entry.jamMulai} - {entry.jamSelesai}
          </span>
          <span className="flex items-center gap-xs">
            <Icon name="location_on" size={16} />
            {entry.ruang}
          </span>
        </div>
      </div>
    </>
  )
}
