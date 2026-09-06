import { Icon } from '../../Icon'
import { Button } from '../../Button'

export function CourseHeader({
  exportCoursesToExcel,
  openAddModal,
}) {
  return (
    <header className="p-3 tablet:px-4 tablet:py-2.5 border-b border-outline-variant/15 flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <Icon name="menu_book" size={22} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg tablet:text-xl font-bold tracking-tight text-on-surface">
              Kelola MK & Dosen
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20">
              Master Kurikulum
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium truncate">
            Master mata kuliah, SKS, semester & dosen pengampu
          </p>
        </div>
      </div>

      {/* Right side: Icon Action Buttons Cluster + Primary Action Button */}
      <div className="flex items-center gap-1.5 tablet:gap-2 shrink-0 flex-wrap tablet:flex-nowrap">
        {/* Ekspor Excel Icon Button */}
        <button
          type="button"
          onClick={exportCoursesToExcel}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container hover:text-primary transition-colors cursor-pointer shadow-2xs text-on-surface-variant"
          title="Ekspor Kurikulum Mata Kuliah ke Excel (.xlsx)"
          aria-label="Ekspor Excel"
        >
          <Icon name="file_download" size={18} />
        </button>

        <div className="h-6 w-px bg-outline-variant/20 mx-0.5" />

        <Button
          onClick={openAddModal}
          className="rounded-full px-3.5 py-1.5 font-bold shadow-xs cursor-pointer text-body-xs shrink-0 bg-primary text-on-primary"
          title="Tambah Mata Kuliah"
          aria-label="Tambah MK"
        >
          <Icon name="add" size={16} className="mr-1" />
          <span>Tambah MK</span>
        </Button>
      </div>
    </header>
  )
}
