import { Icon } from './Icon'

/**
 * Hero card "Kelas Berikutnya" — kartu teal besar dengan countdown,
 * sesuai referensi Stitch home_today_s_schedule.
 */
export function NextClassCard({ entry, course, countdownText, urgent = false }) {
  if (!entry) return null

  // `countdownText` sudah berupa teks ramah dari formatCountdown()
  // (mis. "30 menit lagi" atau "1 jam 15 menit lagi") — jangan diolah ulang.
  const cleanCountdown = countdownText || null

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-container p-6 text-on-primary shadow-level-2 transition-transform duration-300 hover:scale-[1.01] hover:shadow-level-3">
      {/* Decorative circle */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div>
          <span className="text-label-caps text-on-primary/80 uppercase tracking-wider mb-1 block">Kelas Berikutnya</span>
          <h3 className="text-[22px] font-bold leading-tight mb-3 text-white">
            {course?.namaMK ?? entry.kodeMK}
          </h3>
          <div className="flex flex-wrap gap-2">
            {course?.dosen && (
              <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 backdrop-blur-sm">
                <Icon name="person" size={14} />
                {course.dosen}
              </span>
            )}
            <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 backdrop-blur-sm">
              <Icon name="location_on" size={14} />
              {entry.ruang}
            </span>
          </div>
        </div>
        
        {cleanCountdown && (
          <div className={`px-3 py-1.5 rounded-2xl flex flex-col items-center shadow-sm shrink-0 ${
            urgent ? 'animate-[soft-pulse_1.6s_ease-in-out_infinite] bg-error' : 'bg-primary-container'
          }`}>
            <span className="text-[9px] font-bold uppercase tracking-wide text-white">Mulai Dalam</span>
            <span className="font-bold text-sm text-white">{cleanCountdown}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-black/20 rounded-2xl p-3 backdrop-blur-md relative z-10 border border-white/10 mt-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl text-white">
            <Icon name="schedule" size={20} />
          </div>
          <div>
            <span className="block text-sm font-semibold text-white">{entry.jamMulai} - {entry.jamSelesai} WIB</span>
            <span className="block text-xs text-on-primary/70">{course?.sks ?? 2} SKS · {entry.kodeMK}</span>
          </div>
        </div>
        <button
          type="button"
          className="bg-on-primary text-primary px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:scale-105 transition-transform active:scale-95 duration-150"
        >
          Detail
        </button>
      </div>
    </div>
  )
}
