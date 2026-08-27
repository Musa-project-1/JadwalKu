import { useMemo } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { useAttendance } from '../../hooks/useAttendance'

export function AttendanceOverviewModal({
  isOpen,
  onClose,
  scheduleEntries = [],
  courses = [],
  onSelectCourse,
}) {
  const { getCourseAttendance } = useAttendance()

  const courseMap = useMemo(() => {
    const map = new Map()
    for (const c of courses) {
      if (c.kodeMK) map.set(c.kodeMK, c)
    }
    return map
  }, [courses])

  // Unique courses from active schedule
  const uniqueCourses = useMemo(() => {
    const set = new Set()
    const list = []
    for (const s of scheduleEntries) {
      if (s.kodeMK && !set.has(s.kodeMK)) {
        set.add(s.kodeMK)
        const course = courseMap.get(s.kodeMK)
        list.push({
          kodeMK: s.kodeMK,
          namaMK: course?.namaMK || s.kodeMK,
          dosen: course?.dosen || 'Dosen -',
          sks: course?.sks || 2,
        })
      }
    }
    return list.sort((a, b) => a.namaMK.localeCompare(b.namaMK))
  }, [scheduleEntries, courseMap])

  // Aggregate stats
  const overallStats = useMemo(() => {
    if (uniqueCourses.length === 0) return { avgPercent: 100, criticalCount: 0, warningCount: 0 }
    let totalPercent = 0
    let criticalCount = 0
    let warningCount = 0

    uniqueCourses.forEach((c) => {
      const att = getCourseAttendance(c.kodeMK)
      totalPercent += att.attendancePercent
      if (att.statusTier === 'danger') criticalCount++
      else if (att.statusTier === 'warning') warningCount++
    })

    return {
      avgPercent: Math.round(totalPercent / uniqueCourses.length),
      criticalCount,
      warningCount,
    }
  }, [uniqueCourses, getCourseAttendance])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-[599px]:items-end max-[599px]:justify-stretch max-[599px]:p-0"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl dark:bg-surface-container-low animate-fade-up max-[599px]:rounded-t-3xl max-[599px]:rounded-b-none max-[599px]:border-x-0 max-[599px]:border-b-0 max-[599px]:max-h-[95vh] overflow-hidden">
        {/* Drag handle for mobile */}
        <div aria-hidden="true" className="hidden max-[599px]:flex justify-center pt-3 pb-1">
          <span className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between p-5 border-b border-outline-variant/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Icon name="fact_check" size={24} />
            </div>
            <div>
              <h3 className="text-title-lg font-bold text-on-surface">Rekap Presensi & Sisa Jatah Absen</h3>
              <p className="text-body-xs text-on-surface-variant">
                Syarat kelulusan UAS: Minimal 75% kehadiran (Maksimal 4x absen dari 16 pertemuan)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        {/* Summary Metric Cards */}
        <div className="p-4 bg-surface-container/30 border-b border-outline-variant/15 grid grid-cols-3 gap-3 shrink-0">
          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-3 text-center dark:bg-surface-container-low">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Matkul</p>
            <p className="text-xl font-bold text-on-surface mt-0.5">{uniqueCourses.length}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-3 text-center dark:bg-surface-container-low">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Rata-rata Hadir</p>
            <p className={`text-xl font-bold mt-0.5 ${overallStats.avgPercent >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
              {overallStats.avgPercent}%
            </p>
          </div>
          <div className={`rounded-2xl border p-3 text-center ${
            overallStats.criticalCount > 0
              ? 'border-error/30 bg-error/10 text-error'
              : overallStats.warningCount > 0
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          }`}>
            <p className="text-[11px] font-bold uppercase tracking-wider">Status Absensi</p>
            <p className="text-xl font-bold mt-0.5">
              {overallStats.criticalCount > 0
                ? `${overallStats.criticalCount} Kritis`
                : overallStats.warningCount > 0
                ? `${overallStats.warningCount} Waspada`
                : '100% Aman'}
            </p>
          </div>
        </div>

        {/* Course Attendance List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {uniqueCourses.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <Icon name="event_busy" size={36} className="mx-auto text-outline-variant" />
              <p className="text-body-sm font-semibold mt-2">Belum ada mata kuliah aktif</p>
            </div>
          ) : (
            uniqueCourses.map((c) => {
              const att = getCourseAttendance(c.kodeMK)
              const statusColor =
                att.statusTier === 'danger'
                  ? 'border-error/40 bg-error/5'
                  : att.statusTier === 'warning'
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container-low'

              return (
                <div
                  key={c.kodeMK}
                  className={`rounded-2xl border p-4 shadow-xs transition-all ${statusColor}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-label-caps font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                          {c.kodeMK}
                        </span>
                        <span className="font-bold text-body-md text-on-surface truncate">
                          {c.namaMK}
                        </span>
                        <span className="text-label-caps text-on-surface-variant font-medium">
                          ({c.sks} SKS · {c.dosen})
                        </span>
                      </div>
                    </div>

                    {/* Badge Sisa Absen */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-body-xs font-bold ${
                          att.statusTier === 'danger'
                            ? 'bg-error text-white shadow-xs'
                            : att.statusTier === 'warning'
                            ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        <Icon
                          name={
                            att.statusTier === 'danger'
                              ? 'error'
                              : att.statusTier === 'warning'
                              ? 'warning'
                              : 'check_circle'
                          }
                          size={14}
                        />
                        <span>
                          {att.statusTier === 'danger'
                            ? `Jatah Absen Habis (0x)!`
                            : `Sisa Jatah: ${att.remainingAbsences}x lagi`}
                        </span>
                      </span>

                      {onSelectCourse && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onSelectCourse(c.kodeMK)
                          }}
                          className="text-body-xs font-bold text-primary hover:underline cursor-pointer ml-1"
                        >
                          Catat Presensi &rarr;
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Presence Counts Bar */}
                  <div className="mt-3 pt-3 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-2 text-body-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 font-bold">
                        Hadir: {att.counts.hadir}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 font-bold">
                        Izin: {att.counts.izin}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2 py-0.5 font-bold">
                        Sakit: {att.counts.sakit}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-error/10 text-error px-2 py-0.5 font-bold">
                        Alpa: {att.counts.alpa}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span>Tercatat: <strong>{att.counts.totalFilled}</strong> / {att.totalSessions} sesi</span>
                      <span>·</span>
                      <span className="font-bold text-on-surface">Persentase: {att.attendancePercent}%</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end p-4 border-t border-outline-variant/15 bg-surface-container/20 shrink-0">
          <Button type="button" onClick={onClose} className="font-bold">
            Tutup
          </Button>
        </footer>
      </div>
    </div>
  )
}

