import { Icon } from '../../Icon'
import { Skeleton } from '../../Skeleton'
import { EmptyState } from '../../EmptyState'
import { HolidayProdiFilterDropdown } from '../AdminFilterDropdowns'

export function HolidayListPanel({
  filteredHolidays,
  totalHolidaysCount,
  loadingHolidays,
  programs,
  holidayTypeFilter,
  setHolidayTypeFilter,
  holidayProdiFilter,
  setHolidayProdiFilter,
  onOpenSyncModal,
  onOpenAddModal,
  onDeleteTarget,
}) {
  return (
    <section className="h-full flex flex-col justify-between rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-xs dark:bg-surface-container-low min-h-0 space-y-3">
      <div className="flex-1 flex flex-col space-y-3 min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/15 pb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 shadow-xs">
              <Icon name="event_busy" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base tablet:text-lg font-bold tracking-tight text-on-surface">
                Hari Libur & Cuti ({filteredHolidays.length})
              </h2>
              <p className="text-[11.5px] font-medium text-on-surface-variant truncate">
                Libur nasional, cuti bersama & prodi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 text-[11.5px] font-bold text-on-surface hover:border-blue-500 hover:text-blue-700 transition-colors cursor-pointer shadow-2xs"
              title="Impor Libur Resmi Nasional Otomatis"
            >
              <Icon name="cloud_sync" size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Sinkron Libur</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-[11.5px] font-bold text-on-secondary shadow-xs hover:bg-secondary/90 transition-colors cursor-pointer"
              title="Tambah Hari Libur"
              aria-label="Tambah Libur"
            >
              <Icon name="add" size={15} />
              <span>Tambah Libur</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar for Holidays */}
        <div className="flex items-center gap-2 overflow-x-auto tablet:overflow-visible no-scrollbar w-full max-w-full pb-0.5 relative z-30">
          {/* Type Filter Buttons */}
          <div className="flex items-center rounded-full bg-surface-container-low/60 border border-outline-variant/25 p-0.5 dark:bg-surface-container-high/30 shrink-0">
            {[
              { id: 'semua', label: 'Semua' },
              { id: 'nasional', label: 'Nasional' },
              { id: 'kampus', label: 'Kampus' },
              { id: 'semester', label: 'Semester' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setHolidayTypeFilter(tab.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  holidayTypeFilter === tab.id
                    ? 'bg-primary text-on-primary shadow-xs font-extrabold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Prodi Scope Filter */}
          <HolidayProdiFilterDropdown
            programs={programs}
            selected={holidayProdiFilter}
            onSelect={setHolidayProdiFilter}
          />
        </div>

        {/* List Hari Libur */}
        {loadingHolidays ? (
          <div className="space-y-2.5">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : filteredHolidays.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <EmptyState
              icon="event_busy"
              title="Tidak ada hari libur yang cocok"
              description={
                totalHolidaysCount === 0
                  ? 'Belum ada hari libur terdaftar. Klik "Sinkron Libur" untuk mengimpor hari libur nasional otomatis.'
                  : 'Coba ubah filter kategori atau scope prodi di atas.'
              }
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
            {filteredHolidays.map((h) => {
              const isProdiScoped = h.prodi && h.prodi !== 'Semua'
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-3 tablet:p-3.5 dark:bg-surface-container-high/20 transition-all hover:border-secondary/30 shadow-2xs border-l-4 border-l-blue-600"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-body-sm text-on-surface truncate">{h.nama}</p>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                          h.tipe === 'nasional'
                            ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20'
                            : h.tipe === 'kampus'
                            ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                            : 'bg-secondary/10 text-secondary border border-secondary/20'
                        }`}
                      >
                        {h.tipe || 'nasional'}
                      </span>

                      {isProdiScoped ? (
                        <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                          🎓 {h.prodi}
                        </span>
                      ) : (
                        <span className="rounded-lg bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
                          Semua Prodi
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-body-xs text-on-surface-variant mt-1">
                      {h.mulai} {h.selesai && h.selesai !== h.mulai ? `s.d ${h.selesai}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteTarget(h)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer shrink-0 border border-outline-variant/15"
                    title="Hapus Hari Libur"
                  >
                    <Icon name="delete" size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
