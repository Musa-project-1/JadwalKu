import { useMemo, useEffect } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { useAttendance } from '../../hooks/useAttendance'
import { useApp } from '../../hooks/useApp'

export function AttendanceOverviewModal({
  isOpen,
  onClose,
  scheduleEntries = [],
  courses = [],
  onSelectCourse,
}) {
  const { language, t } = useApp()
  const { getCourseAttendance } = useAttendance()

  const courseMap = useMemo(() => {
    const map = new Map()
    for (const c of courses) {
      if (c.kodeMK) map.set(c.kodeMK, c)
    }
    return map
  }, [courses])

  // Support ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose?.()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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
          dosen: course?.dosen || 'Dosen belum ditentukan',
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
      aria-labelledby="attendance-overview-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-6 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] tablet:max-h-[88vh] flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-low shadow-2xl animate-fade-up overflow-hidden"
      >
        {/* Header Modal - Gradient Forest/Emerald Theme */}
        <header className="flex items-center justify-between p-4 tablet:p-5 border-b border-outline-variant/20 shrink-0 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs">
              <Icon name="fact_check" size={22} />
            </div>
            <div className="min-w-0">
              <h3 id="attendance-overview-title" className="text-title-sm tablet:text-title-md font-bold text-white tracking-tight truncate">
                {language === 'en' ? 'Attendance & Absence Allowance' : 'Rekap Presensi & Sisa Jatah Absen'}
              </h3>
              <p className="text-body-xs text-white/80 font-medium truncate mt-0.5">
                {language === 'en' ? 'Final exam eligibility: Min 75% attendance (Max 4 absences of 16 sessions)' : 'Syarat kelulusan UAS: Minimal 75% kehadiran (Maksimal 4x absen dari 16 pertemuan)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t ? t('action.close') : 'Tutup modal'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        {/* Summary Metric Cards */}
        <div className="p-4 bg-surface-container-low/50 dark:bg-surface-container-high/20 border-b border-outline-variant/15 grid grid-cols-3 gap-3 shrink-0">
          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 text-center shadow-2xs">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">Total Matkul</p>
            <p className="text-xl tablet:text-2xl font-black text-on-surface mt-0.5">{uniqueCourses.length}</p>
          </div>
          
          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low p-3.5 text-center shadow-2xs">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">Rata-rata Hadir</p>
            <p className={`text-xl tablet:text-2xl font-black mt-0.5 ${overallStats.avgPercent >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
              {overallStats.avgPercent}%
            </p>
          </div>

          <div className={`rounded-2xl border p-3.5 text-center shadow-2xs ${
            overallStats.criticalCount > 0
              ? 'border-error/40 bg-error/15 text-error ring-1 ring-error/25'
              : overallStats.warningCount > 0
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/25'
              : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/25'
          }`}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider">Status Absensi</p>
            <p className="text-xl tablet:text-2xl font-black mt-0.5">
              {overallStats.criticalCount > 0
                ? `${overallStats.criticalCount} Kritis`
                : overallStats.warningCount > 0
                ? `${overallStats.warningCount} Waspada`
                : '100% Aman'}
            </p>
          </div>
        </div>

        {/* Course Attendance List - 2-Column Responsive Grid on Tablet/Desktop */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 tablet:p-5 custom-scrollbar">
          {uniqueCourses.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <Icon name="event_busy" size={36} className="mx-auto text-outline-variant" />
              <p className="text-body-sm font-semibold mt-2">Belum ada mata kuliah aktif pada jadwal</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3.5">
              {uniqueCourses.map((c) => {
                const att = getCourseAttendance(c.kodeMK)
                const isDanger = att.statusTier === 'danger'
                const isWarning = att.statusTier === 'warning'

                return (
                  <div
                    key={c.kodeMK}
                    className={`rounded-2xl border p-4 shadow-2xs transition-all flex flex-col justify-between space-y-3 ${
                      isDanger
                        ? 'border-error/40 bg-error/5 dark:bg-error/10 ring-1 ring-error/25'
                        : isWarning
                        ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 ring-1 ring-amber-500/25'
                        : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low'
                    }`}
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-mono text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-md">
                              {c.kodeMK}
                            </span>
                            <span className="text-[10.5px] font-bold text-on-surface-variant">
                              {c.sks} SKS
                            </span>
                          </div>
                          <h4 className="font-extrabold text-body-sm text-on-surface leading-snug truncate">
                            {c.namaMK}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant font-medium truncate mt-0.5">
                            {c.dosen}
                          </p>
                        </div>

                        {/* Allowance Badge */}
                        <div className="shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-extrabold shadow-2xs ${
                              isDanger
                                ? 'bg-error text-white'
                                : isWarning
                                ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40'
                                : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            <Icon
                              name={isDanger ? 'error' : isWarning ? 'warning' : 'check_circle'}
                              size={13}
                            />
                            <span>
                              {isDanger
                                ? 'Jatah Habis (0x)!'
                                : `Sisa Jatah: ${att.remainingAbsences}x`}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Counters & Action */}
                    <div className="pt-2.5 border-t border-outline-variant/15 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold">
                            H: {att.counts.hadir}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-800 dark:text-blue-200 font-bold">
                            I: {att.counts.izin}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold">
                            S: {att.counts.sakit}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-error/15 text-error font-bold">
                            A: {att.counts.alpa}
                          </span>
                        </div>

                        {onSelectCourse && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose()
                              onSelectCourse(c.kodeMK)
                            }}
                            className="text-[11px] font-extrabold text-primary hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <span>Catat Presensi</span>
                            <Icon name="arrow_forward" size={12} />
                          </button>
                        )}
                      </div>

                      {/* Mini Attendance Progress */}
                      <div className="flex items-center justify-between text-[10.5px] text-on-surface-variant font-medium">
                        <span>Tercatat: <strong>{att.counts.totalFilled}</strong> / {att.totalSessions} sesi</span>
                        <span className={att.attendancePercent >= 75 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-error font-extrabold'}>
                          Kehadiran: {att.attendancePercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between p-4 border-t border-outline-variant/15 bg-surface-container-low/40 shrink-0">
          <span className="text-[11px] text-on-surface-variant font-medium">
            Ketuk &quot;Catat Presensi&quot; untuk membuka panel perkuliahan lengkap
          </span>
          <Button type="button" onClick={onClose} className="font-bold">
            {t ? t('modal.close') : 'Tutup'}
          </Button>
        </footer>
      </div>
    </div>
  )
}
