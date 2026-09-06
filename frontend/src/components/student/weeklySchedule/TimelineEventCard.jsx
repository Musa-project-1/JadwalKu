import { Icon } from '../../Icon'
import {
  TONE_BG_CLASSES,
  TONE_TEXT_CLASSES,
  TONE_SUBTEXT_CLASSES,
  TONE_ICONS,
  TONE_SHADOW_CLASSES,
  TONE_CARD_BORDER_CLASSES,
  TONE_TIME_PILL_CLASSES,
  TONE_ICON_COLOR_CLASSES,
  getClassType,
} from '../../../lib/classTypes'
import { formatRuang } from '../../../lib/scheduleUtils'

export function TimelineEventCard({
  entry,
  course,
  conflicted,
  noteText,
  transition,
  top,
  height,
  openDetail,
}) {
  const classType = getClassType(entry.tipeKelas)
  const borderClass = TONE_CARD_BORDER_CLASSES[classType.tone] ?? TONE_CARD_BORDER_CLASSES.neutral
  const iconName = TONE_ICONS[classType.tone] ?? 'corporate_fare'
  const shadowClass = TONE_SHADOW_CLASSES[classType.tone]
  const timePillClass = TONE_TIME_PILL_CLASSES[classType.tone]
  const iconColor = TONE_ICON_COLOR_CLASSES[classType.tone]
  const text = TONE_TEXT_CLASSES[classType.tone]
  const subtext = TONE_SUBTEXT_CLASSES[classType.tone]
  const isOnline =
    entry.tipeKelas === 'K2' ||
    String(entry.ruang || '').toLowerCase().includes('zoom') ||
    String(entry.ruang || '').toLowerCase().includes('online')

  return (
    <button
      key={entry.id}
      type="button"
      onClick={() => openDetail(entry)}
      style={{ top: top + 2, minHeight: height, height: 'auto' }}
      className={`absolute inset-x-1 z-10 rounded-2xl p-2.5 text-left transition-shadow duration-200 hover:z-30 hover:shadow-level-2 flex flex-col justify-between cursor-pointer ${
        TONE_BG_CLASSES[classType.tone]
      } ${borderClass} ${shadowClass} ${conflicted ? 'ring-2 ring-error/60' : ''}`}
      title={`${course?.namaMK ?? entry.kodeMK} · ${entry.jamMulai}-${entry.jamSelesai} · ${formatRuang(entry.ruang, entry.tipeKelas)}`}
    >
      <div className="flex items-center justify-between w-full shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon name={iconName} size={16} className={iconColor} />
          <span className={`text-label-caps font-bold uppercase tracking-wider ${iconColor}`}>
            {entry.tipeKelas || 'K1'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {transition && (
            <span
              className="flex h-4 items-center gap-0.5 px-1 rounded-full bg-orange-500/20 text-orange-800 dark:text-orange-300 text-label-caps font-bold border border-orange-500/30"
              title={transition.message}
            >
              <Icon name="directions_run" size={9} />
            </span>
          )}
          {noteText && (
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300"
              title={`Catatan: ${noteText}`}
            >
              <Icon name="sticky_note_2" size={9} />
            </span>
          )}
          {conflicted && <Icon name="warning" size={13} className="shrink-0 text-error" />}
          <span className={`px-2 py-0.5 rounded-full text-body-xs font-bold tracking-tight shadow-level-1 ${timePillClass}`}>
            {entry.jamMulai} - {entry.jamSelesai}
          </span>
        </div>
      </div>

      <h3 className={`my-2 text-center text-body-xs font-bold tracking-tight leading-snug whitespace-normal break-words line-clamp-2 w-full ${text}`}>
        {course?.namaMK ?? entry.kodeMK}
      </h3>

      <div className={`flex items-center justify-center gap-1 text-[11px] font-normal leading-tight opacity-90 w-full ${subtext}`}>
        <Icon name={isOnline ? 'videocam' : 'location_on'} size={13} className="shrink-0" />
        <span className="truncate">{formatRuang(entry.ruang, entry.tipeKelas)}</span>
      </div>
    </button>
  )
}
