import { Icon } from '../Icon'
import { TimetableClassCard } from './TimetableClassCard'
import { checkPrayerClash, parseTimeToMinutes } from '../../lib/scheduleGridUtils'

export function MobileSessionSection({
  sessionDef,
  items,
  courseMap,
  activeDay,
  todayName,
  currentMinutes,
  prayerTimes,
  language,
  onOpenDetail,
}) {
  const isToday = activeDay === todayName

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-label-caps font-bold text-on-surface-variant">
        <Icon name={sessionDef.icon} size={15} className="text-primary" />
        <span>{language === 'en' ? sessionDef.labelEn : sessionDef.label}</span>
        <span className="text-[10px] opacity-70 font-mono">({sessionDef.approx})</span>
      </div>

      {items.length === 0 ? (
        <div className="p-2 text-center text-label-caps text-on-surface-variant/60 rounded-xl bg-surface-container-low/30">
          {language === 'en' ? 'No classes in this session' : 'Tidak ada kelas pada sesi ini'}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((entry) => {
            const course = courseMap.get(entry.kodeMK)
            const clashInfo = checkPrayerClash(activeDay, entry.jamMulai, entry.jamSelesai, prayerTimes)
            const startMins = parseTimeToMinutes(entry.jamMulai)
            const endMins = parseTimeToMinutes(entry.jamSelesai)
            const isOngoing = isToday && currentMinutes >= startMins && currentMinutes < endMins
            const isPassed = isToday && currentMinutes >= endMins

            return (
              <TimetableClassCard
                key={entry.id || `${entry.kodeMK}-${entry.jamMulai}`}
                entry={entry}
                course={course}
                clashInfo={clashInfo}
                isOngoing={isOngoing}
                isPassed={isPassed}
                onOpenDetail={() => onOpenDetail && onOpenDetail(entry)}
                language={language}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
