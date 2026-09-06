import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { useTasks } from '../../hooks/useTasks'
import { sampleSchedule, sampleCourses } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import {
  formatCountdown,
  getClassLiveState,
  getGreetingData,
  getTodayName,
  sortByTime,
} from '../../lib/scheduleUtils'
import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useCustomSchedule } from '../../hooks/useCustomSchedule'
import { AnnouncementBanner } from '../../components/student/AnnouncementBanner'
import { RoomLocationModal } from '../../components/student/RoomLocationModal'
import { HomeGreetingHeader } from '../../components/student/home/HomeGreetingHeader'
import { HomeTodaySection } from '../../components/student/home/HomeTodaySection'
import { HomeSidebarSection } from '../../components/student/home/HomeSidebarSection'

function currentMinuteOfDay() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function getDailyNote() {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = localStorage.getItem('jadwal-kampus:dailyNotes')
    if (!raw) return ''
    const obj = JSON.parse(raw)
    return obj[today] || ''
  } catch {
    return ''
  }
}

function saveDailyNote(v) {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = localStorage.getItem('jadwal-kampus:dailyNotes')
    const obj = raw ? JSON.parse(raw) : {}
    obj[today] = v
    localStorage.setItem('jadwal-kampus:dailyNotes', JSON.stringify(obj))
  } catch {}
}

export default function Home() {
  const navigate = useNavigate()
  const { fakultasId, program, semester, t, formatDay, language } = useApp()
  const { tasks } = useTasks()
  const { isCustomMode, customScheduleIds } = useCustomSchedule()
  const todayName = getTodayName()
  const [roomModalTarget, setRoomModalTarget] = useState(null)

  const { data: settingsDocs } = useFirestore('settings')

  const calDoc = useMemo(
    () => settingsDocs.find((d) => d.id === 'academicCalendar'),
    [settingsDocs],
  )

  const expectedTA = useMemo(
    () => expectedTahunAjaranForSemester(semester, new Date(), calDoc),
    [semester, calDoc],
  )

  const needsTaMigration = useMemo(() => {
    const savedTA = getItem(STORAGE_KEYS.tahunAjaran, null)
    return savedTA && savedTA !== expectedTA
  }, [expectedTA])

  const { data: jadwal, loading, error: jadwalError } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['tahunAjaran', '==', expectedTA || ''],
    ['status', '==', 'published'],
  ])
  const { data: allPublishedJadwal } = useFirestore(
    isCustomMode ? 'jadwal' : '__noop__',
    isCustomMode ? [['status', '==', 'published']] : [],
  )
  const { data: mataKuliah } = useFirestore('mataKuliah')

  const useSample = !firebaseReady
  const scheduleSource = useMemo(() => {
    const byFakultas = (e) => {
      if (!e.fakultasId) return true
      if (!fakultasId) return true
      return String(e.fakultasId) === String(fakultasId)
    }
    if (loading) return []
    if (isCustomMode) {
      const pool = allPublishedJadwal.length > 0 ? allPublishedJadwal : sampleSchedule
      const customSet = new Set(customScheduleIds)
      return pool.filter((e) => customSet.has(e.id) && byFakultas(e))
    }
    if (jadwal.length > 0) return jadwal.filter(byFakultas)
    if (!useSample) return []
    return sampleSchedule.filter(
      (e) => e.prodi === program && e.semester === Number(semester),
    )
  }, [loading, isCustomMode, allPublishedJadwal, customScheduleIds, jadwal, useSample, program, semester, fakultasId])

  const courseMap = useMemo(() => {
    const source = mataKuliah.length > 0 ? mataKuliah : useSample ? sampleCourses : []
    return new Map(source.map((c) => [c.kodeMK, c]))
  }, [mataKuliah, useSample])

  const todayEntries = useMemo(
    () => sortByTime(scheduleSource.filter((e) => e.hari === todayName)),
    [scheduleSource, todayName],
  )

  const DAYS_LIST = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const todayIndex = new Date().getDay()
  const tomorrowName = DAYS_LIST[(todayIndex + 1) % 7]
  const tomorrowEntries = useMemo(
    () => sortByTime(scheduleSource.filter((e) => e.hari === tomorrowName)),
    [scheduleSource, tomorrowName],
  )

  const upcomingAgenda = useMemo(() => {
    const events = calDoc?.events || []
    if (!Array.isArray(events) || events.length === 0) return []
    const todayStr = new Date().toISOString().slice(0, 10)
    return events
      .filter((e) => (e.tanggalSelesai || e.tanggalMulai || '') >= todayStr)
      .sort((a, b) => (a.tanggalMulai || '').localeCompare(b.tanggalMulai || ''))
      .slice(0, 3)
  }, [calDoc])

  const [nowMinutes, setNowMinutes] = useState(() => currentMinuteOfDay())
  useEffect(() => {
    const id = setInterval(() => setNowMinutes(currentMinuteOfDay()), 15_000)
    return () => clearInterval(id)
  }, [])

  const liveClassState = useMemo(() => {
    return getClassLiveState(todayEntries, nowMinutes)
  }, [todayEntries, nowMinutes])

  const nextEntries = useMemo(() => {
    if (todayEntries.length === 0) return []
    const sorted = sortByTime(todayEntries)
    const idx = liveClassState.entry ? sorted.findIndex((e) => e.id === liveClassState.entry.id) : -1
    if (idx >= 0) return sorted.slice(idx + 1, idx + 4)
    if (liveClassState.status === 'finished' || liveClassState.status === 'empty') return []
    if (idx === -1 && sorted.length > 1) return sorted.slice(1, 4)
    return []
  }, [todayEntries, liveClassState])

  const displayedCount = todayEntries.length === 0 ? 0 : 1 + nextEntries.length
  const hasMoreToday = todayEntries.length > displayedCount
  const dataTA = expectedTA
  const activeEntry = liveClassState.entry
  const activeCourse = activeEntry ? courseMap.get(activeEntry.kodeMK) : null
  const countdownText =
    liveClassState.status === 'upcoming' && liveClassState.minutesToStart != null
      ? formatCountdown(liveClassState.minutesToStart)
      : null

  const [dailyNote, setDailyNote] = useState(() => getDailyNote())
  function handleNoteChange(value) {
    setDailyNote(value)
    saveDailyNote(value)
  }

  const stats = useMemo(() => {
    const sksByKode = new Map()
    scheduleSource.forEach((e) => {
      if (!sksByKode.has(e.kodeMK)) {
        const c = courseMap.get(e.kodeMK)
        sksByKode.set(e.kodeMK, Number(c?.sks) || 2)
      }
    })
    const totalSks = [...sksByKode.values()].reduce((sum, sks) => sum + sks, 0)
    const openTasks = tasks.filter((t) => !t.selesai).length
    return {
      totalSks,
      totalKelas: scheduleSource.length,
      tugasOpen: openTasks,
    }
  }, [scheduleSource, tasks, courseMap])

  const rawGreeting = getGreetingData()
  const greeting = useMemo(() => {
    if (language === 'en') {
      const lower = (rawGreeting.text || '').toLowerCase()
      let enText = 'Good Morning'
      if (lower.includes('siang')) enText = 'Good Afternoon'
      else if (lower.includes('sore')) enText = 'Good Evening'
      else if (lower.includes('malam')) enText = 'Good Night'
      return { ...rawGreeting, text: enText }
    }
    return rawGreeting
  }, [rawGreeting, language])

  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-x-hidden min-h-0 animate-fade-in">
      {/* 1. Header Banner Greeting & Summary */}
      <HomeGreetingHeader
        greeting={greeting}
        isCustomMode={isCustomMode}
        scheduleSource={scheduleSource}
        program={program}
        semester={semester}
        dataTA={dataTA}
        stats={stats}
        language={language}
        t={t}
        navigate={navigate}
      />

      {needsTaMigration && (
        <div className="rounded-2xl border border-status-gbk-border bg-status-gbk-bg px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-body-xs font-semibold text-status-gbk">
            {t ? t('home.sync_banner', { semester, ta: expectedTA }) : `Tahun ajaran berubah – jadwal semester ${semester} sekarang TA ${expectedTA}. Tap untuk sinkron.`}
          </p>
          <button
            type="button"
            onClick={() => {
              setItem(STORAGE_KEYS.tahunAjaran, expectedTA)
              window.location.reload()
            }}
            className="shrink-0 rounded-full bg-status-gbk text-white px-3 py-1 text-body-xs font-bold hover:opacity-90 cursor-pointer"
          >
            {t ? t('action.sync') : 'Sinkron'}
          </button>
        </div>
      )}

      {jadwalError && (
        <div role="status" className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-body-sm font-semibold text-error">
          Gagal memuat jadwal: {String(jadwalError.message || jadwalError.code || jadwalError)}
        </div>
      )}

      <AnnouncementBanner currentProgram={program} currentSemester={semester} />

      {/* 2. Grid Dashboard 2-Kolom Seimbang */}
      <div className="grid grid-cols-1 desktop:grid-cols-12 gap-4 desktop:items-stretch">
        {/* Kolom Kiri: Jadwal Kuliah Hari Ini */}
        <HomeTodaySection
          todayName={todayName}
          todayEntries={todayEntries}
          loading={loading}
          liveClassState={liveClassState}
          activeCourse={activeCourse}
          activeEntry={activeEntry}
          countdownText={countdownText}
          nextEntries={nextEntries}
          courseMap={courseMap}
          hasMoreToday={hasMoreToday}
          setRoomModalTarget={setRoomModalTarget}
          formatDay={formatDay}
          language={language}
          t={t}
          navigate={navigate}
        />

        {/* Kolom Kanan: 3 Widget Berwarna Harmonis */}
        <HomeSidebarSection
          dailyNote={dailyNote}
          handleNoteChange={handleNoteChange}
          tasks={tasks}
          tomorrowEntries={tomorrowEntries}
          tomorrowName={tomorrowName}
          upcomingAgenda={upcomingAgenda}
          courseMap={courseMap}
          formatDay={formatDay}
          language={language}
          t={t}
          navigate={navigate}
        />
      </div>

      {/* Modal Lokasi / Denah Ruang Kuliah */}
      <RoomLocationModal
        isOpen={Boolean(roomModalTarget)}
        onClose={() => setRoomModalTarget(null)}
        roomName={roomModalTarget?.entry?.ruang}
        courseName={roomModalTarget?.course?.namaMK || roomModalTarget?.entry?.kodeMK}
        classType={roomModalTarget?.entry?.tipeKelas}
      />
    </div>
  )
}
