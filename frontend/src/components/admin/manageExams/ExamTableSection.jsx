import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { Skeleton } from '../../Skeleton'
import { EmptyState } from '../../EmptyState'
import { Pagination } from '../../Pagination'
import { ExamTable } from './ExamTable'
import { ExamCards } from './ExamCards'

export function ExamTableSection({
  loading,
  filtered,
  hasActiveFilters,
  resetAllFilters,
  openAdd,
  onOpenImport,
  paginatedExams,
  courseMap,
  selectedIds,
  toggleSelectAll,
  toggleSelectOne,
  handlePublish,
  openEdit,
  setDeleteTarget,
  safeCurrentPage,
  pageSize,
  setCurrentPage,
  setPageSize,
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    )
  }

  if (filtered.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="py-8 text-center">
          <EmptyState
            icon="search_off"
            title="Tidak ada jadwal ujian yang cocok"
            description="Coba sesuaikan kata kunci pencarian atau reset filter aktif Anda."
          />
          <div className="flex justify-center mt-4">
            <Button
              variant="secondary"
              onClick={resetAllFilters}
              className="cursor-pointer"
            >
              <Icon name="refresh" size={18} className="mr-1" />
              Reset Semua Filter
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-3">
        <EmptyState
          icon="quiz"
          title="Belum Ada Jadwal Ujian"
          description="Belum ada agenda ujian yang terdaftar untuk semester aktif ini. Tambahkan jadwal ujian baru atau impor massal dari file spreadsheet."
        />
        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            onClick={openAdd}
            className="rounded-2xl px-4 py-2 font-bold shadow-level-1 cursor-pointer text-body-xs"
          >
            <Icon name="add" size={16} className="mr-1.5" />
            <span>Tambah Ujian Manual</span>
          </Button>
          <Button
            variant="secondary"
            onClick={onOpenImport}
            className="rounded-2xl px-4 py-2 font-bold shadow-level-1 cursor-pointer text-body-xs"
          >
            <Icon name="upload_file" size={16} className="mr-1.5 text-primary" />
            <span>Impor CSV/XLSX</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <ExamTable
        paginatedExams={paginatedExams}
        courseMap={courseMap}
        selectedIds={selectedIds}
        filteredCount={filtered.length}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectOne={toggleSelectOne}
        onPublish={handlePublish}
        onOpenEdit={openEdit}
        onDeleteTarget={(exam) => setDeleteTarget(exam)}
      />

      <ExamCards
        paginatedExams={paginatedExams}
        courseMap={courseMap}
        onOpenEdit={openEdit}
        onDeleteTarget={(exam) => setDeleteTarget(exam)}
      />

      {/* Shared Pagination Controls */}
      <div className="shrink-0 pt-1.5 border-t border-outline-variant/15">
        <Pagination
          currentPage={safeCurrentPage}
          totalItems={filtered.length}
          pageSize={pageSize === 0 ? 'Semua' : pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => setPageSize(sz === 'Semua' ? 0 : sz)}
          itemLabel="sesi ujian"
        />
      </div>
    </>
  )
}
