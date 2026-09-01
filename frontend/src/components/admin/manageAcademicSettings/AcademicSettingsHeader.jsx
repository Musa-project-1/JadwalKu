import { Icon } from '../../Icon'
import { Button } from '../../Button'

export function AcademicSettingsHeader({
  programsCount,
  holidaysCount,
  currentComputedTA,
  onOpenCalendarModal,
  onOpenKaldikImport,
  onOpenBackupRestore,
  onExportExcel,
}) {
  return (
    <header className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 tablet:px-5 tablet:py-3.5 shadow-xs flex flex-col gap-3 desktop:flex-row desktop:items-center desktop:justify-between w-full shrink-0">
      {/* Left: Icon, Title & Live TA Badge */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shadow-xs">
          <Icon name="settings_suggest" size={24} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl tablet:text-2xl font-bold tracking-tight text-on-surface whitespace-nowrap">
              Master Akademik
            </h1>
            <span className="rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-300 px-2.5 py-0.5 text-[11px] font-bold border border-teal-500/20 whitespace-nowrap shadow-2xs">
              TA {currentComputedTA}
            </span>
          </div>
          <p className="mt-0.5 text-body-xs text-on-surface-variant font-medium truncate">
            Kalender perkuliahan, program studi, dan hari libur kampus
          </p>
        </div>
      </div>

      {/* Right side: Live Quick Stat Chips & Actions */}
      <div className="flex items-center gap-2 tablet:gap-2.5 shrink-0 flex-wrap desktop:flex-nowrap">
        {/* Stat Chips */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
              {programsCount} Prodi
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
            <span className="text-[11.5px] font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">
              {holidaysCount} Libur
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden desktop:block h-6 w-px bg-outline-variant/30 mx-0.5" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            onClick={onOpenKaldikImport}
            variant="secondary"
            className="rounded-full px-3.5 py-1.5 font-bold shadow-2xs cursor-pointer text-body-xs shrink-0"
            title="Import Kalender Akademik (Kaldik) dari PDF / Gambar / Excel / JSON"
          >
            <Icon name="upload_file" size={15} className="mr-1 text-primary" />
            <span>Import Kaldik</span>
          </Button>

          <Button
            type="button"
            onClick={onOpenBackupRestore}
            variant="secondary"
            className="rounded-full px-3.5 py-1.5 font-bold shadow-2xs cursor-pointer text-body-xs shrink-0"
            title="Pusat Backup & Restore Database JSON"
          >
            <Icon name="cloud_sync" size={15} className="mr-1 text-teal-700 dark:text-teal-400" />
            <span>Backup</span>
          </Button>

          <Button
            type="button"
            onClick={onExportExcel}
            variant="secondary"
            className="rounded-full px-3 py-1.5 font-bold shadow-2xs cursor-pointer text-body-xs shrink-0"
            title="Ekspor Seluruh Master Data ke Excel"
          >
            <Icon name="file_download" size={15} className="text-secondary" />
            <span className="hidden tablet:inline">Ekspor</span>
          </Button>

          <Button
            type="button"
            onClick={onOpenCalendarModal}
            className="rounded-full px-4 py-1.5 font-bold shadow-xs cursor-pointer text-body-xs shrink-0 bg-primary text-on-primary ml-1"
            title="Atur Batas Kalender Akademik & Live MEK"
          >
            <Icon name="tune" size={15} className="mr-1" />
            <span>Atur Kalender</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
