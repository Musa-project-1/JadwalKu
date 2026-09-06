import { Icon } from '../../Icon'
import {
  ProdiFilterDropdown,
  SemesterFilterDropdown,
  TaFilterDropdown,
  DosenFilterDropdown,
  SksFilterDropdown,
} from '../AdminFilterDropdowns'

export function CourseToolbar({
  search,
  setSearch,
  prodiFilter,
  setProdiFilter,
  prodiNames,
  taFilter,
  setTaFilter,
  availableTaOptions,
  semesterFilter,
  setSemesterFilter,
  availableSemesterOptions,
  dosenFilter,
  setDosenFilter,
  lecturers,
  sksFilter,
  setSksFilter,
  sksOptions,
  hasActiveFilters,
  resetAllFilters,
}) {
  return (
    <div className="flex flex-col space-y-2.5 overflow-hidden">
      {/* 1-Row Integrated Search & Dropdowns Toolbar */}
      <div className="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar w-full pb-0.5 overflow-visible">
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
            placeholder="Cari kode MK, nama mata kuliah, dosen…"
            aria-label="Cari mata kuliah"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low/50 py-2 pl-8 pr-7 text-body-xs font-medium text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:bg-surface focus:outline-none dark:bg-surface-container-high/30 transition-all shadow-level-1"
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

        {/* Filters Group */}
        <div className="flex items-center gap-2 shrink-0">
          <ProdiFilterDropdown
            selected={prodiFilter}
            onSelect={setProdiFilter}
            prodiOptions={prodiNames}
          />

          {availableTaOptions.length > 2 && (
            <TaFilterDropdown
              selected={taFilter}
              onSelect={setTaFilter}
              taOptions={availableTaOptions}
            />
          )}

          <SemesterFilterDropdown
            selected={semesterFilter}
            onSelect={setSemesterFilter}
            semesterOptions={availableSemesterOptions}
          />

          <DosenFilterDropdown
            lecturers={lecturers}
            selected={dosenFilter}
            onSelect={setDosenFilter}
          />

          <SksFilterDropdown
            selected={sksFilter}
            onSelect={setSksFilter}
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-error/30 bg-error/10 px-2 py-1 text-label-caps font-bold text-error hover:bg-error/20 cursor-pointer transition-colors shadow-level-1"
            >
              <Icon name="refresh" size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/15 text-label-caps uppercase font-semibold text-on-surface-variant">
          <span>Filter Aktif:</span>

          {search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-on-surface">
              <span>Keyword: &quot;{search}&quot;</span>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="rounded-full p-0.5 hover:bg-surface-container-highest cursor-pointer"
              >
                <Icon name="close" size={14} />
              </button>
            </span>
          )}

          {prodiFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
              <span>Prodi: {prodiFilter}</span>
              <button
                type="button"
                onClick={() => setProdiFilter('')}
                className="rounded-full p-0.5 hover:bg-primary/20 cursor-pointer"
              >
                <Icon name="close" size={14} />
              </button>
            </span>
          )}

          {semesterFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-indigo-700 dark:text-indigo-400">
              <span>Semester: {availableSemesterOptions.find((s) => s.value === semesterFilter)?.label}</span>
              <button
                type="button"
                onClick={() => setSemesterFilter('')}
                className="rounded-full p-0.5 hover:bg-indigo-500/20 cursor-pointer"
              >
                <Icon name="close" size={14} />
              </button>
            </span>
          )}

          {taFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-teal-700 dark:text-teal-400">
              <span>TA: {taFilter}</span>
              <button
                type="button"
                onClick={() => setTaFilter('')}
                className="rounded-full p-0.5 hover:bg-teal-500/20 cursor-pointer"
              >
                <Icon name="close" size={14} />
              </button>
            </span>
          )}

          {dosenFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400">
              <span>Dosen: {dosenFilter}</span>
              <button
                type="button"
                onClick={() => setDosenFilter('')}
                className="rounded-full p-0.5 hover:bg-emerald-500/20 cursor-pointer"
              >
                <Icon name="close" size={14} />
              </button>
            </span>
          )}

          {sksFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-800 dark:text-amber-300">
              <span>{sksOptions.find((s) => s.value === Number(sksFilter))?.label || `${sksFilter} SKS`}</span>
              <button
                type="button"
                onClick={() => setSksFilter('')}
                className="rounded-full p-0.5 hover:bg-amber-500/20 cursor-pointer"
              >
                <Icon name="close" size={14} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
