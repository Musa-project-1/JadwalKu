import { Icon } from '../../Icon'
import { Button } from '../../Button'

export function ScheduleHeader({
  currentTA,
  publishedCount,
  draftCount,
  conflictCount,
  onlyShowConflicts,
  onToggleOnlyConflicts,
  onOpenNoticeboard,
  onOpenImport,
  onOpenAddSession,
}) {
  return (
    <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3 tablet:px-4 tablet:py-3 shadow-xs flex flex-col gap-3.5 tablet:flex-row tablet:items-center tablet:justify-between w-full shrink-0">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <Icon name="calendar_month" size={24} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface">
              Kelola Jadwal
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold border border-primary/20">
              TA {currentTA}
            </span>
          </div>
          <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
            Unggah spreadsheet master, tambah sesi, atau edit jadwal perkuliahan
          </p>
        </div>
      </div>

      {/* Right side: Stat Chips & Action Buttons */}
      <div className="flex items-center gap-2 tablet:gap-2.5 shrink-0 flex-wrap tablet:flex-nowrap">
        <div className="grid grid-cols-2 tablet:flex tablet:w-auto gap-1.5 tablet:gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 shadow-2xs min-w-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300 truncate">
              {publishedCount} Published
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 shadow-2xs min-w-0">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[11.5px] font-bold text-amber-700 dark:text-amber-300 truncate">
              {draftCount} Draft
            </span>
          </div>

          {conflictCount > 0 && (
            <button
              type="button"
              onClick={onToggleOnlyConflicts}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 shadow-2xs min-w-0 transition-all cursor-pointer ${
                onlyShowConflicts
                  ? 'bg-error text-on-error border-error'
                  : 'border-error/30 bg-error/10 text-error hover:bg-error/20'
              }`}
              title={onlyShowConflicts ? 'Tampilkan Semua Jadwal' : 'Klik untuk Hanya Tampilkan Jadwal Bentrok'}
            >
              <Icon name="warning" size={14} className="shrink-0" />
              <span className="text-[11.5px] font-bold truncate">{conflictCount} Bentrok</span>
            </button>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={onOpenNoticeboard}
          className="rounded-full px-3.5 py-1.5 font-bold shadow-2xs cursor-pointer text-body-xs shrink-0"
          title="Cetak Jadwal Format Mading A4 Landscape Resmi"
          aria-label="Cetak Mading"
        >
          <Icon name="table_chart" size={16} className="mr-1 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden tablet:inline">Cetak Mading</span>
        </Button>

        <Button
          variant="secondary"
          onClick={onOpenImport}
          className="rounded-full px-3.5 py-1.5 font-bold shadow-2xs cursor-pointer text-body-xs shrink-0"
          title="Import Spreadsheet Master (.xlsx / .csv)"
          aria-label="Import Spreadsheet"
        >
          <Icon name="upload_file" size={16} className="mr-1 text-primary" />
          <span className="hidden tablet:inline">Import</span>
        </Button>

        <Button
          onClick={onOpenAddSession}
          className="rounded-full px-4 py-1.5 font-bold shadow-xs cursor-pointer text-body-xs shrink-0 bg-primary text-on-primary"
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
