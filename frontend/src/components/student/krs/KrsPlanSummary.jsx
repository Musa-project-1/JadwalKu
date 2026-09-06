import { Icon } from '../../Icon'
import { formatRuang } from '../../../lib/scheduleUtils'

export function KrsPlanSummary({
  plans,
  activePlanId,
  setActivePlanId,
  activePlan,
  maxSks,
  setMaxSks,
  sksLimitOptions,
  totalSks,
  remainingSks,
  isOverLimit,
  sksPercentage,
  selectedClashMap,
  selectedScheduleList,
  selectedGroupedByDay,
  courseMap,
  removeClassSelection,
  handleCopySiakadFormat,
  copied,
  handleApplyToSchedule,
  appliedSuccess,
  t,
}) {
  return (
    <div className="tablet:col-span-5 tablet:overflow-y-auto p-4 tablet:p-5 flex flex-col space-y-4 bg-surface-container-lowest dark:bg-surface-container-low custom-scrollbar">
      {/* Plan Selector */}
      <div className="flex items-center p-1 rounded-2xl bg-surface-container-low dark:bg-surface-container-high border border-outline-variant/25 shrink-0">
        {plans.map((p) => {
          const isActive = p.id === activePlanId
          const count = (p.ids || []).length
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePlanId(p.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-body-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>
                {p.name.replace(' (Utama)', '').replace(' (Cadangan)', '').replace(' (Alternatif)', '')}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* SKS Gauge & Limit Card */}
      <div className="p-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-low/40 dark:bg-surface-container-high/20 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            Batas Beban SKS:
          </span>
          <div className="flex items-center gap-1">
            {sksLimitOptions.map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => setMaxSks(limit)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  maxSks === limit
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        </div>

        {/* Progress & Quota */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-body-xs font-bold">
            <span className={isOverLimit ? 'text-error font-black' : 'text-purple-700 dark:text-purple-300 font-extrabold'}>
              Total: {totalSks} / {maxSks} SKS
            </span>
            <span className={`text-[11px] ${isOverLimit ? 'text-error font-extrabold' : 'text-on-surface-variant'}`}>
              {isOverLimit ? `Lebih ${totalSks - maxSks} SKS!` : `Sisa Kuota: ${remainingSks} SKS`}
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-surface-container-highest overflow-hidden p-0.5 border border-outline-variant/20">
            <div
              className={`h-full rounded-full transition-all duration-300 shadow-2xs ${
                isOverLimit
                  ? 'bg-error'
                  : totalSks === maxSks
                  ? 'bg-emerald-500'
                  : 'bg-purple-600'
              }`}
              style={{ width: `${sksPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clash Detection Hub */}
      {selectedClashMap.size > 0 ? (
        <div className="p-3.5 rounded-2xl border border-error/35 bg-error/10 dark:bg-error/15 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-error font-extrabold text-body-xs">
            <Icon name="error" size={17} className="shrink-0 animate-bounce" />
            <span>{t ? t('krs.clash_banner_title') : 'Bentrok Jadwal Terdeteksi'}</span>
          </div>
          <p className="text-[11px] text-error/90 leading-relaxed font-medium">
            {t
              ? t('krs.clash_banner_desc')
              : 'Beberapa mata kuliah yang Anda pilih bertabrakan pada jam yang sama. Hapus salah satu jadwal di bawah agar KRS valid.'}
          </p>
        </div>
      ) : selectedScheduleList.length > 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-body-xs font-bold shadow-2xs">
          <Icon name="check_circle" size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Jadwal Aman (0 Bentrok Waktu)</span>
        </div>
      ) : null}

      {/* Selected Courses Grouped by Day */}
      <div className="space-y-2.5 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            Rencana Jadwal Terpilih ({selectedScheduleList.length} Kelas)
          </span>
          {selectedScheduleList.length > 0 && (
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
              {totalSks} SKS
            </span>
          )}
        </div>

        {selectedScheduleList.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30 p-4">
            <Icon name="event_busy" size={32} className="opacity-40 mb-1.5" />
            <p className="text-body-xs font-semibold">
              {t ? t('krs.empty_plan', { plan: activePlan.name }) : `Belum ada kelas yang dipilih untuk ${activePlan.name}`}
            </p>
            <p className="text-[11px] opacity-75 mt-0.5">
              {t ? t('krs.empty_plan_sub') : 'Pilih kelas dari katalog di sisi kiri'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {selectedGroupedByDay.map(({ day, items }) => (
              <div key={day} className="space-y-1.5">
                <span className="inline-block px-2 py-0.5 rounded-md bg-surface-container text-[10px] font-extrabold text-on-surface uppercase tracking-wider border border-outline-variant/20">
                  {day}
                </span>
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const course = courseMap.get(item.kodeMK)
                    const hasClash = selectedClashMap.has(item.id)
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                          hasClash
                            ? 'border-error/40 bg-error/10 text-error'
                            : 'border-outline-variant/20 bg-surface-container-low/60 text-on-surface'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-body-xs font-bold truncate">
                              {course?.namaMK || item.kodeMK}
                            </span>
                            <span className="text-[10px] font-extrabold opacity-75 shrink-0">
                              ({course?.sks || 2} SKS)
                            </span>
                          </div>
                          <p className="text-[10.5px] opacity-80 truncate">
                            {item.jamMulai} – {item.jamSelesai} · {formatRuang(item.ruang, item.tipeKelas)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeClassSelection(item.id)}
                          aria-label="Hapus kelas"
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions Hub (Salin SIAKAD & Apply) */}
      <div className="pt-2 border-t border-outline-variant/20 space-y-2">
        <button
          type="button"
          onClick={handleCopySiakadFormat}
          disabled={selectedScheduleList.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-purple-500/35 bg-purple-500/10 hover:bg-purple-500/20 text-purple-900 dark:text-purple-200 text-body-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <Icon name={copied ? 'check' : 'content_copy'} size={15} />
          <span>{copied ? (t ? t('krs.copied_siakad') : 'Tersalin untuk SIAKAD!') : (t ? t('krs.copy_siakad') : 'Salin Format SIAKAD')}</span>
        </button>

        <button
          type="button"
          onClick={handleApplyToSchedule}
          disabled={selectedScheduleList.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 text-white text-body-xs font-bold shadow-xs hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Icon name={appliedSuccess ? 'check_circle' : 'check'} size={16} />
          <span>{appliedSuccess ? (t ? t('krs.applied_success') : 'Berhasil Diterapkan!') : (t ? t('krs.apply_to_schedule') : 'Terapkan ke Jadwal Utama')}</span>
        </button>
      </div>
    </div>
  )
}
