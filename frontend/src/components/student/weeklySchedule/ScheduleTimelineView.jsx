import { sortByTime } from '../../../lib/scheduleUtils'
import { getItem, STORAGE_KEYS } from '../../../lib/storage'
import { toMin } from './scheduleUtils'
import { TimelineEventCard } from './TimelineEventCard'

export function ScheduleTimelineView({
  gridScrollRef,
  gridBodyRef,
  activeWeekDays,
  weekDates,
  todayName,
  todayISO,
  holidayDates,
  hourMarks,
  rangeStart,
  rangeEnd,
  pxPerHour,
  gridHeight,
  nowMinute,
  scheduleSource,
  courseMap,
  conflictedIds,
  allTransitions,
  openDetail,
}) {
  return (
    <div
      ref={gridScrollRef}
      className="flex-1 min-w-0 border-r border-outline-variant/20 overflow-hidden h-[calc(100vh-190px)] min-h-[460px] relative flex flex-col"
    >
      <div
        className="grid sticky top-0 z-30 shrink-0 bg-surface-container-lowest dark:bg-surface-container-low shadow-level-1 border-b border-outline-variant/40"
        style={{ gridTemplateColumns: `64px repeat(${activeWeekDays.length}, minmax(0, 1fr))` }}
      >
        <div className="p-3 text-center text-body-xs font-bold uppercase tracking-wider text-on-surface-variant/70 flex items-center justify-center sticky left-0 z-40 bg-surface-container-lowest dark:bg-surface-container-low border-r border-outline-variant/30 select-none">
          GMT+7
        </div>
        {weekDates.map(({ day, dateNum, monthShort, iso }) => {
          const isTodayCol = day === todayName && iso === todayISO
          const isHoliday = holidayDates.has(iso)
          return (
            <div
              key={day}
              className={`p-2.5 text-center flex items-center justify-center gap-1.5 border-l border-outline-variant/30 transition-colors ${
                isHoliday
                  ? 'opacity-60'
                  : isTodayCol
                  ? 'bg-surface-container-low dark:bg-surface-container-high/60 rounded-t-2xl'
                  : ''
              }`}
            >
              {isTodayCol ? (
                <span className="rounded-full bg-primary text-on-primary px-3 py-0.5 text-label-caps font-bold shadow-level-1 inline-block">
                  {day}
                </span>
              ) : (
                <span className="text-title-sm font-semibold text-on-surface">{day}</span>
              )}
              <span className="text-body-sm text-on-surface-variant font-medium whitespace-nowrap">
                {dateNum} {monthShort}
                {isHoliday && (
                  <span className="ml-1 font-bold text-error">· LIBUR</span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div
          ref={gridBodyRef}
          className="relative grid h-full w-full"
          style={{
            gridTemplateColumns: `64px repeat(${activeWeekDays.length}, minmax(0, 1fr))`
          }}
        >
          <div className="relative border-r border-outline-variant/30 sticky left-0 z-20 bg-surface-container-lowest/95 dark:bg-surface-container-low/95 backdrop-blur-xs select-none">
            {hourMarks.map((m) => {
              const isFirst = m === rangeStart
              const top = ((m - rangeStart) / 60) * pxPerHour
              return (
                <div
                  key={m}
                  className={`absolute inset-x-0 flex items-center justify-end pr-2.5 pointer-events-none ${
                    isFirst ? 'top-1.5' : '-translate-y-1/2'
                  }`}
                  style={isFirst ? undefined : { top }}
                >
                  <span className="text-label-caps font-normal text-on-surface-variant/70 tabular-nums leading-none tracking-tight">
                    {String(Math.floor(m / 60)).padStart(2, '0')}:00
                  </span>
                </div>
              )
            })}
          </div>

          {weekDates.map(({ day, iso }) => {
            const isHoliday = holidayDates.has(iso)
            const isTodayCol = day === todayName && iso === todayISO
            const entries = sortByTime(scheduleSource.filter((e) => e.hari === day))
            return (
              <div
                key={day}
                className={`relative border-l border-outline-variant/40 transition-colors ${
                  isHoliday
                    ? 'holiday-stripes'
                    : isTodayCol
                    ? 'bg-surface-container-low/70 dark:bg-surface-container-high/30'
                    : ''
                }`}
              >
                {isHoliday && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
                    <span className="text-label-caps uppercase tracking-widest text-on-surface-variant/70 -rotate-90 font-bold">
                      LIBUR
                    </span>
                  </div>
                )}
                {hourMarks.map((m) => (
                  <span
                    key={m}
                    className="absolute inset-x-0 border-t border-outline-variant/30"
                    style={{ top: ((m - rangeStart) / 60) * pxPerHour }}
                  />
                ))}

                {!isHoliday &&
                  entries.map((entry) => {
                    const start = toMin(entry.jamMulai)
                    const end = toMin(entry.jamSelesai)
                    const top = ((start - rangeStart) / 60) * pxPerHour
                    const durationHeight = ((end - start) / 60) * pxPerHour - 4
                    const height = Math.max(durationHeight, 92)
                    const course = courseMap.get(entry.kodeMK)
                    const conflicted = conflictedIds.has(entry.id)
                    const noteText = getItem(`${STORAGE_KEYS.courseNotes}:${entry.kodeMK}`, '')
                    const transition = allTransitions.get(entry.id)

                    return (
                      <TimelineEventCard
                        key={entry.id}
                        entry={entry}
                        course={course}
                        conflicted={conflicted}
                        noteText={noteText}
                        transition={transition}
                        top={top}
                        height={height}
                        openDetail={openDetail}
                      />
                    )
                  })}

                {isTodayCol && (
                  (() => {
                    const clampedMinute = Math.max(rangeStart, Math.min(nowMinute, rangeEnd))
                    const isClampedTop = nowMinute < rangeStart
                    const isClampedBottom = nowMinute > rangeEnd
                    const topPos = isClampedTop
                      ? 6
                      : isClampedBottom
                      ? gridHeight - 6
                      : ((clampedMinute - rangeStart) / 60) * pxPerHour

                    return (
                      <div
                        style={{ top: topPos }}
                        className="pointer-events-none absolute inset-x-0 z-20 transition-all duration-300 ease-out"
                      >
                        <span className="absolute -left-1 -top-[4px] h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20 animate-pulse" />
                        <div className="h-[2px] w-full bg-primary/70 shadow-level-1" />
                      </div>
                    )
                  })()
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
