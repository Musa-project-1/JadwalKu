import { Icon } from '../../Icon'

export function CourseHeader({
  exportCoursesToExcel,
  openAddModal,
}) {
  return (
    <header className="p-3 tablet:px-4 tablet:py-2.5 border-b border-outline-variant/15 flex flex-col gap-2.5 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
      <div className="flex items-center gap-2.5 tablet:gap-3 min-w-0">
        <div className="flex h-9 w-9 tablet:h-10 tablet:w-10 shrink-0 items-center justify-center rounded-xl tablet:rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <Icon name="menu_book" size={20} className="tablet:w-5 tablet:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base tablet:text-xl font-bold tracking-tight text-on-surface">
              Kelola MK & Dosen
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20 shadow-2xs">
              Master Kurikulum
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium truncate mt-0.5">
            Master mata kuliah, SKS, semester & dosen pengampu
          </p>
        </div>
      </div>

      {/* Right side: Icon Action Buttons Cluster + Primary Action Button */}
      <div className="flex items-center justify-between tablet:justify-end gap-1.5 tablet:gap-2 shrink-0 w-full tablet:w-auto">
        {/* Ekspor Excel Icon Button (Purple - 1:1 Jadwal Tab) */}
        <button
          type="button"
          onClick={exportCoursesToExcel}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 active:scale-95 transition-all shadow-level-1 cursor-pointer"
          title="Ekspor Kurikulum Mata Kuliah ke Excel (.xlsx)"
          aria-label="Ekspor Excel"
        >
          <Icon name="file_download" size={16} />
        </button>

        <div className="h-5 w-px bg-outline-variant/30 mx-0.5 hidden tablet:block" />

        <button
          type="button"
          onClick={openAddModal}
          className="flex h-8 items-center gap-1 rounded-xl bg-primary px-3 text-body-xs font-bold text-on-primary shadow-level-1 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Tambah Mata Kuliah"
          aria-label="Tambah MK"
        >
          <Icon name="add" size={16} />
          <span>Tambah MK</span>
        </button>
      </div>
    </header>
  )
}
