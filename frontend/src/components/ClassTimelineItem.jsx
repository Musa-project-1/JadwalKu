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
          className={`absolute -left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface shadow-sm z-10 ${
            isPast ? 'bg-surface-variant text-on-surface-variant' : dotBg
          }`}
        >
          <Icon name={dotIcon} size={14} />
        </div>

        {/* Kartu Jadwal Utama */}
        <div
          className={`relative ml-4 rounded-2xl bg-surface-container-lowest p-3.5 tablet:p-4 shadow-level-1 border border-outline-variant/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-level-2 ${borderClass} ${
            isPast ? 'opacity-60 grayscale-[30%]' : ''
          }`}
        >
          {/* Baris 1: Kode MK Badge + Judul Mata Kuliah + Badge Jam Mulai-Selesai & Tombol Catatan */}
          <div className="flex items-start justify-between gap-2.5 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center rounded-lg bg-teal-500/15 text-teal-900 dark:bg-teal-400/20 dark:text-teal-200 px-2.5 py-0.5 font-mono text-[11px] font-extrabold tracking-wider border border-teal-500/30 dark:border-teal-400/40 shadow-2xs">
                  {entry.kodeMK}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-on-surface-variant">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <span>{classType.shortLabel || classType.label}</span>
                </span>
              </div>
              <h5 className={`font-bold text-body-sm tablet:text-body-md text-on-surface leading-snug break-words ${isPast ? 'line-through' : ''}`}>
                {course?.namaMK ?? entry.kodeMK}
              </h5>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary dark:bg-primary/20 px-2.5 py-1 text-label-caps font-bold whitespace-nowrap border border-primary/20">
                <Icon name="schedule" size={13} />
                <span>{entry.jamMulai} - {entry.jamSelesai}</span>
              </span>
              <button
                type="button"
                onClick={onNoteClick}
                className="flex h-7 w-7 items-center justify-center p-1 text-on-surface-variant transition-colors hover:text-primary rounded-full hover:bg-surface-container cursor-pointer"
                title="Catatan mata kuliah"
                aria-label={`Catatan untuk ${course?.namaMK ?? entry.kodeMK}`}
              >
                <Icon name="note_add" size={16} />
              </button>
            </div>
          </div>

          {/* Baris 2: Dosen & Sub-Chip Lokasi */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/10">
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium min-w-0">
              <Icon name="person" size={14} className="text-on-surface-variant/70 shrink-0" />
              <span title={course?.dosen} className="truncate max-w-[200px] tablet:max-w-none text-on-surface-variant/90">
                {course?.dosen || 'Dosen Pengampu -'}
              </span>
            </div>

            {classType.tone === 'online' ? (
              <div className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-500/10 dark:bg-blue-950/30 dark:text-blue-300 px-2.5 py-1 rounded-xl font-bold border border-blue-500/20">
                <Icon name="videocam" size={14} className="shrink-0" />
                <span className="truncate">Online / Zoom Meeting</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-500/10 dark:bg-emerald-950/30 dark:text-emerald-300 px-2.5 py-1 rounded-xl font-bold border border-emerald-500/20">
                <Icon name="location_on" size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">{formatRuang(entry.ruang, entry.tipeKelas)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
