import { Skeleton } from '../../Skeleton'
import { EmptyState } from '../../EmptyState'
import { Pagination } from '../../Pagination'
import { ScheduleTable } from './ScheduleTable'
import { ScheduleCards } from './ScheduleCards'

export function ScheduleTableSection({
  loadingSchedule,
  filteredSchedule,
  paginatedGroups,
  courseMap,
  conflictMap,
  selectedIds,
  expandedGroups,
  toggleSelectAll,
  toggleSelectGroup,
  toggleExpandGroup,
  openEditModal,
  openGroupEditModal,
  handleDuplicate,
  setDeleteTarget,
  handleGroupDelete,
  safeCurrentPage,
  groupedSchedule,
  pageSize,
  setCurrentPage,
  setPageSize,
}) {
  if (loadingSchedule) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    )
  }

  if (filteredSchedule.length === 0) {
    return (
      <EmptyState
        icon="calendar_month"
        title="Tidak ada jadwal yang sesuai"
        description="Coba ubah filter pencarian atau buat jadwal baru melalui upload spreadsheet / form manual di atas."
      />
    )
  }

  return (
    <>
      <ScheduleTable
        paginatedGroups={paginatedGroups}
        courseMap={courseMap}
        conflictMap={conflictMap}
        selectedIds={selectedIds}
        filteredScheduleCount={filteredSchedule.length}
        expandedGroups={expandedGroups}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectGroup={toggleSelectGroup}
        onToggleExpandGroup={toggleExpandGroup}
        onOpenEdit={openEditModal}
        onOpenGroupEdit={openGroupEditModal}
        onDuplicate={handleDuplicate}
        onDeleteSingle={(item) => setDeleteTarget(item)}
        onDeleteGroup={handleGroupDelete}
      />

      <ScheduleCards
        paginatedGroups={paginatedGroups}
        courseMap={courseMap}
        conflictMap={conflictMap}
        selectedIds={selectedIds}
        expandedGroups={expandedGroups}
        onToggleSelectGroup={toggleSelectGroup}
        onToggleExpandGroup={toggleExpandGroup}
        onOpenEdit={openEditModal}
        onOpenGroupEdit={openGroupEditModal}
        onDuplicate={handleDuplicate}
        onDeleteSingle={(item) => setDeleteTarget(item)}
        onDeleteGroup={handleGroupDelete}
      />

      {/* Shared Pagination Controls */}
      <div className="shrink-0 pt-1.5 border-t border-outline-variant/15">
        <Pagination
          currentPage={safeCurrentPage}
          totalItems={groupedSchedule.length}
          pageSize={pageSize === 0 ? 'Semua' : pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => setPageSize(sz === 'Semua' ? 0 : sz)}
          itemLabel="sesi"
        />
      </div>
    </>
  )
}
