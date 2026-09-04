import { Icon } from '../../Icon'
import { Button } from '../../Button'

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
    <header className="p-3 tablet:px-4 tablet:py-2.5 border-b border-outline-variant/15 flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
      {/* Left side: Title + TA Badge */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <Icon name="calendar_month" size={22} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg tablet:text-xl font-bold tracking-tight text-on-surface">
              Kelola Jadwal
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold border border-primary/20 shadow-2xs">
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
          <p className="text-[11px] text-on-surface-variant font-medium truncate">
            Unggah spreadsheet master, tambah sesi, atau edit jadwal perkuliahan
          </p>
        </div>
      </div>

      {/* Right side: Icon Action Buttons Cluster + Tambah Sesi */}
      <div className="flex items-center gap-1.5 tablet:gap-2 shrink-0 flex-wrap tablet:flex-nowrap">
        {/* Cetak Mading Icon Button */}
        <button
          type="button"
          onClick={onOpenNoticeboard}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container hover:text-primary transition-colors cursor-pointer shadow-2xs text-on-surface-variant"
          title="Cetak Mading A4 Landscape Resmi"
          aria-label="Cetak Mading"
        >
          <Icon name="print" size={18} />
        </button>

        {/* Import Icon Button */}
        <button
          type="button"
          onClick={onOpenImport}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container hover:text-primary transition-colors cursor-pointer shadow-2xs text-on-surface-variant"
          title="Import Spreadsheet Master (.xlsx / .csv)"
          aria-label="Import Spreadsheet"
        >
          <Icon name="upload_file" size={18} />
        </button>

        {/* Template Download Icon Button */}
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container hover:text-primary transition-colors cursor-pointer shadow-2xs text-on-surface-variant"
          title="Download Template Spreadsheet (.xlsx)"
          aria-label="Download Template"
        >
          <Icon name="description" size={18} />
        </button>

        {/* Ekspor Excel Icon Button */}
        <button
          type="button"
          onClick={onExportExcel}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low/60 hover:bg-surface-container hover:text-primary transition-colors cursor-pointer shadow-2xs text-on-surface-variant"
          title="Ekspor Jadwal ke Excel (.xlsx)"
          aria-label="Ekspor Jadwal"
        >
          <Icon name="file_download" size={18} />
        </button>

        <div className="h-6 w-px bg-outline-variant/20 mx-0.5" />

        {/* Primary Action: Tambah Sesi */}
        <Button
          onClick={onOpenAddSession}
          className="rounded-full px-3.5 py-1.5 font-bold shadow-xs cursor-pointer text-body-xs shrink-0 bg-primary text-on-primary"
          title="Tambah Sesi Manual"
          aria-label="Tambah Sesi"
        >
          <Icon name="add" size={16} className="mr-1" />
          <span>Tambah Sesi</span>
        </Button>
      </div>
    </header>
  )
}
