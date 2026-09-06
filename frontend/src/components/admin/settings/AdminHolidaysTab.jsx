import { HolidayListPanel } from '../manageAcademicSettings/HolidayListPanel'

export function AdminHolidaysTab({
  language,
  filteredHolidays,
  sortedHolidaysCount,
  programsList,
  holidayTypeFilter,
  setHolidayTypeFilter,
  holidayProdiFilter,
  setHolidayProdiFilter,
  onOpenAddModal,
  onOpenSyncModal,
  onDeleteTarget,
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-title-sm font-bold text-on-surface">
          {language === 'en' ? 'Campus Holiday Calendar' : 'Daftar Hari Libur Kampus'}
        </h3>
        <p className="text-body-xs text-on-surface-variant mt-0.5">
          {language === 'en'
            ? 'Manage official campus holidays, breaks, and national calendar sync'
            : 'Kelola hari libur nasional, jeda perkuliahan, dan agenda libur kampus'}
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-4 shadow-2xs">
        <HolidayListPanel
          filteredHolidays={filteredHolidays}
          totalHolidaysCount={sortedHolidaysCount}
          loadingHolidays={false}
          programs={programsList || []}
          holidayTypeFilter={holidayTypeFilter}
          setHolidayTypeFilter={setHolidayTypeFilter}
          holidayProdiFilter={holidayProdiFilter}
          setHolidayProdiFilter={setHolidayProdiFilter}
          onOpenAddModal={onOpenAddModal}
          onOpenSyncModal={onOpenSyncModal}
          onDeleteTarget={onDeleteTarget}
        />
      </div>
    </div>
  )
}
