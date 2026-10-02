import { useMemo, useEffect } from 'react'
import { Icon } from '../Icon'
import { useAttendance } from '../../hooks/useAttendance'
import { useApp } from '../../hooks/useApp'

export function AttendanceOverviewModal({
  isOpen: rawIsOpen,
  open: rawOpen,
  onClose,
  scheduleEntries: rawScheduleEntries,
  scheduleSource,
  courses = [],
  onSelectCourse,
}) {
  const isOpen = rawIsOpen ?? rawOpen ?? false
  const scheduleEntries = useMemo(
    () => ((rawScheduleEntries && rawScheduleEntries.length > 0) ? rawScheduleEntries : (scheduleSource || [])),
    [rawScheduleEntries, scheduleSource],
  )
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
        <header className="flex items-center justify-between p-3 tablet:p-5 border-b border-outline-variant/20 shrink-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white border border-white/20 shadow-xs">
              <Icon name="fact_check" size={20} />
            </div>
            <div className="min-w-0">
              <h3 id="attendance-overview-title" className="text-title-sm tablet:text-title-md font-black text-white tracking-tight truncate">
                {language === 'en' ? 'Attendance & Absence Allowance' : 'Rekap Presensi & Jatah UAS'}
              </h3>
              <p className="text-[11px] tablet:text-body-xs text-white/80 font-medium truncate mt-0.5">
                {language === 'en' ? 'Final exam eligibility: Min 75% attendance (Max 4 absences)' : 'Syarat UAS: Min. 75% kehadiran (Maks. 4x absen)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t ? t('action.close') : 'Tutup modal'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        {/* Summary Metric Strip */}
        <div className="p-2.5 tablet:p-3 bg-surface-container-low/50 dark:bg-surface-container-high/20 border-b border-outline-variant/15 shrink-0">
          <div className="rounded-xl tablet:rounded-2xl border border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low grid grid-cols-3 divide-x divide-outline-variant/20 shadow-2xs">
            <div className="p-2 tablet:p-3 text-center">
              <p className="text-[10px] tablet:text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant truncate">Total Matkul</p>
              <p className="text-base tablet:text-xl font-black text-on-surface mt-0.5 leading-none">{uniqueCourses.length}</p>
            </div>
            
            <div className="p-2 tablet:p-3 text-center">
              <p className="text-[10px] tablet:text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant truncate">Rata-rata</p>
              <p className={`text-base tablet:text-xl font-black mt-0.5 leading-none ${overallStats.avgPercent >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
                {overallStats.avgPercent}%
              </p>
            </div>

            <div className={`p-2 tablet:p-3 text-center rounded-r-xl tablet:rounded-r-2xl ${
              overallStats.criticalCount > 0
                ? 'bg-error/10 text-error'
                : overallStats.warningCount > 0
                ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300'
                : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
            }`}>
              <p className="text-[10px] tablet:text-[11px] font-extrabold uppercase tracking-wider truncate">Status UAS</p>
              <p className="text-base tablet:text-xl font-black mt-0.5 leading-none truncate">
                {overallStats.criticalCount > 0
                  ? `${overallStats.criticalCount} Kritis`
                  : overallStats.warningCount > 0
                  ? `${overallStats.warningCount} Waspada`
                  : '100% Aman'}
              </p>
            </div>
          </div>
        </div>

        {/* Course Attendance List - Responsive Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 tablet:p-4 custom-scrollbar">
          {uniqueCourses.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <Icon name="event_busy" size={36} className="mx-auto text-outline-variant" />
              <p className="text-body-sm font-semibold mt-2">Belum ada mata kuliah aktif pada jadwal</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-2.5 tablet:gap-3">
              {uniqueCourses.map((c) => {
                const att = getCourseAttendance(c.kodeMK)
                const isDanger = att.statusTier === 'danger'
                const isWarning = att.statusTier === 'warning'

                return (
                  <div
                    key={c.kodeMK}
                    className={`rounded-xl tablet:rounded-2xl border p-2.5 tablet:p-3.5 shadow-2xs transition-all space-y-2 ${
                      isDanger
                        ? 'border-error/40 bg-error/5 dark:bg-error/10 ring-1 ring-error/25'
                        : isWarning
                        ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 ring-1 ring-amber-500/25'
                        : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-low'
                    }`}
                  >
                    {/* Row 1: Code, SKS, Allowance Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[10px] font-black text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded-md shrink-0">
                          {c.kodeMK}
                        </span>
                        <span className="text-[10.5px] font-bold text-on-surface-variant shrink-0">
                          {c.sks} SKS
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-black shadow-2xs shrink-0 ${
                          isDanger
                            ? 'bg-error text-white'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        <Icon
                          name={isDanger ? 'error' : isWarning ? 'warning' : 'check_circle'}
                          size={12}
                        />
                        <span>
                          {isDanger
                            ? 'Jatah Habis (0x)!'
                            : `Sisa Jatah: ${att.remainingAbsences}x`}
                        </span>
                      </span>
                    </div>

                    {/* Row 2: Course Name & Lecturer */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-body-xs tablet:text-body-sm text-on-surface leading-tight truncate">
                        {c.namaMK}
                      </h4>
                      <p className="text-[10.5px] text-on-surface-variant font-medium truncate mt-0.5">
                        {c.dosen}
                      </p>
                    </div>

                    {/* Row 3: Pills (H, I, S, A) & Attendance % */}
                    <div className="pt-1.5 border-t border-outline-variant/15 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                          H:{att.counts.hadir}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-800 dark:text-blue-300">
                          I:{att.counts.izin}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-900 dark:text-amber-300">
                          S:{att.counts.sakit}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-error/15 text-error">
                          A:{att.counts.alpa}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10.5px] text-on-surface-variant font-bold">
                          {att.counts.totalFilled}/{att.totalSessions} Sesi
                        </span>
                        <span className={`text-[11px] font-black ${att.attendancePercent >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
                          {att.attendancePercent}%
                        </span>
                        {onSelectCourse && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose()
                              onSelectCourse(c.kodeMK)
                            }}
                            className="inline-flex items-center gap-0.5 text-[10.5px] font-black text-primary hover:underline cursor-pointer pl-1"
                          >
                            <span>Catat</span>
                            <Icon name="arrow_forward" size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Row 4: Subtle Progress Line */}
                    <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${att.attendancePercent >= 75 ? 'bg-emerald-500' : 'bg-error'}`}
                        style={{ width: `${Math.min(att.attendancePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between p-2.5 tablet:p-3 border-t border-outline-variant/15 bg-surface-container-low/40 shrink-0">
          <span className="text-[10.5px] text-on-surface-variant font-medium truncate">
            Ketuk &quot;Catat&quot; untuk membuka panel perkuliahan lengkap
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-body-xs border border-outline-variant/25 transition-all shadow-xs cursor-pointer shrink-0 ml-2"
          >
            {t ? t('modal.close') : 'Tutup'}
          </button>
        </footer>
      </div>
    </div>
  )
}
