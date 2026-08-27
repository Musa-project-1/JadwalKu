import { Icon } from './Icon'
import { formatRuang } from '../lib/scheduleUtils'

/**
 * Hero Card "Status Kelas Live & Countdown"
 * Mendukung status:
 * 1. ongoing: Sedang berlangsung (dengan live pulse & progress bar sisa waktu)
 * 2. upcoming: Kelas berikutnya (dengan countdown badge)
 * 3. finished: Semua kelas hari ini selesai (kartu apresiasi)
 */
export function NextClassCard({
  liveState,
  entry: propEntry,
  course,
  countdownText,
  urgent: propUrgent = false,
  onDetail,
  onLocation,
  onViewSchedule,
}) {
  // Dukungan data liveState baru atau fallback ke props lama
  const status = liveState?.status ?? (propEntry ? 'upcoming' : 'empty')
  const entry = liveState?.entry ?? propEntry
  const urgent = liveState?.urgent ?? propUrgent

  // 1. STATE: Selesai Hari Ini
  if (status === 'finished') {
    const count = liveState?.totalClassesToday ?? 0
    return (
      <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest dark:bg-surface-container-low p-6 text-on-surface shadow-level-1 border border-outline-variant/30 transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
              <Icon name="check_circle" size={28} />
            </div>
            <div>
              <span className="text-label-caps text-primary uppercase font-bold tracking-wider block mb-0.5">
                Kuliah Hari Ini Selesai
              </span>
              <h3 className="text-title-md font-bold text-on-surface">
                Semua kelas hari ini telah selesai! 🎉
              </h3>
            </div>
          </div>
        </div>

        <p className="mt-3 text-body-sm text-on-surface-variant leading-relaxed">
          Kamu telah menyelesaikan {count > 0 ? `${count} mata kuliah` : 'seluruh perkuliahan'} hari ini. Waktunya istirahat yang cukup atau mengecek daftar tugasmu.
        </p>

        {onViewSchedule && (
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex justify-end">
            <button
              type="button"
              onClick={onViewSchedule}
              className="inline-flex items-center gap-1.5 text-body-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <span>Lihat Jadwal Mingguan Lengkap</span>
              <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Jika tidak ada data entri jadwal
  if (!entry) return null

  const isOngoing = status === 'ongoing'
  const remainingMins = liveState?.remainingMinutes ?? 0
  const elapsedPercent = liveState?.elapsedPercent ?? 0

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 shadow-level-2 transition-all duration-300 hover:shadow-level-3 border ${
        isOngoing
          ? 'bg-gradient-to-br from-teal-900 via-primary to-emerald-950 text-white border-emerald-500/30'
          : 'bg-gradient-to-br from-primary to-primary-container dark:from-primary-container dark:to-surface-container-high text-on-primary dark:text-on-primary-container border-white/10 dark:border-primary/20'
      }`}
    >
      {/* Decorative Blur Effect */}
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 dark:bg-primary/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0 flex-1">
          {/* Status Label Header */}
          <div className="flex items-center gap-2 mb-1.5">
            {isOngoing ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Sedang Berlangsung
              </span>
            ) : (
              <span className="text-label-caps text-on-primary/80 dark:text-on-primary-container/80 uppercase tracking-wider block">
                Kelas Berikutnya
              </span>
            )}
          </div>

          {/* Nama Mata Kuliah */}
          <h3 className="text-[20px] tablet:text-[22px] font-bold leading-tight mb-2.5 text-white dark:text-on-primary-container truncate">
            {course?.namaMK ?? entry.kodeMK}
          </h3>

          {/* Dosen & Ruangan Badges */}
          <div className="flex flex-wrap gap-2">
            {course?.dosen && (
              <span
                title={course.dosen}
                className="bg-white/20 dark:bg-primary/15 dark:border dark:border-primary/20 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 backdrop-blur-sm text-white dark:text-primary max-w-[220px] truncate"
              >
                <Icon name="person" size={14} className="shrink-0" />
                <span className="truncate">{course.dosen}</span>
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (onLocation) onLocation(entry, course)
                else if (onDetail) onDetail()
              }}
              className="bg-white/20 hover:bg-white/30 dark:bg-primary/15 dark:hover:bg-primary/25 dark:border dark:border-primary/20 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 backdrop-blur-sm text-white dark:text-primary transition-colors cursor-pointer"
              title="Lihat Panduan Lokasi Ruangan & Denah Lantai"
            >
              <Icon name="location_on" size={14} />
              <span>{formatRuang(entry.ruang, entry.tipeKelas)}</span>
            </button>
          </div>
        </div>

        {/* Live Badge / Countdown Pill */}
        {isOngoing ? (
          <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex flex-col items-center justify-center shrink-0 whitespace-nowrap shadow-sm">
            <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-200">
              Sisa Waktu
            </span>
            <span className="font-bold text-xs tablet:text-sm text-emerald-100">
              {remainingMins} menit lagi
            </span>
          </div>
        ) : countdownText ? (
          <div
            className={`px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center shadow-sm shrink-0 whitespace-nowrap ${
              urgent
                ? 'animate-[soft-pulse_1.6s_ease-in-out_infinite] bg-error text-white'
                : 'bg-primary-container/80 dark:bg-primary/20 border border-white/10 dark:border-primary/30'
            }`}
          >
            <span className="text-[9px] font-bold uppercase tracking-wide text-white/80 dark:text-teal-200">
              Mulai Dalam
            </span>
            <span className="font-bold text-xs tablet:text-sm text-white dark:text-teal-100">
              {countdownText}
            </span>
          </div>
        ) : null}
      </div>

      {/* Progress Bar Khusus Sedang Berlangsung */}
      {isOngoing && (
        <div className="mt-2 mb-4">
          <div className="flex justify-between items-center text-[10px] text-emerald-200/80 mb-1">
            <span>Progress Kuliah</span>
            <span>{elapsedPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${elapsedPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Info & Detail Button */}
      <div className="flex items-center justify-between bg-black/20 dark:bg-surface-container-lowest/50 rounded-2xl p-3 backdrop-blur-md relative z-10 border border-white/10 dark:border-outline-variant/15 mt-3">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 dark:bg-primary/20 p-2 rounded-xl text-white dark:text-primary">
            <Icon name="schedule" size={20} />
          </div>
          <div>
            <span className="block text-sm font-semibold text-white dark:text-on-surface">
              {entry.jamMulai} - {entry.jamSelesai} WIB
            </span>
            <span className="block text-xs text-on-primary/70 dark:text-on-surface-variant">
              {course?.sks ?? 2} SKS · {entry.kodeMK}
            </span>
          </div>
        </div>
        {onDetail && (
          <button
            type="button"
            onClick={onDetail}
            className="bg-white text-primary dark:bg-primary dark:text-on-primary px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:brightness-105 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Detail
          </button>
        )}
      </div>
    </div>
  )
}

