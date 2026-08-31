import { Icon } from './Icon'
import {
  getClassType,
  TONE_TEXT_CLASSES,
  TONE_SUBTEXT_CLASSES,
  TONE_BG_CLASSES,
  TONE_ICONS,
  TONE_SHADOW_CLASSES,
  TONE_CARD_BORDER_CLASSES,
  TONE_TIME_PILL_CLASSES,
  TONE_ICON_COLOR_CLASSES,
} from '../lib/classTypes'
import { formatRuang } from '../lib/scheduleUtils'

/**
 * Kartu kelas jadwal — Desain modern terpadu per tipe kelas:
 * 1. Baris 1: Ikon tipe kelas di kiri & Badge Jam (Pill solid) di kanan
 * 2. Baris 2: Nama mata kuliah rata tengah (15px font-medium)
 * 3. Baris 3: Ikon lokasi + Ruang kelas / Online Zoom rata tengah (12px font-normal)
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
  const shadowClass = TONE_SHADOW_CLASSES[classType.tone]
  const borderClass = TONE_CARD_BORDER_CLASSES[classType.tone]
  const timePillClass = TONE_TIME_PILL_CLASSES[classType.tone]
  const iconColor = TONE_ICON_COLOR_CLASSES[classType.tone]
  const isOnline =
    entry.tipeKelas === 'K2' ||
    String(entry.ruang || '').toLowerCase().includes('zoom') ||
    String(entry.ruang || '').toLowerCase().includes('online')

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-auto min-h-fit rounded-2xl p-3.5 text-left flex flex-col justify-between cursor-pointer transition-shadow duration-200 hover:shadow-md ${
        TONE_BG_CLASSES[classType.tone]
      } ${borderClass} ${shadowClass} ${conflicted ? 'ring-2 ring-error/60' : ''}`}
    >
      {/* 1. Baris Pertama: Ikon tipe kelas di kiri & Badge Jam (pill solid) di kanan */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon name={iconName} size={18} className={iconColor} />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${iconColor}`}>
            {entry.tipeKelas || 'K1'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {transition && (
            <span
              className="flex h-5 items-center gap-1 px-1.5 rounded-full bg-orange-500/20 text-orange-800 dark:text-orange-300 text-[10px] font-bold border border-orange-500/30"
              title={transition.message}
            >
              <Icon name="directions_run" size={11} />
            </span>
          )}
          {note && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300"
              title="Memiliki catatan"
            >
              <Icon name="sticky_note_2" size={11} />
            </span>
          )}
          {conflicted && <Icon name="warning" size={15} className="shrink-0 text-error" />}
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight shadow-xs ${timePillClass}`}>
            {entry.jamMulai} - {entry.jamSelesai}
          </span>
        </div>
      </div>

      {/* 2. Baris Kedua: Nama Mata Kuliah Rata Tengah (15px font-bold, 2 baris wrap ter-highlight) */}
      <h3 className={`mt-2.5 text-center text-[15px] font-bold tracking-tight leading-snug whitespace-normal break-words line-clamp-2 ${text}`}>
        {course?.namaMK ?? entry.kodeMK}
      </h3>

      {/* 3. Spasi tambahan ~12px & Baris Terakhir: Ikon Lokasi + Nama Ruang Kelas Rata Tengah (12px font-normal) */}
      <div className={`mt-3 flex items-center justify-center gap-1 text-[12px] font-normal leading-tight opacity-90 ${subtext}`}>
        <Icon name={isOnline ? 'videocam' : 'location_on'} size={13} className="shrink-0" />
        <span className="truncate">{formatRuang(entry.ruang, entry.tipeKelas)}</span>
      </div>
    </button>
  )
}
