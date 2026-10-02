import { Icon } from '../../Icon'
import { ClassCard } from '../../ClassCard'
import { EmptyState } from '../../EmptyState'
import { Skeleton } from '../../Skeleton'
import TahunAjaranDropdown from '../../schedule/TahunAjaranDropdown'
import { getItem, setItem, STORAGE_KEYS } from '../../../lib/storage'

export function MobileScheduleView({
  toolbarContent,
  selectedTA,
  setSelectedTA,
  currentTA,
  allTAs,
  setShareOpen,
  weekOffset,
  setWeekOffset,
  weekRangeLabel,
  viewDays,
  setViewDays,
  language,
  activeWeekDays,
  weekDates,
  selectedDay,
  setSelectedDay,
  todayName,
  loading,
  dayEntries,
  courseMap,
  conflictedIds,
  allTransitions,
  openDetail,
}) {
  return (
    <div className="desktop:hidden flex flex-col w-full">
      {/* Mode Switcher & Aksi */}
      {toolbarContent}
      <div className="flex flex-col gap-3 p-3">

      {/* Mobile Controls (<600px) */}
      <div className="flex flex-col gap-2 tablet:hidden w-full max-w-full min-w-0">
        {/* Row 1: TA (ganti pill bulan — label itu dobel dengan navigator minggu) + Share */}
        <div className="flex items-center gap-2 w-full min-w-0">
          <TahunAjaranDropdown
            className="min-w-0 flex-1"
            selectedTA={selectedTA}
            onSelect={(ta) => setSelectedTA(ta)}
            currentTA={currentTA}
            allTAs={allTAs}
          />
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary border border-outline-variant/20 shadow-level-1 cursor-pointer"
            title="Bagikan Jadwal"
            aria-label="Bagikan jadwal"
          >
            <Icon name="ios_share" size={16} />
          </button>
        </div>

        {/* Row 2: 5/6 Hari + Week Navigator. Switcher ini dulu hanya di header desktop. */}
        <div className="flex items-center gap-2 w-full">
          <div className="inline-flex items-center rounded-2xl border border-outline-variant/30 bg-surface-container-high/50 p-0.5 shadow-level-1 shrink-0">
            <button
              type="button"
              onClick={() => { setViewDays('5'); setItem('jadwal:viewDays', '5') }}
              className={`rounded-xl px-2.5 py-1 text-label-caps font-bold transition-all cursor-pointer ${
                viewDays === '5'
                  ? 'bg-surface shadow-level-1 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'en' ? '5 Days' : '5 Hari'}
            </button>
            <button
              type="button"
              onClick={() => { setViewDays('6'); setItem('jadwal:viewDays', '6') }}
              className={`rounded-xl px-2.5 py-1 text-label-caps font-bold transition-all cursor-pointer ${
                viewDays === '6'
                  ? 'bg-surface shadow-level-1 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'en' ? '6 Days' : '6 Hari'}
            </button>
          </div>
          <div className="flex flex-1 items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-high/60 px-1.5 py-1.5 shadow-level-1 min-w-0">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            title="Minggu Sebelumnya"
            aria-label="Minggu Sebelumnya"
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <Icon name="chevron_left" size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-body-xs font-bold text-on-surface text-center whitespace-nowrap">
              {weekRangeLabel}
            </span>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="rounded-full bg-primary/15 px-2 py-0.5 text-label-caps font-bold text-primary hover:bg-primary/25 transition-colors shrink-0"
              >
                {language === 'en' ? 'Today' : 'Hari Ini'}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            title="Minggu Berikutnya"
            aria-label="Minggu Berikutnya"
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <Icon name="chevron_right" size={20} />
          </button>
          </div>
        </div>
      </div>

      {/* Bar 2: Segmented Day Grid */}
      <div
        className="grid gap-1.5 w-full max-w-full"
        style={{ gridTemplateColumns: `repeat(${activeWeekDays.length}, minmax(0, 1fr))` }}
      >
        {weekDates.map(({ day, dateNum }) => {
          const isSelected = selectedDay === day
          const isToday = day === todayName && weekOffset === 0
          const shortDay = day.slice(0, 3)

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer min-w-0 ${
                isSelected
                  ? 'bg-primary text-on-primary font-bold shadow-level-1'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high dark:bg-surface-container-high'
              }`}
            >
              <span className="text-label-caps uppercase font-bold tracking-tight">
                {shortDay}
              </span>
              <span className={`text-body-sm font-extrabold mt-0.5 ${isSelected ? 'text-on-primary' : 'text-on-surface'}`}>
                {dateNum}
              </span>
              {isToday && (
                <span className={`h-1 w-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-error animate-pulse'}`} />
              )}
            </button>
          )
        })}
      </div>

      <div>
        {loading ? (
          <div className="space-y-sm">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : dayEntries.length === 0 ? (
          <EmptyState
            icon="event_available"
            title={`Tidak ada kelas hari ${selectedDay}`}
            description="Pilih tab hari lain untuk melihat jadwal."
          />
        ) : (
          <div className="space-y-sm">
            {dayEntries.map((entry) => (
              <ClassCard
                key={entry.id}
                entry={entry}
                course={courseMap.get(entry.kodeMK)}
                conflicted={conflictedIds.has(entry.id)}
                note={getItem(`${STORAGE_KEYS.courseNotes}:${entry.kodeMK}`, '')}
                transition={allTransitions.get(entry.id)}
                onClick={() => openDetail(entry)}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
