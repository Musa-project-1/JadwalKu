import { Icon } from '../../Icon'
import TahunAjaranDropdown from '../../schedule/TahunAjaranDropdown'
import { setItem } from '../../../lib/storage'

export function WeeklyScheduleHeader({
  program,
  semester,
  selectedTA,
  currentTA,
  allTAs,
  setSelectedTA,
  viewingArchive,
  viewDays,
  setViewDays,
  scheduleViewMode,
  setScheduleViewMode,
  weekOffset,
  setWeekOffset,
  weekRangeLabel,
  language,
  t,
  setShareOpen,
}) {
  return (
    <header className="p-3 tablet:px-4 tablet:py-3 border-b border-outline-variant/15 flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
      {/* Kiri: Judul & Info Akademik */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-level-1">
          <Icon name="calendar_month" size={24} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-title-sm tablet:text-title-md font-bold tracking-tight text-on-surface">
              {t ? t('schedule.title') : 'Jadwal Mingguan'}
            </h2>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20">
              {language === 'en' ? 'Active' : 'Aktif'}
            </span>
          </div>
          <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
            {program} · Semester {semester} · TA {selectedTA}
            {viewingArchive && ' · Arsip'}
          </p>
        </div>
      </div>

      {/* Kanan: Seluruh Navigasi & Switcher */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between tablet:justify-end">
        {/* Switcher 5/6 Hari */}
        <div className="inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-high/50 p-0.5 shadow-level-1 shrink-0">
          <button
            type="button"
            onClick={() => { setViewDays('5'); setItem('jadwal:viewDays', '5') }}
            className={`rounded-full px-2.5 py-1 text-label-caps font-bold transition-all cursor-pointer ${
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
            className={`rounded-full px-2.5 py-1 text-label-caps font-bold transition-all cursor-pointer ${
              viewDays === '6'
                ? 'bg-surface shadow-level-1 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {language === 'en' ? '6 Days' : '6 Hari'}
          </button>
        </div>

        {/* Switcher Matriks vs Timeline */}
        <div className="inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-high/50 p-0.5 shadow-level-1 shrink-0">
          <button
            type="button"
            onClick={() => { setScheduleViewMode('matrix'); setItem('jadwal:scheduleViewMode', 'matrix') }}
            className={`rounded-full px-2.5 py-1 text-label-caps font-bold transition-all cursor-pointer flex items-center gap-1 ${
              scheduleViewMode === 'matrix'
                ? 'bg-surface shadow-level-1 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Tampilan Matriks Sesi & Sholat"
          >
            <Icon name="grid_view" size={14} />
            <span>{language === 'en' ? 'Matrix' : 'Matriks'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setScheduleViewMode('timeline'); setItem('jadwal:scheduleViewMode', 'timeline') }}
            className={`rounded-full px-2.5 py-1 text-label-caps font-bold transition-all cursor-pointer flex items-center gap-1 ${
              scheduleViewMode === 'timeline'
                ? 'bg-surface shadow-level-1 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Tampilan Timeline Jam Klasik"
          >
            <Icon name="view_timeline" size={14} />
            <span>Timeline</span>
          </button>
        </div>

        {/* Desktop Week Navigator */}
        <div className="hidden tablet:flex items-center rounded-full border border-outline-variant/30 bg-surface-container-high/60 px-1 py-1 shadow-level-1 min-w-0">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            title="Minggu Sebelumnya"
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <Icon name="chevron_left" size={17} />
          </button>
          <span className="px-2 text-label-caps font-bold text-on-surface whitespace-nowrap">
            {weekRangeLabel}
          </span>
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            title="Minggu Berikutnya"
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <Icon name="chevron_right" size={17} />
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-label-caps font-bold text-primary hover:bg-primary/25 transition-colors shrink-0 cursor-pointer"
            >
              {language === 'en' ? 'Today' : 'Hari Ini'}
            </button>
          )}
        </div>

        {/* TA Selector & Share */}
        <TahunAjaranDropdown
          selectedTA={selectedTA}
          onSelect={(ta) => setSelectedTA(ta)}
          currentTA={currentTA}
          allTAs={allTAs}
        />
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary border border-outline-variant/25 shadow-level-1 cursor-pointer"
          title="Bagikan / Ekspor Jadwal"
          aria-label="Bagikan atau ekspor jadwal"
        >
          <Icon name="ios_share" size={17} />
        </button>
      </div>
    </header>
  )
}
