import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../hooks/useApp'
import { useFirestore } from '../../hooks/useFirestore'
import { useTasks } from '../../hooks/useTasks'
import { Icon } from '../../components/Icon'
import { NextClassCard } from '../../components/NextClassCard'
import { ClassTimelineItem } from '../../components/ClassTimelineItem'
import { EmptyState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'
import { sampleSchedule, sampleCourses } from '../../data/sampleSchedule'
import { firebaseReady } from '../../lib/firebaseClient'
import {
  detectClassTransitions,
  formatCountdown,
  formatLongDate,
  getClassLiveState,
  getGreetingData,
  getTodayName,
  minutesUntil,
  sortByTime,
} from '../../lib/scheduleUtils'

import { expectedTahunAjaranForSemester } from '../../lib/tahunAjaran'
import { getItem, setItem, STORAGE_KEYS } from '../../lib/storage'
import { useCustomSchedule } from '../../hooks/useCustomSchedule'
import { AnnouncementBanner } from '../../components/student/AnnouncementBanner'
import { RoomLocationModal } from '../../components/student/RoomLocationModal'

export default function Home() {
  const navigate = useNavigate()
  const { program, semester } = useApp()
  const { tasks } = useTasks()
  const { isCustomMode, customScheduleIds } = useCustomSchedule()
  const todayName = getTodayName()
  const [roomModalTarget, setRoomModalTarget] = useState(null)

  const { data: jadwal, loading } = useFirestore('jadwal', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
    ['status', '==', 'published'],
  ])
  const { data: allPublishedJadwal } = useFirestore('jadwal', [
    ['status', '==', 'published'],
  ])
  const { data: mataKuliah } = useFirestore('mataKuliah')
  const { data: settingsDocs } = useFirestore('settings')

  const calDoc = useMemo(
    () => settingsDocs.find((d) => d.id === 'academicCalendar'),
    [settingsDocs],
  )

  // Fallback: kalau Firebase belum dikonfigurasi (dev tanpa .env),
  // pakai sample data supaya UI tetap bisa dites.
  const useSample = !firebaseReady
  const scheduleSource = useMemo(() => {
    if (loading) return []
    if (isCustomMode) {
      const pool = allPublishedJadwal.length > 0 ? allPublishedJadwal : sampleSchedule
      const customSet = new Set(customScheduleIds)
      return pool.filter((e) => customSet.has(e.id))
    }
    if (jadwal.length > 0) return jadwal
    if (!useSample) return []
    return sampleSchedule.filter(
      (e) => e.prodi === program && e.semester === Number(semester),
    )
  }, [loading, isCustomMode, allPublishedJadwal, customScheduleIds, jadwal, useSample, program, semester])

  const courseMap = useMemo(() => {
    const source = mataKuliah.length > 0 ? mataKuliah : useSample ? sampleCourses : []
    return new Map(source.map((c) => [c.kodeMK, c]))
  }, [mataKuliah, useSample])

  const todayEntries = useMemo(
    () => sortByTime(scheduleSource.filter((e) => e.hari === todayName)),
    [scheduleSource, todayName],
  )

  // Preview jadwal besok
  const DAYS_LIST = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const todayIndex = new Date().getDay()
  const tomorrowName = DAYS_LIST[(todayIndex + 1) % 7]
  const tomorrowEntries = useMemo(
    () => sortByTime(scheduleSource.filter((e) => e.hari === tomorrowName)),
    [scheduleSource, tomorrowName],
  )

  // Agenda / Libur terdekat dari kalender akademik
  const upcomingAgenda = useMemo(() => {
    if (!calDoc?.holidays || !Array.isArray(calDoc.holidays)) return []
    const todayStr = new Date().toISOString().slice(0, 10)
    return calDoc.holidays
      .filter((h) => (h.tanggalSelesai || h.tanggalMulai || '') >= todayStr)
      .sort((a, b) => (a.tanggalMulai || '').localeCompare(b.tanggalMulai || ''))
      .slice(0, 3)
  }, [calDoc])

  const [nowMinutes, setNowMinutes] = useState(() => currentMinuteOfDay())

  // Tick tiap 15 detik untuk update real-time status kelas live & countdown
  useEffect(() => {
    const id = setInterval(() => setNowMinutes(currentMinuteOfDay()), 15_000)
    return () => clearInterval(id)
  }, [])

  const liveClassState = useMemo(() => {
    return getClassLiveState(todayEntries, nowMinutes)
  }, [todayEntries, nowMinutes])

  const todayTransitions = useMemo(() => {
    return detectClassTransitions(todayEntries)
  }, [todayEntries])

  // TA ditampilkan = TA di mana semester berjalan berada (via logika
  // tahunAjaran), bukan dari data yang mungkin basi / beragam.
  const dataTA = expectedTahunAjaranForSemester(semester, new Date(), calDoc)

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
    const sksSet = new Set(scheduleSource.map((e) => e.kodeMK))
    const openTasks = tasks.filter((t) => !t.selesai).length
    return {
      totalSks: sksSet.size * 3,
      totalKelas: scheduleSource.length,
      tugasOpen: openTasks,
    }
  }, [scheduleSource, tasks])

  const greeting = getGreetingData()

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-full min-h-0 animate-fade-in">
      {/* ── TOP HERO ROW: Dynamic Gradient Greeting (Left) & Vibrant 3 Stats (Right) ── */}
      <header className={`rounded-3xl border border-outline-variant/25 ${greeting.headerBg} bg-surface-container-lowest p-3.5 tablet:p-4 shadow-xs dark:bg-surface-container-low flex flex-col desktop:flex-row desktop:items-center justify-between gap-3.5 shrink-0 backdrop-blur-xs`}>
        {/* Left: Greeting icon, Gradient Title, Prodi & TA Badge */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`flex h-11 w-11 tablet:h-12 tablet:w-12 shrink-0 items-center justify-center rounded-2xl ${greeting.iconBg} shadow-xs`}
            aria-hidden="true"
          >
            <Icon name={greeting.icon} size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`font-marker font-bold text-[22px] tablet:text-[26px] leading-tight tracking-wide bg-gradient-to-r ${greeting.textGradient} bg-clip-text text-transparent drop-shadow-xs whitespace-nowrap`}>
                {greeting.text}!
              </h2>
              {isCustomMode ? (
                <button
                  type="button"
                  onClick={() => navigate('/jadwal')}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-label-caps font-bold text-amber-900 dark:text-amber-300 shadow-2xs hover:bg-amber-500/25 transition-colors cursor-pointer"
                  title="Klik untuk melihat atau mengatur Jadwal Kustom"
                >
                  <Icon name="star" size={13} className="text-amber-500" />
                  <span>Jadwal Kustom ({scheduleSource.length} MK)</span>
                </button>
              ) : program ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 dark:bg-emerald-500/15 border border-primary/25 dark:border-emerald-500/30 px-3 py-0.5 text-label-caps font-bold text-primary dark:text-emerald-300 shadow-2xs">
                  <Icon name="school" size={13} className="text-primary dark:text-emerald-300 shrink-0" />
                  <span>{program} · Sem. {semester}{dataTA ? ` · TA ${dataTA}` : ''}</span>
                </span>
              ) : null}
            </div>
            <p className="text-body-xs font-medium text-on-surface-variant whitespace-nowrap mt-0.5">
              {formatLongDate()}
            </p>
          </div>
        </div>

        {/* Right: 3 Quick Stat Buttons (SKS, Kelas, Tugas) with Rich Gradients */}
        <div className="grid grid-cols-3 gap-2 w-full desktop:w-auto desktop:flex desktop:items-center shrink-0">
          <button
            type="button"
            onClick={() => navigate('/jadwal')}
            className="flex items-center justify-center desktop:justify-start gap-2 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/20 border border-emerald-500/35 px-3 py-1.5 text-center shadow-xs hover:scale-[1.03] active:scale-95 transition-all cursor-pointer group"
            title="Total SKS Semester Ini"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold group-hover:bg-emerald-500/30 transition-colors shrink-0">
              <Icon name="menu_book" size={16} />
            </span>
            <div className="text-left">
              <p className="text-body-sm font-bold text-emerald-950 dark:text-emerald-100 leading-none">{stats.totalSks}</p>
              <p className="text-[9.5px] font-bold text-emerald-800/90 dark:text-emerald-300 uppercase tracking-wide leading-none mt-0.5">SKS</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/jadwal')}
            className="flex items-center justify-center desktop:justify-start gap-2 rounded-2xl bg-gradient-to-br from-blue-500/15 via-blue-500/10 to-indigo-500/20 border border-blue-500/35 px-3 py-1.5 text-center shadow-xs hover:scale-[1.03] active:scale-95 transition-all cursor-pointer group"
            title="Total Sesi Kelas Mingguan"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold group-hover:bg-blue-500/30 transition-colors shrink-0">
              <Icon name="calendar_month" size={16} />
            </span>
            <div className="text-left">
              <p className="text-body-sm font-bold text-blue-950 dark:text-blue-100 leading-none">{stats.totalKelas}</p>
              <p className="text-[9.5px] font-bold text-blue-800/90 dark:text-blue-300 uppercase tracking-wide leading-none mt-0.5">Kelas</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/tugas')}
            className="flex items-center justify-center desktop:justify-start gap-2 rounded-2xl bg-gradient-to-br from-purple-500/15 via-purple-500/10 to-pink-500/20 border border-purple-500/35 px-3 py-1.5 text-center shadow-xs hover:scale-[1.03] active:scale-95 transition-all cursor-pointer group"
            title="Tugas Tertunda"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold group-hover:bg-purple-500/30 transition-colors shrink-0">
              <Icon name="assignment_late" size={16} />
            </span>
            <div className="text-left">
              <p className="text-body-sm font-bold text-purple-950 dark:text-purple-100 leading-none">{stats.tugasOpen}</p>
              <p className="text-[9.5px] font-bold text-purple-800/90 dark:text-purple-300 uppercase tracking-wide leading-none mt-0.5">Tugas</p>
            </div>
          </button>
        </div>
      </header>

      {/* Broadcast Pengumuman Kampus & Kuliah Pengganti */}
      <AnnouncementBanner currentProgram={program} currentSemester={semester} />

      {/* ── MAIN SECTION: 2 EQUAL-HEIGHT COLUMNS ON DESKTOP ── */}
      <div className="grid grid-cols-1 desktop:grid-cols-12 gap-3.5 desktop:items-stretch">
        {/* ── LEFT COLUMN (7 COLS): JADWAL KULIAH CARD (Today's Timeline + Tomorrow Footer) ── */}
        <section className="desktop:col-span-7 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 tablet:p-5 shadow-xs dark:bg-surface-container-low flex flex-col justify-between min-h-[460px] tablet:min-h-[480px]">
          <div>
            {/* Header: Title + Session count */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                  <Icon name="event_available" size={18} />
                </span>
                <h3 className="text-body-sm tablet:text-body-md font-bold text-on-surface truncate">
                  Jadwal Kuliah Hari Ini — <span className="text-primary">{todayName}</span>
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 shrink-0">
                {todayEntries.length} Sesi
              </span>
            </div>

            {/* Status Kelas Live / Kelas Berikutnya / Selesai Hari Ini Callout */}
            {liveClassState.status !== 'empty' && (
              <div className="mb-3">
                <NextClassCard
                  liveState={liveClassState}
                  course={activeCourse}
                  countdownText={countdownText}
                  urgent={liveClassState.urgent}
                  onDetail={() =>
                    activeEntry &&
                    navigate('/jadwal', { state: { openKodeMK: activeEntry.kodeMK } })
                  }
                  onLocation={(entry, course) => setRoomModalTarget({ entry, course })}
                  onViewSchedule={() => navigate('/jadwal')}
                />
              </div>
            )}

            {/* Timeline List */}
            {loading ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            ) : todayEntries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8">
                <EmptyState
                  icon="beach_access"
                  title="Tidak ada perkuliahan hari ini"
                  description="Nikmati harimu atau cek materi untuk perkuliahan besok."
                />
              </div>
            ) : (
              <div className="relative pl-6 py-1">
                <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-outline-variant/30" />
                {todayEntries.map((entry, i) => {
                  const startM = minutesUntil(entry.jamMulai)
                  const prevEnded = i === 0 || minutesUntil(todayEntries[i - 1].jamSelesai) <= 0
                  const showNow = startM > 0 && prevEnded
                  return (
                    <ClassTimelineItem
                      key={entry.id}
                      entry={entry}
                      course={courseMap.get(entry.kodeMK)}
                      index={i}
                      isPast={minutesUntil(entry.jamSelesai) <= 0}
                      showNowBefore={showNow}
                      nowLabel={`${String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:${String(nowMinutes % 60).padStart(2, '0')}`}
                      note={getItem(`${STORAGE_KEYS.courseNotes}:${entry.kodeMK}`, '')}
                      transition={todayTransitions.get(entry.id)}
                      links={getItem(`${STORAGE_KEYS.courseLinks}:${entry.kodeMK}`, null)}
                      onLocationClick={(entry, course) => setRoomModalTarget({ entry, course })}
                      onNoteClick={() => navigate('/jadwal', { state: { openKodeMK: entry.kodeMK } })}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer Sub-Bar: Clean navigation to weekly schedule */}
          <div className="pt-2.5 mt-3 border-t border-outline-variant/15 flex items-center justify-between gap-2 flex-wrap text-body-xs bg-surface-container-low/50 dark:bg-surface-container-high/30 p-2.5 rounded-2xl border border-outline-variant/15">
            <div className="flex items-center gap-2 text-on-surface font-semibold min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon name="calendar_month" size={15} />
              </span>
              <span className="truncate text-body-xs text-on-surface-variant font-medium">
                {todayEntries.length > 0
                  ? <span>{todayEntries.length} sesi perkuliahan aktif hari ini ({todayName})</span>
                  : <span>Tidak ada sesi perkuliahan aktif hari ini ({todayName})</span>}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/jadwal')}
              className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
            >
              <span>Jadwal Mingguan Lengkap</span>
              <Icon name="arrow_forward" size={14} />
            </button>
          </div>
        </section>

        {/* ── RIGHT COLUMN (5 COLS): CATATAN, COMPACT TUGAS & JADWAL BESOK ── */}
        <aside className="desktop:col-span-5 flex flex-col justify-between gap-3 min-h-[460px] tablet:min-h-[480px]">
          {/* 1. Catatan Hari Ini — Warm Accent Sticky Note */}
          <section className="rounded-3xl bg-gradient-to-br from-amber-500/15 via-[#FFF4E5] to-amber-500/10 dark:from-amber-950/30 dark:via-warning-container/20 dark:to-amber-900/15 border-l-4 border-amber-500 p-3 tablet:p-3.5 shadow-xs flex flex-col border-t border-r border-b border-amber-500/20">
            <h3 className="mb-1 flex items-center gap-2 text-body-sm font-bold text-[#92400E] dark:text-warning">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/20 text-[#D97706]">
                <Icon name="edit_note" size={15} />
              </span>
              <span>Catatan Hari Ini</span>
            </h3>
            <textarea
              value={dailyNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Tulis catatan cepat untuk hari ini..."
              className="h-12 w-full resize-none bg-transparent p-0 text-body-xs text-[#92400E] dark:text-warning placeholder:text-[#92400E]/60 dark:placeholder:text-warning/60 focus:outline-none"
            />
          </section>

          {/* 2. Tugas Terdekat (Kotak Ringkas / Compact) */}
          <section className="rounded-3xl bg-surface-container-lowest p-3 tablet:p-3.5 shadow-xs border border-outline-variant/20 dark:bg-surface-container-low flex flex-col">
            <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant/15 mb-2">
              <h3 className="flex items-center gap-1.5 text-body-sm font-bold text-on-surface">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-300">
                  <Icon name="checklist" size={14} />
                </span>
                <span>Tugas Terdekat</span>
              </h3>
              <button
                type="button"
                onClick={() => navigate('/tugas')}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            {tasks.filter((t) => !t.selesai).length === 0 ? (
              <div className="py-1 flex items-center justify-between text-body-xs text-on-surface-variant font-medium">
                <span>Tidak ada tugas tertunda saat ini 🎉</span>
                <button
                  type="button"
                  onClick={() => navigate('/tugas')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[10.5px] font-bold transition-colors cursor-pointer"
                >
                  <Icon name="add" size={13} />
                  <span>+ Tugas</span>
                </button>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {tasks
                  .filter((t) => !t.selesai)
                  .slice(0, 2)
                  .map((t) => (
                    <li
                      key={t.id}
                      onClick={() => navigate('/tugas')}
                      className="flex items-center justify-between p-2 rounded-2xl bg-surface-container-low/70 hover:bg-surface-container-high cursor-pointer transition-colors border border-outline-variant/15 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate text-body-xs font-bold text-on-surface">{t.judul}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">
                          {t.kodeMK ? `${t.kodeMK} • ` : ''}{t.deadline}
                        </p>
                      </div>
                      <span className="shrink-0 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                        {t.prioritas}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {/* 3. Jadwal Besok (Pengganti Pintasan Cepat) */}
          <section className="rounded-3xl bg-surface-container-lowest p-3.5 tablet:p-4 shadow-xs border border-outline-variant/20 dark:bg-surface-container-low flex flex-col flex-1 justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-300">
                    <Icon name="next_plan" size={16} />
                  </span>
                  <h3 className="text-body-sm font-bold text-on-surface">
                    Jadwal Besok — <span className="text-blue-600 dark:text-blue-400">{tomorrowName}</span>
                  </h3>
                </div>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                  {tomorrowEntries.length} Sesi
                </span>
              </div>

              {tomorrowEntries.length === 0 ? (
                <div className="py-4 text-center text-body-xs text-on-surface-variant font-medium space-y-1">
                  <Icon name="beach_access" size={24} className="mx-auto text-emerald-500" />
                  <p>Tidak ada perkuliahan untuk hari besok ({tomorrowName}).</p>
                  <p className="text-[11px] text-on-surface-variant/80">Waktu yang baik untuk mengerjakan tugas & istirahat.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tomorrowEntries.slice(0, 2).map((item) => {
                    const course = courseMap.get(item.kodeMK)
                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate('/jadwal', { state: { openKodeMK: item.kodeMK } })}
                        className="p-2.5 rounded-2xl bg-surface-container-low/60 hover:bg-surface-container-high/80 border border-outline-variant/20 transition-all cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="inline-flex items-center rounded-lg bg-teal-500/15 text-teal-900 dark:bg-teal-400/20 dark:text-teal-200 px-2 py-0.5 font-mono text-[11px] font-extrabold tracking-wider border border-teal-500/30 dark:border-teal-400/40 shadow-2xs">
                            {item.kodeMK}
                          </span>
                          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                            <Icon name="schedule" size={12} className="text-on-surface-variant/70" />
                            {item.jamMulai} - {item.jamSelesai}
                          </span>
                        </div>
                        <p className="text-body-xs font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                          {course?.namaMK || item.kodeMK}
                        </p>
                        <div className="flex items-center justify-between text-[10.5px] text-on-surface-variant/80 mt-1 font-medium">
                          <span className="truncate max-w-[150px]">{course?.dosen || 'Dosen Pengampu'}</span>
                          <span className="truncate text-emerald-700 dark:text-emerald-300 font-semibold">{item.ruang || 'Online'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Agenda/Holiday Micro-Snippet at the bottom of Tomorrow Schedule */}
            {upcomingAgenda.length > 0 && (
              <div className="mt-2 pt-2 border-t border-outline-variant/15 flex items-center gap-2 text-[11px] text-on-surface-variant font-medium truncate">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary/15 text-secondary">
                  <Icon name="celebration" size={13} />
                </span>
                <span className="truncate">
                  Agenda Terdekat: <strong className="text-on-surface font-bold">{upcomingAgenda[0].nama}</strong> ({upcomingAgenda[0].tanggalMulai})
                </span>
              </div>
            )}
          </section>
        </aside>
      </div>

      {roomModalTarget && (
        <RoomLocationModal
          isOpen={Boolean(roomModalTarget)}
          onClose={() => setRoomModalTarget(null)}
          ruang={roomModalTarget.entry?.ruang}
          tipeKelas={roomModalTarget.entry?.tipeKelas}
          scheduleEntries={todayEntries}
          currentCourseName={roomModalTarget.course?.namaMK ?? roomModalTarget.entry?.kodeMK}
        />
      )}
    </div>
  )
}

function currentMinuteOfDay() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function dailyNoteKey() {
  const d = new Date()
  // Kunci memakai tanggal LOKAL (WIB), bukan UTC — kalau pakai UTC,
  // catatan "hari ini" baru berganti pada jam 07:00, bukan tengah malam.
  const localIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
  return `${STORAGE_KEYS.dailyNotes}:${localIso}`
}

function getDailyNote() {
  return getItem(dailyNoteKey(), '')
}

function saveDailyNote(value) {
  setItem(dailyNoteKey(), value)
}
