import { Icon } from '../Icon'
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
} from '../../lib/classTypes'
import { formatRuang } from '../../lib/scheduleUtils'

/**
 * TimetableClassCard — 1:1 identik dengan ClassCard asli JadwalKu:
 * - Baris 1: Ikon tipe kelas di kiri & Badge Jam (Pill solid) di kanan
 * - Baris 2: Nama mata kuliah rata tengah (15px font-bold, 2 baris ter-highlight)
 * - Baris 3: Ikon lokasi + Ruangan / Zoom rata tengah
 * - Tambahan: Indikator bentrok waktu sholat jika ada
 */
export function TimetableClassCard({
  entry,
  course,
  clashInfo,
  isOngoing = false,
  isPassed = false,
  conflicted = false,
  note = '',
  transition = null,
  onOpenDetail,
  language = 'id',
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
      onClick={() => onOpenDetail && onOpenDetail(entry, course)}
      className={`w-full text-left rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-level-2 hover:-translate-y-0.5 select-none ${
        TONE_BG_CLASSES[classType.tone]
      } ${borderClass} ${shadowClass} ${
        isOngoing
          ? 'ring-2 ring-primary shadow-level-2 animate-[soft-pulse_2s_ease-in-out_infinite]'
          : isPassed
          ? 'opacity-65 hover:opacity-100'
          : conflicted
          ? 'ring-2 ring-error/60'
          : ''
      }`}
    >
      {/* 1. Baris Pertama: Ikon tipe kelas di kiri & Badge Jam (pill solid) di kanan */}
      <div className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1 min-w-0 shrink-0">
          <Icon name={iconName} size={14} className={iconColor} />
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${iconColor}`}>
            {entry.tipeKelas || 'K1'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {transition && (
            <span
              className="flex h-3.5 items-center px-0.5 rounded-full bg-orange-500/20 text-orange-800 dark:text-orange-300 text-[9px] font-bold border border-orange-500/30"
              title={transition.message}
            >
              <Icon name="directions_run" size={8} />
            </span>
          )}
          {note && (
            <span
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300"
              title={`Catatan: ${note}`}
            >
              <Icon name="sticky_note_2" size={8} />
            </span>
          )}
          {conflicted && <Icon name="warning" size={12} className="shrink-0 text-error" />}
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-xs whitespace-nowrap leading-none ${timePillClass}`}>
            {entry.jamMulai}-{entry.jamSelesai}
          </span>
        </div>
      </div>

      {/* 2. Baris Kedua: Nama Mata Kuliah Rata Tengah */}
      <h3 className={`my-1.5 text-center text-[12px] font-bold tracking-tight leading-snug whitespace-normal break-words line-clamp-2 w-full ${text}`}>
        {course?.namaMK ?? entry.kodeMK}
      </h3>

      {/* 3. Baris Terakhir: Ikon Lokasi + Nama Ruang Kelas Rata Tengah */}
      <div className={`flex items-center justify-center gap-1 text-[10.5px] font-medium leading-tight opacity-90 w-full min-w-0 ${subtext}`}>
        <Icon name={isOnline ? 'videocam' : 'location_on'} size={12} className="shrink-0" />
        <span className="truncate max-w-[90%]">{formatRuang(entry.ruang, entry.tipeKelas)}</span>
      </div>

      {/* 4. Indikator Peringatan Bentrok Waktu Sholat jika ada */}
      {clashInfo?.hasClash && (
        <div
          className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-amber-500/20 border border-amber-500/35 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-900 dark:text-amber-200 w-full text-center leading-tight whitespace-normal"
          title={language === 'en' ? clashInfo.labelEn : clashInfo.label}
        >
          <Icon name="mosque" size={11} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{language === 'en' ? (clashInfo.type === 'friday' ? 'Friday Prayer' : clashInfo.labelEn) : clashInfo.label}</span>
        </div>
      )}
    </button>
  )
}
