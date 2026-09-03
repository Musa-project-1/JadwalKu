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
  course,
  countdownText,
  entry: propEntry,
  onDetail,
  onLocation,
  onViewSchedule,
}) {
  const status = liveState?.status ?? (propEntry ? 'upcoming' : 'empty')
  const entry = liveState?.entry ?? propEntry

  // 1. STATE: Selesai Hari Ini
  if (status === 'finished') {
    const count = liveState?.totalClassesToday ?? 0
    return (
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low/70 dark:bg-surface-container/60 p-4 tablet:p-5 text-on-surface shadow-2xs border border-outline-variant/20 transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-status-k1-bg text-status-k1 border border-status-k1-border/50 shadow-2xs">
              <Icon name="check_circle" size={24} />
            </div>
            <div>
              <span className="text-label-caps text-status-k1 uppercase font-bold tracking-wider block">
                Kuliah Hari Ini Selesai
              </span>
              <h3 className="text-title-sm tablet:text-title-md font-bold text-on-surface mt-0.5">
                Semua kelas hari ini telah selesai! 🎉
              </h3>
            </div>
          </div>
        </div>

        <p className="mt-2.5 text-body-xs text-on-surface-variant leading-relaxed">
          Kamu telah menyelesaikan {count > 0 ? `${count} mata kuliah` : 'seluruh perkuliahan'} hari ini. Waktunya istirahat yang cukup atau mengecek daftar tugasmu.
        </p>

        {onViewSchedule && (
          <div className="mt-3 pt-2.5 border-t border-outline-variant/15 flex justify-end">
            <button
              type="button"
              onClick={onViewSchedule}
              className="inline-flex items-center gap-1 text-label-caps font-bold text-primary hover:underline cursor-pointer"
            >
              <span>Lihat Jadwal Mingguan Lengkap</span>
              <Icon name="arrow_forward" size={13} />
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!entry) return null

  const isOngoing = status === 'ongoing'
  const remainingMins = liveState?.remainingMinutes ?? 0
  const elapsedPercent = liveState?.elapsedPercent ?? 0

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 tablet:p-5 shadow-level-1 transition-all duration-300 border ${
        isOngoing
          ? 'bg-gradient-to-br from-teal-900 via-primary to-emerald-950 text-white border-emerald-500/40'
          : 'bg-surface-container-low/80 dark:bg-surface-container/70 text-on-surface border-outline-variant/25'
      }`}
    >
      <div className="relative z-10 flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isOngoing ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-label-caps font-bold text-emerald-300 uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Sedang Berlangsung
              </span>
            ) : (
              <span className="text-label-caps font-bold tracking-wider text-primary uppercase">
                Kelas Berikutnya
              </span>
            )}
          </div>

          <h3
            onClick={onDetail ? onDetail : undefined}
            className={`text-title-sm tablet:text-title-md font-bold leading-tight mb-2 truncate ${
              isOngoing ? 'text-white' : 'text-on-surface'
            } ${onDetail ? 'cursor-pointer hover:underline decoration-primary/60 underline-offset-2' : ''}`}
            title={onDetail ? 'Buka detail mata kuliah di jadwal' : undefined}
          >
            {course?.namaMK ?? entry.kodeMK}
          </h3>

          <div className="flex flex-wrap gap-2">
            {course?.dosen && (
              <span
                title={course.dosen}
                className={`px-2.5 py-0.5 rounded-full text-label-caps font-semibold flex items-center gap-1.5 max-w-[220px] truncate border ${
                  isOngoing
                    ? 'bg-white/15 text-white border-white/20'
                    : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                }`}
              >
                <Icon name="person" size={13} className="shrink-0" />
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
              className={`px-2.5 py-0.5 rounded-full text-label-caps font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs hover:opacity-85 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isOngoing
                  ? 'bg-white/15 text-white border-white/25 hover:bg-white/25'
                  : 'bg-status-k1-bg text-status-k1 border-status-k1-border hover:border-status-k1'
              }`}
              title="Lihat Panduan Lokasi Ruangan & Denah Lantai"
            >
              <Icon name="meeting_room" size={13} />
              <span>{formatRuang(entry.ruang, entry.tipeKelas)}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`font-mono text-label-caps font-extrabold px-2.5 py-1 rounded-lg border shadow-2xs ${
              isOngoing
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-primary/10 text-primary border-primary/20'
            }`}
          >
            {entry.jamMulai} - {entry.jamSelesai}
          </span>
          {countdownText && (
            <span className="text-label-caps font-bold text-status-gbk flex items-center gap-1">
              <Icon name="timer" size={12} />
              <span>{countdownText}</span>
            </span>
          )}
        </div>
      </div>

      {isOngoing && (
        <div className="mt-3 pt-2.5 border-t border-white/15">
          <div className="flex justify-between text-[11px] text-emerald-200 mb-1 font-semibold">
            <span>Sisa {remainingMins} menit</span>
            <span>{elapsedPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${elapsedPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
