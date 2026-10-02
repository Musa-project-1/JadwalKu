import { HolidayListPanel } from '../manageAcademicSettings/HolidayListPanel'

export function AdminHolidaysTab({
  language: _language,
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
  )
}
