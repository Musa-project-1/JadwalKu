import { Icon } from '../../Icon'
import {
  ProdiFilterDropdown,
  SemesterFilterDropdown,
  StatusFilterDropdown,
} from '../AdminFilterDropdowns'

export function ExamToolbar({
  search,
  setSearch,
  jenisFilter,
  setJenisFilter,
  prodiFilter,
  setProdiFilter,
  semesterFilter,
  setSemesterFilter,
  statusFilter,
  setStatusFilter,
  stats,
  availableSemesterOptions,
  hasActiveFilters,
  onResetFilters,
  onDownloadTemplate,
  onExportExcel,
  onOpenImport,
}) {
  return (
    <div className="relative z-30 flex flex-col gap-1.5 shrink-0">
      {/* 1-Row Responsive Integrated Search & Dropdowns Toolbar */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-2 w-full">
        {/* Compact Flexible Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode MK, prodi, ruang…"
            aria-label="Cari jadwal ujian"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 py-1.5 pl-8 pr-7 text-[12px] font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface focus:outline-none dark:bg-surface-container-high/30 transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:bg-surface-container rounded-full p-0.5 cursor-pointer"
              aria-label="Hapus pencarian"
            >
              <Icon name="close" size={12} />
            </button>
          )}
        </div>

        {/* Filters & Action Buttons Group (flex-wrap to never clip on any resolution) */}
        <div className="flex items-center gap-1.5 flex-wrap tablet:flex-nowrap shrink-0">
          {/* Segmented Jenis Ujian Tabs */}
          <div className="flex items-center rounded-xl border border-outline-variant/25 bg-surface-container-low/60 p-0.5 dark:bg-surface-container-high/30 shrink-0">
            {['Semua', 'UTS', 'UAS'].map((tab) => {
              const active = jenisFilter === tab
              const count = tab === 'Semua' ? stats.total : tab === 'UTS' ? stats.uts : stats.uas
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setJenisFilter(tab)}
                  className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-bold ${
                      active
                        ? 'bg-on-primary/20 text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <ProdiFilterDropdown
            selected={prodiFilter}
            onSelect={setProdiFilter}
          />

          <SemesterFilterDropdown
            selected={semesterFilter}
            onSelect={setSemesterFilter}
            semesterOptions={availableSemesterOptions}
          />

          <StatusFilterDropdown
            selected={statusFilter}
            onSelect={setStatusFilter}
          />

          <button
            type="button"
            onClick={onDownloadTemplate}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1 text-[11px] font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
            title="Unduh Template Excel Ujian (.xlsx)"
          >
            <Icon name="download" size={13} className="text-primary" />
            <span className="hidden desktop:inline">Template</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1 text-[11px] font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
            title="Ekspor Jadwal Ujian ke Excel"
          >
            <Icon name="file_download" size={13} className="text-secondary" />
            <span className="hidden desktop:inline">Ekspor</span>
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-2.5 py-1 text-[11px] font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary cursor-pointer transition-colors"
            title="Impor Jadwal Ujian (Excel / CSV)"
          >
            <Icon name="publish" size={13} className="text-tertiary" />
            <span className="hidden desktop:inline">Impor</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-error/30 bg-error/10 px-2.5 py-1 text-[11px] font-bold text-error hover:bg-error/20 cursor-pointer transition-colors shadow-2xs"
            >
              <Icon name="refresh" size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
