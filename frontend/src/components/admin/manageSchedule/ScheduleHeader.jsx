import { Icon } from '../../Icon'

/**
 * ScheduleHeader - Redesigned single-line header
 * Features:
 * - Title + TA Badge on the left
 * - Removed '101 Published' and '0 Draft' badges
 * - Icon-only action cluster (36x36px): Cetak Mading, Import, Template, Ekspor
 * - Primary 'Tambah Sesi' button on the right
 */
export function ScheduleHeader({
  currentTA,
  conflictCount,
  onlyShowConflicts,
  onToggleOnlyConflicts,
  onOpenNoticeboard,
  onOpenImport,
  onDownloadTemplate,
  onExportExcel,
  onOpenAddSession,
}) {
  return (
    <header className="p-3 tablet:px-4 tablet:py-2.5 border-b border-outline-variant/15 flex flex-col gap-2.5 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
      {/* Left side: Title + TA Badge */}
      <div className="flex items-center gap-2.5 tablet:gap-3 min-w-0">
        <div className="flex h-9 w-9 tablet:h-10 tablet:w-10 shrink-0 items-center justify-center rounded-xl tablet:rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <Icon name="calendar_month" size={20} className="tablet:w-5 tablet:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base tablet:text-xl font-bold tracking-tight text-on-surface">
              Kelola Jadwal
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-label-caps font-bold border border-primary/20 shadow-2xs">
              TA {currentTA}
            </span>
            {conflictCount > 0 && (
              <button
                type="button"
                onClick={onToggleOnlyConflicts}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold border transition-all cursor-pointer shadow-2xs ${
                  onlyShowConflicts
                    ? 'bg-error text-on-error border-error ring-1 ring-error/30'
                    : 'border-error/30 bg-error/10 text-error hover:bg-error/20'
                }`}
                title={onlyShowConflicts ? 'Tampilkan Semua Jadwal' : 'Klik untuk Hanya Tampilkan Jadwal Bentrok'}
              >
                <Icon name="warning" size={12} className="shrink-0" />
                <span>{conflictCount} Bentrok</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium truncate mt-0.5">
            Unggah spreadsheet master, tambah sesi, atau edit jadwal perkuliahan
          </p>
        </div>
      </div>

      {/* Right side: 4 Colored Action Buttons (1:1 Tab Jadwal User) + Tambah Sesi */}
      <div className="flex items-center justify-between tablet:justify-end gap-1.5 tablet:gap-2 shrink-0 w-full tablet:w-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Cetak Mading Icon Button (Sky Blue) */}
          <button
            type="button"
            onClick={onOpenNoticeboard}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 active:scale-95 transition-all shadow-level-1 cursor-pointer"
            title="Cetak Mading A4 Landscape Resmi"
            aria-label="Cetak Mading"
          >
            <Icon name="print" size={16} />
          </button>

          {/* Import Icon Button (Emerald) */}
          <button
            type="button"
            onClick={onOpenImport}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-level-1 cursor-pointer"
            title="Import Spreadsheet Master (.xlsx / .csv)"
            aria-label="Import Spreadsheet"
          >
            <Icon name="upload_file" size={16} />
          </button>

          {/* Template Download Icon Button (Amber) */}
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all shadow-level-1 cursor-pointer"
            title="Download Template Spreadsheet (.xlsx)"
            aria-label="Download Template"
          >
            <Icon name="description" size={16} />
          </button>

          {/* Ekspor Excel Icon Button (Purple) */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 active:scale-95 transition-all shadow-level-1 cursor-pointer"
            title="Ekspor Jadwal ke Excel (.xlsx)"
            aria-label="Ekspor Jadwal"
          >
            <Icon name="file_download" size={16} />
          </button>
        </div>

        <div className="h-5 w-px bg-outline-variant/30 mx-0.5 hidden tablet:block" />

        {/* Primary Action: Tambah Sesi (h-8 height matching icon buttons) */}
        <button
          type="button"
          onClick={onOpenAddSession}
          className="flex h-8 items-center gap-1 rounded-xl bg-primary px-3 text-body-xs font-bold text-on-primary shadow-level-1 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Tambah Sesi Manual"
          aria-label="Tambah Sesi"
        >
          <Icon name="add" size={16} />
          <span>Tambah Sesi</span>
        </button>
      </div>
    </header>
  )
}
