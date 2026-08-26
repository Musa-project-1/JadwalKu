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

function getLecturerInitials(name) {
  if (!name) return '?'
  const cleaned = name
    .replace(/(?:Dr\.|Ir\.|Prof\.|Drs\.|M\.Kom|S\.Kom|M\.T\.|S\.T\.|M\.Sc|M\.Si|S\.Si|Ph\.D)\b/gi, '')
    .replace(/[,.]/g, '')
    .trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 0) return name.slice(0, 2).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * Kartu kelas mingguan — ditingkatkan dengan icon chip tipe kelas,
 * nama & avatar inisial dosen, tinted shadow, dan hierarki judul MK yang tegas.
 */
export function ClassCard({ entry, course, onClick, conflicted = false }) {
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
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 ${TONE_BG_CLASSES[classType.tone]} ${shadowClass} ${
        conflicted ? 'ring-2 ring-error/50' : ''
      }`}
    >
      {/* 1. Baris Atas: Chip Ikon + Kode Tipe Kelas (K1, K2, GBK1, HBH, dst.) */}
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
        {conflicted && <Icon name="warning" size={16} className="shrink-0 text-error" />}
      </div>

      {/* 2. Judul Mata Kuliah */}
      <h3 className={`mt-2.5 truncate text-title-md font-bold leading-tight ${text}`}>
        {course?.namaMK ?? entry.kodeMK}
      </h3>

      {/* 3. Jam Mulai – Selesai & Ruangan */}
      <p className={`mt-1 text-body-sm font-medium ${subtext}`}>
        {entry.jamMulai} – {entry.jamSelesai}
        <span className="opacity-75"> • {formatRuang(entry.ruang, entry.tipeKelas)}</span>
      </p>

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
  )
}
