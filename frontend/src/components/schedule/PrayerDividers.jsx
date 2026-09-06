import { Icon } from '../Icon'

export function PrayerDividerRow({ name, time, colSpan, hasFriday = false, language }) {
  return (
    <tr className="bg-surface-container-low/60 dark:bg-surface-container-high/30">
      <td colSpan={colSpan} className="py-1 px-3 border-y border-outline-variant/20">
        <div className="flex items-center gap-2 text-label-caps font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-container-high/80 text-on-surface border border-outline-variant/25 shadow-2xs font-mono">
            <Icon name="mosque" size={13} className="text-secondary" />
            <span>{name} · {time}</span>
          </span>
          {name === 'Dzuhur' && hasFriday && (
            <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {language === 'en' ? '🕌 Friday Prayer: 11.30 – 13.00' : '🕌 Khusus Jumat: 11.30 – 13.00'}
            </span>
          )}
          <div className="flex-1 border-t border-dashed border-outline-variant/30" />
        </div>
      </td>
    </tr>
  )
}

export function MobilePrayerDivider({ name, time, isFriday = false, language }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-container-high/80 text-on-surface border border-outline-variant/25 text-label-caps font-bold font-mono">
        <Icon name="mosque" size={13} className="text-secondary" />
        <span>{name} · {time}</span>
      </span>
      {isFriday && (
        <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-semibold">
          {language === 'en' ? 'Friday Prayer' : 'Sholat Jumat'}
        </span>
      )}
      <div className="flex-1 border-t border-dashed border-outline-variant/30" />
    </div>
  )
}
