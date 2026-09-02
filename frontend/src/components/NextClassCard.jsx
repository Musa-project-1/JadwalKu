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
          <div className="flex items-center gap-4">
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
      className={`relative overflow-hidden rounded-3xl p-4 tablet:p-6 shadow-level-2 transition-all duration-300 hover:shadow-level-3 border ${
        isOngoing
          ? 'bg-gradient-to-br from-teal-900 via-primary to-emerald-950 text-white border-emerald-500/30'
          : 'bg-surface-container-lowest dark:bg-[#132823] text-on-surface dark:text-white border-teal-500/20 dark:border-teal-500/30'
      }`}
    >
      {/* Decorative Blur — only for ongoing */}
      {isOngoing && <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />}
      {!isOngoing && <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal-500/[0.06] dark:bg-teal-500/[0.08] blur-2xl pointer-events-none" />}

      <div className="relative z-10 flex justify-between items-start gap-3 mb-3.5">
        <div className="min-w-0 flex-1">
          {/* Status Label Header */}
          <div className="flex items-center gap-2 mb-1.5">
            {isOngoing ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-label-caps font-bold text-emerald-300 uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Sedang Berlangsung
              </span>
            ) : (
              <span className="text-label-caps font-bold tracking-wider text-teal-600 dark:text-teal-300 uppercase">
                Kelas Berikutnya
              </span>
            )}
          </div>

          {/* Nama Mata Kuliah */}
          <h3 className={`text-title-md tablet:text-title-lg font-bold leading-tight mb-2.5 truncate ${isOngoing ? 'text-white' : 'text-on-surface dark:text-white'}`}>
            {course?.namaMK ?? entry.kodeMK}
          </h3>

          {/* Dosen & Ruangan Badges — teal pills like mockup */}
          <div className="flex flex-wrap gap-2">
            {course?.dosen && (
              <span
                title={course.dosen}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 max-w-[220px] truncate border ${isOngoing ? 'bg-white/15 text-white border-white/20 backdrop-blur-sm' : 'bg-teal-500/10 dark:bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/20 dark:border-teal-500/25'}`}
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
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isOngoing ? 'bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm' : 'bg-teal-500/10 hover:bg-teal-500/15 dark:bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/20 dark:border-teal-500/25'}`}
              title="Lihat Panduan Lokasi Ruangan & Denah Lantai"
            >
              <Icon name="location_on" size={14} />
              <span>{formatRuang(entry.ruang, entry.tipeKelas)}</span>
            </button>
          </div>
        </div>

        {/* Live Badge / Countdown Pill — MULAI DALAM like mockup */}
        {isOngoing ? (
          <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex flex-col items-center justify-center shrink-0 whitespace-nowrap shadow-sm">
            <span className="text-label-caps font-bold uppercase tracking-wide text-emerald-200">
              Sisa Waktu
            </span>
            <span className="font-bold text-xs tablet:text-sm text-emerald-100">
              {remainingMins} menit lagi
            </span>
          </div>
        ) : countdownText ? (
          <div
            className={`px-3.5 py-2 rounded-2xl flex flex-col items-center justify-center shrink-0 whitespace-nowrap text-center min-w-[92px] ${
              urgent
                ? 'animate-[soft-pulse_1.6s_ease-in-out_infinite] bg-error text-white shadow-sm'
                : 'bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 dark:border-teal-500/25'
            }`}
          >
            <span className={`text-label-caps font-bold uppercase tracking-wider ${urgent ? 'text-white/90' : 'text-teal-600 dark:text-teal-300'}`}>
              Mulai Dalam
            </span>
            <span className={`font-bold text-xs tablet:text-body-sm leading-tight ${urgent ? 'text-white' : 'text-teal-800 dark:text-white'}`}>
              {countdownText}
            </span>
          </div>
        ) : null}
      </div>

      {/* Progress Bar Khusus Sedang Berlangsung */}
      {isOngoing && (
        <div className="mt-2 mb-4">
          <div className="flex justify-between items-center text-label-caps text-emerald-200/80 mb-1">
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

      {/* Footer Info & Detail Button — clock pill + Detail teal like mockup */}
      <div className={`flex items-center justify-between rounded-2xl p-3 relative z-10 mt-3 border ${isOngoing ? 'bg-black/20 backdrop-blur-md border-white/10' : 'bg-surface-container dark:bg-black/25 border-outline-variant/15 dark:border-white/10'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isOngoing ? 'bg-white/20 text-white' : 'bg-teal-500/15 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300'}`}>
            <Icon name="schedule" size={20} />
          </div>
          <div>
            <span className={`block text-sm font-semibold ${isOngoing ? 'text-white' : 'text-on-surface dark:text-white'}`}>
              {entry.jamMulai} - {entry.jamSelesai} WIB
            </span>
            <span className={`block text-xs ${isOngoing ? 'text-white/70' : 'text-on-surface-variant dark:text-white/70'}`}>
              {course?.sks ?? 2} SKS · {entry.kodeMK}
            </span>
          </div>
        </div>
        {onDetail && (
          <button
            type="button"
            onClick={onDetail}
            className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:brightness-105 hover:shadow-md active:opacity-80 transition-all duration-200 cursor-pointer ${isOngoing ? 'bg-white text-teal-800' : 'bg-teal-600 dark:bg-teal-500 text-white hover:bg-teal-700 dark:hover:bg-teal-400'}`}
          >
            Detail
          </button>
        )}
      </div>
    </div>
  )
}

