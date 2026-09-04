import { Icon } from '../../Icon'
import {
  ProdiFilterDropdown,
  SemesterFilterDropdown,
  TaFilterDropdown,
  FakultasFilterDropdown,
  HariFilterDropdown,
  StatusFilterDropdown,
} from '../AdminFilterDropdowns'

export function ScheduleToolbar({
  search,
  setSearch,
  fakultasFilter,
  setFakultasFilter,
  prodiFilter,
  setProdiFilter,
  semesterFilter,
  setSemesterFilter,
  taFilter,
  setTaFilter,
  hariFilter,
  setHariFilter,
  statusFilter,
  setStatusFilter,
  onlyShowConflicts,
  setOnlyShowConflicts,
  availableFakultasOptions,
  prodiOptions,
  availableTaOptions,
  availableSemesterOptions,
  conflictsCount,
  onResetFilters,
  onDownloadTemplate,
  onExportExcel,
  prodiFakultasMap,
}) {
  const hasActiveFilter = Boolean(
    search ||
      fakultasFilter ||
      prodiFilter ||
      semesterFilter ||
      taFilter ||
      hariFilter ||
      statusFilter ||
      onlyShowConflicts,
  )

  return (
    <div className="relative flex flex-col gap-1.5 shrink-0 overflow-visible">
      {/* 1-Row Integrated Search & Dropdowns Toolbar */}
      <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar w-full pb-0.5 overflow-visible">
        {/* Compact Search Bar */}
        <div className="relative flex-1 min-w-[200px] max-w-sm shrink-0 tablet:shrink">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari MK, dosen, ruang, prodi, hari…"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 py-1.5 pl-8 pr-7 text-[12px] font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface focus:outline-none dark:bg-surface-container-high/30 transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:bg-surface-container rounded-full p-0.5 cursor-pointer"
            >
              <Icon name="close" size={12} />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-1.5 shrink-0">
          {availableFakultasOptions.length > 2 && (
            <FakultasFilterDropdown
              selected={fakultasFilter}
              onSelect={(v) => {
                setFakultasFilter(v)
                if (v && prodiFilter) {
                  const fid = String(prodiFakultasMap.get(String(prodiFilter)) || '')
                  if (fid && fid !== String(v)) setProdiFilter('')
                }
              }}
              fakultasOptions={availableFakultasOptions}
            />
          )}

          <ProdiFilterDropdown
            prodiOptions={prodiOptions}
            selected={prodiFilter}
            onSelect={setProdiFilter}
          />

          <TaFilterDropdown
            selected={taFilter}
            onSelect={setTaFilter}
            taOptions={availableTaOptions}
          />

          <SemesterFilterDropdown
            selected={semesterFilter}
            onSelect={setSemesterFilter}
            semesterOptions={availableSemesterOptions}
          />

          <HariFilterDropdown
            selected={hariFilter}
            onSelect={setHariFilter}
          />

          <StatusFilterDropdown
            selected={statusFilter}
            onSelect={setStatusFilter}
          />

          {conflictsCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyShowConflicts((prev) => !prev)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                onlyShowConflicts
                  ? 'bg-error text-white border-error ring-2 ring-error/30'
                  : 'bg-error/10 text-error border-error/30 hover:bg-error/20'
              }`}
              title="Filter hanya jadwal bentrok"
            >
              <Icon name="warning" size={13} />
              <span>Bentrok ({conflictsCount})</span>
            </button>
          )}

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-error/30 bg-error/10 px-2 py-1 text-[11px] font-bold text-error hover:bg-error/20 cursor-pointer transition-colors shadow-2xs"
            >
              <Icon name="refresh" size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badges (Compact 1-Line Strip) */}
      {hasActiveFilter && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 animate-fade-in text-[10.5px]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mr-0.5 shrink-0">
            Aktif:
          </span>
          {onlyShowConflicts && (
            <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2 py-0.5 font-bold text-error border border-error/30 shrink-0">
              <span>Bentrok</span>
              <button type="button" onClick={() => setOnlyShowConflicts(false)} className="hover:opacity-70 cursor-pointer">
                <Icon name="close" size={10} />
              </button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary border border-primary/20 shrink-0">
              <span>"{search}"</span>
              <button type="button" onClick={() => setSearch('')} className="hover:opacity-70 cursor-pointer">
                <Icon name="close" size={10} />
              </button>
            </span>
          )}
          {prodiFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary border border-primary/20 shrink-0">
              <span>{prodiFilter}</span>
              <button type="button" onClick={() => setProdiFilter('')} className="hover:opacity-70 cursor-pointer">
                <Icon name="close" size={10} />
              </button>
            </span>
          )}
          {semesterFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
              <span>
                {availableSemesterOptions.find((s) => s.value === semesterFilter)?.label || `Sem. ${semesterFilter}`}
              </span>
              <button type="button" onClick={() => setSemesterFilter('')} className="hover:opacity-70 cursor-pointer">
                <Icon name="close" size={10} />
              </button>
            </span>
          )}
          {hariFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 font-semibold text-secondary border border-secondary/20 shrink-0">
              <span>{hariFilter}</span>
              <button type="button" onClick={() => setHariFilter('')} className="hover:opacity-70 cursor-pointer">
                <Icon name="close" size={10} />
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 font-semibold text-on-surface border border-outline-variant/30 shrink-0">
              <span>{statusFilter}</span>
              <button type="button" onClick={() => setStatusFilter('')} className="hover:opacity-70 cursor-pointer">
                <Icon name="close" size={10} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
