import { Icon } from './Icon'
import {
  getClassType,
  TONE_TEXT_CLASSES,
  TONE_SUBTEXT_CLASSES,
  TONE_DOT_CLASSES,
  TONE_BG_CLASSES,
} from '../lib/classTypes'

/**
 * Kartu kelas — gaya "JadwalKu Expressive": 24px radius, 4px status bar di
 * kiri, latar tonal 8% tanpa border.
 */
export function ClassCard({ entry, course, onClick, conflicted = false }) {
  const classType = getClassType(entry.tipeKelas)
  const text = TONE_TEXT_CLASSES[classType.tone]
  const subtext = TONE_SUBTEXT_CLASSES[classType.tone]
  const dot = TONE_DOT_CLASSES[classType.tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl p-sm pl-md text-left transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-level-2 ${TONE_BG_CLASSES[classType.tone]} ${
        conflicted ? 'ring-2 ring-error/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-xs">
        <h3 className={`truncate text-title-md font-bold ${text}`}>
          {course?.namaMK ?? entry.kodeMK}
        </h3>
        {conflicted && <Icon name="warning" size={18} className="shrink-0 text-error" />}
      </div>
      <p className={`mt-1 flex items-center gap-1.5 text-body-sm font-semibold ${subtext}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {entry.jamMulai} - {entry.jamSelesai}
      </p>
      <div className={`mt-2 flex items-center gap-1 font-medium ${subtext}`}>
        <Icon name="location_on" size={14} />
        <span className="text-body-sm">{entry.ruang}</span>
        <span className={`ml-auto flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5 text-label-caps dark:bg-white/10 ${text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {classType.label}
        </span>
      </div>
    </button>
  )
}
