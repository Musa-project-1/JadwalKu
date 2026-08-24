import { Icon } from './Icon'

/**
 * Hero card "Kelas Berikutnya" — kartu teal besar dengan countdown,
 * sesuai referensi Stitch home_today_s_schedule.
 */
export function NextClassCard({ entry, course, countdownText, urgent = false }) {
  if (!entry) return null

  return (
    <div className="relative overflow-hidden rounded-schedule bg-primary p-lg text-on-primary shadow-level-1 transition-shadow hover:shadow-level-2">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white opacity-10 blur-2xl" />
      <div className="relative z-10 flex flex-col justify-between gap-md tablet:flex-row tablet:items-center">
        <div className="min-w-0">
          <div className="mb-sm flex items-center gap-sm">
            <span className="rounded bg-on-primary-fixed-variant px-2 py-1 text-label-caps text-on-primary">
              {entry.kodeMK}
            </span>
            <span className="flex items-center gap-xs text-body-sm">
              <Icon name="location_on" size={16} />
              {entry.ruang}
            </span>
          </div>
          <h4 className="mb-xs truncate text-headline-lg-mobile font-bold tablet:text-headline-lg">
            {course?.namaMK ?? entry.kodeMK}
          </h4>
          {course?.dosen && (
            <p className="flex items-center gap-xs text-body-sm opacity-90">
              <Icon name="person" size={16} />
              {course.dosen}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-center gap-sm rounded-xl border border-white/10 bg-on-primary-fixed-variant/20 p-md backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <span className="text-body-sm uppercase tracking-wider opacity-80">Waktu</span>
            <span className="text-title-md font-bold">{entry.jamMulai}</span>
            <span className="text-body-sm opacity-80">- {entry.jamSelesai}</span>
          </div>
        </div>
      </div>
      {countdownText && (
        <p
          className={`relative z-10 mt-md inline-flex items-center gap-xs rounded-full px-3 py-1 text-body-sm font-medium ${
            urgent
              ? 'animate-[soft-pulse_1.6s_ease-in-out_infinite] bg-error text-on-error'
              : 'bg-white/15'
          }`}
        >
          <Icon name="timer" size={16} />
          <span
            key={countdownText}
            className="inline-block animate-[fade-up_180ms_var(--ease-standard)]"
          >
            {countdownText}
          </span>
        </p>
      )}
    </div>
  )
}
