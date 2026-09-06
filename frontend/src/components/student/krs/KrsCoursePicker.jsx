import { Icon } from '../../Icon'
import { formatRuang } from '../../../lib/scheduleUtils'
import { getClassType, TONE_CLASSES } from '../../../lib/classTypes'

export function KrsCoursePicker({
  search,
  setSearch,
  prodiFilter,
  setProdiFilter,
  prodiOptions,
  semesterFilter,
  setSemesterFilter,
  currentSemester,
  handleCopyFromCurrentPackage,
  handleClearActivePlan,
  filtered,
  selectedIds,
  courseMap,
  selectedClashMap,
  toggleClassSelection,
  language,
  t,
}) {
  return (
    <div className="tablet:col-span-7 tablet:overflow-y-auto p-4 tablet:p-5 flex flex-col space-y-3.5 border-b tablet:border-b-0 tablet:border-r border-outline-variant/20 bg-surface-container-low/30 dark:bg-surface-container-high/10 custom-scrollbar">
      {/* Search & Filter Bar */}
      <div className="space-y-2.5 p-3 rounded-2xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/25 shadow-2xs">
        <div className="relative">
          <Icon name="search" size={16} className="absolute left-3 top-2.5 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari mata kuliah, kode, dosen, atau ruang..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high/40"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <select
              value={prodiFilter}
              onChange={(e) => setProdiFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high cursor-pointer flex-1"
            >
              {prodiOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-body-xs text-on-surface font-semibold focus:outline-none focus:border-primary dark:bg-surface-container-high cursor-pointer"
            >
              <option value="">Semua Sem</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Sem {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyFromCurrentPackage}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-800 dark:text-purple-300 text-[11px] font-bold border border-purple-500/30 transition-all cursor-pointer shadow-2xs"
            >
              + Paket Sem {currentSemester}
            </button>
            <button
              type="button"
              onClick={handleClearActivePlan}
              className="px-2.5 py-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant text-[11px] font-bold transition-colors cursor-pointer"
            >
              Kosongkan
            </button>
          </div>
        </div>
      </div>

      {/* Course List Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
          {language === 'en'
            ? `Class Catalog (${filtered.length} Available)`
            : `Katalog Kelas (${filtered.length} Tersedia)`}
        </span>
        <span className="text-[11px] font-semibold text-on-surface-variant">
          {t ? t('krs.click_to_toggle') : 'Klik kartu untuk memilih / membatalkan'}
        </span>
      </div>

      {/* Schedule List */}
      <div className="space-y-2 flex-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30 p-6">
            <Icon name="search_off" size={36} className="opacity-40 mb-2" />
            <p className="text-body-sm font-semibold">
              {t ? t('krs.empty_catalog') : 'Tidak ada jadwal yang cocok dengan filter'}
            </p>
          </div>
        ) : (
          filtered.map((entry) => {
            const isSelected = selectedIds.has(entry.id)
            const course = courseMap.get(entry.kodeMK)
            const clashMsg = selectedClashMap.get(entry.id)
            const classType = getClassType(entry.tipeKelas)

            return (
              <div
                key={entry.id}
                onClick={() => toggleClassSelection(entry.id)}
                className={`relative flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? clashMsg
                      ? 'border-error bg-error/10 dark:bg-error/15 ring-2 ring-error/40 shadow-xs'
                      : 'border-purple-600 bg-purple-500/10 dark:bg-purple-950/30 ring-2 ring-purple-500/40 shadow-xs'
                    : 'border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low/70 dark:bg-surface-container-low/40'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Custom Checkbox */}
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                      isSelected
                        ? clashMsg
                          ? 'border-error bg-error text-white'
                          : 'border-purple-600 bg-purple-600 text-white shadow-2xs'
                        : 'border-outline-variant bg-surface-container'
                    }`}
                  >
                    {isSelected && <Icon name="check" size={14} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="rounded-md px-1.5 py-0.2 text-[10px] font-extrabold bg-surface-container text-on-surface border border-outline-variant/30">
                        {entry.kodeMK}
                      </span>
                      <span className={`rounded-md px-2 py-0.2 text-[10px] font-bold ${TONE_CLASSES[classType.tone]}`}>
                        {entry.tipeKelas || 'K1'}
                      </span>
                      <span className="text-[10.5px] font-bold text-on-surface-variant">
                        {entry.prodi} · Sem {entry.semester}
                      </span>
                    </div>

                    <h4 className="text-body-sm font-bold text-on-surface leading-tight truncate">
                      {course?.namaMK || entry.kodeMK}
                    </h4>

                    <p className="text-[11px] text-on-surface-variant font-medium mt-1">
                      <strong className="text-on-surface font-bold">{entry.hari}</strong>, {entry.jamMulai} – {entry.jamSelesai} WIB · {formatRuang(entry.ruang, entry.tipeKelas)}
                    </p>

                    {course?.dosen && (
                      <p className="text-[10.5px] text-on-surface-variant/80 truncate mt-0.5">
                        {course.dosen}
                      </p>
                    )}

                    {isSelected && clashMsg && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-error bg-error/15 px-2.5 py-1 rounded-xl border border-error/30 animate-pulse">
                        <Icon name="warning" size={14} className="shrink-0" />
                        <span>Bentrok: {clashMsg}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-body-xs font-black text-on-surface">
                    {course?.sks || 2} SKS
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
