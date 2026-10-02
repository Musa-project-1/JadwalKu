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
  isCustomMode = false,
  setScheduleMode,
  customScheduleIds = [],
  setCustomModalOpen,
}) {
  return (
    <div className="desktop:hidden flex flex-col w-full">
      {/* Mode Switcher & Aksi */}
      {toolbarContent}
      <div className="flex flex-col gap-3 p-3">

      {/* Mobile Controls (<600px) */}
      <div className="flex flex-col gap-2 tablet:hidden w-full max-w-full min-w-0">
        {/* Row 1: TA Dropdown (natural width) + 5/6 Days Switcher + Share Button */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <TahunAjaranDropdown
            className="shrink-0"
            align="left"
            selectedTA={selectedTA}
            onSelect={(ta) => setSelectedTA(ta)}
            currentTA={currentTA}
            allTAs={allTAs}
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 5 / 6 Days Switcher */}
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

            {/* Share Button */}
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary border border-outline-variant/25 shadow-level-1 cursor-pointer"
              title="Bagikan Jadwal"
              aria-label="Bagikan jadwal"
            >
              <Icon name="ios_share" size={15} />
            </button>
          </div>
        </div>

        {/* Row 2: Dedicated Full-Width Perfectly Symmetrical Week Navigator */}
        <div className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-high/50 px-2 py-1.5 shadow-level-1 w-full">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            title="Minggu Sebelumnya"
            aria-label="Minggu Sebelumnya"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <Icon name="chevron_left" size={20} />
          </button>

          <div className="flex items-center justify-center gap-2 flex-1 min-w-0 px-2 text-center">
            <span className="text-body-xs font-extrabold text-on-surface truncate">
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
            className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <Icon name="chevron_right" size={20} />
          </button>
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
          isCustomMode ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-5 text-center space-y-3 shadow-xs">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Icon name="star" size={22} />
              </div>
              <div>
                <h3 className="text-body-sm font-extrabold text-on-surface">
                  {customScheduleIds.length === 0
                    ? (language === 'en' ? 'Custom Schedule is Empty' : 'Jadwal Kustom Masih Kosong')
                    : (language === 'en' ? `No custom classes on ${selectedDay}` : `Tidak ada kelas kustom hari ${selectedDay}`)}
                </h3>
                <p className="text-[11.5px] text-on-surface-variant mt-1 max-w-xs mx-auto">
                  {customScheduleIds.length === 0
                    ? (language === 'en'
                        ? 'You are viewing the Custom Schedule tab. Click below to return to your official Package Schedule.'
                        : 'Anda sedang berada di tab Jadwal Kustom. Klik tombol di bawah untuk kembali ke Jadwal Paket resmi prodi.')
                    : (language === 'en'
                        ? `Select another day or switch back to Package Schedule.`
                        : `Pilih hari lain atau beralih kembali ke Jadwal Paket.`)}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                {setScheduleMode && (
                  <button
                    type="button"
                    onClick={() => setScheduleMode('regular')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-body-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Icon name="school" size={15} />
                    <span>{language === 'en' ? 'Open Package Schedule' : 'Buka Jadwal Paket'}</span>
                  </button>
                )}
                {setCustomModalOpen && (
                  <button
                    type="button"
                    onClick={() => setCustomModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-body-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Icon name="tune" size={15} />
                    <span>{language === 'en' ? 'Configure Courses' : 'Atur Matkul'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon="event_available"
              title={`Tidak ada kelas hari ${selectedDay}`}
              description="Pilih tab hari lain untuk melihat jadwal."
            />
          )
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
