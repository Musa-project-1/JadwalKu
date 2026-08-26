import { Icon } from './Icon'
import {
  getClassType,
  TONE_BORDER_CLASSES,
  TONE_DOT_CLASSES,
  TONE_ICONS,
} from '../lib/classTypes'
import { formatRuang } from '../lib/scheduleUtils'

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
  const dot = TONE_DOT_CLASSES[classType.tone]
  const borderClass = TONE_BORDER_CLASSES[classType.tone] ?? TONE_BORDER_CLASSES.neutral

  const dotIcon = isPast ? 'check' : (TONE_ICONS[classType.tone] ?? 'school')
  const dotBg = isPast
    ? 'bg-surface-variant text-on-surface-variant'
    : 'bg-primary-container text-on-primary-container'

  return (
    <>
      {showNowBefore && (
        <div className="relative my-3 flex items-center gap-2 -ml-6 z-20" aria-hidden="true">
          {/* Pulsing Live Dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-error/30" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-error shadow-xs" />
          </span>
          <span className="h-0.5 flex-grow bg-error/40" />
          {nowLabel && (
            <span className="bg-error/15 dark:bg-error/20 border border-error/50 text-red-700 dark:text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 backdrop-blur-xs shadow-xs">
              SEKARANG {nowLabel}
            </span>
          )}
        </div>
      )}
      
      <div
        className="relative mb-6 animate-[fade-up_250ms_var(--ease-standard)_both]"
        style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
      >
        {/* Timeline Dot (Kecil, di luar kartu, memotong garis vertikal) */}
        <div
          className={`absolute -left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface shadow-sm z-10 ${dotBg}`}
        >
          <Icon name={dotIcon} size={14} />
        </div>

        {/* Kartu Jadwal Utama */}
        <div
          className={`relative ml-4 rounded-2xl bg-surface-container-lowest p-4 shadow-level-1 border border-outline-variant/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-level-2 ${borderClass} ${
            isPast ? 'opacity-60 grayscale-[30%]' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h5 className={`font-semibold text-body-lg text-on-surface ${isPast ? 'line-through' : ''}`}>
                {course?.namaMK ?? entry.kodeMK}
              </h5>
              <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant font-medium">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span>{classType.label} • {entry.jamMulai} - {entry.jamSelesai}</span>
                {course?.dosen && (
                  <span title={course.dosen} className="truncate max-w-[140px] text-on-surface-variant/80">
                    • {course.dosen}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-xs shrink-0">
              <span className="bg-primary-container/20 text-primary px-2.5 py-1 rounded-lg text-xs font-bold">
                {entry.jamMulai}
              </span>
              <button
                type="button"
                onClick={onNoteClick}
                className="p-1 text-on-surface-variant transition-colors hover:text-primary rounded-full hover:bg-surface-container"
                title="Catatan mata kuliah"
                aria-label={`Catatan untuk ${course?.namaMK ?? entry.kodeMK}`}
              >
                <Icon name="note_add" size={18} />
              </button>
            </div>
          </div>

          {/* Sub-Chip Lokasi atau Link Meeting */}
          {classType.tone === 'online' ? (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 px-3 py-2 rounded-xl font-semibold">
              <Icon name="videocam" size={16} />
              <span>Tautan Zoom Meeting (Online)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-on-surface-variant bg-surface-container px-3 py-2 rounded-xl font-semibold dark:bg-surface-container-high">
              <Icon name="location_on" size={16} />
              <span>{formatRuang(entry.ruang, entry.tipeKelas)}</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
