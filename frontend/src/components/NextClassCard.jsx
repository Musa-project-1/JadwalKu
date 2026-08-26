import { Icon } from './Icon'
import { formatRuang } from '../lib/scheduleUtils'

/**
 * Hero card "Kelas Berikutnya" — kartu teal besar dengan countdown,
 * sesuai referensi Stitch home_today_s_schedule.
 */
export function NextClassCard({ entry, course, countdownText, urgent = false, onDetail }) {
  if (!entry) return null

  // `countdownText` sudah berupa teks ramah dari formatCountdown()
  // (mis. "30 menit lagi" atau "1 jam 15 menit lagi") — jangan diolah ulang.
  const cleanCountdown = countdownText || null

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-container dark:from-primary-container dark:to-surface-container-high p-6 text-on-primary dark:text-on-primary-container shadow-level-2 transition-shadow duration-300 hover:shadow-level-3 border border-white/10 dark:border-primary/20">
      {/* Decorative circle */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 dark:bg-primary/10 blur-xl" />
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div>
          <span className="text-label-caps text-on-primary/80 dark:text-on-primary-container/80 uppercase tracking-wider mb-1 block">Kelas Berikutnya</span>
          <h3 className="text-[22px] font-bold leading-tight mb-3 text-white dark:text-on-primary-container">
            {course?.namaMK ?? entry.kodeMK}
          </h3>
          <div className="flex flex-wrap gap-2">
            {course?.dosen && (
              <span title={course.dosen} className="bg-white/20 dark:bg-primary/15 dark:border dark:border-primary/20 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 backdrop-blur-sm text-white dark:text-primary max-w-[200px] truncate">
                <Icon name="person" size={14} className="shrink-0" />
                <span className="truncate">{course.dosen}</span>
              </span>
            )}
            <span className="bg-white/20 dark:bg-primary/15 dark:border dark:border-primary/20 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 backdrop-blur-sm text-white dark:text-primary">
              <Icon name="location_on" size={14} />
              {formatRuang(entry.ruang, entry.tipeKelas)}
            </span>
          </div>
        </div>
        
        {cleanCountdown && (
          <div className={`px-3 py-1.5 rounded-2xl flex flex-col items-center shadow-sm shrink-0 ${
            urgent
              ? 'animate-[soft-pulse_1.6s_ease-in-out_infinite] bg-error'
              : 'bg-primary-container/80 dark:bg-primary/20 border border-white/10 dark:border-primary/30'
          }`}>
            <span className="text-[9px] font-bold uppercase tracking-wide text-white dark:text-primary">Mulai Dalam</span>
            <span className="font-bold text-sm text-white dark:text-primary">{cleanCountdown}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-black/20 dark:bg-surface-container-lowest/50 rounded-2xl p-3 backdrop-blur-md relative z-10 border border-white/10 dark:border-outline-variant/15 mt-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 dark:bg-primary/20 p-2 rounded-xl text-white dark:text-primary">
            <Icon name="schedule" size={20} />
          </div>
          <div>
            <span className="block text-sm font-semibold text-white dark:text-on-surface">{entry.jamMulai} - {entry.jamSelesai} WIB</span>
            <span className="block text-xs text-on-primary/70 dark:text-on-surface-variant">{course?.sks ?? 2} SKS · {entry.kodeMK}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDetail}
          className="bg-white text-primary dark:bg-primary dark:text-on-primary px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:brightness-105 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
        >
          Detail
        </button>
      </div>
    </div>
  )
}
