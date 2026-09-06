import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import ClassDetailPanel from '../../components/schedule/ClassDetailPanel'
import { ShareModal } from '../../components/ShareModal'
import { useCustomSchedule } from '../../hooks/useCustomSchedule'
import { CustomScheduleModal } from '../../components/student/CustomScheduleModal'
import { AttendanceOverviewModal } from '../../components/student/AttendanceOverviewModal'
import { AnnouncementBanner } from '../../components/student/AnnouncementBanner'
import { CourseNotesModal } from '../../components/student/CourseNotesModal'
import { PrintScheduleModal } from '../../components/student/PrintScheduleModal'
import { KrsSimulatorModal } from '../../components/student/KrsSimulatorModal'
import { ScheduleTimetableGrid } from '../../components/schedule/ScheduleTimetableGrid'
import { PageCard } from '../../components/PageCard'
import { sampleSchedule, sampleCourses } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import { getTodayName, sortByTime, detectClassTransitions } from '../../lib/scheduleUtils'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { getItem } from '../../lib/storage'
import {
  WEEK_DAYS,
  currentMinuteOfDay,
  localDateKey,
  computeConflictedIds,
  computeScheduleSource,
  computeWeekDates,
  computeMonthYearLabel,
  computeWeekRangeLabel,
  computeTimeRange,
  computeHourMarks,
} from '../../components/student/weeklySchedule/scheduleUtils'
import { ScheduleToolbarContent } from '../../components/student/weeklySchedule/ScheduleToolbarContent'
import { WeeklyScheduleHeader } from '../../components/student/weeklySchedule/WeeklyScheduleHeader'
import { MobileScheduleView } from '../../components/student/weeklySchedule/MobileScheduleView'
import { ScheduleTimelineView } from '../../components/student/weeklySchedule/ScheduleTimelineView'
import { ScheduleActionRail } from '../../components/student/weeklySchedule/ScheduleActionRail'

export default function WeeklySchedule() {
  const { program, semester, language, t, showPrayerDividers } = useApp()
  const todayName = getTodayName()
  const [selectedDay, setSelectedDay] = useState(todayName)
  const [detailEntry, setDetailEntry] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewDays, setViewDays] = useState(() => getItem('jadwal:viewDays', '5'))
  const [scheduleViewMode, setScheduleViewMode] = useState(() => getItem('jadwal:scheduleViewMode', 'matrix'))
  const location = useLocation()

  const activeWeekDays = viewDays === '5' ? WEEK_DAYS.slice(0, 5) : WEEK_DAYS

  const { data: settingsDocs } = useFirestore('settings', [])

  const calDoc = useMemo(
    () => settingsDocs.find((d) => d.id === 'academicCalendar'),
    [settingsDocs],
  )

  const currentTA = useMemo(
    () => expectedTahunAjaranForSemester(semester, new Date(), calDoc),
    [semester, calDoc],
  )
  const [selectedTA, setSelectedTA] = useState(currentTA)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setSelectedTA(currentTA)
  }, [currentTA])
  const viewingArchive = selectedTA !== currentTA

  const {
    isCustomMode,
    setScheduleMode,
    customScheduleIds,
    setCustomScheduleIds,
  } = useCustomSchedule()
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [krsSimulatorOpen, setKrsSimulatorOpen] = useState(false)

  const { data: jadwal, loading, error: jadwalError } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'published'],
  ])
  const { data: archivedJadwal } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'archived'],
  ])
  const { data: allPublishedJadwal } = useFirestore(
    isCustomMode ? 'jadwal' : '__noop__',
    isCustomMode ? [['status', '==', 'published']] : [],
  )

  const allTAs = useMemo(() => {
    const set = new Set([currentTA])
    const app = settingsDocs.find((d) => d.id === 'app')
    if (Array.isArray(app?.availableTAs)) app.availableTAs.forEach((ta) => set.add(String(ta)))
    ;[...jadwal, ...archivedJadwal, ...allPublishedJadwal].forEach((e) => {
      const ta = String(e.tahunAjaran ?? '').trim()
      if (ta) set.add(ta)
    })
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [settingsDocs, jadwal, archivedJadwal, allPublishedJadwal, currentTA])

  const { data: mataKuliah } = useFirestore('mataKuliah')

  const useSample = !firebaseReady
  const scheduleSource = useMemo(
    () =>
      computeScheduleSource({
        loading,
        isCustomMode,
        allPublishedJadwal,
        customScheduleIds,
        jadwal,
        archivedJadwal,
        viewingArchive,
        selectedTA,
        currentTA,
        useSample,
        program,
        semester,
        sampleSchedule,
      }),
    [loading, isCustomMode, allPublishedJadwal, customScheduleIds, jadwal, archivedJadwal, viewingArchive, selectedTA, currentTA, useSample, program, semester],
  )

  useEffect(() => {
    const kode = location.state?.openKodeMK
    if (!kode) return
    const match = scheduleSource.find((e) => e.kodeMK === kode)
    // oxlint-disable-next-line react/set-state-in-effect
    if (match) setDetailEntry(match)
  }, [location.state, scheduleSource])

  const courses = useMemo(
    () => (mataKuliah.length > 0 ? mataKuliah : useSample ? sampleCourses : []),
    [mataKuliah, useSample],
  )
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.kodeMK, c])), [courses])

  const conflictedIds = useMemo(
    () => computeConflictedIds(scheduleSource, WEEK_DAYS),
    [scheduleSource],
  )

  const dayEntries = useMemo(
    () => sortByTime(scheduleSource.filter((e) => e.hari === selectedDay)),
    [scheduleSource, selectedDay],
  )

  const allTransitions = useMemo(() => {
    const map = new Map()
    for (const day of WEEK_DAYS) {
      const entries = scheduleSource.filter((e) => e.hari === day)
      const trans = detectClassTransitions(entries)
      trans.forEach((v, k) => map.set(k, v))
    }
    return map
  }, [scheduleSource])

  const { data: libur } = useFirestore('libur', [])
  const holidayDates = useMemo(() => {
    const set = new Set()
    libur.forEach((l) => {
      const tanggal = l?.tanggal
      if (!tanggal) return
      const d = typeof tanggal.toDate === 'function' ? tanggal.toDate() : new Date(tanggal)
      set.add(localDateKey(d))
    })
    return set
  }, [libur])

  const [nowMinute, setNowMinute] = useState(() => currentMinuteOfDay())
  useEffect(() => {
    const id = setInterval(() => setNowMinute(currentMinuteOfDay()), 60_000)
    return () => clearInterval(id)
  }, [])

  const todayISO = useMemo(() => localDateKey(new Date()), [])

  const weekDates = useMemo(
    () => computeWeekDates(weekOffset, activeWeekDays),
    [weekOffset, activeWeekDays],
  )
  const monthYearLabel = useMemo(() => computeMonthYearLabel(weekDates), [weekDates])
  const weekRangeLabel = useMemo(
    () => computeWeekRangeLabel(weekDates, weekOffset, language),
    [weekDates, weekOffset, language],
  )

  const [rangeStart, rangeEnd] = useMemo(
    () => computeTimeRange(scheduleSource),
    [scheduleSource],
  )
  const hourMarks = useMemo(() => computeHourMarks(rangeStart, rangeEnd), [rangeStart, rangeEnd])

  const gridScrollRef = useRef(null)
  const gridBodyRef = useRef(null)
  const [gridBodyHeight, setGridBodyHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.max(380, window.innerHeight - 320)
    }
    return 580
  })

  useLayoutEffect(() => {
    const el = gridBodyRef.current
    if (!el) return
    const update = () => {
      const h = el.clientHeight
      if (h > 50) setGridBodyHeight(h)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const totalHours = Math.max(1, (rangeEnd - rangeStart) / 60)
  const safeGridHeight = gridBodyHeight > 50
    ? gridBodyHeight
    : (typeof window !== 'undefined' ? Math.max(380, window.innerHeight - 320) : 580)
  const pxPerHour = Math.max(28, safeGridHeight / totalHours)
  const gridHeight = safeGridHeight

  function openDetail(entry) {
    setDetailEntry(entry)
  }

  const toolbarContent = (
    <ScheduleToolbarContent
      isCustomMode={isCustomMode}
      setScheduleMode={setScheduleMode}
      customScheduleIds={customScheduleIds}
      language={language}
      setCustomModalOpen={setCustomModalOpen}
      setAttendanceModalOpen={setAttendanceModalOpen}
      setNotesModalOpen={setNotesModalOpen}
      setPrintModalOpen={setPrintModalOpen}
      setKrsSimulatorOpen={setKrsSimulatorOpen}
    />
  )

  const actionRail = (
    <ScheduleActionRail
      isCustomMode={isCustomMode}
      setScheduleMode={setScheduleMode}
      language={language}
      setCustomModalOpen={setCustomModalOpen}
      setAttendanceModalOpen={setAttendanceModalOpen}
      setNotesModalOpen={setNotesModalOpen}
      setPrintModalOpen={setPrintModalOpen}
      setKrsSimulatorOpen={setKrsSimulatorOpen}
    />
  )

  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden animate-fade-in">
      {/* Announcement Banner */}
      <AnnouncementBanner />

      <PageCard
        title=""
        noPadding
        className="overflow-visible w-full max-w-full rounded-3xl"
        bodyClassName="overflow-visible w-full max-w-full !gap-0"
      >
        {/* Header Halaman */}
        <WeeklyScheduleHeader
          program={program}
          semester={semester}
          selectedTA={selectedTA}
          currentTA={currentTA}
          allTAs={allTAs}
          setSelectedTA={setSelectedTA}
          viewingArchive={viewingArchive}
          viewDays={viewDays}
          setViewDays={setViewDays}
          scheduleViewMode={scheduleViewMode}
          setScheduleViewMode={setScheduleViewMode}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          weekRangeLabel={weekRangeLabel}
          language={language}
          t={t}
          setShareOpen={setShareOpen}
        />

        {/* Mobile View (<1024px) */}
        <MobileScheduleView
          toolbarContent={toolbarContent}
          monthYearLabel={monthYearLabel}
          selectedTA={selectedTA}
          setSelectedTA={setSelectedTA}
          currentTA={currentTA}
          allTAs={allTAs}
          setShareOpen={setShareOpen}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          weekRangeLabel={weekRangeLabel}
          language={language}
          activeWeekDays={activeWeekDays}
          weekDates={weekDates}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          todayName={todayName}
          loading={loading}
          dayEntries={dayEntries}
          courseMap={courseMap}
          conflictedIds={conflictedIds}
          allTransitions={allTransitions}
          openDetail={openDetail}
        />

        {/* Desktop View (>=1024px) */}
        <div className="hidden desktop:flex items-stretch min-w-0 w-full border-t border-outline-variant/15">
          {actionRail}

          {scheduleViewMode === 'matrix' ? (
            <div className="flex-1 min-w-0">
              <ScheduleTimetableGrid
                scheduleSource={scheduleSource}
                weekDates={weekDates}
                activeWeekDays={activeWeekDays}
                todayName={todayName}
                todayISO={todayISO}
                holidayDates={holidayDates}
                courseMap={courseMap}
                conflictedIds={conflictedIds}
                allTransitions={allTransitions}
                openDetail={openDetail}
                showPrayerDividers={showPrayerDividers}
                weekRangeLabel={weekRangeLabel}
                toolbarContent={toolbarContent}
              />
            </div>
          ) : (
            <ScheduleTimelineView
              gridScrollRef={gridScrollRef}
              gridBodyRef={gridBodyRef}
              activeWeekDays={activeWeekDays}
              weekDates={weekDates}
              todayName={todayName}
              todayISO={todayISO}
              holidayDates={holidayDates}
              hourMarks={hourMarks}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              pxPerHour={pxPerHour}
              gridHeight={gridHeight}
              nowMinute={nowMinute}
              scheduleSource={scheduleSource}
              courseMap={courseMap}
              conflictedIds={conflictedIds}
              allTransitions={allTransitions}
              openDetail={openDetail}
            />
          )}
        </div>

        {jadwalError && (
          <p className="p-4 text-body-xs text-error font-medium">
            {t ? t('schedule.error_loading') : 'Gagal memuat jadwal. Periksa koneksi internet Anda.'}
          </p>
        )}
      </PageCard>

      {/* Modals */}
      {detailEntry && (
        <ClassDetailPanel
          entry={detailEntry}
          course={courseMap.get(detailEntry.kodeMK)}
          conflicted={conflictedIds.has(detailEntry.id)}
          scheduleSource={scheduleSource}
          onClose={() => setDetailEntry(null)}
        />
      )}

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        jadwal={scheduleSource}
        courses={courses}
        semester={semester}
        program={program}
      />

      <CustomScheduleModal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        allJadwal={allPublishedJadwal.length > 0 ? allPublishedJadwal : sampleSchedule}
        courses={courses}
        selectedIds={customScheduleIds}
        onApply={(ids) => {
          setCustomScheduleIds(ids)
          setScheduleMode('custom')
          setCustomModalOpen(false)
        }}
      />

      <AttendanceOverviewModal
        open={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        scheduleSource={scheduleSource}
        courseMap={courseMap}
      />

      <CourseNotesModal
        open={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        scheduleSource={scheduleSource}
        courseMap={courseMap}
      />

      <PrintScheduleModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        scheduleSource={scheduleSource}
        courseMap={courseMap}
        weekDates={weekDates}
        activeWeekDays={activeWeekDays}
        program={program}
        semester={semester}
        selectedTA={selectedTA}
      />

      <KrsSimulatorModal
        open={krsSimulatorOpen}
        onClose={() => setKrsSimulatorOpen(false)}
        allJadwal={allPublishedJadwal.length > 0 ? allPublishedJadwal : sampleSchedule}
        courses={courses}
        currentSemester={semester}
        onApplyToSchedule={(ids) => {
          setCustomScheduleIds(ids)
          setScheduleMode('custom')
        }}
      />
    </div>
  )
}
