import { Icon } from './Icon'
import {
  getClassType,
  TONE_TEXT_CLASSES,
  TONE_SUBTEXT_CLASSES,
  TONE_BG_CLASSES,
  TONE_ICONS,
  TONE_CHIP_BG_CLASSES,
  TONE_SHADOW_CLASSES,
  TONE_DIVIDER_CLASSES,
} from '../lib/classTypes'
import { formatRuang } from '../lib/scheduleUtils'
import { getLecturerInitials } from '../lib/lecturerUtils'

/**
 * Kartu kelas mingguan — ditingkatkan dengan icon chip tipe kelas,
 * nama & avatar inisial dosen, tinted shadow, indikator catatan, dan peringatan pindah ruang berurutan.
 */
export function ClassCard({
  entry,
  course,
  onClick,
  conflicted = false,
  note = '',
  transition = null,
}) {
  const classType = getClassType(entry.tipeKelas)
  const text = TONE_TEXT_CLASSES[classType.tone]
  const subtext = TONE_SUBTEXT_CLASSES[classType.tone]
  const iconName = TONE_ICONS[classType.tone] ?? 'corporate_fare'
  const chipBg = TONE_CHIP_BG_CLASSES[classType.tone]
  const shadowClass = TONE_SHADOW_CLASSES[classType.tone]
  const dividerClass = TONE_DIVIDER_CLASSES[classType.tone]

  const lecturerName = course?.dosen || ''
  const lecturerInitials = getLecturerInitials(lecturerName)

  return (
    <div className={`rounded-2xl p-0.5 bg-surface-container/30 border border-outline-variant/10 shadow-2xs hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      conflicted ? 'ring-2 ring-error/50' : ''
    }`}>
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-[calc(1rem-0.125rem)] p-3.5 text-left ${TONE_BG_CLASSES[classType.tone]} ${shadowClass} shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] focus:outline-none`}
      >
        {/* 1. Baris Atas: Chip Ikon + Kode Tipe Kelas + Indikator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-[24px] w-[24px] items-center justify-center rounded-md ${chipBg}`}
              aria-hidden="true"
            >
              <Icon name={iconName} size={15} />
            </span>
            <span className={`text-label-caps font-bold tracking-wide ${text}`}>
              {entry.tipeKelas || 'K1'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {transition && (
              <span
                className="flex h-5 items-center gap-1 px-2 rounded-full bg-orange-500/20 text-orange-800 dark:text-orange-300 text-[10px] font-bold shadow-2xs border border-orange-500/30"
                title={transition.message}
              >
                <Icon name="directions_run" size={12} />
                <span>{transition.gapMinutes}m</span>
              </span>
            )}
            {note && (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-2xs"
                title="Memiliki catatan"
              >
                <Icon name="sticky_note_2" size={13} />
              </span>
            )}
            {conflicted && <Icon name="warning" size={16} className="shrink-0 text-error" />}
          </div>
        </div>

        {/* 2. Judul Mata Kuliah */}
        <h3 className={`mt-2.5 truncate text-title-md font-bold leading-tight ${text}`}>
          {course?.namaMK ?? entry.kodeMK}
        </h3>

        {/* 3. Jam Mulai - Selesai & Ruangan */}
        <p className={`mt-1 text-body-sm font-medium ${subtext}`}>
          {entry.jamMulai} - {entry.jamSelesai}
          <span className="opacity-75"> • {formatRuang(entry.ruang, entry.tipeKelas)}</span>
        </p>

        {/* 3.5. Transition Warning Banner (if tight back-to-back transition) */}
        {transition && (
          <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 px-2.5 py-1 text-orange-950 dark:text-orange-200">
            <Icon name="directions_run" size={13} className="text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="truncate text-[10.5px] font-bold">
              {transition.message}
            </span>
          </div>
        )}

        {/* 3.6. Note Snippet Preview (if available) */}
        {note && (
          <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-amber-950 dark:text-amber-200">
            <Icon name="sticky_note_2" size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate text-[11px] font-semibold">
              {note}
            </span>
          </div>
        )}

        {/* 4. Garis Pembatas Halus */}
        <div className={`mt-3 border-t ${dividerClass}`} />

        {/* 5. Baris Bawah: Avatar Inisial Dosen + Nama Dosen */}
        <div className="mt-2.5 flex items-center gap-2">
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold select-none ${chipBg}`}
            aria-hidden="true"
          >
            {lecturerInitials}
          </span>
          <span title={lecturerName} className={`truncate text-body-xs font-medium ${subtext}`}>
            {lecturerName || 'Dosen belum ditentukan'}
          </span>
        </div>
      </button>
    </div>
  )
}
